import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Lock, LogIn, ShieldCheck, ArrowRight } from "lucide-react";
import icono from "@/assets/icono.png";
import { ApiError, login as apiLogin, logout as apiLogout } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  // The header/footer mount this modal even on public pages, so we don't want
  // useAuth to redirect on a 401 response.
  const { user, isAuthenticated, role, isLoading } = useAuth(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ user: string; detail?: string } | null>(null);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setShow(false);
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError({ user: "Ingresa email y contraseña." });
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiLogin({ email: email.trim(), password });
      await queryClient.invalidateQueries({ queryKey: ["auth-status"] });
      toast({ title: "Sesión iniciada", description: "Bienvenido al sistema M.A.N.G.O." });
      onOpenChange(false);
      navigate("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) setError({ user: err.message, detail: err.detail });
      else setError({ user: err instanceof Error ? err.message : "Error desconocido." });
    } finally {
      setSubmitting(false);
    }
  };

  const onLogout = async () => {
    try { await apiLogout(); } catch { /* ignore */ }
    await queryClient.invalidateQueries({ queryKey: ["auth-status"] });
    toast({ title: "Sesión cerrada" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-mango-dark border-secondary/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-white flex items-center justify-center gap-2">
            <Lock className="h-5 w-5 text-accent" /> Acceso Institucional
          </DialogTitle>
          <DialogDescription className="text-center text-white/60">
            Sistema de uso exclusivo para instituciones autorizadas.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 text-white/50 animate-spin" />
          </div>
        ) : isAuthenticated ? (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-sm font-semibold">Sesión activa</span>
            </div>
            <p className="text-sm text-white/70 text-center">
              {user?.name ? <>Conectado como <strong className="text-white">{user.name}</strong></> : "Tienes una sesión iniciada."}
              {role && <span className="block text-xs text-white/40 mt-0.5 uppercase tracking-wider">Rol: {role}</span>}
            </p>
            <div className="flex flex-col w-full gap-2">
              <Button
                onClick={() => { onOpenChange(false); navigate("/dashboard"); }}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-full font-semibold gap-2"
              >
                Ir al panel <ArrowRight className="h-4 w-4" />
              </Button>
              {role === "admin" && (
                <Button
                  variant="outline"
                  onClick={() => { onOpenChange(false); navigate("/admin"); }}
                  className="w-full rounded-full border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08]"
                >
                  Administración de usuarios
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={onLogout}
                className="w-full text-white/60 hover:text-white hover:bg-white/[0.06] rounded-full"
              >
                Cerrar sesión
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3 py-2" aria-label="Formulario de inicio de sesión">
            <div className="flex justify-center">
              <img src={icono} alt="M.A.N.G.O" className="h-12 w-12 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lm-email" className="text-white/70 text-xs">Email institucional</Label>
              <Input
                id="lm-email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/[0.04] border-white/10 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lm-pwd" className="text-white/70 text-xs">Contraseña</Label>
              <div className="relative">
                <Input
                  id="lm-pwd"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/[0.04] border-white/10 text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div role="alert" className="rounded-md bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-100">
                <p className="font-semibold">{error.user}</p>
                {error.detail && <p className="text-red-200/70 mt-0.5">{error.detail}</p>}
              </div>
            )}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-full font-semibold gap-2"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {submitting ? "Verificando…" : "Iniciar sesión"}
            </Button>
            <p className="text-[11px] text-white/40 text-center">
              ¿Problemas para acceder?{" "}
              <button
                type="button"
                onClick={() => { onOpenChange(false); navigate("/login"); }}
                className="text-accent hover:underline"
              >
                Abrir página completa
              </button>
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
