import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Video, User, BookOpen } from "lucide-react";
import { useSchedules } from "@/hooks/useSchedules";
import { useAuthStore } from "@/lib/auth-store";

export function StudentUpcomingClasses() {
  const { currentUser } = useAuthStore();
  const { data: schedules = [], isLoading } = useSchedules();
  
  // Filter schedules for current student
  const currentStudentId = currentUser?.id || (currentUser as any)?._id || (currentUser as any)?.studentId;
  const studentSchedules = schedules.filter(s => {
    const scheduleStudentId = typeof s.studentId === 'object' && s.studentId !== null 
      ? (s.studentId as any)._id || (s.studentId as any).id
      : s.studentId;
    return scheduleStudentId === currentStudentId || s.studentName === currentUser?.name;
  });
  
  // Get today's day name
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  const tomorrow = days[(new Date().getDay() + 1) % 7];
  
  // Separate today's and upcoming classes
  const todayClasses = studentSchedules.filter(s => s.day === today);
  const upcomingClasses = studentSchedules.filter(s => s.day === tomorrow).slice(0, 1);
  const allClasses = [...todayClasses, ...upcomingClasses].slice(0, 3);
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3 bg-gradient-to-r from-info/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-info/10">
            <Calendar className="h-5 w-5 text-info" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Upcoming Classes</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Your scheduled sessions</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2 space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm">Loading classes...</p>
          </div>
        ) : allClasses.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No upcoming classes scheduled</p>
            <p className="text-xs text-muted-foreground mt-1">Check back later for updates</p>
          </div>
        ) : (
          allClasses.map((cls) => {
            const isToday = cls.day === today;
            const dateLabel = isToday ? "Today" : "Tomorrow";
            
            return (
              <div 
                key={cls._id || cls.id}
                className="group flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 border border-transparent hover:border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-card shadow-sm border">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">{isToday ? "Today" : "Tom"}</span>
                    <span className="text-sm font-bold text-primary">{cls.time?.split(' ')[0] || 'N/A'}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{cls.course || 'Class'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{cls.teacherName || 'Teacher'}</span>
                      <span className="text-muted-foreground">•</span>
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{cls.duration || '30 min'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isToday && (
                    <Button size="sm" variant="default" className="h-8 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Video className="h-3.5 w-3.5" />
                      Join
                    </Button>
                  )}
                  <Badge 
                    variant={isToday ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {dateLabel}
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
