import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamMembersApi } from '@/lib/api';
import { TeamMember } from '@/lib/store';
import { toast } from 'sonner';

export const useTeamMembers = () => {
  return useQuery({
    queryKey: ['teamMembers'],
    queryFn: teamMembersApi.getAll,
  });
};

export const useTeamMemberById = (id: string) => {
  return useQuery({
    queryKey: ['teamMembers', id],
    queryFn: () => teamMembersApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateTeamMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => teamMembersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      toast.success('Team member created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create team member');
    },
  });
};

export const useUpdateTeamMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TeamMember> }) => 
      teamMembersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      toast.success('Team member updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update team member');
    },
  });
};

export const useDeleteTeamMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => teamMembersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      toast.success('Team member deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete team member');
    },
  });
};
