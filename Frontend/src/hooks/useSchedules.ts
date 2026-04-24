import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulesApi } from '@/lib/api';
import { ClassSchedule } from '@/lib/store';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/auth-store';

export const useSchedules = () => {
  const { currentUser } = useAuthStore();
  
  return useQuery({
    queryKey: ['schedules', currentUser?.role, currentUser?.id],
    queryFn: async () => {
      // Role-based schedule fetching
      let data;
      
      if (!currentUser) {
        console.log('❌ No current user - returning empty schedules');
        return [];
      }
      
      console.log('🔍 Fetching schedules for user:', {
        role: currentUser.role,
        id: currentUser.id,
        name: currentUser.name
      });
      
      // Admin, Sales Team, and Team Leader see all schedules
      if (currentUser.role === 'admin' || currentUser.role === 'sales_team' || currentUser.role === 'team_leader') {
        console.log('👑 Admin/Sales/Team Leader - fetching ALL schedules');
        data = await schedulesApi.getAll();
      }
      // Teachers see only their assigned classes
      else if (currentUser.role === 'teacher') {
        console.log('👨‍🏫 Teacher - fetching schedules for teacher ID:', currentUser.id);
        data = await schedulesApi.getByTeacher(currentUser.id);
      }
      // Students see only their classes
      else if (currentUser.role === 'student') {
        console.log('Student - fetching schedules for student ID:', currentUser.id);
        console.log('Student - full user object:', currentUser);
        data = await schedulesApi.getByStudent(currentUser.id);
        console.log('Student - API response:', data);
      }
      // Default: show all (fallback)
      else {
        console.log('⚠️ Unknown role - fetching ALL schedules');
        data = await schedulesApi.getAll();
      }
      
      const schedules = Array.isArray(data) ? data : [];
      
      // 🚨 Fix broken ID mapping - transform _id to id
      const formattedSchedules = schedules.map(s => ({
        id: s._id || s.id,
        ...s
      }));
      
      console.log('✅ Schedules fetched:', formattedSchedules.length, 'schedules');
      console.log('📋 Schedule data sample:', formattedSchedules[0]);
      console.log('🔍 ID mapping check:', formattedSchedules.map(s => ({ id: s.id, meetingNumber: s.meetingNumber })));
      
      return formattedSchedules;
    },
    enabled: !!currentUser,
  });
};

export const useSchedulesByDay = (day: string) => {
  return useQuery({
    queryKey: ['schedules', 'day', day],
    queryFn: async () => {
      const data = await schedulesApi.getByDay(day);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!day,
  });
};

export const useSchedulesByTeacher = (teacherId: string) => {
  return useQuery({
    queryKey: ['schedules', 'teacher', teacherId],
    queryFn: async () => {
      const data = await schedulesApi.getByTeacher(teacherId);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!teacherId,
  });
};

export const useSchedulesStats = () => {
  return useQuery({
    queryKey: ['schedules', 'stats'],
    queryFn: schedulesApi.getStats,
  });
};

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (schedule: Omit<ClassSchedule, 'id'>) => schedulesApi.create(schedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create schedule');
    },
  });
};

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClassSchedule> }) => 
      schedulesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update schedule');
    },
  });
};

export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => schedulesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete schedule');
    },
  });
};
