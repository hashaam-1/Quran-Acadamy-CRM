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
        return [];
      }
      
      // Admin, Sales Team, and Team Leader see all schedules
      if (currentUser.role === 'admin' || currentUser.role === 'sales_team' || currentUser.role === 'team_leader') {
        data = await schedulesApi.getAll();
      }
      // Teachers see only their assigned classes
      else if (currentUser.role === 'teacher') {
        data = await schedulesApi.getByTeacher(currentUser.id);
      }
      // Students see only their classes
      else if (currentUser.role === 'student') {
        data = await schedulesApi.getByStudent(currentUser.id);
      }
      // Default: show all (fallback)
      else {
        data = await schedulesApi.getAll();
      }
      
      return Array.isArray(data) ? data : [];
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
