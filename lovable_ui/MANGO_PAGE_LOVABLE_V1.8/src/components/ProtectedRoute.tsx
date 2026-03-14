import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Leaf, Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isError } = useAuth(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mango-dark flex flex-col items-center justify-center gap-4" aria-busy="true">
        <Leaf className="h-10 w-10 text-primary animate-pulse" />
        <Loader2 className="h-6 w-6 text-muted animate-spin" />
        <p className="text-muted text-sm">Verificando sesión…</p>
      </div>
    );
  }

  if (isError || !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
