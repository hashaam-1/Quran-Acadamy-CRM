import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulesApi } from '@/lib/api';
import { ClassSchedule } from '@/lib/store';
import { toast } from 'sonner';

export const useSchedules = () => {
  return useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      console.log('=== SCHEDULES API DEBUG ===');
      
      // Get current user info for debugging
      const authData = localStorage.getItem('auth-storage');
      console.log('Auth data from localStorage:', authData);
      
      try {
        // Test basic API connection first
        const healthResponse = await fetch(`${import.meta.env.VITE_API_URL || 'https://quran-acadamy-crm-production.up.railway.app/api'}/health`);
        console.log('Health check status:', healthResponse.status);
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          console.log('Health check data:', healthData);
        }
        
        console.log('Making schedules API call...');
        const data = await schedulesApi.getAll();
        console.log('Raw API response:', data);
        console.log('Data type:', typeof data);
        console.log('Is array:', Array.isArray(data));
        console.log('Data length:', data?.length || 'N/A');
        console.log('========================');
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Schedules API error:', error);
        console.error('Error details:', error.response?.data || error.message);
        console.error('Error status:', error.response?.status);
        throw error;
      }
    },
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
