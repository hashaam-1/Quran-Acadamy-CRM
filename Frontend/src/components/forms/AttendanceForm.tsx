import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSchedules } from "@/hooks/useSchedules";
import { useStudents } from "@/hooks/useStudents";
import { useMarkAttendance } from "@/hooks/useAttendance";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface AttendanceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const attendanceStatus = [
  { value: 'present', label: 'Present', icon: CheckCircle2, color: 'text-success' },
  { value: 'absent', label: 'Absent', icon: XCircle, color: 'text-destructive' },
  { value: 'late', label: 'Late', icon: Clock, color: 'text-warning' },
];

export function AttendanceForm({ open, onOpenChange }: AttendanceFormProps) {
  const { data: schedules = [], isLoading: schedulesLoading } = useSchedules();
  const { data: students = [] } = useStudents();
  const markAttendance = useMarkAttendance();
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [status, setStatus] = useState('present');
  const [notes, setNotes] = useState('');

  // Get today's day
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  const currentDay = daysOfWeek[today.getDay()];
  
  const todaySchedules = schedules.filter(s => 
    s.day === currentDay && (s.status === 'scheduled' || s.status === 'in_progress')
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule) {
      toast.error("Please select a class");
      return;
    }
    
    const schedule = schedules.find(s => (s.id || s._id) === selectedSchedule);
    if (!schedule) {
      toast.error("Schedule not found");
      return;
    }
    
    try {
      await markAttendance.mutateAsync({
        studentId: schedule.studentId,
        status,
        classTime: schedule.time,
        course: schedule.course,
        scheduleId: selectedSchedule,
      });
      
      toast.success(`Attendance marked as ${status} for ${schedule.studentName}`);
      onOpenChange(false);
      setSelectedSchedule('');
      setStatus('present');
      setNotes('');
    } catch (error) {
      toast.error("Failed to mark attendance");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Mark Attendance</DialogTitle>
          <DialogDescription>Record student attendance for today's class</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Class</Label>
            <Select value={selectedSchedule} onValueChange={setSelectedSchedule} disabled={schedulesLoading}>
              <SelectTrigger>
                <SelectValue placeholder={schedulesLoading ? "Loading classes..." : "Choose a class"} />
              </SelectTrigger>
              <SelectContent>
                {todaySchedules.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No classes scheduled for today ({currentDay})
                  </div>
                ) : (
                  todaySchedules.map((schedule) => (
                    <SelectItem key={schedule.id || schedule._id} value={schedule.id || schedule._id}>
                      {schedule.studentName} - {schedule.course} ({schedule.time})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Attendance Status</Label>
            <div className="grid grid-cols-3 gap-2">
              {attendanceStatus.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={status === option.value ? "default" : "outline"}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  onClick={() => setStatus(option.value)}
                >
                  <option.icon className={`h-5 w-5 ${status === option.value ? '' : option.color}`} />
                  <span className="text-xs">{option.label}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this attendance..."
              rows={2}
            />
          </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Mark Attendance</Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
