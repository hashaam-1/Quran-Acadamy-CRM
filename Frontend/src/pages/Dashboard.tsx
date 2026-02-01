import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { InvoiceReportChart } from "@/components/dashboard/InvoiceReportChart";
import { StudentLeaveChart } from "@/components/dashboard/StudentLeaveChart";
import { AdminTeacherPerformanceChart } from "@/components/dashboard/AdminTeacherPerformanceChart";
import { TeacherSalaryChart } from "@/components/dashboard/TeacherSalaryChart";
import { TeacherPerformanceChart } from "@/components/dashboard/TeacherPerformanceChart";
import { TeacherTodaysClasses } from "@/components/dashboard/TeacherTodaysClasses";
import { TeacherAssignedStudents } from "@/components/dashboard/TeacherAssignedStudents";
import { TeacherUpcomingClasses } from "@/components/dashboard/TeacherUpcomingClasses";
import { AttendanceAlertCard } from "@/components/dashboard/AttendanceAlertCard";
import { StudentProgressChart } from "@/components/dashboard/StudentProgressChart";
import { AdminStudentProgressOverview } from "@/components/dashboard/AdminStudentProgressOverview";
import { StudentUpcomingClasses } from "@/components/dashboard/StudentUpcomingClasses";
import { StudentHomework } from "@/components/dashboard/StudentHomework";
import { StudentAttendanceCard } from "@/components/dashboard/StudentAttendanceCard";
import { StudentPerformanceCard } from "@/components/dashboard/StudentPerformanceCard";
import { TeamLeaderTeacherChart } from "@/components/dashboard/TeamLeaderTeacherChart";
import { TeamLeaderScheduleChart } from "@/components/dashboard/TeamLeaderScheduleChart";
import { SalesLeadsPipelineChart } from "@/components/dashboard/SalesLeadsPipelineChart";
import { SalesConversionChart } from "@/components/dashboard/SalesConversionChart";
import { useAuthStore } from "@/lib/auth-store";
import { useLeads } from "@/hooks/useLeads";
import { useStudents } from "@/hooks/useStudents";
import { useTeachers } from "@/hooks/useTeachers";
import { useInvoices } from "@/hooks/useInvoices";
import { useSchedules } from "@/hooks/useSchedules";
import { useProgressByStudent } from "@/hooks/useProgress";
import { useHomeworkByStudent } from "@/hooks/useHomework";
import {
  GraduationCap,
  UserCog,
  DollarSign,
  Target,
  Calendar,
  TrendingUp,
  Award,
  Clock,
  Users,
  CheckCircle,
  PhoneCall,
  BookOpen,
  Video,
} from "lucide-react";

