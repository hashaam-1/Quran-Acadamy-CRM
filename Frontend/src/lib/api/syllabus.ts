import { api } from './config';

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
  attachments?: string[];
}

export interface SyllabusFilters {
  course?: string;
  level?: string;
  status?: string;
  createdBy?: string;
}

export const syllabusApi = {
  // Get all syllabi with optional filters
  getAll: async (filters?: SyllabusFilters): Promise<Syllabus[]> => {
    const queryParams = new URLSearchParams();
    if (filters?.course) queryParams.append('course', filters.course);
    if (filters?.level) queryParams.append('level', filters.level);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.createdBy) queryParams.append('createdBy', filters.createdBy);
    
    const response = await api.get(`/syllabus?${queryParams.toString()}`);
    // Backend returns { success: true, data: [...] } - extract the data array
    return response.data?.data || [];
  },

  // Get single syllabus by ID
  getById: async (id: string): Promise<Syllabus> => {
    const response = await api.get(`/syllabus/${id}`);
    // Backend returns { success: true, data: {...} } - extract the data object
    return response.data?.data;
  },

  // Create new syllabus
  create: async (data: Partial<Syllabus> | FormData): Promise<Syllabus> => {
    const response = await api.post('/syllabus', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
    // Backend returns { success: true, data: {...} } - extract the data object
    return response.data?.data;
  },

  // Update syllabus
  update: async (id: string, data: Partial<Syllabus> | FormData): Promise<Syllabus> => {
    const response = await api.put(`/syllabus/${id}`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
    // Backend returns { success: true, data: {...} } - extract the data object
    return response.data?.data;
  },

  // Delete syllabus
  delete: async (id: string): Promise<void> => {
    await api.delete(`/syllabus/${id}`);
  },

  // Get syllabus statistics
  getStats: async (): Promise<{
    total: number;
    byCourse: Record<string, number>;
    byLevel: Record<string, number>;
    byStatus: Record<string, number>;
  }> => {
    const response = await api.get('/syllabus/stats');
    return response.data;
  },

  // Get syllabi by course
  getByCourse: async (course: string): Promise<Syllabus[]> => {
    const response = await api.get(`/syllabus/course/${course}`);
    return response.data;
  },

  // Get syllabi by creator
  getByCreator: async (creatorId: string): Promise<Syllabus[]> => {
    const response = await api.get(`/syllabus/creator/${creatorId}`);
    return response.data;
  },

  // Duplicate syllabus
  duplicate: async (id: string, newTitle?: string): Promise<Syllabus> => {
    const response = await api.post(`/syllabus/${id}/duplicate`, { title: newTitle });
    return response.data;
  },

  // Change syllabus status
  changeStatus: async (id: string, status: 'draft' | 'active' | 'archived'): Promise<Syllabus> => {
    const response = await api.patch(`/syllabus/${id}/status`, { status });
    return response.data;
  },

  // Add topic to syllabus
  addTopic: async (id: string, topic: { title: string; description?: string; duration?: string }): Promise<Syllabus> => {
    const response = await api.post(`/syllabus/${id}/topics`, topic);
    return response.data;
  },

  // Update topic in syllabus
  updateTopic: async (id: string, topicIndex: number, topic: { title: string; description?: string; duration?: string }): Promise<Syllabus> => {
    const response = await api.put(`/syllabus/${id}/topics/${topicIndex}`, topic);
    return response.data;
  },

  // Remove topic from syllabus
  removeTopic: async (id: string, topicIndex: number): Promise<Syllabus> => {
    const response = await api.delete(`/syllabus/${id}/topics/${topicIndex}`);
    return response.data;
  },

  // Reorder topics in syllabus
  reorderTopics: async (id: string, topicOrder: number[]): Promise<Syllabus> => {
    const response = await api.put(`/syllabus/${id}/topics/reorder`, { topicOrder });
    return response.data;
  }
};
