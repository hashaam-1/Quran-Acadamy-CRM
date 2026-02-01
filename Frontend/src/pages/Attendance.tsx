import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, CheckCircle, XCircle, Clock, User, Calendar, AlertCircle, AlertTriangle, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAttendance, useAttendanceStats, useStudentsForAttendance, useScheduledClasses, useMarkScheduledAttendance, useMarkAttendance, useTeacherTodayAttendance, useTeacherCheckout } from "@/hooks/useAttendance";
import { useSchedules } from "@/hooks/useSchedules";
import { useAuthStore } from "@/lib/auth-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const studentStatusConfig = {
  present: { label: "Present", variant: "success" as const, icon: CheckCircle },
  absent: { label: "Absent", variant: "destructive" as const, icon: XCircle },
  late: { label: "Late", variant: "warning" as const, icon: Clock },
  excused: { label: "Excused", variant: "info" as const, icon: AlertCircle },
};

const teacherStatusConfig = {
  checked_in: { label: "Checked In", variant: "success" as const },
  checked_out: { label: "Checked Out", variant: "muted" as const },
  absent: { label: "Absent", variant: "destructive" as const },
};

export default function Attendance() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { currentUser } = useAuthStore();
  
  // Determine what data to fetch based on role
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'sales_team' || currentUser?.role === 'team_leader';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';
  
  // Fetch attendance based on role
  const { data: studentAttendance = [], isLoading: loadingStudents } = useAttendance({
    userType: 'student',
    ...(isStudent && { studentId: currentUser?.id }),
  });
  
  const { data: teacherAttendance = [], isLoading: loadingTeachers } = useAttendance({
    userType: 'teacher',
  });
  
  // For teachers: get their students to mark attendance
  const { data: teacherStudents = [], isLoading: loadingTeacherStudents } = useStudentsForAttendance(
    isTeacher ? currentUser?.id || '' : '',
    selectedDate
  );
  
  const { data: stats } = useAttendanceStats();

  // For teachers - get scheduled classes for today
  const { data: scheduledClasses = [] } = useScheduledClasses(
    isTeacher ? currentUser?.id || '' : ''
  );

  // Get teacher's today attendance status (check-in/check-out)
  const { data: teacherTodayStatus } = useTeacherTodayAttendance(
    isTeacher ? currentUser?.id || '' : ''
  );

  const markScheduledAttendanceMutation = useMarkScheduledAttendance();
  const teacherCheckoutMutation = useTeacherCheckout();
  const markAttendance = useMarkAttendance();
  
  // Get schedules for upcoming classes (must be called before any conditional returns)
  const { data: allSchedules = [] } = useSchedules();
  
  const isLoading = loadingStudents || loadingTeachers || loadingTeacherStudents;
  
  
  // Debug checkOutTime specifically
  if (studentAttendance.length > 0) {
    console.log('First Student Attendance Record - CheckOut Debug:', {
      record: studentAttendance[0],
      hasCheckOutTime: 'checkOutTime' in studentAttendance[0],
      checkOutTimeValue: studentAttendance[0].checkOutTime,
      checkInTimeValue: studentAttendance[0].checkInTime
    });
  }

  const filteredStudentRecords = studentAttendance.filter(record => {
    const studentName = record.studentName || '';
    return studentName.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  const filteredTeacherRecords = teacherAttendance.filter(record => {
    const teacherName = record.teacherName || '';
    return teacherName.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  // Filter schedules based on role
  const mySchedules = isStudent ? allSchedules.filter((s: any) => 
    s.studentId === currentUser?.id || s.studentId?._id === currentUser?.id
  ) : [];

  const teacherSchedules = isTeacher ? allSchedules.filter((s: any) => 
    s.teacherId?._id === currentUser?.id || 
    s.teacherId === currentUser?.id ||
    s.teacherName === currentUser?.name
  ) : [];

  // Get upcoming classes for this week
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  const currentDay = daysOfWeek[today.getDay()];
  const upcomingClasses = mySchedules.filter((s: any) => s.status === 'scheduled');
  const teacherUpcomingClasses = teacherSchedules.filter((s: any) => s.status === 'scheduled');
  
  console.log('Attendance - Upcoming Classes:', {
    currentDay,
    studentUpcomingClasses: upcomingClasses.map(s => ({ day: s.day, time: s.time, course: s.course })),
    teacherUpcomingClasses: teacherUpcomingClasses.map(s => ({ day: s.day, time: s.time, course: s.course, student: s.studentName }))
  });
  
  // Helper to calculate how late a student is
  const calculateLateDuration = (scheduledTime: string, actualTime: string) => {
    try {
      const parseTime = (timeStr: string) => {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
      };
      
      const scheduledMinutes = parseTime(scheduledTime);
      const actualMinutes = parseTime(actualTime);
      const diff = actualMinutes - scheduledMinutes;
      
      if (diff <= 0) return '0 min';
      if (diff < 60) return `${diff} min`;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    } catch {
      return '';
    }
  };

  const handleMarkAttendance = async (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    // Extract actual student ID if it's an object
    const actualStudentId = typeof studentId === 'object' ? (studentId as any)?._id : studentId;
    
    console.log('Marking attendance:', { studentId, actualStudentId, status });
    
    // Find the student's scheduled class for today
    const todayClass = todaySchedules.find((s: any) => 
      s.studentId === actualStudentId || s.studentId?._id === actualStudentId
    );
    
    console.log('Found todayClass:', todayClass);
    
    await markAttendance.mutateAsync({
      studentId: actualStudentId,
      status,
      classTime: todayClass?.time || new Date().toLocaleTimeString(),
      course: todayClass?.course || 'General',
      scheduleId: todayClass?.id || todayClass?._id,
    });
  };

  // Function to determine attendance status based on class time
  const getAttendanceStatus = (record: any, schedule?: any) => {
    // If attendance is already marked, return that status
    if (record && record.status && record.status !== 'not_marked') {
      return record.status;
    }
    
    // Find today's scheduled class for this student
    const todayClass = schedule || todaySchedules.find((s: any) => 
      s.studentId === record?.studentId || s.studentId?._id === record?.studentId
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

  // Function to get status display configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'present':
        return { variant: 'default' as const, label: 'Present', icon: CheckCircle };
      case 'absent':
        return { variant: 'destructive' as const, label: 'Absent', icon: XCircle };
      case 'late':
        return { variant: 'secondary' as const, label: 'Late', icon: Clock };
      case 'excused':
        return { variant: 'outline' as const, label: 'Excused', icon: AlertCircle };
      case 'pending':
        return { variant: 'secondary' as const, label: 'Pending', icon: AlertTriangle };
      case 'not_marked':
        return { variant: 'outline' as const, label: 'Not Marked', icon: Clock };
      case 'no_class':
        return { variant: 'secondary' as const, label: 'No Class Today', icon: Calendar };
      default:
        return { variant: 'outline' as const, label: 'Unknown', icon: Clock };
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Attendance" subtitle="Track student and teacher attendance">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading attendance...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Student view - only their own attendance
  if (isStudent) {
    return (
      <MainLayout title="My Attendance" subtitle="View your attendance records">
        <Card>
          <CardHeader>
            <CardTitle>My Attendance History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Scheduled Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudentRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No attendance records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudentRecords.map((record) => {
                      const config = studentStatusConfig[record.status];
                      const StatusIcon = config.icon;
                      return (
                        <TableRow key={record.id || record._id}>
                          <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={record.scheduledDay === currentDay ? "default" : "outline"}>
                              {record.scheduledDay || new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </Badge>
                          </TableCell>
                          <TableCell><Badge variant="outline">{record.course || 'N/A'}</Badge></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-primary" />
                              <span className="font-semibold">{record.scheduledTime || record.classTime || 'N/A'}</span>
                              {record.duration && (
                                <Badge variant="outline" className="text-xs">{record.duration}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={config.variant} className="gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className={record.status === 'late' ? 'text-warning font-medium' : ''}>
                                  {record.checkInTime || 'N/A'}
                                </span>
                              </div>
                              {record.status === 'late' && record.scheduledTime && (
                                <span className="text-xs text-warning">Late by {calculateLateDuration(record.scheduledTime, record.checkInTime)}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {record.checkOutTime || '-'}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }
  
  // Get today's schedules for quick reference
  const todaySchedules = teacherSchedules.filter((s: any) => s.day === currentDay && s.status === 'scheduled');
  
  // Debug logging after all variables are defined
  console.log('Attendance Debug:', {
    currentUser,
    isAdmin,
    isTeacher,
    isStudent,
    studentAttendance,
    teacherAttendance,
    teacherStudents,
    stats,
    allSchedulesLength: allSchedules.length,
    teacherSchedulesLength: teacherSchedules.length,
    todaySchedulesLength: todaySchedules.length
  });
  
  // Debug schedule data
  console.log('Schedule Debug:', {
    currentDay,
    allSchedules: allSchedules.map(s => ({ 
      id: s.id || s._id, 
      day: s.day, 
      time: s.time, 
      status: s.status, 
      studentName: s.studentName,
      studentId: s.studentId,
      teacherId: s.teacherId,
      teacherName: s.teacherName
    })),
    teacherSchedules: teacherSchedules.map(s => ({ 
      id: s.id || s._id, 
      day: s.day, 
      time: s.time, 
      status: s.status, 
      studentName: s.studentName,
      studentId: s.studentId
    })),
    todaySchedules: todaySchedules.map(s => ({ 
      id: s.id || s._id, 
      day: s.day, 
      time: s.time, 
      status: s.status, 
      studentName: s.studentName,
      studentId: s.studentId
    }))
  });
  
  
  // Teacher view - their students and can mark attendance
  if (isTeacher) {
    return (
      <MainLayout title="Attendance" subtitle="Manage student attendance">
        <Tabs defaultValue="studentattendance">
          <TabsList className="mb-4">
            <TabsTrigger value="studentattendance">Student Attendance</TabsTrigger>
            <TabsTrigger value="myattendance">My Attendance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="studentattendance">
            <Card>
              <CardHeader>
                <CardTitle>Mark Student Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search students..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                </div>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Scheduled Time</TableHead>
                        <TableHead>Today's Status</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todaySchedules.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No classes scheduled for today
                          </TableCell>
                        </TableRow>
                      ) : (
                        todaySchedules.map((schedule: any) => {
                          // Extract actual student ID from schedule
                          const scheduleStudentId = typeof schedule.studentId === 'object' 
                            ? schedule.studentId?._id 
                            : schedule.studentId;
                          
                          // Find attendance record for this student
                          const attendanceRecord = studentAttendance.find((record: any) => 
                            record.studentId === scheduleStudentId || 
                            record.studentId === schedule.studentId ||
                            record.studentId?._id === scheduleStudentId
                          );
                          
                          // Debug checkout time
                          if (attendanceRecord) {
                            console.log('Attendance record for', schedule.studentName, {
                              checkInTime: attendanceRecord.checkInTime,
                              checkOutTime: attendanceRecord.checkOutTime,
                              status: attendanceRecord.status
                            });
                          }
                          
                          const attendanceStatus = getAttendanceStatus(attendanceRecord, schedule);
                          const statusConfig = getStatusConfig(attendanceStatus);
                          const StatusIcon = statusConfig.icon;
                          
                          return (
                          <TableRow key={schedule.id || schedule._id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <span className="font-medium">{schedule.studentName || 'Unknown'}</span>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline">{schedule.course || 'N/A'}</Badge></TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {schedule.time || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusConfig.variant} className="gap-1">
                                <StatusIcon className="h-3 w-3" />
                                {statusConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {attendanceRecord?.checkInTime || '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {attendanceRecord?.checkOutTime || '-'}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="outline" className="text-success border-success hover:bg-success hover:text-white" onClick={() => handleMarkAttendance(scheduleStudentId, 'present')}>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Present
                                </Button>
                                <Button size="sm" variant="outline" className="text-destructive border-destructive hover:bg-destructive hover:text-white" onClick={() => handleMarkAttendance(scheduleStudentId, 'absent')}>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Absent
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="myattendance">
            <div className="space-y-6">
              {/* Upcoming Classes Today */}
              {todaySchedules.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      My Classes Today ({currentDay})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {todaySchedules.map((schedule: any) => (
                        <div key={schedule.id || schedule._id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Clock className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold">{schedule.studentName}</p>
                              <p className="text-sm text-muted-foreground">{schedule.course}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-primary">{schedule.time}</p>
                            <p className="text-xs text-muted-foreground">{schedule.duration}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* My Attendance History */}
              <Card>
                <CardHeader>
                  <CardTitle>My Attendance History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Date</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teacherAttendance.filter(r => r.teacherId?._id === currentUser?.id || r.teacherId === currentUser?.id).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No attendance records found
                          </TableCell>
                        </TableRow>
                      ) : (
                        teacherAttendance
                          .filter(r => r.teacherId?._id === currentUser?.id || r.teacherId === currentUser?.id)
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((record) => (
                          <TableRow key={record.id || record._id}>
                            <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {record.checkInTime || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {record.checkOutTime || 'Not checked out'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={record.status === 'present' ? 'success' : 'destructive'}>
                                {record.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            </div>
          </TabsContent>
        </Tabs>
      </MainLayout>
    );
  }
  
  // Admin/Sales/TeamLead view - see all students and teachers
  return (
    <MainLayout title="Attendance" subtitle="Track student and teacher attendance">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card variant="stat"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Students Present</p><p className="text-2xl font-bold text-success">{stats?.present || 0}</p></div><div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-success" /></div></div></CardContent></Card>
        <Card variant="stat"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Students Absent</p><p className="text-2xl font-bold text-destructive">{stats?.absent || 0}</p></div><div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center"><XCircle className="h-5 w-5 text-destructive" /></div></div></CardContent></Card>
        <Card variant="stat"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Students Late</p><p className="text-2xl font-bold text-warning">{stats?.late || 0}</p></div><div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center"><Clock className="h-5 w-5 text-warning" /></div></div></CardContent></Card>
        <Card variant="stat"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Attendance Rate</p><p className="text-2xl font-bold">{stats?.attendanceRate || 0}%</p></div><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Calendar className="h-5 w-5 text-primary" /></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="students">
        <TabsList className="mb-4"><TabsTrigger value="students">Student Attendance</TabsTrigger><TabsTrigger value="teachers">Teacher Attendance</TabsTrigger></TabsList>
        <TabsContent value="students">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Student Attendance</CardTitle><Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" />Export</Button></CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search students..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div></div>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader><TableRow className="bg-muted/50"><TableHead>Student</TableHead><TableHead>Course</TableHead><TableHead>Teacher</TableHead><TableHead>Scheduled Time</TableHead><TableHead>Status</TableHead><TableHead>Check In</TableHead><TableHead>Check Out</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredStudentRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No student attendance records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudentRecords.map((record) => {
                        const config = studentStatusConfig[record.status];
                        const StatusIcon = config.icon;
                        return (
                          <TableRow key={record.id || record._id}>
                            <TableCell><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-4 w-4 text-primary" /></div><span className="font-medium">{record.studentName || 'Unknown'}</span></div></TableCell>
                            <TableCell><Badge variant="outline">{record.course || 'N/A'}</Badge></TableCell>
                            <TableCell>{record.teacherName || 'Unknown'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {record.scheduledTime || record.classTime || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell><Badge variant={config.variant} className="gap-1"><StatusIcon className="h-3 w-3" />{config.label}</Badge></TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className={record.status === 'late' ? 'text-warning font-medium' : ''}>
                                    {record.checkInTime || 'N/A'}
                                  </span>
                                </div>
                                {record.status === 'late' && record.scheduledTime && (
                                  <span className="text-xs text-warning">Late by {calculateLateDuration(record.scheduledTime, record.checkInTime)}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {record.checkOutTime || '-'}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="teachers">
          <Card>
            <CardHeader><CardTitle>Teacher Attendance</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader><TableRow className="bg-muted/50"><TableHead>Teacher</TableHead><TableHead>Date</TableHead><TableHead>Check In</TableHead><TableHead>Check Out</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredTeacherRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No teacher attendance records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTeacherRecords.map((record) => {
                        const teacherName = record.teacherName || 'Unknown';
                        const status = record.status === 'present' ? 'checked_in' : 'checked_out';
                        return (
                          <TableRow key={record.id || record._id}>
                            <TableCell><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-medium">{teacherName.split(" ").map(n => n[0]).join("")}</div><span className="font-medium">{teacherName}</span></div></TableCell>
                            <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                            <TableCell>{record.checkInTime || 'N/A'}</TableCell>
                            <TableCell>{record.checkOutTime || '-'}</TableCell>
                            <TableCell><Badge variant={teacherStatusConfig[status].variant}>{teacherStatusConfig[status].label}</Badge></TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
