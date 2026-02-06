import { useState, useEffect } from 'react';
import { useAuth } from '@/App';
import { pushNotificationService } from '@/services/pushNotificationService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ModernButton } from '@/components/modern';
import { Bell, BellOff, ShoppingCart, Shield, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationPreferences({ open, onOpenChange }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    sales_alerts: true,
    loyalty_alerts: true,
    lead_alerts: true,
    push_enabled: false
  });
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user?.id) {
      loadPreferences();
      setPermissionStatus(pushNotificationService.getPermissionStatus());
    }
  }, [open, user?.id]);

  const loadPreferences = async () => {
    try {
      const prefs = await pushNotificationService.getPreferences(user.id);
      if (prefs) {
        setPreferences({
          sales_alerts: prefs.sales_alerts,
          loyalty_alerts: prefs.loyalty_alerts,
          lead_alerts: prefs.lead_alerts,
          push_enabled: prefs.push_enabled
        });
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
    }
  };

  const handleToggle = async (key, value) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);

    try {
      await pushNotificationService.upsertPreferences(user.id, updated);
    } catch (err) {
      console.error('Error saving preference:', err);
      setPreferences(prev => ({ ...prev, [key]: !value }));
      toast.error('Erro ao guardar preferencia');
    }
  };

  const handleEnablePush = async () => {
    setLoading(true);
    try {
      const permission = await pushNotificationService.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        await handleToggle('push_enabled', true);
        toast.success('Notificacoes ativadas');
      } else if (permission === 'denied') {
        toast.error('Notificacoes bloqueadas no browser. Altere nas definicoes do browser.');
      }
    } catch (err) {
      console.error('Error enabling push:', err);
      toast.error('Erro ao ativar notificacoes');
    } finally {
      setLoading(false);
    }
  };

  const handleDisablePush = async () => {
    await handleToggle('push_enabled', false);
    toast.success('Notificacoes desativadas');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Bell size={20} className="text-brand-600" />
            Preferencias de Notificacoes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-700">Notificacoes do Browser</span>
              {permissionStatus === 'unsupported' && (
                <span className="text-xs text-red-500">Nao suportado</span>
              )}
            </div>

            {permissionStatus === 'denied' ? (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <BellOff size={16} />
                <span>Bloqueadas. Altere nas definicoes do browser.</span>
              </div>
            ) : preferences.push_enabled && permissionStatus === 'granted' ? (
              <ModernButton
                variant="secondary"
                size="sm"
                onClick={handleDisablePush}
                className="w-full"
              >
                Desativar Notificacoes
              </ModernButton>
            ) : permissionStatus !== 'unsupported' ? (
              <ModernButton
                variant="primary"
                size="sm"
                onClick={handleEnablePush}
                loading={loading}
                icon={Bell}
                className="w-full"
              >
                Ativar Notificacoes
              </ModernButton>
            ) : null}
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-700">Tipos de Notificacao</h4>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <ShoppingCart size={16} className="text-blue-600" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-800">Alertas de Vendas</Label>
                  <p className="text-xs text-slate-500 mt-0.5">Novas vendas e alteracoes de estado</p>
                </div>
              </div>
              <Switch
                checked={preferences.sales_alerts}
                onCheckedChange={(v) => handleToggle('sales_alerts', v)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-50">
                  <Shield size={16} className="text-orange-600" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-800">Alertas de Fidelizacao</Label>
                  <p className="text-xs text-slate-500 mt-0.5">Notificacao diaria nos ultimos 4 dias</p>
                </div>
              </div>
              <Switch
                checked={preferences.loyalty_alerts}
                onCheckedChange={(v) => handleToggle('loyalty_alerts', v)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50">
                  <ClipboardList size={16} className="text-green-600" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-800">Alertas de Leads</Label>
                  <p className="text-xs text-slate-500 mt-0.5">Leads com data de alerta proxima</p>
                </div>
              </div>
              <Switch
                checked={preferences.lead_alerts}
                onCheckedChange={(v) => handleToggle('lead_alerts', v)}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
