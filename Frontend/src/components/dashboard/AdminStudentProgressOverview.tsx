import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { TrendingUp, BookOpen, Users, Award, GraduationCap, Target, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminStudentProgressOverviewProps {
  students: any[];
}

export function AdminStudentProgressOverview({ students }: AdminStudentProgressOverviewProps) {
  // Calculate accurate statistics from student data
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'active');
  
  // Calculate average progress
  const avgProgress = totalStudents > 0
    ? Math.round(students.reduce((sum, s) => sum + (s.progress || 0), 0) / totalStudents)
    : 0;
  
  // Progress distribution
  const progressRanges = [
    { range: '0-20%', min: 0, max: 20, color: 'hsl(var(--destructive))' },
    { range: '21-40%', min: 21, max: 40, color: 'hsl(var(--warning))' },
    { range: '41-60%', min: 41, max: 60, color: 'hsl(var(--info))' },
    { range: '61-80%', min: 61, max: 80, color: 'hsl(var(--primary))' },
    { range: '81-100%', min: 81, max: 100, color: 'hsl(var(--success))' },
  ];

  const progressDistribution = progressRanges.map(range => ({
    name: range.range,
    students: students.filter(s => (s.progress || 0) >= range.min && (s.progress || 0) <= range.max).length,
    color: range.color
  }));

  // Progress by course
  const courseProgress = ['Qaida', 'Nazra', 'Hifz', 'Tajweed'].map(course => {
    const courseStudents = students.filter(s => s.course === course);
    const avgCourseProgress = courseStudents.length > 0
      ? Math.round(courseStudents.reduce((sum, s) => sum + (s.progress || 0), 0) / courseStudents.length)
      : 0;
    
    return {
      course,
      progress: avgCourseProgress,
      students: courseStudents.length,
      active: courseStudents.filter(s => s.status === 'active').length
    };
  });

  // Top performers
  const topPerformers = [...students]
    .filter(s => s.progress > 0)
    .sort((a, b) => (b.progress || 0) - (a.progress || 0))
    .slice(0, 5);

  // Students needing attention (low progress)
  const needsAttention = students.filter(s => (s.progress || 0) < 30 && s.status === 'active').length;
  const onTrack = students.filter(s => (s.progress || 0) >= 30 && (s.progress || 0) < 70 && s.status === 'active').length;
  const excelling = students.filter(s => (s.progress || 0) >= 70 && s.status === 'active').length;

  const performanceData = [
    { name: 'Needs Attention', value: needsAttention, color: '#ef4444' },
    { name: 'On Track', value: onTrack, color: '#3b82f6' },
    { name: 'Excelling', value: excelling, color: '#22c55e' },
  ];

  return (
    <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-card via-card/95 to-primary/10 relative">
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-2xl" />
      
      <CardHeader className="pb-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity" />
              <div className="relative p-3 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent shadow-lg">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Student Progress Overview
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Comprehensive learning analytics
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-primary/10 rounded-xl blur-md" />
              <div className="relative px-4 py-2 rounded-xl bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/20">
                <div className="text-lg font-black text-primary">{avgProgress}%</div>
                <div className="text-[10px] text-muted-foreground font-medium">Avg Progress</div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-success/30 to-success/10 rounded-xl blur-md" />
              <div className="relative px-4 py-2 rounded-xl bg-gradient-to-r from-success/15 to-success/5 border border-success/20">
                <div className="text-lg font-black text-success">{activeStudents.length}</div>
                <div className="text-[10px] text-muted-foreground font-medium">Active Students</div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 relative z-10">
        <div className="grid grid-cols-12 gap-6">
          {/* Left side - Charts */}
          <div className="col-span-8 space-y-6">
            {/* Progress by Course */}
            <div className="rounded-2xl bg-gradient-to-br from-muted/30 to-transparent p-5 border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Progress by Course
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={courseProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="course" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'progress') return [`${value}%`, 'Avg Progress'];
                      if (name === 'students') return [value, 'Total Students'];
                      if (name === 'active') return [value, 'Active'];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="progress" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Progress Distribution */}
            <div className="rounded-2xl bg-gradient-to-br from-muted/30 to-transparent p-5 border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Target className="h-4 w-4 text-accent" />
                  Progress Distribution
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={progressDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="students" radius={[8, 8, 0, 0]}>
                    {progressDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right side - Stats and Top Performers */}
          <div className="col-span-4 space-y-4">
            {/* Performance Categories Pie Chart */}
            <div className="rounded-2xl bg-gradient-to-br from-muted/30 to-transparent p-4 border border-border/50">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Award className="h-4 w-4 text-warning" />
                Performance Categories
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={performanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {performanceData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performers */}
            <div className="rounded-2xl bg-gradient-to-br from-muted/30 to-transparent p-4 border border-border/50">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-warning" />
                Top Performers
              </h3>
              <div className="space-y-2">
                {topPerformers.length > 0 ? (
                  topPerformers.map((student, index) => (
                    <div key={student.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                          index === 0 ? "bg-warning/20 text-warning" :
                          index === 1 ? "bg-muted-foreground/20 text-muted-foreground" :
                          index === 2 ? "bg-warning/10 text-warning/70" :
                          "bg-muted text-muted-foreground"
                        )}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-xs font-medium truncate max-w-[120px]">{student.name}</div>
                          <div className="text-[10px] text-muted-foreground">{student.course}</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-primary">{student.progress}%</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-xs text-muted-foreground">
                    No progress data yet
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-gradient-to-br from-success/10 to-success/5 p-3 border border-success/20">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-3.5 w-3.5 text-success" />
                  <span className="text-[10px] text-muted-foreground font-medium">Excelling</span>
                </div>
                <div className="text-xl font-black text-success">{excelling}</div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-warning/10 to-warning/5 p-3 border border-warning/20">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-3.5 w-3.5 text-warning" />
                  <span className="text-[10px] text-muted-foreground font-medium">Needs Help</span>
                </div>
                <div className="text-xl font-black text-warning">{needsAttention}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Details Table */}
        <div className="mt-6 rounded-2xl bg-gradient-to-br from-muted/30 to-transparent p-4 border border-border/50">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-info" />
            Course Breakdown
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {courseProgress.map((course) => (
              <div key={course.course} className="rounded-xl bg-card/50 p-3 border border-border/30">
                <div className="text-xs font-medium text-muted-foreground mb-2">{course.course}</div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Progress</span>
                    <span className="text-sm font-bold text-primary">{course.progress}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Students</span>
                    <span className="text-sm font-bold">{course.students}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Active</span>
                    <span className="text-sm font-bold text-success">{course.active}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Trophy(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
