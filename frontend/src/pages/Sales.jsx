import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/App";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { salesService } from "@/services/salesService";
import { partnersService } from "@/services/partnersService";
import { operatorsService } from "@/services/operatorsService";
import { ModernCard, ModernButton, ModernBadge } from "@/components/modern";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerPopup } from "@/components/ui/date-picker-popup";
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  Zap,
  Phone,
  Sun,
  X,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
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

const STATUS_MAP = {
  em_negociacao: { label: "Em Negociação", color: "info", gradient: "from-blue-500 to-blue-600" },
  perdido: { label: "Perdido", color: "danger", gradient: "from-red-500 to-red-600" },
  pendente: { label: "Pendente", color: "warning", gradient: "from-yellow-500 to-yellow-600" },
  ativo: { label: "Ativo", color: "success", gradient: "from-green-500 to-green-600" },
  anulado: { label: "Anulado", color: "default", gradient: "from-slate-500 to-slate-600" }
};

const CATEGORY_MAP = {
  energia: { label: "Energia", icon: Zap, color: "text-yellow-500" },
  telecomunicacoes: { label: "Telecomunicações", icon: Phone, color: "text-blue-500" },
  paineis_solares: { label: "Painéis Solares", icon: Sun, color: "text-orange-500" }
};

const TYPE_MAP = {
  nova_instalacao: "Nova Instalação",
  refid: "Refid",
  NI: "Nova Instalação",
  MC: "Mudança de Casa",
  Refid: "Refid",
  Refid_Acrescimo: "Refid c/ Acréscimo",
  Refid_Decrescimo: "Refid c/ Decréscimo",
  Up_sell: "Up-sell",
  Cross_sell: "Cross-sell"
};

