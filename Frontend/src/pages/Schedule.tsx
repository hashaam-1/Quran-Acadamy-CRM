import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  Clock,
  User,
  Calendar,
  Pencil,
  Trash2,
} from "lucide-react";
import { useCRMStore, ClassSchedule } from "@/lib/store";
import { ScheduleForm } from "@/components/forms/ScheduleForm";
import StartClassButton from "@/components/zoom/StartClassButton";
import JoinClassButton from "@/components/zoom/JoinClassButton";
import StudentZoomManager from "@/components/zoom/StudentZoomManager";
import { toast } from "sonner";
import { useSchedules, useWeekInfo, useCreateSchedule, useUpdateSchedule, useDeleteSchedule } from "@/hooks/useSchedules";
import { useTeachers } from "@/hooks/useTeachers";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const statusConfig = {
  scheduled: { label: "Scheduled", variant: "info" as const, color: "border-l-info" },
  in_progress: { label: "Ongoing", variant: "success" as const, color: "border-l-success" },
  completed: { label: "Completed", variant: "muted" as const, color: "border-l-muted-foreground" },
  cancelled: { label: "Cancelled", variant: "destructive" as const, color: "border-l-destructive" },
};

const courseColors = {
  Qaida: "bg-info/10 text-info",
  Nazra: "bg-success/10 text-success",
  Hifz: "bg-accent/10 text-accent",
  Tajweed: "bg-primary/10 text-primary",
};

