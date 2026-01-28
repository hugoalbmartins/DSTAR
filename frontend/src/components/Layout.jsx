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
  Settings,
  UserCircle,
  ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/NotificationBell";

const LOGO_URL = "/logo_dolphinstar_fundopreto_vertical.jpg";

export const Layout = () => {
  const { user, logout, isAdmin, isAdminOrBackoffice } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const getRoleBadge = (role) => {
    const badges = {
      admin: { text: "Admin", class: "bg-[#0052CC] text-white" },
      backoffice: { text: "Backoffice", class: "bg-blue-50 text-blue-700 border border-blue-200" },
      vendedor: { text: "Vendedor", class: "bg-gray-100 text-[#172B4D] border border-gray-300" }
    };
    return badges[role] || badges.vendedor;
  };

  const badge = getRoleBadge(user?.role);

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg shadow-lg text-white bg-[#0052CC] transition-all hover:bg-[#0747A6]"
        data-testid="mobile-menu-btn"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 shadow-sm`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-center bg-[#0052CC]">
            <img
              src={LOGO_URL}
              alt="CRM Dolphin+Star"
              className="h-20 w-auto"
              data-testid="logo"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto" data-testid="sidebar-nav">
            {navigation.filter(item => item.show).map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                    active
                      ? 'bg-[#0052CC] text-white shadow-md'
                      : 'text-[#172B4D] hover:bg-gray-50 hover:text-[#0052CC]'
                  }`}
                  data-testid={`nav-${item.name.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="mb-4">
              <p className="text-[#172B4D] font-semibold truncate text-sm">{user?.name}</p>
              <p className="text-[#172B4D] opacity-70 text-xs truncate mt-0.5">{user?.email}</p>
              <span className={`inline-block mt-2 px-2 py-1 rounded-md text-xs font-medium ${badge.class}`}>
                {badge.text}
              </span>
            </div>
            <Button
              onClick={logout}
              variant="ghost"
              className="w-full justify-start text-[#172B4D] hover:text-[#0052CC] hover:bg-gray-100 transition-colors"
              data-testid="logout-btn"
            >
              <LogOut size={18} className="mr-2" />
              Terminar Sessão
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="lg:hidden w-8"></div>
          <h1 className="text-xl font-bold text-[#172B4D] font-['Manrope']">
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
          className="lg:hidden fixed inset-0 bg-black/30 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
