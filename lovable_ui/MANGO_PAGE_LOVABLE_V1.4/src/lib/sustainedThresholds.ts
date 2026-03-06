import type { SensorType } from "@/types/dashboard";

export interface SustainedRule {
  id: string;
  label: string;
  direction: "below" | "above";
  threshold: number;
  unit: string;
  /** Minutes the violation must persist to trigger */
  durationMinutes: number;
  /** Percentage of readings that must violate (0-1). Allows brief spikes without false positives */
  violationRatio: number;
  /** Severity when triggered */
  severity: "warning" | "critical";
  /** Human-readable explanation */
  explanation: string;
}

export type SustainedConfig = Record<SensorType, SustainedRule[]>;

/**
 * Each sensor can have multiple sustained rules.
 * Rules are evaluated independently — e.g. temperature can alert
 * for being too low for 1 hour AND for being too low for 24 hours.
 */
export const SUSTAINED_THRESHOLDS: SustainedConfig = {
  temperature: [
    {
      id: "temp-low-1h",
      label: "Temperatura baja sostenida (1h)",
      direction: "below",
      threshold: 20,
      unit: "°C",
      durationMinutes: 60,
      violationRatio: 0.75,
      severity: "warning",
      explanation:
        "La temperatura se ha mantenido por debajo de 20°C durante más de 1 hora. Esto puede afectar la actividad biológica.",
    },
    {
      id: "temp-low-24h",
      label: "Temperatura baja prolongada (24h)",
      direction: "below",
      threshold: 20,
      unit: "°C",
      durationMinutes: 1440,
      violationRatio: 0.7,
      severity: "critical",
      explanation:
        "La temperatura ha permanecido por debajo de 20°C durante un día completo. Requiere intervención inmediata.",
    },
    {
      id: "temp-high-1h",
      label: "Temperatura alta sostenida (1h)",
      direction: "above",
      threshold: 30,
      unit: "°C",
      durationMinutes: 60,
      violationRatio: 0.75,
      severity: "warning",
      explanation:
        "La temperatura se ha mantenido por encima de 30°C durante más de 1 hora.",
    },
    {
      id: "temp-high-24h",
      label: "Temperatura alta prolongada (24h)",
      direction: "above",
      threshold: 30,
      unit: "°C",
      durationMinutes: 1440,
      violationRatio: 0.7,
      severity: "critical",
      explanation:
        "La temperatura ha permanecido por encima de 30°C durante un día completo. Riesgo alto.",
    },
  ],
  ph: [
    {
      id: "ph-low-1h",
      label: "pH bajo sostenido (1h)",
      direction: "below",
      threshold: 6.5,
      unit: "",
      durationMinutes: 60,
      violationRatio: 0.75,
      severity: "warning",
      explanation:
        "El pH se ha mantenido por debajo de 6.5 durante más de 1 hora. El agua se está acidificando.",
    },
    {
      id: "ph-low-24h",
      label: "pH bajo prolongado (24h)",
      direction: "below",
      threshold: 6.5,
      unit: "",
      durationMinutes: 1440,
      violationRatio: 0.7,
      severity: "critical",
      explanation:
        "El pH ha permanecido ácido durante un día completo. Intervención urgente requerida.",
    },
    {
      id: "ph-high-1h",
      label: "pH alto sostenido (1h)",
      direction: "above",
      threshold: 8.5,
      unit: "",
      durationMinutes: 60,
      violationRatio: 0.75,
      severity: "warning",
      explanation:
        "El pH se ha mantenido por encima de 8.5 durante más de 1 hora.",
    },
    {
      id: "ph-high-24h",
      label: "pH alto prolongado (24h)",
      direction: "above",
      threshold: 8.5,
      unit: "",
      durationMinutes: 1440,
      violationRatio: 0.7,
      severity: "critical",
      explanation:
        "El pH ha permanecido alcalino durante un día completo. Riesgo alto para la vida acuática.",
    },
  ],
  turbidity: [
    {
      id: "turb-high-1h",
      label: "Turbidez alta sostenida (1h)",
      direction: "above",
      threshold: 5,
      unit: "NTU",
      durationMinutes: 60,
      violationRatio: 0.75,
      severity: "warning",
      explanation:
        "La turbidez se ha mantenido por encima de 5 NTU durante más de 1 hora. El agua podría estar contaminada.",
    },
    {
      id: "turb-high-24h",
      label: "Turbidez alta prolongada (24h)",
      direction: "above",
      threshold: 5,
      unit: "NTU",
      durationMinutes: 1440,
      violationRatio: 0.7,
      severity: "critical",
      explanation:
        "La turbidez ha permanecido elevada durante un día completo. Posible contaminación persistente.",
    },
    {
      id: "turb-critical-1h",
      label: "Turbidez crítica sostenida (1h)",
      direction: "above",
      threshold: 10,
      unit: "NTU",
      durationMinutes: 60,
      violationRatio: 0.7,
      severity: "critical",
      explanation:
        "La turbidez ha superado 10 NTU durante más de 1 hora. Situación grave.",
    },
  ],
};
