import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, RefreshCw, Thermometer, Droplets, FlaskConical, Gauge } from "lucide-react";
import { useOceanMetrics } from "@/hooks/useOceanMetrics";
import type { SensorType, ReadingSensorEntry, ValueStatus } from "@/types/dashboard";
import { SENSOR_THRESHOLDS } from "@/lib/sensorThresholds";

const SENSOR_ORDER: SensorType[] = ["ph", "temperature", "turbidity"];

const SENSOR_ICON: Record<SensorType, React.ElementType> = {
  ph:          FlaskConical,
  temperature: Thermometer,
  turbidity:   Droplets,
};

const VALUE_STATUS_COLOR: Record<ValueStatus, string> = {
  optimal:  "text-[hsl(var(--alert-normal))]",
  normal:   "text-white/70",
  warning:  "text-[hsl(var(--alert-warning))]",
  critical: "text-[hsl(var(--alert-critical))]",
  unknown:  "text-white/30",
};

/**
 * Consolidated summary card for the three core ocean sensors (pH, temperatura, turbidez).
 * Complements the per-sensor SensorCard grid with a single, compact overview — e.g. for
 * a dashboard header strip or a status widget outside the main sensor grid.
 *
 * Renders explicit isLoading (skeleton) and isError (retry) states so the panel never
 * collapses if the Flask backend is unreachable or /api/v1/readings/latest returns an error.
 */
export function OceanMetricsCard() {
  const { sensors, systemStatus, serverTime, isLoading, isError, refetch } = useOceanMetrics();

  return (
    <Card className="bg-white/[0.06] backdrop-blur-xl border-white/[0.08] text-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-white">
            <Gauge className="h-4 w-4 text-primary" />
            Métricas Oceánicas
          </CardTitle>
          {systemStatus && !isLoading && !isError && (
            <span className="text-[10px] uppercase tracking-wide text-white/35">
              {systemStatus === "online" ? "En línea" : systemStatus === "offline" ? "Sin conexión" : systemStatus}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SENSOR_ORDER.map((type) => (
              <div key={type} className="space-y-2">
                <Skeleton className="h-3 w-16 bg-white/[0.06]" />
                <Skeleton className="h-8 w-24 bg-white/[0.06]" />
              </div>
            ))}
          </div>
        )}

        {isError && !isLoading && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              No se pudo consultar el backend (Flask). Los sensores no están disponibles.
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              className="text-xs border-white/[0.1] hover:bg-white/[0.06] text-white/60 shrink-0"
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Reintentar
            </Button>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SENSOR_ORDER.map((type) => (
              <MetricCell key={type} type={type} entry={sensors[type]} />
            ))}
          </div>
        )}

        {!isLoading && !isError && serverTime && (
          <p className="text-[10px] text-white/25 mt-4">
            Servidor: {new Date(serverTime).toLocaleString("es-ES")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function MetricCell({ type, entry }: { type: SensorType; entry?: ReadingSensorEntry | null }) {
  const Icon = SENSOR_ICON[type];
  const threshold = SENSOR_THRESHOLDS[type];
  const hasValue = entry?.value !== null && entry?.value !== undefined;
  const colorClass = entry ? VALUE_STATUS_COLOR[entry.value_status] : VALUE_STATUS_COLOR.unknown;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[11px] text-white/40">
        <Icon className="h-3.5 w-3.5" />
        {threshold.label}
      </div>
      <p className={`text-2xl font-mono font-bold leading-none ${colorClass}`}>
        {hasValue ? entry!.value!.toFixed(2) : "—"}
        {hasValue && <span className="text-xs font-normal text-white/40 ml-1">{threshold.unit}</span>}
      </p>
      {!hasValue && <p className="text-[10px] text-white/25">Sin datos</p>}
    </div>
  );
}
