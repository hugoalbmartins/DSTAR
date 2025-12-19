import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Users as UsersIcon, 
  Plus, 
  UserCheck, 
  UserX,
  Shield,
  Loader2
} from "lucide-react";

const ROLES = [
  { value: "admin", label: "Administrador", color: "bg-[#c8f31d] text-[#0d474f]" },
  { value: "backoffice", label: "Backoffice", color: "bg-blue-500/20 text-blue-400 border border-blue-500/30" },
  { value: "vendedor", label: "Vendedor", color: "bg-white/10 text-white/70" }
];

export default function Users() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "vendedor"
  });

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/users`, { headers });
      setUsers(response.data);
    } catch (error) {
      toast.error("Erro ao carregar utilizadores");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setCreating(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`${API}/auth/register`, newUser, { headers });
      setUsers([...users, response.data]);
      setCreateModal(false);
      setNewUser({ name: "", email: "", password: "", role: "vendedor" });
      toast.success("Utilizador criado com sucesso");
    } catch (error) {
      const message = error.response?.data?.detail || "Erro ao criar utilizador";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const toggleUserActive = async (userId) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.put(`${API}/users/${userId}/toggle-active`, {}, { headers });
      setUsers(users.map(u => u.id === userId ? { ...u, active: response.data.active } : u));
      toast.success("Estado atualizado");
    } catch (error) {
      toast.error("Erro ao atualizar estado");
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API}/users/${userId}/role?role=${newRole}`, {}, { headers });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success("Role atualizado");
    } catch (error) {
      toast.error("Erro ao atualizar role");
    }
  };

  const getRoleBadge = (role) => {
    const roleInfo = ROLES.find(r => r.value === role);
    return roleInfo || ROLES[2];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="users-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Manrope']">Utilizadores</h1>
          <p className="text-white/50 text-sm mt-1">Gerir utilizadores do sistema</p>
        </div>
        <Button 
          onClick={() => setCreateModal(true)}
          className="btn-primary btn-primary-glow flex items-center gap-2"
          data-testid="new-user-btn"
        >
          <Plus size={18} />
          Novo Utilizador
        </Button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => {
          const roleInfo = getRoleBadge(user.role);
          const isCurrentUser = user.id === currentUser?.id;
          
          return (
            <Card key={user.id} className="card-leiritrix" data-testid={`user-card-${user.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.active ? 'bg-[#c8f31d]/20' : 'bg-white/10'}`}>
                      <UsersIcon size={20} className={user.active ? 'text-[#c8f31d]' : 'text-white/40'} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-white/50 text-sm">{user.email}</p>
                    </div>
                  </div>
                  {!user.active && (
                    <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs">
                      Inativo
                    </Badge>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Role */}
                  <div>
                    <Label className="form-label text-xs mb-2 flex items-center gap-1">
                      <Shield size={12} /> Role
                    </Label>
                    <Select 
                      value={user.role} 
                      onValueChange={(value) => updateUserRole(user.id, value)}
                      disabled={isCurrentUser}
                    >
                      <SelectTrigger className="form-input" data-testid={`role-select-${user.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#082d32] border-white/10">
                        {ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value} className="text-white hover:bg-white/10">
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Toggle Active */}
                  {!isCurrentUser && (
                    <Button
                      onClick={() => toggleUserActive(user.id)}
                      variant="ghost"
                      className={`w-full ${user.active ? 'text-red-400 hover:bg-red-400/10' : 'text-green-400 hover:bg-green-400/10'}`}
                      data-testid={`toggle-user-${user.id}`}
                    >
                      {user.active ? (
                        <>
                          <UserX size={16} className="mr-2" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <UserCheck size={16} className="mr-2" />
                          Ativar
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create User Modal */}
      <Dialog open={createModal} onOpenChange={setCreateModal}>
        <DialogContent className="bg-[#082d32] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white font-['Manrope']">Novo Utilizador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name" className="form-label">Nome *</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="form-input mt-1"
                placeholder="Nome completo"
                data-testid="new-user-name"
              />
            </div>
            <div>
              <Label htmlFor="email" className="form-label">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="form-input mt-1"
                placeholder="email@leiritrix.pt"
                data-testid="new-user-email"
              />
            </div>
            <div>
              <Label htmlFor="password" className="form-label">Palavra-passe *</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="form-input mt-1"
                placeholder="••••••••"
                data-testid="new-user-password"
              />
            </div>
            <div>
              <Label htmlFor="role" className="form-label">Role</Label>
              <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                <SelectTrigger className="form-input mt-1" data-testid="new-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#082d32] border-white/10">
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value} className="text-white hover:bg-white/10">
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCreateModal(false)}
              className="btn-secondary"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={creating}
              className="btn-primary btn-primary-glow"
              data-testid="create-user-btn"
            >
              {creating ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  A criar...
                </>
              ) : (
                "Criar Utilizador"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
