import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/App";
import { Link } from "react-router-dom";
import { salesService } from "@/services/salesService";
import { usersService } from "@/services/usersService";
import { operatorsService } from "@/services/operatorsService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import KPICard from "@/components/KPICard";
import { SalesLineChart, SalesBarChart, ConversionFunnelChart } from "@/components/SalesChart";
import RecentActivity from "@/components/RecentActivity";
import LeadAlerts from "@/components/LeadAlerts";
import { SkeletonKPI, SkeletonChart, SkeletonActivity } from "@/components/SkeletonLoader";
import { leadsService } from "@/services/leadsService";
import {
  TrendingUp,
  ShoppingCart,
  Euro,
  AlertTriangle,
  ArrowRight,
  Zap,
  Phone,
  Sun,
  Calendar,
  Users,
  EyeOff,
  CheckCircle,
  TrendingDown
} from "lucide-react";

const STATUS_MAP = {
  em_negociacao: { label: "Em Negociação", color: "bg-blue-50 text-blue-700 border-blue-200" },
  perdido: { label: "Perdido", color: "bg-red-50 text-red-700 border-red-200" },
  pendente: { label: "Pendente", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  ativo: { label: "Ativo", color: "bg-green-50 text-green-700 border-green-200" },
  anulado: { label: "Anulado", color: "bg-gray-50 text-[#172B4D] border-gray-200" }
};

const CATEGORY_ICONS = {
  energia: Zap,
  telecomunicacoes: Phone,
  paineis_solares: Sun
};

const CATEGORY_LABELS = {
  energia: "Energia",
  telecomunicacoes: "Telecomunicações",
  paineis_solares: "Painéis Solares"
};

export default function Dashboard() {
  const { user } = useAuth();
  const now = new Date();
  const [metrics, setMetrics] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState({ daily: [], yearly: [] });
  const [conversionData, setConversionData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasSellers, setHasSellers] = useState(false);
  const [hasHiddenOperators, setHasHiddenOperators] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      const stats = await salesService.getSaleStatistics();
      const sales = await salesService.getSales();
      const leads = await leadsService.getLeads();

      let currentUserData = null;
      if (user.role === 'backoffice') {
        const users = await usersService.getUsers();
        currentUserData = users.find(u => u.id === user.id);
      }

      if (user.role === 'admin') {
        const sellers = await usersService.getUsersByRole('vendedor');
        setHasSellers(sellers.length > 0);

        const allOperators = await operatorsService.getOperators();
        const hiddenOperators = allOperators.filter(op => !op.commission_visible_to_bo);
        setHasHiddenOperators(hiddenOperators.length > 0);
      }

      const currentYear = selectedYear;
      const currentMonth = selectedMonth;
      const lastYear = currentYear - 1;

      const currentYearSales = [];
      const lastYearSales = [];
      const currentMonthSales = [];
      const lastYearSameMonthSales = [];

      sales.forEach(sale => {
        const saleDate = new Date(sale.sale_date || sale.created_at);
        const saleYear = saleDate.getFullYear();
        const saleMonth = saleDate.getMonth();

        if (saleYear === currentYear && saleMonth === currentMonth) {
          currentMonthSales.push(sale);
        }

        if (saleYear === lastYear && saleMonth === currentMonth) {
          lastYearSameMonthSales.push(sale);
        }

        if (saleYear === currentYear) {
          currentYearSales.push(sale);
        } else if (saleYear === lastYear) {
          lastYearSales.push(sale);
        }
      });

      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      // Gráfico anual - vendas e leads por mês
      const yearlyChartData = monthNames.map((month, index) => {
        const salesCount = currentYearSales.filter(s => new Date(s.sale_date || s.created_at).getMonth() === index).length;
        const leadsCount = leads.filter(l => {
          const leadDate = new Date(l.created_at);
          return leadDate.getFullYear() === currentYear && leadDate.getMonth() === index;
        }).length;
        return {
          name: month,
          vendas: salesCount,
          leads: leadsCount
        };
      });

      // Gráfico mensal - vendas e leads por dia do mês atual
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const dailyChartData = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const salesCount = currentMonthSales.filter(s => {
          const saleDate = new Date(s.sale_date || s.created_at);
          return saleDate.getDate() === day;
        }).length;
        const leadsCount = leads.filter(l => {
          const leadDate = new Date(l.created_at);
          return leadDate.getFullYear() === currentYear &&
                 leadDate.getMonth() === currentMonth &&
                 leadDate.getDate() === day;
        }).length;
        dailyChartData.push({
          name: day.toString(),
          vendas: salesCount,
          leads: leadsCount
        });
      }

      const statusCounts = stats.byStatus || {};
      const totalCreated = currentMonthSales.length;
      const totalPending = statusCounts.pendente || 0;
      const totalCompleted = statusCounts.ativo || 0;

      const funnelData = [
        { name: 'Criadas', value: totalCreated, fill: '#3B82F6' },
        { name: 'Pendentes', value: totalPending, fill: '#F59E0B' },
        { name: 'Concretizadas', value: totalCompleted, fill: '#10B981' }
      ];

      const calcMensalidadesTelecom = (salesList) => {
        return salesList
          .filter(s => s.category === 'telecomunicacoes' && s.status === 'ativo')
          .reduce((sum, s) => sum + (s.contract_value || 0), 0);
      };

      const calcSellerCommissions = (salesList) => {
        return salesList.reduce((sum, s) => sum + (s.commission_seller || 0), 0);
      };

      const calcNonVisibleOperatorCommissions = (salesList) => {
        return salesList
          .filter(s => !s.operators?.commission_visible_to_bo)
          .reduce((sum, s) => sum + (s.commission_partner || 0), 0);
      };

      const calcPartnerCommissions = (salesList) => {
        return salesList
          .filter(s => s.operators?.commission_visible_to_bo)
          .reduce((sum, s) => sum + (s.commission_partner || 0), 0);
      };

      const calcPartnerCommissionsActive = (salesList) => {
        return salesList
          .filter(s => s.status === 'ativo' && s.operators?.commission_visible_to_bo)
          .reduce((sum, s) => sum + (s.commission_partner || 0), 0);
      };

      const calcBackofficeCommission = (salesList, percentage, threshold) => {
        const visibleCommissions = calcPartnerCommissions(salesList);
        if (visibleCommissions < (threshold || 0)) {
          return 0;
        }
        return visibleCommissions * (percentage / 100);
      };

      const currentMonthMensalidades = calcMensalidadesTelecom(currentMonthSales);
      const lastYearMonthMensalidades = calcMensalidadesTelecom(lastYearSameMonthSales);

      const calcPercentageChange = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      let metricsData = {};

      if (user.role === 'admin') {
        const currentMonthSellerCommissions = calcSellerCommissions(currentMonthSales);
        const lastYearSellerCommissions = calcSellerCommissions(lastYearSameMonthSales);

        const currentMonthNonVisibleCommissions = calcNonVisibleOperatorCommissions(currentMonthSales);
        const lastYearNonVisibleCommissions = calcNonVisibleOperatorCommissions(lastYearSameMonthSales);

        const currentMonthPartnerCommissions = calcPartnerCommissions(currentMonthSales);
        const lastYearPartnerCommissions = calcPartnerCommissions(lastYearSameMonthSales);

        const currentMonthActiveCommissions = calcPartnerCommissionsActive(currentMonthSales);
        const lastYearActiveCommissions = calcPartnerCommissionsActive(lastYearSameMonthSales);

        metricsData = {
          seller_commissions: currentMonthSellerCommissions,
          seller_commissions_yoy: calcPercentageChange(currentMonthSellerCommissions, lastYearSellerCommissions),
          non_visible_commissions: currentMonthNonVisibleCommissions,
          non_visible_commissions_yoy: calcPercentageChange(currentMonthNonVisibleCommissions, lastYearNonVisibleCommissions),
          partner_commissions: currentMonthPartnerCommissions,
          partner_commissions_yoy: calcPercentageChange(currentMonthPartnerCommissions, lastYearPartnerCommissions),
          active_commissions: currentMonthActiveCommissions,
          active_commissions_yoy: calcPercentageChange(currentMonthActiveCommissions, lastYearActiveCommissions),
        };
      } else if (user.role === 'backoffice') {
        const percentage = currentUserData?.commission_percentage || 0;
        const threshold = currentUserData?.commission_threshold || 0;

        const currentMonthBoCommission = calcBackofficeCommission(currentMonthSales, percentage, threshold);
        const lastYearBoCommission = calcBackofficeCommission(lastYearSameMonthSales, percentage, threshold);

        const currentMonthPartnerCommissions = calcPartnerCommissions(currentMonthSales);
        const lastYearPartnerCommissions = calcPartnerCommissions(lastYearSameMonthSales);

        const currentMonthActiveCommissions = calcPartnerCommissionsActive(currentMonthSales);
        const lastYearActiveCommissions = calcPartnerCommissionsActive(lastYearSameMonthSales);

        metricsData = {
          backoffice_commission: currentMonthBoCommission,
          backoffice_commission_yoy: calcPercentageChange(currentMonthBoCommission, lastYearBoCommission),
          partner_commissions: currentMonthPartnerCommissions,
          partner_commissions_yoy: calcPercentageChange(currentMonthPartnerCommissions, lastYearPartnerCommissions),
          active_commissions: currentMonthActiveCommissions,
          active_commissions_yoy: calcPercentageChange(currentMonthActiveCommissions, lastYearActiveCommissions),
        };
      }

      const expiringSoon = sales.filter(sale => {
        if (sale.status !== 'ativo' || !sale.loyalty_end_date) return false;

        const endDate = new Date(sale.loyalty_end_date);
        const now = new Date();
        const daysUntilEnd = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

        if (daysUntilEnd > 210 || daysUntilEnd < 0) return false;

        const hasRefidRenewal = sales.some(otherSale =>
          otherSale.id !== sale.id &&
          otherSale.sale_type === 'refid' &&
          otherSale.client_name === sale.client_name &&
          otherSale.client_address === sale.client_address &&
          new Date(otherSale.sale_date || otherSale.created_at) > new Date(sale.sale_date || sale.created_at)
        );

        return !hasRefidRenewal;
      }).map(sale => {
        const endDate = new Date(sale.loyalty_end_date);
        const now = new Date();
        const daysUntilEnd = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        return {
          ...sale,
          days_until_end: daysUntilEnd
        };
      }).sort((a, b) => a.days_until_end - b.days_until_end);

      const activities = currentMonthSales
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map(sale => ({
          type: sale.status === 'ativo' ? 'sale' : sale.status === 'perdido' ? 'cancelled' : 'pending',
          title: sale.client_name,
          description: `${sale.operators?.name || 'N/A'} - ${formatCurrency(sale.contract_value || 0)}`,
          time: formatRelativeTime(sale.created_at),
          status: STATUS_MAP[sale.status]?.label
        }));

      setMetrics({
        sales_this_month: currentMonthSales.length,
        total_mensalidades: currentMonthMensalidades,
        mensalidades_yoy: calcPercentageChange(currentMonthMensalidades, lastYearMonthMensalidades),
        sales_by_category: stats.byCategory,
        sales_by_status: stats.byStatus,
        ...metricsData
      });

      setMonthlyStats({
        daily: dailyChartData,
        yearly: yearlyChartData
      });
      setConversionData(funnelData);
      setRecentActivities(activities);
      setAlerts(expiringSoon);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value || 0);
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Agora mesmo';
    if (diffInHours < 24) return `Há ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Há ${diffInDays}d`;
    return date.toLocaleDateString('pt-PT');
  };

  const formatPercentage = (value) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const months = [
    { value: 0, label: "Janeiro" },
    { value: 1, label: "Fevereiro" },
    { value: 2, label: "Março" },
    { value: 3, label: "Abril" },
    { value: 4, label: "Maio" },
    { value: 5, label: "Junho" },
    { value: 6, label: "Julho" },
    { value: 7, label: "Agosto" },
    { value: 8, label: "Setembro" },
    { value: 9, label: "Outubro" },
    { value: 10, label: "Novembro" },
    { value: 11, label: "Dezembro" }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex gap-2">
            <div className="skeleton h-10 w-32"></div>
            <div className="skeleton h-10 w-24"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonKPI key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#172B4D]">Dashboard</h1>
          <p className="text-[#172B4D]/70 mt-1">Visão geral do desempenho de vendas</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="form-input text-sm py-2"
          >
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="form-input text-sm py-2"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard
          title="Quantidade de Vendas"
          value={metrics?.sales_this_month || 0}
          icon={ShoppingCart}
          trend={metrics?.sales_this_month > 0 ? 'up' : 'down'}
          trendValue={`${metrics?.sales_this_month || 0} vendas`}
          color="blue"
        />

        <KPICard
          title="Mensalidades Telecomunicações"
          value={formatCurrency(metrics?.total_mensalidades)}
          icon={Phone}
          trend={metrics?.mensalidades_yoy >= 0 ? 'up' : 'down'}
          trendValue={formatPercentage(metrics?.mensalidades_yoy || 0)}
          color="cyan"
        />

        <KPICard
          title="Comissões Ativas"
          value={formatCurrency(metrics?.active_commissions || 0)}
          icon={CheckCircle}
          trend={metrics?.active_commissions_yoy >= 0 ? 'up' : 'down'}
          trendValue={formatPercentage(metrics?.active_commissions_yoy || 0)}
          color="sky"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<SkeletonChart />}>
          <SalesLineChart
            data={monthlyStats.daily}
            title="Evolução Mensal"
            subtitle="Vendas e leads por dia do mês"
          />
        </Suspense>

        <Suspense fallback={<SkeletonChart />}>
          <SalesLineChart
            data={monthlyStats.yearly}
            title="Evolução de Vendas Anual"
            subtitle="Vendas e leads por mês do ano"
          />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Suspense fallback={<SkeletonChart />}>
          <ConversionFunnelChart data={conversionData} title="Funil de Conversão de Vendas" />
        </Suspense>

        <div className="lg:col-span-2">
          <Suspense fallback={<SkeletonActivity />}>
            <LeadAlerts />
          </Suspense>
        </div>
      </div>

      <Card className="card-leiritrix">
        <CardHeader className="border-b border-gray-200 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold text-[#172B4D] flex items-center gap-2">
            <AlertTriangle className="text-orange-500" size={20} />
            Alertas de Fidelização
          </CardTitle>
          {alerts.length > 0 && (
            <Badge className="bg-orange-50 text-orange-700 border border-orange-200 font-semibold">
              {alerts.length}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-6">
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => {
                const CategoryIcon = CATEGORY_ICONS[alert.category] || Zap;
                return (
                  <Link
                    key={alert.id}
                    to={`/sales/${alert.id}`}
                    className="flex items-start justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-50 p-2 rounded-lg">
                        <CategoryIcon className="text-[#0052CC]" size={18} />
                      </div>
                      <div>
                        <p className="text-[#172B4D] font-medium">{alert.client_name}</p>
                        <p className="text-[#172B4D]/70 text-sm">{alert.partner_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-orange-600 font-bold text-sm">
                        {alert.days_until_end} dias
                      </p>
                      <p className="text-gray-400 text-xs flex items-center gap-1 justify-end mt-1">
                        <Calendar size={12} />
                        {new Date(alert.loyalty_end_date).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" />
              <p>Sem alertas de fidelização</p>
            </div>
          )}

          {alerts.length > 5 && (
            <Link to="/sales?filter=alerts">
              <Button variant="ghost" className="w-full mt-4 text-[#0052CC] hover:bg-blue-50">
                Ver todos ({alerts.length})
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
