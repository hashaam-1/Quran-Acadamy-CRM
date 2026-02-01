import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { 
  Search, 
  Users, 
  Briefcase, 
  Shield, 
  Mail, 
  Phone, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Send, 
  UserPlus, 
  Eye, 
  EyeOff, 
  Award, 
  MessageSquare, 
  UserCheck, 
  UserX, 
  Calendar,
  Star,
  Target,
  TrendingUp,
  Copy,
  Check,
  Key
} from "lucide-react";
import { CreateUserDialog } from "@/components/admin/CreateUserDialog";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTeamMembers, useDeleteTeamMember, useUpdateTeamMember } from "@/hooks/useTeamMembers";
import { useTeachers, useDeleteTeacher } from "@/hooks/useTeachers";

const statusConfig = {
  active: { label: "Active", variant: "default" as const, dot: "bg-success" },
  inactive: { label: "Inactive", variant: "secondary" as const, dot: "bg-muted-foreground" },
};

const roleConfig = {
  sales_team: { 
    label: "Sales Manager", 
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-500",
    borderColor: "border-blue-500/20",
    icon: Briefcase
  },
  team_leader: { 
    label: "Team Leader", 
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-500",
    borderColor: "border-purple-500/20",
    icon: Shield
  },
  teacher: { 
    label: "Teacher", 
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-500",
    borderColor: "border-emerald-500/20",
    icon: Users
  },
};

