import api from './config';
import { TeamMember } from '../store';

export const teamMembersApi = {
  getAll: async () => {
    const { data } = await api.get('/team-members');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/team-members/${id}`);
    return data;
  },

  create: async (member: Omit<TeamMember, 'id'>) => {
    const { data } = await api.post('/team-members', member);
    return data;
  },

  update: async (id: string, member: Partial<TeamMember>) => {
    const { data } = await api.put(`/team-members/${id}`, member);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/team-members/${id}`);
    return data;
  },

  getStats: async () => {
    const { data } = await api.get('/team-members/stats');
    return data;
  },
};
