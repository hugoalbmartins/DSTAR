import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/App";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Users,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Building2,
  Radio,
  Settings,
  UserCircle,
  ClipboardList,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/NotificationBell";

const LOGO_URL = "/logo_dstar_semfundo.png";

export const Layout = () => {
  const { user, logout, isAdmin, isAdminOrBackoffice } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, show: true },
    { name: "Vendas", href: "/sales", icon: ShoppingCart, show: true },
    { name: "Nova Venda", href: "/sales/new", icon: PlusCircle, show: true },
    { name: "Clientes", href: "/clients", icon: UserCircle, show: true },
    { name: "Leads", href: "/leads", icon: ClipboardList, show: true },
    { name: "Parceiros", href: "/partners", icon: Building2, show: isAdminOrBackoffice },
    { name: "Operadoras", href: "/operators", icon: Radio, show: isAdminOrBackoffice },
    { name: "Relatórios", href: "/reports", icon: FileText, show: isAdminOrBackoffice },
    { name: "Utilizadores", href: "/users", icon: Users, show: isAdmin },
    { name: "Comissões", href: "/settings/commissions", icon: Settings, show: isAdmin },
  ];

  const isActive = (href) => {
    if (href === "/sales") {
      return location.pathname === "/sales";
    }
    return location.pathname.startsWith(href);
  };

  const getPageTitle = () => {
    const path = location.pathname;

    // Special routes (UUID or numeric IDs)
    if (path.match(/^\/sales\/[^/]+\/edit$/)) return "Edição de venda";
    if (path.match(/^\/sales\/[^/]+$/) && !path.includes('/new')) return "Detalhes da venda";
    if (path.match(/^\/clients\/[^/]+\/edit$/)) return "Editar cliente";
    if (path.match(/^\/clients\/[^/]+$/) && !path.includes('/new')) return "Detalhes do cliente";
    if (path.match(/^\/leads\/[^/]+\/edit$/)) return "Editar lead";

    // Standard navigation
    const activeNav = navigation.find(item => isActive(item.href));
    if (activeNav) return activeNav.name;

    // Default fallback
    return "Dashboard";
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { text: "Admin", class: "bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-glow" },
      backoffice: { text: "Backoffice", class: "bg-brand-100 text-brand-700 border border-brand-200" },
      vendedor: { text: "Vendedor", class: "bg-slate-100 text-slate-700 border border-slate-300" }
    };
    return badges[role] || badges.vendedor;
  };

  const badge = getRoleBadge(user?.role);
  const sidebarWidth = sidebarCollapsed ? 'w-20' : 'w-64';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Mobile menu button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl text-white bg-gradient-to-br from-brand-600 to-brand-700 shadow-glow transition-all hover:shadow-glow-lg"
        data-testid="mobile-menu-btn"
      >
        <AnimatePresence mode="wait">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </AnimatePresence>
      </motion.button>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={`fixed top-0 left-0 h-full bg-white/95 backdrop-blur-xl border-r border-slate-200/60 z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 shadow-2xl shadow-slate-200/50`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="relative p-6 border-b border-slate-200/60 flex items-center justify-center bg-gradient-to-br from-brand-600 to-brand-800 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 to-transparent"></div>
            <motion.img
              animate={{ opacity: sidebarCollapsed ? 0 : 1, scale: sidebarCollapsed ? 0.8 : 1 }}
              transition={{ duration: 0.2 }}
              src={LOGO_URL}
              alt="CRM Dolphin+Star"
              className="h-16 w-auto relative z-10"
              data-testid="logo"
            />
            {sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white font-bold text-2xl"
              >
                D+
              </motion.div>
            )}
          </div>

          {/* Collapse Button - Desktop Only */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex absolute top-24 -right-3 z-50 p-1.5 rounded-full bg-white border-2 border-brand-500 text-brand-600 shadow-lg hover:shadow-glow transition-all hover:scale-110"
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin" data-testid="sidebar-nav">
            {navigation.filter(item => item.show).map((item, index) => {
              const active = isActive(item.href);
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                      active
                        ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-glow'
                        : 'text-slate-700 hover:bg-gradient-to-r hover:from-brand-50 hover:to-blue-50 hover:text-brand-700'
                    }`}
                    data-testid={`nav-${item.name.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <item.icon size={20} className={`${active ? 'drop-shadow-sm' : ''}`} />
                    <motion.span
                      animate={{ opacity: sidebarCollapsed ? 0 : 1, width: sidebarCollapsed ? 0 : 'auto' }}
                      transition={{ duration: 0.2 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.name}
                    </motion.span>
                    {active && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-slate-200/60 bg-gradient-to-br from-slate-50 to-blue-50/30">
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-3"
              >
                <p className="text-slate-900 font-semibold truncate text-sm">{user?.name}</p>
                <p className="text-slate-600 text-xs truncate mt-0.5">{user?.email}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-lg text-xs font-semibold ${badge.class}`}>
                  {badge.text}
                </span>
              </motion.div>
            )}
            <Button
              onClick={logout}
              variant="ghost"
              className={`w-full ${sidebarCollapsed ? 'justify-center px-0' : 'justify-start'} text-slate-700 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 transition-all hover:shadow-md`}
              data-testid="logout-btn"
            >
              <LogOut size={18} className={sidebarCollapsed ? '' : 'mr-2'} />
              {!sidebarCollapsed && <span>Sair</span>}
            </Button>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="min-h-screen w-full">
        <div className={`min-h-screen transition-[margin] duration-300 ease-out ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
          {/* Top bar */}
          <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 lg:px-6 py-4 flex items-center justify-between shadow-sm">
            <div className="lg:hidden w-12"></div>
            <Link to="/dashboard">
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-900 to-brand-700 bg-clip-text text-transparent hover:from-brand-600 hover:to-brand-800 transition-all cursor-pointer"
              >
                CRM DOLPHIN+STAR
              </motion.h1>
            </Link>
            <div className="flex items-center gap-4">
              <NotificationBell userId={user?.id} />
            </div>
          </div>

          {/* Page content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-4 lg:p-6"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
