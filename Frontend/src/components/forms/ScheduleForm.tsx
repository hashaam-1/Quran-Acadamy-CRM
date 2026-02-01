import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClassSchedule } from "@/lib/store";
import { useStudents } from "@/hooks/useStudents";
import { useTeachers } from "@/hooks/useTeachers";

interface ScheduleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (schedule: Omit<ClassSchedule, 'id'>) => void;
  initialData?: ClassSchedule;
  mode: 'add' | 'edit';
}

const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const durationOptions = ['30 min', '45 min', '60 min', '90 min'];
const courseOptions = ['Qaida', 'Nazra', 'Hifz', 'Tajweed'];
const statusOptions = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function ScheduleForm({ open, onOpenChange, onSubmit, initialData, mode }: ScheduleFormProps) {
  const { data: students = [] } = useStudents();
  const { data: teachers = [] } = useTeachers();
  
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    teacherName: '',
    teacherId: '',
    course: 'Qaida',
    time: '09:00 AM',
    duration: '30 min',
    status: 'scheduled' as ClassSchedule['status'],
    day: 'Monday',
  });

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        studentName: initialData.studentName,
        studentId: initialData.studentId,
        teacherName: initialData.teacherName,
        teacherId: initialData.teacherId,
        course: initialData.course,
        time: initialData.time,
        duration: initialData.duration,
        status: initialData.status,
        day: initialData.day,
      });
    } else {
      setFormData({
        studentName: '',
        studentId: '',
        teacherName: '',
        teacherId: '',
        course: 'Qaida',
        time: '09:00 AM',
        duration: '30 min',
        status: 'scheduled',
        day: 'Monday',
      });
    }
  }, [initialData, mode, open]);

  const handleStudentChange = (studentId: string) => {
    const student = students.find(s => ((s as any)._id || s.id) === studentId);
    if (student) {
      setFormData({
        ...formData,
        studentId,
        studentName: student.name,
        course: student.course,
      });
    }
  };

  const handleTeacherChange = (teacherId: string) => {
    const teacher = teachers.find(t => ((t as any)._id || t.id) === teacherId);
    if (teacher) {
      setFormData({
        ...formData,
        teacherId,
        teacherName: teacher.name,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Schedule New Class' : 'Edit Class Schedule'}</DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Create a new class schedule' : 'Update class schedule details'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto space-y-4 pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={formData.studentId} onValueChange={handleStudentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => {
                    const studentId = (student as any)._id || student.id;
                    return (
                      <SelectItem key={studentId} value={studentId}>{student.name}</SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Teacher</Label>
              <Select value={formData.teacherId} onValueChange={handleTeacherChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => {
                    const teacherId = (teacher as any)._id || teacher.id;
                    return (
                      <SelectItem key={teacherId} value={teacherId}>{teacher.name}</SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={formData.course} onValueChange={(v) => setFormData({ ...formData, course: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {courseOptions.map((course) => (
                    <SelectItem key={course} value={course}>{course}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Day</Label>
              <Select value={formData.day} onValueChange={(v) => setFormData({ ...formData, day: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dayOptions.map((day) => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                placeholder="09:00 AM"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={formData.duration} onValueChange={(v) => setFormData({ ...formData, duration: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((duration) => (
                    <SelectItem key={duration} value={duration}>{duration}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as ClassSchedule['status'] })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'add' ? 'Schedule Class' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
