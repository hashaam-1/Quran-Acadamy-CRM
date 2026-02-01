import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useStudents } from "@/hooks/useStudents";
import { useCreateHomework } from "@/hooks/useHomework";
import { toast } from "sonner";

interface HomeworkFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HomeworkForm({ open, onOpenChange }: HomeworkFormProps) {
  const { data: students, isLoading: studentsLoading } = useStudents();
  const createHomework = useCreateHomework();
  const [formData, setFormData] = useState({
    studentId: '',
    title: '',
    description: '',
    dueDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.title) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await createHomework.mutateAsync(formData);
      toast.success("Homework assigned successfully!");
      onOpenChange(false);
      setFormData({
        studentId: '',
        title: '',
        description: '',
        dueDate: '',
      });
    } catch (error) {
      toast.error("Failed to assign homework");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Homework</DialogTitle>
          <DialogDescription>Assign homework to a student</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto space-y-4 pr-1">
          <div className="space-y-2">
            <Label>Student</Label>
            <Select value={formData.studentId} onValueChange={(value) => setFormData({ ...formData, studentId: value })} disabled={studentsLoading}>
              <SelectTrigger><SelectValue placeholder={studentsLoading ? "Loading students..." : "Select student"} /></SelectTrigger>
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
            <Label htmlFor="title">Homework Title</Label>
            <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Memorize Surah Al-Fatiha" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Detailed instructions for the homework..." rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input id="dueDate" type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Assign Homework</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
