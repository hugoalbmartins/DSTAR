import { useState, useEffect } from "react";
import { useAuth } from "@/App";
import { useNavigate, useSearchParams } from "react-router-dom";
import { salesService } from "@/services/salesService";
import { partnersService } from "@/services/partnersService";
import { operatorsService } from "@/services/operatorsService";
import { usersService } from "@/services/usersService";
import { commissionsService } from "@/services/commissionsService";
import { operatorClientCategoriesService } from "@/services/operatorClientCategoriesService";
import { clientsService } from "@/services/clientsService";
import { addressesService } from "@/services/addressesService";
import { servicesService } from "@/services/servicesService";
import { ModernCard, ModernButton, ModernBadge } from "@/components/modern";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateSelect } from "@/components/ui/date-select";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2, User, FileText, Zap, ArrowRight, MapPin, Sun } from "lucide-react";

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

const ENERGY_TYPES = [
  { value: "eletricidade", label: "Eletricidade" },
  { value: "gas", label: "Gás" },
  { value: "dual", label: "Dual (Eletricidade + Gás)" }
];

const ENERGY_TYPE_MAP = {
  eletricidade: "Eletricidade",
  gas: "Gás",
  dual: "Dual (Eletricidade + Gás)"
};

const POTENCIAS = [
  "1.15", "2.3", "3.45", "4.6", "5.75", "6.9", "10.35", "13.8",
  "17.25", "20.7", "27.6", "34.5", "41.4", "Outra"
];

const ESCALOES_GAS = [
  "Escalão 1", "Escalão 2", "Escalão 3", "Escalão 4"
];

