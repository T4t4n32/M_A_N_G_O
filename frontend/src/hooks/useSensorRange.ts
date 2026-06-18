import { useQuery } from "@tanstack/react-query";
import { getReadingsHistory } from "@/lib/api";
import type { SensorType } from "@/types/dashboard";

function limitForRange(minutes: number): number {
  if (minutes <= 1440)  return 288;   // 24 h  — 5-min resolution (288 pts)
  if (minutes <= 10080) return 336;   // 7 d   — 30-min resolution (336 pts)
  if (minutes <= 43200) return 360;   // 30 d  — 2-h resolution (360 pts)
  return 450;                         // 90 d  — ~4.8-h resolution
}

export function useSensorRange(type: SensorType, minutes: number) {
  const limit = limitForRange(minutes);

  const query = useQuery({
    queryKey: ["sensor-range", type, minutes],
    queryFn:  () => getReadingsHistory(type, minutes, limit),
    refetchInterval:  120_000,
    retry:            2,
    retryDelay:       2000,
    staleTime:        60_000,
  });

  return {
    series:    query.data?.series ?? [],
    count:     query.data?.count  ?? 0,
    isLoading: query.isLoading,
    isError:   query.isError,
  };
}
