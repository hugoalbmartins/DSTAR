import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

const CATEGORIES = [
  { value: "energia", label: "Energia" },
  { value: "telecomunicacoes", label: "Telecomunicações" },
  { value: "paineis_solares", label: "Painéis Solares" }
];

const SALE_TYPES = [
  { value: "nova_instalacao", label: "Nova Instalação" },
  { value: "refid", label: "Refid (Renovação)" }
];

const STATUSES = [
  { value: "em_negociacao", label: "Em Negociação" },
  { value: "pendente", label: "Pendente" },
  { value: "ativo", label: "Ativo" },
  { value: "perdido", label: "Perdido" },
  { value: "anulado", label: "Anulado" }
];

export default function SaleForm() {
  const { token, isAdminOrBackoffice } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    client_nif: "",
    category: "",
    sale_type: "",
    partner: "",
    contract_value: "",
    loyalty_months: "",
    notes: "",
    status: "em_negociacao"
  });

  useEffect(() => {
    if (isEditing) {
      fetchSale();
    }
  }, [id, token]);

  const fetchSale = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/sales/${id}`, { headers });
      const sale = response.data;
      
      setFormData({
        client_name: sale.client_name || "",
        client_email: sale.client_email || "",
        client_phone: sale.client_phone || "",
        client_nif: sale.client_nif || "",
        category: sale.category || "",
        sale_type: sale.sale_type || "",
        partner: sale.partner || "",
        contract_value: sale.contract_value?.toString() || "",
        loyalty_months: sale.loyalty_months?.toString() || "",
        notes: sale.notes || "",
        status: sale.status || "em_negociacao"
      });
    } catch (error) {
      toast.error("Erro ao carregar venda");
      navigate("/sales");
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.client_name || !formData.category || !formData.partner) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const payload = {
        ...formData,
        contract_value: parseFloat(formData.contract_value) || 0,
        loyalty_months: parseInt(formData.loyalty_months) || 0,
        sale_type: formData.sale_type || null
      };

      if (isEditing) {
        await axios.put(`${API}/sales/${id}`, payload, { headers });
        toast.success("Venda atualizada com sucesso");
      } else {
        await axios.post(`${API}/sales`, payload, { headers });
        toast.success("Venda criada com sucesso");
      }

      navigate("/sales");
    } catch (error) {
      const message = error.response?.data?.detail || "Erro ao guardar venda";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Show sale_type only for energia and telecomunicacoes
  const showSaleType = formData.category === "energia" || formData.category === "telecomunicacoes";

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="sale-form-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="text-white/70 hover:text-white"
          data-testid="back-btn"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white font-['Manrope']">
            {isEditing ? "Editar Venda" : "Nova Venda"}
          </h1>
          <p className="text-white/50 text-sm mt-1">
            {isEditing ? "Atualize os dados da venda" : "Preencha os dados para registar uma nova venda"}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} data-testid="sale-form">
        <Card className="card-leiritrix">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-white font-['Manrope'] text-lg">
              Dados do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="client_name" className="form-label">
                  Nome do Cliente *
                </Label>
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
                <Label htmlFor="client_nif" className="form-label">
                  NIF
                </Label>
                <Input
                  id="client_nif"
                  value={formData.client_nif}
                  onChange={(e) => handleChange("client_nif", e.target.value)}
                  className="form-input"
                  placeholder="123456789"
                  data-testid="client-nif-input"
                />
              </div>

              <div>
                <Label htmlFor="client_email" className="form-label">
                  Email
                </Label>
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
                <Label htmlFor="client_phone" className="form-label">
                  Telefone
                </Label>
                <Input
                  id="client_phone"
                  value={formData.client_phone}
                  onChange={(e) => handleChange("client_phone", e.target.value)}
                  className="form-input"
                  placeholder="912 345 678"
                  data-testid="client-phone-input"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-leiritrix mt-6">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-white font-['Manrope'] text-lg">
              Dados do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="category" className="form-label">
                  Categoria *
                </Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => {
                    handleChange("category", v);
                    // Reset sale_type if changing to paineis_solares
                    if (v === "paineis_solares") {
                      handleChange("sale_type", "");
                    }
                  }}
                >
                  <SelectTrigger className="form-input" data-testid="category-select">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#082d32] border-white/10">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-white/10">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showSaleType && (
                <div>
                  <Label htmlFor="sale_type" className="form-label">
                    Tipo de Venda
                  </Label>
                  <Select value={formData.sale_type} onValueChange={(v) => handleChange("sale_type", v)}>
                    <SelectTrigger className="form-input" data-testid="sale-type-select">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#082d32] border-white/10">
                      {SALE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="text-white hover:bg-white/10">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="partner" className="form-label">
                  Parceiro *
                </Label>
                <Input
                  id="partner"
                  value={formData.partner}
                  onChange={(e) => handleChange("partner", e.target.value)}
                  className="form-input"
                  placeholder="Nome do parceiro"
                  data-testid="partner-input"
                />
              </div>

              <div>
                <Label htmlFor="contract_value" className="form-label">
                  Valor do Contrato (€)
                </Label>
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

              <div>
                <Label htmlFor="loyalty_months" className="form-label">
                  Prazo de Fidelização (meses)
                </Label>
                <Input
                  id="loyalty_months"
                  type="number"
                  min="0"
                  value={formData.loyalty_months}
                  onChange={(e) => handleChange("loyalty_months", e.target.value)}
                  className="form-input"
                  placeholder="24"
                  data-testid="loyalty-months-input"
                />
              </div>

              {isEditing && (
                <div>
                  <Label htmlFor="status" className="form-label">
                    Estado
                  </Label>
                  <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                    <SelectTrigger className="form-input" data-testid="status-select">
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#082d32] border-white/10">
                      {STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value} className="text-white hover:bg-white/10">
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="notes" className="form-label">
                Notas
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                className="form-input min-h-24"
                placeholder="Observações adicionais..."
                data-testid="notes-input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(-1)}
            className="btn-secondary"
            data-testid="cancel-btn"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="btn-primary btn-primary-glow"
            data-testid="submit-btn"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                A guardar...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                {isEditing ? "Guardar Alterações" : "Criar Venda"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
