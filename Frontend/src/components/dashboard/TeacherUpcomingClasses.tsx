import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, BookOpen, Bell, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface UpcomingClass {
  id: string;
  studentName: string;
  course: string;
  time: string;
  duration: string;
  status: "upcoming" | "starting_soon" | "in_progress";
  attendanceMarked: boolean;
}

const upcomingClasses: UpcomingClass[] = [
  { id: "1", studentName: "Ahmed Ali", course: "Quran Hifz", time: "10:30 AM", duration: "45 min", status: "starting_soon", attendanceMarked: false },
  { id: "2", studentName: "Fatima Khan", course: "Tajweed", time: "12:00 PM", duration: "30 min", status: "upcoming", attendanceMarked: false },
  { id: "3", studentName: "Omar Hassan", course: "Nazra", time: "02:00 PM", duration: "45 min", status: "upcoming", attendanceMarked: false },
  { id: "4", studentName: "Aisha Rahman", course: "Quran Hifz", time: "03:30 PM", duration: "60 min", status: "upcoming", attendanceMarked: false },
];

const statusConfig = {
  upcoming: { label: "Upcoming", color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  starting_soon: { label: "Starting Soon", color: "bg-warning/15 text-warning border-warning/30", dot: "bg-warning animate-pulse" },
  in_progress: { label: "In Progress", color: "bg-success/15 text-success", dot: "bg-success" },
};

export function TeacherUpcomingClasses() {
  const [classes, setClasses] = useState(upcomingClasses);
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState<UpcomingClass | null>(null);
  const [isPresent, setIsPresent] = useState(true);

  const handleMarkAttendance = (classItem: UpcomingClass) => {
    setSelectedClass(classItem);
    setShowAttendanceDialog(true);
  };

  const confirmAttendance = () => {
    if (selectedClass) {
      setClasses(classes.map(c => 
        c.id === selectedClass.id ? { ...c, attendanceMarked: true } : c
      ));
      toast.success(
        `Attendance marked for ${selectedClass.studentName}`,
        { description: `Status: ${isPresent ? "Present" : "Absent"}` }
      );
      setShowAttendanceDialog(false);
      setSelectedClass(null);
    }
  };

  return (
    <>
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-info/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-info/20 to-info/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-info" />
              </div>
              Upcoming Classes
            </CardTitle>
            <Badge variant="outline" className="bg-info/10 text-info border-info/30">
              {classes.length} classes
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {classes.map((classItem) => {
              const config = statusConfig[classItem.status];
              return (
                <div
                  key={classItem.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all hover:shadow-md",
                    classItem.status === "starting_soon" && "border-warning/40 bg-gradient-to-r from-warning/5 to-transparent"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <span className="font-semibold">{classItem.studentName}</span>
                          <div className="flex items-center gap-1">
                            <div className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
                            <Badge className={cn("text-[10px] h-5", config.color)} variant="secondary">
                              {config.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground ml-10">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {classItem.time} ({classItem.duration})
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {classItem.course}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {classItem.status === "starting_soon" && !classItem.attendanceMarked && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="gap-1 border-warning/50 text-warning hover:bg-warning/10"
                          onClick={() => handleMarkAttendance(classItem)}
                        >
                          <Bell className="h-3 w-3" />
                          Mark
                        </Button>
                      )}
                      {classItem.attendanceMarked && (
                        <Badge className="bg-success/15 text-success border-success/30 gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Marked
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAttendanceDialog} onOpenChange={setShowAttendanceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-warning/15 flex items-center justify-center">
                <Bell className="h-5 w-5 text-warning animate-pulse" />
              </div>
              Mark Attendance
            </DialogTitle>
            <DialogDescription>
              Confirm attendance for {selectedClass?.studentName}'s {selectedClass?.course} class
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Student</span>
                <span className="font-medium">{selectedClass?.studentName}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Class Time</span>
                <span className="font-medium">{selectedClass?.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Course</span>
                <span className="font-medium">{selectedClass?.course}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 rounded-lg border">
              <Checkbox 
                id="present" 
                checked={isPresent}
                onCheckedChange={(checked) => setIsPresent(checked as boolean)}
              />
              <label htmlFor="present" className="text-sm font-medium cursor-pointer flex-1">
                Student is Present
              </label>
              {!isPresent && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Absent
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAttendanceDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={confirmAttendance} className="flex-1 gap-1">
              <CheckCircle className="h-4 w-4" />
              Confirm Attendance
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
