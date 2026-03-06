import type { SensorThreshold, SensorType } from "@/types/dashboard";

export const SENSOR_THRESHOLDS: Record<SensorType, SensorThreshold> = {
  ph: {
    type: "ph",
    label: "pH",
    unit: "",
    optimalLow: 6.5,
    optimalHigh: 8.5,
    warningLow: 5.5,
    warningHigh: 9.5,
    criticalLow: 4.0,
    criticalHigh: 10.5,
  },
  temperature: {
    type: "temperature",
    label: "Temperatura",
    unit: "°C",
    optimalLow: 15,
    optimalHigh: 30,
    warningLow: 10,
    warningHigh: 35,
    criticalLow: 5,
    criticalHigh: 40,
  },
  turbidity: {
    type: "turbidity",
    label: "Turbidez",
    unit: "NTU",
    optimalLow: 0,
    optimalHigh: 5,
    warningLow: 0,
    warningHigh: 10,
    criticalLow: 0,
    criticalHigh: 50,
  },
};
