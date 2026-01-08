import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/App";
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
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/NotificationBell";

const LOGO_URL = "/leiritrix.png";

export const Layout = () => {
  const { user, logout, isAdmin, isAdminOrBackoffice } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, show: true },
    { name: "Vendas", href: "/sales", icon: ShoppingCart, show: true },
    { name: "Nova Venda", href: "/sales/new", icon: PlusCircle, show: true },
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

  const getRoleBadge = (role) => {
    const badges = {
      admin: { text: "Admin", class: "bg-blue-100 text-blue-700 border border-blue-200" },
      backoffice: { text: "Backoffice", class: "bg-purple-100 text-purple-700 border border-purple-200" },
      vendedor: { text: "Vendedor", class: "bg-gray-100 text-gray-700 border border-gray-200" }
    };
    return badges[role] || badges.vendedor;
  };

  const badge = getRoleBadge(user?.role);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-slate-800 text-white shadow-lg"
        data-testid="mobile-menu-btn"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-700">
            <img
              src={LOGO_URL}
              alt="CRM Leiritrix"
              className="h-10 w-auto brightness-0 invert"
              data-testid="logo"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1" data-testid="sidebar-nav">
            {navigation.filter(item => item.show).map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`sidebar-item flex items-center gap-3 px-4 py-3 ${active ? 'active' : ''}`}
                  data-testid={`nav-${item.name.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-slate-700">
            <div className="mb-4">
              <p className="text-white font-semibold truncate text-sm">{user?.name}</p>
              <p className="text-slate-400 text-xs truncate mt-0.5">{user?.email}</p>
              <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${badge.class}`}>
                {badge.text}
              </span>
            </div>
            <Button
              onClick={logout}
              variant="ghost"
              className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-700/50"
              data-testid="logout-btn"
            >
              <LogOut size={18} className="mr-2" />
              Terminar Sessão
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {/* Top bar */}
        <div className="top-bar px-6 py-4 flex items-center justify-between">
          <div className="lg:hidden w-8"></div>
          <h1 className="text-xl font-bold text-slate-800">
            {navigation.find(item => isActive(item.href))?.name || "CRM Leiritrix"}
          </h1>
          <div className="flex items-center gap-4">
            <NotificationBell userId={user?.id} />
          </div>
        </div>

        {/* Page content */}
        <div className="p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
