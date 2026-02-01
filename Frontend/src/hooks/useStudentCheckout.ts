import { useMutation, useQuery } from 'react-query';
import { api } from './api';
import { toast } from 'sonner';

// Student checkout hook
export const useStudentCheckout = () => {
  return useMutation({
    mutationFn: async (studentId: string) => {
      const response = await api.post('/students/checkout', { studentId });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Checked out successfully');
      // Invalidate attendance queries to refresh data
      window.location.reload(); // Simple refresh for now
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to check out');
    },
  });
};

// Get student's today attendance status
export const useStudentTodayAttendance = (studentId: string) => {
  return useQuery({
    queryKey: ['student', 'attendance', 'today', studentId],
    queryFn: async () => {
      const response = await api.get(`/students/${studentId}/today-attendance`);
      return response.data;
    },
    enabled: !!studentId,
  });
};

// Auto checkout all students (for admin/scheduled job)
export const useAutoCheckoutStudents = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/students/auto-checkout');
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Auto-checked out ${data.students?.length || 0} students`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to auto checkout students');
    },
  });
};
