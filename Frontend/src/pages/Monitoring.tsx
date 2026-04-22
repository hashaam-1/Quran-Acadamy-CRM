import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Video,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  TrendingUp,
  Eye,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { schedulesApi } from "@/lib/api/schedules";
import { ClassSchedule } from "@/lib/store";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import { format, isBefore, isAfter, addMinutes, parse } from "date-fns";

interface LiveClass {
  id: string;
  studentName: string;
  teacherName: string;
  course: string;
  startTime: string;
  duration: number;
  elapsed: number;
  status: "live" | "upcoming" | "ended" | "late";
  meetingNumber?: string;
  scheduleId: string;
}

interface ClassSummary {
  total: number;
  completed: number;
  ongoing: number;
  upcoming: number;
  missed: number;
  late: number;
}

interface TeacherPerformance {
  id: string;
  name: string;
  classesCompleted: number;
  totalClasses: number;
  onTimeRate: number;
  avgRating: number;
  status: "excellent" | "good" | "needs_improvement";
  liveClasses: number;
  upcomingClasses: number;
}

const statusConfig = {
  live: { label: "Live", variant: "success" as const, color: "bg-success animate-pulse" },
  upcoming: { label: "Upcoming", variant: "info" as const, color: "bg-info" },
  ended: { label: "Ended", variant: "secondary" as const, color: "bg-secondary" },
  late: { label: "Late", variant: "warning" as const, color: "bg-warning" },
};

const performanceConfig = {
  excellent: { label: "Excellent", variant: "success" as const },
  good: { label: "Good", variant: "info" as const },
  needs_improvement: { label: "Needs Improvement", variant: "warning" as const },
};

