import { useQuery } from "@tanstack/react-query";
import { apiService, type StudentSearchResult } from "@/services/api";
import { queryKeys } from "./keys";

const STALE_TIME_MS = 2 * 60 * 1000;

export function useStudentSearch(rollNo: string) {
  return useQuery({
    queryKey: queryKeys.studentSearch(rollNo),
    queryFn: (): Promise<StudentSearchResult> =>
      apiService.searchStudent(rollNo),
    enabled: Boolean(rollNo.trim()),
    staleTime: STALE_TIME_MS,
  });
}
