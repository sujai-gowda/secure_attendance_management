import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FolderPlus, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RosterListSkeleton } from "@/components/ui/page-skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { getErrorMessage } from "@/helpers/error-messages";
import { Link } from "react-router-dom";
import { TEACHERS, COURSES } from "@/constants/attendance";
import { useAuth } from "@/contexts/AuthContext";
import { useClassrooms, useClassroom, useSubmitAttendance } from "@/queries";

interface AttendanceFormData {
  teacherId: string;
  courseId: string;
  date: string;
  classId: string;
  presentStudents: Set<string>;
}

export default function AttendancePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const location = useLocation();
  const preselectedState = location.state as
    | { classId?: string; className?: string }
    | undefined;
  const preselectedClassId = preselectedState?.classId;
  const preselectedClassName = preselectedState?.className;

  const [formData, setFormData] = useState<AttendanceFormData>({
    teacherId: "",
    courseId: "",
    date: new Date().toISOString().split("T")[0],
    classId: "",
    presentStudents: new Set(),
  });

  const classroomsQuery = useClassrooms();
  const classes = classroomsQuery.data ?? [];
  const classesLoading = classroomsQuery.isLoading;
  const selectedClassId = formData.classId || preselectedClassId || "";
  const classroomQuery = useClassroom(selectedClassId || null);
  const activeClassroom = classroomQuery.data ?? null;
  const activeClassLoading = classroomQuery.isLoading;
  const activeClassError = classroomQuery.isError
    ? getErrorMessage(classroomQuery.error, "classroom").description
    : null;
  const submitAttendance = useSubmitAttendance();

  useEffect(() => {
    if (user?.username) {
      const loggedInTeacher = TEACHERS.find(
        (t) => t.username === user.username
      );
      if (loggedInTeacher) {
        setFormData((prev) => ({ ...prev, teacherId: loggedInTeacher.id }));
      }
    }
  }, [user?.username]);

  useEffect(() => {
    if (preselectedClassId && preselectedClassId !== formData.classId) {
      setFormData((prev) => ({
        ...prev,
        classId: preselectedClassId,
        presentStudents: new Set(),
      }));
    }
  }, [preselectedClassId, formData.classId]);

  useEffect(() => {
    if (classroomsQuery.isError && classroomsQuery.error) {
      const { title, description } = getErrorMessage(
        classroomsQuery.error,
        "classroom"
      );
      toast({ title, description, variant: "destructive" });
    }
    if (classroomQuery.isError && classroomQuery.error) {
      const { title, description } = getErrorMessage(
        classroomQuery.error,
        "classroom"
      );
      toast({ title, description, variant: "destructive" });
    }
  }, [
    classroomsQuery.isError,
    classroomsQuery.error,
    classroomQuery.isError,
    classroomQuery.error,
    toast,
  ]);

  const selectedClass = useMemo(() => {
    if (activeClassroom && activeClassroom.id === formData.classId) {
      return activeClassroom;
    }
    return classes.find((c) => c.id === formData.classId);
  }, [activeClassroom, classes, formData.classId]);
  const selectedTeacher = TEACHERS.find((t) => t.id === formData.teacherId);
  const selectedCourse = COURSES.find((c) => c.id === formData.courseId);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teacherId || !formData.courseId || !formData.date) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }
    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.classId) {
      toast({
        title: "Error",
        description: "Please select a class",
        variant: "destructive",
      });
      return;
    }

    if (formData.presentStudents.size === 0) {
      toast({
        title: "Error",
        description: "Please mark at least one student as present",
        variant: "destructive",
      });
      return;
    }

    if (!selectedClass || !selectedTeacher || !selectedCourse) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!selectedClass || !selectedTeacher || !selectedCourse) {
        throw new Error("Missing required selections");
      }

      const currentYear = new Date().getFullYear().toString();
      const presentRollNos = Array.from(formData.presentStudents).filter(
        Boolean
      );

      if (presentRollNos.length === 0) {
        throw new Error("No students selected");
      }

      const result = await submitAttendance.mutateAsync({
        teacherName: selectedTeacher.name,
        course: selectedCourse.name,
        date: formData.date,
        year: currentYear,
        classId: formData.classId,
        presentStudents: presentRollNos,
      });

      toast({
        title: "Success",
        description: result.message,
      });

      const currentTeacherId = formData.teacherId;
      setFormData({
        teacherId: currentTeacherId,
        courseId: "",
        date: new Date().toISOString().split("T")[0],
        classId: "",
        presentStudents: new Set(),
      });
      setStep(1);
    } catch (error: unknown) {
      const { title, description } = getErrorMessage(error, "attendance");
      toast({
        title,
        description,
        variant: "destructive",
      });
    }
  };

  const loading = submitAttendance.isPending;

  const toggleStudent = (rollNo: string) => {
    setFormData((prev) => {
      const newPresentStudents = new Set(prev.presentStudents);
      if (newPresentStudents.has(rollNo)) {
        newPresentStudents.delete(rollNo);
      } else {
        newPresentStudents.add(rollNo);
      }
      return { ...prev, presentStudents: newPresentStudents };
    });
  };

  const markAllPresent = () => {
    if (!selectedClass) return;
    setFormData((prev) => ({
      ...prev,
      presentStudents: new Set(
        selectedClass.students.map((s) => s.roll_number)
      ),
    }));
  };

  const markAllAbsent = () => {
    setFormData((prev) => ({ ...prev, presentStudents: new Set() }));
  };

  const handleClassChange = (classId: string) => {
    setFormData((prev) => ({
      ...prev,
      classId,
      presentStudents: new Set(),
    }));
  };

  const activeClassName =
    selectedClass?.name || preselectedClassName || "Selected class";
  const rosterCount = selectedClass?.students.length ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Take Attendance</h1>
        <p className="text-muted-foreground mt-2">
          Record student attendance on the blockchain
        </p>
      </div>

      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle>Step {step} of 2</CardTitle>
          <CardDescription>
            {step === 1 && "Select teacher, course, and date"}
            {step === 2 && "Select class and mark students present"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <Label htmlFor="teacher">Teacher</Label>
                <Select
                  id="teacher"
                  value={formData.teacherId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      teacherId: e.target.value,
                    }))
                  }
                  required
                  disabled={!!user?.username}
                >
                  <option value="">Select a teacher</option>
                  {TEACHERS.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </Select>
                {user?.username && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Teacher is automatically selected based on your login
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="course">Course</Label>
                <Select
                  id="course"
                  value={formData.courseId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      courseId: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select a course</option>
                  {COURSES.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  required
                />
              </div>
              <Button type="submit" className="w-full gradient-primary hover:opacity-90 transition-opacity">
                Next
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div>
                <Label htmlFor="class">Class</Label>
                <Select
                  id="class"
                  value={formData.classId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  required
                >
                  <option value="">Select a class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </Select>
                {classesLoading && (
                  <div className="mt-2 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                )}
                {!classesLoading && classes.length === 0 && (
                  <EmptyState
                    icon={FolderPlus}
                    title="No classes available"
                    description="Create a classroom from the Classrooms page, then come back here to take attendance."
                    action={
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/classrooms">Go to Classrooms</Link>
                      </Button>
                    }
                    variant="compact"
                    className="mt-2 text-left items-start"
                  />
                )}
                {formData.classId && (
                  <div className="mt-4 rounded-md border border-dashed p-4 bg-muted/30">
                    <p className="text-sm font-medium text-muted-foreground">
                      Active class
                    </p>
                    <p className="text-lg font-semibold">{activeClassName}</p>
                    <p className="text-xs text-muted-foreground">
                      {activeClassLoading
                        ? "Loading roster..."
                        : `${rosterCount} student${
                            rosterCount === 1 ? "" : "s"
                          } in roster`}
                    </p>
                    {activeClassError && (
                      <p className="text-xs text-destructive mt-2">
                        {activeClassError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {activeClassLoading && (
                <div>
                  <Label>Mark Students Present</Label>
                  <div className="mt-2 space-y-2 max-h-96 overflow-y-auto border rounded-md p-4">
                    <RosterListSkeleton rows={8} />
                  </div>
                </div>
              )}

              {!activeClassLoading && selectedClass && (
                <div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Label>Mark Students Present</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={markAllPresent}
                      >
                        Mark all present
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={markAllAbsent}
                      >
                        Mark all absent
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 space-y-2 max-h-96 overflow-y-auto border rounded-md p-4">
                    {selectedClass.students.map((student) => (
                      <div
                        key={student.roll_number}
                        className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md"
                      >
                        <input
                          type="checkbox"
                          id={`student-${student.roll_number}`}
                          checked={formData.presentStudents.has(
                            student.roll_number
                          )}
                          onChange={() => toggleStudent(student.roll_number)}
                          disabled={activeClassLoading}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label
                          htmlFor={`student-${student.roll_number}`}
                          className="flex-1 cursor-pointer text-sm"
                        >
                          <span className="font-medium">
                            Roll No: {student.roll_number}
                          </span>
                          <span className="ml-2 text-muted-foreground">
                            {student.name}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {formData.presentStudents.size} of{" "}
                    {selectedClass.students.length} students marked as present
                  </p>
                </div>
              )}
              {!activeClassLoading &&
                formData.classId &&
                !selectedClass &&
                !activeClassError && (
                  <EmptyState
                    icon={Users}
                    title="No roster for this class"
                    description="Add students to this classroom from the Classrooms page, then return to mark attendance."
                    action={
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/classrooms">Manage Classrooms</Link>
                      </Button>
                    }
                    variant="compact"
                    className="text-left items-start"
                  />
                )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 gradient-primary hover:opacity-90 transition-opacity">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Attendance
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
