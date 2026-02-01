import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/config';
import { toast } from 'sonner';

interface Attendance {
  _id?: string;
  id?: string;
  userType: 'student' | 'teacher';
  studentId?: string;
  studentName?: string;
  teacherId?: string;
  teacherName?: string;
  course?: string;
  classTime?: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}

interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  attendanceRate: number;
}

// Get all attendance records
export const useAttendance = (params?: { date?: string; studentId?: string; teacherId?: string; status?: string; userType?: string }) => {
  return useQuery({
    queryKey: ['attendance', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.date) queryParams.append('date', params.date);
      if (params?.studentId) queryParams.append('studentId', params.studentId);
      if (params?.teacherId) queryParams.append('teacherId', params.teacherId);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.userType) queryParams.append('userType', params.userType);
      
      const response = await api.get(`/attendance?${queryParams.toString()}`);
      const data = response.data;
      return Array.isArray(data) ? data : [];
    },
  });
};

// Get students for teacher to mark attendance
export const useStudentsForAttendance = (teacherId: string, date?: string) => {
  return useQuery({
    queryKey: ['attendance', 'students', teacherId, date],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append('teacherId', teacherId);
      if (date) queryParams.append('date', date);
      
      const response = await api.get(`/attendance/students?${queryParams.toString()}`);
      const data = response.data;
      return Array.isArray(data) ? data : [];
    },
    enabled: !!teacherId,
  });
};

// Get today's scheduled classes for teacher
export const useScheduledClasses = (teacherId: string) => {
  return useQuery({
    queryKey: ['attendance', 'scheduled', teacherId],
    queryFn: async () => {
      const response = await api.get(`/attendance/scheduled/${teacherId}`);
      const data = response.data;
      return Array.isArray(data) ? data : [];
    },
    enabled: !!teacherId,
  });
};

// Get schedule attendance summary
export const useScheduleAttendanceSummary = (teacherId: string, date?: string) => {
  return useQuery({
    queryKey: ['attendance', 'schedule-summary', teacherId, date],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (date) queryParams.append('date', date);
      
      const response = await api.get(`/attendance/schedule-summary/${teacherId}?${queryParams.toString()}`);
      const data = response.data;
      return Array.isArray(data) ? data : [];
    },
    enabled: !!teacherId,
  });
};

// Get teacher's today attendance status
export const useTeacherTodayAttendance = (teacherId: string) => {
  return useQuery({
    queryKey: ['teacher', 'attendance', 'today', teacherId],
    queryFn: async () => {
      const response = await api.get(`/teachers/attendance/today/${teacherId}`);
      return response.data;
    },
    enabled: !!teacherId,
  });
};

// Mark scheduled attendance
export const useMarkScheduledAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { scheduleId: string; studentId: string; status: string }) => {
      const response = await api.post('/attendance/mark-scheduled', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all attendance-related queries for immediate UI update
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'stats'] });
      toast.success('Attendance marked successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    },
  });
};

// Teacher checkout
export const useTeacherCheckout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (teacherId: string) => {
      const response = await api.post('/teachers/checkout', { teacherId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'attendance'] });
    },
  });
};

// Get attendance statistics
export const useAttendanceStats = () => {
  return useQuery({
    queryKey: ['attendance', 'stats'],
    queryFn: async () => {
      const response = await api.get('/attendance/stats');
      return response.data as AttendanceStats;
    },
  });
};

// Get attendance by ID
export const useAttendanceById = (id: string) => {
  return useQuery({
    queryKey: ['attendance', id],
    queryFn: async () => {
      const response = await api.get(`/attendance/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Create attendance record
export const useCreateAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (attendance: Omit<Attendance, 'id' | '_id'>) => {
      const response = await api.post('/attendance', attendance);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance recorded successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record attendance');
    },
  });
};

// Mark student attendance (simplified)
export const useMarkAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { studentId: string; status: string; classTime?: string; course?: string; scheduleId?: string }) => {
      const response = await api.post('/attendance/mark', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all attendance-related queries for immediate UI update
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', 'stats'] });
      toast.success('Attendance marked successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    },
  });
};

// Update attendance record
export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Attendance> }) => {
      const response = await api.put(`/attendance/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update attendance');
    },
  });
};

// Delete attendance record
export const useDeleteAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/attendance/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance record deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete attendance record');
    },
  });
};
