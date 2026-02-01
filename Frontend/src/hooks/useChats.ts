import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/config';
import { toast } from 'sonner';

interface ChatParticipant {
  userId: string;
  userModel: string;
  name: string;
  role: 'admin' | 'sales_team' | 'team_leader' | 'teacher' | 'student';
}

interface Message {
  _id?: string;
  senderId: string;
  senderModel: string;
  senderName: string;
  senderRole: string;
  content: string;
  isBlocked?: boolean;
  blockedReason?: string;
  timestamp: string;
  readBy: Array<{ userId: string; readAt: string }>;
}

interface Chat {
  _id: string;
  participants: ChatParticipant[];
  chatType: 'sales_to_team_lead' | 'team_lead_to_teacher' | 'teacher_to_student' | 'admin_view';
  messages: Message[];
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Get all chats for current user
export const useChats = (userId: string, role: string) => {
  return useQuery({
    queryKey: ['chats', userId, role],
    queryFn: async () => {
      const response = await api.get(`/chats?userId=${userId}&role=${role}`);
      return response.data as Chat[];
    },
    enabled: !!userId && !!role,
  });
};

// Get specific chat by ID
export const useChatById = (chatId: string, userId: string, role: string) => {
  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      const response = await api.get(`/chats/${chatId}?userId=${userId}&role=${role}`);
      return response.data as Chat;
    },
    enabled: !!chatId && !!userId && !!role,
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });
};

// Create new chat
export const useCreateChat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { participants: ChatParticipant[]; chatType: string }) => {
      const response = await api.post('/chats', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      toast.success('Chat created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create chat');
    },
  });
};

// Send message
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      chatId, 
      senderId, 
      senderModel, 
      senderName, 
      senderRole, 
      content 
    }: { 
      chatId: string; 
      senderId: string; 
      senderModel: string; 
      senderName: string; 
      senderRole: string; 
      content: string;
    }) => {
      const response = await api.post(`/chats/${chatId}/message`, {
        senderId,
        senderModel,
        senderName,
        senderRole,
        content,
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.blocked) {
        toast.error(data.reason || 'Message blocked: Contact information sharing is not allowed');
      } else {
        queryClient.invalidateQueries({ queryKey: ['chat'] });
        queryClient.invalidateQueries({ queryKey: ['chats'] });
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to send message';
      const reason = error.response?.data?.reason;
      
      if (reason) {
        toast.error(`${message}: ${reason}`);
      } else {
        toast.error(message);
      }
    },
  });
};

// Mark messages as read
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ chatId, userId }: { chatId: string; userId: string }) => {
      const response = await api.post(`/chats/${chatId}/read`, { userId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat'] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
};

// Get chat statistics (admin only)
export const useChatStats = () => {
  return useQuery({
    queryKey: ['chat-stats'],
    queryFn: async () => {
      const response = await api.get('/chats/stats');
      return response.data;
    },
  });
};

// Delete chat (admin only)
export const useDeleteChat = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (chatId: string) => {
      const response = await api.delete(`/chats/${chatId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      toast.success('Chat deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete chat');
    },
  });
};
