import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Lock, Mail } from "lucide-react";
import axios from "axios";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_partner-sales-hub-1/artifacts/6o47c762_Design%20sem%20nome%20%281%29.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize system on first load
    const initSystem = async () => {
      try {
        setInitializing(true);
        await axios.post(`${API}/init`);
      } catch (error) {
        // System might already be initialized
      } finally {
        setInitializing(false);
      }
    };
    initSystem();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      toast.success("Login efetuado com sucesso!");
      navigate("/dashboard");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src={LOGO_URL} 
            alt="CRM Leiritrix" 
            className="h-12"
            data-testid="login-logo"
          />
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-2 font-['Manrope']">
          Bem-vindo
        </h2>
        <p className="text-white/50 text-center mb-8 text-sm">
          Aceda à sua conta para continuar
        </p>

        <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
          <div>
            <Label htmlFor="email" className="form-label flex items-center gap-2">
              <Mail size={16} className="text-[#c8f31d]" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.pt"
              className="form-input mt-1"
              data-testid="email-input"
            />
          </div>

          <div>
            <Label htmlFor="password" className="form-label flex items-center gap-2">
              <Lock size={16} className="text-[#c8f31d]" />
              Palavra-passe
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="form-input mt-1"
              data-testid="password-input"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || initializing}
            className="w-full btn-primary btn-primary-glow"
            data-testid="login-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                A entrar...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>

        {/* Default credentials hint */}
        <div className="mt-6 p-4 rounded-lg bg-[#0d474f] border border-[#c8f31d]/20">
          <p className="text-xs text-white/50 text-center">
            <span className="text-[#c8f31d]">Credenciais iniciais:</span><br />
            admin@leiritrix.pt / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
