import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/App";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { salesService } from "@/services/salesService";
import { partnersService } from "@/services/partnersService";
import { operatorsService } from "@/services/operatorsService";
import { ModernCard, ModernButton, ModernBadge } from "@/components/modern";
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
  Search,
  Loader2,
  ShoppingBag
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
  const navigate = useNavigate();
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

  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

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
      if (showLoading) {
        toast.error("Erro ao carregar dados");
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [searchType, searchText, statusFilter, categoryFilter, partnerFilter, operatorFilter, dateType, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(false);
    }, 30000);

    return () => clearInterval(interval);
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
  };

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
        <ModernButton
          onClick={() => navigate('/sales/new')}
          variant="primary"
          icon={Plus}
          iconPosition="left"
          data-testid="new-sale-btn"
        >
          Nova Venda
        </ModernButton>
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

      {/* Sales Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ModernCard title="Gestão de Vendas" icon={ShoppingBag} variant="gradient">
          {sales.length === 0 ? (
            <div className="text-center py-12">
              {hasFilters ? (
                <>
                  <p className="text-slate-500 mb-4">Nenhuma venda encontrada com os filtros aplicados</p>
                  <ModernButton variant="secondary" onClick={clearFilters}>
                    Limpar Filtros
                  </ModernButton>
                </>
              ) : (
                <>
                  <p className="text-slate-500 mb-4">Ainda não existem vendas registadas</p>
                  <ModernButton onClick={() => navigate('/sales/new')} variant="primary" icon={Plus}>
                    Criar Primeira Venda
                  </ModernButton>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {sales.map((sale) => {
                const status = STATUS_MAP[sale.status];
                const categoryInfo = CATEGORY_MAP[sale.category];
                const CategoryIcon = categoryInfo?.icon;

                let commission = 0;
                let showCommission = false;

                if (user.role === 'admin' || user.role === 'backoffice') {
                  const shouldShowCommission = user.role === 'admin' || sale.operators?.commission_visible_to_bo;
                  if (shouldShowCommission) {
                    commission = sale.commission_partner || 0;
                    showCommission = true;
                  }
                } else if (user.role === 'vendedor') {
                  commission = sale.commission_seller || 0;
                  showCommission = true;
                }

                return (
                  <div
                    key={sale.id}
                    className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900">
                          {sale.sale_date ? new Date(sale.sale_date).toLocaleDateString('pt-PT') : 'Sem data'}
                        </h3>
                      </div>
                      <ModernBadge variant={status?.color}>{status?.label}</ModernBadge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Cliente</p>
                        <p className="font-semibold text-slate-900">{sale.client_name}</p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Parceiro</p>
                        <p className="text-slate-700">{sale.partners?.name || '-'}</p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Operadora</p>
                        <p className="text-slate-700">{sale.operators?.name || '-'}</p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Âmbito</p>
                        <div className="flex items-center gap-2">
                          {CategoryIcon && <CategoryIcon size={16} className={categoryInfo?.color} />}
                          <p className="text-slate-700">{categoryInfo?.label || '-'}</p>
                        </div>
                      </div>

                      {sale.tariff && (
                        <div className="md:col-span-2">
                          <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Tarifário</p>
                          <p className="text-slate-700">{sale.tariff}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                      <div className="flex gap-4">
                        {showCommission && (
                          <div>
                            <p className="text-xs text-slate-500">Comissão</p>
                            <p className="font-mono text-lg text-brand-600 font-bold">
                              {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(commission)}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-slate-500">Valor</p>
                          <p className="font-mono text-lg text-slate-900 font-bold">
                            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(sale.contract_value || 0)}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <ModernButton
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/sales/${sale.id}/edit`)}
                        >
                          Editar
                        </ModernButton>
                        <ModernButton
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/sales/${sale.id}`)}
                          icon={Eye}
                        />
                        {isAdminOrBackoffice && (
                          <ModernButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(sale.id)}
                            icon={Trash2}
                            className="text-red-600 hover:text-red-700"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ModernCard>
      </motion.div>

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
