import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error("404: Ruta no encontrada:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-mango-deep flex flex-col items-center justify-center gap-6 p-4 text-center">
      <Leaf className="h-12 w-12 text-primary opacity-40" />
      <div>
        <h1 className="text-6xl font-bold text-secondary-foreground">404</h1>
        <p className="mt-2 text-lg text-muted">Página no encontrada</p>
      </div>
      <Button asChild variant="outline" className="rounded-full border-border/30 text-secondary-foreground hover:bg-mango-slate">
        <a href="/">Volver al Inicio</a>
      </Button>
    </div>
  );
}
