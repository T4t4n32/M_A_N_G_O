import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Leaf, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/types/dashboard";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isError, role } = useAuth(false);

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

  if (requiredRole && role !== requiredRole) {
    return (
      <main
        role="alert"
        aria-labelledby="forbidden-title"
        className="min-h-screen bg-mango-dark flex flex-col items-center justify-center gap-5 px-6 text-center"
      >
        <ShieldAlert className="h-12 w-12 text-amber-300" aria-hidden />
        <h1 id="forbidden-title" className="text-2xl font-semibold text-white">
          Acceso restringido
        </h1>
        <p className="max-w-md text-sm text-white/70">
          Esta sección requiere el rol
          {" "}<strong className="text-white">{requiredRole}</strong>{" "}
          y tu sesión actual tiene el rol
          {" "}<strong className="text-white">{role ?? "sin asignar"}</strong>.
          Si crees que es un error, contacta a un administrador.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button asChild variant="secondary">
            <Link to="/dashboard">Ir al panel</Link>
          </Button>
          <Button asChild variant="ghost" className="text-white/70 hover:text-white">
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
