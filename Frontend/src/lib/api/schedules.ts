import api from './config';
import { ClassSchedule } from '../store';

export const schedulesApi = {
  getAll: async () => {
    const { data } = await api.get('/schedules');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/schedules/${id}`);
    return data;
  },

  create: async (schedule: Omit<ClassSchedule, 'id'>) => {
    const { data } = await api.post('/schedules', schedule);
    return data;
  },

  update: async (id: string, schedule: Partial<ClassSchedule>) => {
    const { data } = await api.put(`/schedules/${id}`, schedule);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/schedules/${id}`);
    return data;
  },

  getByDay: async (day: string) => {
    const { data } = await api.get(`/schedules/day/${day}`);
    return data;
  },

  getByTeacher: async (teacherId: string) => {
    const { data } = await api.get(`/schedules/teacher/${teacherId}`);
    return data;
  },

  requestReschedule: async (id: string, request: any) => {
    const { data } = await api.post(`/schedules/${id}/reschedule`, request);
    return data;
  },

  handleReschedule: async (id: string, approved: boolean) => {
    const { data } = await api.put(`/schedules/${id}/reschedule/handle`, { approved });
    return data;
  },

  getStats: async () => {
    const { data } = await api.get('/schedules/stats');
    return data;
  },
};
