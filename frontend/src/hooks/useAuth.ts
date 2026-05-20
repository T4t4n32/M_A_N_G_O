import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { checkAuth } from "@/lib/api";
import { logApiError } from "@/lib/errorHandler";
import type { AuthStatus, UserRole, TierName } from "@/types/dashboard";

export function useAuth(redirectOnFail = true) {
  const navigate = useNavigate();

  const query = useQuery<AuthStatus>({
    queryKey: ["auth-status"],
    queryFn: checkAuth,
    retry: 1,
    retryDelay: 1000,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.isError) {
      // Registra el detalle técnico (status, mensaje) para diagnóstico
      // sin mostrar toast: el ProtectedRoute ya maneja la UX (redirect /
      // pantalla "Acceso restringido").
      logApiError(query.error, "useAuth/checkAuth");
    }
    if (!redirectOnFail) return;
    if (query.isError || (query.data && !query.data.authenticated)) {
      navigate("/login", { replace: true });
    }
  }, [query.data, query.isError, query.error, redirectOnFail, navigate]);

  return {
    user: query.data?.user ?? null,
    isAuthenticated: query.data?.authenticated ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
    role: (query.data?.user?.role as UserRole) ?? null,
    tier: (query.data?.user?.tier ?? "none") as TierName,
  };
}
