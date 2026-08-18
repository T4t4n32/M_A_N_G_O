import { ArrowRight, Github, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DocsHeroProps {
  docCount: number;
  onExplore: () => void;
}

export function DocsHero({ docCount, onExplore }: DocsHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Subtle radial glow — reads as depth without saturating the dark background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% -10%, hsl(var(--primary) / 0.16), transparent 65%)",
        }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
        <Badge
          variant="outline"
          className="mb-6 gap-1.5 px-3 py-1 text-xs font-medium border-primary/25 bg-primary/[0.06] text-primary"
        >
          <Sparkles className="h-3 w-3" />
          {docCount} documentos públicos del proyecto
        </Badge>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          Documentación técnica del{" "}
          <span className="text-primary">monitoreo oceánico</span>
        </h1>

        <p className="mt-5 text-base text-muted-foreground max-w-2xl mx-auto">
          Investigación, arquitectura de hardware, bitácoras de desarrollo y fuentes bibliográficas
          detrás de M.A.N.G.O. — organizados por categoría para navegar rápido.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Button onClick={onExplore} className="gap-2 rounded-md">
            Explorar documentos <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="gap-2 rounded-md" asChild>
            <a href="https://github.com/T4t4n32/M_A_N_G_O" target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" /> Ver en GitHub
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
