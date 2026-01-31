import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService, type Classroom } from "@/services/api";
import { queryKeys } from "./keys";

const STALE_TIME_MS = 60 * 1000;

export function useClassrooms() {
  return useQuery({
    queryKey: queryKeys.classrooms(),
    queryFn: (): Promise<Classroom[]> => apiService.listClassrooms(),
    staleTime: STALE_TIME_MS,
  });
}

export function useClassroom(classId: string | null) {
  return useQuery({
    queryKey: queryKeys.classroom(classId ?? ""),
    queryFn: (): Promise<Classroom> =>
      apiService.getClassroom(classId as string),
    enabled: Boolean(classId),
    staleTime: STALE_TIME_MS,
  });
}

export function useDeleteClassroom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) => apiService.deleteClassroom(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classrooms() });
    },
  });
}
