import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useSchedules } from "@/hooks/useSchedules";
import { useTeachers } from "@/hooks/useTeachers";
import { cn } from "@/lib/utils";

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Generate time slots from 12 AM to 11 PM
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    const period = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    slots.push({
      hour,
      label: `${displayHour} ${period}`,
      fullLabel: `${displayHour}:00 ${period}`
    });
  }
  return slots;
};

const timeSlots = generateTimeSlots();

// Course colors matching the image
const courseColors: Record<string, string> = {
  Qaida: "bg-blue-500",
  Nazra: "bg-red-500",
  Hifz: "bg-yellow-500",
  Tajweed: "bg-green-500",
};

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
    return parseInt(match[1]) / 60; // Convert minutes to hours
  }
  return 1; // Default 1 hour
};

export default function TutorSchedule() {
  const { data: schedules = [] } = useSchedules();
  const { data: teachers = [] } = useTeachers();
  const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentWeek, setCurrentWeek] = useState(new Date());

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

  // Filter schedules
  const filteredSchedules = schedules.filter(schedule => {
    const matchesTeacher = selectedTeacher === "all" || schedule.teacherId === selectedTeacher;
    const matchesSearch = !searchQuery || 
      schedule.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.teacherName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTeacher && matchesSearch;
  });

  // Get schedules for a specific day and time slot
  const getSchedulesForSlot = (day: string, hour: number) => {
    return filteredSchedules.filter(schedule => {
      if (schedule.day !== day) return false;
      const scheduleHour = parseTimeToHour(schedule.time);
      const duration = parseDuration(schedule.duration);
      return hour >= scheduleHour && hour < scheduleHour + duration;
    });
  };

  // Count classes per day
  const getClassCountForDay = (day: string) => {
    return filteredSchedules.filter(s => s.day === day).length;
  };

  return (
    <MainLayout title="Tutor Schedule" subtitle="Time-based schedule view">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() - 7)))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-semibold">
            {weekDates[0].month} {weekDates[0].date} - {weekDates[6].month} {weekDates[6].date}
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() + 7)))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentWeek(new Date())}>
            Today
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
          <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Teacher" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teachers</SelectItem>
              {teachers.map((teacher) => {
                const teacherId = (teacher as any)._id || teacher.id;
                return (
                  <SelectItem key={teacherId} value={teacherId}>
                    {teacher.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button className="bg-teal-600 hover:bg-teal-700">
            Search
          </Button>
        </div>
      </div>

      {/* Schedule Grid */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              {/* Header Row - Days */}
              <div className="grid grid-cols-8 border-b bg-muted/30">
                <div className="p-4 border-r"></div>
                {weekDates.map((date, index) => (
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
                      const schedulesInSlot = getSchedulesForSlot(day, slot.hour);
                      const hasSchedule = schedulesInSlot.length > 0;

                      return (
                        <div
                          key={`${day}-${slot.hour}`}
                          className={cn(
                            "border-r last:border-r-0 min-h-[60px] relative",
                            weekDates.find(d => d.day === day)?.isToday && "bg-primary/5"
                          )}
                        >
                          {hasSchedule ? (
                            <div className="absolute inset-0 p-1">
                              {schedulesInSlot.map((schedule, idx) => {
                                const scheduleHour = parseTimeToHour(schedule.time);
                                const isFirstSlot = slot.hour === scheduleHour;
                                
                                if (!isFirstSlot) return null;

                                const duration = parseDuration(schedule.duration);
                                const heightMultiplier = duration;

                                return (
                                  <div
                                    key={schedule.id || schedule._id || idx}
                                    className={cn(
                                      "rounded p-2 text-white text-xs overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer",
                                      courseColors[schedule.course as keyof typeof courseColors] || "bg-gray-500"
                                    )}
                                    style={{
                                      height: `${heightMultiplier * 60}px`,
                                      minHeight: '60px'
                                    }}
                                    title={`${schedule.studentName} - ${schedule.teacherName}\n${schedule.time} (${schedule.duration})`}
                                  >
                                    <div className="font-semibold truncate">{schedule.studentName}</div>
                                    <div className="text-[10px] opacity-90 truncate">{schedule.teacherName}</div>
                                    <div className="text-[10px] opacity-80 mt-1">{schedule.time}</div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
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
        {Object.entries(courseColors).map(([course, color]) => (
          <div key={course} className="flex items-center gap-2">
            <div className={cn("w-4 h-4 rounded", color)}></div>
            <span className="text-sm">{course}</span>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}
