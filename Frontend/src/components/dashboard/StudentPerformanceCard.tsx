import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Award, Target, BookOpen } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useProgressByStudent } from "@/hooks/useProgress";
import { useHomeworkByStudent } from "@/hooks/useHomework";

export function StudentPerformanceCard() {
  const { currentUser } = useAuthStore();
  const studentId = currentUser?.id || (currentUser as any)?._id || (currentUser as any)?.studentId;
  
  const { data: progressRecords = [] } = useProgressByStudent(studentId || '');
  const { data: homeworkList = [] } = useHomeworkByStudent(studentId || '');

  // Get latest progress
  const latestProgress = progressRecords[0];
  const overallProgress = (currentUser as any)?.progress || 0;

  // Calculate homework completion rate
  const completedHomework = homeworkList.filter((h: any) => h.status === 'completed').length;
  const totalHomework = homeworkList.length;
  const homeworkRate = totalHomework > 0 ? Math.round((completedHomework / totalHomework) * 100) : 0;

  // Performance metrics
  const metrics = [
    {
      label: 'Overall Progress',
      value: overallProgress,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Homework Completion',
      value: homeworkRate,
      icon: BookOpen,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: 'Current Lesson',
      value: latestProgress?.lesson || 'Not started',
      icon: Target,
      color: 'text-info',
      bgColor: 'bg-info/10',
      isText: true,
    },
  ];

  // Determine performance level
  const getPerformanceLevel = () => {
    const avgScore = (overallProgress + homeworkRate) / 2;
    if (avgScore >= 80) return { label: 'Excellent', color: 'text-success', icon: '🌟' };
    if (avgScore >= 60) return { label: 'Good', color: 'text-info', icon: '👍' };
    if (avgScore >= 40) return { label: 'Average', color: 'text-warning', icon: '📚' };
    return { label: 'Needs Improvement', color: 'text-destructive', icon: '💪' };
  };

  const performance = getPerformanceLevel();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Performance</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Your learning metrics</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${performance.color} flex items-center gap-1`}>
              <span>{performance.icon}</span>
              <span>{performance.label}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {metrics.map((metric, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </div>
                <span className="text-sm font-medium">{metric.label}</span>
              </div>
              <span className="text-sm font-bold">
                {metric.isText ? (
                  <span className="text-xs text-muted-foreground max-w-[120px] truncate inline-block">
                    {metric.value}
                  </span>
                ) : (
                  `${metric.value}%`
                )}
              </span>
            </div>
            {!metric.isText && (
              <Progress value={metric.value as number} className="h-2" />
            )}
          </div>
        ))}

        {/* Latest Progress Details */}
        {latestProgress && (
          <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/50">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Latest Update</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Lesson:</span>
                <span className="font-medium">{latestProgress.lesson}</span>
              </div>
              {latestProgress.sabqi && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sabqi:</span>
                  <span className="font-medium capitalize">{latestProgress.sabqi}</span>
                </div>
              )}
              {latestProgress.manzil && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Manzil:</span>
                  <span className="font-medium">{latestProgress.manzil}</span>
                </div>
              )}
              {latestProgress.notes && (
                <div className="mt-2 text-xs text-muted-foreground italic">
                  "{latestProgress.notes}"
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
