import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login as apiLogin, checkAuth, ApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, User, Loader2, AlertCircle, Eye, EyeOff, ShieldAlert, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

/**
 * Super-admin login page. Reachable ONLY via the secret shortcut
 * (Ctrl+Shift+M) or by typing /panel-emma directly.
 *
 * Auth contract:
 *  - Reuses existing backend POST /api/v1/users/login
 *  - On success, validates that the returned session belongs to a user
 *    with role === "admin" via GET /api/v1/users/status
 *  - Any other role is rejected client-side and the session is closed.
 *
 * Backend setup required (one-time, manual):
 *  Create a user in the M.A.N.G.O backend with:
 *    email:    <your chosen super-admin email>
 *    password: 472932   (will be hashed by the backend on insert)
 *    role:     admin
 *  The seed value emma132009 was shared in chat and SHOULD be rotated.
 */
export default function PanelEmmaLogin() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [error, setError] = useState<{ msg: string; detail: string } | null>(null);

  // If already authenticated as admin, jump straight in.
  useEffect(() => {
    checkAuth()
      .then((res) => {
        if (res.authenticated && res.user?.role === "admin") {
          navigate("/panel-emma/dashboard", { replace: true });
        }
      })
      .catch(() => void 0)
      .finally(() => setBootstrapping(false));
  }, [navigate]);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);
    if (!identifier || !password) {
      setError({ msg: "Complete ambos campos.", detail: "Usuario y contraseña son obligatorios." });
      return;
    }
    setLoading(true);
    try {
      const res = await apiLogin({ email: identifier, password });
      if (!res.ok) {
        setError({
          msg: res.message ?? "Credenciales inválidas.",
          detail: "El backend rechazó las credenciales del super-admin.",
        });
        return;
      }
      // Validate role server-side (cookie-session) before granting access.
      const status = await checkAuth();
      if (!status.authenticated || status.user?.role !== "admin") {
        setError({
          msg: "Esta cuenta no tiene permisos de super-administrador.",
          detail: "El usuario fue autenticado pero su rol no es 'admin'. Acceso denegado.",
        });
        return;
      }
      navigate("/panel-emma/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError({ msg: err.message, detail: err.detail });
      } else {
        setError({
          msg: "Error inesperado.",
          detail: err instanceof Error ? err.message : "Desconocido",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (bootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(205,35%,8%)]">
        <Loader2 className="h-8 w-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[hsl(205,35%,6%)] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,hsl(50_90%_58%/0.10),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_100%,hsl(168_72%_42%/0.10),transparent_55%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="rounded-2xl border border-accent/20 bg-white/[0.03] backdrop-blur-xl p-7 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-12 w-12 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mb-3">
              <ShieldAlert className="h-6 w-6 text-accent" />
            </div>
            <h1 className="text-xl font-bold text-white">Acceso restringido</h1>
            <p className="text-xs text-white/50 mt-1">
              Consola de super-administración M.A.N.G.O
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3" role="alert">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm text-destructive-foreground font-medium">{error.msg}</p>
                  <p className="text-[11px] text-white/40 font-mono mt-1">{error.detail}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="se-email" className="text-white/70 text-xs">Usuario o email</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input
                  id="se-email"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-9 h-11 bg-white/[0.04] border-white/10 text-white rounded-lg"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="se-pass" className="text-white/70 text-xs">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input
                  id="se-pass"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10 h-11 bg-white/[0.04] border-white/10 text-white rounded-lg"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  tabIndex={-1}
                  aria-label={showPass ? "Ocultar" : "Mostrar"}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg font-semibold"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {loading ? "Verificando…" : "Entrar"}
            </Button>
          </form>

          <p className="text-[10px] text-white/30 text-center mt-5 leading-relaxed">
            Esta vista no está enlazada desde la web pública.
            <br />Solo el super-administrador autorizado puede continuar.
          </p>

          <div className="mt-4 flex justify-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}