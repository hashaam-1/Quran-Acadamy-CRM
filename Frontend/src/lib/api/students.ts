import api from './config';
import { Student } from '../store';

export const studentsApi = {
  getAll: async () => {
    const { data } = await api.get('/students');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/students/${id}`);
    return data;
  },

  create: async (student: Omit<Student, 'id'>) => {
    const { data } = await api.post('/students', student);
    return data;
  },

  update: async (id: string, student: Partial<Student>) => {
    const { data } = await api.put(`/students/${id}`, student);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/students/${id}`);
    return data;
  },

  getByTeacher: async (teacherId: string) => {
    const { data } = await api.get(`/students/teacher/${teacherId}`);
    return data;
  },

  getStats: async () => {
    const { data } = await api.get('/students/stats');
    return data;
  },
};
