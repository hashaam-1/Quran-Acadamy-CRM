import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, Award, BookOpen, Target, Star } from "lucide-react";

interface ViewProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const progressData = {
  overall: 68,
  subjects: [
    { name: 'Qaida', progress: 85, level: 'Advanced' },
    { name: 'Nazra', progress: 72, level: 'Intermediate' },
    { name: 'Tajweed', progress: 55, level: 'Beginner' },
  ],
  recentAchievements: [
    { title: 'Completed Qaida', date: '2025-12-20', icon: Award },
    { title: 'Perfect Attendance Week', date: '2025-12-27', icon: Star },
    { title: 'Memorized 5 Surahs', date: '2026-01-02', icon: BookOpen },
  ],
  monthlyProgress: [
    { month: 'Oct', score: 45 },
    { month: 'Nov', score: 55 },
    { month: 'Dec', score: 62 },
    { month: 'Jan', score: 68 },
  ],
};

export function ViewProgressDialog({ open, onOpenChange }: ViewProgressDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            My Progress
          </DialogTitle>
          <DialogDescription>Track your learning journey and achievements</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-6">
            {/* Overall Progress */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 via-accent/5 to-success/10 border border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="font-medium text-foreground">Overall Progress</span>
                </div>
                <span className="text-2xl font-bold text-primary">{progressData.overall}%</span>
              </div>
              <Progress value={progressData.overall} className="h-3" />
              <p className="text-xs text-muted-foreground mt-2">Great job! You're on track to complete your goals.</p>
            </div>

            {/* Subject Progress */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Subject Progress
              </h4>
              {progressData.subjects.map((subject) => (
                <div key={subject.name} className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{subject.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{subject.level}</span>
                      <span className="text-sm font-semibold text-foreground">{subject.progress}%</span>
                    </div>
                  </div>
                  <Progress value={subject.progress} className="h-2" />
                </div>
              ))}
            </div>

            {/* Recent Achievements */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Award className="h-4 w-4 text-accent" />
                Recent Achievements
              </h4>
              <div className="space-y-2">
                {progressData.recentAchievements.map((achievement, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 border border-accent/20"
                  >
                    <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                      <achievement.icon className="h-4 w-4 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{achievement.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(achievement.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Trend */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Monthly Progress Trend</h4>
              <div className="flex items-end gap-2 h-24 p-3 rounded-lg bg-muted/30 border border-border">
                {progressData.monthlyProgress.map((month) => (
                  <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t"
                      style={{ height: `${month.score}%` }}
                    />
                    <span className="text-xs text-muted-foreground">{month.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