const removeAccents = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export default function Sales() {
  const { user, isAdminOrBackoffice } = useAuth();
  const [sales, setSales] = useState([]);
  const [allSales, setAllSales] = useState([]);
  const [partners, setPartners] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchType, setSearchType] = useState("none");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [operatorFilter, setOperatorFilter] = useState("all");
  const [dateType, setDateType] = useState("none");
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);

  const [showFilters, setShowFilters] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState("sale_date");
  const [sortDirection, setSortDirection] = useState("desc");

  const ITEMS_PER_PAGE = 10;

  const fetchData = useCallback(async () => {
    try {
      const [partnersData, operatorsData, salesData] = await Promise.all([
        partnersService.getPartners(),
        operatorsService.getOperators(),
        salesService.getSales(null, {})
      ]);

      setPartners(partnersData);
      setOperators(operatorsData);
      setAllSales(salesData);

      let filtered = salesData;

      if (searchType && searchType !== "none" && searchText) {
        if (searchType === "nif") {
          filtered = filtered.filter(sale =>
            sale.client_nif?.includes(searchText)
          );
        } else if (searchType === "name") {
          const searchNormalized = removeAccents(searchText.toLowerCase());
          filtered = filtered.filter(sale => {
            const nameNormalized = removeAccents(sale.client_name?.toLowerCase() || "");
            return nameNormalized.includes(searchNormalized);
          });
        }
      }

      if (statusFilter && statusFilter !== "all") {
        filtered = filtered.filter(sale => sale.status === statusFilter);
      }

      if (categoryFilter && categoryFilter !== "all") {
        filtered = filtered.filter(sale => sale.category === categoryFilter);
      }

      if (partnerFilter && partnerFilter !== "all") {
        filtered = filtered.filter(sale => sale.partner_id === partnerFilter);
      }

      if (operatorFilter && operatorFilter !== "all") {
        filtered = filtered.filter(sale => sale.operator_id === operatorFilter);
      }

      if (dateType && dateType !== "none" && (dateFrom || dateTo)) {
        const endDate = dateTo || new Date();
        const dateField = dateType === "sale_date" ? "sale_date" : "active_date";
        filtered = filtered.filter(sale => {
          if (!sale[dateField]) return false;
          const date = new Date(sale[dateField]);
          if (dateFrom && date < dateFrom) return false;
          if (date > endDate) return false;
          return true;
        });
      }

      setSales(filtered);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [searchType, searchText, statusFilter, categoryFilter, partnerFilter, operatorFilter, dateType, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredOperators = categoryFilter && categoryFilter !== "all"
    ? operators.filter(op => op.category === categoryFilter)
    : operators;

  useEffect(() => {
    if (categoryFilter && categoryFilter !== "all" && operatorFilter && operatorFilter !== "all") {
      const selectedOperator = operators.find(op => op.id === operatorFilter);
      if (selectedOperator && selectedOperator.category !== categoryFilter) {
        setOperatorFilter("all");
      }
    }
  }, [categoryFilter, operatorFilter, operators]);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await salesService.deleteSale(deleteId);
      toast.success("Venda eliminada com sucesso");
      setSales(sales.filter(s => s.id !== deleteId));
    } catch (error) {
      toast.error("Erro ao eliminar venda");
    } finally {
      setDeleteId(null);
    }
  };

  const clearFilters = () => {
    setSearchType("none");
    setSearchText("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setPartnerFilter("all");
    setOperatorFilter("all");
    setDateType("none");
    setDateFrom(null);
    setDateTo(null);
    setCurrentPage(1);
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const sortedSales = [...sales].sort((a, b) => {
    let aValue = a[sortColumn];
    let bValue = b[sortColumn];

    if (sortColumn === "client_name") {
      aValue = a.client_name || "";
      bValue = b.client_name || "";
    } else if (sortColumn === "category") {
      aValue = CATEGORY_MAP[a.category]?.label || "";
      bValue = CATEGORY_MAP[b.category]?.label || "";
    } else if (sortColumn === "partner_name") {
      aValue = a.partner_name || "";
      bValue = b.partner_name || "";
    } else if (sortColumn === "contract_value") {
      aValue = a.contract_value || 0;
      bValue = b.contract_value || 0;
    } else if (sortColumn === "commission") {
      aValue = a.commission || 0;
      bValue = b.commission || 0;
    } else if (sortColumn === "status") {
      aValue = STATUS_MAP[a.status]?.label || "";
      bValue = STATUS_MAP[b.status]?.label || "";
    } else if (sortColumn === "sale_date") {
      aValue = new Date(a.sale_date || a.created_at).getTime();
      bValue = new Date(b.sale_date || b.created_at).getTime();
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedSales.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSales = sortedSales.slice(startIndex, endIndex);

  const hasFilters = (searchType && searchType !== "none") || searchText || (statusFilter && statusFilter !== "all") || (categoryFilter && categoryFilter !== "all") || (partnerFilter && partnerFilter !== "all") || (operatorFilter && operatorFilter !== "all") || (dateType && dateType !== "none") || dateFrom || dateTo;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="sales-page">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-brand-700 bg-clip-text text-transparent">
            Vendas
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            {sales.length} {sales.length === 1 ? 'registo encontrado' : 'registos encontrados'}
          </p>
        </div>
        <Link to="/sales/new">
          <ModernButton
            variant="primary"
            icon={Plus}
            iconPosition="left"
            data-testid="new-sale-btn"
          >
            Nova Venda
          </ModernButton>
        </Link>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <div className="flex flex-wrap gap-2 items-center">
          <ModernButton
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "primary" : "secondary"}
            icon={Filter}
            iconPosition="left"
            size="md"
          >
            Filtros
          </ModernButton>

          {hasFilters && (
            <>
              <ModernButton
                onClick={clearFilters}
                variant="ghost"
                icon={X}
                iconPosition="left"
                size="md"
                data-testid="clear-filters-btn"
              >
                Limpar
              </ModernButton>
              <ModernBadge variant="primary" size="md">
                {sales.length} resultado{sales.length !== 1 ? 's' : ''}
              </ModernBadge>
            </>
          )}
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ModernCard
                variant="gradient"
                className="overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  {/* Search */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-2 block">
                        Tipo de Pesquisa
                      </label>
                      <Select value={searchType || "none"} onValueChange={(value) => {
                        setSearchType(value === "none" ? "" : value);
                        setSearchText("");
                      }}>
                        <SelectTrigger className="h-10 border-slate-300 focus:border-brand-500 focus:ring-brand-500">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          <SelectItem value="nif">NIF</SelectItem>
                          <SelectItem value="name">Nome</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {searchType && searchType !== "none" && (
                      <div className="md:col-span-3">
                        <label className="text-xs font-semibold text-slate-700 mb-2 block">
                          {searchType === "nif" ? "NIF do Cliente" : "Nome do Cliente"}
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <Input
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder={searchType === "nif" ? "Digite o NIF..." : "Digite o nome..."}
                            className="h-10 pl-10 border-slate-300 focus:border-brand-500 focus:ring-brand-500"
                            data-testid="search-text-input"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-2 block">Estado</label>
                      <Select value={statusFilter || "all"} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-10" data-testid="status-filter">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {Object.entries(STATUS_MAP).map(([key, status]) => (
                            <SelectItem key={key} value={key}>{status.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-2 block">Categoria</label>
                      <Select value={categoryFilter || "all"} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="h-10" data-testid="category-filter">
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          {Object.entries(CATEGORY_MAP).map(([key, cat]) => (
                            <SelectItem key={key} value={key}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-2 block">Operadora</label>
                      <Select value={operatorFilter || "all"} onValueChange={setOperatorFilter}>
                        <SelectTrigger className="h-10" data-testid="operator-filter">
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          <SelectItem value="all">Todas</SelectItem>
                          {filteredOperators.map((operator) => (
                            <SelectItem key={operator.id} value={operator.id}>{operator.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-2 block">Parceiro</label>
                      <Select value={partnerFilter || "all"} onValueChange={setPartnerFilter}>
                        <SelectTrigger className="h-10" data-testid="partner-filter">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {partners.map((partner) => (
                            <SelectItem key={partner.id} value={partner.id}>{partner.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Date Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-2 block">Tipo de Data</label>
                      <Select value={dateType || "none"} onValueChange={(value) => {
                        setDateType(value);
                        if (value === "none") {
                          setDateFrom(null);
                          setDateTo(null);
                        }
                      }}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          <SelectItem value="sale_date">Data de Venda</SelectItem>
                          <SelectItem value="active_date">Data de Ativação</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {dateType && dateType !== "none" && (
                      <>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 mb-2 block">Data De</label>
                          <DatePickerPopup
                            value={dateFrom}
                            onChange={setDateFrom}
                            placeholder="Data inicial"
                            className="w-full h-10"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 mb-2 block">Data Até</label>
                          <DatePickerPopup
                            value={dateTo}
                            onChange={setDateTo}
                            placeholder="Hoje"
                            className="w-full h-10"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </ModernCard>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Desktop Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="hidden lg:block"
      >
        <ModernCard variant="white" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">
                    <button onClick={() => handleSort("client_name")} className="flex items-center gap-2 hover:text-brand-600">
                      Cliente
                      <ArrowUpDown size={14} className={sortColumn === "client_name" ? "text-brand-600" : "text-slate-400"} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">
                    <button onClick={() => handleSort("category")} className="flex items-center gap-2 hover:text-brand-600">
                      Categoria
                      <ArrowUpDown size={14} className={sortColumn === "category" ? "text-brand-600" : "text-slate-400"} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">
                    <button onClick={() => handleSort("partner_name")} className="flex items-center gap-2 hover:text-brand-600">
                      Parceiro
                      <ArrowUpDown size={14} className={sortColumn === "partner_name" ? "text-brand-600" : "text-slate-400"} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">
                    <button onClick={() => handleSort("contract_value")} className="flex items-center gap-2 hover:text-brand-600">
                      Valor
                      <ArrowUpDown size={14} className={sortColumn === "contract_value" ? "text-brand-600" : "text-slate-400"} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Comissão</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">
                    <button onClick={() => handleSort("status")} className="flex items-center gap-2 hover:text-brand-600">
                      Estado
                      <ArrowUpDown size={14} className={sortColumn === "status" ? "text-brand-600" : "text-slate-400"} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">
                    <button onClick={() => handleSort("sale_date")} className="flex items-center gap-2 hover:text-brand-600">
                      Data
                      <ArrowUpDown size={14} className={sortColumn === "sale_date" ? "text-brand-600" : "text-slate-400"} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedSales.length > 0 ? (
                  paginatedSales.map((sale, index) => {
                    const category = CATEGORY_MAP[sale.category];
                    const CategoryIcon = category?.icon || Zap;
                    const status = STATUS_MAP[sale.status];

                    return (
                      <motion.tr
                        key={sale.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-brand-50/30 transition-colors"
                        data-testid={`sale-row-${sale.id}`}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-slate-900">{sale.client_name}</p>
                            {sale.client_nif && (
                              <p className="text-slate-500 text-xs font-mono mt-0.5">{sale.client_nif}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <CategoryIcon size={18} className={category?.color} />
                            <span className="text-sm font-medium text-slate-700">{category?.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-600">{TYPE_MAP[sale.sale_type] || "-"}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {sale.partners?.name || sale.partner_name || "-"}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-brand-600 font-semibold">
                          {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(sale.contract_value)}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm">
                          {(() => {
                            const shouldShowCommission =
                              user.role === 'admin' ||
                              (user.role === 'backoffice' && sale.operators?.commission_visible_to_bo);

                            if (!shouldShowCommission) return <span className="text-slate-300">-</span>;
                            if (sale.commission !== null && sale.commission !== undefined) {
                              return (
                                <span className="text-green-600 font-semibold">
                                  {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(sale.commission)}
                                </span>
                              );
                            }
                            return <span className="text-slate-300">-</span>;
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          <ModernBadge variant={status?.color} size="sm">
                            {status?.label}
                          </ModernBadge>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {new Date(sale.sale_date || sale.created_at).toLocaleDateString('pt-PT')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link to={`/sales/${sale.id}`}>
                              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-brand-600" data-testid={`view-sale-${sale.id}`}>
                                <Eye size={16} />
                              </Button>
                            </Link>
                            <Link to={`/sales/${sale.id}/edit`}>
                              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-600" data-testid={`edit-sale-${sale.id}`}>
                                <Edit2 size={16} />
                              </Button>
                            </Link>
                            {isAdminOrBackoffice && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-600 hover:text-red-600"
                                onClick={() => setDeleteId(sale.id)}
                                data-testid={`delete-sale-${sale.id}`}
                              >
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-500">
                      Nenhuma venda encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ModernCard>
      </motion.div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {paginatedSales.length > 0 ? (
          paginatedSales.map((sale, index) => {
            const category = CATEGORY_MAP[sale.category];
            const CategoryIcon = category?.icon || Zap;
            const status = STATUS_MAP[sale.status];

            return (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ModernCard variant="white" hover className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900">{sale.client_name}</h3>
                        {sale.client_nif && (
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{sale.client_nif}</p>
                        )}
                      </div>
                      <ModernBadge variant={status?.color} size="sm">
                        {status?.label}
                      </ModernBadge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs">Categoria</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <CategoryIcon size={16} className={category?.color} />
                          <span className="font-medium">{category?.label}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Valor</p>
                        <p className="font-mono font-bold text-brand-600 mt-0.5">
                          {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(sale.contract_value)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Parceiro</p>
                        <p className="font-medium text-slate-700 mt-0.5">{sale.partners?.name || sale.partner_name || "-"}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Data</p>
                        <p className="font-medium text-slate-700 mt-0.5">
                          {new Date(sale.sale_date || sale.created_at).toLocaleDateString('pt-PT')}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-200">
                      <Link to={`/sales/${sale.id}`} className="flex-1">
                        <ModernButton variant="secondary" size="sm" icon={Eye} className="w-full">
                          Ver
                        </ModernButton>
                      </Link>
                      <Link to={`/sales/${sale.id}/edit`} className="flex-1">
                        <ModernButton variant="secondary" size="sm" icon={Edit2} className="w-full">
                          Editar
                        </ModernButton>
                      </Link>
                      {isAdminOrBackoffice && (
                        <ModernButton
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => setDeleteId(sale.id)}
                        />
                      )}
                    </div>
                  </div>
                </ModernCard>
              </motion.div>
            );
          })
        ) : (
          <ModernCard variant="white" className="p-12 text-center">
            <p className="text-slate-500">Nenhuma venda encontrada</p>
          </ModernCard>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p className="text-slate-600 text-sm">
            Página {currentPage} de {totalPages} ({sortedSales.length} vendas)
          </p>
          <div className="flex gap-2">
            <ModernButton
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              icon={ChevronLeft}
            >
              Anterior
            </ModernButton>

            <div className="hidden sm:flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <ModernButton
                      key={page}
                      variant={page === currentPage ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </ModernButton>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="text-slate-400 px-2">...</span>;
                }
                return null;
              })}
            </div>

            <ModernButton
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              icon={ChevronRight}
              iconPosition="right"
            >
              Seguinte
            </ModernButton>
          </div>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">Eliminar Venda</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Tem a certeza que pretende eliminar esta venda? Esta ação não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-300">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
