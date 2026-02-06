import { useState, useEffect } from 'react';
import { useAuth } from '@/App';
import { backupService } from '@/services/backupService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ModernButton } from '@/components/modern';
import { AlertTriangle, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BackupAlert() {
  const { user } = useAuth();
  const [showAlert, setShowAlert] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      checkBackupNeeded();
    }
  }, [user?.id]);

  const checkBackupNeeded = async () => {
    try {
      const needed = await backupService.needsBackupAlert();
      if (needed) {
        setShowAlert(true);
      }
    } catch (err) {
      console.error('Error checking backup:', err);
    }
  };

  const handleBackup = async () => {
    setExporting(true);
    try {
      const result = await backupService.exportSalesToExcel(user.id);
      toast.success(`Backup concluido: ${result.recordCount} vendas exportadas`);
      setShowAlert(false);
    } catch (err) {
      console.error('Error exporting:', err);
      toast.error('Erro ao exportar vendas');
    } finally {
      setExporting(false);
    }
  };

  const handleDismiss = () => {
    backupService.dismissAlert();
    setShowAlert(false);
  };

  return (
    <Dialog open={showAlert} onOpenChange={handleDismiss}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-500" />
            Backup de Vendas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
            <p className="text-sm text-orange-800 font-medium">
              Nao foi efetuado um backup de vendas nos ultimos 3 dias.
            </p>
            <p className="text-sm text-orange-700 mt-2">
              E importante manter backups regulares para proteger os dados de vendas.
              Recomendamos efetuar um backup agora.
            </p>
          </div>

          <div className="flex gap-3">
            <ModernButton
              variant="primary"
              icon={exporting ? Loader2 : Download}
              onClick={handleBackup}
              disabled={exporting}
              className="flex-1"
            >
              {exporting ? 'A exportar...' : 'Backup Agora'}
            </ModernButton>
            <ModernButton
              variant="secondary"
              onClick={handleDismiss}
            >
              Mais Tarde
            </ModernButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
