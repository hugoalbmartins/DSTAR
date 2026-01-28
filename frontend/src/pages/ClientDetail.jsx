import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import { clientsService } from '../services/clientsService';
import { servicesService } from '../services/servicesService';
import { ArrowLeft, Edit, Plus, Loader2, User, Mail, Phone, CreditCard, Building2, MapPin, Zap } from 'lucide-react';

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
      'em_negociacao': { label: 'Em Negociação', color: 'bg-yellow-100 text-yellow-800' },
      'pendente': { label: 'Pendente', color: 'bg-orange-100 text-orange-800' },
      'ativo': { label: 'Ativo', color: 'bg-green-100 text-green-800' },
      'perdido': { label: 'Perdido', color: 'bg-red-100 text-red-800' },
      'anulado': { label: 'Anulado', color: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getServiceTypeBadge = (type) => {
    const typeConfig = {
      'energia_eletricidade': { label: 'Eletricidade', color: 'bg-yellow-100 text-yellow-800' },
      'energia_gas': { label: 'Gás', color: 'bg-blue-100 text-blue-800' },
      'energia_dual': { label: 'Dual', color: 'bg-purple-100 text-purple-800' },
      'telecomunicacoes': { label: 'Telecomunicações', color: 'bg-green-100 text-green-800' },
      'paineis_solares': { label: 'Painéis Solares', color: 'bg-orange-100 text-orange-800' }
    };

    const config = typeConfig[type] || { label: type, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.color}>{config.label}</Badge>;
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
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Cliente não encontrado</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/clients')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{client.name}</h1>
            <div className="flex gap-2">
              <Badge variant="outline">
                {client.client_type === 'residencial' ? 'Residencial' : 'Empresarial'}
              </Badge>
              {client.portfolio_status && (
                <Badge variant="outline">
                  {client.portfolio_status === 'novo' && 'Novo'}
                  {client.portfolio_status === 'cliente_carteira' && 'Cliente de Carteira'}
                  {client.portfolio_status === 'fora_carteira' && 'Fora de Carteira'}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/leads/new?clientId=${id}`)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Lead
            </Button>
            <Button variant="outline" onClick={() => navigate(`/sales/new?clientId=${id}`)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Venda
            </Button>
            <Button onClick={() => navigate(`/clients/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">NIF</p>
                <p className="text-lg font-semibold">{client.nif}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-lg font-semibold">{client.email || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Telefone</p>
                <p className="text-lg font-semibold">{client.phone || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sales">
                Vendas ({sales.length})
              </TabsTrigger>
              <TabsTrigger value="services">
                Serviços ({services.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sales" className="mt-6">
              {sales.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">Ainda não existem vendas para este cliente</p>
                  <Button onClick={() => navigate(`/sales/new?clientId=${id}`)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeira Venda
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Operadora</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Vendedor</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>{formatDate(sale.created_at)}</TableCell>
                          <TableCell>{sale.operator?.name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{sale.sale_type}</Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(sale.contract_value)}</TableCell>
                          <TableCell>{getStatusBadge(sale.status)}</TableCell>
                          <TableCell>{sale.seller?.name || '-'}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/sales/${sale.id}`)}
                            >
                              Ver Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="services" className="mt-6">
              {services.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Ainda não existem serviços registados para este cliente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {services.map((service) => (
                    <Card key={service.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <Zap className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-semibold text-lg">
                                {service.service_number || 'Sem número de serviço'}
                              </p>
                              {getServiceTypeBadge(service.service_type)}
                            </div>
                          </div>
                          <Badge className={service.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {service.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                            <div>
                              <p className="text-sm text-gray-500">Morada</p>
                              <p className="text-sm">
                                {service.address?.street_address}<br />
                                {service.address?.postal_code} {service.address?.city}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Building2 className="h-4 w-4 text-gray-500 mt-1" />
                            <div>
                              <p className="text-sm text-gray-500">Operadora</p>
                              <p className="text-sm">{service.operator?.name || '-'}</p>
                            </div>
                          </div>

                          {service.cpe && (
                            <div>
                              <p className="text-sm text-gray-500">CPE</p>
                              <p className="text-sm font-mono">{service.cpe}</p>
                            </div>
                          )}

                          {service.cui && (
                            <div>
                              <p className="text-sm text-gray-500">CUI</p>
                              <p className="text-sm font-mono">{service.cui}</p>
                            </div>
                          )}

                          {service.req && (
                            <div>
                              <p className="text-sm text-gray-500">REQ</p>
                              <p className="text-sm font-mono">{service.req}</p>
                            </div>
                          )}

                          {service.loyalty_end_date && (
                            <div>
                              <p className="text-sm text-gray-500">Fim de Fidelização</p>
                              <p className="text-sm">{formatDate(service.loyalty_end_date)}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
