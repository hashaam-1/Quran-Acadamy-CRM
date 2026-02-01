import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, TrendingUp, MessageSquare, BookOpen, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useStudents } from "@/hooks/useStudents";
import { useSchedules } from "@/hooks/useSchedules";
import { useAuthStore } from "@/lib/auth-store";

const statusConfig = {
  active: { label: "Active", color: "bg-info/10 text-info border-info/30" },
  needs_attention: { label: "Needs Attention", color: "bg-warning/10 text-warning border-warning/30" },
  excellent: { label: "Excellent", color: "bg-success/10 text-success border-success/30" },
  on_leave: { label: "On Leave", color: "bg-muted text-muted-foreground border-muted" },
  absent: { label: "Absent", color: "bg-destructive/10 text-destructive border-destructive/30" },
};

export function TeacherAssignedStudents() {
  const { currentUser } = useAuthStore();
  const { data: allStudents = [], isLoading: studentsLoading } = useStudents();
  const { data: allSchedules = [], isLoading: schedulesLoading } = useSchedules();

  const teacherId = currentUser?.id || (currentUser as any)?._id || (currentUser as any)?.teacherId;
  const teacherName = currentUser?.name;

  // Filter students assigned to this teacher
  const assignedStudents = allStudents.filter(student => {
    const studentTeacherId = typeof student.teacherId === 'object' && student.teacherId !== null
      ? (student.teacherId as any)._id || (student.teacherId as any).id
      : student.teacherId;
    return studentTeacherId === teacherId || student.teacher === teacherName;
  });

  // Get today's schedules for these students
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaySchedules = allSchedules.filter(schedule => {
    const scheduleTeacherId = typeof schedule.teacherId === 'object' && schedule.teacherId !== null
      ? (schedule.teacherId as any)._id || (schedule.teacherId as any).id
      : schedule.teacherId;
    return (scheduleTeacherId === teacherId || schedule.teacherName === teacherName) && schedule.day === today;
  });

  // Map students with their schedule info
  const studentsWithSchedules = assignedStudents.map(student => {
    const studentSchedule = todaySchedules.find(s => {
      const scheduleStudentId = typeof s.studentId === 'object' && s.studentId !== null
        ? (s.studentId as any)._id || (s.studentId as any).id
        : s.studentId;
      return scheduleStudentId === student.id || s.studentName === student.name;
    });

    return {
      id: student.id || student._id,
      name: student.name,
      course: student.course || 'N/A',
      progress: student.progress || 0,
      lastClass: 'Today',
      classTime: studentSchedule ? `${studentSchedule.time} (${studentSchedule.duration})` : 'No class today',
      status: student.status === 'inactive' ? 'on_leave' as const : 'active' as const,
    };
  });

  const onLeaveCount = studentsWithSchedules.filter(s => s.status === "on_leave").length;
  const absentCount = studentsWithSchedules.filter(s => s.status === "absent").length;
  const activeCount = studentsWithSchedules.filter(s => s.status === "active" || s.status === "excellent").length;

  if (studentsLoading || schedulesLoading) {
    return (
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-accent/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Assigned Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading students...</div>
        </CardContent>
      </Card>
    );
  }

  if (assignedStudents.length === 0) {
    return (
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-accent/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Assigned Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">No students assigned yet</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-accent/5 animate-slide-up">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
              <User className="h-4 w-4 text-accent-foreground" />
            </div>
            Assigned Students
          </CardTitle>
          <div className="flex gap-2">
            <Badge className="bg-success/15 text-success border-success/30">{activeCount} Active</Badge>
            <Badge className="bg-warning/15 text-warning border-warning/30">{onLeaveCount} Leave</Badge>
            <Badge className="bg-destructive/15 text-destructive border-destructive/30">{absentCount} Absent</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {studentsWithSchedules.map((student) => {
            const config = statusConfig[student.status];
            return (
              <div
                key={student.id}
                className={cn(
                  "p-4 rounded-xl border hover:shadow-md transition-all",
                  student.status === "absent" && "border-destructive/30 bg-destructive/5",
                  student.status === "on_leave" && "border-muted bg-muted/30"
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      student.status === "excellent" ? "bg-success/15" : "bg-primary/10"
                    )}>
                      <User className={cn(
                        "h-5 w-5",
                        student.status === "excellent" ? "text-success" : "text-primary"
                      )} />
                    </div>
                    <div>
                      <p className="font-semibold">{student.name}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {student.course}
                        </span>
                        <Badge className={cn("text-[10px]", config.color)} variant="secondary">
                          {config.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10">
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Class Time Badge */}
                <div className="flex items-center gap-2 mb-3 ml-13 pl-13">
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-info/10 border border-info/20">
                    <Clock className="h-3 w-3 text-info" />
                    <span className="text-xs font-medium text-info">{student.classTime}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span className="font-medium">{student.progress}%</span>
                  </div>
                  <Progress value={student.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">Last class: {student.lastClass}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
