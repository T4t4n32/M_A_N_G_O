import { Leaf, LogOut, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { logout } from "@/lib/api";
import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface DashboardHeaderProps {
  userName?: string;
  onRefresh?: () => void;
}

export function DashboardHeader({ userName, onRefresh }: DashboardHeaderProps) {
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
        <div className="flex items-center gap-3">
          <Leaf className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">M.A.N.G.O</h1>
            <p className="text-xs text-white/40 hidden sm:block">Panel de Monitoreo Ambiental</p>
          </div>
        </div>

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
          {userName && (
            <span className="text-sm text-white/40 hidden sm:inline max-w-[180px] truncate">{userName}</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-white/40 hover:text-white hover:bg-white/[0.08]"
            aria-label="Cerrar sesión"
          >
            {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            <span className="hidden sm:inline ml-1">Salir</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
