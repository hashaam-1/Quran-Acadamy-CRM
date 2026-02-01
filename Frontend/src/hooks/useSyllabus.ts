import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Syllabus {
  _id: string;
  id: string;
  title: string;
  course: 'Qaida' | 'Nazra' | 'Hifz' | 'Tajweed';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  duration: string;
  topics: {
    title: string;
    description?: string;
    duration?: string;
    order?: number;
  }[];
  objectives: string[];
  prerequisites: string[];
  materials: string[];
  assessmentCriteria: string[];
  createdBy: string;
  createdByName: string;
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface SyllabusFilters {
  course?: string;
  level?: string;
  status?: string;
}

// Get all syllabi
export const useSyllabi = (filters?: SyllabusFilters) => {
  return useQuery({
    queryKey: ['syllabus', filters],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (filters?.course) queryParams.append('course', filters.course);
      if (filters?.level) queryParams.append('level', filters.level);
      if (filters?.status) queryParams.append('status', filters.status);
      
      const response = await api.get(`/syllabus?${queryParams.toString()}`);
      return response.data as Syllabus[];
    },
  });
};

// Get single syllabus by ID
export const useSyllabus = (id: string) => {
  return useQuery({
    queryKey: ['syllabus', id],
    queryFn: async () => {
      const response = await api.get(`/syllabus/${id}`);
      return response.data as Syllabus;
    },
    enabled: !!id,
  });
};

// Get syllabus statistics
export const useSyllabusStats = () => {
  return useQuery({
    queryKey: ['syllabus', 'stats'],
    queryFn: async () => {
      const response = await api.get('/syllabus/stats');
      return response.data;
    },
  });
};

// Create syllabus
export const useCreateSyllabus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Syllabus> | FormData) => {
      const response = await api.post('/syllabus', data, {
        headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syllabus'] });
    },
  });
};

// Update syllabus
export const useUpdateSyllabus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Syllabus> | FormData }) => {
      const response = await api.put(`/syllabus/${id}`, data, {
        headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syllabus'] });
    },
  });
};

// Delete syllabus
export const useDeleteSyllabus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/syllabus/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syllabus'] });
    },
  });
};
