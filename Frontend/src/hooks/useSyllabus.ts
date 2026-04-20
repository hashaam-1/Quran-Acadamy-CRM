import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { syllabusApi } from '@/lib/api';

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
      return await syllabusApi.getAll(filters);
    },
  });
};

// Get single syllabus by ID
export const useSyllabus = (id: string) => {
  return useQuery({
    queryKey: ['syllabus', id],
    queryFn: async () => {
      return await syllabusApi.getById(id);
    },
    enabled: !!id,
  });
};

// Get syllabus statistics
export const useSyllabusStats = () => {
  return useQuery({
    queryKey: ['syllabus', 'stats'],
    queryFn: async () => {
      return await syllabusApi.getStats();
    },
  });
};

// Create syllabus
export const useCreateSyllabus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Syllabus>) => {
      return await syllabusApi.create(data);
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
    mutationFn: async ({ id, data }: { id: string; data: Partial<Syllabus> }) => {
      return await syllabusApi.update(id, data);
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
      return await syllabusApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syllabus'] });
    },
  });
};
