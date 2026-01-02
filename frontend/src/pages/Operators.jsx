import { useState, useEffect } from "react";
import { useAuth } from "@/App";
import { operatorsService } from "@/services/operatorsService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Radio,
  Plus,
  Edit2,
  Trash2,
  Power,
  PowerOff,
  Loader2,
  Zap,
  Phone,
  Sun
} from "lucide-react";

const CATEGORY_OPTIONS = [
  { value: "energia_eletricidade", label: "Energia - Eletricidade", icon: Zap },
  { value: "energia_gas", label: "Energia - Gás", icon: Zap },
  { value: "telecomunicacoes", label: "Telecomunicações", icon: Phone },
  { value: "paineis_solares", label: "Painéis Solares", icon: Sun }
];

const getCategoryIcon = (category) => {
  const option = CATEGORY_OPTIONS.find(opt => opt.value === category);
  return option ? option.icon : Radio;
};

const getCategoryLabel = (category) => {
  const option = CATEGORY_OPTIONS.find(opt => opt.value === category);
  return option ? option.label : category;
};

export default function Operators() {
  const { isAdmin, user } = useAuth();
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    categories: [],
    commission_visible_to_bo: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const operatorsData = await operatorsService.getOperators(null, true);
      setOperators(operatorsData);
    } catch (error) {
      toast.error("Erro ao carregar operadoras");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingOperator(null);
    setFormData({
      name: "",
      categories: [],
      commission_visible_to_bo: false
    });
    setModalOpen(true);
  };

  const openEditModal = (operator) => {
    setEditingOperator(operator);
    setFormData({
      name: operator.name || "",
      categories: operator.categories || [],
      commission_visible_to_bo: operator.commission_visible_to_bo || false
    });
    setModalOpen(true);
  };

  const handleCategoryToggle = (category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Nome da operadora é obrigatório");
      return;
    }

    if (formData.categories.length === 0) {
      toast.error("Selecione pelo menos uma categoria");
      return;
    }

    setSaving(true);
    try {
      if (editingOperator) {
        const updated = await operatorsService.updateOperator(editingOperator.id, formData);
        setOperators(operators.map(o => o.id === editingOperator.id ? updated : o));
        toast.success("Operadora atualizada");
      } else {
        const created = await operatorsService.createOperator({
          ...formData,
          active: true
        });
        setOperators([...operators, created]);
        toast.success("Operadora criada");
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Erro ao guardar operadora");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await operatorsService.deleteOperator(deleteId);
      setOperators(operators.filter(o => o.id !== deleteId));
      toast.success("Operadora eliminada");
    } catch (error) {
      toast.error("Erro ao eliminar operadora");
    } finally {
      setDeleteId(null);
    }
  };

  const toggleActive = async (operatorId) => {
    try {
      const operator = operators.find(o => o.id === operatorId);
      const updated = await operatorsService.toggleOperatorActive(operatorId, !operator.active);
      setOperators(operators.map(o => o.id === operatorId ? updated : o));
      toast.success("Status atualizado");
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="operators-page">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Manrope']">Operadoras</h1>
          <p className="text-white/50 text-sm mt-1">Gerir operadoras e suas categorias</p>
        </div>
        <Button
          onClick={openCreateModal}
          className="btn-primary btn-primary-glow flex items-center gap-2"
          data-testid="new-operator-btn"
        >
          <Plus size={18} />
          Nova Operadora
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {operators.length > 0 ? (
          operators.map((operator) => (
            <Card key={operator.id} className="card-leiritrix" data-testid={`operator-card-${operator.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${operator.active ? 'bg-[#c8f31d]/20' : 'bg-white/10'}`}>
                      <Radio size={20} className={operator.active ? 'text-[#c8f31d]' : 'text-white/40'} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{operator.name}</p>
                      {!operator.active && (
                        <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs mt-1">
                          Inativa
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-white/50 text-xs mb-2">Categorias</p>
                    <div className="flex flex-wrap gap-1">
                      {operator.categories && operator.categories.length > 0 ? (
                        operator.categories.map((cat) => {
                          const Icon = getCategoryIcon(cat);
                          return (
                            <Badge key={cat} className="bg-[#c8f31d]/20 text-[#c8f31d] border border-[#c8f31d]/30 text-xs">
                              <Icon size={12} className="mr-1" />
                              {getCategoryLabel(cat)}
                            </Badge>
                          );
                        })
                      ) : (
                        <span className="text-white/40 text-xs">Sem categorias</span>
                      )}
                    </div>
                  </div>

                  <div>
                    {operator.commission_visible_to_bo ? (
                      <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-xs">
                        {isAdmin ? "Comissões Visíveis BO" : "Com comissão a contabilizar"}
                      </Badge>
                    ) : (
                      <Badge className="bg-white/10 text-white/60 border border-white/10 text-xs">
                        {isAdmin ? "Comissões Ocultas BO" : "Sem comissão a contabilizar"}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-white/5">
                  <Button
                    onClick={() => openEditModal(operator)}
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-white/70 hover:text-[#c8f31d]"
                    data-testid={`edit-operator-${operator.id}`}
                  >
                    <Edit2 size={16} className="mr-1" />
                    Editar
                  </Button>
                  <Button
                    onClick={() => toggleActive(operator.id)}
                    variant="ghost"
                    size="sm"
                    className={`${operator.active ? 'text-red-400 hover:bg-red-400/10' : 'text-green-400 hover:bg-green-400/10'}`}
                    data-testid={`toggle-operator-${operator.id}`}
                  >
                    {operator.active ? <PowerOff size={16} /> : <Power size={16} />}
                  </Button>
                  <Button
                    onClick={() => setDeleteId(operator.id)}
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-red-400"
                    data-testid={`delete-operator-${operator.id}`}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="card-leiritrix col-span-full">
            <CardContent className="p-8 text-center">
              <Radio size={48} className="mx-auto text-white/20 mb-4" />
              <p className="text-white/50">Nenhuma operadora registada</p>
              <Button
                onClick={openCreateModal}
                className="btn-primary btn-primary-glow mt-4"
              >
                Criar Primeira Operadora
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#082d32] border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white font-['Manrope']">
              {editingOperator ? "Editar Operadora" : "Nova Operadora"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="form-label">Nome da Operadora *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-input mt-1"
                placeholder="Nome da operadora"
                data-testid="operator-name-input"
              />
            </div>

            <div>
              <Label className="form-label mb-3">Categorias de Vendas *</Label>
              <div className="space-y-2">
                {CATEGORY_OPTIONS.map((category) => {
                  const Icon = category.icon;
                  return (
                    <div
                      key={category.value}
                      className="flex items-center space-x-2 p-3 rounded-lg bg-[#0d474f] hover:bg-[#0d474f]/80 cursor-pointer"
                      onClick={() => handleCategoryToggle(category.value)}
                    >
                      <Checkbox
                        id={category.value}
                        checked={formData.categories.includes(category.value)}
                        onCheckedChange={() => handleCategoryToggle(category.value)}
                      />
                      <Icon size={16} className="text-[#c8f31d]" />
                      <Label
                        htmlFor={category.value}
                        className="text-white text-sm cursor-pointer flex-1"
                      >
                        {category.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center justify-between p-4 rounded-lg bg-[#0d474f]">
                <div className="flex-1">
                  <Label className="form-label mb-1">Comissões Visíveis para Backoffice</Label>
                  <p className="text-white/50 text-xs">
                    Se ativo, os utilizadores de backoffice podem ver e registar comissões nas vendas desta operadora
                  </p>
                </div>
                <Switch
                  checked={formData.commission_visible_to_bo}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, commission_visible_to_bo: checked })
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
              className="btn-secondary"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary btn-primary-glow"
              data-testid="save-operator-btn"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  A guardar...
                </>
              ) : (
                editingOperator ? "Guardar" : "Criar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#082d32] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Eliminar Operadora</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Tem a certeza que pretende eliminar esta operadora? Esta ação não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-secondary">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
