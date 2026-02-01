import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";
import { useCRMStore } from "@/lib/store";
import { toast } from "sonner";
import {
  UserPlus,
  Calendar,
  Receipt,
  MessageSquare,
  ClipboardList,
  Bell,
  Users,
  BookOpen,
  TrendingUp,
  Video,
} from "lucide-react";

// Form imports
import { LeadForm } from "@/components/forms/LeadForm";
import { StudentForm } from "@/components/forms/StudentForm";
import { ScheduleForm } from "@/components/forms/ScheduleForm";
import { InvoiceForm } from "@/components/forms/InvoiceForm";
import { AttendanceForm } from "@/components/forms/AttendanceForm";
import { ProgressForm } from "@/components/forms/ProgressForm";
import { HomeworkForm } from "@/components/forms/HomeworkForm";
import { WhatsAppForm } from "@/components/forms/WhatsAppForm";
import { RescheduleForm } from "@/components/forms/RescheduleForm";
import { AssignTeacherForm } from "@/components/forms/AssignTeacherForm";
import { ViewHomeworkDialog } from "@/components/forms/ViewHomeworkDialog";
import { ViewProgressDialog } from "@/components/forms/ViewProgressDialog";

type ActionKey = 
  | 'add_lead' | 'schedule_class' | 'create_invoice' | 'send_whatsapp' 
  | 'mark_attendance' | 'send_reminder' | 'add_student' | 'fee_reminder'
  | 'assign_teacher' | 'view_attendance' | 'view_progress' | 'join_class'
  | 'update_progress' | 'add_homework' | 'message_student' | 'request_reschedule'
  | 'view_homework' | 'check_progress' | 'pay_fee' | 'message_teacher' | 'schedule_trial';

interface ActionItem {
  icon: React.ElementType;
  label: string;
  color: string;
  key: ActionKey;
}

const adminActions: ActionItem[] = [
  { icon: UserPlus, label: "Add Lead", color: "bg-info/10 text-info hover:bg-info/20", key: 'add_lead' },
  { icon: Calendar, label: "Schedule Class", color: "bg-accent/10 text-accent hover:bg-accent/20", key: 'schedule_class' },
  { icon: Receipt, label: "Create Invoice", color: "bg-success/10 text-success hover:bg-success/20", key: 'create_invoice' },
  { icon: MessageSquare, label: "Send WhatsApp", color: "bg-primary/10 text-primary hover:bg-primary/20", key: 'send_whatsapp' },
  { icon: ClipboardList, label: "Mark Attendance", color: "bg-warning/10 text-warning hover:bg-warning/20", key: 'mark_attendance' },
  { icon: Bell, label: "Send Reminder", color: "bg-destructive/10 text-destructive hover:bg-destructive/20", key: 'send_reminder' },
];

const salesActions: ActionItem[] = [
  { icon: UserPlus, label: "Add Lead", color: "bg-info/10 text-info hover:bg-info/20", key: 'add_lead' },
  { icon: Calendar, label: "Schedule Trial", color: "bg-accent/10 text-accent hover:bg-accent/20", key: 'schedule_trial' },
  { icon: Receipt, label: "Create Invoice", color: "bg-success/10 text-success hover:bg-success/20", key: 'create_invoice' },
  { icon: MessageSquare, label: "Send WhatsApp", color: "bg-primary/10 text-primary hover:bg-primary/20", key: 'send_whatsapp' },
  { icon: Users, label: "Add Student", color: "bg-warning/10 text-warning hover:bg-warning/20", key: 'add_student' },
  { icon: Bell, label: "Fee Reminder", color: "bg-destructive/10 text-destructive hover:bg-destructive/20", key: 'fee_reminder' },
];

const teamLeaderActions: ActionItem[] = [
  { icon: Users, label: "Assign Teacher", color: "bg-info/10 text-info hover:bg-info/20", key: 'assign_teacher' },
  { icon: Calendar, label: "Schedule Class", color: "bg-accent/10 text-accent hover:bg-accent/20", key: 'schedule_class' },
  { icon: ClipboardList, label: "View Attendance", color: "bg-success/10 text-success hover:bg-success/20", key: 'view_attendance' },
  { icon: TrendingUp, label: "View Progress", color: "bg-primary/10 text-primary hover:bg-primary/20", key: 'view_progress' },
];

const teacherActions: ActionItem[] = [
  { icon: Video, label: "Join Class", color: "bg-info/10 text-info hover:bg-info/20", key: 'join_class' },
  { icon: ClipboardList, label: "Mark Attendance", color: "bg-accent/10 text-accent hover:bg-accent/20", key: 'mark_attendance' },
  { icon: TrendingUp, label: "Update Progress", color: "bg-success/10 text-success hover:bg-success/20", key: 'update_progress' },
  { icon: BookOpen, label: "Add Homework", color: "bg-primary/10 text-primary hover:bg-primary/20", key: 'add_homework' },
  { icon: MessageSquare, label: "Message Student", color: "bg-warning/10 text-warning hover:bg-warning/20", key: 'message_student' },
  { icon: Calendar, label: "Request Reschedule", color: "bg-destructive/10 text-destructive hover:bg-destructive/20", key: 'request_reschedule' },
];

