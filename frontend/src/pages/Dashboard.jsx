import { useState, useEffect } from "react";
import { useAuth, API } from "@/App";
import { Link } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  ShoppingCart, 
  Euro, 
  AlertTriangle,
  ArrowRight,
  Zap,
  Phone,
  Sun,
  Calendar
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const STATUS_MAP = {
  em_negociacao: { label: "Em Negociação", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  perdido: { label: "Perdido", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  pendente: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  ativo: { label: "Ativo", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  anulado: { label: "Anulado", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" }
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

const PIE_COLORS = ["#c8f31d", "#3b82f6", "#f59e0b"];

export default function Dashboard() {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [metricsRes, statsRes, alertsRes] = await Promise.all([
        axios.get(`${API}/dashboard/metrics`, { headers }),
        axios.get(`${API}/dashboard/monthly-stats?months=6`, { headers }),
        axios.get(`${API}/alerts/loyalty`, { headers })
      ]);

      setMetrics(metricsRes.data);
      setMonthlyStats(statsRes.data);
      setAlerts(alertsRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  const categoryData = metrics?.sales_by_category ? 
    Object.entries(metrics.sales_by_category).map(([key, value]) => ({
      name: CATEGORY_LABELS[key] || key,
      value
    })) : [];

  const statusData = metrics?.sales_by_status ?
    Object.entries(metrics.sales_by_status).map(([key, value]) => ({
      status: STATUS_MAP[key]?.label || key,
      count: value,
      color: STATUS_MAP[key]?.color
    })) : [];

  return (
    <div className="space-y-6" data-testid="dashboard">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="metric-card" data-testid="metric-total-sales">
          <CardContent className="p-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="metric-value">{metrics?.total_sales || 0}</p>
                <p className="metric-label">Total de Vendas</p>
              </div>
              <ShoppingCart className="text-[#c8f31d] opacity-50" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card" data-testid="metric-month-sales">
          <CardContent className="p-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="metric-value">{metrics?.sales_this_month || 0}</p>
                <p className="metric-label">Vendas Este Mês</p>
              </div>
              <TrendingUp className="text-[#c8f31d] opacity-50" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card" data-testid="metric-contract-value">
          <CardContent className="p-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="metric-value font-mono">
                  {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(metrics?.total_contract_value || 0)}
                </p>
                <p className="metric-label">Valor Contratos Ativos</p>
              </div>
              <Euro className="text-[#c8f31d] opacity-50" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card" data-testid="metric-commission">
          <CardContent className="p-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="metric-value font-mono">
                  {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(metrics?.total_commission || 0)}
                </p>
                <p className="metric-label">Total Comissões</p>
              </div>
              <Euro className="text-green-400 opacity-50" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Sales Chart */}
        <Card className="card-leiritrix lg:col-span-2" data-testid="monthly-chart">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-white font-['Manrope'] text-lg">
              Vendas Mensais
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <YAxis 
                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#082d32', 
                      border: '1px solid rgba(200,243,29,0.2)',
                      borderRadius: '0.3rem',
                      color: 'white'
                    }}
                  />
                  <Bar dataKey="sales" fill="#c8f31d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Pie Chart */}
        <Card className="card-leiritrix" data-testid="category-chart">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-white font-['Manrope'] text-lg">
              Por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-64">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#082d32', 
                        border: '1px solid rgba(200,243,29,0.2)',
                        borderRadius: '0.3rem',
                        color: 'white'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-white/50">
                  Sem dados
                </div>
              )}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {categoryData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                  />
                  <span className="text-sm text-white/70">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Summary and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Summary */}
        <Card className="card-leiritrix" data-testid="status-summary">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-white font-['Manrope'] text-lg">
              Por Estado
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {Object.entries(STATUS_MAP).map(([key, status]) => {
                const count = metrics?.sales_by_status?.[key] || 0;
                return (
                  <div key={key} className="flex items-center justify-between py-2">
                    <span className={`badge ${status.color} border`}>
                      {status.label}
                    </span>
                    <span className="text-white font-mono font-bold">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Loyalty Alerts */}
        <Card className="card-leiritrix" data-testid="loyalty-alerts">
          <CardHeader className="border-b border-white/5 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-white font-['Manrope'] text-lg flex items-center gap-2">
              <AlertTriangle className="text-[#c8f31d]" size={20} />
              Alertas de Fidelização
            </CardTitle>
            <Badge className="bg-[#c8f31d] text-[#0d474f]">
              {alerts.length}
            </Badge>
          </CardHeader>
          <CardContent className="pt-4 max-h-72 overflow-y-auto">
            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => {
                  const CategoryIcon = CATEGORY_ICONS[alert.category] || Zap;
                  return (
                    <Link 
                      key={alert.id} 
                      to={`/sales/${alert.id}`}
                      className="alert-item block"
                      data-testid={`alert-${alert.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <CategoryIcon className="text-[#c8f31d] mt-0.5" size={18} />
                          <div>
                            <p className="text-white font-medium">{alert.client_name}</p>
                            <p className="text-white/50 text-sm">{alert.partner}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[#c8f31d] font-mono font-bold">
                            {alert.days_until_end} dias
                          </p>
                          <p className="text-white/40 text-xs flex items-center gap-1 justify-end">
                            <Calendar size={12} />
                            {new Date(alert.loyalty_end_date).toLocaleDateString('pt-PT')}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-white/50">
                <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" />
                <p>Sem alertas de fidelização</p>
              </div>
            )}
            
            {alerts.length > 5 && (
              <Link to="/sales?filter=alerts">
                <Button variant="ghost" className="w-full mt-4 text-[#c8f31d] hover:bg-[#c8f31d]/10">
                  Ver todos ({alerts.length})
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
