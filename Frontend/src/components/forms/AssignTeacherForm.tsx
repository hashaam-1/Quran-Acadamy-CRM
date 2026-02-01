import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStudents, useUpdateStudent } from "@/hooks/useStudents";
import { useTeachers } from "@/hooks/useTeachers";
import { toast } from "sonner";
import { Users } from "lucide-react";

interface AssignTeacherFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignTeacherForm({ open, onOpenChange }: AssignTeacherFormProps) {
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: teachers = [], isLoading: teachersLoading } = useTeachers();
  const updateStudentMutation = useUpdateStudent();
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');

  const availableTeachers = teachers.filter(t => t.status !== 'on_leave');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedTeacher) {
      toast.error("Please select both student and teacher");
      return;
    }
    
    const student = students.find(s => (s.id || s._id) === selectedStudent);
    const teacher = teachers.find(t => (t.id || t._id) === selectedTeacher);
    
    if (student && teacher) {
      try {
        await updateStudentMutation.mutateAsync({
          id: selectedStudent,
          data: { teacherId: teacher.id || teacher._id, teacher: teacher.name }
        });
        toast.success(`${teacher.name} assigned to ${student.name}`);
        onOpenChange(false);
        setSelectedStudent('');
        setSelectedTeacher('');
      } catch (error) {
        toast.error("Failed to assign teacher");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-info" />
            Assign Teacher
          </DialogTitle>
          <DialogDescription>Assign a teacher to a student</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto space-y-4 pr-1">
          <div className="space-y-2">
            <Label>Select Student</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent} disabled={studentsLoading}>
              <SelectTrigger><SelectValue placeholder={studentsLoading ? "Loading students..." : "Choose student"} /></SelectTrigger>
              <SelectContent>
                {students.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">No students found</div>
                ) : (
                  students.map((student) => (
                    <SelectItem key={student.id || student._id} value={student.id || student._id}>{student.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Select Teacher</Label>
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher} disabled={teachersLoading}>
              <SelectTrigger><SelectValue placeholder={teachersLoading ? "Loading teachers..." : "Choose teacher"} /></SelectTrigger>
              <SelectContent>
                {teachers.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">No teachers found</div>
                ) : (
                  teachers.map((teacher) => (
                    <SelectItem key={teacher.id || teacher._id} value={teacher.id || teacher._id}>{teacher.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Assign Teacher</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
