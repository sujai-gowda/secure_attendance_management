import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { apiService, ClassroomStudent } from '@/services/api'

const MAX_STUDENTS = 50

type StudentInput = Pick<ClassroomStudent, 'roll_number' | 'name'>

const buildBlankStudent = (): StudentInput => ({
  roll_number: '',
  name: '',
})

export default function AddClassPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [creatingClass, setCreatingClass] = useState(false)
  const [classForm, setClassForm] = useState({
    name: '',
    expectedCount: 5,
    description: '',
    students: Array.from({ length: 5 }, buildBlankStudent),
  })

  const handleExpectedCountChange = (value: string) => {
    const parsed = parseInt(value, 10)
    const sanitized = Math.max(0, Math.min(isNaN(parsed) ? 0 : parsed, MAX_STUDENTS))
    setClassForm(prev => {
      const nextStudents = [...prev.students]
      if (sanitized > nextStudents.length) {
        const diff = sanitized - nextStudents.length
        nextStudents.push(...Array.from({ length: diff }, buildBlankStudent))
      } else {
        nextStudents.splice(sanitized)
      }
      return {
        ...prev,
        expectedCount: sanitized,
        students: sanitized === 0 ? [] : nextStudents,
      }
    })
  }

  const handleStudentChange = (index: number, field: keyof StudentInput, value: string) => {
    setClassForm(prev => {
      const nextStudents = [...prev.students]
      nextStudents[index] = {
        ...nextStudents[index],
        [field]: value,
      }
      return { ...prev, students: nextStudents }
    })
  }

  const resetForm = () => {
    setClassForm({
      name: '',
      expectedCount: 5,
      description: '',
      students: Array.from({ length: 5 }, buildBlankStudent),
    })
  }

  const handleCreateClass = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!classForm.name.trim()) {
      toast({
        title: 'Class name required',
        description: 'Please provide a class name before submitting.',
        variant: 'destructive',
      })
      return
    }

    const filledStudents = classForm.students
      .map(student => ({
        roll_number: student.roll_number.trim(),
        name: student.name.trim(),
      }))
      .filter(student => student.roll_number && student.name)

    const rollNumbers = new Set<string>()
    for (const student of filledStudents) {
      const normalized = student.roll_number.toLowerCase()
      if (rollNumbers.has(normalized)) {
        toast({
          title: 'Duplicate roll number',
          description: `Roll number ${student.roll_number} is entered multiple times.`,
          variant: 'destructive',
        })
        return
      }
      rollNumbers.add(normalized)
    }

    if (classForm.expectedCount > 0 && filledStudents.length === 0) {
      toast({
        title: 'Add at least one student',
        description: 'Please provide student details or reduce the expected count.',
        variant: 'destructive',
      })
      return
    }

    setCreatingClass(true)
    try {
      const classroom = await apiService.createClassroom({
        name: classForm.name,
        expectedStudentCount: classForm.expectedCount,
        description: classForm.description,
      })

      if (filledStudents.length > 0) {
        await apiService.addStudentsToClassroom(classroom.id, filledStudents)
      }

      toast({
        title: 'Classroom created',
        description: `${classForm.name} is now available for attendance.`,
      })

      navigate('/') // Navigate back to home after creation
    } catch (error: any) {
      toast({
        title: 'Failed to create class',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setCreatingClass(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create a New Class</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class Details</CardTitle>
          <CardDescription>
            Define classroom details and roster to kick-start attendance tracking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleCreateClass}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="class-name">Class Name</Label>
                <Input
                  id="class-name"
                  placeholder="e.g., CS101 - Section A"
                  value={classForm.name}
                  onChange={(e) => setClassForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected-count">Expected Students</Label>
                <Input
                  id="expected-count"
                  type="number"
                  min={0}
                  max={MAX_STUDENTS}
                  value={classForm.expectedCount}
                  onChange={(e) => handleExpectedCountChange(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Up to {MAX_STUDENTS} students can be added at once.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-description">Description</Label>
              <textarea
                id="class-description"
                placeholder="Add any helpful notes for this class"
                value={classForm.description}
                onChange={(e) => setClassForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {classForm.expectedCount > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Student Roster</Label>
                  <span className="text-sm text-muted-foreground">
                    {classForm.students.length} student{classForm.students.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                  {classForm.students.map((student, index) => (
                    <div
                      key={`student-${index}`}
                      className="grid gap-3 md:grid-cols-2"
                    >
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Roll Number</Label>
                        <Input
                          placeholder="Roll number"
                          value={student.roll_number}
                          onChange={(e) => handleStudentChange(index, 'roll_number', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Student Name</Label>
                        <Input
                          placeholder="Student name"
                          value={student.name}
                          onChange={(e) => handleStudentChange(index, 'name', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={resetForm}
                disabled={creatingClass}
              >
                Reset
              </Button>
              <Button type="submit" className="flex-1" disabled={creatingClass}>
                {creatingClass && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Class
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
