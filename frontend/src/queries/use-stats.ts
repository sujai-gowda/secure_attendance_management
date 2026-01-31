import { useQuery } from "@tanstack/react-query";
import { apiService, type BlockchainStats } from "@/services/api";
import { queryKeys } from "./keys";

const STALE_TIME_MS = 60 * 1000;

export function useStats() {
  return useQuery({
    queryKey: queryKeys.stats(),
    queryFn: (): Promise<BlockchainStats> => apiService.getStats(),
    staleTime: STALE_TIME_MS,
  });
}
