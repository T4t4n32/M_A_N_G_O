import { useQuery } from "@tanstack/react-query";
import { getHealth } from "@/lib/api";

export function useHealth() {
  const query = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    refetchInterval: 15_000,
    retry: 1,
    retryDelay: 3000,
  });

  return {
    isOnline: query.isSuccess && query.data?.status === "ok",
    isDegraded: query.isSuccess && query.data?.status === "degraded",
    isOffline: query.isError,
    isLoading: query.isLoading,
  };
}
