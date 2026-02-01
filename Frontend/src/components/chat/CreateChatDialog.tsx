import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCreateChat } from "@/hooks/useChats";
import { useAuthStore } from "@/lib/auth-store";
import { useTeachers } from "@/hooks/useTeachers";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useStudents } from "@/hooks/useStudents";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface CreateChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedUser?: {
    userId: string;
    userName: string;
    userRole: string;
  };
}

export function CreateChatDialog({ open, onOpenChange, preselectedUser }: CreateChatDialogProps) {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const createChatMutation = useCreateChat();
  
  const { data: teachers = [] } = useTeachers();
  const { data: teamMembers = [] } = useTeamMembers();
  const { data: students = [] } = useStudents();
  
  const [selectedUserId, setSelectedUserId] = useState(preselectedUser?.userId || "");
  const [selectedUserName, setSelectedUserName] = useState(preselectedUser?.userName || "");
  const [selectedUserRole, setSelectedUserRole] = useState(preselectedUser?.userRole || "");

  // Determine available users based on current user's role
  const getAvailableUsers = () => {
    const currentRole = currentUser?.role;
    
    if (currentRole === 'admin') {
      // Admin can chat with anyone
      return [
        ...teamMembers.map(tm => ({ 
          id: (tm as any)._id || tm.id, 
          name: tm.name, 
          role: tm.role || 'team_member' 
        })),
        ...teachers.map(t => ({ 
          id: (t as any)._id || t.id, 
          name: t.name, 
          role: 'teacher' 
        })),
        ...students.map(s => ({ 
          id: (s as any)._id || s.id, 
          name: s.name, 
          role: 'student' 
        })),
      ];
    } else if (currentRole === 'sales_team') {
      // Sales can chat with team leaders
      return teamMembers
        .filter(tm => tm.role === 'team_leader')
        .map(tm => ({ 
          id: (tm as any)._id || tm.id, 
          name: tm.name, 
          role: 'team_leader' 
        }));
    } else if (currentRole === 'team_leader') {
      // Team leaders can chat with sales and teachers
      return [
        ...teamMembers
          .filter(tm => tm.role === 'sales_team')
          .map(tm => ({ 
            id: (tm as any)._id || tm.id, 
            name: tm.name, 
            role: 'sales_team' 
          })),
        ...teachers.map(t => ({ 
          id: (t as any)._id || t.id, 
          name: t.name, 
          role: 'teacher' 
        })),
      ];
    } else if (currentRole === 'teacher') {
      // Teachers can chat with team leaders and students
      return [
        ...teamMembers
          .filter(tm => tm.role === 'team_leader')
          .map(tm => ({ 
            id: (tm as any)._id || tm.id, 
            name: tm.name, 
            role: 'team_leader' 
          })),
        ...students.map(s => ({ 
          id: (s as any)._id || s.id, 
          name: s.name, 
          role: 'student' 
        })),
      ];
    } else if (currentRole === 'student') {
      // Students can chat with their teacher
      return teachers.map(t => ({ 
        id: (t as any)._id || t.id, 
        name: t.name, 
        role: 'teacher' 
      }));
    }
    
    return [];
  };

  const availableUsers = getAvailableUsers();

  const handleUserSelect = (userId: string) => {
    const user = availableUsers.find(u => u.id === userId);
    if (user) {
      setSelectedUserId(userId);
      setSelectedUserName(user.name);
      setSelectedUserRole(user.role);
    }
  };

  const determineChatType = (role1: string, role2: string) => {
    const roles = [role1, role2].sort();
    
    if (roles.includes('sales_team') && roles.includes('team_leader')) {
      return 'sales_to_team_lead';
    } else if (roles.includes('team_leader') && roles.includes('teacher')) {
      return 'team_lead_to_teacher';
    } else if (roles.includes('teacher') && roles.includes('student')) {
      return 'teacher_to_student';
    } else if (roles.includes('admin')) {
      return 'admin_view';
    }
    
    return 'admin_view';
  };

  const handleCreateChat = () => {
    if (!selectedUserId || !currentUser) {
      toast.error("Please select a user to chat with");
      return;
    }

    const chatType = determineChatType(currentUser.role, selectedUserRole);

    createChatMutation.mutate({
      participants: [
        {
          userId: currentUser.id,
          userModel: 'User',
          name: currentUser.name,
          role: currentUser.role,
        },
        {
          userId: selectedUserId,
          userModel: 'User',
          name: selectedUserName,
          role: selectedUserRole as any,
        },
      ],
      chatType,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        navigate('/messages');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start New Chat</DialogTitle>
          <DialogDescription>
            Select a user to start a conversation
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select User</Label>
            <Select 
              value={selectedUserId} 
              onValueChange={handleUserSelect}
              disabled={!!preselectedUser}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateChat}
            disabled={!selectedUserId || createChatMutation.isPending}
          >
            Start Chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
