import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login as apiLogin, ApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Leaf, Lock, Mail, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ErrorInfo {
  code: number;
  message: string;
  detail: string;
}

function ErrorBanner({ error }: { error: ErrorInfo }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 space-y-2" role="alert">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {error.code > 0 && (
              <span className="text-[11px] font-mono font-bold bg-destructive/20 text-destructive-foreground px-2 py-0.5 rounded">
                {error.code}
              </span>
            )}
            <p className="text-sm font-medium text-destructive-foreground">{error.message}</p>
          </div>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] text-muted hover:text-secondary-foreground transition-colors flex items-center gap-1 mt-1"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "Ocultar detalles" : "Ver detalles técnicos"}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.p
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[11px] text-muted leading-relaxed mt-2 font-mono overflow-hidden"
              >
                {error.detail}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<ErrorInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Ingrese un email válido";
    if (!password || password.length < 6) e.password = "Mínimo 6 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setApiError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await apiLogin({ email, password });
      if (res.success) {
        navigate("/dashboard", { replace: true });
      } else {
        setApiError({
          code: 0,
          message: res.message || "Credenciales inválidas",
          detail: "El servidor respondió exitosamente pero indicó que las credenciales no son correctas.",
        });
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setApiError({
          code: err.status,
          message: err.message,
          detail: err.detail,
        });
      } else {
        setApiError({
          code: 0,
          message: err instanceof Error ? err.message : "Error desconocido",
          detail: "Ocurrió un error inesperado al intentar conectar con el servidor.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mango-dark flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md space-y-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Logo */}
        <div className="text-center space-y-2">
          <a href="/" className="inline-flex items-center gap-2" aria-label="Volver al inicio">
            <Leaf className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-secondary-foreground tracking-wide">M.A.N.G.O</span>
          </a>
          <h1 className="text-xl font-semibold text-secondary-foreground">Acceso Institucional</h1>
          <p className="text-sm text-muted">
            Este sistema es de uso exclusivo para instituciones autorizadas.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-mango-slate rounded-lg border border-border/20 p-6 space-y-6">
          {apiError && <ErrorBanner error={apiError} />}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-secondary-foreground/80">Email institucional</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="usuario@institucion.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-mango-deep/50 border-border/20 text-secondary-foreground placeholder:text-muted"
                  disabled={loading}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
              </div>
              {errors.email && <p id="email-error" className="text-xs text-destructive" role="alert">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-pass" className="text-secondary-foreground/80">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <Input
                  id="login-pass"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-mango-deep/50 border-border/20 text-secondary-foreground placeholder:text-muted"
                  disabled={loading}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "pass-error" : undefined}
                />
              </div>
              {errors.password && <p id="pass-error" className="text-xs text-destructive" role="alert">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-semibold"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? "Iniciando sesión…" : "Iniciar Sesión"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted">
          <a href="/" className="hover:text-primary transition-colors">← Volver al inicio</a>
        </p>
      </motion.div>
    </div>
  );
}
