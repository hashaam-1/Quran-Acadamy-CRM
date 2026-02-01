import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Video,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  TrendingUp,
  Eye,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveClass {
  id: string;
  studentName: string;
  teacherName: string;
  course: string;
  startTime: string;
  duration: number;
  elapsed: number;
  status: "on_time" | "late" | "ongoing" | "extended";
}

interface ClassSummary {
  total: number;
  completed: number;
  ongoing: number;
  upcoming: number;
  missed: number;
  late: number;
}

const mockLiveClasses: LiveClass[] = [
  { id: "1", studentName: "Ahmed Hassan", teacherName: "Ustaz Bilal", course: "Hifz", startTime: "14:00", duration: 45, elapsed: 30, status: "ongoing" },
  { id: "2", studentName: "Sara Khan", teacherName: "Ustaza Maryam", course: "Tajweed", startTime: "14:15", duration: 30, elapsed: 20, status: "ongoing" },
  { id: "3", studentName: "Yusuf Ibrahim", teacherName: "Ustaz Omar", course: "Qaida", startTime: "14:00", duration: 30, elapsed: 35, status: "extended" },
  { id: "4", studentName: "Fatima Ahmed", teacherName: "Ustaza Aisha", course: "Nazra", startTime: "14:30", duration: 45, elapsed: 5, status: "on_time" },
  { id: "5", studentName: "Omar Sheikh", teacherName: "Ustaz Ibrahim", course: "Hifz", startTime: "14:00", duration: 60, elapsed: 0, status: "late" },
];

const summary: ClassSummary = {
  total: 28,
  completed: 15,
  ongoing: 5,
  upcoming: 5,
  missed: 2,
  late: 1,
};

const statusConfig = {
  on_time: { label: "On Time", variant: "success" as const, color: "bg-success" },
  late: { label: "Late Start", variant: "warning" as const, color: "bg-warning" },
  ongoing: { label: "In Progress", variant: "info" as const, color: "bg-info animate-pulse" },
  extended: { label: "Extended", variant: "accent" as const, color: "bg-accent" },
};

interface TeacherPerformance {
  id: string;
  name: string;
  classesCompleted: number;
  totalClasses: number;
  onTimeRate: number;
  avgRating: number;
  status: "excellent" | "good" | "needs_improvement";
}

const mockTeacherPerformance: TeacherPerformance[] = [
  { id: "1", name: "Ustaz Bilal", classesCompleted: 6, totalClasses: 6, onTimeRate: 100, avgRating: 4.9, status: "excellent" },
  { id: "2", name: "Ustaza Maryam", classesCompleted: 5, totalClasses: 6, onTimeRate: 92, avgRating: 4.8, status: "excellent" },
  { id: "3", name: "Ustaz Omar", classesCompleted: 4, totalClasses: 5, onTimeRate: 85, avgRating: 4.6, status: "good" },
  { id: "4", name: "Ustaza Aisha", classesCompleted: 2, totalClasses: 4, onTimeRate: 100, avgRating: 4.9, status: "excellent" },
  { id: "5", name: "Ustaz Ibrahim", classesCompleted: 0, totalClasses: 2, onTimeRate: 0, avgRating: 0, status: "needs_improvement" },
];

const performanceConfig = {
  excellent: { label: "Excellent", variant: "success" as const },
  good: { label: "Good", variant: "info" as const },
  needs_improvement: { label: "Needs Improvement", variant: "warning" as const },
};

export default function Monitoring() {
  return (
    <MainLayout title="Class Monitoring" subtitle="Live class tracking and supervision">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card variant="stat" className="animate-slide-up stagger-1">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{summary.total}</p>
            <p className="text-xs text-muted-foreground">Total Today</p>
          </CardContent>
        </Card>
        <Card variant="stat" className="animate-slide-up stagger-2">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{summary.completed}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card variant="stat" className="animate-slide-up stagger-3">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-info">{summary.ongoing}</p>
            <p className="text-xs text-muted-foreground">Ongoing</p>
          </CardContent>
        </Card>
        <Card variant="stat" className="animate-slide-up stagger-4">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{summary.upcoming}</p>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
        <Card variant="stat" className="animate-slide-up stagger-5">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">{summary.late}</p>
            <p className="text-xs text-muted-foreground">Late</p>
          </CardContent>
        </Card>
        <Card variant="stat" className="animate-slide-up stagger-5">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{summary.missed}</p>
            <p className="text-xs text-muted-foreground">Missed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Classes */}
        <Card className="animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Live Classes
            </CardTitle>
            <Button variant="ghost" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockLiveClasses.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "p-4 rounded-lg border transition-all",
                  session.status === "late" && "bg-warning/5 border-warning/20",
                  session.status === "extended" && "bg-accent/5 border-accent/20",
                  (session.status === "ongoing" || session.status === "on_time") && "bg-card"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Video className="h-5 w-5 text-primary" />
                      </div>
                      <span className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
                        statusConfig[session.status].color
                      )} />
                    </div>
                    <div>
                      <p className="font-medium">{session.studentName}</p>
                      <p className="text-sm text-muted-foreground">{session.teacherName}</p>
                    </div>
                  </div>
                  <Badge variant={statusConfig[session.status].variant}>
                    {statusConfig[session.status].label}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                  <span>{session.course}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {session.elapsed}/{session.duration} min
                  </span>
                </div>

                <Progress 
                  value={(session.elapsed / session.duration) * 100} 
                  className="h-2"
                />

                <div className="flex items-center gap-2 mt-3">
                  <Button variant="outline" size="sm" className="flex-1 gap-1">
                    <Eye className="h-3 w-3" />
                    Observe
                  </Button>
                  {session.status === "late" && (
                    <Button variant="outline" size="sm" className="text-warning">
                      <AlertTriangle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Teacher Performance */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Teacher Performance Today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockTeacherPerformance.map((teacher) => (
              <div
                key={teacher.id}
                className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                      {teacher.name.split(" ").slice(1).map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-medium">{teacher.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {teacher.classesCompleted}/{teacher.totalClasses} classes
                      </p>
                    </div>
                  </div>
                  <Badge variant={performanceConfig[teacher.status].variant}>
                    {performanceConfig[teacher.status].label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">On-Time Rate</p>
                    <div className="flex items-center gap-2">
                      <Progress value={teacher.onTimeRate} className="h-2 flex-1" />
                      <span className="font-medium">{teacher.onTimeRate}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg Rating</p>
                    <p className="font-medium">
                      {teacher.avgRating > 0 ? `★ ${teacher.avgRating}` : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <Card className="mt-6 animate-slide-up border-warning/50 bg-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            Active Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium">Class Not Started</p>
                  <p className="text-sm text-muted-foreground">Omar Sheikh's class with Ustaz Ibrahim is 15 minutes late</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Take Action
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium">Extended Class</p>
                  <p className="text-sm text-muted-foreground">Yusuf Ibrahim's class has exceeded the scheduled duration</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Notify
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
