import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const funnelStages = [
  { stage: "Total Leads", count: 328, percentage: 100, color: "from-primary to-primary/80" },
  { stage: "Contacted", count: 245, percentage: 75, color: "from-info to-info/80" },
  { stage: "Demo Scheduled", count: 156, percentage: 48, color: "from-accent to-accent/80" },
  { stage: "Trial Class", count: 98, percentage: 30, color: "from-warning to-warning/80" },
  { stage: "Enrolled", count: 72, percentage: 22, color: "from-success to-success/80" },
];

export function SalesConversionChart() {
  const conversionRate = Math.round((funnelStages[funnelStages.length - 1].count / funnelStages[0].count) * 100);

  return (
    <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-card via-card to-success/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center shadow-lg shadow-success/20">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <span>Conversion Funnel</span>
              <p className="text-xs text-muted-foreground font-normal">Lead to enrollment journey</p>
            </div>
          </CardTitle>
          <Badge className="bg-gradient-to-r from-success/20 to-success/10 text-success border-success/30 px-3 py-1.5 text-sm font-bold">
            {conversionRate}% Rate
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {funnelStages.map((item, index) => {
            const widthPercent = 100 - (index * 15);
            
            return (
              <div key={item.stage} className="relative">
                <div 
                  className="relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer group"
                  style={{ width: `${widthPercent}%`, marginLeft: `${(100 - widthPercent) / 2}%` }}
                >
                  <div className={cn("h-14 bg-gradient-to-r shadow-lg", item.color)}>
                    <div className="absolute inset-0 flex items-center justify-between px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-background/20 backdrop-blur-sm flex items-center justify-center">
                          {index === funnelStages.length - 1 ? (
                            <CheckCircle className="h-4 w-4 text-background" />
                          ) : (
                            <Target className="h-4 w-4 text-background" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-background">{item.stage}</p>
                          <p className="text-[10px] text-background/70">{item.percentage}% of total</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-background">{item.count}</p>
                      </div>
                    </div>
                  </div>
                </div>
                {index < funnelStages.length - 1 && (
                  <div className="flex justify-center my-1">
                    <div className="h-4 w-px bg-gradient-to-b from-muted-foreground/30 to-transparent" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Total Leads</p>
            <p className="text-lg font-bold text-primary">{funnelStages[0].count}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Enrolled</p>
            <p className="text-lg font-bold text-success">{funnelStages[funnelStages.length - 1].count}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">In Pipeline</p>
            <p className="text-lg font-bold text-warning">{funnelStages[0].count - funnelStages[funnelStages.length - 1].count}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
