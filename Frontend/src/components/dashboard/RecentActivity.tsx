import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  CreditCard,
  Calendar,
  MessageSquare,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeads } from "@/hooks/useLeads";
import { useStudents } from "@/hooks/useStudents";
import { useInvoices } from "@/hooks/useInvoices";
import { useSchedules } from "@/hooks/useSchedules";
import { useAttendance } from "@/hooks/useAttendance";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  type: "lead" | "payment" | "class" | "message" | "attendance" | "alert";
  title: string;
  description: string;
  time: string;
}


const typeConfig = {
  lead: { icon: UserPlus, color: "text-info bg-info/10" },
  payment: { icon: CreditCard, color: "text-success bg-success/10" },
  class: { icon: Calendar, color: "text-accent bg-accent/10" },
  message: { icon: MessageSquare, color: "text-primary bg-primary/10" },
  attendance: { icon: CheckCircle, color: "text-success bg-success/10" },
  alert: { icon: AlertCircle, color: "text-warning bg-warning/10" },
};

export function RecentActivity() {
  const { data: leads = [] } = useLeads();
  const { data: students = [] } = useStudents();
  const { data: invoices = [] } = useInvoices();
  const { data: schedules = [] } = useSchedules();
  const { data: attendance = [] } = useAttendance();

  // Combine and sort all activities by date
  const activities: Activity[] = [];

  // Add recent leads
  leads
    .sort((a, b) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime())
    .slice(0, 3)
    .forEach(lead => {
      activities.push({
        id: `lead-${lead.id || lead._id}`,
        type: 'lead',
        title: 'New Lead Added',
        description: `${lead.name} - ${lead.status}`,
        time: formatDistanceToNow(new Date(lead.createdAt || lead.date || Date.now()), { addSuffix: true }),
      });
    });

  // Add recent payments
  invoices
    .filter(inv => inv.status === 'paid' || inv.paidAmount > 0)
    .sort((a, b) => new Date(b.updatedAt || b.date || 0).getTime() - new Date(a.updatedAt || a.date || 0).getTime())
    .slice(0, 2)
    .forEach(invoice => {
      activities.push({
        id: `payment-${invoice.id || invoice._id}`,
        type: 'payment',
        title: 'Payment Received',
        description: `$${invoice.paidAmount} from ${invoice.studentName || 'Student'}`,
        time: formatDistanceToNow(new Date(invoice.updatedAt || invoice.date || Date.now()), { addSuffix: true }),
      });
    });

  // Add recent completed classes
  schedules
    .filter(sch => sch.status === 'completed')
    .sort((a, b) => new Date(b.updatedAt || b.date || 0).getTime() - new Date(a.updatedAt || a.date || 0).getTime())
    .slice(0, 2)
    .forEach(schedule => {
      activities.push({
        id: `class-${schedule.id || schedule._id}`,
        type: 'class',
        title: 'Class Completed',
        description: `${schedule.course} with ${schedule.teacherName || 'Teacher'}`,
        time: formatDistanceToNow(new Date(schedule.updatedAt || schedule.date || Date.now()), { addSuffix: true }),
      });
    });

  // Add recent attendance
  const todayAttendance = attendance.filter(att => {
    const attDate = new Date(att.date);
    const today = new Date();
    return attDate.toDateString() === today.toDateString();
  });
  
  if (todayAttendance.length > 0) {
    const presentCount = todayAttendance.filter(a => a.status === 'present').length;
    activities.push({
      id: 'attendance-today',
      type: 'attendance',
      title: 'Attendance Marked',
      description: `${presentCount} students present today`,
      time: formatDistanceToNow(new Date(todayAttendance[0].date), { addSuffix: true }),
    });
  }

  // Add recent students
  students
    .filter(s => s.status === 'active')
    .sort((a, b) => new Date(b.createdAt || b.enrollmentDate || 0).getTime() - new Date(a.createdAt || a.enrollmentDate || 0).getTime())
    .slice(0, 2)
    .forEach(student => {
      activities.push({
        id: `student-${student.id || student._id}`,
        type: 'lead',
        title: 'New Student Enrolled',
        description: `${student.name} - ${student.course || 'Course'}`,
        time: formatDistanceToNow(new Date(student.createdAt || student.enrollmentDate || Date.now()), { addSuffix: true }),
      });
    });

  // Sort all activities by time (most recent first)
  const sortedActivities = activities
    .sort((a, b) => {
      // Extract time value for sorting
      const getTimeValue = (timeStr: string) => {
        if (timeStr.includes('second')) return 1;
        if (timeStr.includes('minute')) return parseInt(timeStr) || 60;
        if (timeStr.includes('hour')) return (parseInt(timeStr) || 1) * 60;
        if (timeStr.includes('day')) return (parseInt(timeStr) || 1) * 1440;
        return 10000;
      };
      return getTimeValue(a.time) - getTimeValue(b.time);
    })
    .slice(0, 6);

  return (
    <Card className="animate-slide-up stagger-5">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
          ) : (
            sortedActivities.map((activity) => {
              const config = typeConfig[activity.type];
              const Icon = config.icon;
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-lg shrink-0", config.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
