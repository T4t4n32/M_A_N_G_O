import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Thermometer, Droplets, FlaskConical, AlertCircle, WifiOff, Wrench } from "lucide-react";
import type { SensorState, SensorReading, SensorType } from "@/types/dashboard";

const SENSOR_CONFIG: Record<SensorType, {
  label: string;
  icon: React.ElementType;
  gradient: string;
  borderColor: string;
  iconBg: string;
}> = {
  ph: {
    label: "pH",
    icon: FlaskConical,
    gradient: "from-chart-1/10 to-transparent",
    borderColor: "border-l-chart-1",
    iconBg: "bg-chart-1/15 text-chart-1",
  },
  temperature: {
    label: "Temperatura",
    icon: Thermometer,
    gradient: "from-chart-2/10 to-transparent",
    borderColor: "border-l-chart-2",
    iconBg: "bg-chart-2/15 text-chart-2",
  },
  turbidity: {
    label: "Turbidez",
    icon: Droplets,
    gradient: "from-chart-3/10 to-transparent",
    borderColor: "border-l-chart-3",
    iconBg: "bg-chart-3/15 text-chart-3",
  },
};

interface SensorCardProps {
  type: SensorType;
  state: SensorState;
  reading?: SensorReading;
  onRetry?: () => void;
}

export function SensorCard({ type, state, reading, onRetry }: SensorCardProps) {
  const config = SENSOR_CONFIG[type];
  const Icon = config.icon;

  return (
    <Card className={`
      bg-gradient-to-br ${config.gradient} bg-mango-slate 
      border-border/20 border-l-4 ${config.borderColor}
      text-secondary-foreground
      transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5
    `}>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${config.iconBg}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-secondary-foreground">{config.label}</h3>
              <StateLabel state={state} />
            </div>
          </div>
          <StateIndicator state={state} />
        </div>

        {/* Body */}
        {state === "loading" && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-28 bg-mango-deep/50" />
            <Skeleton className="h-3 w-36 bg-mango-deep/50" />
          </div>
        )}

        {state === "no-data" && (
          <div>
            <p className="text-4xl font-mono font-bold text-muted/60">—</p>
            <p className="text-xs text-muted mt-2">Sin lecturas disponibles</p>
          </div>
        )}

        {state === "has-data" && reading && (
          <div>
            <p className="text-4xl font-mono font-bold tracking-tight">
              {reading.value.toFixed(2)}
              <span className="text-base font-normal text-muted ml-1.5">{reading.unit}</span>
            </p>
            <p className="text-xs text-muted mt-2">
              {new Date(reading.timestamp).toLocaleString("es-ES")}
            </p>
          </div>
        )}

        {state === "disconnected" && (
          <div className="space-y-1">
            <p className="text-sm text-muted flex items-center gap-1.5">
              <WifiOff className="h-3.5 w-3.5" /> Sensor no conectado
            </p>
            {reading?.hardware_note && (
              <p className="text-xs text-muted/70">{reading.hardware_note}</p>
            )}
          </div>
        )}

        {state === "needs_calibration" && (
          <div>
            <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-accent/30 mb-2">
              <Wrench className="h-3 w-3 mr-1" /> Necesita calibración
            </Badge>
            {reading?.hardware_note && (
              <p className="text-xs text-muted/70">{reading.hardware_note}</p>
            )}
          </div>
        )}

        {state === "hardware_issue" && (
          <div>
            <Badge variant="destructive" className="mb-2">
              <AlertCircle className="h-3 w-3 mr-1" /> Problema de hardware
            </Badge>
            {reading?.hardware_note && (
              <p className="text-xs text-muted/70">{reading.hardware_note}</p>
            )}
          </div>
        )}

        {state === "error" && (
          <div>
            <p className="text-sm text-destructive mb-2">No se pudo consultar el backend</p>
            {onRetry && (
              <Button size="sm" variant="outline" onClick={onRetry} className="text-xs border-border/30 hover:bg-mango-deep">
                <RefreshCw className="h-3 w-3 mr-1" /> Reintentar
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StateLabel({ state }: { state: SensorState }) {
  const labels: Record<SensorState, string> = {
    loading: "Cargando…",
    "no-data": "Sin datos",
    "has-data": "Operativo",
    error: "Error",
    disconnected: "Desconectado",
    needs_calibration: "Calibración",
    hardware_issue: "Hardware",
  };

  const colors: Record<SensorState, string> = {
    loading: "text-muted",
    "no-data": "text-muted",
    "has-data": "text-primary",
    error: "text-destructive",
    disconnected: "text-muted",
    needs_calibration: "text-accent-foreground",
    hardware_issue: "text-destructive",
  };

  return <p className={`text-[11px] font-medium ${colors[state]}`}>{labels[state]}</p>;
}

function StateIndicator({ state }: { state: SensorState }) {
  const colors: Record<SensorState, string> = {
    loading: "bg-muted",
    "no-data": "bg-muted",
    "has-data": "bg-primary",
    error: "bg-destructive",
    disconnected: "bg-muted",
    needs_calibration: "bg-accent-foreground",
    hardware_issue: "bg-destructive",
  };

  return (
    <span className="relative flex h-3 w-3">
      {(state === "has-data" || state === "loading") && (
        <span className={`absolute inline-flex h-full w-full rounded-full ${colors[state]} opacity-40 ${state === "loading" ? "animate-ping" : "animate-pulse"}`} />
      )}
      <span className={`relative inline-flex rounded-full h-3 w-3 ${colors[state]}`} />
    </span>
  );
}