export default function TeamManagement() {
  const navigate = useNavigate();
  const { currentUser, users, updateUser } = useAuthStore();
  const { data: teamMembers = [], isLoading: teamLoading } = useTeamMembers();
  const { data: teachers = [], isLoading: teachersLoading } = useTeachers();
  const deleteTeamMemberMutation = useDeleteTeamMember();
  const deleteTeacherMutation = useDeleteTeacher();
  const updateTeamMemberMutation = useUpdateTeamMember();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isResendOpen, setIsResendOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  const isLoading = teamLoading || teachersLoading;

  // Combine team members and teachers from backend only (exclude auth users to prevent duplicates)
  const allTeamMembers = [
    ...teamMembers,
    ...teachers.map(t => ({ ...t, role: 'teacher' }))
  ];

  const salesManagers = allTeamMembers.filter(m => m.role === 'sales_team');
  const teamLeaders = allTeamMembers.filter(m => m.role === 'team_leader');
  const teachersCount = allTeamMembers.filter(m => m.role === 'teacher');
  const activeMembers = allTeamMembers.filter(m => (m as any).status !== 'inactive');

  const filtered = allTeamMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyId = async (userId: string) => {
    await navigator.clipboard.writeText(userId);
    setCopiedId(userId);
    toast.success("User ID copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePasswordVisibility = (memberId: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const handleResendCredentials = async (member: any) => {
    setSelectedMember(member);
    setIsResendOpen(true);
  };

  const confirmResendCredentials = async () => {
    if (!selectedMember) return;
    
    try {
      // Call backend API to resend credentials
      const response = await fetch(`http://localhost:5000/api/team-members/${selectedMember._id || selectedMember.id}/resend-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        toast.success('Credentials sent successfully!', {
          description: `Login details sent to ${selectedMember.email}`
        });
        setIsResendOpen(false);
        setSelectedMember(null);
      } else {
        toast.error('Failed to send credentials');
      }
    } catch (error) {
      toast.error('Error sending credentials');
    }
  };

  const handleOpenChat = (member: any) => {
    const memberId = member._id || member.id;
    navigate(`/messages?userId=${memberId}&userName=${encodeURIComponent(member.name)}&userRole=${member.role}`);
  };

  const handleDelete = () => {
    if (selectedMember) {
      const memberId = (selectedMember as any)._id || selectedMember.id;
      
      // Delete teacher or team member based on role
      if (selectedMember.role === 'teacher') {
        deleteTeacherMutation.mutate(memberId, {
          onSuccess: () => {
            setIsDeleteOpen(false);
            setSelectedMember(null);
          }
        });
      } else {
        deleteTeamMemberMutation.mutate(memberId, {
          onSuccess: () => {
            setIsDeleteOpen(false);
            setSelectedMember(null);
          }
        });
      }
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <MainLayout title="Access Denied" subtitle="You don't have permission to view this page">
        <Card className="p-8 text-center">
          <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
          <p className="text-muted-foreground">Only administrators can manage team members.</p>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Team Management" subtitle="Manage sales managers, team leaders, and teachers">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card variant="stat" className="animate-slide-up">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">{allTeamMembers.length}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card variant="stat" className="animate-slide-up">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sales Managers</p>
                <p className="text-2xl font-bold text-blue-500">{salesManagers.length}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card variant="stat" className="animate-slide-up">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Team Leaders</p>
                <p className="text-2xl font-bold text-purple-500">{teamLeaders.length}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card variant="stat" className="animate-slide-up">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Teachers</p>
                <p className="text-2xl font-bold text-emerald-500">{teachersCount.length}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card variant="stat" className="animate-slide-up">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Members</p>
                <p className="text-2xl font-bold text-success">{activeMembers.length}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="animate-slide-up">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <CreateUserDialog />
          </div>

          {/* Team Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((member) => {
              const role = member.role as 'sales_team' | 'team_leader' | 'teacher';
              const config = roleConfig[role] || roleConfig.teacher;
              const isFromStore = 'userId' in member;
              const userId = isFromStore ? (member as any).userId : member.id;
              const status = (member as any).status || 'active';
              
              return (
                <Card 
                  key={member.id} 
                  variant="interactive" 
                  className={cn("overflow-hidden border-l-4", config?.borderColor)}
                >
                  <CardContent className="p-0">
                    {/* Header with gradient */}
                    <div className={cn("h-20 relative", `bg-gradient-to-r ${config?.color}`)}>
                      <div className="absolute -bottom-8 left-4">
                        <div className="h-16 w-16 rounded-xl bg-card border-4 border-card flex items-center justify-center text-xl font-bold shadow-lg">
                          <span className={config?.textColor}>
                            {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </span>
                        </div>
                      </div>
                      <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                        <Badge className={cn("text-xs font-semibold", config?.bgColor, config?.textColor)}>
                          {config?.icon && <config.icon className="h-3 w-3 mr-1" />}
                          {config?.label}
                        </Badge>
                        <Badge 
                          variant={statusConfig[status as keyof typeof statusConfig]?.variant || "default"}
                          className="text-xs"
                        >
                          {statusConfig[status as keyof typeof statusConfig]?.label || "Active"}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="pt-10 px-4 pb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{member.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs font-mono">
                              <Key className="h-3 w-3 mr-1" />
                              {userId}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleCopyId(userId)}
                            >
                              {copiedId === userId ? (
                                <Check className="h-3 w-3 text-success" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedMember(member);
                              setIsResendOpen(true);
                            }}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-success"
                            onClick={() => handleOpenChat(member)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => {
                              setSelectedMember(member);
                              setIsDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{member.phone}</span>
                        </div>
                        {(member as any).plainPassword && (
                          <div className="flex items-center gap-2 text-sm">
                            <Key className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono text-xs">
                              {visiblePasswords.has(member.id) ? (member as any).plainPassword : '••••••••'}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 ml-auto"
                              onClick={() => togglePasswordVisibility(member.id)}
                            >
                              {visiblePasswords.has(member.id) ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Joined: {(member as any).createdAt || (member as any).joinedAt || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-center gap-1">
                            <Target className="h-3 w-3 text-muted-foreground" />
                            <span className="text-lg font-bold">
                              {role === 'sales_team' ? (member as any).leadsConverted || 12 : (member as any).teachersManaged || 8}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {role === 'sales_team' ? 'Converted' : 'Teachers'}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="h-3 w-3 text-accent fill-accent" />
                            <span className="text-lg font-bold">{(member as any).rating || 4.8}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Rating</p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-center gap-1">
                            <TrendingUp className="h-3 w-3 text-success" />
                            <span className="text-lg font-bold">{(member as any).performance || 92}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Performance</p>
                        </div>
                      </div>

                      {/* Performance Bar */}
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Monthly Target</span>
                          <span className="font-medium">{(member as any).targetProgress || 78}%</span>
                        </div>
                        <Progress value={(member as any).targetProgress || 78} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No team members found</h3>
              <p className="text-muted-foreground">Create a new team member to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

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
              Are you sure you want to resend login credentials to <strong>{selectedMember?.name}</strong>?
            </p>
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{selectedMember?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{selectedMember?.phone}</span>
              </div>
            </div>
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

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{selectedMember?.name}</strong> from the system. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
