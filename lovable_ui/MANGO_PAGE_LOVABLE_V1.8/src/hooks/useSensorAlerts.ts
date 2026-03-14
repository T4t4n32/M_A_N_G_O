import type { SensorType, SensorReading, AlertLevel, SensorAlert, SystemAlert } from "@/types/dashboard";
import { SENSOR_THRESHOLDS } from "@/lib/sensorThresholds";

function evaluateSensorAlert(type: SensorType, reading?: SensorReading): SensorAlert {
  const t = SENSOR_THRESHOLDS[type];
  const base: SensorAlert = {
    type,
    level: "normal",
    message: "Dentro del rango óptimo",
    range: { low: t.optimalLow, high: t.optimalHigh },
  };

  if (!reading || reading.value === null || reading.value === undefined || reading.value === -1) {
    return { ...base, level: "normal", message: "Sin datos para evaluar" };
  }

  const v = reading.value;
  base.value = v;

  // Critical
  if (v < t.criticalLow || v > t.criticalHigh) {
    const dir = v < t.criticalLow ? "muy bajo" : "muy alto";
    return {
      ...base,
      level: "critical",
      message: `${t.label} ${dir}: ${v.toFixed(2)}${t.unit} (rango crítico: ${t.criticalLow}–${t.criticalHigh}${t.unit})`,
      range: { low: t.criticalLow, high: t.criticalHigh },
    };
  }

  // Warning
  if (v < t.warningLow || v > t.warningHigh) {
    const dir = v < t.warningLow ? "bajo" : "alto";
    return {
      ...base,
      level: "warning",
      message: `${t.label} ${dir}: ${v.toFixed(2)}${t.unit} (rango aceptable: ${t.warningLow}–${t.warningHigh}${t.unit})`,
      range: { low: t.warningLow, high: t.warningHigh },
    };
  }

  // Outside optimal but within warning
  if (v < t.optimalLow || v > t.optimalHigh) {
    const dir = v < t.optimalLow ? "ligeramente bajo" : "ligeramente alto";
    return {
      ...base,
      level: "warning",
      message: `${t.label} ${dir}: ${v.toFixed(2)}${t.unit} (óptimo: ${t.optimalLow}–${t.optimalHigh}${t.unit})`,
      range: { low: t.optimalLow, high: t.optimalHigh },
    };
  }

  return base;
}

export function useSensorAlerts(
  sensors: Record<SensorType, { reading?: SensorReading }>
): SystemAlert {
  const types: SensorType[] = ["ph", "temperature", "turbidity"];
  const sensorAlerts = types.map((t) => evaluateSensorAlert(t, sensors[t].reading));

  const criticalCount = sensorAlerts.filter((a) => a.level === "critical").length;
  const warningCount = sensorAlerts.filter((a) => a.level === "warning").length;

  let level: AlertLevel = "normal";
  let title = "Sistema operando normalmente";
  let message = "Todos los sensores se encuentran dentro de los rangos óptimos.";

  if (criticalCount >= 3) {
    level = "critical";
    title = "⚠️ ALERTA CRÍTICA DEL SISTEMA";
    message = "Los tres sensores reportan valores críticos. Se requiere intervención inmediata.";
  } else if (criticalCount >= 2) {
    level = "critical";
    title = "⚠️ Alerta crítica múltiple";
    message = `${criticalCount} sensores en estado crítico. Revisar con urgencia.`;
  } else if (criticalCount === 1) {
    level = "critical";
    const crit = sensorAlerts.find((a) => a.level === "critical")!;
    title = `Alerta crítica: ${SENSOR_THRESHOLDS[crit.type].label}`;
    message = crit.message;
  } else if (warningCount >= 3) {
    level = "warning";
    title = "Advertencia general del sistema";
    message = "Los tres sensores muestran valores fuera del rango óptimo.";
  } else if (warningCount >= 2) {
    level = "warning";
    title = "Múltiples advertencias";
    message = `${warningCount} sensores con valores fuera del rango óptimo.`;
  } else if (warningCount === 1) {
    level = "warning";
    const warn = sensorAlerts.find((a) => a.level === "warning")!;
    title = `Advertencia: ${SENSOR_THRESHOLDS[warn.type].label}`;
    message = warn.message;
  }

  return { level, title, message, sensorAlerts, criticalCount, warningCount };
}
