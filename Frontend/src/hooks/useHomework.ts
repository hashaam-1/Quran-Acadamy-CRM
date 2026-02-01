import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { homeworkApi } from '@/lib/api';
import { toast } from 'sonner';

export const useHomework = () => {
  return useQuery({
    queryKey: ['homework'],
    queryFn: homeworkApi.getAll,
  });
};

export const useHomeworkByStudent = (studentId: string) => {
  // Check if studentId is a valid MongoDB ObjectId (24 hex characters)
  const isValidObjectId = studentId && /^[0-9a-fA-F]{24}$/.test(studentId);
  
  return useQuery({
    queryKey: ['homework', 'student', studentId],
    queryFn: () => homeworkApi.getByStudent(studentId),
    enabled: !!studentId && isValidObjectId,
  });
};

export const useHomeworkByTeacher = (teacherId: string) => {
  return useQuery({
    queryKey: ['homework', 'teacher', teacherId],
    queryFn: () => homeworkApi.getByTeacher(teacherId),
    enabled: !!teacherId,
  });
};

export const useCreateHomework = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (homework: any) => homeworkApi.create(homework),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      toast.success('Homework assigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign homework');
    },
  });
};

export const useUpdateHomework = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      homeworkApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      toast.success('Homework updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update homework');
    },
  });
};

export const useSubmitHomework = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => 
      homeworkApi.submit(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      toast.success('Homework submitted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit homework');
    },
  });
};

export const useGradeHomework = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, grade, feedback }: { id: string; grade: string; feedback: string }) => 
      homeworkApi.grade(id, grade, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      toast.success('Homework graded successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to grade homework');
    },
  });
};

export const useDeleteHomework = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => homeworkApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      toast.success('Homework deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete homework');
    },
  });
};

export const useHomeworkStats = () => {
  return useQuery({
    queryKey: ['homework', 'stats'],
    queryFn: homeworkApi.getStats,
  });
};
