import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCRMStore } from "@/lib/store";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Calendar } from "lucide-react";

export function TeamLeaderScheduleChart() {
  const { schedules } = useCRMStore();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const scheduleData = days.map((day) => {
    const daySchedules = schedules.filter(s => s.day === day);
    const completed = daySchedules.filter(s => s.status === 'completed').length;
    const scheduled = daySchedules.filter(s => s.status === 'scheduled').length;
    const cancelled = daySchedules.filter(s => s.status === 'cancelled').length;

    return {
      name: day.slice(0, 3),
      completed,
      scheduled,
      cancelled,
      total: daySchedules.length,
    };
  });

  const totalClasses = schedules.length;
  const completedClasses = schedules.filter(s => s.status === 'completed').length;
  const completionRate = totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-medium">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="animate-slide-up overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-info/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <Calendar className="h-5 w-5 text-info" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Weekly Schedule</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Class distribution by day</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-success">{completionRate}%</p>
            <p className="text-xs text-muted-foreground">Completion Rate</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={scheduleData}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorScheduled" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="completed" 
                name="Completed"
                stroke="hsl(var(--success))" 
                fillOpacity={1} 
                fill="url(#colorCompleted)" 
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="scheduled" 
                name="Scheduled"
                stroke="hsl(var(--info))" 
                fillOpacity={1} 
                fill="url(#colorScheduled)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
