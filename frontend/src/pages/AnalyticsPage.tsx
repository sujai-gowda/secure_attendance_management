import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, BookOpen } from "lucide-react";
import { apiService, type AttendanceAnalytics } from "@/services/api";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AttendanceAnalytics | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAnalytics();
      setAnalytics(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const trends = analytics.trends || {
    daily_attendance: [],
    course_popularity: [],
    teacher_activity: [],
  };

  const dailyAttendanceData = (trends.daily_attendance || []).map(
    ([date, students]: [string, number]) => ({
      date: new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      fullDate: date,
      students,
    })
  );

  const courseDistributionData = Object.entries(analytics.by_course || {}).map(
    ([course, data]: [string, any]) => ({
      name: course,
      value: data.total_students || 0,
      classes: data.total_classes || 0,
    })
  );

  const PIE_COLORS = [
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#06b6d4",
    "#ef4444",
    "#6366f1",
  ];

  const topStudentsData = Object.entries(analytics.student_attendance || {})
    .map(([rollNo, count]) => ({
      rollNo,
      count: count as number,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((item) => ({
      name: `Roll No: ${item.rollNo}`,
      attendance: item.count,
    }));

  const teacherAttendanceVsClasses = Object.entries(analytics.by_teacher || {})
    .map(([teacher, data]: [string, any]) => ({
      name: teacher,
      students: data.total_students || 0,
      classes: data.total_classes || 0,
      avgStudents: data.avg_students_per_class || 0,
    }))
    .sort((a, b) => b.classes - a.classes);

  const attendanceByDate = Object.entries(analytics.by_date || {})
    .map(([date, data]: [string, any]) => ({
      date,
      students: data.students || 0,
      classes: data.classes || 0,
      formattedDate: new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const maxAttendance = Math.max(...attendanceByDate.map((d) => d.students), 1);

  const getHeatmapIntensity = (students: number) => {
    if (students === 0) return 0;
    const intensity = Math.ceil((students / maxAttendance) * 4);
    return Math.min(intensity, 4);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Insights and statistics from attendance data
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Blocks</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview.total_blocks}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.attendance_blocks} attendance records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview.total_students_recorded}
            </div>
            <p className="text-xs text-muted-foreground">Students recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unique Teachers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview.unique_teachers.length}
            </div>
            <p className="text-xs text-muted-foreground">Active teachers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unique Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview.unique_courses.length}
            </div>
            <p className="text-xs text-muted-foreground">Different courses</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Attendance Trend</CardTitle>
          <CardDescription>
            Track student attendance patterns over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dailyAttendanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={dailyAttendanceData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: "12px" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="students"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Students Present"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              No attendance data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Course Distribution</CardTitle>
          <CardDescription>
            Visual breakdown of attendance by course
          </CardDescription>
        </CardHeader>
        <CardContent>
          {courseDistributionData.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={courseDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {courseDistributionData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                    formatter={(value: number) => [
                      `${value} students`,
                      "Total Students",
                    ]}
                  />
                  <Legend
                    formatter={(value, entry) => (
                      <span style={{ color: entry.color }}>
                        {value}: {entry.payload?.value || 0} students
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              No course distribution data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Students by Attendance</CardTitle>
          <CardDescription>
            Most regular students based on attendance count
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topStudentsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={topStudentsData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: "12px" }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: "12px" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                  formatter={(value: number) => [
                    `${value} attendances`,
                    "Total Attendances",
                  ]}
                />
                <Legend />
                <Bar
                  dataKey="attendance"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  name="Attendances"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              No student attendance data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teacher Performance: Attendance vs Classes</CardTitle>
          <CardDescription>
            Compare total students attended with classes conducted per teacher
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teacherAttendanceVsClasses.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart
                data={teacherAttendanceVsClasses}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: "12px" }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  yAxisId="left"
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: "12px" }}
                  label={{
                    value: "Students",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: "12px" }}
                  label={{
                    value: "Classes",
                    angle: 90,
                    position: "insideRight",
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="students"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  name="Total Students"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="classes"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: "#8b5cf6", r: 4 }}
                  name="Classes Conducted"
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              No teacher performance data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Calendar Heatmap</CardTitle>
          <CardDescription>
            Visualize attendance density by date - darker colors indicate higher
            attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceByDate.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2">
                {attendanceByDate.map((item) => {
                  const intensity = getHeatmapIntensity(item.students);
                  const intensityColors = [
                    "bg-muted",
                    "bg-primary/20",
                    "bg-primary/40",
                    "bg-primary/60",
                    "bg-primary",
                  ];
                  const color =
                    intensityColors[intensity] || intensityColors[0];

                  return (
                    <div
                      key={item.date}
                      className={`${color} rounded-md p-2 text-center text-xs border border-border hover:scale-105 transition-transform cursor-pointer group relative`}
                      title={`${item.formattedDate}: ${item.students} students, ${item.classes} classes`}
                    >
                      <div className="font-medium text-[10px] mb-1">
                        {new Date(item.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="font-bold">{item.students}</div>
                      <div className="text-[10px] opacity-70">students</div>
                      <div className="absolute inset-0 bg-black/5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span>Less</span>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`w-4 h-4 rounded ${
                        [
                          "bg-muted",
                          "bg-primary/20",
                          "bg-primary/40",
                          "bg-primary/60",
                          "bg-primary",
                        ][level]
                      } border border-border`}
                    />
                  ))}
                </div>
                <span>More</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No attendance calendar data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
