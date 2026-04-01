import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  ChevronLeft,
  X,
  Server,
  Database,
  Share2,
  Shield,
  CheckCircle2,
  Rocket,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TOUR_SEEN_KEY = "mango-grafana-tour-seen";

interface TourStep {
  icon: typeof Server;
  title: string;
  description: string;
  detail: string;
  action?: { label: string; url: string };
}

const TOUR_STEPS: TourStep[] = [
  {
    icon: Server,
    title: "1. Instalar Grafana",
    description: "Instale Grafana en su servidor o cree una cuenta gratuita en Grafana Cloud.",
    detail:
      "Grafana es la plataforma de visualización que usaremos para análisis avanzado. Puede instalarlo localmente con Docker o usar la versión cloud gratuita que soporta hasta 10k métricas.",
    action: { label: "Ir a Grafana Cloud", url: "https://grafana.com/products/cloud/" },
  },
  {
    icon: Database,
    title: "2. Configurar fuente de datos",
    description: "Conecte su base de datos (PostgreSQL, InfluxDB, Prometheus, etc.) como data source.",
    detail:
      "En Grafana: Configuration → Data Sources → Add data source. Para M.A.N.G.O recomendamos PostgreSQL o InfluxDB para los datos de sensores. Asegúrese de tener las credenciales de su base de datos listas.",
  },
  {
    icon: Share2,
    title: "3. Crear y compartir paneles",
    description: "Cree un dashboard, luego obtenga la URL de embebido de cada panel.",
    detail:
      'En Grafana: abra su panel → haga clic en "Share" → pestaña "Embed" → copie la URL del atributo src del iframe. Esta URL es la que usará aquí para embeber el panel.',
  },
  {
    icon: Shield,
    title: "4. Habilitar embebido",
    description: "Configure Grafana para permitir que sus paneles se muestren en iframes externos.",
    detail:
      'En grafana.ini (o variables de entorno):\n\n[security]\nallow_embedding = true\n\n[auth.anonymous]\nenabled = true\norg_role = Viewer\n\nEsto permite que los paneles se rendericen aquí sin requerir login.',
  },
  {
    icon: Rocket,
    title: "5. ¡Listo para integrar!",
    description: "Pegue las URLs de sus paneles en la configuración de abajo y empiece a analizar.",
    detail:
      "Una vez configurado, sus paneles de Grafana aparecerán embebidos en esta sección del dashboard. Puede agregar, eliminar y reorganizar los paneles según necesite. Los datos se actualizan en tiempo real.",
  },
];

export function GrafanaTour() {
  const [showTour, setShowTour] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(TOUR_SEEN_KEY);
    if (!seen) {
      setShowTour(true);
    }
  }, []);

  const dismissTour = () => {
    setShowTour(false);
    localStorage.setItem(TOUR_SEEN_KEY, "true");
  };

  const resetTour = () => {
    setStep(0);
    setShowTour(true);
    localStorage.removeItem(TOUR_SEEN_KEY);
  };

  const currentStep = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  return (
    <>
      {/* Tour trigger for returning users */}
      {!showTour && (
        <Button
          variant="ghost"
          size="sm"
          onClick={resetTour}
          className="text-muted-foreground hover:text-secondary-foreground gap-1.5 text-xs"
        >
          <Rocket className="h-3.5 w-3.5" />
          Ver tour de configuración
        </Button>
      )}

      {/* Tour overlay */}
      <AnimatePresence>
        {showTour && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-accent/20 bg-gradient-to-br from-mango-slate to-mango-deep overflow-hidden shadow-xl shadow-black/20"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-accent/15">
                  <Rocket className="h-4 w-4 text-accent" />
                </div>
                <span className="text-sm font-semibold text-secondary-foreground">
                  Guía de Integración con Grafana
                </span>
              </div>
              <button
                onClick={dismissTour}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-secondary-foreground hover:bg-white/[0.06] transition-colors"
                aria-label="Cerrar tour"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="px-5 pb-3">
              <div className="flex gap-1.5">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      i <= step ? "bg-accent" : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Step content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="px-5 pb-5"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-accent/10 shrink-0 mt-0.5">
                    <currentStep.icon className="h-6 w-6 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-secondary-foreground mb-1">
                      {currentStep.title}
                    </h3>
                    <p className="text-sm text-secondary-foreground/80 mb-2">
                      {currentStep.description}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                      {currentStep.detail}
                    </p>
                    {currentStep.action && (
                      <a
                        href={currentStep.action.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
                      >
                        {currentStep.action.label}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between px-5 pb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="text-muted-foreground hover:text-secondary-foreground gap-1 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </Button>

              <span className="text-[10px] text-muted-foreground font-mono">
                {step + 1} / {TOUR_STEPS.length}
              </span>

              {isLast ? (
                <Button
                  size="sm"
                  onClick={dismissTour}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground gap-1 text-xs rounded-full px-4"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  ¡Entendido!
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setStep((s) => Math.min(TOUR_STEPS.length - 1, s + 1))}
                  className="bg-accent/15 hover:bg-accent/25 text-accent gap-1 text-xs"
                >
                  Siguiente
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Checklist summary */}
            {isLast && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-5 pb-5 border-t border-white/[0.06] pt-4"
              >
                <p className="text-xs font-semibold text-secondary-foreground mb-2">
                  ✅ Checklist — Lo que necesitas tener listo:
                </p>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  {[
                    "Grafana instalado (local o Cloud)",
                    "Data source configurado (PostgreSQL / InfluxDB)",
                    "Dashboard creado con paneles",
                    "allow_embedding = true en grafana.ini",
                    "Anonymous access habilitado (o auth token)",
                    "URLs de embebido copiadas",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-accent/50 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
