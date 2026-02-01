import { useState } from "react";
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
import { ClassSchedule } from "@/lib/store";
import { ScheduleForm } from "@/components/forms/ScheduleForm";
import { toast } from "sonner";
import { useSchedules, useCreateSchedule, useUpdateSchedule, useDeleteSchedule } from "@/hooks/useSchedules";
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
  const { data: schedules = [], isLoading: schedulesLoading } = useSchedules();
  const { data: teachers = [], isLoading: teachersLoading } = useTeachers();
  const { currentUser } = useAuthStore();
  const createSchedule = useCreateSchedule();
  const updateScheduleMutation = useUpdateSchedule();
  const deleteScheduleMutation = useDeleteSchedule();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
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
    console.log('Filtering schedules for day:', day, 'currentUser:', currentUser);
    console.log('All schedules:', schedules.map(s => ({
      id: s.id || s._id,
      day: s.day,
      teacherId: s.teacherId,
      teacherName: s.teacherName,
      studentName: s.studentName
    })));
    const filteredSchedules = schedules.filter(s => {
      const matchesDay = s.day === day;
      const matchesTeacher = teacherFilter === "all" || s.teacherId === teacherFilter;
      
      // Role-based filtering
      let matchesRole = true;
      if (currentUser?.role === 'teacher') {
        // Teachers can only see their own classes
        matchesRole = s.teacherId?._id === currentUser.id || 
                      s.teacherId === currentUser.id || 
                      s.teacherName === currentUser.name;
      } else if (currentUser?.role === 'student') {
        // Students can only see their own classes
        const currentStudentId = currentUser.id || (currentUser as any)._id || (currentUser as any).studentId;
        const scheduleStudentId = typeof s.studentId === 'object' && s.studentId !== null 
          ? (s.studentId as any)._id || (s.studentId as any).id
          : s.studentId;
        
        matchesRole = scheduleStudentId === currentStudentId || s.studentName === currentUser.name;
        console.log('Student schedule check:', {
          scheduleStudentId,
          currentStudentId,
          studentName: s.studentName,
          currentUserName: currentUser.name,
          matchesRole
        });
      }
      // Admin and team_leader can see all
      
      const result = matchesDay && matchesTeacher && matchesRole;
      if (currentUser?.role === 'student' && matchesDay) {
        console.log('Schedule item:', {
          studentName: s.studentName,
          studentId: s.studentId,
          day: s.day,
          matchesDay,
          matchesRole,
          result
        });
      }
      
      return result;
    });
    console.log('Filtered schedules for student:', filteredSchedules);
    return filteredSchedules;
  };

  const handleAdd = (data: Omit<ClassSchedule, 'id'>) => {
    createSchedule.mutate(data, {
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() - 7)))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-semibold">
            {weekDates[0].month} {weekDates[0].date} - {weekDates[6].month} {weekDates[6].date}
          </div>
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() + 7)))}>
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
              {teachers.map((teacher) => {
                const teacherId = (teacher as any)._id || teacher.id;
                return (
                  <SelectItem key={teacherId} value={teacherId}>{teacher.name}</SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {(currentUser?.role === 'admin' || currentUser?.role === 'team_leader' || currentUser?.role === 'sales_team') && (
            <Button className="gap-2" onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Class
            </Button>
          )}
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
                {getSchedulesByDay(day).map((slot, index) => (
                  <div
                    key={slot.id || slot._id || `schedule-${day}-${index}`}
                    className={cn(
                      "p-3 rounded-lg bg-card border-l-4 shadow-soft hover:shadow-medium transition-all cursor-pointer group",
                      statusConfig[slot.status].color
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge className={cn("text-xs", courseColors[slot.course as keyof typeof courseColors])}>
                        {slot.course}
                      </Badge>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 p-0"
                          onClick={() => { setCurrent(slot); setIsEditOpen(true); }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 p-0 text-destructive"
                          onClick={() => { setCurrent(slot); setIsDeleteOpen(true); }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="font-medium text-sm truncate">{slot.studentName}</p>
                    <p className="text-xs text-muted-foreground truncate">{slot.teacherName}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{slot.time}</span>
                      <span>•</span>
                      <span>{slot.duration}</span>
                    </div>
                    {slot.status === "in_progress" && (
                      <Button size="sm" variant="success" className="w-full mt-2 h-7 text-xs">
                        <Video className="h-3 w-3 mr-1" />
                        Join Now
                      </Button>
                    )}
                  </div>
                ))}
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
