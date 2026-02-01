import api from './config';

export const homeworkApi = {
  getAll: async () => {
    const { data } = await api.get('/homework');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/homework/${id}`);
    return data;
  },

  getByStudent: async (studentId: string) => {
    const { data } = await api.get(`/homework/student/${studentId}`);
    return data;
  },

  getByTeacher: async (teacherId: string) => {
    const { data } = await api.get(`/homework/teacher/${teacherId}`);
    return data;
  },

  create: async (homework: any) => {
    const { data } = await api.post('/homework', homework);
    return data;
  },

  update: async (id: string, homework: any) => {
    const { data } = await api.put(`/homework/${id}`, homework);
    return data;
  },

  submit: async (id: string, submissionNotes: string) => {
    const { data } = await api.put(`/homework/${id}/submit`, { submissionNotes });
    return data;
  },

  grade: async (id: string, grade: string, teacherFeedback: string) => {
    const { data } = await api.put(`/homework/${id}/grade`, { grade, teacherFeedback });
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/homework/${id}`);
    return data;
  },

  getStats: async () => {
    const { data } = await api.get('/homework/stats');
    return data;
  },
};