export default function Monitoring() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();

  // Fetch today's scheduled classes
  const { data: schedules = [], isLoading, refetch } = useQuery({
    queryKey: ['schedules'],
    queryFn: schedulesApi.getAll,
  });

  // Process schedules to get today's classes and calculate status
  const processSchedules = (schedules: ClassSchedule[]) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todaySchedules = schedules.filter(schedule => {
      // Check if schedule is for today based on day field AND date
      const scheduleDay = format(new Date(), 'EEEE').toLowerCase();
      const matchesDay = schedule.day.toLowerCase() === scheduleDay;
      
      // Also check if the schedule date is today (if date field exists)
      let matchesDate = true;
      if (schedule.date) {
        matchesDate = schedule.date === today;
      }
      
      return matchesDay && matchesDate;
    });

    const liveClasses: LiveClass[] = todaySchedules.map(schedule => {
      const now = new Date();
      const startTime = parse(schedule.time, 'HH:mm', new Date());
      const endTime = addMinutes(startTime, parseInt(schedule.duration) || 30);
      
      let status: "live" | "upcoming" | "ended" | "late" = "upcoming";
      let elapsed = 0;

      // Real-time status based on actual class time vs current time
      if (isBefore(now, startTime)) {
        // Class hasn't started yet
        status = "upcoming";
        elapsed = 0;
      } else if (isAfter(now, endTime)) {
        // Class has ended (regardless of schedule.status)
        status = "ended";
        elapsed = parseInt(schedule.duration) || 30;
      } else if (isBefore(now, endTime) && isAfter(now, startTime)) {
        // Class is currently in session time
        if (schedule.status === "in_progress" && schedule.meetingNumber) {
          status = "live";
          elapsed = Math.floor((now.getTime() - startTime.getTime()) / 60000);
        } else if (schedule.status === "completed") {
          status = "ended";
          elapsed = parseInt(schedule.duration) || 30;
        } else {
          // Should be live but hasn't started meeting
          status = "late";
          elapsed = 0;
        }
      } else {
        // Edge case - should be live
        status = "live";
        elapsed = Math.floor((now.getTime() - startTime.getTime()) / 60000);
      }

      return {
        id: schedule.id || (schedule as any)._id || '',
        studentName: schedule.studentName,
        teacherName: schedule.teacherName,
        course: schedule.course,
        startTime: schedule.time,
        duration: parseInt(schedule.duration) || 30,
        elapsed: Math.max(0, elapsed),
        status,
        meetingNumber: schedule.meetingNumber,
        scheduleId: schedule.id || (schedule as any)._id || '',
      };
    });

    // Calculate summary
    const summary: ClassSummary = {
      total: todaySchedules.length,
      completed: liveClasses.filter(c => c.status === 'ended').length,
      ongoing: liveClasses.filter(c => c.status === 'live').length,
      upcoming: liveClasses.filter(c => c.status === 'upcoming').length,
      missed: liveClasses.filter(c => c.status === 'late').length,
      late: liveClasses.filter(c => c.status === 'late').length,
    };

    // Calculate teacher performance
    const teacherMap = new Map<string, TeacherPerformance>();
    
    todaySchedules.forEach(schedule => {
      const teacherId = schedule.teacherId;
      const teacherName = schedule.teacherName;
      
      if (!teacherMap.has(teacherId)) {
        teacherMap.set(teacherId, {
          id: teacherId,
          name: teacherName,
          classesCompleted: 0,
          totalClasses: 0,
          onTimeRate: 0,
          avgRating: 4.5, // Mock rating for now
          status: "good",
          liveClasses: 0,
          upcomingClasses: 0,
        });
      }
      
      const teacher = teacherMap.get(teacherId)!;
      teacher.totalClasses++;
      
      if (schedule.status === 'completed' || (schedule.status as any) === 'ended') {
        teacher.classesCompleted++;
      }
    });

    // Calculate performance metrics for each teacher
    teacherMap.forEach(teacher => {
      const onTimeClasses = todaySchedules.filter(s => 
        s.teacherId === teacher.id && s.status !== 'completed'
      ).length;
      
      teacher.onTimeRate = teacher.totalClasses > 0 
        ? Math.round((teacher.classesCompleted / teacher.totalClasses) * 100)
        : 0;
      
      teacher.liveClasses = liveClasses.filter(c => 
        todaySchedules.find(s => s.id === c.scheduleId)?.teacherId === teacher.id && c.status === 'live'
      ).length;
      
      teacher.upcomingClasses = liveClasses.filter(c => 
        todaySchedules.find(s => s.id === c.scheduleId)?.teacherId === teacher.id && c.status === 'upcoming'
      ).length;
      
      if (teacher.onTimeRate >= 95) {
        teacher.status = "excellent";
      } else if (teacher.onTimeRate >= 80) {
        teacher.status = "good";
      } else {
        teacher.status = "needs_improvement";
      }
    });

    return { liveClasses, summary, teacherPerformance: Array.from(teacherMap.values()) };
  };

  const { liveClasses, summary, teacherPerformance } = processSchedules(schedules);

  // Handle observe button click - join or create zoom meeting
  const handleObserve = async (liveClass: LiveClass) => {
    try {
      let meetingToJoin = liveClass.meetingNumber;

      // If no meeting number exists, create one first
      if (!meetingToJoin && liveClass.scheduleId) {
        toast.loading('Creating meeting for observation...');
        
        const createResponse = await fetch('https://quran-acadamy-crm-production.up.railway.app/api/meetings/start-class', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            scheduleId: liveClass.scheduleId,
            className: liveClass.course,
            course: liveClass.course,
            teacherId: currentUser?.id,
            teacherName: currentUser?.name,
            studentId: liveClass.scheduleId, // Use scheduleId as fallback
            studentName: liveClass.studentName,
            time: liveClass.startTime
          })
        });

        const createData = await createResponse.json();

        if (createData.success) {
          meetingToJoin = createData.meeting.meetingNumber;
          toast.success('Meeting created for observation');
        } else {
          throw new Error(createData.error || createData.message || 'Failed to create meeting');
        }
      }

      if (!meetingToJoin) {
        throw new Error('No meeting number available');
      }

      // Join the meeting as observer (admin role = 1 for host privileges)
      const joinResponse = await fetch(`https://quran-acadamy-crm-production.up.railway.app/api/meetings/join/${meetingToJoin}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (joinResponse.ok) {
        toast.success('Joining class as observer');
        navigate(`/zoom-join?meetingNumber=${meetingToJoin}&role=1`);
      } else {
        const data = await joinResponse.json();
        throw new Error(data.error || data.message || 'Failed to join class');
      }
    } catch (error) {
      console.error('Error observing class:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to observe class';
      toast.error(errorMessage);
    }
  };

  return (
    <MainLayout title="Class Monitoring" subtitle="Live class tracking and supervision">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card variant="stat" className="animate-slide-up stagger-1">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{summary.total}</p>
            <p className="text-xs text-muted-foreground">Total Today</p>
          </CardContent>
        </Card>
        <Card variant="stat" className="animate-slide-up stagger-2">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{summary.completed}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card variant="stat" className="animate-slide-up stagger-3">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-info">{summary.ongoing}</p>
            <p className="text-xs text-muted-foreground">Live</p>
          </CardContent>
        </Card>
        <Card variant="stat" className="animate-slide-up stagger-4">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{summary.upcoming}</p>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
        <Card variant="stat" className="animate-slide-up stagger-5">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">{summary.late}</p>
            <p className="text-xs text-muted-foreground">Late</p>
          </CardContent>
        </Card>
        <Card variant="stat" className="animate-slide-up stagger-5">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{summary.missed}</p>
            <p className="text-xs text-muted-foreground">Missed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Classes */}
        <Card className="animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Today's Classes
            </CardTitle>
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : liveClasses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No classes scheduled for today
              </div>
            ) : (
              liveClasses.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "p-4 rounded-lg border transition-all",
                    session.status === "late" && "bg-warning/5 border-warning/20",
                    session.status === "live" && "bg-success/5 border-success/20",
                    session.status === "upcoming" && "bg-info/5 border-info/20",
                    session.status === "ended" && "bg-secondary/5 border-secondary/20"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Video className="h-5 w-5 text-primary" />
                        </div>
                        <span className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
                          statusConfig[session.status].color
                        )} />
                      </div>
                      <div>
                        <p className="font-medium">{session.studentName}</p>
                        <p className="text-sm text-muted-foreground">{session.teacherName}</p>
                      </div>
                    </div>
                    <Badge variant={statusConfig[session.status].variant}>
                      {statusConfig[session.status].label}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>{session.course}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {session.startTime}
                    </span>
                  </div>

                  {session.status === "live" && (
                    <Progress 
                      value={Math.min((session.elapsed / session.duration) * 100, 100)} 
                      className="h-2 mb-3"
                    />
                  )}

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-1"
                      onClick={() => handleObserve(session)}
                    >
                      <Eye className="h-3 w-3" />
                      Observe
                    </Button>
                    {session.status === "late" && (
                      <Button variant="outline" size="sm" className="text-warning">
                        <AlertTriangle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Teacher Performance */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Teacher Performance Today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : teacherPerformance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No teacher data available
              </div>
            ) : (
              teacherPerformance.map((teacher) => (
                <div
                  key={teacher.id}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                        {teacher.name.split(" ").slice(1).map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-medium">{teacher.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {teacher.classesCompleted}/{teacher.totalClasses} classes
                        </p>
                      </div>
                    </div>
                    <Badge variant={performanceConfig[teacher.status].variant}>
                      {performanceConfig[teacher.status].label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">On-Time Rate</p>
                      <div className="flex items-center gap-2">
                        <Progress value={teacher.onTimeRate} className="h-2 flex-1" />
                        <span className="font-medium">{teacher.onTimeRate}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Live/Upcoming</p>
                      <p className="font-medium">
                        {teacher.liveClasses} / {teacher.upcomingClasses}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {liveClasses.filter(c => c.status === 'late').length > 0 && (
        <Card className="mt-6 animate-slide-up border-warning/50 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {liveClasses.filter(c => c.status === 'late').map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-card border">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="font-medium">Class Not Started</p>
                      <p className="text-sm text-muted-foreground">
                        {session.studentName}'s class with {session.teacherName} is late
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Take Action
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </MainLayout>
  );
}
