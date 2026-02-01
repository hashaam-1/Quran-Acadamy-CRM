import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardApi.getStats,
  });
};

export const useTeacherPerformanceData = () => {
  return useQuery({
    queryKey: ['dashboard', 'teacher-performance'],
    queryFn: dashboardApi.getTeacherPerformance,
  });
};

export const useInvoiceReportData = () => {
  return useQuery({
    queryKey: ['dashboard', 'invoice-report'],
    queryFn: dashboardApi.getInvoiceReport,
  });
};

export const useStudentLeaveAnalytics = () => {
  return useQuery({
    queryKey: ['dashboard', 'student-leave-analytics'],
    queryFn: dashboardApi.getStudentLeaveAnalytics,
  });
};

export const useLeadsPipelineData = () => {
  return useQuery({
    queryKey: ['dashboard', 'leads-pipeline'],
    queryFn: dashboardApi.getLeadsPipeline,
  });
};

export const useStudentProgressData = (studentId: string) => {
  return useQuery({
    queryKey: ['dashboard', 'student-progress', studentId],
    queryFn: () => dashboardApi.getStudentProgress(studentId),
    enabled: !!studentId,
  });
};

export const useSalesConversionData = () => {
  return useQuery({
    queryKey: ['dashboard', 'sales-conversion'],
    queryFn: dashboardApi.getSalesConversion,
  });
};