export default function SaleForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [checkingNIF, setCheckingNIF] = useState(false);
  const [partners, setPartners] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [operators, setOperators] = useState([]);
  const [clientCategories, setClientCategories] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [loadingOperators, setLoadingOperators] = useState(false);

  const [nifInput, setNifInput] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [previousSales, setPreviousSales] = useState([]);
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [selectedSaleFlow, setSelectedSaleFlow] = useState(null);
  const [selectedPreviousAddress, setSelectedPreviousAddress] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [commissionType, setCommissionType] = useState("automatic");
  const [calculatingCommission, setCalculatingCommission] = useState(false);
  const [availableSaleTypes, setAvailableSaleTypes] = useState(SALE_TYPES);
  const [currentClient, setCurrentClient] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);

  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    client_nif: "",
    street_address: "",
    postal_code: "",
    city: "",
    category: "",
    sale_type: "",
    partner_id: "",
    operator_id: "",
    client_category_id: "",
    seller_id: "none",
    contract_value: "",
    loyalty_months: "",
    custom_loyalty_months: "",
    notes: "",
    energy_type: "",
    cpe: "",
    potencia: "",
    cui: "",
    escalao: "",
    sale_date: new Date(),
    previous_monthly_value: "",
    new_monthly_value: "",
    commission_seller: "",
    commission_partner: "",
    client_type: "",
    portfolio_status: "",
    solar_power: "",
    solar_panel_quantity: ""
  });

  useEffect(() => {
    fetchPartners();
    fetchSellers();
    fetchOperators();

    const clientId = searchParams.get('clientId');
    if (clientId) {
      loadClientData(clientId);
    }
  }, [searchParams]);

  const loadClientData = async (clientId) => {
    try {
      const client = await clientsService.getClientById(clientId);
      if (client) {
        setNifInput(client.nif);
        setCurrentClient(client);
        setFormData(prev => ({
          ...prev,
          client_name: client.name,
          client_email: client.email || '',
          client_phone: client.phone || '',
          client_nif: client.nif,
          client_type: client.client_type || 'residencial',
          portfolio_status: client.portfolio_status || ''
        }));
        setShowForm(true);
      }
    } catch (error) {
      console.error('Error loading client data:', error);
      toast.error('Erro ao carregar dados do cliente');
    }
  };

  const fetchPartners = async () => {
    try {
      const partnersData = await partnersService.getPartners();
      setPartners(partnersData);
    } catch (error) {
      console.error("Error fetching partners:", error);
      toast.error("Erro ao carregar parceiros");
    } finally {
      setLoadingPartners(false);
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
    setLoadingOperators(true);
    try {
      const operatorsData = await operatorsService.getOperators();
      setOperators(operatorsData);
    } catch (error) {
      console.error("Error fetching operators:", error);
      toast.error("Erro ao carregar operadoras");
    } finally {
      setLoadingOperators(false);
    }
  };

  const fetchPartnersByOperator = async (operatorId) => {
    if (!operatorId) {
      return [];
    }
    try {
      const allPartners = await partnersService.getPartners();
      const filteredPartners = allPartners.filter(partner => {
        return partner.partner_operators && partner.partner_operators.some(po => po.operator_id === operatorId);
      });
      return filteredPartners;
    } catch (error) {
      console.error("Error fetching partners by operator:", error);
      return [];
    }
  };

  const getFilteredPartners = () => {
    if (!formData.operator_id) return partners;
    return partners.filter(partner => {
      return partner.partner_operators && partner.partner_operators.some(po => po.operator_id === formData.operator_id);
    });
  };

  const getFilteredOperators = () => {
    if (!formData.category) return operators;

    const requiredCategories = [];

    if (formData.category === 'energia') {
      if (formData.energy_type === 'eletricidade') {
        requiredCategories.push('energia_eletricidade');
      } else if (formData.energy_type === 'gas') {
        requiredCategories.push('energia_gas');
      } else if (formData.energy_type === 'dual') {
        requiredCategories.push('energia_eletricidade', 'energia_gas');
      }
    } else if (formData.category === 'telecomunicacoes') {
      requiredCategories.push('telecomunicacoes');
    } else if (formData.category === 'paineis_solares') {
      requiredCategories.push('paineis_solares');
    }

    if (requiredCategories.length === 0) return [];

    const filtered = operators.filter(op => {
      if (!op.categories || op.categories.length === 0) return false;

      if (formData.category === 'energia' && formData.energy_type === 'dual') {
        return requiredCategories.every(cat => op.categories.includes(cat));
      }

      return requiredCategories.some(cat => op.categories.includes(cat));
    });

    return filtered;
  };

  useEffect(() => {
    if (formData.operator_id) {
      fetchPartnersByOperator(formData.operator_id).then(filteredPartners => {
        if (formData.partner_id && !filteredPartners.some(p => p.id === formData.partner_id)) {
          handleChange("partner_id", "");
        }
      });

      const operator = operators.find(op => op.id === formData.operator_id);
      if (operator?.allowed_sale_types && operator.allowed_sale_types.length > 0) {
        const filtered = SALE_TYPES.filter(st => operator.allowed_sale_types.includes(st.value));
        setAvailableSaleTypes(filtered);
      } else {
        setAvailableSaleTypes(SALE_TYPES);
      }
    }
  }, [formData.operator_id, operators]);

  useEffect(() => {
    const filtered = getFilteredOperators();
    const currentOperatorStillValid = filtered.some(op => op.id === formData.operator_id);
    if (!currentOperatorStillValid && formData.operator_id) {
      handleChange("operator_id", "");
    }
  }, [formData.category, formData.energy_type]);

  useEffect(() => {
    if (formData.operator_id && formData.partner_id) {
      checkCommissionType();
    }
  }, [formData.operator_id, formData.partner_id]);

  useEffect(() => {
    if (commissionType === "automatic" && shouldCalculateCommission()) {
      calculateCommission();
    }
  }, [
    formData.sale_type,
    formData.contract_value,
    formData.loyalty_months,
    formData.custom_loyalty_months,
    formData.potencia,
    commissionType
  ]);

  const checkCommissionType = async () => {
    try {
      const settings = await commissionsService.getOperatorSettings(
        formData.operator_id,
        formData.partner_id
      );

      if (settings && settings.length > 0) {
        const setting = settings.find(s => s.partner_id === formData.partner_id) || settings[0];
        setCommissionType(setting.commission_type);

        if (setting.allowed_sale_types && setting.allowed_sale_types.length > 0) {
          const filtered = SALE_TYPES.filter(st => setting.allowed_sale_types.includes(st.value));
          setAvailableSaleTypes(filtered);
        } else {
          setAvailableSaleTypes(SALE_TYPES);
        }

        if (setting.commission_type === "automatic") {
          calculateCommission();
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

  const shouldCalculateCommission = () => {
    if (!formData.sale_type || !formData.operator_id || !formData.partner_id) {
      return false;
    }

    if (['Up_sell', 'Cross_sell'].includes(formData.sale_type)) {
      return formData.previous_monthly_value && formData.new_monthly_value;
    }

    return formData.contract_value;
  };

  const calculateCommission = async () => {
    if (!shouldCalculateCommission()) return;

    setCalculatingCommission(true);
    try {
      const loyaltyMonths = formData.loyalty_months === "outra"
        ? parseInt(formData.custom_loyalty_months) || 0
        : parseInt(formData.loyalty_months) || 0;

      const rule = await commissionsService.findApplicableRule({
        operatorId: formData.operator_id,
        partnerId: formData.partner_id,
        saleType: formData.sale_type,
        clientNif: formData.client_nif,
        loyaltyMonths: loyaltyMonths,
        clientCategoryId: formData.client_category_id,
        clientType: formData.client_type,
        portfolioStatus: formData.portfolio_status
      });

      if (!rule || rule.isManual) {
        setCommissionType("manual");
        return;
      }

      const commissions = await commissionsService.calculateCommission({
        rule,
        monthlyValue: parseFloat(formData.contract_value) || 0,
        previousMonthlyValue: parseFloat(formData.previous_monthly_value) || 0,
        newMonthlyValue: parseFloat(formData.new_monthly_value) || 0,
        saleType: formData.sale_type,
        quantity: 1,
        potencia: formData.potencia
      });

      if (['Up_sell', 'Cross_sell'].includes(formData.sale_type)) {
        const previousValue = parseFloat(formData.previous_monthly_value) || 0;
        const newValue = parseFloat(formData.new_monthly_value) || 0;

        if (previousValue >= newValue) {
          setAlertMessage(
            "Atenção: A mensalidade anterior é superior ou igual à nova mensalidade. " +
            "A comissão foi definida como 0. Pode alterar manualmente se necessário."
          );
          setShowAlert(true);
          setFormData(prev => ({
            ...prev,
            commission_seller: "0",
            commission_partner: "0"
          }));
          return;
        }
      }

      setFormData(prev => ({
        ...prev,
        commission_seller: commissions.seller.toString(),
        commission_partner: commissions.partner.toString()
      }));

    } catch (error) {
      console.error("Error calculating commission:", error);
    } finally {
      setCalculatingCommission(false);
    }
  };

  const handleMonthlyValueBlur = () => {
    if (!['Up_sell', 'Cross_sell'].includes(formData.sale_type)) {
      return;
    }

    const previousValue = parseFloat(formData.previous_monthly_value);
    const newValue = parseFloat(formData.new_monthly_value);

    if (!formData.previous_monthly_value || !formData.new_monthly_value) {
      return;
    }

    if (isNaN(previousValue) || isNaN(newValue)) {
      return;
    }

    if (commissionType === "automatic") {
      calculateCommission();
    }
  };

  const handleCheckNIF = async () => {
    if (!nifInput) {
      toast.error("Insira um NIF");
      return;
    }

    if (nifInput.length !== 9 || !/^\d+$/.test(nifInput)) {
      toast.error("O NIF deve ter 9 dígitos numéricos");
      return;
    }

    setCheckingNIF(true);
    try {
      const client = await clientsService.getClientByNIF(nifInput);

      if (client) {
        setCurrentClient(client);
        const services = await servicesService.getServicesByClientId(client.id);
        setAvailableServices(services || []);

        const sales = await salesService.getSalesByNIF(nifInput);
        setPreviousSales(sales);

        if (services.length > 0) {
          setShowTypeDialog(true);
        } else {
          handleChange("client_nif", nifInput);
          handleChange("client_name", client.name);
          handleChange("client_email", client.email || "");
          handleChange("client_phone", client.phone || "");
          handleChange("client_type", client.client_type);
          handleChange("portfolio_status", client.portfolio_status || "");
          setShowForm(true);
        }
      } else {
        const sales = await salesService.getSalesByNIF(nifInput);
        if (sales.length > 0) {
          setPreviousSales(sales);
          setShowTypeDialog(true);
        } else {
          handleChange("client_nif", nifInput);
          setShowForm(true);
        }
      }
    } catch (error) {
      console.error("Error checking NIF:", error);
      toast.error("Erro ao verificar NIF");
    } finally {
      setCheckingNIF(false);
    }
  };

  const handleSaleTypeSelection = (type) => {
    setSelectedSaleFlow(type);
    setShowTypeDialog(false);

    if (type === "NI") {
      handleNovaVenda();
    } else {
      if (availableServices.length > 0) {
        setShowServiceDialog(true);
      } else {
        setShowAddressDialog(true);
      }
    }
  };

  const handleNovaVenda = () => {
    const latestSale = previousSales[0];
    setFormData({
      ...formData,
      client_name: latestSale.client_name || "",
      client_email: latestSale.client_email || "",
      client_phone: latestSale.client_phone || "",
      client_nif: nifInput,
      street_address: "",
      postal_code: "",
      city: "",
    });
    setShowForm(true);
  };

  const handleMCSelection = async (sale) => {
    setSelectedPreviousAddress(sale);
    setShowAddressDialog(false);

    const validSeller = sellers.find(s => s.id === sale.seller_id && s.active);

    const newFormData = {
      ...formData,
      client_name: sale.client_name || "",
      client_email: sale.client_email || "",
      client_phone: sale.client_phone || "",
      client_nif: nifInput,
      category: sale.category || "",
      sale_type: selectedSaleFlow,
      partner_id: sale.partner_id || "",
      operator_id: sale.operator_id || "",
      seller_id: validSeller ? sale.seller_id : "none",
      energy_type: sale.energy_type || "",
    };

    if (selectedSaleFlow === "MC") {
      newFormData.street_address = "";
      newFormData.postal_code = "";
      newFormData.city = "";

      try {
        await salesService.updateSale(sale.id, { loyalty_months: 0 });
      } catch (error) {
        console.error("Error updating previous sale loyalty:", error);
      }
    } else {
      newFormData.street_address = sale.street_address || "";
      newFormData.postal_code = sale.postal_code || "";
      newFormData.city = sale.city || "";

      if (selectedSaleFlow.startsWith('Refid') || ['Up_sell', 'Cross_sell'].includes(selectedSaleFlow)) {
        newFormData.cpe = sale.cpe || "";
        newFormData.potencia = sale.potencia || "";
        newFormData.cui = sale.cui || "";
        newFormData.escalao = sale.escalao || "";

        try {
          await salesService.updateSale(sale.id, { loyalty_months: 0 });
        } catch (error) {
          console.error("Error updating previous sale loyalty:", error);
        }
      }

      if (['Up_sell', 'Cross_sell'].includes(selectedSaleFlow)) {
        newFormData.previous_monthly_value = sale.contract_value || "";
      }
    }

    setFormData(newFormData);
    setShowForm(true);
  };

  const handleRefidSelection = handleMCSelection;

  const handleServiceSelection = async (service) => {
    setSelectedService(service);
    setShowServiceDialog(false);

    const address = service.address;
    const operator = service.operator;

    const validSeller = sellers.find(s => s.id === currentClient?.id && s.active);

    const serviceTypeMap = {
      'energia_eletricidade': 'eletricidade',
      'energia_gas': 'gas',
      'energia_dual': 'dual'
    };

    const newFormData = {
      ...formData,
      client_name: currentClient?.name || "",
      client_email: currentClient?.email || "",
      client_phone: currentClient?.phone || "",
      client_nif: nifInput,
      client_type: currentClient?.client_type || "",
      portfolio_status: currentClient?.portfolio_status || "",
      street_address: address?.street_address || "",
      postal_code: address?.postal_code || "",
      city: address?.city || "",
      operator_id: operator?.id || "",
      sale_type: selectedSaleFlow,
      cpe: service.cpe || "",
      cui: service.cui || "",
      potencia: service.potencia || "",
      escalao: service.escalao || "",
    };

    if (service.service_type.startsWith('energia_')) {
      newFormData.category = 'energia';
      newFormData.energy_type = serviceTypeMap[service.service_type] || '';
    } else if (service.service_type === 'telecomunicacoes') {
      newFormData.category = 'telecomunicacoes';
    } else if (service.service_type === 'paineis_solares') {
      newFormData.category = 'paineis_solares';
    }

    if (selectedSaleFlow === "MC") {
      newFormData.street_address = "";
      newFormData.postal_code = "";
      newFormData.city = "";

      if (service.loyalty_months > 0) {
        try {
          await servicesService.updateService(service.id, { loyalty_months: 0, loyalty_end_date: null });
        } catch (error) {
          console.error("Error updating service loyalty:", error);
        }
      }
    } else if (selectedSaleFlow.startsWith('Refid') || ['Up_sell', 'Cross_sell'].includes(selectedSaleFlow)) {
      if (service.loyalty_months > 0) {
        try {
          await servicesService.updateService(service.id, { loyalty_months: 0, loyalty_end_date: null });
        } catch (error) {
          console.error("Error updating service loyalty:", error);
        }
      }

      if (['Up_sell', 'Cross_sell'].includes(selectedSaleFlow)) {
        const relatedSale = previousSales.find(s => s.service_id === service.id);
        if (relatedSale) {
          newFormData.previous_monthly_value = relatedSale.contract_value || "";
        }
      }
    }

    setFormData(newFormData);
    setShowForm(true);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOperatorChange = async (operatorId) => {
    setFormData(prev => ({ ...prev, operator_id: operatorId, client_category_id: "" }));

    const operator = operators.find(o => o.id === operatorId);
    setSelectedOperator(operator);

    if (operator?.has_client_categories) {
      try {
        const categories = await operatorClientCategoriesService.getCategories(operatorId);
        setClientCategories(categories);
      } catch (error) {
        console.error("Error fetching client categories:", error);
        setClientCategories([]);
      }
    } else {
      setClientCategories([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.client_name || !formData.category || !formData.partner_id) {
      toast.error("Preencha os campos obrigatórios (Nome, Categoria, Parceiro)");
      return;
    }

    if (!formData.operator_id) {
      toast.error("Selecione uma operadora");
      return;
    }

    if (selectedOperator?.has_client_categories && !formData.client_category_id) {
      toast.error("Selecione a categoria de cliente");
      return;
    }

    if (!formData.client_phone && !formData.client_email) {
      toast.error("Preencha pelo menos um contacto (telefone ou email)");
      return;
    }

    if (!formData.client_nif) {
      toast.error("O NIF é obrigatório");
      return;
    }

    if (formData.client_nif.length !== 9 || !/^\d+$/.test(formData.client_nif)) {
      toast.error("O NIF deve ter 9 dígitos numéricos");
      return;
    }

    if (!formData.street_address || !formData.postal_code || !formData.city) {
      toast.error("Todos os campos de morada são obrigatórios (Rua, Código Postal, Localidade)");
      return;
    }

    if (!/^\d{4}-\d{3}$/.test(formData.postal_code)) {
      toast.error("Código postal deve estar no formato 0000-000");
      return;
    }

    if (formData.category === "energia") {
      if (!formData.energy_type) {
        toast.error("Selecione o tipo de energia");
        return;
      }

      if ((formData.energy_type === "eletricidade" || formData.energy_type === "dual") && (!formData.cpe || !formData.potencia)) {
        toast.error("CPE e Potência são obrigatórios para eletricidade");
        return;
      }

      if ((formData.energy_type === "gas" || formData.energy_type === "dual") && (!formData.cui || !formData.escalao)) {
        toast.error("CUI e Escalão são obrigatórios para gás");
        return;
      }
    }

    if (['Up_sell', 'Cross_sell'].includes(formData.sale_type)) {
      if (!formData.previous_monthly_value || !formData.new_monthly_value) {
        toast.error("Mensalidade anterior e nova são obrigatórias para Up-sell e Cross-sell");
        return;
      }
    }

    if (formData.loyalty_months === "outra" && !formData.custom_loyalty_months) {
      toast.error("Insira o prazo de fidelização personalizado");
      return;
    }

    setLoading(true);

    try {
      const finalLoyaltyMonths = formData.loyalty_months === "outra"
        ? parseInt(formData.custom_loyalty_months) || 0
        : parseInt(formData.loyalty_months) || 0;

      let client = currentClient;
      if (!client) {
        try {
          client = await clientsService.createClient({
            name: formData.client_name,
            nif: formData.client_nif,
            email: formData.client_email || null,
            phone: formData.client_phone || null,
            client_type: formData.client_type || 'residencial',
            portfolio_status: formData.portfolio_status || null
          });
        } catch (error) {
          if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
            client = await clientsService.getClientByNIF(formData.client_nif);
          } else {
            throw error;
          }
        }
      }

      let address = null;
      if (selectedService && selectedSaleFlow !== "MC") {
        address = { id: selectedService.address_id };
      } else {
        address = await addressesService.createAddress({
          client_id: client.id,
          street_address: formData.street_address,
          postal_code: formData.postal_code,
          city: formData.city,
          is_active: true
        });
      }

      let service = selectedService;
      if (!service || selectedSaleFlow === "MC" || selectedSaleFlow === "NI") {
        const serviceTypeMap = {
          'eletricidade': 'energia_eletricidade',
          'gas': 'energia_gas',
          'dual': 'energia_dual'
        };

        let serviceType = formData.category;
        if (formData.category === 'energia') {
          serviceType = serviceTypeMap[formData.energy_type] || 'energia_eletricidade';
        } else if (formData.category === 'telecomunicacoes') {
          serviceType = 'telecomunicacoes';
        } else if (formData.category === 'paineis_solares') {
          serviceType = 'paineis_solares';
        }

        service = await servicesService.createService({
          address_id: address.id,
          service_type: serviceType,
          operator_id: formData.operator_id || null,
          cpe: formData.cpe || null,
          potencia: formData.potencia || null,
          cui: formData.cui || null,
          escalao: formData.escalao || null,
          req: formData.req || null,
          loyalty_months: finalLoyaltyMonths,
          is_active: true
        });
      }

      const payload = {
        client_id: client.id,
        address_id: address.id,
        service_id: service.id,
        client_name: formData.client_name,
        client_email: formData.client_email || null,
        client_phone: formData.client_phone || null,
        client_nif: formData.client_nif,
        street_address: formData.street_address,
        postal_code: formData.postal_code,
        city: formData.city,
        category: formData.category,
        sale_type: formData.sale_type || null,
        partner_id: formData.partner_id || null,
        operator_id: formData.operator_id || null,
        client_category_id: formData.client_category_id || null,
        seller_id: formData.seller_id === "none" ? null : (formData.seller_id || null),
        status: 'em_negociacao',
        contract_value: ['Up_sell', 'Cross_sell'].includes(formData.sale_type)
          ? parseFloat(formData.new_monthly_value) || 0
          : parseFloat(formData.contract_value) || 0,
        loyalty_months: finalLoyaltyMonths,
        custom_loyalty_months: formData.loyalty_months === "outra" ? parseInt(formData.custom_loyalty_months) || null : null,
        energy_type: formData.energy_type || null,
        cpe: formData.cpe || null,
        potencia: formData.potencia || null,
        cui: formData.cui || null,
        escalao: formData.escalao || null,
        notes: formData.notes || null,
        previous_monthly_value: ['Up_sell', 'Cross_sell'].includes(formData.sale_type)
          ? parseFloat(formData.previous_monthly_value) || 0
          : 0,
        new_monthly_value: ['Up_sell', 'Cross_sell'].includes(formData.sale_type)
          ? parseFloat(formData.new_monthly_value) || 0
          : 0,
        commission_seller: parseFloat(formData.commission_seller) || 0,
        commission_partner: parseFloat(formData.commission_partner) || 0,
        client_type: formData.client_type || null,
        portfolio_status: formData.portfolio_status || null,
        sale_date: formData.sale_date ? formData.sale_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        solar_power: formData.solar_power ? parseFloat(formData.solar_power) : null,
        solar_panel_quantity: formData.solar_panel_quantity ? parseInt(formData.solar_panel_quantity) : null
      };

      await salesService.createSale(payload);
      toast.success("Venda criada com sucesso");
      navigate("/sales");
    } catch (error) {
      console.error('Erro ao criar venda:', error);
      const message = error.message || "Erro ao guardar venda";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const showSaleType = formData.category === "energia" || formData.category === "telecomunicacoes";
  const showEnergyFields = formData.category === "energia";
  const showElectricityFields = formData.energy_type === "eletricidade" || formData.energy_type === "dual";
  const showGasFields = formData.energy_type === "gas" || formData.energy_type === "dual";
  const showSolarFields = formData.category === "paineis_solares";

  if (loadingPartners) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (partners.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <ModernCard variant="gradient" hover={false}>
          <div className="text-center py-6">
            <p className="text-slate-700 mb-4 text-lg font-semibold">Não existem parceiros registados.</p>
            <p className="text-slate-600 text-sm mb-6">É necessário criar pelo menos um parceiro antes de registar vendas.</p>
            <ModernButton
              onClick={() => navigate("/partners")}
            >
              Criar Parceiro
            </ModernButton>
          </div>
        </ModernCard>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <ModernButton
            variant="ghost"
            onClick={() => navigate(-1)}
            icon={ArrowLeft}
          >
            Voltar
          </ModernButton>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-brand-700 bg-clip-text text-transparent">
              Nova Venda
            </h1>
            <p className="text-slate-600 text-sm mt-1">Insira o NIF do cliente para começar</p>
          </div>
        </div>

        <ModernCard
          title="NIF do Cliente"
          icon={User}
          variant="gradient"
          hover={false}
        >
          <div className="flex gap-3">
            <Input
              id="nif_input"
              value={nifInput}
              onChange={(e) => setNifInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCheckNIF()}
              className="text-lg"
              placeholder="123456789"
              maxLength={9}
              autoFocus
            />
            <ModernButton
              onClick={handleCheckNIF}
              disabled={checkingNIF}
              loading={checkingNIF}
              icon={ArrowRight}
            >
              Continuar
            </ModernButton>
          </div>
        </ModernCard>

        <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
          <DialogContent className="bg-[#1E293B] border-[rgba(11,165,217,0.2)] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white font-['Manrope'] text-xl">Cliente Existente</DialogTitle>
              <DialogDescription className="text-white/70">
                {availableServices.length > 0
                  ? `Encontrámos ${availableServices.length} serviço(s) registado(s). Que tipo de venda deseja registar?`
                  : `Encontrámos {previousSales.length} venda(s) para este NIF. Que tipo de venda deseja registar?`
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <ModernButton
                onClick={() => handleSaleTypeSelection("NI")}
                className="w-full bg-[#c8f31d] hover:bg-[#b5db1a] text-[#031819] font-semibold py-6"
              >
                NI (Nova Instalação)
              </ModernButton>
              <ModernButton
                onClick={() => handleSaleTypeSelection("MC")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6"
              >
                MC (Mudança de Casa)
              </ModernButton>
              <ModernButton
                onClick={() => handleSaleTypeSelection("Refid")}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-6"
              >
                Refid (Refidelização)
              </ModernButton>
              <ModernButton
                onClick={() => handleSaleTypeSelection("Refid_Acrescimo")}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-6"
              >
                Refid com Acréscimo
              </ModernButton>
              <ModernButton
                onClick={() => handleSaleTypeSelection("Refid_Decrescimo")}
                className="w-full bg-purple-400 hover:bg-purple-500 text-white font-semibold py-6"
              >
                Refid com Decréscimo
              </ModernButton>
              <ModernButton
                onClick={() => handleSaleTypeSelection("Up_sell")}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-6"
              >
                Up-sell
              </ModernButton>
              <ModernButton
                onClick={() => handleSaleTypeSelection("Cross_sell")}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-6"
              >
                Cross-sell
              </ModernButton>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
          <DialogContent className="bg-[#1E293B] border-[rgba(11,165,217,0.2)] max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white font-['Manrope'] text-xl flex items-center gap-2">
                <MapPin className="text-blue-600" size={24} />
                Selecione a Morada Original
              </DialogTitle>
              <DialogDescription className="text-white/70">
                Escolha a morada da venda anterior que deseja processar
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {previousSales.map((sale) => (
                <Card
                  key={sale.id}
                  className="card-leiritrix cursor-pointer hover:border-[#c8f31d]/50 transition-colors"
                  onClick={() => selectedSaleFlow === "mc" ? handleMCSelection(sale) : handleRefidSelection(sale)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-['Manrope'] font-semibold">
                          {sale.street_address}
                        </p>
                        <p className="text-white/70 text-sm">
                          {sale.postal_code} {sale.city}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-white/70">
                          <span>{sale.operators?.name || "Sem operadora"}</span>
                          <span>{sale.category}</span>
                          {sale.loyalty_months > 0 && (
                            <span className="text-orange-400">
                              {sale.loyalty_months} meses fidelização
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight size={20} className="text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
          <DialogContent className="bg-[#1E293B] border-[rgba(11,165,217,0.2)] max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white font-['Manrope'] text-xl flex items-center gap-2">
                <Zap className="text-blue-600" size={24} />
                Selecione o Serviço
              </DialogTitle>
              <DialogDescription className="text-white/70">
                Escolha o serviço que deseja processar nesta venda
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {availableServices.map((service) => (
                <Card
                  key={service.id}
                  className="card-leiritrix cursor-pointer hover:border-[#c8f31d]/50 transition-colors"
                  onClick={() => handleServiceSelection(service)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-white font-['Manrope'] font-semibold">
                          {service.service_number || 'Sem número de serviço'}
                        </p>
                        <p className="text-white/70 text-sm mt-1">
                          {service.address?.street_address}
                        </p>
                        <p className="text-white/70 text-sm">
                          {service.address?.postal_code} {service.address?.city}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-white/70">
                          <span>{service.operator?.name || "Sem operadora"}</span>
                          <span className="capitalize">{service.service_type.replace('energia_', '').replace('_', ' ')}</span>
                          {service.cpe && <span>CPE: {service.cpe}</span>}
                          {service.cui && <span>CUI: {service.cui}</span>}
                          {service.loyalty_end_date && (
                            <span className="text-orange-400">
                              Fidelização até {new Date(service.loyalty_end_date).toLocaleDateString('pt-PT')}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight size={20} className="text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
          <AlertDialogContent className="bg-[#1E293B] border-[rgba(11,165,217,0.2)]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white font-['Manrope']">Atenção</AlertDialogTitle>
              <AlertDialogDescription className="text-white/70">
                {alertMessage}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="btn-secondary">OK</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="sale-form-page">
      <div className="flex items-center gap-4 mb-8">
        <ModernButton
          variant="ghost"
          onClick={() => {
            setShowForm(false);
            setNifInput("");
            setPreviousSales([]);
            setFormData({
              client_name: "",
              client_email: "",
              client_phone: "",
              client_nif: "",
              street_address: "",
              postal_code: "",
              city: "",
              category: "",
              sale_type: "",
              partner_id: "",
              operator_id: "",
              client_category_id: "",
              seller_id: "none",
              contract_value: "",
              loyalty_months: "",
              custom_loyalty_months: "",
              notes: "",
              energy_type: "",
              cpe: "",
              potencia: "",
              cui: "",
              escalao: "",
              sale_date: new Date(),
              previous_monthly_value: "",
              new_monthly_value: "",
              commission_seller: "",
              commission_partner: "",
              client_type: "",
              portfolio_status: "",
              solar_power: "",
              solar_panel_quantity: ""
            });
          }}
          icon={ArrowLeft}
          data-testid="back-btn"
        >
          Voltar
        </ModernButton>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-brand-700 bg-clip-text text-transparent">
            Nova Venda
          </h1>
          <p className="text-slate-600 text-sm mt-1">NIF: {formData.client_nif}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} data-testid="sale-form" className="space-y-6">
        <ModernCard
          title="Dados do Cliente"
          icon={User}
          variant="gradient"
          hover={false}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="client_name" className="form-label">Nome do Cliente *</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => handleChange("client_name", e.target.value)}
                  className="form-input"
                  placeholder="Nome completo"
                  data-testid="client-name-input"
                />
              </div>

              <div>
                <Label htmlFor="client_email" className="form-label">Email</Label>
                <Input
                  id="client_email"
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => handleChange("client_email", e.target.value)}
                  className="form-input"
                  placeholder="cliente@email.pt"
                  data-testid="client-email-input"
                />
              </div>

              <div>
                <Label htmlFor="client_phone" className="form-label">Telefone</Label>
                <Input
                  id="client_phone"
                  value={formData.client_phone}
                  onChange={(e) => handleChange("client_phone", e.target.value)}
                  className="form-input"
                  placeholder="912 345 678"
                  data-testid="client-phone-input"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="street_address" className="form-label">Rua e Número *</Label>
                <Input
                  id="street_address"
                  value={formData.street_address}
                  onChange={(e) => handleChange("street_address", e.target.value)}
                  className="form-input"
                  placeholder="Rua das Flores, nº 123, 2º Esq"
                  data-testid="street-address-input"
                />
              </div>

              <div>
                <Label htmlFor="postal_code" className="form-label">Código Postal *</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleChange("postal_code", e.target.value)}
                  className="form-input"
                  placeholder="1000-100"
                  maxLength={8}
                  data-testid="postal-code-input"
                />
              </div>

              <div>
                <Label htmlFor="city" className="form-label">Localidade *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  className="form-input"
                  placeholder="Lisboa"
                  data-testid="city-input"
                />
              </div>
            </div>
        </ModernCard>

        <ModernCard
          title="Dados do Contrato"
          icon={FileText}
          variant="gradient"
          hover={false}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="sale_date" className="form-label">Data de Venda *</Label>
                <DateSelect
                  value={formData.sale_date}
                  onChange={(date) => handleChange("sale_date", date)}
                  placeholder="Selecionar data"
                  maxDate={new Date()}
                  data-testid="sale-date-select"
                />
                <p className="text-white/40 text-xs mt-1">
                  Esta data será usada para contabilizar comissões e mensalidades no respetivo mês
                </p>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="category" className="form-label">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => {
                    handleChange("category", v);
                    if (v === "paineis_solares") {
                      handleChange("sale_type", "");
                      handleChange("energy_type", "");
                    }
                    if (v !== "energia") {
                      handleChange("energy_type", "");
                      handleChange("cpe", "");
                      handleChange("potencia", "");
                      handleChange("cui", "");
                      handleChange("escalao", "");
                    }
                  }}
                >
                  <SelectTrigger className="form-input" data-testid="category-select">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E293B] border-white/10">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-white/10">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showEnergyFields && (
                <div className="md:col-span-2 p-4 bg-[#c8f31d]/5 border border-[#c8f31d]/20 rounded-lg">
                  <Label htmlFor="energy_type" className="form-label flex items-center gap-2">
                    <Zap size={16} className="text-blue-600" />
                    Tipo de Energia * (selecione para ver as operadoras disponíveis)
                  </Label>
                  <Select value={formData.energy_type} onValueChange={(v) => handleChange("energy_type", v)}>
                    <SelectTrigger className="form-input mt-2" data-testid="energy-type-select">
                      <SelectValue placeholder="Selecione o tipo de energia" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E293B] border-white/10">
                      {ENERGY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="text-white hover:bg-white/10">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="operator_id" className="form-label">Operadora *</Label>
                <Select
                  value={formData.operator_id}
                  onValueChange={handleOperatorChange}
                  disabled={loadingOperators || !formData.category || (formData.category === 'energia' && !formData.energy_type)}
                >
                  <SelectTrigger className="form-input" data-testid="operator-select">
                    <SelectValue placeholder={
                      !formData.category
                        ? "Selecione primeiro a categoria"
                        : (formData.category === 'energia' && !formData.energy_type)
                        ? "Selecione o tipo de energia acima"
                        : loadingOperators
                        ? "A carregar operadoras..."
                        : getFilteredOperators().length === 0
                        ? "Sem operadoras disponíveis"
                        : "Selecione a operadora"
                    } />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E293B] border-white/10">
                    {getFilteredOperators().map((operator) => (
                      <SelectItem key={operator.id} value={operator.id} className="text-white hover:bg-white/10">
                        {operator.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.category && (formData.category !== 'energia' || formData.energy_type) && getFilteredOperators().length === 0 && !loadingOperators && (
                  <p className="text-orange-400 text-xs mt-1">
                    Não há operadoras disponíveis para esta categoria.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="partner_id" className="form-label">Parceiro *</Label>
                <Select
                  value={formData.partner_id}
                  onValueChange={(v) => handleChange("partner_id", v)}
                  disabled={!formData.operator_id}
                >
                  <SelectTrigger className="form-input" data-testid="partner-select">
                    <SelectValue placeholder={
                      !formData.operator_id
                        ? "Selecione primeiro a operadora"
                        : getFilteredPartners().length === 0
                        ? "Nenhum parceiro com esta operadora"
                        : "Selecione o parceiro"
                    } />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E293B] border-white/10">
                    {getFilteredPartners().map((partner) => (
                      <SelectItem key={partner.id} value={partner.id} className="text-white hover:bg-white/10">
                        {partner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.operator_id && getFilteredPartners().length === 0 && (
                  <p className="text-orange-400 text-xs mt-1">
                    Nenhum parceiro trabalha com esta operadora.
                  </p>
                )}
              </div>

              {showSaleType && (
                <div className="md:col-span-2">
                  <Label htmlFor="sale_type" className="form-label">
                    Tipo de Venda
                    {availableSaleTypes.length < SALE_TYPES.length && (
                      <span className="ml-2 text-xs text-blue-600">
                        (Filtrado por operadora)
                      </span>
                    )}
                  </Label>
                  <Select value={formData.sale_type} onValueChange={(v) => handleChange("sale_type", v)}>
                    <SelectTrigger className="form-input" data-testid="sale-type-select">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E293B] border-white/10">
                      {availableSaleTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="text-white hover:bg-white/10">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedOperator?.has_client_categories && clientCategories.length > 0 && (
                <div>
                  <Label htmlFor="client_category_id" className="form-label">Categoria de Cliente *</Label>
                  <Select
                    value={formData.client_category_id}
                    onValueChange={(v) => handleChange("client_category_id", v)}
                    disabled={!formData.operator_id}
                  >
                    <SelectTrigger className="form-input">
                      <SelectValue placeholder="Selecione a categoria do cliente" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E293B] border-white/10">
                      {clientCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id} className="text-white hover:bg-white/10">
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="client_type" className="form-label">Tipo de Cliente *</Label>
                <Select
                  value={formData.client_type}
                  onValueChange={(v) => {
                    handleChange("client_type", v);
                    if (v === "residencial") {
                      handleChange("portfolio_status", "");
                    }
                  }}
                >
                  <SelectTrigger className="form-input" data-testid="client-type-select">
                    <SelectValue placeholder="Selecione o tipo de cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E293B] border-white/10">
                    <SelectItem value="residencial" className="text-white hover:bg-white/10">
                      Residencial
                    </SelectItem>
                    <SelectItem value="empresarial" className="text-white hover:bg-white/10">
                      Empresarial
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.client_type === "empresarial" && (
                <div>
                  <Label htmlFor="portfolio_status" className="form-label">Encarteiramento *</Label>
                  <Select
                    value={formData.portfolio_status}
                    onValueChange={(v) => handleChange("portfolio_status", v)}
                  >
                    <SelectTrigger className="form-input" data-testid="portfolio-status-select">
                      <SelectValue placeholder="Selecione o encarteiramento" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E293B] border-white/10">
                      <SelectItem value="novo" className="text-white hover:bg-white/10">
                        Novo
                      </SelectItem>
                      <SelectItem value="cliente_carteira" className="text-white hover:bg-white/10">
                        Cliente de Carteira
                      </SelectItem>
                      <SelectItem value="fora_carteira" className="text-white hover:bg-white/10">
                        Fora de Carteira
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {sellers.length > 0 && (
                <div>
                  <Label htmlFor="seller_id" className="form-label">Vendedor</Label>
                  <Select value={formData.seller_id} onValueChange={(v) => handleChange("seller_id", v)}>
                    <SelectTrigger className="form-input" data-testid="seller-select">
                      <SelectValue placeholder="Selecione o vendedor" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E293B] border-white/10">
                      <SelectItem value="none" className="text-white hover:bg-white/10">
                        Nenhum
                      </SelectItem>
                      {sellers.map((seller) => (
                        <SelectItem key={seller.id} value={seller.id} className="text-white hover:bg-white/10">
                          {seller.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.category === "telecomunicacoes" && (
                <div>
                  <Label htmlFor="contract_value" className="form-label">Mensalidade Contratada (€)</Label>
                  <Input
                    id="contract_value"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.contract_value}
                    onChange={(e) => handleChange("contract_value", e.target.value)}
                    className="form-input"
                    placeholder="0.00"
                    data-testid="contract-value-input"
                  />
                </div>
              )}

              {['Up_sell', 'Cross_sell'].includes(formData.sale_type) && (
                <>
                  <div>
                    <Label htmlFor="previous_monthly_value" className="form-label">Mensalidade Anterior (€) *</Label>
                    <Input
                      id="previous_monthly_value"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.previous_monthly_value}
                      onChange={(e) => handleChange("previous_monthly_value", e.target.value)}
                      onBlur={handleMonthlyValueBlur}
                      className="form-input"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new_monthly_value" className="form-label">Nova Mensalidade (€) *</Label>
                    <Input
                      id="new_monthly_value"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.new_monthly_value}
                      onChange={(e) => handleChange("new_monthly_value", e.target.value)}
                      onBlur={handleMonthlyValueBlur}
                      className="form-input"
                      placeholder="0.00"
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="loyalty_months" className="form-label">Prazo de Fidelização</Label>
                <Select value={formData.loyalty_months} onValueChange={(v) => handleChange("loyalty_months", v)}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Selecione o prazo" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E293B] border-white/10">
                    {LOYALTY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-white hover:bg-white/10">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.loyalty_months === "outra" && (
                <div>
                  <Label htmlFor="custom_loyalty_months" className="form-label">Fidelização Personalizada (meses)</Label>
                  <Input
                    id="custom_loyalty_months"
                    type="number"
                    min="0"
                    value={formData.custom_loyalty_months}
                    onChange={(e) => handleChange("custom_loyalty_months", e.target.value)}
                    className="form-input"
                    placeholder="Insira o número de meses"
                  />
                </div>
              )}

              {formData.operator_id && formData.partner_id && (
                <>
                  {sellers.length > 0 && (
                    <div>
                      <Label htmlFor="commission_seller" className="form-label">
                        Comissão Vendedor (€)
                        {commissionType === "automatic" && (
                          <span className="ml-2 text-xs text-green-400">Automático</span>
                        )}
                      </Label>
                      <Input
                        id="commission_seller"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.commission_seller}
                        onChange={(e) => handleChange("commission_seller", e.target.value)}
                        className="form-input"
                        placeholder="0.00"
                        disabled={calculatingCommission}
                        readOnly={commissionType === "automatic"}
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="commission_partner" className="form-label">
                      Comissão a receber (€)
                      {commissionType === "automatic" && (
                        <span className="ml-2 text-xs text-green-400">Automático</span>
                      )}
                    </Label>
                    <Input
                      id="commission_partner"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.commission_partner}
                      onChange={(e) => handleChange("commission_partner", e.target.value)}
                      className="form-input"
                      placeholder="0.00"
                      disabled={calculatingCommission}
                      readOnly={commissionType === "automatic"}
                    />
                  </div>
                </>
              )}
            </div>
        </ModernCard>

        {showEnergyFields && formData.energy_type && (
          <ModernCard
            title={`Detalhes de Energia (${ENERGY_TYPE_MAP[formData.energy_type]})`}
            icon={Zap}
            variant="gradient"
            hover={false}
          >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {showElectricityFields && (
                  <>
                    <div>
                      <Label htmlFor="cpe" className="form-label">CPE *</Label>
                      <Input
                        id="cpe"
                        value={formData.cpe}
                        onChange={(e) => handleChange("cpe", e.target.value)}
                        className="form-input"
                        placeholder="PT0002..."
                        data-testid="cpe-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="potencia" className="form-label">Potência (kVA) *</Label>
                      <Select value={formData.potencia} onValueChange={(v) => handleChange("potencia", v)}>
                        <SelectTrigger className="form-input" data-testid="potencia-select">
                          <SelectValue placeholder="Selecione a potência" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1E293B] border-white/10 max-h-60">
                          {POTENCIAS.map((pot) => (
                            <SelectItem key={pot} value={pot} className="text-white hover:bg-white/10">
                              {pot} {pot !== "Outra" && "kVA"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {showGasFields && (
                  <>
                    <div>
                      <Label htmlFor="cui" className="form-label">CUI *</Label>
                      <Input
                        id="cui"
                        value={formData.cui}
                        onChange={(e) => handleChange("cui", e.target.value)}
                        className="form-input"
                        placeholder="CUI do ponto de entrega"
                        data-testid="cui-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="escalao" className="form-label">Escalão *</Label>
                      <Select value={formData.escalao} onValueChange={(v) => handleChange("escalao", v)}>
                        <SelectTrigger className="form-input" data-testid="escalao-select">
                          <SelectValue placeholder="Selecione o escalão" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1E293B] border-white/10">
                          {ESCALOES_GAS.map((esc) => (
                            <SelectItem key={esc} value={esc} className="text-white hover:bg-white/10">
                              {esc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
          </ModernCard>
        )}

        {showSolarFields && (
          <ModernCard
            title="Detalhes de Painéis Solares"
            icon={Sun}
            variant="gradient"
            hover={false}
          >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="cpe" className="form-label">CPE</Label>
                  <Input
                    id="cpe"
                    value={formData.cpe}
                    onChange={(e) => handleChange("cpe", e.target.value)}
                    className="form-input"
                    placeholder="PT0002..."
                  />
                  <p className="text-white/40 text-xs mt-1">Opcional</p>
                </div>
                <div>
                  <Label htmlFor="solar_power" className="form-label">Potência Instalada (kW)</Label>
                  <Input
                    id="solar_power"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.solar_power || ""}
                    onChange={(e) => handleChange("solar_power", e.target.value)}
                    className="form-input"
                    placeholder="0.00"
                  />
                  <p className="text-white/40 text-xs mt-1">Opcional</p>
                </div>
                <div>
                  <Label htmlFor="solar_panel_quantity" className="form-label">Quantidade de Painéis</Label>
                  <Input
                    id="solar_panel_quantity"
                    type="number"
                    min="0"
                    value={formData.solar_panel_quantity || ""}
                    onChange={(e) => handleChange("solar_panel_quantity", e.target.value)}
                    className="form-input"
                    placeholder="0"
                  />
                  <p className="text-white/40 text-xs mt-1">Opcional</p>
                </div>
              </div>
          </ModernCard>
        )}

        <ModernCard variant="glass" hover={false}>
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-slate-700 font-semibold">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="min-h-24"
              placeholder="Observações adicionais..."
              data-testid="notes-input"
            />
          </div>
        </ModernCard>

        <div className="flex justify-end gap-4 pt-4">
          <ModernButton
            type="button"
            variant="secondary"
            onClick={() => {
              setShowForm(false);
              setNifInput("");
              setPreviousSales([]);
            }}
            data-testid="cancel-btn"
          >
            Cancelar
          </ModernButton>
          <ModernButton
            type="submit"
            loading={loading}
            icon={Save}
            data-testid="submit-btn"
          >
            Criar Venda
          </ModernButton>
        </div>
      </form>

      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent className="bg-[#1E293B] border-[rgba(11,165,217,0.2)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white font-['Manrope']">Atenção</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              {alertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-secondary">OK</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
