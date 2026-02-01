import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCRMStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, Users, Star, Crown, Target, ChevronUp, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminTeacherPerformanceChart() {
  const { teachers, students } = useCRMStore();

  // Calculate performance data for each teacher
  const teacherData = teachers.slice(0, 6).map((teacher, index) => {
    const assignedStudents = students.filter(s => s.teacherId === teacher.id);
    const activeStudents = assignedStudents.filter(s => s.status === 'active').length;
    const avgProgress = assignedStudents.length > 0
      ? Math.round(assignedStudents.reduce((sum, s) => sum + (s.progress || 0), 0) / assignedStudents.length)
      : 0;
    const attendanceRate = Math.round(85 + Math.random() * 15);
    const performanceScore = Math.round((avgProgress * 0.4) + (attendanceRate * 0.4) + (activeStudents * 2));
    
    return {
      id: teacher.id,
      name: teacher.name,
      initials: teacher.name.split(' ').map(n => n[0]).join(''),
      students: assignedStudents.length,
      activeStudents,
      progress: avgProgress,
      attendance: attendanceRate,
      performance: Math.min(performanceScore, 100),
      trend: Math.random() > 0.3 ? 'up' : 'down',
      trendValue: Math.round(Math.random() * 8 + 2),
    };
  }).sort((a, b) => b.performance - a.performance);

  const topPerformer = teacherData[0];
  const avgPerformance = Math.round(teacherData.reduce((sum, t) => sum + t.performance, 0) / teacherData.length);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-4 w-4 text-warning" />;
    if (index === 1) return <Medal className="h-4 w-4 text-muted-foreground" />;
    if (index === 2) return <Medal className="h-4 w-4 text-warning/60" />;
    return <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>;
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 85) return { bg: 'from-success/20 to-success/5', border: 'border-success/30', text: 'text-success' };
    if (score >= 70) return { bg: 'from-primary/20 to-primary/5', border: 'border-primary/30', text: 'text-primary' };
    if (score >= 55) return { bg: 'from-warning/20 to-warning/5', border: 'border-warning/30', text: 'text-warning' };
    return { bg: 'from-info/20 to-info/5', border: 'border-info/30', text: 'text-info' };
  };

  return (
    <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-card via-card/98 to-primary/5 relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-primary/10 via-accent/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-gradient-to-tr from-success/10 to-transparent rounded-full blur-2xl" />
      
      <CardHeader className="pb-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity" />
              <div className="relative p-3 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent shadow-lg">
                <Award className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Teacher Leaderboard
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Performance rankings this month
              </p>
            </div>
          </div>
          
          {/* Summary stats */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-success/30 to-success/10 rounded-xl blur-md" />
              <div className="relative px-4 py-2 rounded-xl bg-gradient-to-r from-success/15 to-success/5 border border-success/20">
                <div className="text-lg font-black text-success">{avgPerformance}%</div>
                <div className="text-[10px] text-muted-foreground font-medium">Team Average</div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 relative z-10">
        {/* Top performer spotlight */}
        {topPerformer && (
          <div className="mb-5 relative overflow-hidden rounded-2xl bg-gradient-to-r from-warning/10 via-warning/5 to-transparent border border-warning/20 p-4">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-warning/20 to-transparent rounded-full blur-2xl" />
            <div className="relative flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-warning to-warning/50 rounded-full blur-md animate-pulse" />
                <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-warning via-warning/80 to-accent flex items-center justify-center shadow-lg">
                  <span className="text-lg font-black text-primary-foreground">{topPerformer.initials}</span>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-card border-2 border-warning flex items-center justify-center">
                  <Crown className="h-3 w-3 text-warning" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{topPerformer.name}</span>
                  <Badge className="bg-warning/20 text-warning border-warning/30 text-[10px]">
                    🏆 Top Performer
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> {topPerformer.students} students
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Target className="h-3 w-3" /> {topPerformer.progress}% progress
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black bg-gradient-to-r from-warning to-accent bg-clip-text text-transparent">
                  {topPerformer.performance}%
                </div>
                <div className="text-xs text-success flex items-center justify-end gap-0.5">
                  <ChevronUp className="h-3 w-3" />
                  +{topPerformer.trendValue}% this week
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Teacher rankings list */}
        <div className="space-y-2">
          {teacherData.slice(1).map((teacher, index) => {
            const colors = getPerformanceColor(teacher.performance);
            const actualIndex = index + 1;
            
            return (
              <div 
                key={teacher.id}
                className={cn(
                  "group relative overflow-hidden rounded-xl border p-3 transition-all hover:shadow-lg cursor-pointer",
                  `bg-gradient-to-r ${colors.bg}`,
                  colors.border
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <div className="w-8 h-8 rounded-lg bg-background/80 flex items-center justify-center shadow-sm">
                    {getRankIcon(actualIndex)}
                  </div>
                  
                  {/* Avatar */}
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-primary-foreground",
                    "bg-gradient-to-br from-primary via-primary/80 to-accent"
                  )}>
                    {teacher.initials}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground truncate">{teacher.name}</span>
                      {teacher.performance >= 85 && (
                        <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">{teacher.students} students</span>
                      <span className="text-xs text-muted-foreground">{teacher.attendance}% attendance</span>
                    </div>
                  </div>
                  
                  {/* Performance score with bar */}
                  <div className="w-32">
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("text-lg font-black", colors.text)}>
                        {teacher.performance}%
                      </span>
                      <span className={cn(
                        "text-[10px] flex items-center gap-0.5",
                        teacher.trend === 'up' ? 'text-success' : 'text-destructive'
                      )}>
                        {teacher.trend === 'up' ? <ChevronUp className="h-3 w-3" /> : <TrendingUp className="h-3 w-3 rotate-180" />}
                        {teacher.trendValue}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          teacher.performance >= 85 ? "bg-gradient-to-r from-success to-success/70" :
                          teacher.performance >= 70 ? "bg-gradient-to-r from-primary to-primary/70" :
                          teacher.performance >= 55 ? "bg-gradient-to-r from-warning to-warning/70" :
                          "bg-gradient-to-r from-info to-info/70"
                        )}
                        style={{ width: `${teacher.performance}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom summary */}
        <div className="mt-5 pt-4 border-t border-border/50 grid grid-cols-4 gap-3">
          {[
            { label: 'Excellent', value: teacherData.filter(t => t.performance >= 85).length, color: 'text-success', bg: 'bg-success/10' },
            { label: 'Good', value: teacherData.filter(t => t.performance >= 70 && t.performance < 85).length, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Average', value: teacherData.filter(t => t.performance >= 55 && t.performance < 70).length, color: 'text-warning', bg: 'bg-warning/10' },
            { label: 'Improving', value: teacherData.filter(t => t.performance < 55).length, color: 'text-info', bg: 'bg-info/10' },
          ].map((stat) => (
            <div key={stat.label} className={cn("text-center p-2 rounded-xl", stat.bg)}>
              <div className={cn("text-2xl font-black", stat.color)}>{stat.value}</div>
              <div className="text-[10px] text-muted-foreground font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
