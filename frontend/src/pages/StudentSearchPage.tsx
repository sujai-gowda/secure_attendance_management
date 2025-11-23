import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Search, User, Calendar, BookOpen, GraduationCap } from 'lucide-react'
import { apiService, type StudentSearchResult } from '@/services/api'

export default function StudentSearchPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [rollNo, setRollNo] = useState('')
  const [result, setResult] = useState<StudentSearchResult | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!rollNo.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a roll number',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const data = await apiService.searchStudent(rollNo.trim())
      setResult(data)
      
      if (data.total_records === 0) {
        toast({
          title: 'No Results',
          description: `No attendance records found for roll number ${rollNo.trim()}`,
        })
      } else {
        toast({
          title: 'Success',
          description: `Found ${data.total_records} attendance record(s) for ${rollNo.trim()}`,
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to search student records. Please try again.',
        variant: 'destructive',
      })
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Student Search</h1>
        <p className="text-muted-foreground mt-2">
          Search for attendance records by student roll number
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search by Roll Number</CardTitle>
          <CardDescription>
            Enter a student roll number to view all their attendance records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <Label htmlFor="rollNo">Roll Number</Label>
              <Input
                id="rollNo"
                type="text"
                placeholder="Enter roll number (e.g., 1, 2, 3)"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Results for Roll Number: {result.roll_no}
            </CardTitle>
            <CardDescription>
              Found {result.total_records} attendance record(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result.records.length > 0 ? (
              <div className="space-y-4">
                {result.records.map((record, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Date</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(record.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Course</p>
                          <p className="text-sm text-muted-foreground">{record.course}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Teacher</p>
                          <p className="text-sm text-muted-foreground">{record.teacher_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Year</p>
                          <p className="text-sm text-muted-foreground">{record.year}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No attendance records found for this roll number
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

