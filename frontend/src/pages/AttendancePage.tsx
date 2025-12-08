import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";
import { TEACHERS, COURSES, CLASSES } from "@/constants/attendance";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AttendanceFormData>({
    teacherId: "",
    courseId: "",
    date: new Date().toISOString().split("T")[0],
    classId: "",
    presentStudents: new Set(),
  });

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

  const selectedClass = CLASSES.find((c) => c.id === formData.classId);
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

    setLoading(true);
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

      const result = await apiService.submitAttendance({
        teacherName: selectedTeacher.name,
        course: selectedCourse.name,
        date: formData.date,
        year: currentYear,
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit attendance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handleClassChange = (classId: string) => {
    setFormData((prev) => ({
      ...prev,
      classId,
      presentStudents: new Set(),
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Take Attendance</h1>
        <p className="text-muted-foreground mt-2">
          Record student attendance on the blockchain
        </p>
      </div>

      <Card>
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
              <Button type="submit" className="w-full">
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
                  {CLASSES.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </Select>
              </div>

              {selectedClass && (
                <div>
                  <Label>Mark Students Present</Label>
                  <div className="mt-2 space-y-2 max-h-96 overflow-y-auto border rounded-md p-4">
                    {selectedClass.students.map((student) => (
                      <div
                        key={student.rollNo}
                        className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md"
                      >
                        <input
                          type="checkbox"
                          id={`student-${student.rollNo}`}
                          checked={formData.presentStudents.has(student.rollNo)}
                          onChange={() => toggleStudent(student.rollNo)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label
                          htmlFor={`student-${student.rollNo}`}
                          className="flex-1 cursor-pointer text-sm"
                        >
                          <span className="font-medium">
                            Roll No: {student.rollNo}
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

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
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
