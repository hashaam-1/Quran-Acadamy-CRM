import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore, UserRole } from "@/lib/auth-store";
import {
  LayoutDashboard,
  GraduationCap,
  UserCog,
  Calendar,
  ClipboardCheck,
  TrendingUp,
  Receipt,
  Monitor,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MessageSquare,
  Target,
  Users,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ['admin', 'sales_team', 'team_leader', 'teacher', 'student'] },
  { name: "Leads", href: "/leads", icon: Target, roles: ['admin', 'sales_team'] },
  { name: "Students", href: "/students", icon: GraduationCap, roles: ['admin', 'sales_team', 'team_leader', 'teacher'] },
  { name: "Teachers", href: "/teachers", icon: UserCog, roles: ['admin', 'team_leader'] },
  { name: "Team", href: "/team-management", icon: Users, roles: ['admin'] },
  { name: "Schedule", href: "/schedule", icon: Calendar, roles: ['admin', 'sales_team', 'team_leader', 'teacher', 'student'] },
  { name: "Attendance", href: "/attendance", icon: ClipboardCheck, roles: ['admin', 'sales_team', 'team_leader', 'teacher', 'student'] },
  { name: "Progress", href: "/progress", icon: TrendingUp, roles: ['admin', 'sales_team', 'team_leader', 'teacher', 'student'] },
  { name: "Invoices", href: "/invoices", icon: Receipt, roles: ['admin', 'sales_team', 'student'] },
  { name: "Monitoring", href: "/monitoring", icon: Monitor, roles: ['admin', 'sales_team', 'team_leader'] },
  { name: "Syllabus", href: "/syllabus", icon: BookOpen, roles: ['admin', 'sales_team', 'teacher', 'student'] },
  { name: "Messages", href: "/messages", icon: MessageSquare, roles: ['admin', 'sales_team', 'team_leader', 'teacher'] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ['admin'] },
];

const roleLabels: Record<UserRole, { label: string; color: string }> = {
  admin: { label: 'Admin', color: 'bg-destructive/10 text-destructive' },
  sales_team: { label: 'Sales', color: 'bg-info/10 text-info' },
  team_leader: { label: 'Team Lead', color: 'bg-accent/10 text-accent' },
  teacher: { label: 'Teacher', color: 'bg-success/10 text-success' },
  student: { label: 'Student', color: 'bg-primary/10 text-primary' },
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const filteredNavigation = navigation.filter(item => 
    currentUser ? item.roles.includes(currentUser.role) : false
  );

  return (
    <aside
      className={cn(
        "gradient-sidebar flex flex-col border-r border-sidebar-border transition-all duration-300 ease-in-out",
        collapsed ? "w-[70px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="h-9 w-9 rounded-lg gradient-accent flex items-center justify-center shadow-glow">
              <BookOpen className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-sidebar-foreground text-lg tracking-tight">Quran CRM</h1>
              <p className="text-[10px] text-sidebar-foreground/60 font-medium">Academy Manager</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="h-9 w-9 rounded-lg gradient-accent flex items-center justify-center shadow-glow mx-auto">
            <BookOpen className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-20 z-10 h-6 w-6 rounded-full border bg-background text-foreground hover:bg-muted"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive && "drop-shadow-sm")} />
              {!collapsed && (
                <span className="animate-fade-in truncate">{item.name}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-sidebar-border">
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent/50",
            collapsed && "justify-center"
          )}
        >
          <div className="h-8 w-8 rounded-full gradient-accent flex items-center justify-center text-sidebar-primary-foreground font-semibold text-sm shrink-0">
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{currentUser?.name || 'User'}</p>
              <Badge className={cn("text-[10px] h-4", currentUser ? roleLabels[currentUser.role].color : '')}>
                {currentUser ? roleLabels[currentUser.role].label : 'Guest'}
              </Badge>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent shrink-0"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
