import { useQuery } from "@tanstack/react-query";
import { getReadingsLatest } from "@/lib/api";
import type { SensorState, SensorReading, SensorType, ReadingSensorEntry } from "@/types/dashboard";

function deriveSensorState(entry: ReadingSensorEntry | null | undefined): SensorState {
  if (!entry || entry.value === null) return "no-data";
  switch (entry.status) {
    case "online":  return "has-data";
    case "stale":   return "stale";
    case "offline": return "offline";
    case "no_data": return "no-data";
    default:        return "no-data";
  }
}

function entryToReading(entry: ReadingSensorEntry): SensorReading {
  return {
    value:     entry.value ?? 0,
    timestamp: entry.timestamp ?? new Date().toISOString(),
    unit:      entry.unit,
  };
}

export function useSensorData() {
  const query = useQuery({
    queryKey: ["readings-latest"],
    queryFn:  getReadingsLatest,
    refetchInterval:     60_000,
    retry:               2,
    retryDelay:          2000,
    refetchOnWindowFocus: true,
  });

  const sensors: Record<SensorType, { state: SensorState; reading?: SensorReading }> = {
    ph:          { state: "loading" },
    temperature: { state: "loading" },
    turbidity:   { state: "loading" },
  };

  if (query.isError) {
    sensors.ph          = { state: "error" };
    sensors.temperature = { state: "error" };
    sensors.turbidity   = { state: "error" };
  } else if (query.isSuccess && query.data) {
    for (const type of ["ph", "temperature", "turbidity"] as SensorType[]) {
      const entry = query.data.sensors[type];
      const state = deriveSensorState(entry);
      sensors[type] = {
        state,
        reading: entry && entry.value !== null ? entryToReading(entry) : undefined,
      };
    }
  }

  return {
    sensors,
    isLoading: query.isLoading,
    isError:   query.isError,
    refetch:   query.refetch,
  };
}
