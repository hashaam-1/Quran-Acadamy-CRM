import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCRMStore, leaveReasons } from "@/lib/store";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { UserMinus } from "lucide-react";

const COLORS = [
  'hsl(160, 45%, 25%)',   // primary
  'hsl(45, 70%, 55%)',    // accent
  'hsl(200, 80%, 50%)',   // info
  'hsl(145, 60%, 40%)',   // success
  'hsl(38, 92%, 50%)',    // warning
  'hsl(0, 72%, 51%)',     // destructive
  'hsl(280, 60%, 50%)',   // purple
  'hsl(160, 15%, 45%)',   // muted
];

export function StudentLeaveChart() {
  const { studentLeaves } = useCRMStore();

  // Calculate leave reason statistics
  const leaveData = leaveReasons.map((reason, index) => ({
    name: reason.length > 20 ? reason.substring(0, 20) + '...' : reason,
    fullName: reason,
    value: studentLeaves.filter(l => l.reason === reason).length,
    color: COLORS[index % COLORS.length],
  })).filter(d => d.value > 0);

  const totalLeaves = studentLeaves.length;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-medium">
          <p className="text-sm font-medium text-foreground">{payload[0].payload.fullName}</p>
          <p className="text-sm text-muted-foreground">
            Count: <span className="font-semibold text-foreground">{payload[0].value}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {((payload[0].value / totalLeaves) * 100).toFixed(1)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="gradient-card shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
            <UserMinus className="h-4 w-4 text-destructive" />
          </div>
          Student Leave Reasons
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center mb-2">
          <span className="text-sm text-muted-foreground">
            Total Students Left: <span className="font-semibold text-foreground">{totalLeaves}</span>
          </span>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={leaveData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {leaveData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="vertical" 
                align="right" 
                verticalAlign="middle"
                wrapperStyle={{ fontSize: '11px', paddingLeft: '10px' }}
                formatter={(value, entry: any) => (
                  <span className="text-foreground">{value} ({entry.payload.value})</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {leaveData.slice(0, 4).map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground truncate">{item.fullName}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
