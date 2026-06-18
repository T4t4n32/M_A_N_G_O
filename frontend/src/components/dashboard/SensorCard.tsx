import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Thermometer, Droplets, FlaskConical, AlertCircle, WifiOff, Wrench, OctagonX, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { SensorState, SensorReading, SensorType, AlertLevel } from "@/types/dashboard";
import { SENSOR_THRESHOLDS } from "@/lib/sensorThresholds";

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
  alertLevel?: AlertLevel;
  onRetry?: () => void;
}

export function SensorCard({ type, state, reading, alertLevel = "normal", onRetry }: SensorCardProps) {
  const config = SENSOR_CONFIG[type];
  const Icon = config.icon;
  const threshold = SENSOR_THRESHOLDS[type];

  const alertBorder = alertLevel === "critical"
    ? "ring-2 ring-[hsl(var(--alert-critical)/0.55)] animate-pulse-critical"
    : alertLevel === "warning"
    ? "ring-2 ring-[hsl(var(--alert-warning)/0.45)] warn-stripe"
    : "";

  return (
    <Card className={`
      bg-white/[0.06] backdrop-blur-xl
      border-white/[0.08] border-l-4 ${config.borderColor}
      text-white
      transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 hover:bg-white/[0.08]
      ${alertBorder}
    `}>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${config.iconBg}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-white">{config.label}</h3>
              <StateLabel state={state} />
            </div>
          </div>
          <StateIndicator state={state} />
        </div>

        {/* Body */}
        {state === "loading" && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-28 bg-white/[0.06]" />
            <Skeleton className="h-3 w-36 bg-white/[0.06]" />
          </div>
        )}

        {state === "no-data" && (
          <div>
            <p className="text-4xl font-mono font-bold text-white/40">—</p>
            <p className="text-xs text-white/30 mt-2">Sin lecturas disponibles</p>
          </div>
        )}

        {(state === "has-data" || state === "stale" || state === "offline") && reading && (
          <div className={
            state === "offline" ? "opacity-55" :
            state === "stale"   ? "opacity-80" :
            ""
          }>
            <div className="flex items-center gap-2">
              <p className="text-[2.5rem] font-mono font-extrabold tracking-tight leading-none">
                {reading.value.toFixed(2)}
                <span className="text-base font-normal text-white/40 ml-1.5">{reading.unit}</span>
              </p>
              {state === "has-data" && alertLevel === "critical" && (
                <OctagonX className="h-5 w-5 text-[hsl(var(--alert-critical))] shrink-0" />
              )}
              {state === "has-data" && alertLevel === "warning" && (
                <AlertTriangle className="h-4 w-4 text-[hsl(var(--alert-warning))] shrink-0" />
              )}
              {state === "has-data" && alertLevel === "normal" && (
                <CheckCircle2 className="h-4 w-4 text-[hsl(var(--alert-normal))] shrink-0" />
              )}
            </div>
            <p className="text-xs text-white/30 mt-2">
              {new Date(reading.timestamp).toLocaleString("es-ES")}
            </p>
            <div className="mt-3">
              <RangeBar
                value={reading.value}
                optimal={[threshold.optimalLow, threshold.optimalHigh]}
                warning={[threshold.warningLow, threshold.warningHigh]}
                critical={[threshold.criticalLow, threshold.criticalHigh]}
              />
            </div>
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
              <Button size="sm" variant="outline" onClick={onRetry} className="text-xs border-white/[0.1] hover:bg-white/[0.06] text-white/60">
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
    loading:           "Cargando…",
    "no-data":         "Apagado",
    "has-data":        "Operativo",
    stale:             "Encendido",
    offline:           "Fuera de operación",
    error:             "Error",
    disconnected:      "Fuera de operación",
    needs_calibration: "Calibración",
    hardware_issue:    "Hardware",
  };

  const colors: Record<SensorState, string> = {
    loading:           "text-muted",
    "no-data":         "text-white/30",
    "has-data":        "text-primary",
    stale:             "text-amber-400",
    offline:           "text-white/35",
    error:             "text-destructive",
    disconnected:      "text-white/35",
    needs_calibration: "text-accent-foreground",
    hardware_issue:    "text-destructive",
  };

  return <p className={`text-[11px] font-medium ${colors[state]}`}>{labels[state]}</p>;
}

function StateIndicator({ state }: { state: SensorState }) {
  const colors: Record<SensorState, string> = {
    loading:           "bg-muted",
    "no-data":         "bg-white/20",
    "has-data":        "bg-primary",
    stale:             "bg-amber-400",
    offline:           "bg-white/25",
    error:             "bg-destructive",
    disconnected:      "bg-white/25",
    needs_calibration: "bg-accent-foreground",
    hardware_issue:    "bg-destructive",
  };

  return (
    <span className="relative flex h-3 w-3">
      {state === "loading" && (
        <span className={`absolute inline-flex h-full w-full rounded-full ${colors[state]} opacity-40 animate-ping`} />
      )}
      {state === "has-data" && (
        <span className={`absolute inline-flex h-full w-full rounded-full ${colors[state]} opacity-40 animate-pulse`} />
      )}
      <span className={`relative inline-flex rounded-full h-3 w-3 ${colors[state]}`} />
    </span>
  );
}

function RangeBar({
  value,
  optimal,
  warning,
  critical,
}: {
  value: number;
  optimal: [number, number];
  warning: [number, number];
  critical: [number, number];
}) {
  const min = critical[0];
  const max = critical[1];
  const range = max - min || 1;
  const clampedValue = Math.max(min, Math.min(max, value));
  const pos = ((clampedValue - min) / range) * 100;
  const optLeft = ((optimal[0] - min) / range) * 100;
  const optWidth = ((optimal[1] - optimal[0]) / range) * 100;
  const warnLeft = ((warning[0] - min) / range) * 100;
  const warnWidth = ((warning[1] - warning[0]) / range) * 100;

  return (
    <div className="relative h-2 rounded-full bg-[hsl(var(--alert-critical)/0.2)] overflow-hidden">
      {/* Warning zone */}
      <div
        className="absolute h-full bg-[hsl(var(--alert-warning)/0.3)] rounded-full"
        style={{ left: `${warnLeft}%`, width: `${warnWidth}%` }}
      />
      {/* Optimal zone */}
      <div
        className="absolute h-full bg-[hsl(var(--alert-normal)/0.4)] rounded-full"
        style={{ left: `${optLeft}%`, width: `${optWidth}%` }}
      />
      {/* Current value indicator */}
      <div
        className="absolute top-1/2 -translate-y-1/2 h-3.5 w-1.5 rounded-full bg-secondary-foreground shadow-sm"
        style={{ left: `${pos}%`, transform: `translate(-50%, -50%)` }}
      />
    </div>
  );
}
