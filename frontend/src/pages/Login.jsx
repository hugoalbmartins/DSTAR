import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { ModernButton } from "@/components/modern";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Mail, ArrowRight, Sparkles } from "lucide-react";
import { authService } from "@/services/authService";

const LOGO_URL = "/logo_dolphinstar_fundopreto_vertical.jpg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setUser(user);
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Auth check error:", error);
      }
    };
    checkAuth();

    setTimeout(() => setIsVisible(true), 100);
  }, [navigate, setUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      const { user } = await authService.signIn(email, password);
      setUser(user);
      toast.success("Login efetuado com sucesso!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-brand-50 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background animated shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-brand-100/30 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-200/20 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2 animate-pulse delay-1000"></div>
      </div>

      {/* Login card with slide animation */}
      <div
        className={`relative w-full max-w-md transform transition-all duration-700 ease-out ${
          isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        }`}
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 overflow-hidden">
          {/* Header section with gradient */}
          <div className="bg-gradient-to-br from-brand-600 to-brand-700 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
                  <img
                    src={LOGO_URL}
                    alt="CRM Dolphin+Star"
                    className="h-24 w-auto relative z-10 drop-shadow-2xl"
                    data-testid="login-logo"
                  />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                Bem-vindo
                <Sparkles className="w-6 h-6 text-yellow-300" />
              </h2>
              <p className="text-white/90 text-sm">
                Aceda à sua conta para continuar
              </p>
            </div>
          </div>

          {/* Form section */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
              {/* Email field with icon */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-semibold flex items-center gap-2">
                  <div className="p-1 bg-brand-100 rounded">
                    <Mail size={14} className="text-brand-600" />
                  </div>
                  Email
                </Label>
                <div className="relative group">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.pt"
                    className="pl-4 pr-4 py-6 text-base border-2 border-slate-200 focus:border-brand-500 rounded-xl transition-all duration-300 group-hover:border-brand-300"
                    data-testid="email-input"
                  />
                </div>
              </div>

              {/* Password field with icon */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-semibold flex items-center gap-2">
                  <div className="p-1 bg-brand-100 rounded">
                    <Lock size={14} className="text-brand-600" />
                  </div>
                  Palavra-passe
                </Label>
                <div className="relative group">
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-4 pr-4 py-6 text-base border-2 border-slate-200 focus:border-brand-500 rounded-xl transition-all duration-300 group-hover:border-brand-300"
                    data-testid="password-input"
                  />
                </div>
              </div>

              {/* Submit button */}
              <ModernButton
                type="submit"
                loading={loading}
                icon={ArrowRight}
                className="w-full py-6 text-base"
                data-testid="login-submit-btn"
              >
                Entrar
              </ModernButton>
            </form>

            {/* Footer text */}
            <div className="mt-6 text-center">
              <p className="text-slate-500 text-xs">
                CRM Dolphin+Star © 2026
              </p>
            </div>
          </div>
        </div>

        {/* Decorative element */}
        <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full opacity-20 blur-2xl animate-pulse"></div>
      </div>
    </div>
  );
}
