export const queryKeys = {
  all: ["blockendance"] as const,
  stats: () => [...queryKeys.all, "stats"] as const,
  analytics: () => [...queryKeys.all, "analytics"] as const,
  classrooms: () => [...queryKeys.all, "classrooms"] as const,
  classroom: (id: string) => [...queryKeys.all, "classroom", id] as const,
  integrity: () => [...queryKeys.all, "integrity"] as const,
  blocks: () => [...queryKeys.all, "blocks"] as const,
  studentSearch: (rollNo: string) =>
    [...queryKeys.all, "student", rollNo] as const,
};
