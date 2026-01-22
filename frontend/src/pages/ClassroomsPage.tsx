import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiService, Classroom } from "@/services/api";

export default function ClassroomsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const [classToDelete, setClassToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedClassId((prev) => (prev === id ? null : id));
  };

  const fetchClassrooms = useCallback(async () => {
    setLoadingClasses(true);
    try {
      const data = await apiService.listClassrooms();
      setClassrooms(data);
    } catch (error: any) {
      toast({
        title: "Failed to load classes",
        description: error?.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoadingClasses(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  const handleDeleteClick = (classId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setClassToDelete(classId);
  };

  const confirmDelete = async () => {
    if (!classToDelete) return;

    setIsDeleting(true);
    try {
      await apiService.deleteClassroom(classToDelete);
      toast({
        title: "Class deleted",
        description: "The classroom has been successfully deleted.",
      });
      fetchClassrooms();
      setClassToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error deleting class",
        description: error?.message || "Failed to delete class",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const sortedClassrooms = useMemo(() => {
    return [...classrooms].sort((a, b) => {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [classrooms]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Classrooms</h1>
          <p className="text-sm text-muted-foreground">
            Manage your classrooms and student rosters.
          </p>
        </div>
        <Button onClick={() => navigate("/add-class")}>Create Class</Button>
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
                <TableHead className="w-[50px]"></TableHead>
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
                    <TableCell className="font-medium">
                      {classroom.name}
                    </TableCell>
                    <TableCell>
                      {classroom.description || "No description"}
                    </TableCell>
                    <TableCell className="text-right">
                      {classroom.current_student_count ??
                        classroom.students.length}
                      /{classroom.expected_student_count}
                    </TableCell>
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
                  </TableRow>
                  {expandedClassId === classroom.id && (
                    <TableRow>
                      <TableCell colSpan={5} className="bg-muted/50 p-4">
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">
                            Student Roster
                          </h4>
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

      <Dialog
        open={!!classToDelete}
        onOpenChange={(open) => !open && setClassToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Classroom</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this classroom? This action cannot
              be undone and will remove all associated data including student
              roster. (Past attendance records on the blockchain remain
              immutable).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClassToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
