import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernCard, ModernButton, ModernBadge, ModernTable } from '../components/modern';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { leadsService } from '../services/leadsService';
import { Plus, Search, Loader2, Edit, Trash2, FileText } from 'lucide-react';

const STATUS_MAP = {
  nova: { label: 'Nova', variant: 'info' },
  em_contacto: { label: 'Em Contacto', variant: 'warning' },
  qualificada: { label: 'Qualificada', variant: 'success' },
  convertida: { label: 'Convertida', variant: 'default' },
  perdida: { label: 'Perdida', variant: 'danger' }
};

export default function Leads() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [saleTypeFilter, setSaleTypeFilter] = useState('all');

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [searchTerm, statusFilter, saleTypeFilter, leads]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await leadsService.getAllLeads();
      setLeads(data);
      setFilteredLeads(data);
    } catch (error) {
      console.error('Error loading leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.client?.name?.toLowerCase().includes(term) ||
        lead.client?.nif?.includes(term) ||
        lead.observations?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    if (saleTypeFilter !== 'all') {
      filtered = filtered.filter(lead => lead.sale_type === saleTypeFilter);
    }

    setFilteredLeads(filtered);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja eliminar esta lead?')) {
      return;
    }

    try {
      await leadsService.deleteLead(id);
      toast.success('Lead eliminada com sucesso');
      loadLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Erro ao eliminar lead');
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-PT');
  };

  const getStatusBadge = (status) => {
    const statusInfo = STATUS_MAP[status] || { label: status, variant: 'default' };
    return <ModernBadge variant={statusInfo.variant}>{statusInfo.label}</ModernBadge>;
  };

  const getDaysUntilAlert = (alertDate) => {
    if (!alertDate) return null;
    const today = new Date();
    const alert = new Date(alertDate);
    const diffTime = alert - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="text-red-600 font-semibold">{Math.abs(diffDays)} dias atrás</span>;
    } else if (diffDays === 0) {
      return <span className="text-orange-600 font-semibold">Hoje</span>;
    } else if (diffDays <= 7) {
      return <span className="text-yellow-600 font-semibold">Em {diffDays} dias</span>;
    }
    return <span className="text-gray-600">Em {diffDays} dias</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-brand-700 bg-clip-text text-transparent">
            Leads
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Total de {leads.length} lead{leads.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ModernButton onClick={() => navigate('/leads/new')} variant="primary" icon={Plus}>
          Nova Lead
        </ModernButton>
      </div>

      <ModernCard title="Gestão de Leads" icon={FileText} variant="gradient">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Pesquisar por nome, NIF ou observações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                <SelectItem value="nova">Nova</SelectItem>
                <SelectItem value="em_contacto">Em Contacto</SelectItem>
                <SelectItem value="qualificada">Qualificada</SelectItem>
                <SelectItem value="convertida">Convertida</SelectItem>
                <SelectItem value="perdida">Perdida</SelectItem>
              </SelectContent>
            </Select>
            <Select value={saleTypeFilter} onValueChange={setSaleTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="NI">NI</SelectItem>
                <SelectItem value="MC">MC</SelectItem>
                <SelectItem value="Refid">Refid</SelectItem>
                <SelectItem value="Up_sell">Up-sell</SelectItem>
                <SelectItem value="Cross_sell">Cross-sell</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              {searchTerm || statusFilter !== 'all' || saleTypeFilter !== 'all' ? (
                <>
                  <p className="text-slate-500 mb-4">Nenhuma lead encontrada com os filtros aplicados</p>
                  <ModernButton
                    variant="secondary"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setSaleTypeFilter('all');
                    }}
                  >
                    Limpar Filtros
                  </ModernButton>
                </>
              ) : (
                <>
                  <p className="text-slate-500 mb-4">Ainda não existem leads registadas</p>
                  <ModernButton onClick={() => navigate('/leads/new')} variant="primary" icon={Plus}>
                    Criar Primeira Lead
                  </ModernButton>
                </>
              )}
            </div>
          ) : (
            <ModernTable
              headers={['Cliente', 'Tipo de Venda', 'Data de Alerta', 'Estado', 'Vendedor', 'Observações', '']}
              data={filteredLeads.map((lead) => ({
                id: lead.id,
                cells: [
                  <div key="client">
                    <p className="font-medium text-slate-900">{lead.client?.name}</p>
                    <p className="text-sm text-slate-500">{lead.client?.nif}</p>
                  </div>,
                  <ModernBadge key="type" variant="default">{lead.sale_type}</ModernBadge>,
                  <div key="alert">
                    <p>{formatDate(lead.alert_date)}</p>
                    <p className="text-sm">{getDaysUntilAlert(lead.alert_date)}</p>
                  </div>,
                  getStatusBadge(lead.status),
                  <span key="seller" className="text-slate-700">{lead.user?.name || '-'}</span>,
                  <p key="obs" className="max-w-xs truncate text-slate-600">{lead.observations || '-'}</p>,
                  <div key="actions" className="flex gap-2">
                    <ModernButton
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/leads/${lead.id}/edit`)}
                      icon={Edit}
                    />
                    <ModernButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(lead.id)}
                      icon={Trash2}
                      className="text-red-600 hover:text-red-700"
                    />
                  </div>
                ]
              }))}
            />
          )}
        </div>
      </ModernCard>
    </div>
  );
}
