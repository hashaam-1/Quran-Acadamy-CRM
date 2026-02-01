import api from './config';

export const studentLeavesApi = {
  getAll: async () => {
    const { data } = await api.get('/student-leaves');
    return data;
  },

  create: async (leave: any) => {
    const { data } = await api.post('/student-leaves', leave);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/student-leaves/${id}`);
    return data;
  },

  getStats: async () => {
    const { data } = await api.get('/student-leaves/stats');
    return data;
  },
};
