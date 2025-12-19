import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, FileCheck, BarChart3, Shield, Users, Trash2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChevronDown, ChevronUp } from 'lucide-react'

import { useToast } from '@/hooks/use-toast'
import { apiService, Classroom } from '@/services/api'

const features = [
  {
    icon: FileCheck,
    title: 'Take Attendance',
    description: 'Record student attendance securely on the blockchain',
    link: '/attendance',
    linkText: 'Start Attendance',
    roles: ['teacher'],
  },
  {
    icon: GraduationCap,
    title: 'View Records',
    description: 'Search and view attendance records from the blockchain',
    link: '/records',
    linkText: 'View Records',
    roles: ['student', 'teacher'],
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Get insights and statistics from attendance data',
    link: '/analytics',
    linkText: 'View Analytics',
    roles: ['teacher'],
  },
  {
    icon: Shield,
    title: 'Check Integrity',
    description: 'Verify blockchain integrity and detect tampering',
    link: '/integrity',
    linkText: 'Check Integrity',
    roles: ['student', 'teacher'],
  },
]


export default function HomePage() {
  const { role } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const visibleFeatures = features.filter((feature) => feature.roles.includes(role))

  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loadingClasses, setLoadingClasses] = useState(false)

  // Dialog state
  const [classToDelete, setClassToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [expandedClassId, setExpandedClassId] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedClassId(prev => (prev === id ? null : id))
  }

  const fetchClassrooms = useCallback(async () => {
    setLoadingClasses(true)
    try {
      const data = await apiService.listClassrooms()
      setClassrooms(data)
    } catch (error: any) {
      toast({
        title: 'Failed to load classes',
        description: error?.message || 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setLoadingClasses(false)
    }
  }, [toast])

  useEffect(() => {
    fetchClassrooms()
  }, [fetchClassrooms])

  const handleDeleteClick = (classId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setClassToDelete(classId)
  }

  const confirmDelete = async () => {
    if (!classToDelete) return

    setIsDeleting(true)
    try {
      await apiService.deleteClassroom(classToDelete)
      toast({
        title: "Class deleted",
        description: "The classroom has been successfully deleted.",
      })
      fetchClassrooms()
      setClassToDelete(null)
    } catch (error: any) {
      toast({
        title: "Error deleting class",
        description: error?.message || "Failed to delete class",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }



  const sortedClassrooms = useMemo(() => {
    return [...classrooms].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [classrooms])

  return (
    <div className="space-y-10">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Blockendance
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          A secure, blockchain-based attendance management system.
          Every record is immutable and cryptographically verified.
        </p>
      </div>

      {visibleFeatures.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Please log in to access the available features.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {visibleFeatures.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="flex flex-col">
                <CardHeader>
                  <div className="mb-2">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex items-end">
                  <Button asChild className="w-full">
                    <Link to={feature.link}>{feature.linkText}</Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}



      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Classrooms</h2>
            <p className="text-sm text-muted-foreground">
              Select a class to start recording attendance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate('/add-class')}>
              Create Class
            </Button>
          </div>
        </div>

        {sortedClassrooms.length === 0 && !loadingClasses ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            No classrooms yet. Create one to see it appear here.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  {role === 'teacher' && <TableHead className="w-[50px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedClassrooms.map((classroom) => (
                  <>
                    <TableRow key={classroom.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleExpand(classroom.id)}
                        >
                          {expandedClassId === classroom.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{classroom.name}</TableCell>
                      <TableCell>{classroom.description || 'No description'}</TableCell>
                      <TableCell className="text-right">
                        {(classroom.current_student_count ?? classroom.students.length)}/
                        {classroom.expected_student_count}
                      </TableCell>
                      {role === 'teacher' && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => handleDeleteClick(classroom.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                    {expandedClassId === classroom.id && (
                      <TableRow>
                        <TableCell colSpan={role === 'teacher' ? 5 : 4} className="bg-muted/50 p-4">
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm">Student Roster</h4>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {classroom.students.map((student) => (
                                <div
                                  key={`${classroom.id}-${student.roll_number}`}
                                  className="flex justify-between rounded-md border bg-background px-3 py-2 text-sm"
                                >
                                  <span className="font-medium">
                                    {student.roll_number}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {student.name}
                                  </span>
                                </div>
                              ))}
                              {classroom.students.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                  No students in this class.
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <Dialog open={!!classToDelete} onOpenChange={(open) => !open && setClassToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Classroom</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this classroom? This action cannot be undone
              and will remove all associated data including student roster.
              (Past attendance records on the blockchain remain immutable).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClassToDelete(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete} 
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

