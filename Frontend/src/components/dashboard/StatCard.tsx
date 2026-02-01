import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatDetail {
  label: string;
  value: string | number;
  color?: "primary" | "secondary" | "accent" | "success" | "warning" | "destructive" | "info" | "muted";
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: "primary" | "secondary" | "accent" | "success" | "warning" | "destructive" | "info";
  className?: string;
  progress?: number;
  subtitle?: string;
  details?: StatDetail[];
}

const iconColors = {
  primary: "bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm",
  secondary: "bg-gradient-to-br from-secondary/20 to-secondary/5 text-secondary shadow-sm",
  accent: "bg-gradient-to-br from-accent/20 to-accent/5 text-accent shadow-sm",
  success: "bg-gradient-to-br from-success/20 to-success/5 text-success shadow-sm",
  warning: "bg-gradient-to-br from-warning/20 to-warning/5 text-warning shadow-sm",
  destructive: "bg-gradient-to-br from-destructive/20 to-destructive/5 text-destructive shadow-sm",
  info: "bg-gradient-to-br from-info/20 to-info/5 text-info shadow-sm",
};

const gradientColors = {
  primary: "from-primary/15 via-primary/5 to-transparent",
  secondary: "from-secondary/15 via-secondary/5 to-transparent",
  accent: "from-accent/15 via-accent/5 to-transparent",
  success: "from-success/15 via-success/5 to-transparent",
  warning: "from-warning/15 via-warning/5 to-transparent",
  destructive: "from-destructive/15 via-destructive/5 to-transparent",
  info: "from-info/15 via-info/5 to-transparent",
};

const accentColors = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
};

const detailTextColors = {
  primary: "text-primary",
  secondary: "text-secondary",
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  info: "text-info",
  muted: "text-muted-foreground",
};

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "primary",
  className,
  progress,
  subtitle,
  details,
}: StatCardProps) {
  return (
    <Card 
      variant="stat" 
      className={cn(
        "animate-fade-in group relative overflow-hidden transition-all duration-300 hover:shadow-medium hover:-translate-y-1 border-0",
        className
      )}
    >
      {/* Background gradient overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity duration-300 group-hover:opacity-80",
        gradientColors[iconColor]
      )} />
      
      {/* Decorative corner accent */}
      <div className={cn(
        "absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10 blur-2xl transition-all duration-500 group-hover:opacity-25 group-hover:scale-125",
        accentColors[iconColor]
      )} />
      
      {/* Bottom decorative line */}
      <div className={cn(
        "absolute bottom-0 left-0 h-1 w-0 transition-all duration-500 group-hover:w-full",
        accentColors[iconColor]
      )} />
      
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight lg:text-4xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">{value}</p>
              {subtitle && (
                <span className="text-sm font-medium text-muted-foreground">{subtitle}</span>
              )}
            </div>
            
            {/* Detail breakdown pills */}
            {details && details.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {details.map((detail, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted/50 backdrop-blur-sm border border-border/50",
                      detailTextColors[detail.color || "muted"]
                    )}
                  >
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      detail.color ? accentColors[detail.color as keyof typeof accentColors] : "bg-muted-foreground"
                    )} />
                    {detail.value} {detail.label}
                  </div>
                ))}
              </div>
            )}
            
            {change && (
              <p
                className={cn(
                  "text-xs font-semibold flex items-center gap-1.5 mt-1",
                  changeType === "positive" && "text-success",
                  changeType === "negative" && "text-destructive",
                  changeType === "neutral" && "text-muted-foreground"
                )}
              >
                {changeType === "positive" && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-success/20">
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                    </svg>
                  </span>
                )}
                {changeType === "negative" && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-destructive/20">
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                )}
                {change}
              </p>
            )}
          </div>
          <div className={cn(
            "p-3.5 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
            iconColors[iconColor]
          )}>
            <Icon className="h-6 w-6 lg:h-7 lg:w-7" />
          </div>
        </div>
        
        {/* Progress bar */}
        {progress !== undefined && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Progress</span>
              <span className={cn("text-xs font-bold", detailTextColors[iconColor])}>{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden backdrop-blur-sm">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden",
                  accentColors[iconColor]
                )}
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
