import { Leaf, LogOut, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { logout } from "@/lib/api";
import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { UserRole } from "@/types/dashboard";

interface DashboardHeaderProps {
  userName?: string;
  onRefresh?: () => void;
  userRole?: UserRole | null;
}

export function DashboardHeader({ userName, onRefresh, userRole }: DashboardHeaderProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loggingOut, setLoggingOut] = useState(false);
  const [spinning, setSpinning] = useState(false);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // even on error, redirect
    } finally {
      queryClient.clear();
      navigate("/login", { replace: true });
    }
  }, [navigate, queryClient]);

  const handleRefresh = useCallback(() => {
    if (!onRefresh) return;
    setSpinning(true);
    onRefresh();
    setTimeout(() => setSpinning(false), 800);
  }, [onRefresh]);

  return (
    <header className="bg-white/[0.04] backdrop-blur-xl border-b border-white/[0.06] px-4 sm:px-6 py-3 sticky top-0 z-30" role="banner">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-3 text-left rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Ir al sitio público"
        >
          <Leaf className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">M.A.N.G.O</h1>
            <p className="text-xs text-white/40 hidden sm:block">Panel de Monitoreo Ambiental</p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="text-white/40 hover:text-white hover:bg-white/[0.08]"
              title="Actualizar datos"
              aria-label="Actualizar datos"
            >
              <RefreshCw className={`h-4 w-4 transition-transform ${spinning ? "animate-spin" : ""}`} />
            </Button>
          )}

          {userRole === "admin" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin")}
              className="text-white/40 hover:text-white hover:bg-white/[0.08]"
              aria-label="Panel de administración"
            >
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Admin</span>
            </Button>
          )}

          {userRole && (
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border hidden sm:inline ${
                userRole === "admin"
                  ? "border-accent/40 text-accent bg-accent/10"
                  : "border-white/20 text-white/50 bg-white/5"
              }`}
            >
              {userRole}
            </span>
          )}
          {userName && (
            <span className="text-sm text-white/40 hidden sm:inline max-w-[180px] truncate">{userName}</span>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={loggingOut}
                className="text-white/40 hover:text-white hover:bg-white/[0.08]"
                aria-label="Cerrar sesión"
              >
                {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                <span className="hidden sm:inline ml-1">Salir</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[hsl(205,35%,12%)] border-white/10 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">¿Cerrar sesión?</AlertDialogTitle>
                <AlertDialogDescription className="text-white/60">
                  Se cerrará su sesión actual y será redirigido a la página de acceso institucional.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogout}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Cerrar sesión
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </header>
  );
}
