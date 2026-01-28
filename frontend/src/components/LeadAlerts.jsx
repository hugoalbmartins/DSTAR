import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernCard, ModernButton, ModernBadge, ModernTable } from './modern';
import { leadsService } from '../services/leadsService';
import { AlertTriangle, ArrowRight, Loader2, Search, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';

export default function LeadAlerts() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLeads, setFilteredLeads] = useState([]);

  useEffect(() => {
    loadLeadAlerts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const filtered = leads.filter(lead =>
        lead.client?.name?.toLowerCase().includes(term) ||
        lead.client?.nif?.includes(term) ||
        lead.sale_type?.toLowerCase().includes(term)
      );
      setFilteredLeads(filtered);
    } else {
      setFilteredLeads(leads);
    }
  }, [searchTerm, leads]);

  const loadLeadAlerts = async () => {
    try {
      setLoading(true);
      const data = await leadsService.getLeadAlerts(1);
      setLeads(data);
      setFilteredLeads(data);
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
    <>
      <ModernCard
        title={`Alertas de Leads (${leads.length})`}
        icon={AlertTriangle}
        variant="gradient"
        hover={false}
        headerAction={
          leads.length > 5 && (
            <ModernButton
              variant="ghost"
              size="sm"
              onClick={() => setShowModal(true)}
              icon={ArrowRight}
            >
              Ver Todas
            </ModernButton>
          )
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

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Todos os Alertas de Leads ({filteredLeads.length})
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Pesquisar por nome, NIF ou tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {filteredLeads.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p>Nenhuma lead encontrada</p>
              </div>
            ) : (
              <ModernTable
                columns={[
                  {
                    key: 'client',
                    label: 'Cliente',
                    sortable: false,
                    render: (_, row) => (
                      <div>
                        <p className="font-medium text-slate-900">{row.client?.name}</p>
                        <p className="text-sm text-slate-500">{row.client?.nif}</p>
                      </div>
                    )
                  },
                  {
                    key: 'sale_type',
                    label: 'Tipo',
                    sortable: true,
                    render: (value) => <ModernBadge variant="default">{value}</ModernBadge>
                  },
                  {
                    key: 'alert_date',
                    label: 'Data de Alerta',
                    sortable: true,
                    render: (value) => {
                      const alertInfo = getDaysUntilAlert(value);
                      return (
                        <div>
                          <p className="text-sm text-slate-700">{value ? new Date(value).toLocaleDateString('pt-PT') : '-'}</p>
                          <span className={`text-xs font-semibold ${alertInfo.isPast ? 'text-red-600' : alertInfo.days <= 3 ? 'text-orange-600' : 'text-slate-600'}`}>
                            {alertInfo.label}
                          </span>
                        </div>
                      );
                    }
                  },
                  {
                    key: 'user',
                    label: 'Vendedor',
                    sortable: false,
                    render: (value) => <span className="text-slate-700 text-sm">{value?.name || '-'}</span>
                  }
                ]}
                data={filteredLeads}
                sortable={true}
                hoverable={true}
                itemsPerPage={15}
                showPagination={true}
                onRowClick={(row) => {
                  setShowModal(false);
                  navigate(`/leads/${row.id}/edit`);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
