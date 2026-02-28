import { useQuery } from "@tanstack/react-query";
import { getRange } from "@/lib/api";
import type { SensorType } from "@/types/dashboard";

export function useSensorRange(type: SensorType, minutes: number) {
  const query = useQuery({
    queryKey: ["sensor-range", type, minutes],
    queryFn: () => getRange(type, minutes),
    refetchInterval: 60_000,
    retry: 2,
    retryDelay: 2000,
    staleTime: 30_000,
  });

  return {
    series: query.data?.series ?? [],
    count: query.data?.count ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
