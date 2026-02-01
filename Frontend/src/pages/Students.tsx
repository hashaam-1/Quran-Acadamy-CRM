import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, BookOpen, Clock, Calendar, User, Globe, Star, Pencil, Trash2, MessageSquare, Key, Eye, EyeOff, Send, Copy, Check, Mail, UserPlus } from "lucide-react";
import { Student } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from "@/hooks/useStudents";
import { useTeachers } from "@/hooks/useTeachers";
import { useCreateChat, useSendMessage } from "@/hooks/useChats";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statusConfig = {
  active: { label: "Active", variant: "success" as const },
  inactive: { label: "Inactive", variant: "muted" as const },
  on_hold: { label: "On Hold", variant: "warning" as const },
};

const courseColors = {
  Qaida: "bg-info/10 text-info border-info/20",
  Nazra: "bg-success/10 text-success border-success/20",
  Hifz: "bg-accent/10 text-accent border-accent/20",
  Tajweed: "bg-primary/10 text-primary border-primary/20",
};

const emptyStudent: Omit<Student, "id"> = {
  name: "", 
  age: 6, 
  country: "", 
  timezone: "GMT+0", 
  course: "Qaida", 
  teacher: "", 
  teacherId: "",
  email: "",
  userId: "",
  schedule: "", 
  progress: 0, 
  status: "active", 
  joinedAt: new Date().toISOString().split('T')[0],
};

