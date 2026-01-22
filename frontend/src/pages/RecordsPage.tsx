import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Search, CheckCircle2, XCircle } from 'lucide-react'
import { TEACHERS, COURSES, CLASSES, type Student } from '@/constants/attendance'
import { apiService } from '@/services/api'

interface StudentWithStatus extends Student {
  status: 'present' | 'absent'
}

export default function RecordsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [searchData, setSearchData] = useState({
    teacherId: '',
    courseId: '',
    date: '',
    classId: '',
  })
  const [results, setResults] = useState<StudentWithStatus[] | null>(null)

  const selectedTeacher = TEACHERS.find(t => t.id === searchData.teacherId)
  const selectedCourse = COURSES.find(c => c.id === searchData.courseId)
  const selectedClass = CLASSES.find(c => c.id === searchData.classId)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchData.teacherId || !searchData.courseId || !searchData.date || !searchData.classId) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      })
      return
    }

    if (!selectedTeacher || !selectedCourse || !selectedClass) {
      toast({
        title: 'Error',
        description: 'Please select valid teacher, course, and class',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const currentYear = new Date().getFullYear().toString()
      
      const response = await apiService.getRecords(1, 100, {
        teacherName: selectedTeacher.name,
        course: selectedCourse.name,
        date: searchData.date,
        year: currentYear,
      })

      if (response.data && response.data.length > 0) {
        const record = response.data[0]
        const presentRollNos = new Set((record.present_students || []).map((r: string) => r.trim()))
        
        const allStudentsWithStatus: StudentWithStatus[] = selectedClass.students.map(student => ({
          ...student,
          status: presentRollNos.has(student.rollNo) ? 'present' : 'absent',
        }))
        
        setResults(allStudentsWithStatus)
        
        const presentCount = allStudentsWithStatus.filter(s => s.status === 'present').length
        const absentCount = allStudentsWithStatus.filter(s => s.status === 'absent').length
        
        toast({
          title: 'Success',
          description: `Found ${presentCount} present and ${absentCount} absent students`,
        })
      } else {
        setResults([])
        toast({
          title: 'No Results',
          description: 'No records found for the specified criteria',
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to search records. Please try again.',
        variant: 'destructive',
      })
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  const presentCount = results?.filter(s => s.status === 'present').length || 0
  const absentCount = results?.filter(s => s.status === 'absent').length || 0

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">View Records</h1>
        <p className="text-muted-foreground mt-2">
          Search for attendance records in the blockchain
        </p>
      </div>

      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle>Search Records</CardTitle>
          <CardDescription>
            Select teacher, course, date, and class to find attendance records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <Label htmlFor="teacher">Teacher</Label>
              <Select
                id="teacher"
                value={searchData.teacherId}
                onChange={(e) => setSearchData(prev => ({ ...prev, teacherId: e.target.value }))}
                required
              >
                <option value="">Select a teacher</option>
                {TEACHERS.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="course">Course</Label>
              <Select
                id="course"
                value={searchData.courseId}
                onChange={(e) => setSearchData(prev => ({ ...prev, courseId: e.target.value }))}
                required
              >
                <option value="">Select a course</option>
                {COURSES.map(course => (
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
                value={searchData.date}
                onChange={(e) => setSearchData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="class">Class</Label>
              <Select
                id="class"
                value={searchData.classId}
                onChange={(e) => setSearchData(prev => ({ ...prev, classId: e.target.value }))}
                required
              >
                <option value="">Select a class</option>
                {CLASSES.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" disabled={loading} className="w-full gradient-primary hover:opacity-90 transition-opacity">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Search className="mr-2 h-4 w-4" />
              Search Records
            </Button>
          </form>
        </CardContent>
      </Card>

      {results !== null && (
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              {results.length > 0 
                ? `${presentCount} present, ${absentCount} absent out of ${results.length} students`
                : 'No students found'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.length > 0 ? (
              <div className="space-y-2">
                {results.map((student, index) => (
                  <div
                    key={`${student.rollNo}-${index}`}
                    className={`p-3 rounded-md border flex items-center justify-between ${
                      student.status === 'present'
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {student.status === 'present' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                      <div>
                        <div className="font-medium">
                          Roll No: {student.rollNo} - {student.name}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        student.status === 'present'
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}
                    >
                      {student.status === 'present' ? 'Present' : 'Absent'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No records found for the specified criteria
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
