import { useState, useEffect } from "react";
import { useAuth } from "@/App";
import { salesService } from "@/services/salesService";
import { usersService } from "@/services/usersService";
import { partnersService } from "@/services/partnersService";
import { ModernCard, ModernButton, ModernBadge, ModernKPI, ModernTable } from "@/components/modern";
import { DatePickerPopup } from "@/components/ui/date-picker-popup";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  FileText,
  Download,
  Filter,
  Loader2,
  TrendingUp,
  DollarSign,
  BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

const STATUS_MAP = {
  em_negociacao: { label: "Em Negociação", variant: "info" },
  perdido: { label: "Perdido", variant: "danger" },
  pendente: { label: "Pendente", variant: "warning" },
  ativo: { label: "Ativo", variant: "success" },
  anulado: { label: "Anulado", variant: "default" }
};

const CATEGORY_MAP = {
  energia: "Energia",
  telecomunicacoes: "Telecomunicações",
  paineis_solares: "Painéis Solares"
};

export default function Reports() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [partners, setPartners] = useState([]);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [partnerId, setPartnerId] = useState("");

  useEffect(() => {
    fetchFiltersData();
  }, []);

  const fetchFiltersData = async () => {
    try {
      const [usersData, partnersData] = await Promise.all([
        usersService.getUsersByRole("vendedor"),
        partnersService.getPartners()
      ]);
      setSellers(usersData);
      setPartners(partnersData);
    } catch (error) {
      console.error("Error fetching filters data:", error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      let salesData = await salesService.getSales();

      if (startDate) {
        salesData = salesData.filter(s => new Date(s.sale_date || s.created_at) >= startDate);
      }
      if (endDate) {
        salesData = salesData.filter(s => new Date(s.sale_date || s.created_at) <= endDate);
      }
      if (category && category !== "all") {
        salesData = salesData.filter(s => s.category === category);
      }
      if (status && status !== "all") {
        salesData = salesData.filter(s => s.status === status);
      }
      if (sellerId && sellerId !== "all") {
        salesData = salesData.filter(s => s.seller_id === sellerId);
      }
      if (partnerId && partnerId !== "all") {
        salesData = salesData.filter(s => s.partner_id === partnerId);
      }

      const reportData = {
        sales: salesData,
        total_sales: salesData.length,
        total_value: salesData.reduce((sum, s) => sum + (s.contract_value || 0), 0),
        total_commission: salesData.reduce((sum, s) => sum + (s.commission || 0), 0),
        by_category: {
          energia: salesData.filter(s => s.category === 'energia').length,
          telecomunicacoes: salesData.filter(s => s.category === 'telecomunicacoes').length,
          paineis_solares: salesData.filter(s => s.category === 'paineis_solares').length
        },
        by_status: {
          em_negociacao: salesData.filter(s => s.status === 'em_negociacao').length,
          perdido: salesData.filter(s => s.status === 'perdido').length,
          pendente: salesData.filter(s => s.status === 'pendente').length,
          ativo: salesData.filter(s => s.status === 'ativo').length,
          anulado: salesData.filter(s => s.status === 'anulado').length
        }
      };

      setReport(reportData);
    } catch (error) {
      toast.error("Erro ao gerar relatório");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!report || !report.sales.length) {
      toast.error("Sem dados para exportar");
      return;
    }

    const worksheetData = [
      [
        "Cliente", "NIF", "Email", "Telefone", "Tipo Cliente", "Encarteiramento",
        "Morada", "Rua/Endereço", "Código Postal", "Cidade",
        "Categoria", "Operadora", "Tipo Venda", "Parceiro", "Vendedor",
        "Valor Contrato", "Comissão Vendedor", "Comissão Parceiro", "Comissão Backoffice", "Comissão Total",
        "Estado", "Fidelização (meses)", "Data de Venda", "Data de Ativação", "Fim Fidelização",
        "REQ", "CPE", "Potência (kVA)", "CUI", "Escalão",
        "Potência Solar (kW)", "Quantidade Painéis", "Notas", "ID", "Data Criação"
      ],
      ...report.sales.map(sale => [
        sale.client_name,
        sale.client_nif || "",
        sale.client_email || "",
        sale.client_phone || "",
        sale.client_type === 'residencial' ? 'Residencial' : sale.client_type === 'empresarial' ? 'Empresarial' : "",
        sale.portfolio_status === 'novo' ? 'Novo' :
          sale.portfolio_status === 'cliente_carteira' ? 'Cliente Carteira' :
          sale.portfolio_status === 'fora_carteira' ? 'Fora Carteira' : "",
        sale.client_address || "",
        sale.street_address || "",
        sale.postal_code || "",
        sale.city || "",
        CATEGORY_MAP[sale.category] || sale.category,
        sale.operators?.name || "",
        sale.sale_type || "",
        sale.partners?.name || sale.partner_name || "",
        sale.seller_name || "",
        sale.contract_value || 0,
        sale.commission_seller || 0,
        sale.commission_partner || 0,
        sale.commission_backoffice || 0,
        sale.commission || 0,
        STATUS_MAP[sale.status]?.label || sale.status,
        sale.loyalty_months || 0,
        sale.sale_date ? new Date(sale.sale_date).toLocaleDateString('pt-PT') : new Date(sale.created_at).toLocaleDateString('pt-PT'),
        sale.active_date ? new Date(sale.active_date).toLocaleDateString('pt-PT') : "",
        sale.loyalty_end_date ? new Date(sale.loyalty_end_date).toLocaleDateString('pt-PT') : "",
        sale.req || "",
        sale.cpe || "",
        sale.potencia || "",
        sale.cui || "",
        sale.escalao || "",
        sale.solar_power || "",
        sale.solar_panel_quantity || "",
        sale.notes || "",
        sale.id.slice(0, 8),
        new Date(sale.created_at).toLocaleDateString('pt-PT')
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    const columnWidths = [
      { wch: 25 }, // Cliente
      { wch: 12 }, // NIF
      { wch: 25 }, // Email
      { wch: 15 }, // Telefone
      { wch: 15 }, // Tipo Cliente
      { wch: 18 }, // Encarteiramento
      { wch: 35 }, // Morada
      { wch: 25 }, // Rua/Endereço
      { wch: 12 }, // Código Postal
      { wch: 15 }, // Cidade
      { wch: 18 }, // Categoria
      { wch: 20 }, // Operadora
      { wch: 18 }, // Tipo Venda
      { wch: 20 }, // Parceiro
      { wch: 20 }, // Vendedor
      { wch: 15 }, // Valor Contrato
      { wch: 15 }, // Comissão Vendedor
      { wch: 15 }, // Comissão Parceiro
      { wch: 18 }, // Comissão Backoffice
      { wch: 15 }, // Comissão Total
      { wch: 15 }, // Estado
      { wch: 18 }, // Fidelização
      { wch: 15 }, // Data de Venda
      { wch: 15 }, // Data de Ativação
      { wch: 15 }, // Fim Fidelização
      { wch: 15 }, // REQ
      { wch: 15 }, // CPE
      { wch: 15 }, // Potência
      { wch: 15 }, // CUI
      { wch: 12 }, // Escalão
      { wch: 18 }, // Potência Solar
      { wch: 18 }, // Quantidade Painéis
      { wch: 30 }, // Notas
      { wch: 10 }, // ID
      { wch: 15 }  // Data Criação
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vendas");

    XLSX.writeFile(workbook, `relatorio_vendas_${format(new Date(), "yyyy-MM-dd")}.xlsx`);

    toast.success("Relatório exportado com sucesso");
  };

  return (
    <div className="space-y-6" data-testid="reports-page">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-brand-700 bg-clip-text text-transparent">
          Relatórios
        </h1>
        <p className="text-slate-600 text-sm mt-1">Gere relatórios de vendas com filtros personalizados</p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ModernCard title="Filtros" icon={Filter} variant="gradient" hover={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-700 font-semibold mb-1 block">Data Início</label>
              <DatePickerPopup
                value={startDate}
                onChange={setStartDate}
                placeholder="Data início"
                data-testid="start-date-picker"
              />
            </div>

            <div>
              <label className="text-xs text-slate-700 font-semibold mb-1 block">Data Fim</label>
              <DatePickerPopup
                value={endDate}
                onChange={setEndDate}
                placeholder="Data fim"
                data-testid="end-date-picker"
              />
            </div>

            {/* Category */}
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="form-input" data-testid="report-category-filter">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all" className="text-slate-900">Todas</SelectItem>
                {Object.entries(CATEGORY_MAP).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-slate-900">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status */}
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="form-input" data-testid="report-status-filter">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all" className="text-slate-900">Todos</SelectItem>
                {Object.entries(STATUS_MAP).map(([key, s]) => (
                  <SelectItem key={key} value={key} className="text-slate-900">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Partner */}
            <Select value={partnerId} onValueChange={setPartnerId}>
              <SelectTrigger className="form-input" data-testid="report-partner-filter">
                <SelectValue placeholder="Parceiro" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all" className="text-slate-900">Todos</SelectItem>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id} className="text-slate-900">
                    {partner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Seller */}
            <Select value={sellerId} onValueChange={setSellerId}>
              <SelectTrigger className="form-input" data-testid="report-seller-filter">
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all" className="text-slate-900">Todos</SelectItem>
                {sellers.map((seller) => (
                  <SelectItem key={seller.id} value={seller.id} className="text-slate-900">
                    {seller.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end mt-6">
            <ModernButton
              onClick={generateReport}
              loading={loading}
              icon={FileText}
              variant="primary"
              data-testid="generate-report-btn"
            >
              Gerar Relatório
            </ModernButton>
          </div>
        </ModernCard>
      </motion.div>

      {/* Report Results */}
      {report && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ModernKPI
              title="Total de Vendas"
              value={report.total_sales}
              icon={BarChart3}
              variant="info"
              data-testid="report-total-count"
            />
            <ModernKPI
              title="Valor Total"
              value={new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(report.total_value)}
              icon={DollarSign}
              variant="primary"
              data-testid="report-total-value"
            />
            <ModernKPI
              title="Total Comissões"
              value={new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(report.total_commission)}
              icon={TrendingUp}
              variant="success"
              data-testid="report-total-commission"
            />
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <ModernButton
              onClick={exportToExcel}
              icon={Download}
              variant="secondary"
              data-testid="export-excel-btn"
            >
              Exportar Excel
            </ModernButton>
          </div>

          {/* Data Table */}
          <ModernCard title="Resultados do Relatório" icon={FileText} variant="gradient" hover={false}>
            {report.sales.length > 0 ? (
              <ModernTable
                columns={[
                  {
                    key: 'client',
                    label: 'Cliente',
                    sortable: true,
                    render: (_, row) => (
                      <div>
                        <p className="font-medium text-slate-900">{row.client_name}</p>
                        {row.client_nif && (
                          <p className="text-sm text-slate-500 font-mono">{row.client_nif}</p>
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'category',
                    label: 'Categoria',
                    sortable: true,
                    render: (value) => (
                      <span className="text-sm text-slate-700">{CATEGORY_MAP[value]}</span>
                    )
                  },
                  {
                    key: 'partner_name',
                    label: 'Parceiro',
                    sortable: true,
                    render: (value) => (
                      <span className="text-sm text-slate-700">{value}</span>
                    )
                  },
                  {
                    key: 'contract_value',
                    label: 'Valor',
                    sortable: true,
                    render: (value) => (
                      <span className="font-mono text-sm text-brand-600 font-semibold">
                        {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value)}
                      </span>
                    )
                  },
                  {
                    key: 'commission',
                    label: 'Comissão',
                    sortable: true,
                    render: (value) => {
                      if (value !== null && value !== undefined) {
                        return (
                          <span className="font-mono text-sm text-green-600 font-semibold">
                            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value)}
                          </span>
                        );
                      }
                      return <span className="text-slate-300">-</span>;
                    }
                  },
                  {
                    key: 'status',
                    label: 'Estado',
                    sortable: true,
                    render: (value) => {
                      const statusInfo = STATUS_MAP[value];
                      return <ModernBadge variant={statusInfo?.variant}>{statusInfo?.label}</ModernBadge>;
                    }
                  },
                  {
                    key: 'seller_name',
                    label: 'Vendedor',
                    sortable: true,
                    render: (value) => (
                      <span className="text-sm text-slate-700">{value}</span>
                    )
                  },
                  {
                    key: 'created_at',
                    label: 'Data',
                    sortable: true,
                    render: (value) => (
                      <span className="text-sm text-slate-600">
                        {new Date(value).toLocaleDateString('pt-PT')}
                      </span>
                    )
                  }
                ]}
                data={report.sales}
                sortable={true}
                hoverable={true}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500">Nenhuma venda encontrada com os filtros selecionados</p>
              </div>
            )}
          </ModernCard>
        </motion.div>
      )}
    </div>
  );
}
