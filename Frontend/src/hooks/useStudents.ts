import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsApi } from '@/lib/api';
import { Student } from '@/lib/store';
import { toast } from 'sonner';

export const useStudents = () => {
  return useQuery({
    queryKey: ['students'],
    queryFn: studentsApi.getAll,
  });
};

export const useStudentById = (id: string) => {
  return useQuery({
    queryKey: ['students', id],
    queryFn: () => studentsApi.getById(id),
    enabled: !!id,
  });
};

export const useStudentsByTeacher = (teacherId: string) => {
  return useQuery({
    queryKey: ['students', 'teacher', teacherId],
    queryFn: () => studentsApi.getByTeacher(teacherId),
    enabled: !!teacherId,
  });
};

export const useStudentsStats = () => {
  return useQuery({
    queryKey: ['students', 'stats'],
    queryFn: studentsApi.getStats,
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (student: Omit<Student, 'id'>) => {
      console.log('Creating student with data:', student);
      return studentsApi.create(student);
    },
    onSuccess: (response) => {
      console.log('Student created successfully:', response);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student created successfully');
    },
    onError: (error: any) => {
      console.error('Failed to create student:', error);
      toast.error(error.response?.data?.message || 'Failed to create student');
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Student> }) => 
      studentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update student');
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => studentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete student');
    },
  });
};
