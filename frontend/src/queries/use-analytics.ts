import { useQuery } from "@tanstack/react-query";
import { apiService, type AttendanceAnalytics } from "@/services/api";
import { queryKeys } from "./keys";

const STALE_TIME_MS = 60 * 1000;

export function useAnalytics() {
  return useQuery({
    queryKey: queryKeys.analytics(),
    queryFn: (): Promise<AttendanceAnalytics> => apiService.getAnalytics(),
    staleTime: STALE_TIME_MS,
  });
}
