import api from './config';
import { Invoice } from '../store';

export const invoicesApi = {
  getAll: async () => {
    const { data } = await api.get('/invoices');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/invoices/${id}`);
    return data;
  },

  create: async (invoice: Omit<Invoice, 'id'>) => {
    const { data } = await api.post('/invoices', invoice);
    return data;
  },

  update: async (id: string, invoice: Partial<Invoice>) => {
    const { data } = await api.put(`/invoices/${id}`, invoice);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/invoices/${id}`);
    return data;
  },

  getByStudent: async (studentId: string) => {
    const { data } = await api.get(`/invoices/student/${studentId}`);
    return data;
  },

  markAsPaid: async (id: string) => {
    const { data } = await api.put(`/invoices/${id}/mark-paid`);
    return data;
  },

  getStats: async () => {
    const { data } = await api.get('/invoices/stats');
    return data;
  },
};
