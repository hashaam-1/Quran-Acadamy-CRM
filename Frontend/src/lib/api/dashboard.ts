import api from './config';

export const dashboardApi = {
  getStats: async () => {
    const { data } = await api.get('/dashboard/stats');
    return data;
  },

  getTeacherPerformance: async () => {
    const { data } = await api.get('/dashboard/teacher-performance');
    return data;
  },

  getInvoiceReport: async () => {
    const { data } = await api.get('/dashboard/invoice-report');
    return data;
  },

  getStudentLeaveAnalytics: async () => {
    const { data } = await api.get('/dashboard/student-leave-analytics');
    return data;
  },

  getLeadsPipeline: async () => {
    const { data } = await api.get('/dashboard/leads-pipeline');
    return data;
  },

  getStudentProgress: async (studentId: string) => {
    const { data } = await api.get(`/dashboard/student-progress/${studentId}`);
    return data;
  },

  getSalesConversion: async () => {
    const { data } = await api.get('/dashboard/sales-conversion');
    return data;
  },
};
