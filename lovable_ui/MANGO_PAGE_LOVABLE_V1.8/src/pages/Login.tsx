import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login as apiLogin, ApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, Mail, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import logo from "@/assets/logo.png";
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[hsl(205,35%,8%)]">
      {/* Layered gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_100%,hsl(168_72%_42%/0.20),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,hsl(50_90%_58%/0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,hsl(204_70%_53%/0.06),transparent_45%)]" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Animated floating orbs */}
      <motion.div
        className="absolute w-72 h-72 rounded-full bg-[hsl(168_72%_42%/0.08)] blur-3xl"
        style={{ top: "15%", left: "10%" }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-[hsl(50_90%_58%/0.05)] blur-3xl"
        style={{ bottom: "10%", right: "5%" }}
        animate={{ x: [0, -25, 0], y: [0, 15, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="w-full max-w-md space-y-6 relative z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Logo + heading */}
        <div className="text-center space-y-3">
          <a href="/" className="inline-block" aria-label="Volver al inicio">
            <motion.img
              src={logo}
              alt="M.A.N.G.O"
              className="h-36 w-auto mx-auto drop-shadow-[0_0_30px_hsl(168_72%_42%/0.2)]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            />
          </a>
          <h1 className="text-2xl font-bold text-white">Acceso Institucional</h1>
          <p className="text-sm text-white/50">
            Sistema exclusivo para instituciones autorizadas.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white/[0.06] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-7 space-y-6 shadow-2xl shadow-black/30">
          {/* Decorative top line */}
          <div className="h-1 w-16 mx-auto rounded-full bg-gradient-to-r from-[hsl(168,72%,42%)] to-[hsl(204,70%,53%)] -mt-1" />

          {apiError && <ErrorBanner error={apiError} />}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-white/70 text-sm font-medium">Email institucional</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="usuario@institucion.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/25 rounded-xl focus:ring-2 focus:ring-[hsl(168,72%,42%)]/30 focus:border-[hsl(168,72%,42%)]/40 transition-all hover:bg-white/[0.07]"
                  disabled={loading}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
              </div>
              {errors.email && <p id="email-error" className="text-xs text-red-400" role="alert">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-pass" className="text-white/70 text-sm font-medium">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input
                  id="login-pass"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/25 rounded-xl focus:ring-2 focus:ring-[hsl(168,72%,42%)]/30 focus:border-[hsl(168,72%,42%)]/40 transition-all hover:bg-white/[0.07]"
                  disabled={loading}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "pass-error" : undefined}
                />
              </div>
              {errors.password && <p id="pass-error" className="text-xs text-red-400" role="alert">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-[hsl(168,72%,42%)] to-[hsl(204,70%,53%)] hover:from-[hsl(168,72%,38%)] hover:to-[hsl(204,70%,48%)] text-white rounded-xl font-semibold text-base shadow-lg shadow-[hsl(168,72%,42%)]/20 hover:shadow-xl hover:shadow-[hsl(168,72%,42%)]/30 transition-all duration-300"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? "Iniciando sesión…" : "Iniciar Sesión"}
            </Button>
          </form>
        </div>

        {/* Back button */}
        <a
          href="/"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] hover:border-white/[0.18] text-white/60 hover:text-white font-medium text-sm transition-all duration-300 backdrop-blur-sm"
        >
          ← Volver al inicio
        </a>

        {/* Footer text */}
        <p className="text-center text-[11px] text-white/25">
          M.A.N.G.O · Monitoreo Autónomo de Niveles y Gestión Oceánica
        </p>
      </motion.div>
    </div>
  );
}