const studentActions: ActionItem[] = [
  { icon: Video, label: "Join Class", color: "bg-info/10 text-info hover:bg-info/20", key: 'join_class' },
  { icon: BookOpen, label: "View Homework", color: "bg-accent/10 text-accent hover:bg-accent/20", key: 'view_homework' },
  { icon: TrendingUp, label: "Check Progress", color: "bg-success/10 text-success hover:bg-success/20", key: 'check_progress' },
  { icon: Receipt, label: "Pay Fee", color: "bg-primary/10 text-primary hover:bg-primary/20", key: 'pay_fee' },
  { icon: MessageSquare, label: "Message Teacher", color: "bg-warning/10 text-warning hover:bg-warning/20", key: 'message_teacher' },
];

export function QuickActions() {
  const { currentUser } = useAuthStore();
  const { addLead, addStudent, addSchedule, addInvoice } = useCRMStore();
  const role = currentUser?.role || 'admin';

  // Dialog states
  const [leadFormOpen, setLeadFormOpen] = useState(false);
  const [studentFormOpen, setStudentFormOpen] = useState(false);
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [attendanceFormOpen, setAttendanceFormOpen] = useState(false);
  const [progressFormOpen, setProgressFormOpen] = useState(false);
  const [homeworkFormOpen, setHomeworkFormOpen] = useState(false);
  const [whatsappFormOpen, setWhatsappFormOpen] = useState(false);
  const [rescheduleFormOpen, setRescheduleFormOpen] = useState(false);
  const [assignTeacherFormOpen, setAssignTeacherFormOpen] = useState(false);
  const [viewHomeworkOpen, setViewHomeworkOpen] = useState(false);
  const [viewProgressOpen, setViewProgressOpen] = useState(false);

  const getActionsForRole = (): ActionItem[] => {
    switch (role) {
      case 'sales_team':
        return salesActions;
      case 'team_leader':
        return teamLeaderActions;
      case 'teacher':
        return teacherActions;
      case 'student':
        return studentActions;
      default:
        return adminActions;
    }
  };

  const handleAction = (key: ActionKey) => {
    switch (key) {
      case 'add_lead':
        setLeadFormOpen(true);
        break;
      case 'add_student':
        setStudentFormOpen(true);
        break;
      case 'schedule_class':
      case 'schedule_trial':
        setScheduleFormOpen(true);
        break;
      case 'create_invoice':
      case 'pay_fee':
        setInvoiceFormOpen(true);
        break;
      case 'mark_attendance':
      case 'view_attendance':
        setAttendanceFormOpen(true);
        break;
      case 'update_progress':
      case 'view_progress':
        setProgressFormOpen(true);
        break;
      case 'add_homework':
        setHomeworkFormOpen(true);
        break;
      case 'view_homework':
        setViewHomeworkOpen(true);
        break;
      case 'check_progress':
        setViewProgressOpen(true);
        break;
      case 'send_whatsapp':
      case 'message_student':
      case 'message_teacher':
        setWhatsappFormOpen(true);
        break;
      case 'request_reschedule':
        setRescheduleFormOpen(true);
        break;
      case 'assign_teacher':
        setAssignTeacherFormOpen(true);
        break;
      case 'send_reminder':
      case 'fee_reminder':
        setWhatsappFormOpen(true);
        break;
      case 'join_class':
        toast.info("Opening class session...", { description: "Connecting to your scheduled class" });
        break;
    }
  };

  const actions = getActionsForRole();

  return (
    <>
      <Card className="animate-slide-up stagger-4">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {actions.map((action) => (
              <Button
                key={action.key}
                variant="ghost"
                onClick={() => handleAction(action.key)}
                className={`h-auto py-4 flex flex-col items-center gap-2 ${action.color} transition-all duration-200`}
              >
                <action.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form Dialogs */}
      <LeadForm
        open={leadFormOpen}
        onOpenChange={setLeadFormOpen}
        mode="add"
        onSubmit={(lead) => {
          addLead(lead);
          toast.success("Lead added successfully");
        }}
      />

      <StudentForm
        open={studentFormOpen}
        onOpenChange={setStudentFormOpen}
        mode="add"
        onSubmit={(student) => {
          addStudent(student);
          toast.success("Student added successfully");
        }}
      />

      <ScheduleForm
        open={scheduleFormOpen}
        onOpenChange={setScheduleFormOpen}
        mode="add"
        onSubmit={(schedule) => {
          addSchedule(schedule);
          toast.success("Class scheduled successfully");
        }}
      />

      <InvoiceForm
        open={invoiceFormOpen}
        onOpenChange={setInvoiceFormOpen}
        mode="add"
        onSubmit={(invoice) => {
          addInvoice(invoice);
          toast.success("Invoice created successfully");
        }}
      />

      <AttendanceForm
        open={attendanceFormOpen}
        onOpenChange={setAttendanceFormOpen}
      />

      <ProgressForm
        open={progressFormOpen}
        onOpenChange={setProgressFormOpen}
      />

      <HomeworkForm
        open={homeworkFormOpen}
        onOpenChange={setHomeworkFormOpen}
      />

      <WhatsAppForm
        open={whatsappFormOpen}
        onOpenChange={setWhatsappFormOpen}
      />

      <RescheduleForm
        open={rescheduleFormOpen}
        onOpenChange={setRescheduleFormOpen}
      />

      <AssignTeacherForm
        open={assignTeacherFormOpen}
        onOpenChange={setAssignTeacherFormOpen}
      />

      <ViewHomeworkDialog
        open={viewHomeworkOpen}
        onOpenChange={setViewHomeworkOpen}
      />

      <ViewProgressDialog
        open={viewProgressOpen}
        onOpenChange={setViewProgressOpen}
      />
    </>
  );
}
