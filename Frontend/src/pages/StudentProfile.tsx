import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  Award,
  Clock,
  TrendingUp,
  FileText,
  CheckCircle,
  XCircle,
  Edit,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useProgressByStudent } from "@/hooks/useProgress";
import { useHomeworkByStudent } from "@/hooks/useHomework";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function StudentProfile() {
  const { currentUser } = useAuthStore();
  const studentId = currentUser?.id || (currentUser as any)?._id || (currentUser as any)?.studentId;

  // Fetch student data
  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ['student', studentId],
    queryFn: async () => {
      const { data } = await api.get(`/students/${studentId}`);
      return data;
    },
    enabled: !!studentId,
  });

  const { data: progressRecords = [] } = useProgressByStudent(studentId || '');
  const { data: homeworkList = [] } = useHomeworkByStudent(studentId || '');
  
  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['attendance', 'student', studentId],
    queryFn: async () => {
      const { data } = await api.get(`/attendance/student/${studentId}`);
      return data;
    },
    enabled: !!studentId,
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const { data } = await api.get('/schedules');
      return data.filter((s: any) => {
        const scheduleStudentId = typeof s.studentId === 'object' && s.studentId !== null 
          ? (s.studentId as any)._id || (s.studentId as any).id
          : s.studentId;
        return scheduleStudentId === studentId;
      });
    },
    enabled: !!studentId,
  });

  if (studentLoading) {
    return (
      <MainLayout title="My Profile" subtitle="Loading...">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Calculate statistics
  const totalClasses = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((r: any) => r.status === 'present').length;
  const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;
  
  const completedHomework = homeworkList.filter((h: any) => h.status === 'completed').length;
  const totalHomework = homeworkList.length;
  const homeworkRate = totalHomework > 0 ? Math.round((completedHomework / totalHomework) * 100) : 0;

  const overallProgress = student?.progress || 0;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <MainLayout 
      title="My Profile" 
      subtitle={`${student?.name || 'Student'} - ${student?.course || 'Course'}`}
    >
      {/* Profile Header */}
      <Card className="mb-6 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary via-primary/80 to-accent"></div>
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4 -mt-16">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent p-1 shadow-xl">
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                  <User className="h-16 w-16 text-primary" />
                </div>
              </div>
              <div className="text-center md:text-left mb-4 md:mb-0">
                <h2 className="text-2xl font-bold">{student?.name}</h2>
                <p className="text-muted-foreground">{student?.email}</p>
                <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
                  <Badge variant="default">{student?.course}</Badge>
                  <Badge variant={student?.status === 'active' ? 'default' : 'secondary'}>
                    {student?.status}
                  </Badge>
                  <Badge variant="outline">Student ID: {student?.userId}</Badge>
                </div>
              </div>
            </div>
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">{overallProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-success/10">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attendance</p>
                <p className="text-2xl font-bold">{attendanceRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-accent/10">
                <BookOpen className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Homework</p>
                <p className="text-2xl font-bold">{completedHomework}/{totalHomework}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-info/10">
                <Calendar className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Classes</p>
                <p className="text-2xl font-bold">{schedules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="homework">Homework</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        {/* Personal Information */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="font-medium">{student?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{student?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Age</p>
                    <p className="font-medium">{student?.age} years</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Country</p>
                    <p className="font-medium">{student?.country}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Timezone</p>
                    <p className="font-medium">{student?.timezone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Course</p>
                    <p className="font-medium">{student?.course}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Teacher</p>
                    <p className="font-medium">{student?.teacher}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Start Date</p>
                    <p className="font-medium">
                      {student?.startDate ? formatDate(student.startDate) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No classes scheduled</p>
              ) : (
                <div className="space-y-2">
                  {schedules.map((schedule: any) => (
                    <div 
                      key={schedule._id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-16 text-center">
                          <p className="text-xs font-medium text-muted-foreground">{schedule.day}</p>
                        </div>
                        <div>
                          <p className="font-medium">{schedule.course}</p>
                          <p className="text-sm text-muted-foreground">{schedule.teacherName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{schedule.time}</p>
                        <p className="text-xs text-muted-foreground">{schedule.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Learning Progress</CardTitle>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">{overallProgress}%</p>
                  <p className="text-xs text-muted-foreground">Overall Completion</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={overallProgress} className="h-3 mb-6" />
              
              {progressRecords.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No progress records yet</p>
              ) : (
                <div className="space-y-3">
                  {progressRecords.map((record: any, index: number) => (
                    <div 
                      key={record._id || index}
                      className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{record.lesson}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(record.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="default">{record.completion}%</Badge>
                      </div>
                      {record.sabqi && (
                        <p className="text-sm"><span className="font-medium">Sabqi:</span> {record.sabqi}</p>
                      )}
                      {record.manzil && (
                        <p className="text-sm"><span className="font-medium">Manzil:</span> {record.manzil}</p>
                      )}
                      {record.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">"{record.notes}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Homework Tab */}
        <TabsContent value="homework" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Homework Assignments</CardTitle>
                <div className="text-right">
                  <p className="text-2xl font-bold">{completedHomework}/{totalHomework}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {homeworkList.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No homework assigned yet</p>
              ) : (
                <div className="space-y-3">
                  {homeworkList.map((hw: any) => {
                    const isCompleted = hw.status === 'completed';
                    const isOverdue = hw.status === 'overdue';
                    
                    return (
                      <div 
                        key={hw._id}
                        className={cn(
                          "p-4 rounded-lg border",
                          isCompleted && "bg-success/5 border-success/20",
                          isOverdue && "bg-destructive/5 border-destructive/20",
                          !isCompleted && !isOverdue && "bg-card"
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold">{hw.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{hw.description}</p>
                          </div>
                          <Badge 
                            variant={
                              isCompleted ? 'default' : 
                              isOverdue ? 'destructive' : 
                              'secondary'
                            }
                          >
                            {hw.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                          <span>📚 {hw.course}</span>
                          <span>📅 Due: {formatDate(hw.dueDate)}</span>
                          {hw.grade && <span>⭐ Grade: {hw.grade}</span>}
                        </div>
                        {hw.teacherFeedback && (
                          <div className="mt-3 p-2 rounded bg-muted/50">
                            <p className="text-xs font-medium text-muted-foreground">Teacher Feedback:</p>
                            <p className="text-sm mt-1">{hw.teacherFeedback}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Attendance Record</CardTitle>
                <div className="text-right">
                  <p className="text-3xl font-bold text-success">{attendanceRate}%</p>
                  <p className="text-xs text-muted-foreground">Attendance Rate</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg bg-success/10 border border-success/20">
                  <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                  <p className="text-2xl font-bold">{presentCount}</p>
                  <p className="text-xs text-muted-foreground">Present</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="text-2xl font-bold">
                    {attendanceRecords.filter((r: any) => r.status === 'absent').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Absent</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-warning/10 border border-warning/20">
                  <Clock className="h-8 w-8 text-warning mx-auto mb-2" />
                  <p className="text-2xl font-bold">
                    {attendanceRecords.filter((r: any) => r.status === 'late').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Late</p>
                </div>
              </div>

              {attendanceRecords.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No attendance records yet</p>
              ) : (
                <div className="space-y-2">
                  {attendanceRecords.map((record: any, index: number) => {
                    const StatusIcon = record.status === 'present' ? CheckCircle : 
                                      record.status === 'absent' ? XCircle : Clock;
                    const statusColor = record.status === 'present' ? 'text-success' : 
                                       record.status === 'absent' ? 'text-destructive' : 'text-warning';
                    
                    return (
                      <div 
                        key={record._id || index}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <StatusIcon className={`h-5 w-5 ${statusColor}`} />
                          <div>
                            <p className="font-medium">{formatDate(record.date)}</p>
                            <p className="text-sm text-muted-foreground">{record.course || 'Class'}</p>
                          </div>
                        </div>
                        <Badge 
                          variant={
                            record.status === 'present' ? 'default' : 
                            record.status === 'absent' ? 'destructive' : 
                            'secondary'
                          }
                          className="capitalize"
                        >
                          {record.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
