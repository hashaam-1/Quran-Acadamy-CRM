import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, XCircle, Clock, User, AlertTriangle, Volume2, VolumeX, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { useStudentsForAttendance } from "@/hooks/useAttendance";
import { useSchedules } from "@/hooks/useSchedules";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AttendanceRecord {
  id: string;
  teacherName: string;
  studentName: string;
  course: string;
  time: string;
  status: "marked" | "pending" | "missed";
  markedAt?: string;
}

const statusConfig = {
  marked: { 
    label: "Marked", 
    icon: CheckCircle, 
    color: "bg-success/15 text-success border-success/30",
    iconColor: "text-success"
  },
  pending: { 
    label: "Pending", 
    icon: Clock, 
    color: "bg-warning/15 text-warning border-warning/30",
    iconColor: "text-warning"
  },
  missed: { 
    label: "Missed", 
    icon: XCircle, 
    color: "bg-destructive/15 text-destructive border-destructive/30",
    iconColor: "text-destructive"
  },
};

export function AttendanceAlertCard() {
  const [showAlertPopup, setShowAlertPopup] = useState(false);
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [hasShownInitialAlert, setHasShownInitialAlert] = useState(false);
  const { currentUser } = useAuthStore();
  
  // Get today's date for filtering
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch students for current teacher and schedules
  const { data: teacherStudents = [] } = useStudentsForAttendance(
    currentUser?.id || '',
    today
  );
  const { data: schedules = [] } = useSchedules();
  
  // Function to determine attendance status based on class time
  const getAttendanceStatus = (student: any) => {
    // If attendance is already marked, return that status
    if (student.attendanceStatus && student.attendanceStatus !== 'not_marked') {
      return 'marked';
    }
    
    // Find today's scheduled class for this student
    const todayClass = schedules.find((s: any) => 
      s.studentId === student._id || s.studentId?._id === student._id
    );
    
    if (!todayClass) {
      return 'no_class';
    }
    
    // Check if class time has passed
    const now = new Date();
    const classTime = todayClass.time;
    
    try {
      const [time, period] = classTime.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      const classDateTime = new Date();
      classDateTime.setHours(hours, minutes, 0, 0);
      
      // Add 30 minutes buffer for class duration
      const classEndTime = new Date(classDateTime.getTime() + 30 * 60 * 1000);
      
      if (now > classEndTime) {
        return 'pending'; // Class time has passed, attendance is pending
      } else {
        return 'not_marked'; // Class time hasn't passed yet
      }
    } catch (error) {
      return 'not_marked';
    }
  };
  
  // Get current day
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = daysOfWeek[new Date().getDay()];
  
  // Filter schedules for today only
  const todaySchedules = schedules.filter((s: any) => s.day === currentDay && s.status === 'scheduled');
  
  // Transform API data to attendance records - ONLY PENDING ONES
  const attendanceRecords: AttendanceRecord[] = teacherStudents
    .filter((student: any) => {
      // Only show students with classes today
      const todayClass = todaySchedules.find((s: any) => 
        (s.studentId === student._id || s.studentId?._id === student._id) &&
        (s.teacherId === currentUser?.id || s.teacherId?._id === currentUser?.id || s.teacherName === currentUser?.name)
      );
      
      if (!todayClass) return false;
      
      // Only include if attendance is pending
      const attendanceStatus = getAttendanceStatus(student);
      return attendanceStatus === 'pending';
    })
    .map((student: any) => {
      const todayClass = todaySchedules.find((s: any) => 
        s.studentId === student._id || s.studentId?._id === student._id
      );
      
      return {
        id: student._id,
        teacherName: currentUser?.name || 'Teacher',
        studentName: student.name,
        course: todayClass?.course || student.course || 'N/A',
        time: todayClass?.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: 'pending' as const,
        markedAt: student.checkInTime || undefined,
      };
    });

  const pendingCount = attendanceRecords.length;
  
  // All records are pending
  const pendingRecords = attendanceRecords;

  // Show alert popup only for pending attendance
  useEffect(() => {
    if (pendingCount > 0 && !hasShownInitialAlert && alarmEnabled) {
      const timer = setTimeout(() => {
        setShowAlertPopup(true);
        setHasShownInitialAlert(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [pendingCount, hasShownInitialAlert, alarmEnabled]);

  return (
    <>
      {/* Alert Popup Dialog */}
      <Dialog open={showAlertPopup} onOpenChange={setShowAlertPopup}>
        <DialogContent className="sm:max-w-md border-warning/50 bg-gradient-to-br from-card via-card to-warning/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-warning">
              <div className="h-12 w-12 rounded-xl bg-warning/20 flex items-center justify-center animate-pulse">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <span className="text-xl">Attendance Alert!</span>
                <p className="text-sm text-muted-foreground font-normal">{pendingCount} classes pending attendance</p>
              </div>
            </DialogTitle>
            <DialogDescription asChild>
              <div className="pt-4 space-y-3">
                {pendingRecords.map((record) => {
                  const config = statusConfig[record.status];
                  const StatusIcon = config.icon;
                  
                  return (
                    <div
                      key={record.id}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all",
                        record.status === "pending" && "border-warning/50 bg-warning/10 animate-pulse",
                        record.status === "missed" && "border-destructive/50 bg-destructive/10"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center",
                            record.status === "pending" && "bg-warning/20",
                            record.status === "missed" && "bg-destructive/20"
                          )}>
                            <StatusIcon className={cn("h-5 w-5", config.iconColor)} />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{record.teacherName}</p>
                            <p className="text-sm text-muted-foreground">{record.studentName} • {record.course} • {record.time}</p>
                          </div>
                        </div>
                        <Badge className={cn("text-xs", config.color)}>
                          {config.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                
                <Button 
                  className="w-full mt-4 bg-gradient-to-r from-warning to-amber-500 text-white hover:from-warning/90 hover:to-amber-500/90"
                  onClick={() => setShowAlertPopup(false)}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Acknowledge & Mark Attendance
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-warning/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-warning/20 to-warning/10 flex items-center justify-center">
                <Bell className="h-4 w-4 text-warning" />
              </div>
              Attendance Status
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setAlarmEnabled(!alarmEnabled)}
              >
                {alarmEnabled ? (
                  <Volume2 className="h-4 w-4 text-warning" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              {pendingCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-warning/50 text-warning hover:bg-warning/10"
                  onClick={() => setShowAlertPopup(true)}
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {pendingCount} Pending
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Only show pending/missed in the card for emphasis */}
            {pendingRecords.length > 0 ? (
              pendingRecords.map((record) => {
                const config = statusConfig[record.status];
                const StatusIcon = config.icon;
                
                return (
                  <div
                    key={record.id}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all hover:shadow-sm",
                      record.status === "pending" && "border-warning/50 bg-warning/5",
                      record.status === "missed" && "border-destructive/50 bg-destructive/5"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center",
                          record.status === "pending" && "bg-warning/15",
                          record.status === "missed" && "bg-destructive/15"
                        )}>
                          <StatusIcon className={cn("h-5 w-5", config.iconColor)} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{record.teacherName}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{record.studentName}</span>
                            <span>•</span>
                            <span>{record.course}</span>
                            <span>•</span>
                            <span>{record.time}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={cn("text-[10px]", config.color)}>
                        {config.label}
                      </Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center rounded-xl bg-success/10 border border-success/20">
                <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="font-medium text-success">All Attendance Marked!</p>
                <p className="text-sm text-muted-foreground">No pending attendance to mark</p>
              </div>
            )}
          </div>
          
          {/* Summary Footer - Only show pending count */}
          {pendingCount > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20 text-center">
              <p className="text-2xl font-bold text-warning">{pendingCount}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Pending Attendance</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
