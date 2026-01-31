import { useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Users, BookOpen, BarChart3 } from "lucide-react";
import { AnalyticsPageSkeleton } from "@/components/ui/page-skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { ExportButtons } from "@/components/ExportButtons";
import { getErrorMessage } from "@/helpers/error-messages";
import { useAnalytics } from "@/queries";
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

export default function AnalyticsPage() {
  const { toast } = useToast();
  const { data: analytics, isLoading: loading, isError, error } = useAnalytics();

  useEffect(() => {
    if (isError && error) {
      const { title, description } = getErrorMessage(error, "analytics");
      toast({
        title,
        description,
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const dailyAttendanceData = useMemo(() => {
    if (!analytics) return [];
    const trends = analytics.trends || {
      daily_attendance: [],
      course_popularity: [],
      teacher_activity: [],
    };
    return (trends.daily_attendance || []).map(
      ([date, students]: [string, number]) => ({
        date: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        fullDate: date,
        students,
      })
    );
  }, [analytics]);

  const courseDistributionData = useMemo(() => {
    if (!analytics) return [];
    return Object.entries(analytics.by_course || {}).map(
      ([course, data]: [string, any]) => ({
        name: course,
        value: data.total_students || 0,
        classes: data.total_classes || 0,
      })
    );
  }, [analytics]);

  const topStudentsData = useMemo(() => {
    if (!analytics) return [];
    return Object.entries(analytics.student_attendance || {})
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
  }, [analytics]);

  const teacherAttendanceVsClasses = useMemo(() => {
    if (!analytics) return [];
    return Object.entries(analytics.by_teacher || {})
      .map(([teacher, data]: [string, any]) => ({
        name: teacher,
        students: data.total_students || 0,
        classes: data.total_classes || 0,
        avgStudents: data.avg_students_per_class || 0,
      }))
      .sort((a, b) => b.classes - a.classes);
  }, [analytics]);

  const { attendanceByDate, maxAttendance } = useMemo(() => {
    if (!analytics) {
      return { attendanceByDate: [] as { date: string; students: number; classes: number; formattedDate: string }[], maxAttendance: 1 };
    }
    const byDate = Object.entries(analytics.by_date || {})
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
    const max = Math.max(...byDate.map((d) => d.students), 1);
    return { attendanceByDate: byDate, maxAttendance: max };
  }, [analytics]);

  const getHeatmapIntensity = useCallback(
    (students: number) => {
      if (students === 0) return 0;
      const intensity = Math.ceil((students / maxAttendance) * 4);
      return Math.min(intensity, 4);
    },
    [maxAttendance]
  );

  if (loading) {
    return <AnalyticsPageSkeleton />;
  }

  if (!analytics) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No analytics data yet"
        description="Start recording attendance to see insights, trends, and statistics here."
        variant="default"
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Insights and statistics from attendance data
          </p>
        </div>
        <ExportButtons />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card hover-lift border-white/10">
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

        <Card className="glass-card hover-lift border-white/10">
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

        <Card className="glass-card hover-lift border-white/10">
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

        <Card className="glass-card hover-lift border-white/10">
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

      <Card className="glass-card hover-lift border-white/10">
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
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    color: "hsl(var(--popover-foreground))",
                    padding: "8px 12px",
                  }}
                  itemStyle={{
                    color: "hsl(var(--popover-foreground))",
                  }}
                  labelStyle={{
                    color: "hsl(var(--popover-foreground))",
                    fontWeight: 600,
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
            <EmptyState
              title="No daily attendance data"
              description="Attendance records will appear here once you start recording."
              variant="chart"
            />
          )}
        </CardContent>
      </Card>

      <Card className="glass-card hover-lift border-white/10">
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
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      color: "hsl(var(--popover-foreground))",
                      padding: "8px 12px",
                    }}
                    itemStyle={{
                      color: "hsl(var(--popover-foreground))",
                    }}
                    labelStyle={{
                      color: "hsl(var(--popover-foreground))",
                      fontWeight: 600,
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
            <EmptyState
              title="No course distribution yet"
              description="Record attendance for different courses to see the breakdown here."
              variant="chart"
            />
          )}
        </CardContent>
      </Card>

      <Card className="glass-card hover-lift border-white/10">
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
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    color: "hsl(var(--popover-foreground))",
                    padding: "8px 12px",
                  }}
                  itemStyle={{
                    color: "hsl(var(--popover-foreground))",
                  }}
                  labelStyle={{
                    color: "hsl(var(--popover-foreground))",
                    fontWeight: 600,
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
            <EmptyState
              title="No student attendance data yet"
              description="Top attendees will show here after attendance is recorded."
              variant="chart"
            />
          )}
        </CardContent>
      </Card>

      <Card className="glass-card hover-lift border-white/10">
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
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    color: "hsl(var(--popover-foreground))",
                    padding: "8px 12px",
                  }}
                  itemStyle={{
                    color: "hsl(var(--popover-foreground))",
                  }}
                  labelStyle={{
                    color: "hsl(var(--popover-foreground))",
                    fontWeight: 600,
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
            <EmptyState
              title="No teacher performance data yet"
              description="Teacher stats will appear once attendance is recorded."
              variant="chart"
            />
          )}
        </CardContent>
      </Card>

      <Card className="glass-card hover-lift border-white/10">
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
            <EmptyState
              title="No calendar data yet"
              description="Record attendance to see the heatmap by date."
              variant="chart"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
