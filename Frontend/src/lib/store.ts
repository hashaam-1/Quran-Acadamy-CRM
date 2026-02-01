import { create } from 'zustand';

// Types
export interface Lead {
  id: string;
  _id?: string; // MongoDB ID
  name: string;
  phone: string;
  email: string;
  country: string;
  course: string;
  status: "new" | "follow_up" | "trial" | "enrolled" | "closed";
  assignedTo: string;
  source: string;
  createdAt: string;
  notes: string;
  callLogs?: CallLog[];
}

export interface CallLog {
  id: string;
  date: string;
  notes: string;
  outcome: string;
}

export interface Student {
  id: string;
  name: string;
  age: number;
  country: string;
  timezone: string;
  course: string;
  teacher: string;
  teacherId: string;
  email: string;
  password: string;
  userId: string;
  plainPassword?: string;
  schedule: string;
  progress: number;
  status: "active" | "inactive" | "on_hold";
  joinedAt: string;
  startDate?: string;
  documents?: string[];
  feeAmount?: number;
  leaveReason?: string;
}

export interface Teacher {
  id: string;
  name: string;
  title: string;
  phone: string;
  email: string;
  specialization: string[];
  students: number;
  rating: number;
  classesToday: number;
  classesCompleted: number;
  status: "available" | "in_class" | "on_leave";
  joinedAt: string;
  performance: number;
  punctuality?: number;
  completionRate?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  time: string;
  sender: "me" | "them";
  status: "sent" | "delivered" | "read";
}

export interface Conversation {
  id: string;
  name: string;
  phone: string;
  type: "student" | "teacher" | "team_leader";
  lastMessage: string;
  time: string;
  unread: number;
  messages: Message[];
}

export interface Invoice {
  id: string;
  studentName: string;
  studentId: string;
  amount: number;
  month: string;
  status: "paid" | "unpaid" | "overdue" | "partial";
  dueDate: string;
  paidAmount: number;
  discount?: number;
  estimatedAmount?: number;
}

export interface ClassSchedule {
  id: string;
  studentName: string;
  studentId: string;
  teacherName: string;
  teacherId: string;
  course: string;
  time: string;
  duration: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "rescheduled";
  day: string;
  rescheduleRequest?: {
    requestedBy: string;
    newTime: string;
    newDay: string;
    status: "pending" | "approved" | "rejected";
  };
}

export interface ProgressRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  lesson: string;
  sabqi: string;
  manzil: string;
  notes: string;
  completion: number;
  homework?: Homework;
}

export interface Homework {
  id: string;
  title: string;
  description: string;
  audioNote?: string;
  dueDate: string;
  status: "pending" | "completed";
}

export interface StudyMaterial {
  id: string;
  title: string;
  type: "pdf" | "audio" | "text";
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: "sales_team" | "team_leader";
  status: "active" | "inactive";
  joinedAt: string;
  leadsConverted?: number;
  teachersManaged?: number;
  rating: number;
  performance: number;
  targetProgress: number;
}

export interface StudentLeaveRecord {
  id: string;
  studentId: string;
  studentName: string;
  reason: string;
  date: string;
}

// Leave reasons for analytics
export const leaveReasons = [
  "Move to local Mosque",
  "Financial Constraints",
  "Too young",
  "Didn't attend the first trial class",
  "Not interested in E-learning",
  "Have another Account",
  "Prefer Home tutor",
  "Other reason (Not related to services)"
];

// Initial Data - REMOVED (Now using backend API)
const initialLeads: Lead[] = [];
const initialStudents: Student[] = [];
const initialTeachers: Teacher[] = [];

// Initial Data - REMOVED (Will use backend API)
const initialConversations: Conversation[] = [];
const initialInvoices: Invoice[] = [];
const initialSchedules: ClassSchedule[] = [];
const initialProgressRecords: ProgressRecord[] = [];
const initialStudyMaterials: StudyMaterial[] = [];
const initialStudentLeaves: StudentLeaveRecord[] = [];

// Store Interface
interface CRMStore {
  // Data
  leads: Lead[];
  students: Student[];
  teachers: Teacher[];
  conversations: Conversation[];
  invoices: Invoice[];
  schedules: ClassSchedule[];
  progressRecords: ProgressRecord[];
  studyMaterials: StudyMaterial[];
  teamMembers: TeamMember[];
  studentLeaves: StudentLeaveRecord[];
  
