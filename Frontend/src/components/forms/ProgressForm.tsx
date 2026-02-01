import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCRMStore } from "@/lib/store";
import { toast } from "sonner";

interface ProgressFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProgressForm({ open, onOpenChange }: ProgressFormProps) {
  const { students, addProgressRecord } = useCRMStore();
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    lesson: '',
    sabqi: '',
    manzil: '',
    notes: '',
    completion: 50,
  });

  const handleStudentChange = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setFormData({ ...formData, studentId, studentName: student.name });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId) {
      toast.error("Please select a student");
      return;
    }
    addProgressRecord({
      ...formData,
      date: new Date().toISOString().split('T')[0],
    });
    toast.success("Progress updated successfully");
    onOpenChange(false);
    setFormData({
      studentId: '',
      studentName: '',
      lesson: '',
      sabqi: '',
      manzil: '',
      notes: '',
      completion: 50,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Update Progress</DialogTitle>
          <DialogDescription>Record student's lesson progress</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Student</Label>
            <Select value={formData.studentId} onValueChange={handleStudentChange}>
              <SelectTrigger><SelectValue placeholder="Select Student" /></SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lesson">Today's Lesson</Label>
            <Input id="lesson" value={formData.lesson} onChange={(e) => setFormData({ ...formData, lesson: e.target.value })} placeholder="e.g., Surah Al-Baqarah (Ayah 1-5)" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sabqi">Sabqi Status</Label>
              <Select value={formData.sabqi} onValueChange={(value) => setFormData({ ...formData, sabqi: value })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Needs Review">Needs Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manzil">Manzil</Label>
              <Input id="manzil" value={formData.manzil} onChange={(e) => setFormData({ ...formData, manzil: e.target.value })} placeholder="e.g., Juz 1" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Completion: {formData.completion}%</Label>
            <Slider value={[formData.completion]} onValueChange={(value) => setFormData({ ...formData, completion: value[0] })} max={100} step={5} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Add notes about student's progress..." rows={2} />
          </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Update Progress</Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
