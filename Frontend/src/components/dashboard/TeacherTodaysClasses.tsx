import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, Video, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassSession {
  id: string;
  studentName: string;
  course: string;
  time: string;
  status: "upcoming" | "in_progress" | "completed";
  lessonTopic: string;
}

const todaysClasses: ClassSession[] = [
  { id: "1", studentName: "Ahmed Ali", course: "Quran Hifz", time: "09:00 AM", status: "completed", lessonTopic: "Surah Al-Baqarah (Verses 1-10)" },
  { id: "2", studentName: "Fatima Khan", course: "Tajweed", time: "10:30 AM", status: "in_progress", lessonTopic: "Makharij Al-Huroof" },
  { id: "3", studentName: "Omar Hassan", course: "Nazra", time: "12:00 PM", status: "upcoming", lessonTopic: "Surah Al-Imran" },
  { id: "4", studentName: "Aisha Rahman", course: "Quran Hifz", time: "02:00 PM", status: "upcoming", lessonTopic: "Revision - Juz 2" },
  { id: "5", studentName: "Yusuf Ahmed", course: "Qaida", time: "03:30 PM", status: "upcoming", lessonTopic: "Arabic Letters - Lesson 5" },
];

const statusConfig = {
  upcoming: { label: "Upcoming", variant: "outline" as const, dotColor: "bg-warning" },
  in_progress: { label: "In Progress", variant: "default" as const, dotColor: "bg-success" },
  completed: { label: "Completed", variant: "secondary" as const, dotColor: "bg-muted-foreground" },
};

export function TeacherTodaysClasses() {
  return (
    <Card className="animate-slide-up">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Today's Classes</CardTitle>
        <Badge variant="outline">{todaysClasses.length} classes</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {todaysClasses.map((session) => {
            const config = statusConfig[session.status];
            return (
              <div
                key={session.id}
                className={cn(
                  "p-3 rounded-lg border transition-all hover:shadow-sm",
                  session.status === "in_progress" && "border-success/50 bg-success/5"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium truncate">{session.studentName}</span>
                      <Badge variant={config.variant} className="text-[10px]">
                        {config.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {session.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {session.course}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      Topic: {session.lessonTopic}
                    </p>
                  </div>
                  {session.status === "in_progress" && (
                    <Button size="sm" className="gap-1 shrink-0">
                      <Video className="h-3 w-3" />
                      Join
                    </Button>
                  )}
                  {session.status === "upcoming" && (
                    <Button size="sm" variant="outline" className="shrink-0">
                      Start
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
