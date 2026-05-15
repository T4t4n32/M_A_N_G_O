import { useQuery } from "@tanstack/react-query";
import { getAlertStatus } from "@/lib/api";

export function useAlertHistory() {
  return useQuery({
    queryKey: ["alert-status"],
    queryFn: getAlertStatus,
    refetchInterval: 60_000,
    retry: 1,
    retryDelay: 5000,
  });
}
