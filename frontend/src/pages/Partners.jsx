import { useState, useEffect } from "react";
import { partnersService } from "@/services/partnersService";
import { operatorsService } from "@/services/operatorsService";
import { generatePassword, validatePassword } from "@/utils/passwordGenerator";
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
  Building2,
  Plus,
  Edit2,
  Trash2,
  Power,
  PowerOff,
  Loader2,
  Mail,
  Phone,
  User,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Check,
  Radio,
  Zap,
  Sun
} from "lucide-react";

const CATEGORY_OPTIONS = [
  { value: "energia_eletricidade", label: "Energia - Eletricidade", icon: Zap },
  { value: "energia_gas", label: "Energia - Gás", icon: Zap },
  { value: "telecomunicacoes", label: "Telecomunicações", icon: Phone },
  { value: "paineis_solares", label: "Painéis Solares", icon: Sun }
];

export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [createdPassword, setCreatedPassword] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const [operatorsModalOpen, setOperatorsModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [operators, setOperators] = useState([]);
  const [operatorModalOpen, setOperatorModalOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState(null);
  const [operatorDeleteId, setOperatorDeleteId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact_person: "",
    phone: "",
    password: ""
  });

  const [operatorFormData, setOperatorFormData] = useState({
    name: "",
    categories: [],
    commission_visible_to_bo: false
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const partnersData = await partnersService.getPartners(true);
      setPartners(partnersData);
    } catch (error) {
      toast.error("Erro ao carregar parceiros");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPartner(null);
    const generatedPassword = generatePassword(12);
    setFormData({
      name: "",
      email: "",
      contact_person: "",
      phone: "",
      password: generatedPassword
    });
    setShowPassword(false);
    setModalOpen(true);
  };

  const openEditModal = (partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name || "",
      email: partner.email || "",
      contact_person: partner.contact_person || "",
      phone: partner.phone || "",
      password: ""
    });
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (!editingPartner) {
      const passwordError = validatePassword(formData.password);
      if (passwordError) {
        toast.error(passwordError);
        return;
      }
    }

    setSaving(true);
    try {
      if (editingPartner) {
        const updateData = {
          name: formData.name,
          email: formData.email,
          contact_person: formData.contact_person,
          phone: formData.phone
        };
        const updated = await partnersService.updatePartner(editingPartner.id, updateData);
        setPartners(partners.map(p => p.id === editingPartner.id ? updated : p));
        toast.success("Parceiro atualizado");
        setModalOpen(false);
      } else {
        const created = await partnersService.createPartner({
          ...formData,
          active: true
        });
        setPartners([...partners, created]);
        setCreatedPassword(formData.password);
        setPasswordCopied(false);
        setModalOpen(false);
      }
    } catch (error) {
      toast.error("Erro ao guardar parceiro");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateNewPassword = () => {
    const newPassword = generatePassword(12);
    setFormData({ ...formData, password: newPassword });
  };

  const copyPasswordToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(createdPassword);
      setPasswordCopied(true);
      toast.success("Password copiada");
      setTimeout(() => setPasswordCopied(false), 2000);
    } catch (error) {
      toast.error("Erro ao copiar password");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await partnersService.deletePartner(deleteId);
      setPartners(partners.filter(p => p.id !== deleteId));
      toast.success("Parceiro eliminado");
    } catch (error) {
      toast.error("Erro ao eliminar parceiro");
    } finally {
      setDeleteId(null);
    }
  };

  const toggleActive = async (partnerId) => {
    try {
      const partner = partners.find(p => p.id === partnerId);
      const updated = await partnersService.togglePartnerActive(partnerId, !partner.active);
      setPartners(partners.map(p => p.id === partnerId ? updated : p));
      toast.success("Status atualizado");
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const [availableOperators, setAvailableOperators] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const operatorsPerPage = 5;

  const openOperatorsModal = async (partner) => {
    setSelectedPartner(partner);
    setCurrentPage(1);
    try {
      const { associated, available } = await operatorsService.getAvailableOperatorsForPartner(partner.id);
      setOperators(associated);
      setAvailableOperators(available);
      setOperatorsModalOpen(true);
    } catch (error) {
      toast.error("Erro ao carregar operadoras");
    }
  };

  const openCreateOperatorModal = () => {
    setEditingOperator(null);
    setOperatorFormData({
      name: "",
      categories: [],
      commission_visible_to_bo: false
    });
    setOperatorModalOpen(true);
  };

  const openEditOperatorModal = (operator) => {
    setEditingOperator(operator);
    setOperatorFormData({
      name: operator.name || "",
      categories: operator.categories || [],
      commission_visible_to_bo: operator.commission_visible_to_bo || false
    });
    setOperatorModalOpen(true);
  };

  const handleOperatorCategoryToggle = (category) => {
    setOperatorFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleSaveOperator = async () => {
    if (!operatorFormData.name) {
      toast.error("Nome da operadora é obrigatório");
      return;
    }

    if (operatorFormData.categories.length === 0) {
      toast.error("Selecione pelo menos uma categoria");
      return;
    }

    setSaving(true);
    try {
      if (editingOperator) {
        const updated = await operatorsService.updateOperator(editingOperator.id, operatorFormData);
        setOperators(operators.map(o => o.id === editingOperator.id ? updated : o));
        toast.success("Operadora atualizada");
      } else {
        const created = await operatorsService.createOperator({
          ...operatorFormData,
          active: true
        });
        await operatorsService.associateOperatorWithPartner(created.id, selectedPartner.id);
        setOperators([...operators, created]);
        setAvailableOperators(availableOperators.filter(o => o.id !== created.id));
        toast.success("Operadora criada e associada");
      }
      setOperatorModalOpen(false);
    } catch (error) {
      toast.error("Erro ao guardar operadora");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleOperatorAssociation = async (operator) => {
    const isAssociated = operators.some(o => o.id === operator.id);

    try {
      if (isAssociated) {
        await operatorsService.dissociateOperatorFromPartner(operator.id, selectedPartner.id);
        setOperators(operators.filter(o => o.id !== operator.id));
        setAvailableOperators([...availableOperators, operator]);
        toast.success("Operadora desassociada");
      } else {
        await operatorsService.associateOperatorWithPartner(operator.id, selectedPartner.id);
        setOperators([...operators, operator]);
        setAvailableOperators(availableOperators.filter(o => o.id !== operator.id));
        toast.success("Operadora associada");
      }
    } catch (error) {
      toast.error("Erro ao atualizar associação");
    }
  };

  const handleDeleteOperator = async () => {
    if (!operatorDeleteId) return;

    try {
      await operatorsService.deleteOperator(operatorDeleteId);
      setOperators(operators.filter(o => o.id !== operatorDeleteId));
      toast.success("Operadora eliminada");
    } catch (error) {
      toast.error("Erro ao eliminar operadora");
    } finally {
      setOperatorDeleteId(null);
    }
  };

  const toggleOperatorActive = async (operatorId) => {
    try {
      const operator = operators.find(o => o.id === operatorId);
      const updated = await operatorsService.toggleOperatorActive(operatorId, !operator.active);
      setOperators(operators.map(o => o.id === operatorId ? updated : o));
      toast.success("Status da operadora atualizado");
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
    <div className="space-y-6" data-testid="partners-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Manrope']">Parceiros</h1>
          <p className="text-white/50 text-sm mt-1">Gerir parceiros de negócio</p>
        </div>
        <Button 
          onClick={openCreateModal}
          className="btn-primary btn-primary-glow flex items-center gap-2"
          data-testid="new-partner-btn"
        >
          <Plus size={18} />
          Novo Parceiro
        </Button>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {partners.length > 0 ? (
          partners.map((partner) => (
            <Card key={partner.id} className="card-leiritrix" data-testid={`partner-card-${partner.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${partner.active ? 'bg-[#c8f31d]/20' : 'bg-white/10'}`}>
                      <Building2 size={20} className={partner.active ? 'text-[#c8f31d]' : 'text-white/40'} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{partner.name}</p>
                      {!partner.active && (
                        <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs mt-1">
                          Inativo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {partner.contact_person && (
                    <div className="flex items-center gap-2 text-white/70">
                      <User size={14} />
                      <span>{partner.contact_person}</span>
                    </div>
                  )}
                  {partner.email && (
                    <div className="flex items-center gap-2 text-white/70">
                      <Mail size={14} />
                      <span>{partner.email}</span>
                    </div>
                  )}
                  {partner.phone && (
                    <div className="flex items-center gap-2 text-white/70">
                      <Phone size={14} />
                      <span>{partner.phone}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
                  <Button
                    onClick={() => openOperatorsModal(partner)}
                    variant="ghost"
                    size="sm"
                    className="w-full text-[#c8f31d] hover:bg-[#c8f31d]/10 justify-start"
                    data-testid={`operators-partner-${partner.id}`}
                  >
                    <Radio size={16} className="mr-2" />
                    Gerir Operadoras
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => openEditModal(partner)}
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-white/70 hover:text-[#c8f31d]"
                      data-testid={`edit-partner-${partner.id}`}
                    >
                      <Edit2 size={16} className="mr-1" />
                      Editar
                    </Button>
                    <Button
                      onClick={() => toggleActive(partner.id)}
                      variant="ghost"
                      size="sm"
                      className={`${partner.active ? 'text-red-400 hover:bg-red-400/10' : 'text-green-400 hover:bg-green-400/10'}`}
                      data-testid={`toggle-partner-${partner.id}`}
                    >
                      {partner.active ? <PowerOff size={16} /> : <Power size={16} />}
                    </Button>
                    <Button
                      onClick={() => setDeleteId(partner.id)}
                      variant="ghost"
                      size="sm"
                      className="text-white/70 hover:text-red-400"
                      data-testid={`delete-partner-${partner.id}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="card-leiritrix col-span-full">
            <CardContent className="p-8 text-center">
              <Building2 size={48} className="mx-auto text-white/20 mb-4" />
              <p className="text-white/50">Nenhum parceiro registado</p>
              <Button 
                onClick={openCreateModal}
                className="btn-primary btn-primary-glow mt-4"
              >
                Criar Primeiro Parceiro
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#082d32] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white font-['Manrope']">
              {editingPartner ? "Editar Parceiro" : "Novo Parceiro"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="form-label">Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-input mt-1"
                placeholder="Nome da empresa"
                data-testid="partner-name-input"
              />
            </div>
            <div>
              <Label className="form-label">Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-input mt-1"
                placeholder="email@parceiro.pt"
                data-testid="partner-email-input"
              />
            </div>
            <div>
              <Label className="form-label">Pessoa de Contacto</Label>
              <Input
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="form-input mt-1"
                placeholder="Nome do contacto"
                data-testid="partner-contact-input"
              />
            </div>
            <div>
              <Label className="form-label">Telefone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="form-input mt-1"
                placeholder="912 345 678"
                data-testid="partner-phone-input"
              />
            </div>
            {!editingPartner && (
              <div>
                <Label className="form-label">
                  Password Inicial *
                  <span className="text-white/50 text-xs ml-2">(min 8 caracteres, 1 maiúscula, 1 minúscula, 1 dígito, 1 especial)</span>
                </Label>
                <div className="flex gap-2 mt-1">
                  <div className="relative flex-1">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="form-input pr-10"
                      placeholder="Password"
                      data-testid="partner-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <Button
                    type="button"
                    onClick={handleGenerateNewPassword}
                    variant="outline"
                    className="form-input px-3"
                    title="Gerar nova password"
                  >
                    <RefreshCw size={18} />
                  </Button>
                </div>
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
              data-testid="save-partner-btn"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  A guardar...
                </>
              ) : (
                editingPartner ? "Guardar" : "Criar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Created Dialog */}
      <AlertDialog open={!!createdPassword} onOpenChange={() => setCreatedPassword(null)}>
        <AlertDialogContent className="bg-[#082d32] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Parceiro Criado com Sucesso</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              <p className="mb-4">
                Password inicial gerada. O parceiro deve alterar a password no primeiro login.
              </p>
              <div className="bg-[#0d474f] p-4 rounded-lg">
                <Label className="text-white text-sm mb-2 block">Password</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[#c8f31d] font-mono text-lg bg-[#082d32] px-3 py-2 rounded">
                    {createdPassword}
                  </code>
                  <Button
                    onClick={copyPasswordToClipboard}
                    size="sm"
                    className="btn-primary"
                  >
                    {passwordCopied ? <Check size={18} /> : <Copy size={18} />}
                  </Button>
                </div>
              </div>
              <p className="text-white/40 text-xs mt-3">
                Certifique-se de copiar e partilhar esta password com o parceiro. Não será possível visualizá-la novamente.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setCreatedPassword(null)}
              className="btn-primary btn-primary-glow"
            >
              Fechar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#082d32] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Eliminar Parceiro</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Tem a certeza que pretende eliminar este parceiro? Se tiver vendas associadas, será apenas desativado.
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

      {/* Operators Modal */}
      <Dialog open={operatorsModalOpen} onOpenChange={setOperatorsModalOpen}>
        <DialogContent className="bg-[#082d32] border-white/10 max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-['Manrope']">
              Operadoras - {selectedPartner?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-white/50 text-sm">
                {operators.length} operadora{operators.length !== 1 ? 's' : ''} associada{operators.length !== 1 ? 's' : ''}
              </p>
              <Button
                onClick={openCreateOperatorModal}
                size="sm"
                className="btn-primary btn-primary-glow flex items-center gap-2"
              >
                <Plus size={16} />
                Nova Operadora
              </Button>
            </div>

            {/* Associated Operators */}
            {operators.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white font-medium mb-3 text-sm">Operadoras Associadas</h3>
                <div className="space-y-2">
                  {operators.map((operator) => (
                    <Card key={operator.id} className="card-leiritrix">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <Checkbox
                              checked={true}
                              onCheckedChange={() => handleToggleOperatorAssociation(operator)}
                              className="border-[#c8f31d]"
                            />
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${operator.active ? 'bg-[#c8f31d]/20' : 'bg-white/10'}`}>
                              <Radio size={16} className={operator.active ? 'text-[#c8f31d]' : 'text-white/40'} />
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-medium">{operator.name}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {operator.categories && operator.categories.map((cat) => {
                                  const option = CATEGORY_OPTIONS.find(opt => opt.value === cat);
                                  const Icon = option?.icon || Radio;
                                  return (
                                    <Badge key={cat} className="bg-[#c8f31d]/20 text-[#c8f31d] border border-[#c8f31d]/30 text-xs">
                                      <Icon size={10} className="mr-1" />
                                      {option?.label.split(' - ')[1] || cat}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => openEditOperatorModal(operator)}
                            variant="ghost"
                            size="sm"
                            className="text-white/70 hover:text-[#c8f31d]"
                          >
                            <Edit2 size={16} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Available Operators */}
            {availableOperators.length > 0 && (
              <div>
                <h3 className="text-white font-medium mb-3 text-sm">Operadoras Disponíveis</h3>
                <div className="space-y-2">
                  {availableOperators
                    .slice((currentPage - 1) * operatorsPerPage, currentPage * operatorsPerPage)
                    .map((operator) => (
                      <Card key={operator.id} className="card-leiritrix">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={false}
                              onCheckedChange={() => handleToggleOperatorAssociation(operator)}
                              className="border-white/30"
                            />
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${operator.active ? 'bg-[#c8f31d]/20' : 'bg-white/10'}`}>
                              <Radio size={16} className={operator.active ? 'text-[#c8f31d]' : 'text-white/40'} />
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-medium">{operator.name}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {operator.categories && operator.categories.map((cat) => {
                                  const option = CATEGORY_OPTIONS.find(opt => opt.value === cat);
                                  const Icon = option?.icon || Radio;
                                  return (
                                    <Badge key={cat} className="bg-white/10 text-white/70 border border-white/20 text-xs">
                                      <Icon size={10} className="mr-1" />
                                      {option?.label.split(' - ')[1] || cat}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>

                {/* Pagination */}
                {availableOperators.length > operatorsPerPage && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <Button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      size="sm"
                      variant="ghost"
                      className="text-white/70"
                    >
                      Anterior
                    </Button>
                    <span className="text-white/70 text-sm">
                      Página {currentPage} de {Math.ceil(availableOperators.length / operatorsPerPage)}
                    </span>
                    <Button
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(availableOperators.length / operatorsPerPage), p + 1))}
                      disabled={currentPage >= Math.ceil(availableOperators.length / operatorsPerPage)}
                      size="sm"
                      variant="ghost"
                      className="text-white/70"
                    >
                      Próxima
                    </Button>
                  </div>
                )}
              </div>
            )}

            {operators.length === 0 && availableOperators.length === 0 && (
              <div className="text-center py-8 text-white/50">
                <Radio size={48} className="mx-auto mb-2 text-white/20" />
                <p>Nenhuma operadora disponível</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setOperatorsModalOpen(false)}
              className="btn-secondary"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Operator Modal */}
      <Dialog open={operatorModalOpen} onOpenChange={setOperatorModalOpen}>
        <DialogContent className="bg-[#082d32] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white font-['Manrope']">
              {editingOperator ? "Editar Operadora" : "Nova Operadora"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="form-label">Nome da Operadora *</Label>
              <Input
                value={operatorFormData.name}
                onChange={(e) => setOperatorFormData({ ...operatorFormData, name: e.target.value })}
                className="form-input mt-1"
                placeholder="Nome da operadora"
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
                      onClick={() => handleOperatorCategoryToggle(category.value)}
                    >
                      <Checkbox
                        id={`partner-${category.value}`}
                        checked={operatorFormData.categories.includes(category.value)}
                        onCheckedChange={() => handleOperatorCategoryToggle(category.value)}
                      />
                      <Icon size={16} className="text-[#c8f31d]" />
                      <Label
                        htmlFor={`partner-${category.value}`}
                        className="text-white text-sm cursor-pointer flex-1"
                      >
                        {category.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-[#0d474f]">
              <div className="flex-1">
                <Label className="form-label mb-1">Comissões Visíveis para Backoffice</Label>
                <p className="text-white/50 text-xs">
                  Se ativo, os utilizadores de backoffice podem ver e registar comissões nas vendas desta operadora
                </p>
              </div>
              <Switch
                checked={operatorFormData.commission_visible_to_bo}
                onCheckedChange={(checked) =>
                  setOperatorFormData({ ...operatorFormData, commission_visible_to_bo: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOperatorModalOpen(false)}
              className="btn-secondary"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveOperator}
              disabled={saving}
              className="btn-primary btn-primary-glow"
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

      {/* Delete Operator Confirmation */}
      <AlertDialog open={!!operatorDeleteId} onOpenChange={() => setOperatorDeleteId(null)}>
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
              onClick={handleDeleteOperator}
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
