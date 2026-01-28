import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import { leadsService } from '../services/leadsService';
import { Plus, Search, Loader2, Eye, Edit, Trash2 } from 'lucide-react';

const STATUS_COLORS = {
  nova: 'bg-blue-100 text-blue-800',
  em_contacto: 'bg-yellow-100 text-yellow-800',
  qualificada: 'bg-green-100 text-green-800',
  convertida: 'bg-purple-100 text-purple-800',
  perdida: 'bg-red-100 text-red-800'
};

const STATUS_LABELS = {
  nova: 'Nova',
  em_contacto: 'Em Contacto',
  qualificada: 'Qualificada',
  convertida: 'Convertida',
  perdida: 'Perdida'
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
    const color = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
    const label = STATUS_LABELS[status] || status;
    return <Badge className={color}>{label}</Badge>;
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
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-gray-600 mt-1">
            Total de {leads.length} lead{leads.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => navigate('/leads/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Lead
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
        </CardHeader>
        <CardContent>
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              {searchTerm || statusFilter !== 'all' || saleTypeFilter !== 'all' ? (
                <>
                  <p className="text-gray-500 mb-4">Nenhuma lead encontrada com os filtros aplicados</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setSaleTypeFilter('all');
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-gray-500 mb-4">Ainda não existem leads registadas</p>
                  <Button onClick={() => navigate('/leads/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeira Lead
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo de Venda</TableHead>
                    <TableHead>Data de Alerta</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{lead.client?.name}</p>
                          <p className="text-sm text-gray-500">{lead.client?.nif}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{lead.sale_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{formatDate(lead.alert_date)}</p>
                          <p className="text-sm">{getDaysUntilAlert(lead.alert_date)}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell>{lead.user?.name || '-'}</TableCell>
                      <TableCell>
                        <p className="max-w-xs truncate">{lead.observations || '-'}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/leads/${lead.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(lead.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