  // Lead Actions
  addLead: (lead: Omit<Lead, 'id'>) => void;
  updateLead: (id: string, lead: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  addCallLog: (leadId: string, log: Omit<CallLog, 'id'>) => void;
  
  // Student Actions
  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  
  // Teacher Actions
  addTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  updateTeacher: (id: string, teacher: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  
  // Message Actions
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'conversationId'>) => void;
  markAsRead: (conversationId: string) => void;
  
  // Invoice Actions
  addInvoice: (invoice: Omit<Invoice, 'id'>) => void;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  
  // Schedule Actions
  addSchedule: (schedule: Omit<ClassSchedule, 'id'>) => void;
  updateSchedule: (id: string, schedule: Partial<ClassSchedule>) => void;
  deleteSchedule: (id: string) => void;
  requestReschedule: (id: string, request: ClassSchedule['rescheduleRequest']) => void;
  approveReschedule: (id: string, approved: boolean) => void;
  
  // Progress Actions
  addProgressRecord: (record: Omit<ProgressRecord, 'id'>) => void;
  updateProgressRecord: (id: string, record: Partial<ProgressRecord>) => void;
  
  // Study Material Actions
  addStudyMaterial: (material: Omit<StudyMaterial, 'id'>) => void;
  deleteStudyMaterial: (id: string) => void;
  
  // Student Leave Actions
  addStudentLeave: (leave: Omit<StudentLeaveRecord, 'id'>) => void;
  
  // Team Member Actions
  addTeamMember: (member: Omit<TeamMember, 'id'>) => void;
  updateTeamMember: (id: string, member: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useCRMStore = create<CRMStore>((set) => ({
  leads: initialLeads,
  students: initialStudents,
  teachers: initialTeachers,
  conversations: initialConversations,
  invoices: initialInvoices,
  schedules: initialSchedules,
  progressRecords: initialProgressRecords,
  studyMaterials: initialStudyMaterials,
  studentLeaves: initialStudentLeaves,
  teamMembers: [],
  
  // Lead Actions
  addLead: (lead) => set((state) => ({
    leads: [...state.leads, { ...lead, id: generateId(), callLogs: [] }]
  })),
  updateLead: (id, lead) => set((state) => ({
    leads: state.leads.map((l) => l.id === id ? { ...l, ...lead } : l)
  })),
  deleteLead: (id) => set((state) => ({
    leads: state.leads.filter((l) => l.id !== id)
  })),
  addCallLog: (leadId, log) => set((state) => ({
    leads: state.leads.map((l) => l.id === leadId ? { 
      ...l, 
      callLogs: [...(l.callLogs || []), { ...log, id: generateId() }] 
    } : l)
  })),
  
  // Student Actions
  addStudent: (student) => set((state) => ({
    students: [...state.students, { ...student, id: generateId() }]
  })),
  updateStudent: (id, student) => set((state) => ({
    students: state.students.map((s) => s.id === id ? { ...s, ...student } : s)
  })),
  deleteStudent: (id) => set((state) => ({
    students: state.students.filter((s) => s.id !== id)
  })),
  
  // Teacher Actions
  addTeacher: (teacher) => set((state) => ({
    teachers: [...state.teachers, { ...teacher, id: generateId() }]
  })),
  updateTeacher: (id, teacher) => set((state) => ({
    teachers: state.teachers.map((t) => t.id === id ? { ...t, ...teacher } : t)
  })),
  deleteTeacher: (id) => set((state) => ({
    teachers: state.teachers.filter((t) => t.id !== id)
  })),
  
  // Message Actions
  addMessage: (conversationId, message) => set((state) => ({
    conversations: state.conversations.map((c) => {
      if (c.id === conversationId) {
        const newMessage = { ...message, id: generateId(), conversationId };
        return {
          ...c,
          messages: [...c.messages, newMessage],
          lastMessage: message.content,
          time: message.time,
        };
      }
      return c;
    })
  })),
  markAsRead: (conversationId) => set((state) => ({
    conversations: state.conversations.map((c) =>
      c.id === conversationId ? { ...c, unread: 0 } : c
    )
  })),
  
  // Invoice Actions
  addInvoice: (invoice) => set((state) => ({
    invoices: [...state.invoices, { ...invoice, id: generateId() }]
  })),
  updateInvoice: (id, invoice) => set((state) => ({
    invoices: state.invoices.map((i) => i.id === id ? { ...i, ...invoice } : i)
  })),
  deleteInvoice: (id) => set((state) => ({
    invoices: state.invoices.filter((i) => i.id !== id)
  })),
  
  // Schedule Actions
  addSchedule: (schedule) => set((state) => ({
    schedules: [...state.schedules, { ...schedule, id: generateId() }]
  })),
  updateSchedule: (id, schedule) => set((state) => ({
    schedules: state.schedules.map((s) => s.id === id ? { ...s, ...schedule } : s)
  })),
  deleteSchedule: (id) => set((state) => ({
    schedules: state.schedules.filter((s) => s.id !== id)
  })),
  requestReschedule: (id, request) => set((state) => ({
    schedules: state.schedules.map((s) => s.id === id ? { ...s, rescheduleRequest: request } : s)
  })),
  approveReschedule: (id, approved) => set((state) => ({
    schedules: state.schedules.map((s) => {
      if (s.id === id && s.rescheduleRequest) {
        if (approved) {
          return {
            ...s,
            time: s.rescheduleRequest.newTime,
            day: s.rescheduleRequest.newDay,
            status: 'rescheduled' as const,
            rescheduleRequest: { ...s.rescheduleRequest, status: 'approved' as const }
          };
        }
        return { ...s, rescheduleRequest: { ...s.rescheduleRequest, status: 'rejected' as const } };
      }
      return s;
    })
  })),
  
  // Progress Actions
  addProgressRecord: (record) => set((state) => ({
    progressRecords: [...state.progressRecords, { ...record, id: generateId() }]
  })),
  updateProgressRecord: (id, record) => set((state) => ({
    progressRecords: state.progressRecords.map((p) => p.id === id ? { ...p, ...record } : p)
  })),
  
  // Study Material Actions
  addStudyMaterial: (material) => set((state) => ({
    studyMaterials: [...state.studyMaterials, { ...material, id: generateId() }]
  })),
  deleteStudyMaterial: (id) => set((state) => ({
    studyMaterials: state.studyMaterials.filter((m) => m.id !== id)
  })),
  
  // Student Leave Actions
  addStudentLeave: (leave) => set((state) => ({
    studentLeaves: [...state.studentLeaves, { ...leave, id: generateId() }]
  })),
  
  // Team Member Actions
  addTeamMember: (member) => set((state) => ({
    teamMembers: [...state.teamMembers, { ...member, id: generateId() }]
  })),
  updateTeamMember: (id, member) => set((state) => ({
    teamMembers: state.teamMembers.map((m) => m.id === id ? { ...m, ...member } : m)
  })),
  deleteTeamMember: (id) => set((state) => ({
    teamMembers: state.teamMembers.filter((m) => m.id !== id)
  })),
}));
