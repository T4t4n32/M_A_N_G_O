import { useQuery } from "@tanstack/react-query";
import { getReadingsLatest } from "@/lib/api";
import type { ReadingsLatestResponse, SensorType, ReadingSensorEntry } from "@/types/dashboard";

/**
 * Modular TanStack Query hook for the three core ocean sensors (ph, temperature, turbidity).
 * Wraps GET /api/v1/readings/latest — the protocol-aligned endpoint that returns the latest
 * value, unit, timestamp and connection/value status per sensor.
 *
 * Shares its query key ("readings-latest") with useSensorData so both hooks read the same
 * cached response instead of polling the backend twice for identical data.
 */
export function useOceanMetrics() {
  const query = useQuery({
    queryKey:             ["readings-latest"],
    queryFn:              getReadingsLatest,
    refetchInterval:      60_000,
    retry:                2,
    retryDelay:           2000,
    refetchOnWindowFocus: true,
  });

  const sensors: Partial<Record<SensorType, ReadingSensorEntry | null>> =
    query.data?.sensors ?? {};

  return {
    sensors,
    systemStatus: query.data?.status,
    serverTime:   query.data?.server_time,
    isLoading:    query.isLoading,
    isError:      query.isError,
    error:        query.error,
    refetch:      query.refetch,
  };
}

export type UseOceanMetricsResult = ReturnType<typeof useOceanMetrics>;
export type { ReadingsLatestResponse };
