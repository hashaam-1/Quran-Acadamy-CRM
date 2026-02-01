import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import { useHomeworkByStudent } from "@/hooks/useHomework";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

export function StudentHomework() {
  const { currentUser } = useAuthStore();
  const studentId = currentUser?.id || (currentUser as any)?._id || (currentUser as any)?.studentId;
  const { data: homeworkList = [], isLoading } = useHomeworkByStudent(studentId);
  
  const pendingHomework = homeworkList.filter((h: any) => h.status === 'pending' || h.status === 'in_progress');
  const overdueHomework = homeworkList.filter((h: any) => h.status === 'overdue');
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'overdue': return 'destructive';
      default: return 'secondary';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'overdue': return AlertCircle;
      default: return Clock;
    }
  };
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3 bg-gradient-to-r from-accent/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <BookOpen className="h-5 w-5 text-accent" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Homework</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Assignments & tasks</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {overdueHomework.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {overdueHomework.length} overdue
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            {pendingHomework.length} pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-2 space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm">Loading homework...</p>
          </div>
        ) : homeworkList.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No homework assigned yet</p>
            <p className="text-xs text-muted-foreground mt-1">Your teacher will assign homework soon</p>
          </div>
        ) : (
          homeworkList.slice(0, 5).map((hw: any) => {
            const StatusIcon = getStatusIcon(hw.status);
            const isOverdue = hw.status === 'overdue';
            const isCompleted = hw.status === 'completed';
            
            return (
              <div 
                key={hw._id || hw.id}
                className={cn(
                  "group flex items-start justify-between p-3 rounded-xl transition-all duration-200 border",
                  isCompleted ? "bg-success/5 border-success/20" : 
                  isOverdue ? "bg-destructive/5 border-destructive/20" :
                  "bg-muted/30 hover:bg-muted/50 border-transparent hover:border-border"
                )}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className={cn(
                    "p-2 rounded-lg",
                    isCompleted ? "bg-success/10" :
                    isOverdue ? "bg-destructive/10" :
                    "bg-info/10"
                  )}>
                    <StatusIcon className={cn(
                      "h-4 w-4",
                      isCompleted ? "text-success" :
                      isOverdue ? "text-destructive" :
                      "text-info"
                    )} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{hw.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{hw.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-[10px] h-5">
                        {hw.course}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Due: {formatDate(hw.dueDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Badge 
                  variant={getStatusColor(hw.status) as any}
                  className="text-[10px] ml-2"
                >
                  {hw.status.replace('_', ' ')}
                </Badge>
              </div>
            );
          })
        )}
        {homeworkList.length > 5 && (
          <Button variant="ghost" size="sm" className="w-full text-xs">
            View all {homeworkList.length} assignments
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
