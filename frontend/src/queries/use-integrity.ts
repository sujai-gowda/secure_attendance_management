import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { queryKeys } from "./keys";

const STALE_TIME_MS = 60 * 1000;

export function useIntegrity() {
  return useQuery({
    queryKey: queryKeys.integrity(),
    queryFn: () =>
      apiService.checkIntegrity() as Promise<{
        result: string;
        is_valid: boolean;
        timestamp: string;
      }>,
    staleTime: STALE_TIME_MS,
  });
}

export function useBlocks() {
  return useQuery({
    queryKey: queryKeys.blocks(),
    queryFn: () => apiService.getAllBlocks(),
    staleTime: STALE_TIME_MS,
  });
}
