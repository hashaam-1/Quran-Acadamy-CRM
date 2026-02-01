import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const pipelineData = [
  { stage: "New Leads", count: 45, color: "hsl(var(--primary))" },
  { stage: "Contacted", count: 32, color: "hsl(var(--info))" },
  { stage: "Demo Done", count: 24, color: "hsl(var(--warning))" },
  { stage: "Trial Class", count: 18, color: "hsl(var(--accent))" },
  { stage: "Converted", count: 12, color: "hsl(var(--success))" },
];

export function SalesLeadsPipelineChart() {
  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          Leads Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pipelineData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis 
                dataKey="stage" 
                type="category" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={11}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  boxShadow: "0 10px 40px -10px hsl(var(--primary) / 0.2)",
                }}
              />
              <Bar dataKey="count" radius={[0, 8, 8, 0]} name="Leads">
                {pipelineData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {pipelineData.map((item) => (
            <div 
              key={item.stage} 
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-xs"
            >
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground">{item.stage}:</span>
              <span className="font-semibold">{item.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
