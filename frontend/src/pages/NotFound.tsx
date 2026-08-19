import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import FuzzyText from "@/components/effects/FuzzyText";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error("404: Ruta no encontrada:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="min-h-screen bg-mango-dark flex flex-col">
      <Header />
      <div id="contenido" tabIndex={-1} />
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4 pt-28 lg:pt-32 text-center">
        <Leaf className="h-12 w-12 text-primary opacity-40" />
        <div className="flex flex-col items-center">
          <FuzzyText
            baseIntensity={0.2}
            hoverIntensity={0.5}
            enableHover
            color="#fff"
            fontSize="clamp(4rem, 15vw, 12rem)"
          >
            404
          </FuzzyText>
          <p className="mt-2 text-lg text-muted">Página no encontrada</p>
        </div>
        <Button asChild variant="outline" className="rounded-full border-border/30 text-secondary-foreground hover:bg-mango-slate">
          <a href="/">Volver al Inicio</a>
        </Button>
      </div>
      <Footer />
    </main>
  );
}
