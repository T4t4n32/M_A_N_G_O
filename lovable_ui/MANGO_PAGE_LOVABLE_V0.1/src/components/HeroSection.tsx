import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient simulating mangrove atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-br from-mango-deep via-mango-dark to-mango-slate" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_80%,hsl(168_72%_42%/0.12),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,hsl(204_70%_53%/0.1),transparent_50%)]" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight animate-fade-in-up">
          Monitoreo Autónomo de Niveles y Gestión Oceánica
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-white/70 max-w-3xl mx-auto animate-fade-in-up [animation-delay:200ms] opacity-0">
          Sistema institucional de monitoreo ambiental en tiempo real para la protección
          de manglares y ecosistemas marítimos. Tecnología al servicio de la conservación.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up [animation-delay:400ms] opacity-0">
          <Button
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8 text-base font-semibold"
            onClick={() => document.querySelector("#proyecto")?.scrollIntoView({ behavior: "smooth" })}
          >
            Conoce el Proyecto
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 rounded-full px-8 text-base font-semibold"
            onClick={() => document.querySelector("#contacto")?.scrollIntoView({ behavior: "smooth" })}
          >
            Contacto Institucional
          </Button>
        </div>
      </div>

      <button
        onClick={() => document.querySelector("#proyecto")?.scrollIntoView({ behavior: "smooth" })}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 hover:text-white/70 transition-colors animate-bounce"
        aria-label="Scroll down"
      >
        <ChevronDown className="h-8 w-8" />
      </button>
    </section>
  );
}