export default function Students() {
  const navigate = useNavigate();
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: teachers = [], isLoading: teachersLoading } = useTeachers();
  const createStudent = useCreateStudent();
  const createChatMutation = useCreateChat();
  const sendMessageMutation = useSendMessage();
  const updateStudentMutation = useUpdateStudent();
  const deleteStudentMutation = useDeleteStudent();
  const { currentUser } = useAuthStore();
  const canAddStudent = currentUser?.role !== 'teacher';
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState(new Set());
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [current, setCurrent] = useState<Student | null>(null);
  const [formData, setFormData] = useState(emptyStudent);
  const [isResendOpen, setIsResendOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "credentials" | "sending">("form");
  const [credentials, setCredentials] = useState<{ userId: string; password: string } | null>(null);
  const [sentStatus, setSentStatus] = useState<{ email: boolean; sms: boolean }>({ email: false, sms: false });
  const [copiedField, setCopiedField] = useState<"userId" | "password" | null>(null);

  const filtered = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Role-based filtering
    let matchesRole = true;
    if (currentUser?.role === 'teacher') {
      // Teachers can only see their assigned students
      matchesRole = s.teacherId === (currentUser as any).teacherId || s.teacherId === currentUser.id;
    } else if (currentUser?.role === 'student') {
      // Students can only see themselves
      matchesRole = s.id === currentUser.id || s.userId === currentUser.email;
    }
    // Admin and team_leader can see all
    
    return matchesSearch && matchesRole;
  });

  if (studentsLoading || teachersLoading) {
    return (
      <MainLayout title="Students" subtitle="Manage your student database">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading students...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const handleAdd = () => {
    // Validate required fields
    if (!formData.name || !formData.country || !formData.teacher || !formData.schedule || !formData.email) {
      toast.error('Please fill in all required fields: Name, Country, Teacher, Schedule, and Email');
      return;
    }
    
    if (formData.age < 5 || formData.age > 100) {
      toast.error('Age must be between 5 and 100');
      return;
    }
    
    // Password will be auto-generated, no validation needed
    
    const studentData = { ...formData };
    
    createStudent.mutate(studentData, {
      onSuccess: (response: any) => {
        setFormData(emptyStudent); 
        setIsAddOpen(false);
        
        const generatedPassword = response.plainPassword || 'Auto-generated';
        
        // Add user to auth store for login
        const { addUser } = useAuthStore.getState();
        const studentUser = {
          id: response._id || response.id,
          name: formData.name,
          email: formData.email,
          phone: '', // Student phone not in form
          role: 'student' as const,
          createdAt: new Date().toISOString().split('T')[0],
          studentId: response._id || response.id,
        };
        console.log('About to add student to auth store:', { studentUser, password: generatedPassword });
        addUser(studentUser, generatedPassword);
        
        // Show credentials popup like Team Management
        setCredentials({ 
          userId: formData.email, 
          password: generatedPassword 
        });
        setStep("credentials");
        
        // Create chat with student and send credentials
        const studentId = response._id || response.id;
        setTimeout(() => {
          createChatMutation.mutate({
            participants: [
              { 
                userId: currentUser.id || (currentUser as any).userId || '', 
                userModel: 'User', 
                name: currentUser.name, 
                role: 'admin' 
              },
              { 
                userId: studentId, 
                userModel: 'Student', 
                name: formData.name, 
                role: 'student' 
              },
            ],
            chatType: 'teacher_to_student',
          }, {
            onSuccess: (newChat) => {
              // Send credentials message in the chat
              const credentialsMessage = `🌙 Assalamu Alaikum, ${formData.name}!\n\n✨ Welcome to Quran Academy CRM ✨\n\nYour account has been successfully created and activated. We're excited to have you on board!\n\n╔═══════════════════════════════════════╗\n║        YOUR LOGIN CREDENTIALS         ║\n╚═══════════════════════════════════════╝\n\n👤 Name: ${formData.name}\n📧 Email: ${formData.email}\n🔐 Password: ${generatedPassword}\n🌐 Portal: ${window.location.origin}\n\n╔═══════════════════════════════════════╗\n║         GETTING STARTED               ║\n╚═══════════════════════════════════════╝\n\n1️⃣ Visit the login portal using the URL above\n2️⃣ Enter your email and password\n3️⃣ Explore your personalized dashboard\n4️⃣ Start managing your tasks and activities\n\n╔═══════════════════════════════════════╗\n║       SECURITY REMINDER               ║\n╚═══════════════════════════════════════╝\n\n🔒 Keep your credentials confidential\n🚫 Never share your password with anyone\n✅ Always logout after your session\n\n💬 Need Help?\nIf you have any questions or need assistance, feel free to reach out to your administrator anytime.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nBest regards,\n🕌 Quran Academy CRM Team\n\nJazakAllah Khair! 🤲`;
              
              sendMessageMutation.mutate({
                chatId: newChat._id,
                content: credentialsMessage,
                senderId: currentUser.id || (currentUser as any).userId || '',
                senderModel: 'User',
                senderName: currentUser.name,
                senderRole: 'admin',
              });
              
              toast.success('Chat created with credentials!', {
                description: 'Credentials have been sent in chat',
                action: {
                  label: 'View Chat',
                  onClick: () => navigate(`/messages?userId=${studentId}&userName=${encodeURIComponent(formData.name)}&userRole=student`),
                },
              });
            },
          });
        }, 500);
      }
    });
  };
  
  const handleEdit = () => { 
    if (current) {
      const studentData = { ...formData };
      
      const studentId = (current as any)._id || current.id;
      updateStudentMutation.mutate({ id: studentId, data: studentData }, {
        onSuccess: () => {
          setIsEditOpen(false);
          setCurrent(null);
        }
      });
    } 
  };
  
  const handleDelete = () => { 
    if (current) { 
      const studentId = (current as any)._id || current.id;
      deleteStudentMutation.mutate(studentId, {
        onSuccess: () => {
          setIsDeleteOpen(false);
          setCurrent(null);
        }
      });
    } 
  };

  const handleResendCredentials = async (student: Student) => {
    setSelectedStudent(student);
    setIsResendOpen(true);
  };

  const confirmResendCredentials = async () => {
    if (!selectedStudent) return;
    
    try {
      // Call backend API to resend credentials
      const response = await fetch(`http://localhost:5000/api/students/${(selectedStudent as any)._id || selectedStudent.id}/resend-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        toast.success('Credentials resent successfully!');
        setIsResendOpen(false);
        setSelectedStudent(null);
      } else {
        toast.error('Failed to resend credentials');
      }
    } catch (error) {
      console.error('Error resending credentials:', error);
      toast.error('Failed to resend credentials');
    }
  };

  const handleCopyId = async (userId: string) => {
    await navigator.clipboard.writeText(userId);
    setCopiedId(userId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopy = async (field: "userId" | "password") => {
    if (!credentials) return;
    const value = field === "userId" ? credentials.userId : credentials.password;
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleTeacherChange = (teacherName: string) => {
    const teacher = teachers.find(t => t.name === teacherName);
    const teacherId = (teacher as any)?._id || teacher?.id || '';
    setFormData(prev => ({
      ...prev,
      teacher: teacherName,
      teacherId: teacherId,
    }));
  };

  const handleOpenChat = (student: Student) => {
    const studentId = (student as any)._id || student.id;
    navigate(`/messages?userId=${studentId}&userName=${encodeURIComponent(student.name)}&userRole=student`);
  };

  return (
    <MainLayout title="Students" subtitle="Manage your student database">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card variant="stat" className="animate-slide-up"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Students</p><p className="text-2xl font-bold">{students.length}</p></div><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><User className="h-5 w-5 text-primary" /></div></div></CardContent></Card>
        <Card variant="stat" className="animate-slide-up"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Active</p><p className="text-2xl font-bold text-success">{students.filter(s => s.status === "active").length}</p></div><div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center"><BookOpen className="h-5 w-5 text-success" /></div></div></CardContent></Card>
        <Card variant="stat" className="animate-slide-up"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">On Hold</p><p className="text-2xl font-bold text-warning">{students.filter(s => s.status === "on_hold").length}</p></div><div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center"><Clock className="h-5 w-5 text-warning" /></div></div></CardContent></Card>
        <Card variant="stat" className="animate-slide-up"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Inactive</p><p className="text-2xl font-bold text-muted-foreground">{students.filter(s => s.status === "inactive").length}</p></div><div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center"><Star className="h-5 w-5 text-muted-foreground" /></div></div></CardContent></Card>
      </div>

      <Card className="animate-slide-up">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Students</CardTitle>
          {canAddStudent && (
            <Button className="gap-2" onClick={() => { setFormData(emptyStudent); setIsAddOpen(true); }}><Plus className="h-4 w-4" />Add Student</Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search students..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((student) => {
              const initials = student.name.split(" ").map(n => n[0]).join("");
              return (
              <Card key={student._id || student.id} variant="interactive" className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="h-16 gradient-primary relative">
                    <div className="absolute -bottom-6 left-4"><div className="h-12 w-12 rounded-full bg-card border-4 border-card flex items-center justify-center text-lg font-bold text-primary">{initials}</div></div>
                    <div className="absolute top-2 right-2"><Badge variant={statusConfig[student.status].variant}>{statusConfig[student.status].label}</Badge></div>
                  </div>
                  <div className="pt-8 px-4 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div><h3 className="font-semibold">{student.name}</h3><p className="text-sm text-muted-foreground">Age: {student.age}</p></div>
                      <div className="flex gap-1">
                        {(student as any).email && (student as any).plainPassword && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleResendCredentials(student)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setCurrent(student); setFormData(student); setIsEditOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => handleOpenChat(student)}><MessageSquare className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setCurrent(student); setIsDeleteOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm"><Globe className="h-4 w-4 text-muted-foreground" /><span>{student.country}</span><span className="text-muted-foreground">({student.timezone})</span></div>
                      <div className="flex items-center gap-2"><Badge className={courseColors[student.course as keyof typeof courseColors] || ""}>{student.course}</Badge><span className="text-sm text-muted-foreground">with {student.teacher}</span></div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" /><span>{student.schedule}</span></div>
                      {(student as any).email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span className="text-xs">{(student as any).email}</span>
                        </div>
                      )}
                      
                                            
                      {(student as any).plainPassword && (
                        <div className="flex items-center gap-2 text-sm">
                          <Key className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-xs">
                            {visiblePasswords.has(student.id) ? (student as any).plainPassword : '•••••••••'}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-auto"
                            onClick={() => {
                              const newVisible = new Set(visiblePasswords);
                              if (newVisible.has(student.id)) {
                                newVisible.delete(student.id);
                              } else {
                                newVisible.add(student.id);
                              }
                              setVisiblePasswords(newVisible);
                            }}
                          >
                            {visiblePasswords.has(student.id) ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      )}
                      <div className="space-y-1"><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Progress</span><span className="font-medium">{student.progress}%</span></div><Progress value={student.progress} className="h-2" /></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {step === "form" && (
            <>
              <DialogHeader><DialogTitle>Add Student</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Age</Label><Input type="number" value={formData.age} onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Country</Label><Input value={formData.country} onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))} /></div><div className="space-y-2"><Label>Course</Label><Select value={formData.course} onValueChange={(v) => setFormData(prev => ({ ...prev, course: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Qaida">Qaida</SelectItem><SelectItem value="Nazra">Nazra</SelectItem><SelectItem value="Hifz">Hifz</SelectItem><SelectItem value="Tajweed">Tajweed</SelectItem></SelectContent></Select></div></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Teacher <span className="text-destructive">*</span></Label>
                    <Select value={formData.teacher} onValueChange={handleTeacherChange}>
                      <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                      <SelectContent>
                        {teachers.map((t) => (
                          <SelectItem key={(t as any)._id || t.id} value={t.name}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Timezone</Label><Input value={formData.timezone} onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))} placeholder="GMT+5" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Email <span className="text-destructive">*</span></Label><Input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="student@example.com" /></div>
                </div>
                <div className="space-y-2"><Label>Schedule <span className="text-destructive">*</span></Label><Input value={formData.schedule} onChange={(e) => setFormData(prev => ({ ...prev, schedule: e.target.value }))} placeholder="Mon, Wed, Fri - 4:00 PM" /></div>
              </div>
              <DialogFooter><Button onClick={handleAdd}>Add Student</Button></DialogFooter>
            </>
          )}
          
          {step === "credentials" && credentials && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Student Created Successfully
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center">
                    <Check className="h-8 w-8 text-success" />
                  </div>
                  <h3 className="text-lg font-semibold">Student Account Created!</h3>
                  <p className="text-muted-foreground">Login credentials have been generated</p>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">User ID (Email)</Label>
                      <div className="flex items-center gap-2">
                        <Input value={credentials.userId} readOnly className="font-mono" />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopy("userId")}
                        >
                          {copiedField === "userId" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Password</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          value={credentials.password} 
                          readOnly 
                          className="font-mono" 
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopy("password")}
                        >
                          {copiedField === "password" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                    <Mail className={`h-4 w-4 ${sentStatus.email ? 'text-success' : 'text-muted-foreground'}`} />
                    <span className="text-sm">Email sent</span>
                    {sentStatus.email && <Check className="h-4 w-4 text-success" />}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => { setIsAddOpen(false); setStep("form"); setFormData(emptyStudent); }}>
                    Close
                  </Button>
                  <Button onClick={() => { setIsAddOpen(false); setStep("form"); setFormData(emptyStudent); }}>
                    Done
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} /></div><div className="space-y-2"><Label>Age</Label><Input type="number" value={formData.age} onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))} /></div></div>
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Country</Label><Input value={formData.country} onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))} /></div><div className="space-y-2"><Label>Status</Label><Select value={formData.status} onValueChange={(v: Student["status"]) => setFormData(prev => ({ ...prev, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="on_hold">On Hold</SelectItem></SelectContent></Select></div></div>
            <div className="space-y-2"><Label>Progress</Label><Input type="number" value={formData.progress} onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) }))} /></div>
          </div>
          <DialogFooter><Button onClick={handleEdit}>Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Student</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete {current?.name}?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resend Credentials Dialog */}
      <Dialog open={isResendOpen} onOpenChange={setIsResendOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Resend Credentials
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to resend login credentials to <strong>{selectedStudent?.name}</strong>?
            </p>
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{selectedStudent?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{(selectedStudent as any)?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">{(selectedStudent as any)?.plainPassword ? (selectedStudent as any).plainPassword : '•••••••••'}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              This will send the login credentials via email and chat message.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResendOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmResendCredentials} className="gap-2">
              <Send className="h-4 w-4" />
              Resend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
