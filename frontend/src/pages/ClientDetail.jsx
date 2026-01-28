import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ModernCard, ModernButton, ModernBadge, ModernTable } from '../components/modern';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { clientsService } from '../services/clientsService';
import { servicesService } from '../services/servicesService';
import { ArrowLeft, Edit, Plus, Loader2, User, Mail, Phone, CreditCard, Building2, MapPin, Zap, FileText, Activity } from 'lucide-react';

export default function ClientDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [sales, setSales] = useState([]);
  const [services, setServices] = useState([]);
  const [activeTab, setActiveTab] = useState('sales');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientData, salesData, servicesData] = await Promise.all([
        clientsService.getClientById(id),
        clientsService.getClientSales(id),
        servicesService.getServicesByClientId(id)
      ]);

      setClient(clientData);
      setSales(salesData || []);
      setServices(servicesData || []);
    } catch (error) {
      console.error('Error loading client data:', error);
      toast.error('Erro ao carregar dados do cliente');
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'em_negociacao': { label: 'Em Negociação', variant: 'warning' },
      'pendente': { label: 'Pendente', variant: 'warning' },
      'ativo': { label: 'Ativo', variant: 'success' },
      'perdido': { label: 'Perdido', variant: 'danger' },
      'anulado': { label: 'Anulado', variant: 'default' }
    };

    const config = statusConfig[status] || { label: status, variant: 'default' };
    return <ModernBadge variant={config.variant}>{config.label}</ModernBadge>;
  };

  const getServiceTypeBadge = (type) => {
    const typeConfig = {
      'energia_eletricidade': { label: 'Eletricidade', variant: 'warning' },
      'energia_gas': { label: 'Gás', variant: 'info' },
      'energia_dual': { label: 'Dual', variant: 'info' },
      'telecomunicacoes': { label: 'Telecomunicações', variant: 'success' },
      'paineis_solares': { label: 'Painéis Solares', variant: 'warning' }
    };

    const config = typeConfig[type] || { label: type, variant: 'default' };
    return <ModernBadge variant={config.variant}>{config.label}</ModernBadge>;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-PT');
  };

  const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <p className="text-slate-600">Cliente não encontrado</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <ModernButton
            variant="ghost"
            onClick={() => navigate('/clients')}
            icon={ArrowLeft}
          >
            Voltar
          </ModernButton>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-brand-700 bg-clip-text text-transparent">
              {client.name}
            </h1>
            <div className="flex gap-2 mt-2">
              <ModernBadge variant="info">
                {client.client_type === 'residencial' ? 'Residencial' : 'Empresarial'}
              </ModernBadge>
              {client.portfolio_status && (
                <ModernBadge variant="default">
                  {client.portfolio_status === 'novo' && 'Novo'}
                  {client.portfolio_status === 'cliente_carteira' && 'Cliente de Carteira'}
                  {client.portfolio_status === 'fora_carteira' && 'Fora de Carteira'}
                </ModernBadge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <ModernButton variant="secondary" onClick={() => navigate(`/leads/new?clientId=${id}`)} icon={Plus}>
            Nova Lead
          </ModernButton>
          <ModernButton variant="secondary" onClick={() => navigate(`/sales/new?clientId=${id}`)} icon={Plus}>
            Nova Venda
          </ModernButton>
          <ModernButton onClick={() => navigate(`/clients/${id}/edit`)} icon={Edit}>
            Editar
          </ModernButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ModernCard variant="glass" hover={false}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-100 rounded-xl">
              <CreditCard className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">NIF</p>
              <p className="text-lg font-bold text-slate-900">{client.nif}</p>
            </div>
          </div>
        </ModernCard>

        <ModernCard variant="glass" hover={false}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-100 rounded-xl">
              <Mail className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Email</p>
              <p className="text-lg font-bold text-slate-900">{client.email || '-'}</p>
            </div>
          </div>
        </ModernCard>

        <ModernCard variant="glass" hover={false}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-100 rounded-xl">
              <Phone className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Telefone</p>
              <p className="text-lg font-bold text-slate-900">{client.phone || '-'}</p>
            </div>
          </div>
        </ModernCard>
      </div>

      <ModernCard variant="gradient" hover={false}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sales">
              <FileText className="mr-2 h-4 w-4" />
              Vendas ({sales.length})
            </TabsTrigger>
            <TabsTrigger value="services">
              <Activity className="mr-2 h-4 w-4" />
              Serviços ({services.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="mt-6">
            {sales.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600 mb-4">Ainda não existem vendas para este cliente</p>
                <ModernButton onClick={() => navigate(`/sales/new?clientId=${id}`)} icon={Plus}>
                  Criar Primeira Venda
                </ModernButton>
              </div>
            ) : (
              <ModernTable
                columns={[
                  { header: 'Data', accessor: 'created_at' },
                  { header: 'Operadora', accessor: 'operator.name' },
                  { header: 'Tipo', accessor: 'sale_type' },
                  { header: 'Valor', accessor: 'contract_value' },
                  { header: 'Estado', accessor: 'status' },
                  { header: 'Vendedor', accessor: 'seller.name' },
                  { header: '', accessor: 'actions' }
                ]}
                data={sales.map(sale => ({
                  ...sale,
                  created_at: formatDate(sale.created_at),
                  'operator.name': sale.operator?.name || '-',
                  sale_type: <ModernBadge variant="info">{sale.sale_type}</ModernBadge>,
                  contract_value: formatCurrency(sale.contract_value),
                  status: getStatusBadge(sale.status),
                  'seller.name': sale.seller?.name || '-',
                  actions: (
                    <ModernButton
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/sales/${sale.id}`)}
                    >
                      Ver Detalhes
                    </ModernButton>
                  )
                }))}
              />
            )}
          </TabsContent>

          <TabsContent value="services" className="mt-6">
            {services.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600">Ainda não existem serviços registados para este cliente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((service) => (
                  <ModernCard key={service.id} variant="glass" hover={true}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-100 rounded-lg">
                          <Zap className="h-5 w-5 text-brand-600" />
                        </div>
                        <div>
                          <p className="font-bold text-lg text-slate-900">
                            {service.service_number || 'Sem número de serviço'}
                          </p>
                          {getServiceTypeBadge(service.service_type)}
                        </div>
                      </div>
                      <ModernBadge variant={service.is_active ? 'success' : 'default'}>
                        {service.is_active ? 'Ativo' : 'Inativo'}
                      </ModernBadge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-slate-500 mt-1" />
                        <div>
                          <p className="text-sm text-slate-600">Morada</p>
                          <p className="text-sm text-slate-900">
                            {service.address?.street_address}<br />
                            {service.address?.postal_code} {service.address?.city}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Building2 className="h-4 w-4 text-slate-500 mt-1" />
                        <div>
                          <p className="text-sm text-slate-600">Operadora</p>
                          <p className="text-sm text-slate-900">{service.operator?.name || '-'}</p>
                        </div>
                      </div>

                      {service.cpe && (
                        <div>
                          <p className="text-sm text-slate-600">CPE</p>
                          <p className="text-sm font-mono text-slate-900">{service.cpe}</p>
                        </div>
                      )}

                      {service.cui && (
                        <div>
                          <p className="text-sm text-slate-600">CUI</p>
                          <p className="text-sm font-mono text-slate-900">{service.cui}</p>
                            </div>
                          )}

                      {service.req && (
                        <div>
                          <p className="text-sm text-slate-600">REQ</p>
                          <p className="text-sm font-mono text-slate-900">{service.req}</p>
                        </div>
                      )}

                      {service.loyalty_end_date && (
                        <div>
                          <p className="text-sm text-slate-600">Fim de Fidelização</p>
                          <p className="text-sm text-slate-900">{formatDate(service.loyalty_end_date)}</p>
                        </div>
                      )}
                    </div>
                  </ModernCard>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </ModernCard>
    </div>
  );
}
