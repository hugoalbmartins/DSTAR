import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernCard, ModernButton, ModernBadge } from './modern';
import { leadsService } from '../services/leadsService';
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

export default function LeadAlerts() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeadAlerts();
  }, []);

  const loadLeadAlerts = async () => {
    try {
      setLoading(true);
      const data = await leadsService.getLeadAlerts(1);
      setLeads(data);
    } catch (error) {
      console.error('Error loading lead alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilAlert = (alertDate) => {
    if (!alertDate) return { days: 0, label: '-', isPast: false };
    const today = new Date();
    const alert = new Date(alertDate);
    const diffTime = alert - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { days: Math.abs(diffDays), label: `${Math.abs(diffDays)} dias atrás`, isPast: true };
    } else if (diffDays === 0) {
      return { days: 0, label: 'Hoje', isPast: false };
    }
    return { days: diffDays, label: `${diffDays} dias`, isPast: false };
  };

  if (loading) {
    return (
      <ModernCard
        title="Alertas de Leads"
        icon={AlertTriangle}
        variant="gradient"
        hover={false}
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      </ModernCard>
    );
  }

  if (leads.length === 0) {
    return (
      <ModernCard
        title="Alertas de Leads"
        icon={AlertTriangle}
        variant="gradient"
        hover={false}
      >
        <p className="text-sm text-slate-500">Não há leads com alertas para amanhã</p>
      </ModernCard>
    );
  }

  return (
    <ModernCard
      title={`Alertas de Leads (${leads.length})`}
      icon={AlertTriangle}
      variant="gradient"
      hover={false}
      headerAction={
        <ModernButton
          variant="ghost"
          size="sm"
          onClick={() => navigate('/leads')}
          icon={ArrowRight}
        >
          Ver Todas
        </ModernButton>
      }
    >
      <div className="space-y-3">
        {leads.slice(0, 5).map((lead) => {
          const alertInfo = getDaysUntilAlert(lead.alert_date);
          return (
            <div
              key={lead.id}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 cursor-pointer transition-all duration-200 hover:shadow-md border border-slate-100"
              onClick={() => navigate(`/leads/${lead.id}/edit`)}
            >
              <div className="flex-1">
                <p className="font-semibold text-sm text-slate-900">{lead.client?.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <ModernBadge variant="default">{lead.sale_type}</ModernBadge>
                  <span className={`text-xs font-semibold ${alertInfo.isPast ? 'text-red-600' : alertInfo.days <= 3 ? 'text-orange-600' : 'text-slate-600'}`}>
                    {alertInfo.label}
                  </span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </div>
          );
        })}
      </div>
    </ModernCard>
  );
}
