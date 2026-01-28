import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/App";
import { useNavigate, useParams } from "react-router-dom";
import { salesService } from "@/services/salesService";
import { partnersService } from "@/services/partnersService";
import { usersService } from "@/services/usersService";
import { operatorsService } from "@/services/operatorsService";
import { commissionsService } from "@/services/commissionsService";
import { ModernCard, ModernButton, ModernBadge } from "@/components/modern";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateSelect } from "@/components/ui/date-select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit2,
  Euro,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar as CalendarIcon,
  Clock,
  Zap,
  Sun,
  AlertTriangle,
  Save,
  Loader2,
  ShoppingBag
} from "lucide-react";

const STATUS_MAP = {
  em_negociacao: { label: "Em Negociação", variant: "info" },
  perdido: { label: "Perdido", variant: "danger" },
  pendente: { label: "Pendente", variant: "warning" },
  ativo: { label: "Ativo", variant: "success" },
  anulado: { label: "Anulado", variant: "default" }
};

const CATEGORY_MAP = {
  energia: { label: "Energia", icon: Zap },
  telecomunicacoes: { label: "Telecomunicações", icon: Phone },
  paineis_solares: { label: "Painéis Solares", icon: Sun }
};

const TYPE_MAP = {
  nova_instalacao: "Nova Instalação",
  refid: "Refid (Renovação)"
};

const ENERGY_TYPE_MAP = {
  eletricidade: "Eletricidade",
  gas: "Gás",
  dual: "Dual"
};

const STATUSES = [
  { value: "em_negociacao", label: "Em Negociação" },
  { value: "pendente", label: "Pendente" },
  { value: "ativo", label: "Ativo" },
  { value: "perdido", label: "Perdido" },
  { value: "anulado", label: "Anulado" }
];

const CATEGORIES = [
  { value: "energia", label: "Energia" },
  { value: "telecomunicacoes", label: "Telecomunicações" },
  { value: "paineis_solares", label: "Painéis Solares" }
];

const SALE_TYPES = [
  { value: "NI", label: "NI (Nova Instalação)" },
  { value: "MC", label: "MC (Mudança de Casa)" },
  { value: "Refid", label: "Refid (Refidelização)" },
  { value: "Refid_Acrescimo", label: "Refid com Acréscimo" },
  { value: "Refid_Decrescimo", label: "Refid com Decréscimo" },
  { value: "Up_sell", label: "Up-sell" },
  { value: "Cross_sell", label: "Cross-sell" }
];

const LOYALTY_OPTIONS = [
  { value: "0", label: "Sem fidelização" },
  { value: "12", label: "12 meses" },
  { value: "24", label: "24 meses" },
  { value: "36", label: "36 meses" },
  { value: "outra", label: "Outra" }
];

