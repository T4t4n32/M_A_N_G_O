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
    <header className="bg-mango-dark border-b border-border/20 px-4 sm:px-6 py-3" role="banner">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Leaf className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold text-secondary-foreground tracking-wide">M.A.N.G.O</h1>
            <p className="text-xs text-muted hidden sm:block">Panel de Monitoreo Ambiental</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="text-muted hover:text-secondary-foreground hover:bg-mango-slate"
              title="Actualizar datos"
              aria-label="Actualizar datos"
            >
              <RefreshCw className={`h-4 w-4 transition-transform ${spinning ? "animate-spin" : ""}`} />
            </Button>
          )}
          {userName && (
            <span className="text-sm text-muted hidden sm:inline max-w-[180px] truncate">{userName}</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-muted hover:text-secondary-foreground hover:bg-mango-slate"
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
