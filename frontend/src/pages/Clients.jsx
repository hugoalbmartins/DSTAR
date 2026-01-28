import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernCard, ModernButton, ModernBadge, ModernTable } from '../components/modern';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { clientsService } from '../services/clientsService';
import { Plus, Search, Loader2, Eye, Users } from 'lucide-react';

export default function Clients() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [searchTerm, clients]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await clientsService.getAllClients();
      setClients(data || []);
      setFilteredClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error('Erro ao carregar clientes');
      setClients([]);
      setFilteredClients([]);
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = clients.filter(client =>
      client.name?.toLowerCase().includes(term) ||
      client.nif?.includes(term) ||
      client.email?.toLowerCase().includes(term) ||
      client.phone?.includes(term)
    );

    setFilteredClients(filtered);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-PT');
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
            Clientes
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Total de {clients.length} cliente{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ModernButton onClick={() => navigate('/clients/new')} variant="primary" icon={Plus}>
          Novo Cliente
        </ModernButton>
      </div>

      <ModernCard title="Gestão de Clientes" icon={Users} variant="gradient">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Pesquisar por nome, NIF, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              {searchTerm ? (
                <>
                  <p className="text-slate-500 mb-4">
                    Nenhum cliente encontrado com "{searchTerm}"
                  </p>
                  <ModernButton variant="secondary" onClick={() => setSearchTerm('')}>
                    Limpar Pesquisa
                  </ModernButton>
                </>
              ) : (
                <>
                  <p className="text-slate-500 mb-4">
                    Ainda não existem clientes registados
                  </p>
                  <ModernButton onClick={() => navigate('/clients/new')} variant="primary" icon={Plus}>
                    Criar Primeiro Cliente
                  </ModernButton>
                </>
              )}
            </div>
          ) : (
            <ModernTable
              columns={[
                { key: 'name', label: 'Nome', sortable: true, render: (value) => <span className="font-medium text-slate-900">{value}</span> },
                { key: 'nif', label: 'NIF', sortable: true, render: (value) => <span className="font-mono text-slate-700">{value}</span> },
                { key: 'email', label: 'Email', sortable: true, render: (value) => <span className="text-slate-600">{value || '-'}</span> },
                { key: 'phone', label: 'Telefone', sortable: false, render: (value) => <span className="text-slate-600">{value || '-'}</span> },
                { key: 'client_type', label: 'Tipo', sortable: true, render: (value, row) => (
                  <div className="flex flex-wrap gap-1">
                    <ModernBadge variant="default">
                      {value === 'residencial' ? 'Residencial' : 'Empresarial'}
                    </ModernBadge>
                    {row.portfolio_status && (
                      <ModernBadge variant="info">
                        {row.portfolio_status === 'novo' && 'Novo'}
                        {row.portfolio_status === 'cliente_carteira' && 'Carteira'}
                        {row.portfolio_status === 'fora_carteira' && 'Fora Carteira'}
                      </ModernBadge>
                    )}
                  </div>
                ) },
                { key: 'created_at', label: 'Data de Criação', sortable: true, render: (value) => <span className="text-slate-600">{formatDate(value)}</span> },
                { key: 'id', label: '', sortable: false, render: (value) => (
                  <div className="flex gap-2">
                    <ModernButton
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/clients/${value}`);
                      }}
                      icon={Eye}
                    />
                  </div>
                ) }
              ]}
              data={filteredClients}
              sortable={true}
              hoverable={true}
            />
          )}
        </div>
      </ModernCard>
    </div>
  );
}
