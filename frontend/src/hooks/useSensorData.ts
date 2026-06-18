import { useQuery } from "@tanstack/react-query";
import { getReadingsLatest } from "@/lib/api";
import { useActiveMission } from "@/hooks/useActiveMission";
import type { SensorState, SensorReading, SensorType, ReadingSensorEntry } from "@/types/dashboard";
import type { OperationalContext } from "@/hooks/useActiveMission";

function deriveLiveState(entry: ReadingSensorEntry | null | undefined): SensorState {
  if (!entry || entry.value === null) return "no-data";
  switch (entry.status) {
    case "online":  return "has-data";
    case "stale":   return "stale";
    case "offline": return "offline";
    case "no_data": return "no-data";
    default:        return "no-data";
  }
}

// Map operational context + live state to the final displayed state.
// Only contexts "field" and "paused" pass through live sensor data.
// All other contexts override to a mission-derived state.
function resolveState(
  liveState: SensorState,
  context: OperationalContext,
): SensorState {
  switch (context) {
    case "loading":
      return "loading";
    case "standby":
      return "standby";
    case "armed":
      return "armed";
    case "field":
      return liveState; // real-time data from device
    case "paused":
      // In paused missions sensors are still on but not actively streaming
      return liveState === "has-data" ? "stale" : liveState;
    case "returning":
      return "offline";
    default:
      return "standby";
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
  const { context } = useActiveMission();

  const query = useQuery({
    queryKey:            ["readings-latest"],
    queryFn:             getReadingsLatest,
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
      const entry    = query.data.sensors[type];
      const rawState = deriveLiveState(entry);
      const state    = resolveState(rawState, context);

      // Only show the reading value when the device is actively collecting data.
      // In standby/armed we pass through the last known reading for reference
      // but the state label makes it clear the device is not live.
      sensors[type] = {
        state,
        reading: entry && entry.value !== null ? entryToReading(entry) : undefined,
      };
    }
  }

  return {
    sensors,
    context,
    isLoading: query.isLoading,
    isError:   query.isError,
    refetch:   query.refetch,
  };
}
