import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { leadsService } from '../services/leadsService';
import { clientsService } from '../services/clientsService';
import { usersService } from '../services/usersService';
import { ArrowLeft, Save, Loader2, Search, ArrowRight } from 'lucide-react';

const SALE_TYPES = [
  { value: 'NI', label: 'NI (Nova Instalação)' },
  { value: 'MC', label: 'MC (Mudança de Casa)' },
  { value: 'Refid', label: 'Refid (Refidelização)' },
  { value: 'Refid_Acrescimo', label: 'Refid com Acréscimo' },
  { value: 'Refid_Decrescimo', label: 'Refid com Decréscimo' },
  { value: 'Up_sell', label: 'Up-sell' },
  { value: 'Cross_sell', label: 'Cross-sell' }
];

const LEAD_STATUSES = [
  { value: 'nova', label: 'Nova' },
  { value: 'em_contacto', label: 'Em Contacto' },
  { value: 'qualificada', label: 'Qualificada' },
  { value: 'convertida', label: 'Convertida' },
  { value: 'perdida', label: 'Perdida' }
];

export default function LeadForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const prefilledClientId = searchParams.get('clientId');

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit || prefilledClientId);
  const [checkingNIF, setCheckingNIF] = useState(false);
  const [showForm, setShowForm] = useState(isEdit || prefilledClientId);
  const [nifInput, setNifInput] = useState('');
  const [sellers, setSellers] = useState([]);

  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    client_nif: '',
    client_email: '',
    client_phone: '',
    client_type: 'residencial',
    portfolio_status: '',
    user_id: '',
    observations: '',
    sale_type: '',
    alert_date: '',
    status: 'nova'
  });

  useEffect(() => {
    fetchSellers();
    if (isEdit) {
      loadLead();
    } else if (prefilledClientId) {
      loadClientData();
    }
  }, [id, prefilledClientId]);

  const fetchSellers = async () => {
    try {
      const sellersData = await usersService.getUsersByRole('vendedor');
      setSellers(sellersData);
    } catch (error) {
      console.error('Error fetching sellers:', error);
    }
  };

  const loadLead = async () => {
    try {
      setInitialLoading(true);
      const lead = await leadsService.getLeadById(id);
      if (lead) {
        setFormData({
          client_id: lead.client_id || '',
          client_name: lead.client?.name || '',
          client_nif: lead.client?.nif || '',
          client_email: lead.client?.email || '',
          client_phone: lead.client?.phone || '',
          client_type: lead.client?.client_type || 'residencial',
          portfolio_status: lead.client?.portfolio_status || '',
          user_id: lead.user_id || '',
          observations: lead.observations || '',
          sale_type: lead.sale_type || '',
          alert_date: lead.alert_date || '',
          status: lead.status || 'nova'
        });
      }
    } catch (error) {
      console.error('Error loading lead:', error);
      toast.error('Erro ao carregar lead');
      navigate('/leads');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadClientData = async () => {
    try {
      setInitialLoading(true);
      const client = await clientsService.getClientById(prefilledClientId);
      if (client) {
        setFormData(prev => ({
          ...prev,
          client_id: client.id,
          client_name: client.name,
          client_nif: client.nif,
          client_email: client.email || '',
          client_phone: client.phone || '',
          client_type: client.client_type,
          portfolio_status: client.portfolio_status || ''
        }));
      }
    } catch (error) {
      console.error('Error loading client:', error);
      toast.error('Erro ao carregar dados do cliente');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleCheckNIF = async () => {
    if (!nifInput) {
      toast.error('Insira um NIF');
      return;
    }

    if (nifInput.length !== 9 || !/^\d+$/.test(nifInput)) {
      toast.error('O NIF deve ter 9 dígitos numéricos');
      return;
    }

    setCheckingNIF(true);
    try {
      const client = await clientsService.getClientByNIF(nifInput);

      if (client) {
        setFormData(prev => ({
          ...prev,
          client_id: client.id,
          client_name: client.name,
          client_nif: client.nif,
          client_email: client.email || '',
          client_phone: client.phone || '',
          client_type: client.client_type,
          portfolio_status: client.portfolio_status || ''
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          client_id: '',
          client_nif: nifInput
        }));
      }

      setShowForm(true);
    } catch (error) {
      console.error('Error checking NIF:', error);
      toast.error('Erro ao verificar NIF');
    } finally {
      setCheckingNIF(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.client_name.trim()) {
      toast.error('Nome do cliente é obrigatório');
      return false;
    }

    if (!formData.client_nif.trim()) {
      toast.error('NIF é obrigatório');
      return false;
    }

    if (!/^\d{9}$/.test(formData.client_nif)) {
      toast.error('NIF deve ter 9 dígitos');
      return false;
    }

    if (!formData.sale_type) {
      toast.error('Tipo de venda é obrigatório');
      return false;
    }

    if (!formData.alert_date) {
      toast.error('Data de alerta é obrigatória');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      let clientId = formData.client_id;
      if (!clientId) {
        try {
          const newClient = await clientsService.createClient({
            name: formData.client_name.trim(),
            nif: formData.client_nif.trim(),
            email: formData.client_email.trim() || null,
            phone: formData.client_phone.trim() || null,
            client_type: formData.client_type,
            portfolio_status: formData.client_type === 'empresarial' ? formData.portfolio_status : null
          });
          clientId = newClient.id;
        } catch (error) {
          if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
            const existingClient = await clientsService.getClientByNIF(formData.client_nif);
            clientId = existingClient.id;
          } else {
            throw error;
          }
        }
      }

      const leadData = {
        client_id: clientId,
        user_id: formData.user_id || null,
        observations: formData.observations.trim() || null,
        sale_type: formData.sale_type,
        alert_date: formData.alert_date,
        status: formData.status
      };

      if (isEdit) {
        await leadsService.updateLead(id, leadData);
        toast.success('Lead atualizada com sucesso');
      } else {
        await leadsService.createLead(leadData);
        toast.success('Lead criada com sucesso');
      }

      navigate('/leads');
    } catch (error) {
      console.error('Error saving lead:', error);
      toast.error(`Erro ao ${isEdit ? 'atualizar' : 'criar'} lead`);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!showForm && !isEdit) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/leads')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Nova Lead</h1>
              <p className="text-gray-600 text-sm mt-1">Insira o NIF do cliente para começar</p>
            </div>
          </div>

          <Card>
            <CardContent className="p-8">
              <Label htmlFor="nif_input" className="text-lg mb-4 block">NIF do Cliente</Label>
              <div className="flex gap-3">
                <Input
                  id="nif_input"
                  value={nifInput}
                  onChange={(e) => setNifInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckNIF()}
                  className="text-lg"
                  placeholder="123456789"
                  maxLength={9}
                  autoFocus
                />
                <Button
                  onClick={handleCheckNIF}
                  disabled={checkingNIF}
                  className="px-8"
                >
                  {checkingNIF ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <ArrowRight size={20} />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/leads')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">
          {isEdit ? 'Editar Lead' : 'Nova Lead'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="client_name">Nome Completo *</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => handleChange('client_name', e.target.value)}
                  placeholder="Nome do cliente"
                  disabled={loading || formData.client_id}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_nif">NIF *</Label>
                <Input
                  id="client_nif"
                  value={formData.client_nif}
                  onChange={(e) => handleChange('client_nif', e.target.value.replace(/\D/g, '').slice(0, 9))}
                  placeholder="123456789"
                  maxLength={9}
                  disabled={loading || formData.client_id}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_email">Email</Label>
                <Input
                  id="client_email"
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => handleChange('client_email', e.target.value)}
                  placeholder="email@exemplo.com"
                  disabled={loading || formData.client_id}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_phone">Telefone</Label>
                <Input
                  id="client_phone"
                  value={formData.client_phone}
                  onChange={(e) => handleChange('client_phone', e.target.value)}
                  placeholder="+351 123 456 789"
                  disabled={loading || formData.client_id}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_type">Tipo de Cliente *</Label>
                <Select
                  value={formData.client_type}
                  onValueChange={(value) => {
                    handleChange('client_type', value);
                    if (value === 'residencial') {
                      handleChange('portfolio_status', '');
                    }
                  }}
                  disabled={loading || formData.client_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residencial">Residencial</SelectItem>
                    <SelectItem value="empresarial">Empresarial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.client_type === 'empresarial' && (
                <div className="space-y-2">
                  <Label htmlFor="portfolio_status">Status de Portfolio</Label>
                  <Select
                    value={formData.portfolio_status}
                    onValueChange={(value) => handleChange('portfolio_status', value)}
                    disabled={loading || formData.client_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="cliente_carteira">Cliente de Carteira</SelectItem>
                      <SelectItem value="fora_carteira">Fora de Carteira</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados da Lead</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="sale_type">Tipo de Venda *</Label>
                <Select
                  value={formData.sale_type}
                  onValueChange={(value) => handleChange('sale_type', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {SALE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alert_date">Data de Alerta *</Label>
                <Input
                  id="alert_date"
                  type="date"
                  value={formData.alert_date}
                  onChange={(e) => handleChange('alert_date', e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_id">Vendedor</Label>
                <Select
                  value={formData.user_id}
                  onValueChange={(value) => handleChange('user_id', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um vendedor (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {sellers.map((seller) => (
                      <SelectItem key={seller.id} value={seller.id}>
                        {seller.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) => handleChange('observations', e.target.value)}
                  placeholder="Adicione notas sobre esta lead..."
                  rows={4}
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/leads')}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A guardar...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEdit ? 'Atualizar' : 'Criar'} Lead
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
