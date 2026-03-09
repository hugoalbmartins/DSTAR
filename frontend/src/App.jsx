import { useState, useEffect, useRef, createContext, useContext, lazy, Suspense } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { PasswordChangeModal } from "@/components/PasswordChangeModal";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import BackupAlert from "@/components/BackupAlert";
import { pushNotificationService } from "@/services/pushNotificationService";

const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Sales = lazy(() => import("@/pages/Sales"));
const SaleForm = lazy(() => import("@/pages/SaleForm"));
const SaleDetail = lazy(() => import("@/pages/SaleDetail"));
const Clients = lazy(() => import("@/pages/Clients"));
const ClientForm = lazy(() => import("@/pages/ClientForm"));
const ClientDetail = lazy(() => import("@/pages/ClientDetail"));
const Leads = lazy(() => import("@/pages/Leads"));
const LeadForm = lazy(() => import("@/pages/LeadForm"));
const Reports = lazy(() => import("@/pages/Reports"));
const Users = lazy(() => import("@/pages/Users"));
const Partners = lazy(() => import("@/pages/Partners"));
const Operators = lazy(() => import("@/pages/Operators"));
const CommissionSettings = lazy(() => import("@/pages/CommissionSettings"));
const CommissionWizard = lazy(() => import("@/pages/CommissionWizard"));
const Layout = lazy(() => import("@/components/Layout"));

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        if (currentUser?.must_change_password) {
          setShowPasswordChange(true);
        }
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = authService.onAuthStateChange((event, session, userProfile) => {
      if (event === 'SIGNED_IN') {
        setUser(userProfile);
        if (userProfile?.must_change_password) {
          setShowPasswordChange(true);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setShowPasswordChange(false);
        setShouldRedirectToLogin(true);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setShowPasswordChange(false);
      toast.success("Logout efetuado com sucesso");
      setShouldRedirectToLogin(true);
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
  };

  const handleIdleTimeout = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setShowPasswordChange(false);
      toast.warning("Sessão expirada por inatividade");
      setShouldRedirectToLogin(true);
    } catch (error) {
      console.error("Error during idle logout:", error);
      setShouldRedirectToLogin(true);
    }
  };

  useIdleTimeout(user ? handleIdleTimeout : null, 1800000);

  const notifIntervalRef = useRef(null);

  useEffect(() => {
    if (user?.id) {
      pushNotificationService.processAllNotifications(user.id);

      notifIntervalRef.current = setInterval(() => {
        pushNotificationService.processAllNotifications(user.id);
      }, 300000);
    }

    return () => {
      if (notifIntervalRef.current) {
        clearInterval(notifIntervalRef.current);
      }
    };
  }, [user?.id]);

  const handlePasswordChanged = async (currentPassword, newPassword) => {
    await authService.changePassword(currentPassword, newPassword);
    setShowPasswordChange(false);
    const updatedUser = await authService.getCurrentUser();
    setUser(updatedUser);
  };

  const value = {
    user,
    setUser,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isAdminOrBackoffice: user?.role === "admin" || user?.role === "backoffice",
    shouldRedirectToLogin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <PasswordChangeModal
        open={showPasswordChange}
        onPasswordChanged={handlePasswordChanged}
      />
    </AuthContext.Provider>
  );
};

const AuthRedirectHandler = () => {
  const { shouldRedirectToLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (shouldRedirectToLogin) {
      navigate('/login', { replace: true });
    }
  }, [shouldRedirectToLogin, navigate]);

  return null;
};

// Protected Route
const ProtectedRoute = ({ children, requireAdmin = false, requireAdminOrBO = false }) => {
  const { isAuthenticated, loading, isAdmin, isAdminOrBackoffice } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d474f]">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    toast.error("Acesso restrito a administradores");
    return <Navigate to="/dashboard" replace />;
  }

  if (requireAdminOrBO && !isAdminOrBackoffice) {
    toast.error("Acesso restrito");
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <AuthRedirectHandler />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0d474f]">
          <div className="spinner"></div>
        </div>
      }>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="sales" element={<Sales />} />
        <Route path="sales/new" element={<SaleForm />} />
        <Route path="sales/:id" element={<SaleDetail />} />
        <Route path="sales/:id/edit" element={<SaleDetail editMode={true} />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/new" element={<ClientForm />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="clients/:id/edit" element={<ClientForm />} />
        <Route path="leads" element={<Leads />} />
        <Route path="leads/new" element={<LeadForm />} />
        <Route path="leads/:id/edit" element={<LeadForm />} />
        <Route path="partners" element={
          <ProtectedRoute requireAdminOrBO>
            <Partners />
          </ProtectedRoute>
        } />
        <Route path="operators" element={
          <ProtectedRoute requireAdminOrBO>
            <Operators />
          </ProtectedRoute>
        } />
        <Route path="reports" element={
          <ProtectedRoute requireAdminOrBO>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="users" element={
          <ProtectedRoute requireAdmin>
            <Users />
          </ProtectedRoute>
        } />
        <Route path="settings/commissions" element={
          <ProtectedRoute requireAdmin>
            <CommissionSettings />
          </ProtectedRoute>
        } />
        <Route path="settings/commissions/new" element={
          <ProtectedRoute requireAdmin>
            <CommissionWizard />
          </ProtectedRoute>
        } />
        <Route path="settings/commissions/:id" element={
          <ProtectedRoute requireAdmin>
            <CommissionWizard />
          </ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              background: '#082d32',
              border: '1px solid rgba(200, 243, 29, 0.2)',
              color: 'white'
            }
          }}
        />
        <AppRoutes />
        <PWAInstallPrompt />
        <BackupAlert />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
