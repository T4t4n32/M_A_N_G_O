import { useQuery } from "@tanstack/react-query";
import { getLatest } from "@/lib/api";
import type { SensorState, SensorReading, SensorType } from "@/types/dashboard";

function deriveSensorState(reading?: SensorReading): SensorState {
  if (!reading) return "no-data";
  if (reading.connected === false) return "disconnected";
  if (reading.status === "needs_calibration") return "needs_calibration";
  if (reading.status === "hardware_issue") return "hardware_issue";
  if (reading.value === -1 || reading.value === null || reading.value === undefined) return "no-data";
  return "has-data";
}

export function useSensorData() {
  const query = useQuery({
    queryKey: ["latest-by-type"],
    queryFn: getLatest,
    refetchInterval: 60_000,  // fallback poll — SSE (useSensorStream) drives updates
    retry: 2,
    retryDelay: 2000,
    refetchOnWindowFocus: true,
  });

  const sensors: Record<SensorType, { state: SensorState; reading?: SensorReading }> = {
    ph: { state: "loading" },
    temperature: { state: "loading" },
    turbidity: { state: "loading" },
  };

  if (query.isError) {
    sensors.ph = { state: "error" };
    sensors.temperature = { state: "error" };
    sensors.turbidity = { state: "error" };
  } else if (query.isSuccess && query.data) {
    for (const type of ["ph", "temperature", "turbidity"] as SensorType[]) {
      const reading = query.data[type];
      sensors[type] = { state: deriveSensorState(reading), reading };
    }
  }

  return {
    sensors,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
