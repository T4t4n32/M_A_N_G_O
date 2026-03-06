import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { checkAuth } from "@/lib/api";
import type { AuthStatus } from "@/types/dashboard";

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
    if (!redirectOnFail) return;
    if (query.isError || (query.data && !query.data.authenticated)) {
      navigate("/login", { replace: true });
    }
  }, [query.data, query.isError, redirectOnFail, navigate]);

  return {
    user: query.data?.user ?? null,
    isAuthenticated: query.data?.authenticated ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