export default function SaleDetail({ editMode = false }) {
  const { user, isAdminOrBackoffice } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editStatus, setEditStatus] = useState("");
  const [editActiveDate, setEditActiveDate] = useState(null);
  const [editSaleDate, setEditSaleDate] = useState(null);
  const [editNotes, setEditNotes] = useState("");
  const [editReq, setEditReq] = useState("");
  const [editNumeroServico, setEditNumeroServico] = useState("");
  const [editPrt, setEditPrt] = useState("");
  const [editCommissionSeller, setEditCommissionSeller] = useState("");
  const [editCommissionPartner, setEditCommissionPartner] = useState("");
  const [editCommissionBackoffice, setEditCommissionBackoffice] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editStreetAddress, setEditStreetAddress] = useState("");
  const [editPostalCode, setEditPostalCode] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editContractValue, setEditContractValue] = useState("");
  const [editCpe, setEditCpe] = useState("");
  const [editPotencia, setEditPotencia] = useState("");
  const [editCui, setEditCui] = useState("");
  const [editEscalao, setEditEscalao] = useState("");
  const [editSolarPower, setEditSolarPower] = useState("");
  const [editSolarPanelQuantity, setEditSolarPanelQuantity] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSaleType, setEditSaleType] = useState("");
  const [editPartnerId, setEditPartnerId] = useState("");
  const [editOperatorId, setEditOperatorId] = useState("");
  const [editLoyaltyMonths, setEditLoyaltyMonths] = useState("");
  const [editCustomLoyaltyMonths, setEditCustomLoyaltyMonths] = useState("");
  const [partners, setPartners] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [operators, setOperators] = useState([]);
  const [availableSaleTypes, setAvailableSaleTypes] = useState(SALE_TYPES);
  const [allowCommissionOverride, setAllowCommissionOverride] = useState(false);
  const [commissionType, setCommissionType] = useState("manual");
  const [isEditing, setIsEditing] = useState(editMode);
  const [editClientType, setEditClientType] = useState("");
  const [editPortfolioStatus, setEditPortfolioStatus] = useState("");

  const fetchSale = useCallback(async () => {
    try {
      const saleData = await salesService.getSaleById(id);
      setSale(saleData);
      setEditCommissionSeller(saleData.commission_seller?.toString() || "");
      setEditCommissionPartner(saleData.commission_partner?.toString() || "");
      setEditCommissionBackoffice(saleData.commission_backoffice?.toString() || "");
      setEditStatus(saleData.status || "");
      setEditNotes(saleData.notes || "");
      setEditReq(saleData.req || "");
      setEditNumeroServico(saleData.numero_servico || "");
      setEditPrt(saleData.prt || "");
      setEditEmail(saleData.client_email || "");
      setEditAddress(saleData.client_address || "");
      setEditStreetAddress(saleData.street_address || "");
      setEditPostalCode(saleData.postal_code || "");
      setEditCity(saleData.city || "");
      setEditContractValue(saleData.contract_value?.toString() || "");
      setEditCpe(saleData.cpe || "");
      setEditPotencia(saleData.potencia || "");
      setEditCui(saleData.cui || "");
      setEditEscalao(saleData.escalao || "");
      setEditSolarPower(saleData.solar_power?.toString() || "");
      setEditSolarPanelQuantity(saleData.solar_panel_quantity?.toString() || "");
      setEditCategory(saleData.category || "");
      setEditSaleType(saleData.sale_type || "");
      setEditPartnerId(saleData.partner_id || "");
      setEditOperatorId(saleData.operator_id || "");
      setEditClientType(saleData.client_type || "");
      setEditPortfolioStatus(saleData.portfolio_status || "");

      const loyaltyMonths = saleData.loyalty_months?.toString() || "0";
      if (["0", "12", "24", "36"].includes(loyaltyMonths)) {
        setEditLoyaltyMonths(loyaltyMonths);
        setEditCustomLoyaltyMonths("");
      } else {
        setEditLoyaltyMonths("outra");
        setEditCustomLoyaltyMonths(loyaltyMonths);
      }

      if (saleData.active_date) {
        setEditActiveDate(new Date(saleData.active_date));
      }
      if (saleData.sale_date) {
        setEditSaleDate(new Date(saleData.sale_date));
      }
    } catch (error) {
      toast.error("Erro ao carregar venda");
      navigate("/sales");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const fetchPartners = async () => {
    try {
      const partnersData = await partnersService.getPartners();
      setPartners(partnersData);
    } catch (error) {
      console.error("Error fetching partners:", error);
    }
  };

  const fetchSellers = async () => {
    try {
      const sellersData = await usersService.getUsersByRole("vendedor");
      setSellers(sellersData);
    } catch (error) {
      console.error("Error fetching sellers:", error);
    }
  };

  const fetchOperators = async () => {
    try {
      const operatorsData = await operatorsService.getOperators();
      setOperators(operatorsData);
    } catch (error) {
      console.error("Error fetching operators:", error);
    }
  };

  const getFilteredPartners = () => {
    if (!editOperatorId) return partners;
    return partners.filter(partner => {
      return partner.partner_operators && partner.partner_operators.some(po => po.operator_id === editOperatorId);
    });
  };

  const checkCommissionType = async () => {
    if (!editOperatorId || !editPartnerId) {
      setCommissionType("manual");
      return;
    }
    try {
      const settings = await commissionsService.getOperatorSettings(editOperatorId, editPartnerId);
      if (settings && settings.length > 0) {
        const setting = settings.find(s => s.partner_id === editPartnerId) || settings[0];
        setCommissionType(setting.commission_type);

        if (setting.allowed_sale_types && setting.allowed_sale_types.length > 0) {
          const filtered = SALE_TYPES.filter(st => setting.allowed_sale_types.includes(st.value));
          setAvailableSaleTypes(filtered);
        } else {
          setAvailableSaleTypes(SALE_TYPES);
        }
      } else {
        setCommissionType("manual");
        setAvailableSaleTypes(SALE_TYPES);
      }
    } catch (error) {
      console.error("Error checking commission type:", error);
      setCommissionType("manual");
      setAvailableSaleTypes(SALE_TYPES);
    }
  };

  useEffect(() => {
    fetchSale();
    fetchPartners();
    fetchSellers();
    fetchOperators();
  }, [fetchSale]);

  useEffect(() => {
    if (editOperatorId && isEditing) {
      const filteredPartners = getFilteredPartners();
      if (editPartnerId && !filteredPartners.some(p => p.id === editPartnerId)) {
        setEditPartnerId("");
      }

      const operator = operators.find(op => op.id === editOperatorId);
      if (operator?.allowed_sale_types && operator.allowed_sale_types.length > 0) {
        const filtered = SALE_TYPES.filter(st => operator.allowed_sale_types.includes(st.value));
        setAvailableSaleTypes(filtered);
      } else {
        setAvailableSaleTypes(SALE_TYPES);
      }
    }
  }, [editOperatorId, operators, isEditing]);

  useEffect(() => {
    if (editOperatorId && editPartnerId && isEditing) {
      checkCommissionType();
    }
  }, [editOperatorId, editPartnerId, isEditing]);

  const handleSave = async () => {
    if (editStatus === "ativo") {
      if (!editNumeroServico || !editNumeroServico.trim()) {
        toast.error("Número de serviço é obrigatório quando o estado é Ativo");
        return;
      }

      if ((!editPrt || !editPrt.trim()) && (!editReq || !editReq.trim())) {
        toast.error("Pelo menos um dos campos PRT ou Requisição deve estar preenchido quando o estado é Ativo");
        return;
      }
    }

    setSaving(true);
    try {
      const finalLoyaltyMonths = editLoyaltyMonths === "outra"
        ? (editCustomLoyaltyMonths ? parseInt(editCustomLoyaltyMonths) : 0)
        : parseInt(editLoyaltyMonths);

      const payload = {
        status: editStatus,
        notes: editNotes,
        category: editCategory,
        sale_type: editSaleType,
        partner_id: editPartnerId,
        operator_id: editOperatorId,
        loyalty_months: finalLoyaltyMonths,
        active_date: editActiveDate ? editActiveDate.toISOString() : null,
        sale_date: editSaleDate ? editSaleDate.toISOString().split('T')[0] : null,
        req: sale.category === "telecomunicacoes" ? editReq : null,
        numero_servico: editNumeroServico || null,
        prt: editPrt || null,
        client_email: editEmail,
        client_address: editAddress,
        street_address: editStreetAddress,
        postal_code: editPostalCode,
        city: editCity,
        contract_value: editContractValue ? parseFloat(editContractValue) : 0,
        cpe: editCpe || null,
        potencia: editPotencia || null,
        cui: editCui || null,
        escalao: editEscalao || null,
        solar_power: editSolarPower ? parseFloat(editSolarPower) : null,
        solar_panel_quantity: editSolarPanelQuantity ? parseInt(editSolarPanelQuantity) : null,
        client_type: editClientType || null,
        portfolio_status: editClientType === 'empresarial' ? editPortfolioStatus : null
      };

      if (isAdminOrBackoffice && (user.role === 'admin' || sale?.operators?.commission_visible_to_bo)) {
        if (sale.is_backoffice) {
          if (editCommissionBackoffice) {
            const commissionBackofficeValue = parseFloat(editCommissionBackoffice);
            if (!isNaN(commissionBackofficeValue)) {
              payload.commission_backoffice = commissionBackofficeValue;
            }
          }
        } else {
          if (editCommissionSeller) {
            const commissionSellerValue = parseFloat(editCommissionSeller);
            if (!isNaN(commissionSellerValue)) {
              payload.commission_seller = commissionSellerValue;
            }
          }
          if (editCommissionPartner) {
            const commissionPartnerValue = parseFloat(editCommissionPartner);
            if (!isNaN(commissionPartnerValue)) {
              payload.commission_partner = commissionPartnerValue;
            }
          }
        }
      }

      const updated = await salesService.updateSale(id, payload);
      setSale(updated);
      setIsEditing(false);
      toast.success("Venda atualizada com sucesso");
    } catch (error) {
      toast.error("Erro ao atualizar venda");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!sale) {
    return null;
  }

  const status = STATUS_MAP[sale.status];
  const category = CATEGORY_MAP[sale.category];
  const CategoryIcon = category?.icon || Zap;

  // Calculate days until loyalty end
  let daysUntilEnd = null;
  if (sale.loyalty_end_date) {
    const endDate = new Date(sale.loyalty_end_date);
    const now = new Date();
    daysUntilEnd = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
  }

  const isTelecom = sale.category === "telecomunicacoes";
  const isEnergy = sale.category === "energia";

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value || 0);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6" data-testid="sale-detail-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <ModernButton
            variant="ghost"
            onClick={() => navigate(-1)}
            icon={ArrowLeft}
            data-testid="back-btn"
          />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-brand-700 bg-clip-text text-transparent">
                {sale.client_name}
              </h1>
              <ModernBadge variant={status?.variant}>
                {status?.label}
              </ModernBadge>
            </div>
            <p className="text-slate-600 text-sm mt-1">
              ID: <span className="font-mono">{sale.id.slice(0, 8)}</span>
            </p>
          </div>
        </div>
        {!isEditing ? (
          <ModernButton
            onClick={() => setIsEditing(true)}
            variant="primary"
            icon={Edit2}
            data-testid="edit-sale-btn"
          >
            Editar
          </ModernButton>
        ) : (
          <div className="flex gap-2">
            <ModernButton
              onClick={() => setIsEditing(false)}
              variant="secondary"
            >
              Cancelar
            </ModernButton>
            <ModernButton
              onClick={handleSave}
              loading={saving}
              icon={Save}
              variant="primary"
              data-testid="save-btn"
            >
              Guardar
            </ModernButton>
          </div>
        )}
      </div>

      {/* Alert for loyalty ending soon */}
      {daysUntilEnd !== null && daysUntilEnd <= 210 && sale.status === "ativo" && (
        <ModernCard variant="gradient" className="border-l-4 border-l-brand-500" data-testid="loyalty-alert">
          <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Fidelização a terminar</p>
                <p className="text-slate-600 text-sm mt-1">
                  Este contrato termina em <span className="text-brand-600 font-bold">{daysUntilEnd} dias</span>.
                  Inicie a negociação para renovação.
                </p>
              </div>
            </div>
            <ModernButton
              onClick={() => navigate(`/sales/new?refid_from=${sale.id}`)}
              variant="primary"
              className="whitespace-nowrap"
              data-testid="create-refid-btn"
            >
              Inserir Venda Refid
            </ModernButton>
          </div>
        </ModernCard>
      )}

      {/* Edit Form (if editing) */}
      {isEditing && (
        <ModernCard title="Editar Venda" icon={Edit2} variant="gradient" hover={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="form-label">Estado</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="form-input" data-testid="edit-status-select">
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E293B] border-white/10">
                    {STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-slate-900 hover:bg-white/10">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="form-label">Categoria</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger className="form-input" data-testid="edit-category-select">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E293B] border-white/10">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="text-slate-900 hover:bg-white/10">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="form-label">Operadora</Label>
                <Select value={editOperatorId} onValueChange={(value) => {
                  setEditOperatorId(value);
                  setEditPartnerId("");
                }}>
                  <SelectTrigger className="form-input" data-testid="edit-operator-select">
                    <SelectValue placeholder="Selecione a operadora" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E293B] border-white/10">
                    {operators.map((operator) => (
                      <SelectItem key={operator.id} value={operator.id} className="text-slate-900 hover:bg-white/10">
                        {operator.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="form-label">Parceiro</Label>
                <Select
                  value={editPartnerId}
                  onValueChange={setEditPartnerId}
                  disabled={!editOperatorId}
                >
                  <SelectTrigger className="form-input" data-testid="edit-partner-select">
                    <SelectValue placeholder={
                      !editOperatorId
                        ? "Selecione primeiro a operadora"
                        : getFilteredPartners().length === 0
                        ? "Nenhum parceiro com esta operadora"
                        : "Selecione o parceiro"
                    } />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E293B] border-white/10">
                    {getFilteredPartners().map((partner) => (
                      <SelectItem key={partner.id} value={partner.id} className="text-slate-900 hover:bg-white/10">
                        {partner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="form-label">Tipo de Venda</Label>
                <Select value={editSaleType} onValueChange={setEditSaleType}>
                  <SelectTrigger className="form-input" data-testid="edit-sale-type-select">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E293B] border-white/10">
                    {availableSaleTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-slate-900 hover:bg-white/10">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableSaleTypes.length < SALE_TYPES.length && (
                  <p className="text-slate-900/50 text-xs mt-1">
                    Apenas tipos permitidos para esta operadora
                  </p>
                )}
              </div>

              <div>
                <Label className="form-label">Prazo de Fidelização</Label>
                <Select value={editLoyaltyMonths} onValueChange={setEditLoyaltyMonths}>
                  <SelectTrigger className="form-input" data-testid="edit-loyalty-select">
                    <SelectValue placeholder="Selecione o prazo" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E293B] border-white/10">
                    {LOYALTY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-slate-900 hover:bg-white/10">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editLoyaltyMonths === "outra" && (
                <div>
                  <Label className="form-label">Fidelização Personalizada (meses)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editCustomLoyaltyMonths}
                    onChange={(e) => setEditCustomLoyaltyMonths(e.target.value)}
                    className="form-input"
                    placeholder="Insira o número de meses"
                  />
                </div>
              )}

              <div>
                <Label className="form-label">Data de Venda</Label>
                <DateSelect
                  value={editSaleDate}
                  onChange={setEditSaleDate}
                  placeholder="Selecionar data"
                  maxDate={new Date()}
                  data-testid="edit-sale-date"
                />
                <p className="text-slate-900/50 text-xs mt-1">
                  Data usada para contabilização mensal
                </p>
              </div>

              <div>
                <Label className="form-label">Data de Ativação</Label>
                <DateSelect
                  value={editActiveDate}
                  onChange={setEditActiveDate}
                  placeholder="Selecionar data"
                  data-testid="edit-active-date"
                />
              </div>

              {/* REQ field only for telecom */}
              {isTelecom && (
                <div>
                  <Label className="form-label">REQ (Telecomunicações)</Label>
                  <Input
                    value={editReq}
                    onChange={(e) => setEditReq(e.target.value)}
                    className="form-input"
                    placeholder="Número de requisição"
                    data-testid="edit-req-input"
                  />
                </div>
              )}

              {/* Número de Serviço - obrigatório quando ativo */}
              <div>
                <Label className="form-label">
                  Número de Serviço {editStatus === "ativo" && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  value={editNumeroServico}
                  onChange={(e) => setEditNumeroServico(e.target.value)}
                  className="form-input"
                  placeholder="Número do serviço"
                  data-testid="edit-numero-servico-input"
                />
              </div>

              {/* PRT - opcional mas pelo menos PRT ou REQ quando ativo */}
              <div>
                <Label className="form-label">
                  PRT {editStatus === "ativo" && <span className="text-amber-500">(PRT ou Requisição obrigatório)</span>}
                </Label>
                <Input
                  value={editPrt}
                  onChange={(e) => setEditPrt(e.target.value)}
                  className="form-input"
                  placeholder="PRT"
                  data-testid="edit-prt-input"
                />
              </div>

              {/* Commissions - editable by Admin always, by BO if operator allows */}
              {isAdminOrBackoffice && (user.role === 'admin' || sale?.operators?.commission_visible_to_bo) && (
                <>
                  {commissionType === 'automatic' && user.role === 'admin' && (
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-3 bg-cyan-50 border border-cyan-200 rounded-lg p-3">
                        <Checkbox
                          id="allow-commission-override"
                          checked={allowCommissionOverride}
                          onCheckedChange={setAllowCommissionOverride}
                        />
                        <Label htmlFor="allow-commission-override" className="text-slate-900/80 cursor-pointer text-sm">
                          Corrigir/alterar comissão (apenas administradores)
                        </Label>
                      </div>
                    </div>
                  )}
                  {sale.is_backoffice ? (
                    <div>
                      <Label className="form-label flex items-center gap-2">
                        <Euro size={14} className="text-brand-600" />
                        Comissão Backoffice (€)
                        {commissionType === 'automatic' && !allowCommissionOverride && (
                          <span className="text-xs text-slate-900/50">(automático)</span>
                        )}
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editCommissionBackoffice}
                        onChange={(e) => setEditCommissionBackoffice(e.target.value)}
                        className="form-input"
                        placeholder="0.00"
                        data-testid="edit-commission-backoffice-input"
                        readOnly={commissionType === 'automatic' && !allowCommissionOverride}
                        disabled={commissionType === 'automatic' && !allowCommissionOverride && user.role !== 'admin'}
                      />
                    </div>
                  ) : (
                    <>
                      {sellers && sellers.length > 0 && (
                        <div>
                          <Label className="form-label flex items-center gap-2">
                            <Euro size={14} className="text-brand-600" />
                            Comissão Vendedor (€)
                            {commissionType === 'automatic' && !allowCommissionOverride && (
                              <span className="text-xs text-slate-900/50">(automático)</span>
                            )}
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editCommissionSeller}
                            onChange={(e) => setEditCommissionSeller(e.target.value)}
                            className="form-input"
                            placeholder="0.00"
                            data-testid="edit-commission-seller-input"
                            readOnly={commissionType === 'automatic' && !allowCommissionOverride}
                            disabled={commissionType === 'automatic' && !allowCommissionOverride && user.role !== 'admin'}
                          />
                        </div>
                      )}
                      <div>
                        <Label className="form-label flex items-center gap-2">
                          <Euro size={14} className="text-brand-600" />
                          Comissão a receber (€)
                          {commissionType === 'automatic' && !allowCommissionOverride && (
                            <span className="text-xs text-slate-900/50">(automático)</span>
                          )}
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editCommissionPartner}
                          onChange={(e) => setEditCommissionPartner(e.target.value)}
                          className="form-input"
                          placeholder="0.00"
                          data-testid="edit-commission-partner-input"
                          readOnly={commissionType === 'automatic' && !allowCommissionOverride}
                          disabled={commissionType === 'automatic' && !allowCommissionOverride && user.role !== 'admin'}
                        />
                      </div>
                    </>
                  )}
                </>
              )}
              {user.role === 'backoffice' && sale?.operators && !sale.operators.commission_visible_to_bo && (
                <div className="md:col-span-2">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <p className="text-slate-900/80 text-sm flex items-center gap-2">
                      <AlertTriangle size={16} />
                      Operadora sem comissão a contabilizar
                    </p>
                  </div>
                </div>
              )}

              <div>
                <Label className="form-label">Email do Cliente</Label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="form-input"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <Label className="form-label">Tipo de Cliente</Label>
                <Select value={editClientType} onValueChange={setEditClientType}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E293B] border-white/10">
                    <SelectItem value="residencial" className="text-slate-900 hover:bg-white/10">
                      Residencial
                    </SelectItem>
                    <SelectItem value="empresarial" className="text-slate-900 hover:bg-white/10">
                      Empresarial
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editClientType === 'empresarial' && (
                <div>
                  <Label className="form-label">Encarteiramento</Label>
                  <Select value={editPortfolioStatus} onValueChange={setEditPortfolioStatus}>
                    <SelectTrigger className="form-input">
                      <SelectValue placeholder="Selecione o encarteiramento" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E293B] border-white/10">
                      <SelectItem value="novo" className="text-slate-900 hover:bg-white/10">
                        Novo
                      </SelectItem>
                      <SelectItem value="cliente_carteira" className="text-slate-900 hover:bg-white/10">
                        Cliente Carteira
                      </SelectItem>
                      <SelectItem value="fora_carteira" className="text-slate-900 hover:bg-white/10">
                        Fora Carteira
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label className="form-label">Valor do Contrato (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editContractValue}
                  onChange={(e) => setEditContractValue(e.target.value)}
                  className="form-input"
                  placeholder="0.00"
                />
              </div>

              <div className="md:col-span-2">
                <Label className="form-label">Morada Completa</Label>
                <Input
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="form-input"
                  placeholder="Morada completa"
                />
              </div>

              <div>
                <Label className="form-label">Rua / Endereço</Label>
                <Input
                  value={editStreetAddress}
                  onChange={(e) => setEditStreetAddress(e.target.value)}
                  className="form-input"
                  placeholder="Rua, nº"
                />
              </div>

              <div>
                <Label className="form-label">Código Postal</Label>
                <Input
                  value={editPostalCode}
                  onChange={(e) => setEditPostalCode(e.target.value)}
                  className="form-input"
                  placeholder="0000-000"
                />
              </div>

              <div>
                <Label className="form-label">Cidade</Label>
                <Input
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="form-input"
                  placeholder="Cidade"
                />
              </div>

              {sale.category === "energia" && (
                <>
                  {(sale.energy_type === "eletricidade" || sale.energy_type === "dual") && (
                    <>
                      <div>
                        <Label className="form-label">CPE</Label>
                        <Input
                          value={editCpe}
                          onChange={(e) => setEditCpe(e.target.value)}
                          className="form-input"
                          placeholder="PT0002..."
                        />
                      </div>
                      <div>
                        <Label className="form-label">Potência (kVA)</Label>
                        <Input
                          value={editPotencia}
                          onChange={(e) => setEditPotencia(e.target.value)}
                          className="form-input"
                          placeholder="6.9"
                        />
                      </div>
                    </>
                  )}
                  {(sale.energy_type === "gas" || sale.energy_type === "dual") && (
                    <>
                      <div>
                        <Label className="form-label">CUI</Label>
                        <Input
                          value={editCui}
                          onChange={(e) => setEditCui(e.target.value)}
                          className="form-input"
                          placeholder="CUI"
                        />
                      </div>
                      <div>
                        <Label className="form-label">Escalão</Label>
                        <Input
                          value={editEscalao}
                          onChange={(e) => setEditEscalao(e.target.value)}
                          className="form-input"
                          placeholder="Escalão"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {sale.category === "paineis_solares" && (
                <>
                  <div>
                    <Label className="form-label">CPE</Label>
                    <Input
                      value={editCpe}
                      onChange={(e) => setEditCpe(e.target.value)}
                      className="form-input"
                      placeholder="PT0002..."
                    />
                  </div>
                  <div>
                    <Label className="form-label">Potência Instalada (kW)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editSolarPower}
                      onChange={(e) => setEditSolarPower(e.target.value)}
                      className="form-input"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label className="form-label">Quantidade de Painéis</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editSolarPanelQuantity}
                      onChange={(e) => setEditSolarPanelQuantity(e.target.value)}
                      className="form-input"
                      placeholder="0"
                    />
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <Label className="form-label">Notas</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="form-input min-h-24"
                  placeholder="Observações..."
                  data-testid="edit-notes-input"
                />
              </div>
            </div>
        </ModernCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Info */}
        <ModernCard title="Dados do Cliente" icon={User} variant="gradient" hover={false} className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-slate-600 text-sm mb-1">Nome</p>
                <p className="text-slate-900 font-medium">{sale.client_name}</p>
              </div>
              <div>
                <p className="text-slate-600 text-sm mb-1">NIF</p>
                <p className="text-slate-900 font-mono">{sale.client_nif || "-"}</p>
              </div>
              <div>
                <p className="text-slate-600 text-sm mb-1">Tipo de Cliente</p>
                <p className="text-slate-900">
                  {sale.client_type === 'residencial' ? 'Residencial' :
                   sale.client_type === 'empresarial' ? 'Empresarial' : '-'}
                </p>
              </div>
              {sale.client_type === 'empresarial' && (
                <div>
                  <p className="text-slate-600 text-sm mb-1">Encarteiramento</p>
                  <p className="text-slate-900">
                    {sale.portfolio_status === 'novo' ? 'Novo' :
                     sale.portfolio_status === 'cliente_carteira' ? 'Cliente Carteira' :
                     sale.portfolio_status === 'fora_carteira' ? 'Fora Carteira' : '-'}
                  </p>
                </div>
              )}
              <div>
                <p className="text-slate-600 text-sm mb-1 flex items-center gap-1">
                  <Mail size={14} /> Email
                </p>
                <p className="text-slate-900">{sale.client_email || "-"}</p>
              </div>
              <div>
                <p className="text-slate-600 text-sm mb-1 flex items-center gap-1">
                  <Phone size={14} /> Telefone
                </p>
                <p className="text-slate-900">{sale.client_phone || "-"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-slate-600 text-sm mb-1 flex items-center gap-1">
                  <MapPin size={14} /> Morada
                </p>
                <p className="text-slate-900">{sale.client_address || "-"}</p>
              </div>
            </div>
        </ModernCard>

        {/* Values & Commission */}
        <ModernCard title="Valores" icon={Euro} variant="gradient" hover={false}>
            {/* Mensalidade - apenas para Telecomunicações */}
            {isTelecom && (
              <div>
                <p className="text-slate-600 text-sm mb-1">Mensalidade Contratada</p>
                <p className="text-2xl font-bold text-brand-600 font-mono">
                  {formatCurrency(sale.contract_value)}
                </p>
              </div>
            )}

            {/* Commissions - visible to Admin always, to BO if operator allows */}
            {user.role === 'admin' || sale.operators?.commission_visible_to_bo ? (
              <>
                {sale.is_backoffice ? (
                  <div>
                    <p className="text-slate-600 text-sm mb-1">Comissão Backoffice</p>
                    {sale.commission_backoffice !== null && sale.commission_backoffice !== undefined ? (
                      <p className="text-2xl font-bold text-brand-600 font-mono">
                        {formatCurrency(sale.commission_backoffice)}
                      </p>
                    ) : (
                      <p className="text-slate-900/40">Não definida</p>
                    )}
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-slate-600 text-sm mb-1">Comissão Vendedor</p>
                      {sale.commission_seller !== null && sale.commission_seller !== undefined ? (
                        <p className="text-2xl font-bold text-green-600 font-mono">
                          {formatCurrency(sale.commission_seller)}
                        </p>
                      ) : (
                        <p className="text-slate-900/40">Não definida</p>
                      )}
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm mb-1">Comissão a receber</p>
                      {sale.commission_partner !== null && sale.commission_partner !== undefined ? (
                        <p className="text-2xl font-bold text-green-600 font-mono">
                          {formatCurrency(sale.commission_partner)}
                        </p>
                      ) : (
                        <p className="text-slate-900/40">Não definida</p>
                      )}
                    </div>
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-slate-600 text-sm mb-1">Comissão Total</p>
                      <p className="text-xl font-bold text-brand-600 font-mono">
                        {formatCurrency((sale.commission_seller || 0) + (sale.commission_partner || 0))}
                      </p>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-slate-900/80 text-sm flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Operadora sem comissão a contabilizar
                </p>
              </div>
            )}
        </ModernCard>
      </div>

      {/* Contract Details */}
      <ModernCard title="Detalhes do Contrato" icon={FileText} variant="gradient" hover={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-slate-600 text-sm mb-1 flex items-center gap-1">
                <CalendarIcon size={14} /> Data de Venda
              </p>
              <p className="text-slate-900">
                {sale.sale_date ? new Date(sale.sale_date).toLocaleDateString('pt-PT') : "-"}
              </p>
            </div>
            <div>
              <p className="text-slate-600 text-sm mb-1">Categoria</p>
              <div className="flex items-center gap-2">
                <CategoryIcon size={18} className="text-brand-600" />
                <p className="text-slate-900">{category?.label}</p>
              </div>
            </div>
            <div>
              <p className="text-slate-600 text-sm mb-1">Tipo</p>
              <p className="text-slate-900">{TYPE_MAP[sale.sale_type] || "-"}</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm mb-1">Parceiro</p>
              <p className="text-slate-900">{sale.partner_name}</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm mb-1">Vendedor</p>
              <p className="text-slate-900">{sale.seller_name}</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm mb-1 flex items-center gap-1">
                <Clock size={14} /> Prazo Fidelização
              </p>
              <p className="text-slate-900">{sale.loyalty_months ? `${sale.loyalty_months} meses` : "-"}</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm mb-1 flex items-center gap-1">
                <CalendarIcon size={14} /> Data de Ativação
              </p>
              <p className="text-slate-900">
                {sale.active_date ? new Date(sale.active_date).toLocaleDateString('pt-PT') : "-"}
              </p>
            </div>
            <div>
              <p className="text-slate-600 text-sm mb-1">Fim da Fidelização</p>
              <p className="text-slate-900">
                {sale.loyalty_end_date ? new Date(sale.loyalty_end_date).toLocaleDateString('pt-PT') : "-"}
              </p>
            </div>
            <div>
              <p className="text-slate-600 text-sm mb-1">Data de Criação</p>
              <p className="text-slate-900">
                {new Date(sale.created_at).toLocaleDateString('pt-PT')}
              </p>
            </div>

            {/* Telecom REQ */}
            {isTelecom && sale.req && (
              <div>
                <p className="text-slate-600 text-sm mb-1">REQ</p>
                <p className="text-slate-900 font-mono">{sale.req}</p>
              </div>
            )}
          </div>

          {/* Energy Details */}
          {isEnergy && sale.energy_type && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <h4 className="text-slate-900 font-medium mb-4 flex items-center gap-2">
                <Zap size={16} className="text-brand-600" />
                Dados de Energia
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <p className="text-slate-600 text-sm mb-1">Tipo de Energia</p>
                  <p className="text-slate-900">{ENERGY_TYPE_MAP[sale.energy_type]}</p>
                </div>
                {(sale.energy_type === "eletricidade" || sale.energy_type === "dual") && (
                  <>
                    <div>
                      <p className="text-slate-600 text-sm mb-1">CPE</p>
                      <p className="text-slate-900 font-mono">{sale.cpe || "-"}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm mb-1">Potência</p>
                      <p className="text-slate-900">{sale.potencia ? `${sale.potencia} kVA` : "-"}</p>
                    </div>
                  </>
                )}
                {(sale.energy_type === "gas" || sale.energy_type === "dual") && (
                  <>
                    <div>
                      <p className="text-slate-600 text-sm mb-1">CUI</p>
                      <p className="text-slate-900 font-mono">{sale.cui || "-"}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm mb-1">Escalão</p>
                      <p className="text-slate-900">{sale.escalao || "-"}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {sale.notes && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-slate-600 text-sm mb-2">Notas</p>
              <p className="text-slate-900/80 whitespace-pre-wrap">{sale.notes}</p>
            </div>
          )}
      </ModernCard>
    </div>
  );
}
