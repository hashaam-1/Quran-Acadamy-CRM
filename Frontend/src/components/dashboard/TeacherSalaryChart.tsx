import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Award, Wallet, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const salaryData = [
  { month: "Jul", base: 2500, bonus: 250, total: 2750 },
  { month: "Aug", base: 2500, bonus: 300, total: 2800 },
  { month: "Sep", base: 2500, bonus: 180, total: 2680 },
  { month: "Oct", base: 2650, bonus: 320, total: 2970 },
  { month: "Nov", base: 2650, bonus: 280, total: 2930 },
  { month: "Dec", base: 2650, bonus: 350, total: 3000 },
];

export function TeacherSalaryChart() {
  const totalEarnings = salaryData.reduce((acc, item) => acc + item.total, 0);
  const avgMonthly = Math.round(totalEarnings / salaryData.length);
  const totalBonus = salaryData.reduce((acc, item) => acc + item.bonus, 0);
  const maxSalary = Math.max(...salaryData.map(s => s.total));
  const currentMonth = salaryData[salaryData.length - 1];
  const growth = ((currentMonth.total - salaryData[0].total) / salaryData[0].total * 100).toFixed(1);

  return (
    <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-teal-400/20 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      
      <CardHeader className="pb-4 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm flex items-center justify-center shadow-xl border border-white/10">
              <Wallet className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <span className="text-white">Salary Overview</span>
              <p className="text-sm text-emerald-200/80 font-normal">6-month earnings report</p>
            </div>
          </CardTitle>
          <Badge className="bg-white/10 backdrop-blur-sm text-emerald-200 border-white/20 px-4 py-2 text-sm">
            <TrendingUp className="h-4 w-4 mr-2" />+{growth}%
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10">
        {/* Beautiful Bar Chart */}
        <div className="flex items-end gap-3 h-[180px] mb-6 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
          {salaryData.map((item, index) => {
            const heightPercent = (item.total / maxSalary) * 100;
            const bonusPercent = (item.bonus / item.total) * 100;
            const isCurrentMonth = index === salaryData.length - 1;
            
            return (
              <div key={item.month} className="flex-1 flex flex-col items-center gap-3">
                <div className="relative w-full group">
                  {/* Tooltip */}
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white text-emerald-900 px-3 py-2 rounded-lg shadow-xl text-xs font-medium whitespace-nowrap z-20">
                    <div className="font-bold">${item.total}</div>
                    <div className="text-emerald-600">Base: ${item.base}</div>
                    <div className="text-amber-600">Bonus: ${item.bonus}</div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-8 border-transparent border-t-white" />
                  </div>
                  
                  <div 
                    className={cn(
                      "w-full rounded-xl relative overflow-hidden transition-all duration-500 cursor-pointer hover:scale-105 hover:shadow-xl",
                      isCurrentMonth && "ring-2 ring-emerald-300 ring-offset-2 ring-offset-emerald-900"
                    )}
                    style={{ height: `${heightPercent * 1.6}px`, minHeight: '40px' }}
                  >
                    {/* Base salary bar */}
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-400 via-emerald-500 to-emerald-400" 
                      style={{ height: `${100 - bonusPercent}%` }} 
                    />
                    {/* Bonus bar */}
                    <div 
                      className="absolute top-0 left-0 right-0 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-400" 
                      style={{ height: `${bonusPercent}%` }} 
                    />
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  isCurrentMonth ? "text-emerald-300 font-bold" : "text-emerald-200/70"
                )}>{item.month}</span>
              </div>
            );
          })}
        </div>

        {/* Current Month Highlight */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-white/15 via-white/10 to-white/5 backdrop-blur-sm border border-white/20 mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-300 to-teal-400 flex items-center justify-center shadow-lg">
                <DollarSign className="h-7 w-7 text-emerald-900" />
              </div>
              <div>
                <p className="text-sm text-emerald-200/80">This Month's Earnings</p>
                <p className="text-3xl font-bold text-white tracking-tight">${currentMonth.total.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="flex items-center gap-2 bg-amber-400/20 px-3 py-1.5 rounded-lg">
                <Award className="h-5 w-5 text-amber-400" />
                <span className="text-lg font-bold text-amber-300">+${currentMonth.bonus}</span>
              </div>
              <p className="text-xs text-emerald-200/60">Bonus earned</p>
            </div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Sparkles className="h-4 w-4 text-emerald-300" />
            </div>
            <p className="text-2xl font-bold text-white">${totalEarnings.toLocaleString()}</p>
            <p className="text-[11px] text-emerald-200/60 uppercase tracking-wider mt-1">Total Earned</p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-400/5 backdrop-blur-sm border border-amber-400/20 hover:border-amber-400/30 transition-all">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Award className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-300">${totalBonus}</p>
            <p className="text-[11px] text-emerald-200/60 uppercase tracking-wider mt-1">Total Bonus</p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-teal-400/20 to-teal-400/5 backdrop-blur-sm border border-teal-400/20 hover:border-teal-400/30 transition-all">
            <div className="flex items-center justify-center gap-1 mb-2">
              <TrendingUp className="h-4 w-4 text-teal-300" />
            </div>
            <p className="text-2xl font-bold text-teal-300">${avgMonthly}</p>
            <p className="text-[11px] text-emerald-200/60 uppercase tracking-wider mt-1">Avg/Month</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
