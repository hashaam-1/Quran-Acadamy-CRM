import api from './config';
import { Teacher } from '../store';

export const teachersApi = {
  getAll: async () => {
    const { data } = await api.get('/teachers');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/teachers/${id}`);
    return data;
  },

  create: async (teacher: Omit<Teacher, 'id'>) => {
    const { data } = await api.post('/teachers', teacher);
    return data;
  },

  update: async (id: string, teacher: Partial<Teacher>) => {
    const { data } = await api.put(`/teachers/${id}`, teacher);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/teachers/${id}`);
    return data;
  },

  updateStudentCount: async (id: string) => {
    const { data } = await api.put(`/teachers/${id}/update-student-count`);
    return data;
  },

  getStats: async () => {
    const { data } = await api.get('/teachers/stats');
    return data;
  },
};
