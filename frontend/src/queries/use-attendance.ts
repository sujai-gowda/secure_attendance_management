import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { queryKeys } from "./keys";

export function useSubmitAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      teacherName: string;
      course: string;
      date: string;
      year: string;
      classId: string;
      presentStudents: string[];
    }) => apiService.submitAttendance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.integrity() });
      queryClient.invalidateQueries({ queryKey: queryKeys.blocks() });
    },
  });
}
