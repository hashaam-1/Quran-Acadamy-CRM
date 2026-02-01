import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, Award, Target, Clock, Users, BookOpen, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const performanceData = [
  { subject: "Attendance", value: 95, icon: Clock, color: "from-success to-success/70" },
  { subject: "Punctuality", value: 88, icon: Target, color: "from-info to-info/70" },
  { subject: "Student Progress", value: 92, icon: TrendingUp, color: "from-primary to-primary/70" },
  { subject: "Class Quality", value: 85, icon: Star, color: "from-warning to-warning/70" },
  { subject: "Homework Review", value: 90, icon: BookOpen, color: "from-accent to-accent/70" },
  { subject: "Communication", value: 87, icon: MessageCircle, color: "from-info to-info/70" },
];

export function TeacherPerformanceChart() {
  const avgScore = Math.round(performanceData.reduce((acc, item) => acc + item.value, 0) / performanceData.length);
  const excellentCount = performanceData.filter(p => p.value >= 90).length;
  const goodCount = performanceData.filter(p => p.value >= 80 && p.value < 90).length;

  return (
    <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-card via-card to-accent/5 animate-slide-up">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-lg shadow-primary/20">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span>Performance Metrics</span>
              <p className="text-xs text-muted-foreground font-normal">Your teaching excellence</p>
            </div>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {/* Overall Score Circle */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <div className="h-24 w-24 rounded-full bg-card flex flex-col items-center justify-center shadow-inner">
                <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {avgScore}%
                </span>
                <span className="text-xs text-muted-foreground">Overall</span>
              </div>
            </div>
            {/* Decorative Ring */}
            <svg className="absolute inset-0 h-32 w-32 -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                fill="none"
                stroke="hsl(var(--primary) / 0.2)"
                strokeWidth="8"
              />
              <circle
                cx="64"
                cy="64"
                r="58"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${avgScore * 3.64} 364`}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-3">
          {performanceData.map((item) => {
            const Icon = item.icon;
            const isExcellent = item.value >= 90;
            
            return (
              <div 
                key={item.subject}
                className={cn(
                  "p-3 rounded-xl border transition-all hover:shadow-md group cursor-pointer",
                  isExcellent && "border-success/30 bg-success/5"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center bg-gradient-to-br",
                    item.color
                  )}>
                    <Icon className="h-4 w-4 text-background" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.subject}</span>
                      <span className={cn(
                        "text-sm font-bold",
                        isExcellent ? "text-success" : "text-foreground"
                      )}>
                        {item.value}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <Progress value={item.value} className="h-2" />
                  {isExcellent && (
                    <Star className="absolute -top-1 right-0 h-4 w-4 text-warning fill-warning" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Summary Badges */}
        <div className="flex justify-center gap-3 mt-4">
          <Badge className="bg-success/15 text-success border-success/30 px-3 py-1">
            <Star className="h-3 w-3 mr-1 fill-success" />
            {excellentCount} Excellent
          </Badge>
          <Badge className="bg-info/15 text-info border-info/30 px-3 py-1">
            <TrendingUp className="h-3 w-3 mr-1" />
            {goodCount} Good
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
