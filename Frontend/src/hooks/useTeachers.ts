import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teachersApi } from '@/lib/api';
import { Teacher } from '@/lib/store';
import { toast } from 'sonner';

export const useTeachers = () => {
  return useQuery({
    queryKey: ['teachers'],
    queryFn: teachersApi.getAll,
  });
};

export const useTeacherById = (id: string) => {
  return useQuery({
    queryKey: ['teachers', id],
    queryFn: () => teachersApi.getById(id),
    enabled: !!id,
  });
};

export const useTeachersStats = () => {
  return useQuery({
    queryKey: ['teachers', 'stats'],
    queryFn: teachersApi.getStats,
  });
};

export const useCreateTeacher = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (teacher: Omit<Teacher, 'id'>) => teachersApi.create(teacher),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create teacher');
    },
  });
};

export const useUpdateTeacher = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Teacher> }) => 
      teachersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update teacher');
    },
  });
};

export const useDeleteTeacher = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => teachersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete teacher');
    },
  });
};
