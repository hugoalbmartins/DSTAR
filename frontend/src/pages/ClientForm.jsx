import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { clientsService } from '../services/clientsService';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function ClientForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [formData, setFormData] = useState({
    name: '',
    nif: '',
    email: '',
    phone: '',
    client_type: 'residencial',
    portfolio_status: ''
  });

  useEffect(() => {
    if (isEdit) {
      loadClient();
    }
  }, [id]);

  const loadClient = async () => {
    try {
      setInitialLoading(true);
      const client = await clientsService.getClientById(id);
      if (client) {
        setFormData({
          name: client.name || '',
          nif: client.nif || '',
          email: client.email || '',
          phone: client.phone || '',
          client_type: client.client_type || 'residencial',
          portfolio_status: client.portfolio_status || ''
        });
      }
    } catch (error) {
      console.error('Error loading client:', error);
      toast.error('Erro ao carregar cliente');
      navigate('/clients');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return false;
    }

    if (!formData.nif.trim()) {
      toast.error('NIF é obrigatório');
      return false;
    }

    if (!/^\d{9}$/.test(formData.nif)) {
      toast.error('NIF deve ter 9 dígitos');
      return false;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Email inválido');
      return false;
    }

    if (!formData.client_type) {
      toast.error('Tipo de cliente é obrigatório');
      return false;
    }

    if (formData.client_type === 'empresarial' && !formData.portfolio_status) {
      toast.error('Status de portfolio é obrigatório para clientes empresariais');
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

      const clientData = {
        name: formData.name.trim(),
        nif: formData.nif.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        client_type: formData.client_type,
        portfolio_status: formData.client_type === 'empresarial' ? formData.portfolio_status : null
      };

      if (isEdit) {
        await clientsService.updateClient(id, clientData);
        toast.success('Cliente atualizado com sucesso');
      } else {
        const newClient = await clientsService.createClient(clientData);
        toast.success('Cliente criado com sucesso');
        navigate(`/clients/${newClient.id}`);
        return;
      }

      navigate(`/clients/${id}`);
    } catch (error) {
      console.error('Error saving client:', error);
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        toast.error('Já existe um cliente com este NIF');
      } else {
        toast.error(`Erro ao ${isEdit ? 'atualizar' : 'criar'} cliente`);
      }
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(isEdit ? `/clients/${id}` : '/clients')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">
          {isEdit ? 'Editar Cliente' : 'Novo Cliente'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Nome do cliente"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nif">NIF *</Label>
                <Input
                  id="nif"
                  value={formData.nif}
                  onChange={(e) => handleChange('nif', e.target.value.replace(/\D/g, '').slice(0, 9))}
                  placeholder="123456789"
                  maxLength={9}
                  disabled={loading || isEdit}
                />
                {isEdit && (
                  <p className="text-xs text-gray-500">NIF não pode ser alterado</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="email@exemplo.com"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+351 123 456 789"
                  disabled={loading}
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
                  disabled={loading}
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
                  <Label htmlFor="portfolio_status">Status de Portfolio *</Label>
                  <Select
                    value={formData.portfolio_status}
                    onValueChange={(value) => handleChange('portfolio_status', value)}
                    disabled={loading}
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

            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(isEdit ? `/clients/${id}` : '/clients')}
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
                    {isEdit ? 'Atualizar' : 'Criar'} Cliente
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
