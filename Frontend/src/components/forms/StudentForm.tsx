import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTeachers } from "@/hooks/useTeachers";
import { useCRMStore, Student } from "@/lib/store";

interface StudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (student: Omit<Student, 'id'>) => void;
  initialData?: Student;
  mode: 'add' | 'edit';
}

const courseOptions = ['Qaida', 'Nazra', 'Hifz', 'Tajweed'];
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on_hold', label: 'On Hold' },
];

export function StudentForm({ open, onOpenChange, onSubmit, initialData, mode }: StudentFormProps) {
  const { data: teachers, isLoading: teachersLoading } = useTeachers();
  
  const [formData, setFormData] = useState({
    name: '',
    age: 0,
    country: '',
    timezone: '',
    course: 'Qaida',
    teacher: '',
    teacherId: '',
    schedule: '',
    progress: 0,
    status: 'active' as Student['status'],
    joinedAt: new Date().toISOString().split('T')[0],
    feeAmount: 100,
  });

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        name: initialData.name,
        age: initialData.age,
        country: initialData.country,
        timezone: initialData.timezone,
        course: initialData.course,
        teacher: initialData.teacher,
        teacherId: initialData.teacherId,
        schedule: initialData.schedule,
        progress: initialData.progress,
        status: initialData.status,
        joinedAt: initialData.joinedAt,
        feeAmount: initialData.feeAmount || 100,
      });
    } else {
      setFormData({
        name: '',
        age: 0,
        country: '',
        timezone: '',
        course: 'Qaida',
        teacher: '',
        teacherId: '',
        schedule: '',
        progress: 0,
        status: 'active',
        joinedAt: new Date().toISOString().split('T')[0],
        feeAmount: 100,
      });
    }
  }, [initialData, mode, open]);

  const handleTeacherChange = (teacher: string) => {
    setFormData({ ...formData, teacher });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Student' : 'Edit Student'}</DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Register a new student' : 'Update student information'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" value={formData.timezone} onChange={(e) => setFormData({ ...formData, timezone: e.target.value })} placeholder="e.g., GMT+5" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={formData.course} onValueChange={(value) => setFormData({ ...formData, course: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {courseOptions.map((course) => (
                    <SelectItem key={course} value={course}>{course}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Teacher</Label>
              <Select value={formData.teacher} onValueChange={handleTeacherChange} disabled={teachersLoading}>
                <SelectTrigger><SelectValue placeholder={teachersLoading ? "Loading teachers..." : "Select teacher"} /></SelectTrigger>
                <SelectContent>
                  {teachers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">No teachers found</div>
                  ) : (
                    teachers.map((teacher) => (
                      <SelectItem key={teacher.id || teacher._id} value={teacher.name}>{teacher.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schedule">Schedule</Label>
              <Input id="schedule" value={formData.schedule} onChange={(e) => setFormData({ ...formData, schedule: e.target.value })} placeholder="e.g., Mon, Wed, Fri - 4:00 PM" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feeAmount">Monthly Fee ($)</Label>
              <Input id="feeAmount" type="number" value={formData.feeAmount} onChange={(e) => setFormData({ ...formData, feeAmount: parseInt(e.target.value) })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(value: Student['status']) => setFormData({ ...formData, status: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{mode === 'add' ? 'Add Student' : 'Save Changes'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
