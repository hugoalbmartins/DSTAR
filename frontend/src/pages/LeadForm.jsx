import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ModernCard, ModernButton, ModernBadge } from '../components/modern';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { leadsService } from '../services/leadsService';
import { leadContactHistoryService } from '../services/leadContactHistoryService';
import { clientsService } from '../services/clientsService';
import { usersService } from '../services/usersService';
import { authService } from '../services/authService';
import { ArrowLeft, Save, Loader2, Search, ArrowRight, UserCircle, ClipboardList, History, Calendar } from 'lucide-react';

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
  const [initialLoading, setInitialLoading] = useState(false);
  const [checkingNIF, setCheckingNIF] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [nifInput, setNifInput] = useState('');
  const [sellers, setSellers] = useState([]);
  const [contactHistory, setContactHistory] = useState([]);
  const [originalAlertDate, setOriginalAlertDate] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

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
    loadCurrentUser();
    fetchSellers();
    if (isEdit) {
      setInitialLoading(true);
      setShowForm(true);
      loadLead();
    } else if (prefilledClientId) {
      setInitialLoading(true);
      setShowForm(true);
      loadClientData();
    }
  }, [id, prefilledClientId]);

  const loadCurrentUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const fetchSellers = async () => {
    try {
      const sellersData = await usersService.getUsersByRole('vendedor');
      setSellers(sellersData);
    } catch (error) {
      console.error('Error fetching sellers:', error);
    }
  };

  const loadContactHistory = async (leadId) => {
    try {
      const history = await leadContactHistoryService.getHistoryByLeadId(leadId);
      setContactHistory(history);
    } catch (error) {
      console.error('Error loading contact history:', error);
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
        setOriginalAlertDate(lead.alert_date || '');
        await loadContactHistory(id);
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
        if (originalAlertDate && originalAlertDate !== formData.alert_date && formData.status === 'em_contacto') {
          await leadContactHistoryService.addContactHistory(
            id,
            originalAlertDate,
            `Data de contacto anterior: ${new Date(originalAlertDate).toLocaleDateString('pt-PT')}`,
            currentUser?.id
          );
        }
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
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!showForm && !isEdit) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <ModernButton
            variant="ghost"
            onClick={() => navigate('/leads')}
            icon={ArrowLeft}
          >
            Voltar
          </ModernButton>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-brand-700 bg-clip-text text-transparent">
              Nova Lead
            </h1>
            <p className="text-slate-600 text-sm mt-1">Insira o NIF do cliente para começar</p>
          </div>
        </div>

        <ModernCard variant="gradient" hover={false}>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-100 rounded-xl">
                <Search className="text-brand-600" size={24} />
              </div>
              <div>
                <Label htmlFor="nif_input" className="text-lg font-bold text-slate-900">NIF do Cliente</Label>
                <p className="text-sm text-slate-600 mt-1">Digite o NIF para verificar se o cliente já existe</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Input
                id="nif_input"
                value={nifInput}
                onChange={(e) => setNifInput(e.target.value.replace(/\D/g, '').slice(0, 9))}
                onKeyDown={(e) => e.key === 'Enter' && handleCheckNIF()}
                className="text-lg h-12 border-2"
                placeholder="123456789"
                maxLength={9}
                autoFocus
              />
              <ModernButton
                onClick={handleCheckNIF}
                loading={checkingNIF}
                icon={ArrowRight}
                iconPosition="right"
                size="lg"
                className="px-8"
              >
                Continuar
              </ModernButton>
            </div>
          </div>
        </ModernCard>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <ModernButton
            variant="ghost"
            onClick={() => navigate('/leads')}
            icon={ArrowLeft}
          >
            Voltar
          </ModernButton>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-brand-700 bg-clip-text text-transparent">
              {isEdit ? 'Editar Lead' : 'Nova Lead'}
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              {isEdit ? 'Atualize as informações da lead' : 'Preencha os dados para criar uma nova lead'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <ModernCard title="Dados do Cliente" icon={UserCircle} variant="gradient" hover={false}>
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
        </ModernCard>

        <ModernCard title="Dados da Lead" icon={ClipboardList} variant="gradient" hover={false}>
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
                  value={formData.user_id || "unassigned"}
                  onValueChange={(value) => handleChange('user_id', value === "unassigned" ? "" : value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um vendedor (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Nenhum</SelectItem>
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
        </ModernCard>

        {isEdit && contactHistory.length > 0 && (
          <ModernCard title="Histórico de Contactos" icon={History} variant="gradient" hover={false}>
            <div className="space-y-3">
              {contactHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="p-2 bg-brand-100 rounded-lg">
                    <Calendar className="h-4 w-4 text-brand-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-900">
                        {new Date(entry.contact_date).toLocaleDateString('pt-PT', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <ModernBadge variant="info" size="sm">
                        Contacto Anterior
                      </ModernBadge>
                    </div>
                    {entry.observations && (
                      <p className="text-sm text-slate-600 mb-2">{entry.observations}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      {entry.created_by_user?.name || 'Sistema'} • {' '}
                      {new Date(entry.created_at).toLocaleDateString('pt-PT')} às{' '}
                      {new Date(entry.created_at).toLocaleTimeString('pt-PT', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ModernCard>
        )}

        <div className="flex justify-end gap-4 pt-4">
          <ModernButton
            type="button"
            variant="secondary"
            onClick={() => navigate('/leads')}
            disabled={loading}
          >
            Cancelar
          </ModernButton>
          <ModernButton
            type="submit"
            loading={loading}
            icon={Save}
          >
            {isEdit ? 'Atualizar' : 'Criar'} Lead
          </ModernButton>
        </div>
      </form>
    </div>
  );
}
