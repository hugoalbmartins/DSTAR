import { useState, useEffect } from "react";
import { useAuth } from "@/App";
import { salesService } from "@/services/salesService";
import { clientsService } from "@/services/clientsService";
import { leadsService } from "@/services/leadsService";
import { usersService } from "@/services/usersService";
import { partnersService } from "@/services/partnersService";
import { ModernCard, ModernButton, ModernBadge, ModernKPI, ModernTable } from "@/components/modern";
import { DatePickerPopup } from "@/components/ui/date-picker-popup";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
  BarChart3,
  Users,
  Target
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

const CLIENT_TYPE_MAP = {
  residencial: "Residencial",
  empresarial: "Empresarial"
};

const PORTFOLIO_STATUS_MAP = {
  novo: "Novo",
  cliente_carteira: "Cliente Carteira",
  fora_carteira: "Fora Carteira"
};

export default function Reports() {
  const [activeTab, setActiveTab] = useState("sales");

  const [loadingSales, setLoadingSales] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(false);

  const [salesReport, setSalesReport] = useState(null);
  const [clientsReport, setClientsReport] = useState(null);
  const [leadsReport, setLeadsReport] = useState(null);

  const [sellers, setSellers] = useState([]);
  const [partners, setPartners] = useState([]);

  const [salesStartDate, setSalesStartDate] = useState(null);
  const [salesEndDate, setSalesEndDate] = useState(null);
  const [salesCategory, setSalesCategory] = useState("");
  const [salesStatus, setSalesStatus] = useState("");
  const [salesSellerId, setSalesSellerId] = useState("");
  const [salesPartnerId, setSalesPartnerId] = useState("");

  const [clientsSearchTerm, setClientsSearchTerm] = useState("");
  const [clientsType, setClientsType] = useState("");
  const [clientsPortfolio, setClientsPortfolio] = useState("");

  const [leadsSearchTerm, setLeadsSearchTerm] = useState("");
  const [leadsStartDate, setLeadsStartDate] = useState(null);
  const [leadsEndDate, setLeadsEndDate] = useState(null);
  const [leadsSaleType, setLeadsSaleType] = useState("");
  const [leadsSellerId, setLeadsSellerId] = useState("");

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

  const generateSalesReport = async () => {
    setLoadingSales(true);
    try {
      let salesData = await salesService.getSales();

      if (salesStartDate) {
        salesData = salesData.filter(s => new Date(s.sale_date || s.created_at) >= salesStartDate);
      }
      if (salesEndDate) {
        salesData = salesData.filter(s => new Date(s.sale_date || s.created_at) <= salesEndDate);
      }
      if (salesCategory && salesCategory !== "all") {
        salesData = salesData.filter(s => s.category === salesCategory);
      }
      if (salesStatus && salesStatus !== "all") {
        salesData = salesData.filter(s => s.status === salesStatus);
      }
      if (salesSellerId && salesSellerId !== "all") {
        salesData = salesData.filter(s => s.seller_id === salesSellerId);
      }
      if (salesPartnerId && salesPartnerId !== "all") {
        salesData = salesData.filter(s => s.partner_id === salesPartnerId);
      }

      const reportData = {
        sales: salesData,
        total_sales: salesData.length,
        total_value: salesData.reduce((sum, s) => sum + (s.contract_value || 0), 0),
        total_commission: salesData.reduce((sum, s) => sum + (s.commission || 0), 0),
      };

      setSalesReport(reportData);
      toast.success("Relatório de vendas gerado");
    } catch (error) {
      toast.error("Erro ao gerar relatório de vendas");
    } finally {
      setLoadingSales(false);
    }
  };

  const generateClientsReport = async () => {
    setLoadingClients(true);
    try {
      let clientsData = await clientsService.getAllClients();

      if (clientsSearchTerm.trim()) {
        const term = clientsSearchTerm.toLowerCase();
        clientsData = clientsData.filter(c =>
          c.name?.toLowerCase().includes(term) ||
          c.nif?.includes(term) ||
          c.email?.toLowerCase().includes(term)
        );
      }
      if (clientsType && clientsType !== "all") {
        clientsData = clientsData.filter(c => c.client_type === clientsType);
      }
      if (clientsPortfolio && clientsPortfolio !== "all") {
        clientsData = clientsData.filter(c => c.portfolio_status === clientsPortfolio);
      }

      const reportData = {
        clients: clientsData,
        total_clients: clientsData.length,
        by_type: {
          residencial: clientsData.filter(c => c.client_type === 'residencial').length,
          empresarial: clientsData.filter(c => c.client_type === 'empresarial').length
        },
        by_portfolio: {
          novo: clientsData.filter(c => c.portfolio_status === 'novo').length,
          cliente_carteira: clientsData.filter(c => c.portfolio_status === 'cliente_carteira').length,
          fora_carteira: clientsData.filter(c => c.portfolio_status === 'fora_carteira').length
        }
      };

      setClientsReport(reportData);
      toast.success("Relatório de clientes gerado");
    } catch (error) {
      toast.error("Erro ao gerar relatório de clientes");
    } finally {
      setLoadingClients(false);
    }
  };

  const generateLeadsReport = async () => {
    setLoadingLeads(true);
    try {
      let leadsData = await leadsService.getAllLeads();

      if (leadsSearchTerm.trim()) {
        const term = leadsSearchTerm.toLowerCase();
        leadsData = leadsData.filter(l =>
          l.client?.name?.toLowerCase().includes(term) ||
          l.client?.nif?.includes(term)
        );
      }
      if (leadsStartDate) {
        leadsData = leadsData.filter(l => new Date(l.alert_date) >= leadsStartDate);
      }
      if (leadsEndDate) {
        leadsData = leadsData.filter(l => new Date(l.alert_date) <= leadsEndDate);
      }
      if (leadsSaleType && leadsSaleType !== "all") {
        leadsData = leadsData.filter(l => l.sale_type === leadsSaleType);
      }
      if (leadsSellerId && leadsSellerId !== "all") {
        leadsData = leadsData.filter(l => l.user_id === leadsSellerId);
      }

      const reportData = {
        leads: leadsData,
        total_leads: leadsData.length,
        converted: leadsData.filter(l => l.converted).length,
        pending: leadsData.filter(l => !l.converted).length
      };

      setLeadsReport(reportData);
      toast.success("Relatório de leads gerado");
    } catch (error) {
      toast.error("Erro ao gerar relatório de leads");
    } finally {
      setLoadingLeads(false);
    }
  };

  const exportSalesToExcel = () => {
    if (!salesReport || !salesReport.sales.length) {
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
      ...salesReport.sales.map(sale => [
        sale.client_name,
        sale.client_nif || "",
        sale.client_email || "",
        sale.client_phone || "",
        CLIENT_TYPE_MAP[sale.client_type] || "",
        PORTFOLIO_STATUS_MAP[sale.portfolio_status] || "",
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
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vendas");
    XLSX.writeFile(workbook, `relatorio_vendas_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Relatório exportado com sucesso");
  };

  const exportClientsToExcel = () => {
    if (!clientsReport || !clientsReport.clients.length) {
      toast.error("Sem dados para exportar");
      return;
    }

    const worksheetData = [
      [
        "Nome", "NIF", "Email", "Telefone",
        "Tipo Cliente", "Encarteiramento",
        "ID", "Data Criação"
      ],
      ...clientsReport.clients.map(client => [
        client.name,
        client.nif || "",
        client.email || "",
        client.phone || "",
        CLIENT_TYPE_MAP[client.client_type] || "",
        PORTFOLIO_STATUS_MAP[client.portfolio_status] || "",
        client.id.slice(0, 8),
        new Date(client.created_at).toLocaleDateString('pt-PT')
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");
    XLSX.writeFile(workbook, `relatorio_clientes_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Relatório exportado com sucesso");
  };

  const exportLeadsToExcel = () => {
    if (!leadsReport || !leadsReport.leads.length) {
      toast.error("Sem dados para exportar");
      return;
    }

    const worksheetData = [
      [
        "Cliente", "NIF", "Email", "Telefone",
        "Tipo de Venda", "Data de Alerta", "Convertido",
        "Vendedor", "ID", "Data Criação"
      ],
      ...leadsReport.leads.map(lead => [
        lead.client?.name || "",
        lead.client?.nif || "",
        lead.client?.email || "",
        lead.client?.phone || "",
        lead.sale_type || "",
        lead.alert_date ? new Date(lead.alert_date).toLocaleDateString('pt-PT') : "",
        lead.converted ? "Sim" : "Não",
        lead.user?.name || "",
        lead.id.slice(0, 8),
        new Date(lead.created_at).toLocaleDateString('pt-PT')
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    XLSX.writeFile(workbook, `relatorio_leads_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Relatório exportado com sucesso");
  };

  return (
    <div className="space-y-6" data-testid="reports-page">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-brand-700 bg-clip-text text-transparent">
          Relatórios
        </h1>
        <p className="text-slate-600 text-sm mt-1">Gere e exporte relatórios personalizados</p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100">
          <TabsTrigger value="sales" className="data-[state=active]:bg-white">
            <FileText className="h-4 w-4 mr-2" />
            Vendas
          </TabsTrigger>
          <TabsTrigger value="clients" className="data-[state=active]:bg-white">
            <Users className="h-4 w-4 mr-2" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="leads" className="data-[state=active]:bg-white">
            <Target className="h-4 w-4 mr-2" />
            Leads
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6 mt-6">
          <ModernCard title="Filtros de Vendas" icon={Filter} variant="gradient" hover={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-700 font-semibold mb-1 block">Data Início</label>
                <DatePickerPopup
                  value={salesStartDate}
                  onChange={setSalesStartDate}
                  placeholder="Data início"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold mb-1 block">Data Fim</label>
                <DatePickerPopup
                  value={salesEndDate}
                  onChange={setSalesEndDate}
                  placeholder="Data fim"
                />
              </div>

              <Select value={salesCategory} onValueChange={setSalesCategory}>
                <SelectTrigger className="form-input">
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

              <Select value={salesStatus} onValueChange={setSalesStatus}>
                <SelectTrigger className="form-input">
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

              <Select value={salesPartnerId} onValueChange={setSalesPartnerId}>
                <SelectTrigger className="form-input">
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

              <Select value={salesSellerId} onValueChange={setSalesSellerId}>
                <SelectTrigger className="form-input">
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
                onClick={generateSalesReport}
                loading={loadingSales}
                icon={FileText}
                variant="primary"
              >
                Gerar Relatório
              </ModernButton>
            </div>
          </ModernCard>

          {salesReport && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ModernKPI
                  title="Total de Vendas"
                  value={salesReport.total_sales}
                  icon={BarChart3}
                  variant="info"
                />
                <ModernKPI
                  title="Valor Total"
                  value={new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(salesReport.total_value)}
                  icon={DollarSign}
                  variant="primary"
                />
                <ModernKPI
                  title="Total Comissões"
                  value={new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(salesReport.total_commission)}
                  icon={TrendingUp}
                  variant="success"
                />
              </div>

              <div className="flex justify-end">
                <ModernButton
                  onClick={exportSalesToExcel}
                  icon={Download}
                  variant="secondary"
                >
                  Exportar Excel
                </ModernButton>
              </div>

              <ModernCard title="Resultados" icon={FileText} variant="gradient" hover={false}>
                {salesReport.sales.length > 0 ? (
                  <ModernTable
                    columns={[
                      {
                        key: 'client_name',
                        label: 'Cliente',
                        sortable: true,
                        render: (value, row) => (
                          <div>
                            <p className="font-medium text-slate-900">{value}</p>
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
                        key: 'status',
                        label: 'Estado',
                        sortable: true,
                        render: (value) => {
                          const statusInfo = STATUS_MAP[value];
                          return <ModernBadge variant={statusInfo?.variant}>{statusInfo?.label}</ModernBadge>;
                        }
                      },
                      {
                        key: 'sale_date',
                        label: 'Data de Venda',
                        sortable: true,
                        render: (value, row) => (
                          <span className="text-sm text-slate-600">
                            {value ? new Date(value).toLocaleDateString('pt-PT') : new Date(row.created_at).toLocaleDateString('pt-PT')}
                          </span>
                        )
                      }
                    ]}
                    data={salesReport.sales}
                    sortable={true}
                    hoverable={true}
                    itemsPerPage={15}
                    showPagination={true}
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-500">Nenhuma venda encontrada</p>
                  </div>
                )}
              </ModernCard>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="clients" className="space-y-6 mt-6">
          <ModernCard title="Filtros de Clientes" icon={Filter} variant="gradient" hover={false}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-700 font-semibold mb-1 block">Pesquisar</label>
                <Input
                  placeholder="Nome, NIF ou email..."
                  value={clientsSearchTerm}
                  onChange={(e) => setClientsSearchTerm(e.target.value)}
                  className="form-input"
                />
              </div>

              <Select value={clientsType} onValueChange={setClientsType}>
                <SelectTrigger className="form-input">
                  <SelectValue placeholder="Tipo de Cliente" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all" className="text-slate-900">Todos</SelectItem>
                  {Object.entries(CLIENT_TYPE_MAP).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="text-slate-900">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={clientsPortfolio} onValueChange={setClientsPortfolio}>
                <SelectTrigger className="form-input">
                  <SelectValue placeholder="Encarteiramento" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all" className="text-slate-900">Todos</SelectItem>
                  {Object.entries(PORTFOLIO_STATUS_MAP).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="text-slate-900">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end mt-6">
              <ModernButton
                onClick={generateClientsReport}
                loading={loadingClients}
                icon={Users}
                variant="primary"
              >
                Gerar Relatório
              </ModernButton>
            </div>
          </ModernCard>

          {clientsReport && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ModernKPI
                  title="Total de Clientes"
                  value={clientsReport.total_clients}
                  icon={Users}
                  variant="info"
                />
                <ModernKPI
                  title="Residenciais"
                  value={clientsReport.by_type.residencial}
                  icon={Users}
                  variant="primary"
                />
                <ModernKPI
                  title="Empresariais"
                  value={clientsReport.by_type.empresarial}
                  icon={Users}
                  variant="success"
                />
              </div>

              <div className="flex justify-end">
                <ModernButton
                  onClick={exportClientsToExcel}
                  icon={Download}
                  variant="secondary"
                >
                  Exportar Excel
                </ModernButton>
              </div>

              <ModernCard title="Resultados" icon={Users} variant="gradient" hover={false}>
                {clientsReport.clients.length > 0 ? (
                  <ModernTable
                    columns={[
                      {
                        key: 'name',
                        label: 'Nome',
                        sortable: true,
                        render: (value) => (
                          <span className="font-medium text-slate-900">{value}</span>
                        )
                      },
                      {
                        key: 'nif',
                        label: 'NIF',
                        sortable: true,
                        render: (value) => (
                          <span className="font-mono text-sm text-slate-700">{value || '-'}</span>
                        )
                      },
                      {
                        key: 'email',
                        label: 'Email',
                        sortable: true,
                        render: (value) => (
                          <span className="text-sm text-slate-600">{value || '-'}</span>
                        )
                      },
                      {
                        key: 'phone',
                        label: 'Telefone',
                        sortable: true,
                        render: (value) => (
                          <span className="text-sm text-slate-700">{value || '-'}</span>
                        )
                      },
                      {
                        key: 'client_type',
                        label: 'Tipo',
                        sortable: true,
                        render: (value) => (
                          <ModernBadge variant="default">{CLIENT_TYPE_MAP[value]}</ModernBadge>
                        )
                      },
                      {
                        key: 'portfolio_status',
                        label: 'Encarteiramento',
                        sortable: true,
                        render: (value) => (
                          <span className="text-sm text-slate-700">{PORTFOLIO_STATUS_MAP[value] || '-'}</span>
                        )
                      }
                    ]}
                    data={clientsReport.clients}
                    sortable={true}
                    hoverable={true}
                    itemsPerPage={15}
                    showPagination={true}
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-500">Nenhum cliente encontrado</p>
                  </div>
                )}
              </ModernCard>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="leads" className="space-y-6 mt-6">
          <ModernCard title="Filtros de Leads" icon={Filter} variant="gradient" hover={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-700 font-semibold mb-1 block">Pesquisar</label>
                <Input
                  placeholder="Nome ou NIF do cliente..."
                  value={leadsSearchTerm}
                  onChange={(e) => setLeadsSearchTerm(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold mb-1 block">Data Início</label>
                <DatePickerPopup
                  value={leadsStartDate}
                  onChange={setLeadsStartDate}
                  placeholder="Data início"
                  allowFutureDates={true}
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold mb-1 block">Data Fim</label>
                <DatePickerPopup
                  value={leadsEndDate}
                  onChange={setLeadsEndDate}
                  placeholder="Data fim"
                  allowFutureDates={true}
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 font-semibold mb-1 block">Tipo de Venda</label>
                <Input
                  placeholder="Tipo de venda..."
                  value={leadsSaleType}
                  onChange={(e) => setLeadsSaleType(e.target.value)}
                  className="form-input"
                />
              </div>

              <Select value={leadsSellerId} onValueChange={setLeadsSellerId}>
                <SelectTrigger className="form-input">
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
                onClick={generateLeadsReport}
                loading={loadingLeads}
                icon={Target}
                variant="primary"
              >
                Gerar Relatório
              </ModernButton>
            </div>
          </ModernCard>

          {leadsReport && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ModernKPI
                  title="Total de Leads"
                  value={leadsReport.total_leads}
                  icon={Target}
                  variant="info"
                />
                <ModernKPI
                  title="Convertidos"
                  value={leadsReport.converted}
                  icon={TrendingUp}
                  variant="success"
                />
                <ModernKPI
                  title="Pendentes"
                  value={leadsReport.pending}
                  icon={Target}
                  variant="warning"
                />
              </div>

              <div className="flex justify-end">
                <ModernButton
                  onClick={exportLeadsToExcel}
                  icon={Download}
                  variant="secondary"
                >
                  Exportar Excel
                </ModernButton>
              </div>

              <ModernCard title="Resultados" icon={Target} variant="gradient" hover={false}>
                {leadsReport.leads.length > 0 ? (
                  <ModernTable
                    columns={[
                      {
                        key: 'client',
                        label: 'Cliente',
                        sortable: false,
                        render: (value) => (
                          <div>
                            <p className="font-medium text-slate-900">{value?.name || '-'}</p>
                            {value?.nif && (
                              <p className="text-sm text-slate-500 font-mono">{value.nif}</p>
                            )}
                          </div>
                        )
                      },
                      {
                        key: 'sale_type',
                        label: 'Tipo de Venda',
                        sortable: true,
                        render: (value) => (
                          <ModernBadge variant="default">{value || '-'}</ModernBadge>
                        )
                      },
                      {
                        key: 'alert_date',
                        label: 'Data de Alerta',
                        sortable: true,
                        render: (value) => (
                          <span className="text-sm text-slate-600">
                            {value ? new Date(value).toLocaleDateString('pt-PT') : '-'}
                          </span>
                        )
                      },
                      {
                        key: 'converted',
                        label: 'Convertido',
                        sortable: true,
                        render: (value) => (
                          <ModernBadge variant={value ? "success" : "warning"}>
                            {value ? "Sim" : "Não"}
                          </ModernBadge>
                        )
                      },
                      {
                        key: 'user',
                        label: 'Vendedor',
                        sortable: false,
                        render: (value) => (
                          <span className="text-sm text-slate-700">{value?.name || '-'}</span>
                        )
                      },
                      {
                        key: 'created_at',
                        label: 'Data Criação',
                        sortable: true,
                        render: (value) => (
                          <span className="text-sm text-slate-600">
                            {new Date(value).toLocaleDateString('pt-PT')}
                          </span>
                        )
                      }
                    ]}
                    data={leadsReport.leads}
                    sortable={true}
                    hoverable={true}
                    itemsPerPage={15}
                    showPagination={true}
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-500">Nenhuma lead encontrada</p>
                  </div>
                )}
              </ModernCard>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