export default function Dashboard() {
  const { currentUser } = useAuthStore();
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: teachers = [], isLoading: teachersLoading } = useTeachers();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { data: schedules = [], isLoading: schedulesLoading } = useSchedules();
  
  // Student-specific hooks - must be called unconditionally at top level
  const studentId = currentUser?.id || (currentUser as any)?._id || (currentUser as any)?.studentId || '';
  const { data: progressRecords = [] } = useProgressByStudent(studentId || '');
  const { data: homeworkList = [] } = useHomeworkByStudent(studentId || '');

  const studentProgressData = progressRecords;

  const isLoading = leadsLoading || studentsLoading || teachersLoading || invoicesLoading || schedulesLoading;

  if (isLoading) {
    return (
      <MainLayout title="Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  // Role-based data filtering
  const getFilteredData = () => {
    if (currentUser?.role === 'student') {
      // Student sees only their own data
      const studentId = currentUser.id || (currentUser as any).studentId;
      const studentName = currentUser.name;
      
      return {
        leads: [], // Students don't see leads
        students: students.filter(s => s.id === studentId || s.name === studentName),
        teachers: [], // Students don't see teacher stats
        schedules: schedules.filter(s => {
          const scheduleStudentId = typeof s.studentId === 'object' && s.studentId !== null 
            ? (s.studentId as any)._id || (s.studentId as any).id
            : s.studentId;
          return scheduleStudentId === studentId || s.studentName === studentName;
        }),
        invoices: invoices.filter(i => {
          const invoiceStudentId = typeof i.studentId === 'object' && i.studentId !== null 
            ? (i.studentId as any)._id || (i.studentId as any).id
            : i.studentId;
          return invoiceStudentId === studentId || i.studentName === studentName;
        }),
      };
    } else if (currentUser?.role === 'teacher') {
      // Teacher sees their assigned students and their classes
      const teacherId = currentUser.id || (currentUser as any).teacherId;
      const teacherName = currentUser.name;
      
      return {
        leads: [], // Teachers don't see leads
        students: students.filter(s => s.teacherId === teacherId || s.teacher === teacherName),
        teachers: [], // Teachers don't see other teachers
        schedules: schedules.filter(s => s.teacherId === teacherId || s.teacherName === teacherName),
        invoices: invoices.filter(i => {
          const student = students.find(s => s.id === i.studentId || s.name === i.studentName);
          return student && (student.teacherId === teacherId || student.teacher === teacherName);
        }),
      };
    } else if (currentUser?.role === 'sales_team') {
      // Sales team sees only their assigned leads
      const salesEmail = currentUser.email;
      
      return {
        leads: leads.filter(l => l.assignedTo === salesEmail || l.assignedTo === currentUser.name),
        students: [], // Sales team doesn't see students
        teachers: [], // Sales team doesn't see teachers
        schedules: [], // Sales team doesn't see schedules
        invoices: [], // Sales team doesn't see invoices
      };
    } else {
      // Admin and team_leader see all data
      return {
        leads,
        students,
        teachers,
        schedules,
        invoices,
      };
    }
  };

  const filteredData = getFilteredData();

  const totalLeads = filteredData.leads.length;
  const newLeads = filteredData.leads.filter(l => l.status === 'new').length;
  const trialLeads = filteredData.leads.filter(l => l.status === 'trial').length;
  const followUpLeads = filteredData.leads.filter(l => l.status === 'follow_up').length;
  
  const totalStudents = filteredData.students.length;
  const activeStudents = filteredData.students.filter(s => s.status === 'active').length;
  const inactiveStudents = filteredData.students.filter(s => s.status === 'inactive').length;
  const onHoldStudents = filteredData.students.filter(s => s.status === 'on_hold').length;
  
  const totalTeachers = filteredData.teachers.length;
  const activeTeachers = filteredData.teachers.filter(t => t.status !== 'on_leave').length;
  const onLeaveTeachers = filteredData.teachers.filter(t => t.status === 'on_leave').length;
  
  const todaysClasses = filteredData.schedules.filter(s => s.day === 'Monday').length;
  const completedClasses = filteredData.schedules.filter(s => s.status === 'completed').length;
  const scheduledClasses = filteredData.schedules.filter(s => s.status === 'scheduled').length;
  
  const totalRevenue = filteredData.invoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const pendingFees = filteredData.invoices.reduce((sum, i) => sum + (i.amount - i.paidAmount), 0);
  const paidInvoices = filteredData.invoices.filter(i => i.status === 'paid').length;
  const unpaidInvoices = filteredData.invoices.filter(i => i.status !== 'paid').length;

  const role = currentUser?.role || 'admin';

  // Admin Dashboard
  if (role === 'admin') {
    return (
      <MainLayout title="Dashboard" subtitle={`Welcome back, ${currentUser?.name || 'Admin'}`}>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <StatCard
            title="Total Students"
            value={totalStudents}
            icon={GraduationCap}
            iconColor="primary"
            className="stagger-1"
            details={[
              { label: "active", value: activeStudents, color: "success" },
              { label: "on hold", value: onHoldStudents, color: "warning" },
              { label: "inactive", value: inactiveStudents, color: "muted" },
            ]}
          />
          <StatCard
            title="Active Teachers"
            value={totalTeachers}
            icon={UserCog}
            iconColor="accent"
            className="stagger-2"
            details={[
              { label: "active", value: activeTeachers, color: "success" },
              { label: "on leave", value: onLeaveTeachers, color: "warning" },
            ]}
          />
          <StatCard
            title="Total Leads"
            value={totalLeads}
            icon={Target}
            iconColor="info"
            className="stagger-3"
            details={[
              { label: "new", value: newLeads, color: "info" },
              { label: "trial", value: trialLeads, color: "accent" },
              { label: "follow up", value: followUpLeads, color: "warning" },
            ]}
          />
          <StatCard
            title="Today's Classes"
            value={todaysClasses}
            icon={Calendar}
            iconColor="secondary"
            className="stagger-4"
            details={[
              { label: "completed", value: completedClasses, color: "success" },
              { label: "scheduled", value: scheduledClasses, color: "info" },
            ]}
          />
          <StatCard
            title="Revenue (MTD)"
            value={`$${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            iconColor="success"
            className="stagger-5"
            details={[
              { label: "paid", value: paidInvoices, color: "success" },
              { label: "unpaid", value: unpaidInvoices, color: "warning" },
            ]}
          />
          <StatCard
            title="Pending Fees"
            value={`$${pendingFees.toLocaleString()}`}
            icon={DollarSign}
            iconColor="warning"
            className="stagger-5"
            details={[
              { label: "invoices", value: unpaidInvoices, color: "destructive" },
            ]}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <InvoiceReportChart invoices={filteredData.invoices} />
          <StudentLeaveChart />
        </div>

        {/* Student Progress Overview */}
        <div className="mb-6">
          <AdminStudentProgressOverview students={filteredData.students} />
        </div>

        {/* Teacher Performance Chart */}
        <div className="mb-6">
          <AdminTeacherPerformanceChart />
        </div>

        {/* Quick Actions & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickActions />
          <RecentActivity />
        </div>
      </MainLayout>
    );
  }

  // Sales Team Dashboard
  if (role === 'sales_team') {
    const assignedLeads = leads.length;
    const convertedToday = leads.filter(l => l.status === 'enrolled').length;
    const pendingFollowups = leads.filter(l => l.status === 'follow_up').length;
    
    return (
      <MainLayout title="Sales Dashboard" subtitle={`Welcome back, ${currentUser?.name || 'Sales'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Leads Assigned"
            value={assignedLeads}
            icon={Target}
            iconColor="primary"
            className="stagger-1"
            details={[
              { label: "new", value: newLeads, color: "info" },
              { label: "trial", value: trialLeads, color: "accent" },
              { label: "follow up", value: followUpLeads, color: "warning" },
            ]}
          />
          <StatCard
            title="Converted"
            value={convertedToday}
            icon={CheckCircle}
            iconColor="success"
            className="stagger-2"
            details={[
              { label: "enrolled", value: convertedToday, color: "success" },
              { label: "pending", value: assignedLeads - convertedToday, color: "muted" },
            ]}
          />
          <StatCard
            title="Revenue Collected"
            value={`$${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            iconColor="success"
            className="stagger-3"
            details={[
              { label: "paid", value: paidInvoices, color: "success" },
              { label: "pending", value: unpaidInvoices, color: "warning" },
            ]}
          />
          <StatCard
            title="Pending Follow-ups"
            value={pendingFollowups}
            icon={PhoneCall}
            iconColor="warning"
            className="stagger-4"
            details={[
              { label: "urgent", value: Math.floor(pendingFollowups * 0.4), color: "destructive" },
              { label: "normal", value: Math.ceil(pendingFollowups * 0.6), color: "warning" },
            ]}
          />
        </div>

        {/* Sales Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SalesLeadsPipelineChart />
          <SalesConversionChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickActions />
          <RecentActivity />
        </div>
      </MainLayout>
    );
  }

  // Team Leader Dashboard
  if (role === 'team_leader') {
    const avgPerformance = 92;
    
    return (
      <MainLayout title="Team Leader Dashboard" subtitle={`Welcome back, ${currentUser?.name || 'Team Lead'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Students"
            value={totalStudents}
            icon={GraduationCap}
            iconColor="primary"
            className="stagger-1"
            details={[
              { label: "active", value: activeStudents, color: "success" },
              { label: "on hold", value: onHoldStudents, color: "warning" },
              { label: "inactive", value: inactiveStudents, color: "muted" },
            ]}
          />
          <StatCard
            title="Active Teachers"
            value={totalTeachers}
            icon={UserCog}
            iconColor="accent"
            className="stagger-2"
            details={[
              { label: "active", value: activeTeachers, color: "success" },
              { label: "on leave", value: onLeaveTeachers, color: "warning" },
            ]}
          />
          <StatCard
            title="Today's Classes"
            value={todaysClasses}
            icon={Calendar}
            iconColor="secondary"
            className="stagger-3"
            details={[
              { label: "completed", value: completedClasses, color: "success" },
              { label: "scheduled", value: scheduledClasses, color: "info" },
            ]}
          />
          <StatCard
            title="Teacher Performance"
            value={`${avgPerformance}%`}
            icon={TrendingUp}
            iconColor="success"
            className="stagger-4"
            progress={avgPerformance}
            details={[
              { label: "excellent", value: Math.floor(activeTeachers * 0.7), color: "success" },
              { label: "good", value: Math.ceil(activeTeachers * 0.3), color: "accent" },
            ]}
          />
        </div>

        {/* Team Leader Specific Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <TeamLeaderTeacherChart />
          <TeamLeaderScheduleChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QuickActions />
          <RecentActivity />
        </div>
      </MainLayout>
    );
  }

  // Teacher Dashboard
  if (role === 'teacher') {
    const teacherClasses = filteredData.schedules.filter(s => s.status === 'scheduled').length;
    const completedTeacherClasses = filteredData.schedules.filter(s => s.status === 'completed').length;
    const assignedStudentCount = filteredData.students.length;
    const activeAssigned = filteredData.students.filter(s => s.status === 'active').length;
    const onLeaveAssigned = filteredData.students.filter(s => s.status === 'on_hold').length;
    const absentAssigned = filteredData.students.filter(s => s.status === 'inactive').length;
    const trialStudents = filteredData.students.filter(s => s.course === 'Qaida').length;
    const salary = 3000;
    const bonuses = 350;
    
    return (
      <MainLayout title="Teacher Dashboard" subtitle={`Welcome back, ${currentUser?.name || 'Teacher'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Today's Classes"
            value={teacherClasses}
            icon={Calendar}
            iconColor="primary"
            className="stagger-1"
            details={[
              { label: "completed", value: completedTeacherClasses, color: "success" },
              { label: "remaining", value: teacherClasses - completedTeacherClasses, color: "info" },
            ]}
          />
          <StatCard
            title="Assigned Students"
            value={assignedStudentCount}
            icon={Users}
            iconColor="accent"
            className="stagger-2"
            details={[
              { label: "active", value: activeAssigned, color: "success" },
              { label: "leave", value: onLeaveAssigned, color: "warning" },
              { label: "absent", value: absentAssigned, color: "destructive" },
            ]}
          />
          <StatCard
            title="Trial Students"
            value={trialStudents}
            icon={GraduationCap}
            iconColor="info"
            className="stagger-3"
            details={[
              { label: "this week", value: 2, color: "info" },
              { label: "scheduled", value: 1, color: "warning" },
            ]}
          />
          <StatCard
            title="Monthly Salary"
            value={`$${salary.toLocaleString()}`}
            icon={DollarSign}
            iconColor="success"
            className="stagger-4"
            details={[
              { label: "base", value: `$${(salary - bonuses)}`, color: "success" },
              { label: "bonus", value: `$${bonuses}`, color: "accent" },
            ]}
          />
        </div>

        {/* Teacher Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <TeacherSalaryChart />
          <TeacherPerformanceChart />
        </div>

        {/* Upcoming Classes with Attendance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <TeacherUpcomingClasses />
          <AttendanceAlertCard />
        </div>

        {/* Teacher Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TeacherTodaysClasses />
          <TeacherAssignedStudents />
        </div>
      </MainLayout>
    );
  }

  // Student Dashboard - Get accurate data
  const currentStudent = filteredData.students[0]; // Student should only see themselves
  
  // Calculate accurate stats (data already fetched at top level)
  const progressPercent = currentStudent?.progress || 0;
  const latestProgress = studentProgressData[0]; // Most recent progress record
  
  // Homework stats
  const completedHomework = homeworkList.filter((h: any) => h.status === 'completed').length;
  const totalHomework = homeworkList.length;
  const pendingHomework = homeworkList.filter((h: any) => h.status === 'pending' || h.status === 'in_progress').length;
  const overdueHomework = homeworkList.filter((h: any) => h.status === 'overdue').length;
  
  // Schedule data
  const studentSchedules = filteredData.schedules;
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  const todayClass = studentSchedules.find(s => s.day === today);
  
  // Invoice data
  const studentInvoices = filteredData.invoices;
  const studentPaidInvoices = studentInvoices.filter(i => i.status === 'paid').length;
  const studentUnpaidInvoices = studentInvoices.filter(i => i.status !== 'paid').length;
  const totalPending = studentInvoices.reduce((sum, i) => sum + (i.amount - i.paidAmount), 0);
  
  return (
    <MainLayout title="Student Dashboard" subtitle={`Welcome back, ${currentUser?.name || 'Student'}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Current Progress"
          value={`${progressPercent}%`}
          subtitle={latestProgress?.lesson || currentStudent?.course || 'Learning'}
          icon={TrendingUp}
          iconColor="primary"
          progress={progressPercent}
          className="stagger-1"
          details={[
            { label: "completion", value: `${progressPercent}%`, color: "success" },
            { label: "course", value: currentStudent?.course || 'N/A', color: "info" },
          ]}
        />
        <StatCard
          title="Today's Class"
          value={todayClass ? todayClass.time : 'No Class'}
          subtitle={todayClass ? todayClass.teacherName : 'Today'}
          icon={Video}
          iconColor="info"
          className="stagger-2"
          details={[
            { label: "duration", value: todayClass?.duration || 'N/A', color: "info" },
            { label: "course", value: todayClass?.course || currentStudent?.course || 'N/A', color: "accent" },
          ]}
        />
        <StatCard
          title="Homework"
          value={totalHomework > 0 ? `${completedHomework}/${totalHomework}` : '0'}
          subtitle={overdueHomework > 0 ? `${overdueHomework} overdue` : 'All on track'}
          icon={BookOpen}
          iconColor="accent"
          progress={totalHomework > 0 ? Math.round((completedHomework / totalHomework) * 100) : 0}
          className="stagger-3"
          details={[
            { label: "completed", value: completedHomework, color: "success" },
            { label: "pending", value: pendingHomework, color: "warning" },
            { label: "overdue", value: overdueHomework, color: "destructive" },
          ]}
        />
        <StatCard
          title="Fee Status"
          value={totalPending > 0 ? `$${totalPending.toLocaleString()}` : 'Paid'}
          subtitle={totalPending > 0 ? 'Pending payment' : 'All clear'}
          icon={DollarSign}
          iconColor={totalPending > 0 ? "warning" : "success"}
          className="stagger-4"
          details={[
            { label: "paid invoices", value: studentPaidInvoices, color: "success" },
            { label: "pending", value: studentUnpaidInvoices, color: "warning" },
          ]}
        />
      </div>

      {/* Student Progress Chart */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <StudentProgressChart students={filteredData.students} />
      </div>

      {/* Classes & Homework */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <StudentUpcomingClasses />
        <StudentHomework />
      </div>

      {/* Attendance & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StudentAttendanceCard />
        <StudentPerformanceCard />
      </div>
    </MainLayout>
  );
}
