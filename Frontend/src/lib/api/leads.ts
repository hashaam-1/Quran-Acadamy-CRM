import api from './config';
import { Lead } from '../store';

export const leadsApi = {
  getAll: async () => {
    const { data } = await api.get('/leads');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/leads/${id}`);
    return data;
  },

  create: async (lead: Omit<Lead, 'id'>) => {
    const { data } = await api.post('/leads', lead);
    return data;
  },

  update: async (id: string, lead: Partial<Lead>) => {
    const { data } = await api.put(`/leads/${id}`, lead);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/leads/${id}`);
    return data;
  },

  addCallLog: async (id: string, callLog: any) => {
    const { data } = await api.post(`/leads/${id}/call-logs`, callLog);
    return data;
  },

  getStats: async () => {
    const { data } = await api.get('/leads/stats');
    return data;
  },
};
