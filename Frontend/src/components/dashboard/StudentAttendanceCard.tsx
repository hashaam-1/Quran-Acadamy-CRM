import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function StudentAttendanceCard() {
  const { currentUser } = useAuthStore();
  const studentId = currentUser?.id || (currentUser as any)?._id || (currentUser as any)?.studentId;
  
  const { data: attendanceRecords = [], isLoading } = useQuery({
    queryKey: ['attendance', 'student', studentId],
    queryFn: async () => {
      const { data } = await api.get(`/attendance/student/${studentId}`);
      return data;
    },
    enabled: !!studentId,
  });

  // Calculate attendance statistics
  const totalClasses = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((r: any) => r.status === 'present').length;
  const absentCount = attendanceRecords.filter((r: any) => r.status === 'absent').length;
  const lateCount = attendanceRecords.filter((r: any) => r.status === 'late').length;
  const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

  // Get recent attendance (last 7 days)
  const recentAttendance = attendanceRecords.slice(0, 7);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return CheckCircle;
      case 'absent': return XCircle;
      case 'late': return Clock;
      default: return Calendar;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-success';
      case 'absent': return 'text-destructive';
      case 'late': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-success/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Calendar className="h-5 w-5 text-success" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Attendance</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Your attendance record</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-success">{attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">Attendance Rate</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm">Loading attendance...</p>
          </div>
        ) : totalClasses === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No attendance records yet</p>
            <p className="text-xs text-muted-foreground mt-1">Your attendance will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-3 rounded-lg bg-success/5 border border-success/20">
                <div className="text-lg font-bold text-success">{presentCount}</div>
                <div className="text-xs text-muted-foreground">Present</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="text-lg font-bold text-destructive">{absentCount}</div>
                <div className="text-xs text-muted-foreground">Absent</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-warning/5 border border-warning/20">
                <div className="text-lg font-bold text-warning">{lateCount}</div>
                <div className="text-xs text-muted-foreground">Late</div>
              </div>
            </div>

            {/* Recent Attendance */}
            <div>
              <h4 className="text-sm font-medium mb-2">Recent Classes</h4>
              <div className="space-y-2">
                {recentAttendance.map((record: any, index: number) => {
                  const StatusIcon = getStatusIcon(record.status);
                  return (
                    <div 
                      key={record._id || index}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-4 w-4 ${getStatusColor(record.status)}`} />
                        <div>
                          <p className="text-sm font-medium">{formatDate(record.date)}</p>
                          <p className="text-xs text-muted-foreground">{record.course || 'Class'}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={
                          record.status === 'present' ? 'default' : 
                          record.status === 'absent' ? 'destructive' : 
                          'secondary'
                        }
                        className="text-xs capitalize"
                      >
                        {record.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
