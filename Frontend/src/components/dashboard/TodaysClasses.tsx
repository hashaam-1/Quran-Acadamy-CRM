import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, Clock, User, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassSession {
  id: string;
  studentName: string;
  teacherName: string;
  course: string;
  time: string;
  status: "upcoming" | "ongoing" | "completed" | "missed";
}

const mockClasses: ClassSession[] = [
  { id: "1", studentName: "Ahmed Hassan", teacherName: "Ustaz Bilal", course: "Hifz", time: "09:00 AM", status: "completed" },
  { id: "2", studentName: "Sara Khan", teacherName: "Ustaza Maryam", course: "Tajweed", time: "10:30 AM", status: "completed" },
  { id: "3", studentName: "Yusuf Ibrahim", teacherName: "Ustaz Omar", course: "Qaida", time: "02:00 PM", status: "ongoing" },
  { id: "4", studentName: "Fatima Ali", teacherName: "Ustaza Aisha", course: "Nazra", time: "04:30 PM", status: "upcoming" },
  { id: "5", studentName: "Hamza Ahmed", teacherName: "Ustaz Bilal", course: "Hifz", time: "06:00 PM", status: "upcoming" },
];

const statusConfig = {
  upcoming: { label: "Upcoming", variant: "info" as const, dotColor: "bg-info" },
  ongoing: { label: "Ongoing", variant: "success" as const, dotColor: "bg-success animate-pulse" },
  completed: { label: "Completed", variant: "muted" as const, dotColor: "bg-muted-foreground" },
  missed: { label: "Missed", variant: "destructive" as const, dotColor: "bg-destructive" },
};

export function TodaysClasses() {
  return (
    <Card className="animate-slide-up stagger-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Today's Classes</CardTitle>
        <Button variant="ghost" size="sm" className="text-primary">
          Full Schedule <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockClasses.map((session) => (
            <div
              key={session.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border transition-colors",
                session.status === "ongoing" && "bg-success/5 border-success/20",
                session.status === "upcoming" && "bg-card hover:bg-muted/50",
                session.status === "completed" && "bg-muted/30",
                session.status === "missed" && "bg-destructive/5 border-destructive/20"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
                      statusConfig[session.status].dotColor
                    )}
                  />
                </div>
                <div>
                  <p className="font-medium text-sm">{session.studentName}</p>
                  <p className="text-xs text-muted-foreground">{session.teacherName} • {session.course}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {session.time}
                  </div>
                  <Badge variant={statusConfig[session.status].variant} className="mt-1">
                    {statusConfig[session.status].label}
                  </Badge>
                </div>
                {session.status === "ongoing" && (
                  <Button size="sm" variant="success" className="ml-2">
                    <Video className="h-4 w-4 mr-1" />
                    Join
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
