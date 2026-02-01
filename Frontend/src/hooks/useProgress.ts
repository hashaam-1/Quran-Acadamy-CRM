import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { progressApi } from '@/lib/api';
import { ProgressRecord } from '@/lib/store';
import { toast } from 'sonner';

export const useProgressRecords = () => {
  return useQuery({
    queryKey: ['progress'],
    queryFn: progressApi.getAll,
  });
};

export const useProgressByStudent = (studentId: string) => {
  // Check if studentId is a valid MongoDB ObjectId (24 hex characters)
  const isValidObjectId = studentId && /^[0-9a-fA-F]{24}$/.test(studentId);
  
  return useQuery({
    queryKey: ['progress', 'student', studentId],
    queryFn: () => progressApi.getByStudent(studentId),
    enabled: !!studentId && isValidObjectId,
  });
};

export const useLatestProgress = () => {
  return useQuery({
    queryKey: ['progress', 'latest'],
    queryFn: progressApi.getLatest,
  });
};

export const useProgressStats = () => {
  return useQuery({
    queryKey: ['progress', 'stats'],
    queryFn: progressApi.getStats,
  });
};

export const useCreateProgress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (record: Omit<ProgressRecord, 'id'>) => progressApi.create(record),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      toast.success('Progress record created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create progress record');
    },
  });
};

export const useUpdateProgress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProgressRecord> }) => 
      progressApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      toast.success('Progress record updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update progress record');
    },
  });
};

export const useDeleteProgress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => progressApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      toast.success('Progress record deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete progress record');
    },
  });
};
