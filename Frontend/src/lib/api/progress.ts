import api from './config';
import { ProgressRecord } from '../store';

export const progressApi = {
  getAll: async () => {
    const { data } = await api.get('/progress');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/progress/${id}`);
    return data;
  },

  create: async (record: Omit<ProgressRecord, 'id'>) => {
    const { data } = await api.post('/progress', record);
    return data;
  },

  update: async (id: string, record: Partial<ProgressRecord>) => {
    const { data } = await api.put(`/progress/${id}`, record);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/progress/${id}`);
    return data;
  },

  getByStudent: async (studentId: string) => {
    const { data } = await api.get(`/progress/student/${studentId}`);
    return data;
  },

  getLatest: async () => {
    const { data } = await api.get('/progress/latest');
    return data;
  },

  getStats: async () => {
    const { data } = await api.get('/progress/stats');
    return data;
  },
};