export default function Schedule() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Calculate week range from currentWeek
  const getWeekRange = (date: Date) => {
    const day = date.getDay(); // 0 (Sun) - 6 (Sat)
    const diffToMonday = day === 0 ? -6 : 1 - day;
    
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() + diffToMonday);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return {
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0]
    };
  };
  
  const { weekStart, weekEnd } = getWeekRange(currentWeek);
  
  // Log week changes
  useEffect(() => {
    console.log('📅 SCHEDULE COMPONENT - Week changed:', {
      weekStart,
      weekEnd,
      currentWeek: currentWeek.toISOString().split('T')[0]
    });
  }, [weekStart, weekEnd, currentWeek]);
  
  const { data: schedules = [], isLoading: schedulesLoading } = useSchedules(weekStart, weekEnd);
  const { data: weekInfo } = useWeekInfo();
  const { data: teachers = [], isLoading: teachersLoading } = useTeachers();
  const { currentUser } = useAuthStore();
  const createSchedule = useCreateSchedule();
  const updateScheduleMutation = useUpdateSchedule();
  const deleteScheduleMutation = useDeleteSchedule();
  
  // Week navigation functions
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    const daysToAdd = direction === 'next' ? 7 : -7;
    newWeek.setDate(currentWeek.getDate() + daysToAdd);
    
    console.log(`📅 WEEK NAVIGATION - ${direction.toUpperCase()}:`, {
      oldWeek: currentWeek.toISOString().split('T')[0],
      newWeek: newWeek.toISOString().split('T')[0],
      direction
    });
    
    setCurrentWeek(newWeek);
  };
  
  const goToCurrentWeek = () => {
    console.log('📅 WEEK NAVIGATION - Go to current week');
    setCurrentWeek(new Date());
  };

  useEffect(() => {
    console.log('Schedule Page - Schedules:', schedules.length, 'schedules');
    console.log('Schedule Page - Loading:', schedulesLoading);
    console.log('Schedule Page - Current User:', currentUser?.role, currentUser?.name);
  }, [schedules, schedulesLoading, currentUser]);

  useEffect(() => {
    schedules.forEach((slot, index) => {
      console.log(`Schedule ${index}:`, {
        role: currentUser?.role,
        studentName: slot.studentName,
        meetingNumber: slot.meetingNumber,
        shouldShowJoinButton: currentUser?.role === 'teacher' || currentUser?.role === 'student'
      });
    });
  }, [schedules, currentUser]);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [current, setCurrent] = useState<ClassSchedule | null>(null);

  const getWeekDates = () => {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - start.getDay() + 1);
    return weekDays.map((day, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        day,
        date: date.getDate(),
        month: date.toLocaleString("default", { month: "short" }),
        isToday: date.toDateString() === new Date().toDateString(),
      };
    });
  };

  const weekDates = getWeekDates();

  const getSchedulesByDay = (day: string) => {
    const filtered = schedules.filter(s => {
      const matchesDay = s.day?.trim().toLowerCase() === day.toLowerCase();
      const matchesTeacher = teacherFilter === "all" || s.teacherId === teacherFilter;
      
      // Always show schedules based on day (recurring weekly)
      // Remove date filtering that was hiding all schedules
      return matchesDay && matchesTeacher;
    });

    console.log(`📅 Filtered schedules for ${day}:`, filtered.length, 'out of', schedules.length);
    console.log("Meetings:", schedules.filter(s => s.meetingNumber), "Live meetings:", schedules.filter(s => s.status === 'in_progress'));
    return filtered;
  };

  const handleAdd = (data: Omit<ClassSchedule, 'id'>) => {
    // Calculate the date for the selected day in the current week
    const dayIndex = weekDays.indexOf(data.day);
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Start from Monday
    const classDate = new Date(startOfWeek);
    classDate.setDate(startOfWeek.getDate() + dayIndex);
    
    // Add the date to the schedule data
    const scheduleWithDate = {
      ...data,
      className: `${data.course} Class`, // ✅ Add required className field
      date: classDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
    };
    
    createSchedule.mutate(scheduleWithDate, {
      onSuccess: () => {
        setIsAddOpen(false);
      }
    });
  };

  const handleEdit = (data: Omit<ClassSchedule, 'id'>) => {
    if (current) {
      const scheduleId = (current as any)._id || current.id;
      updateScheduleMutation.mutate({ id: scheduleId, data }, {
        onSuccess: () => {
          setIsEditOpen(false);
          setCurrent(null);
        }
      });
    }
  };

  const handleDelete = () => {
    if (current) {
      const scheduleId = (current as any)._id || current.id;
      deleteScheduleMutation.mutate(scheduleId, {
        onSuccess: () => {
          setIsDeleteOpen(false);
          setCurrent(null);
        }
      });
    }
  };

  const todayClassCount = schedules.filter(s => s.day === weekDays[new Date().getDay() - 1]).length;
  const completedToday = schedules.filter(s => s.day === weekDays[new Date().getDay() - 1] && s.status === 'completed').length;

  return (
    <MainLayout title="Class Schedule" subtitle="Weekly timetable view">
      {/* Week Navigation Controls */}
      {/* <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous Week
            </Button>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {weekStart} to {weekEnd}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
              className="flex items-center gap-2"
            >
              Next Week
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={goToCurrentWeek}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Current Week
            </Button>
            
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <span>{schedules.length} classes</span>
              {weekInfo && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Week {weekInfo.currentWeekSchedules}/{weekInfo.totalSchedules}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div> */}
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card variant="stat" className="animate-slide-up stagger-1">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{schedules.length}</p>
            <p className="text-xs text-muted-foreground">Total Scheduled</p>
          </CardContent>
        </Card>
        <Card variant="stat" className="animate-slide-up stagger-2">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{completedToday}</p>
            <p className="text-xs text-muted-foreground">Completed Today</p>
          </CardContent>
        </Card>
        <Card variant="stat" className="animate-slide-up stagger-3">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-info">{todayClassCount}</p>
            <p className="text-xs text-muted-foreground">Total Classes Today</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => {
            const newWeek = new Date(currentWeek);
            newWeek.setDate(newWeek.getDate() - 7);
            setCurrentWeek(newWeek);
          }}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-semibold">
            {weekDates[0].month} {weekDates[0].date} - {weekDates[6].month} {weekDates[6].date}
          </div>
          <Button variant="outline" size="icon" onClick={() => {
            const newWeek = new Date(currentWeek);
            newWeek.setDate(newWeek.getDate() + 7);
            setCurrentWeek(newWeek);
          }}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentWeek(new Date())}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Select value={teacherFilter} onValueChange={setTeacherFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Teachers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teachers</SelectItem>
              {teachers.map((teacher) => (
                <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="gap-2" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Class
          </Button>
        </div>
      </div>

      <Card className="animate-slide-up overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b">
            {weekDates.map((date) => (
              <div
                key={date.day}
                className={cn(
                  "p-4 text-center border-r last:border-r-0",
                  date.isToday && "bg-primary/5"
                )}
              >
                <p className="text-sm text-muted-foreground">{date.day}</p>
                <p className={cn(
                  "text-2xl font-bold mt-1",
                  date.isToday && "text-primary"
                )}>
                  {date.date}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 min-h-[500px]">
            {weekDays.map((day) => (
              <div
                key={day}
                className={cn(
                  "border-r last:border-r-0 p-2 space-y-2",
                  weekDates.find(d => d.day === day)?.isToday && "bg-primary/5"
                )}
              >
                {getSchedulesByDay(day).map((slot) => {
  // Debug logging for all schedule data to identify Join Class button issues
  console.log('Schedule slot debug:', {
    id: slot.id,
    status: slot.status,
    meetingNumber: slot.meetingNumber,
    course: slot.course,
    studentName: slot.studentName,
    teacherName: slot.teacherName,
    currentUserRole: currentUser?.role,
    shouldShowJoinClass: currentUser?.role === 'teacher'
  });

  return (
  <div
    key={slot.id}
    className={cn(
      "relative overflow-hidden p-3 rounded-lg bg-card border-l-4 shadow-soft group hover:shadow-md transition-shadow cursor-pointer",
      statusConfig[slot.status].color
    )}
  >

    {/* Normal Card Content */}
    <div className="relative z-10">
      <div className="mb-2">
        <Badge
          className={cn(
            "text-xs",
            courseColors[slot.course as keyof typeof courseColors]
          )}
        >
          {slot.course || 'General'}
        </Badge>
      </div>

      <p className="font-medium text-sm truncate">{slot.studentName}</p>
      <p className="text-xs text-muted-foreground truncate">
        {slot.teacherName}
      </p>

      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>{slot.time}</span>
        <span>â¢</span>
        <span>{slot.duration}</span>
      </div>
    </div>

    {/* Hover Actions - Role-based */}
    <div className="absolute inset-0 z-20 bg-black/60 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
      {/* Teacher: Join Class + Edit */}
      {(() => {
        // ✅ FIXED: Only show Join button if meeting exists and is valid
        const shouldShowJoinButton = 
          slot.status === 'scheduled' &&
          currentUser?.role === 'teacher' &&
          typeof slot.meetingNumber === 'string' &&
          slot.meetingNumber.trim() !== '' &&
          /^\d+$/.test(slot.meetingNumber);
        
        console.log('🔍 Join Class button condition check:', {
          slotStatus: slot.status,
          meetingNumber: slot.meetingNumber,
          meetingNumberType: typeof slot.meetingNumber,
          userRole: currentUser?.role,
          shouldShowJoinButton,
          slotId: slot.id,
          isNumeric: slot.meetingNumber ? /^\d+$/.test(slot.meetingNumber) : false
        });
        
        return shouldShowJoinButton;
      })() && (
        <>
          <JoinClassButton
            meetingNumber={slot.meetingNumber}
            scheduleId={slot.id}
            teacherName={slot.teacherName}
            course={slot.course || 'General'}
            time={slot.time}
            studentId={slot.studentId?._id}
            studentName={slot.studentName}
            className="bg-white text-black hover:bg-gray-100"
          />
          <Button
            size="sm"
            variant="outline"
            className="bg-white text-black hover:bg-gray-100 border-white"
            onClick={() => {
              setCurrent(slot);
              setIsEditOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Student: Join Class only for scheduled classes with valid meeting */}
      {currentUser?.role === 'student' && 
       slot.status === 'scheduled' && 
       typeof slot.meetingNumber === 'string' && 
       slot.meetingNumber.trim() !== '' && 
       /^\d+$/.test(slot.meetingNumber) && (
        <StudentZoomManager
          meetingNumber={slot.meetingNumber}
          scheduleId={slot.id}
          className="bg-white text-black hover:bg-gray-100"
          teacherName={slot.teacherName}
          course={slot.course}
          time={slot.time}
        />
      )}

      {/* Admin/Sales Team/Team Leader: Edit + Delete */}
      {(currentUser?.role === 'admin' || currentUser?.role === 'sales_team' || currentUser?.role === 'team_leader') && (
        <div className="flex flex-col items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="bg-white text-black hover:bg-gray-100 border-white"
            onClick={() => {
              setCurrent(slot);
              setIsEditOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-white text-red-600 hover:bg-red-50 border-red-600"
            onClick={() => {
              setCurrent(slot);
              setIsDeleteOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  </div>
  );
})}
                {getSchedulesByDay(day).length === 0 && (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">No classes</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card variant="stat" className="animate-slide-up">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayClassCount}</p>
                <p className="text-sm text-muted-foreground">Total Classes Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="stat" className="animate-slide-up">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <User className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedToday}</p>
                <p className="text-sm text-muted-foreground">Completed Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="stat" className="animate-slide-up">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{schedules.length}</p>
                <p className="text-sm text-muted-foreground">Total Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ScheduleForm
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSubmit={handleAdd}
        mode="add"
      />

      <ScheduleForm
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSubmit={handleEdit}
        initialData={current || undefined}
        mode="edit"
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this class for {current?.studentName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
