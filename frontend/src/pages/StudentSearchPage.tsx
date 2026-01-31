import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Loader2, Search, User, Calendar, BookOpen, GraduationCap, FileSearch } from "lucide-react";
import { useStudentSearch } from "@/queries";
import { EmptyState } from "@/components/ui/empty-state";
import { getErrorMessage } from "@/helpers/error-messages";

const SEARCH_DEBOUNCE_MS = 400;

export default function StudentSearchPage() {
  const { toast } = useToast();
  const [rollNo, setRollNo] = useState("");
  const debouncedRollNo = useDebouncedValue(rollNo.trim(), SEARCH_DEBOUNCE_MS);
  const { data: result, isLoading: loading, isError, error, refetch } = useStudentSearch(debouncedRollNo);

  useEffect(() => {
    if (
      result &&
      debouncedRollNo &&
      result.roll_no.toLowerCase() === debouncedRollNo.toLowerCase()
    ) {
      if (result.total_records === 0) {
        toast({
          title: "No Results",
          description: `No attendance records found for roll number ${debouncedRollNo}`,
        });
      } else {
        toast({
          title: "Success",
          description: `Found ${result.total_records} attendance record(s) for ${debouncedRollNo}`,
        });
      }
    }
  }, [result?.roll_no, result?.total_records, debouncedRollNo, toast]);

  useEffect(() => {
    if (isError && error) {
      const { title, description } = getErrorMessage(error, "search");
      toast({ title, description, variant: "destructive" });
    }
  }, [isError, error, toast]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNo.trim()) {
      toast({
        title: "Error",
        description: "Please enter a roll number",
        variant: "destructive",
      });
      return;
    }
    refetch();
  };

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
            Enter a roll number — results update after you pause typing, or click Search for immediate results.
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
              <EmptyState
                icon={FileSearch}
                title="No records for this roll number"
                description="No attendance entries found. Check the roll number or try another student."
                variant="compact"
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

