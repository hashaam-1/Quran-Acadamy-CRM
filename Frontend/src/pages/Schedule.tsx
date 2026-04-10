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
  Grid3x3,
  List,
  ClipboardCheck,
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

const courseBlockColors: Record<string, string> = {
  Qaida: "bg-blue-500",
  Nazra: "bg-red-500",
  Hifz: "bg-yellow-500",
  Tajweed: "bg-green-500",
};

// Generate time slots from 12 AM to 11 PM
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    const period = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    slots.push({
      hour,
      label: `${displayHour} ${period}`,
    });
  }
  return slots;
};

const timeSlots = generateTimeSlots();

// Parse time string to hour (24-hour format)
const parseTimeToHour = (timeStr: string): number => {
  const match = timeStr.match(/(\d+):?(\d+)?\s*(AM|PM)/i);
  if (!match) return 0;
  
  let hour = parseInt(match[1]);
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }
  
  return hour;
};

// Calculate duration in hours
const parseDuration = (durationStr: string): number => {
  const match = durationStr.match(/(\d+)\s*min/);
  if (match) {
    return parseInt(match[1]) / 60;
  }
  return 1;
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

  // Get schedules for a specific day and time slot (for grid view)
  const getSchedulesForSlot = (day: string, hour: number) => {
    return getSchedulesByDay(day).filter(schedule => {
      const scheduleHour = parseTimeToHour(schedule.time);
      const duration = parseDuration(schedule.duration);
      return hour >= scheduleHour && hour < scheduleHour + duration;
    });
  };

  // Count classes per day (for grid view)
  const getClassCountForDay = (day: string) => {
    return getSchedulesByDay(day).length;
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

        <Card variant="stat" className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedToday}</p>
                <p className="text-sm text-muted-foreground">Completed Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="stat" className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{schedules.length}</p>
                <p className="text-sm text-muted-foreground">Total Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="animate-slide-up overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              {/* Header Row - Days */}
              <div className="grid grid-cols-8 border-b bg-muted/30">
                <div className="p-4 border-r text-sm font-semibold">Time</div>
                {weekDates.map((date) => (
                  <div
                    key={date.day}
                    className={cn(
                      "p-4 text-center border-r last:border-r-0",
                      date.isToday && "bg-primary/10"
                    )}
                  >
                    <div className="font-semibold text-sm">{date.day}</div>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                        date.isToday ? "bg-green-500 text-white" : "bg-muted"
                      )}>
                        {getClassCountForDay(date.day)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Slots Grid */}
              <div className="relative">
                {timeSlots.map((slot) => (
                  <div key={slot.hour} className="grid grid-cols-8 border-b hover:bg-muted/20 transition-colors">
                    {/* Time Label */}
                    <div className="p-2 border-r text-xs text-muted-foreground font-medium flex items-center justify-center">
                      {slot.label}
                    </div>

                    {/* Day Columns */}
                    {weekDays.map((day) => {
                      return (
                        <div
                          key={`${day}-${slot.hour}`}
                          className={cn(
                            "border-r last:border-r-0 h-[100px] relative",
                            weekDates.find(d => d.day === day)?.isToday && "bg-primary/5"
                          )}
                        >
                          {/* Render schedules for this specific time slot */}
                          {getSchedulesForSlot(day, slot.hour).map((schedule, idx) => {
                            const scheduleHour = parseTimeToHour(schedule.time);
                            const isFirstSlot = slot.hour === scheduleHour;
                            
                            // Only render on the first slot of the schedule
                            if (!isFirstSlot) return null;

                            const duration = parseDuration(schedule.duration);
                            const totalHeight = duration * 100; // 100px per hour

                            return (
                              <div
                                key={schedule.id || schedule._id || idx}
                                className={cn(
                                  "absolute left-1 right-1 rounded-lg border-l-4 shadow-soft hover:shadow-medium transition-all cursor-pointer group overflow-hidden",
                                  statusConfig[schedule.status].color
                                )}
                                style={{
                                  backgroundColor: courseBlockColors[schedule.course as keyof typeof courseBlockColors] ? 
                                    `${courseBlockColors[schedule.course as keyof typeof courseBlockColors]}50` : 
                                    'transparent',
                                  top: '2px',
                                  height: `${totalHeight - 4}px`,
                                  zIndex: 10
                                }}
                                onClick={() => { setCurrent(schedule); setIsEditOpen(true); }}
                              >
                                <div className="p-2 h-full flex flex-col">
                                  <div className="flex items-start justify-between gap-1 mb-1">
                                    <Badge className={cn("text-xs", courseColors[schedule.course as keyof typeof courseColors])}>
                                      {schedule.course}
                                    </Badge>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-5 w-5 p-0"
                                        onClick={(e) => { e.stopPropagation(); setCurrent(schedule); setIsEditOpen(true); }}
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-5 w-5 p-0 text-destructive"
                                        onClick={(e) => { e.stopPropagation(); setCurrent(schedule); setIsDeleteOpen(true); }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <p className="font-medium text-sm truncate">{schedule.studentName}</p>
                                  <p className="text-xs text-muted-foreground truncate">{schedule.teacherName}</p>
                                  <div className="flex items-center gap-1 mt-auto text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>{schedule.time}</span>
                                    <span>â¢</span>
                                    <span>{schedule.duration}</span>
                                  </div>
                                  {schedule.status === "in_progress" && (
                                    <Button size="sm" variant="success" className="w-full mt-1 h-6 text-xs">
                                      <Video className="h-3 w-3 mr-1" />
                                      Join Now
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Show empty slot if no schedule */}
                          {getSchedulesForSlot(day, slot.hour).length === 0 && (
                            <div className="h-full bg-gray-50 hover:bg-gray-100 transition-colors"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-6">
        <div className="text-sm font-semibold">Course Types:</div>
        {Object.entries(courseBlockColors).map(([course, color]) => (
          <div key={course} className="flex items-center gap-2">
            <div className={cn("w-4 h-4 rounded", color)}></div>
            <span className="text-sm">{course}</span>
          </div>
        ))}
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
