import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api';
import { Lead } from '@/lib/store';
import { toast } from 'sonner';

export const useLeads = () => {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      console.log('Fetching leads from API...');
      const data = await leadsApi.getAll();
      console.log('Leads fetched:', data?.length || 0, 'leads');
      console.log('First lead sample:', data?.[0]);
      return data;
    },
  });
};

export const useLeadById = (id: string) => {
  return useQuery({
    queryKey: ['leads', id],
    queryFn: () => leadsApi.getById(id),
    enabled: !!id,
  });
};

export const useLeadsStats = () => {
  return useQuery({
    queryKey: ['leads', 'stats'],
    queryFn: leadsApi.getStats,
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (lead: Omit<Lead, 'id'>) => leadsApi.create(lead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create lead');
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lead> }) => 
      leadsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update lead');
    },
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => leadsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete lead');
    },
  });
};

export const useAddCallLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, callLog }: { id: string; callLog: any }) => 
      leadsApi.addCallLog(id, callLog),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Call log added successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add call log');
    },
  });
};
