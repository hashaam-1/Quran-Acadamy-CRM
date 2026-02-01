import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCRMStore } from "@/lib/store";
import { toast } from "sonner";
import { Calendar } from "lucide-react";

interface RescheduleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function RescheduleForm({ open, onOpenChange }: RescheduleFormProps) {
  const { schedules, requestReschedule } = useCRMStore();
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [newDay, setNewDay] = useState('');
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');

  const activeSchedules = schedules.filter(s => s.status === 'scheduled');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule || !newDay || !newTime) {
      toast.error("Please fill all required fields");
      return;
    }
    requestReschedule(selectedSchedule, {
      requestedBy: 'Teacher',
      newTime,
      newDay,
      status: 'pending',
    });
    toast.success("Reschedule request submitted");
    onOpenChange(false);
    setSelectedSchedule('');
    setNewDay('');
    setNewTime('');
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Request Reschedule
          </DialogTitle>
          <DialogDescription>Request to reschedule a class</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Class</Label>
            <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
              <SelectTrigger><SelectValue placeholder="Choose a class" /></SelectTrigger>
              <SelectContent>
                {activeSchedules.map((schedule) => (
                  <SelectItem key={schedule.id} value={schedule.id}>
                    {schedule.studentName} - {schedule.day} {schedule.time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>New Day</Label>
              <Select value={newDay} onValueChange={setNewDay}>
                <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                <SelectContent>
                  {dayOptions.map((day) => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newTime">New Time</Label>
              <Input id="newTime" type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why do you need to reschedule?" rows={2} />
          </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Submit Request</Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
