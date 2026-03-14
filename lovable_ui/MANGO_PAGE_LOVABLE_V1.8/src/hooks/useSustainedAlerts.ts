import { useQuery } from "@tanstack/react-query";
import { getRange } from "@/lib/api";
import { SUSTAINED_THRESHOLDS, type SustainedRule } from "@/lib/sustainedThresholds";
import type { SensorType, AlertLevel, RangePoint } from "@/types/dashboard";

export interface SustainedViolation {
  rule: SustainedRule;
  sensorType: SensorType;
  /** Actual ratio of violating readings (0-1) */
  actualRatio: number;
  /** Total readings evaluated */
  totalReadings: number;
  /** Number of violating readings */
  violatingReadings: number;
  /** Whether this rule is currently triggered */
  triggered: boolean;
}

export interface SustainedSystemAlert {
  level: AlertLevel;
  title: string;
  message: string;
  violations: SustainedViolation[];
  triggeredCount: number;
  criticalCount: number;
  warningCount: number;
  /** Sensors with at least one triggered sustained alert */
  affectedSensors: SensorType[];
}

function evaluateRule(
  rule: SustainedRule,
  series: RangePoint[]
): { actualRatio: number; violatingReadings: number } {
  if (series.length === 0) return { actualRatio: 0, violatingReadings: 0 };

  const violating = series.filter((p) =>
    rule.direction === "below" ? p.value < rule.threshold : p.value > rule.threshold
  ).length;

  return {
    actualRatio: violating / series.length,
    violatingReadings: violating,
  };
}

const SENSOR_TYPES: SensorType[] = ["ph", "temperature", "turbidity"];

/**
 * Fetches range data for the maximum duration needed and evaluates all sustained rules.
 * Uses a single query per sensor, filtering by time window per rule.
 */
export function useSustainedAlerts(): SustainedSystemAlert {
  // Find max duration needed across all rules per sensor
  const maxMinutes: Record<SensorType, number> = { ph: 60, temperature: 60, turbidity: 60 };
  for (const type of SENSOR_TYPES) {
    for (const rule of SUSTAINED_THRESHOLDS[type]) {
      if (rule.durationMinutes > maxMinutes[type]) {
        maxMinutes[type] = rule.durationMinutes;
      }
    }
  }

  // Fetch range data for each sensor
  const phRange = useQuery({
    queryKey: ["sustained-range", "ph", maxMinutes.ph],
    queryFn: () => getRange("ph", maxMinutes.ph),
    refetchInterval: 120_000,
    retry: 1,
    staleTime: 60_000,
  });

  const tempRange = useQuery({
    queryKey: ["sustained-range", "temperature", maxMinutes.temperature],
    queryFn: () => getRange("temperature", maxMinutes.temperature),
    refetchInterval: 120_000,
    retry: 1,
    staleTime: 60_000,
  });

  const turbRange = useQuery({
    queryKey: ["sustained-range", "turbidity", maxMinutes.turbidity],
    queryFn: () => getRange("turbidity", maxMinutes.turbidity),
    refetchInterval: 120_000,
    retry: 1,
    staleTime: 60_000,
  });

  const rangeData: Record<SensorType, RangePoint[]> = {
    ph: phRange.data?.series ?? [],
    temperature: tempRange.data?.series ?? [],
    turbidity: turbRange.data?.series ?? [],
  };

  // Evaluate all rules
  const violations: SustainedViolation[] = [];

  for (const type of SENSOR_TYPES) {
    const fullSeries = rangeData[type];

    for (const rule of SUSTAINED_THRESHOLDS[type]) {
      // Filter series to only include points within the rule's time window
      const cutoff = Date.now() - rule.durationMinutes * 60 * 1000;
      const relevantSeries = fullSeries.filter(
        (p) => new Date(p.ts).getTime() >= cutoff
      );

      const { actualRatio, violatingReadings } = evaluateRule(rule, relevantSeries);
      const triggered = relevantSeries.length >= 3 && actualRatio >= rule.violationRatio;

      violations.push({
        rule,
        sensorType: type,
        actualRatio,
        totalReadings: relevantSeries.length,
        violatingReadings,
        triggered,
      });
    }
  }

  const triggeredViolations = violations.filter((v) => v.triggered);
  const criticalCount = triggeredViolations.filter((v) => v.rule.severity === "critical").length;
  const warningCount = triggeredViolations.filter((v) => v.rule.severity === "warning").length;
  const affectedSensors = [...new Set(triggeredViolations.map((v) => v.sensorType))];

  let level: AlertLevel = "normal";
  let title = "Sin alertas sostenidas";
  let message = "Ningún sensor ha mantenido valores fuera de rango por periodos prolongados.";

  if (criticalCount > 0 && affectedSensors.length >= 3) {
    level = "critical";
    title = "🚨 ALERTA CRÍTICA SOSTENIDA — Todos los sensores";
    message = `Los tres sensores mantienen valores fuera de rango durante periodos prolongados. Se requiere intervención inmediata del sistema completo.`;
  } else if (criticalCount > 0 && affectedSensors.length >= 2) {
    level = "critical";
    title = "🚨 Alerta crítica sostenida múltiple";
    message = `${affectedSensors.length} sensores mantienen valores fuera de rango por periodos prolongados.`;
  } else if (criticalCount > 0) {
    level = "critical";
    const first = triggeredViolations.find((v) => v.rule.severity === "critical")!;
    title = `🚨 Alerta crítica sostenida: ${first.rule.label}`;
    message = first.rule.explanation;
  } else if (warningCount > 0 && affectedSensors.length >= 3) {
    level = "warning";
    title = "⚠️ Advertencia sostenida — Todos los sensores";
    message = "Los tres sensores muestran tendencias fuera del rango óptimo durante periodos prolongados.";
  } else if (warningCount > 0 && affectedSensors.length >= 2) {
    level = "warning";
    title = "⚠️ Advertencias sostenidas múltiples";
    message = `${affectedSensors.length} sensores con valores sostenidos fuera de rango.`;
  } else if (warningCount > 0) {
    level = "warning";
    const first = triggeredViolations.find((v) => v.rule.severity === "warning")!;
    title = `⚠️ Advertencia sostenida: ${first.rule.label}`;
    message = first.rule.explanation;
  }

  return {
    level,
    title,
    message,
    violations,
    triggeredCount: triggeredViolations.length,
    criticalCount,
    warningCount,
    affectedSensors,
  };
}
