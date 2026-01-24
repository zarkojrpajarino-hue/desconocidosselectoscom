import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Lead, UserLeadStats, CRMGlobalStats } from '@/types';
import { toast } from 'sonner';

/**
 * Hook for managing CRM leads data with React Query
 * Centralizes leads fetching and state management
 * MULTI-TENANCY: Filters by organization_id
 *
 * @refactored Uses React Query for data fetching, caching, and mutations
 */

// Query keys for cache management
export const leadsKeys = {
  all: ['leads'] as const,
  lists: () => [...leadsKeys.all, 'list'] as const,
  list: (organizationId: string | null | undefined) =>
    [...leadsKeys.lists(), { organizationId }] as const,
  userStats: (organizationId: string | null | undefined) =>
    [...leadsKeys.all, 'userStats', { organizationId }] as const,
  globalStats: (organizationId: string | null | undefined) =>
    [...leadsKeys.all, 'globalStats', { organizationId }] as const,
};

// Fetch functions
async function fetchLeads(
  userId: string | undefined,
  organizationId: string | null | undefined
): Promise<Lead[]> {
  if (!userId) return [];

  // MULTI-TENANCY: Filter by organization_id
  let query = supabase
    .from('leads')
    .select(`
      *,
      creator:users!leads_created_by_fkey(id, full_name),
      assignee:users!leads_assigned_to_fkey(id, full_name)
    `);

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as unknown as Lead[];
}

async function fetchUserStats(
  organizationId: string | null | undefined
): Promise<UserLeadStats[]> {
  // MULTI-TENANCY: Filter by organization_id
  let query = supabase
    .from('user_lead_stats')
    .select('*');

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data, error } = await query.order('total_leads', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function fetchGlobalStats(
  organizationId: string | null | undefined
): Promise<CRMGlobalStats> {
  // MULTI-TENANCY: Filter by organization_id
  let query = supabase
    .from('leads')
    .select('stage, estimated_value, created_at');

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data, error } = await query;

  if (error) throw error;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const stats: CRMGlobalStats = {
    total_leads: data?.length || 0,
    new_leads: data?.filter(l => new Date(l.created_at) >= thirtyDaysAgo).length || 0,
    hot_leads: data?.filter(l => l.stage === 'qualified' || l.stage === 'proposal').length || 0,
    won_leads: data?.filter(l => l.stage === 'won').length || 0,
    lost_leads: data?.filter(l => l.stage === 'lost').length || 0,
    total_pipeline_value: data
      ?.filter(l => !['won', 'lost'].includes(l.stage))
      .reduce((sum, l) => sum + (l.estimated_value || 0), 0) || 0,
    total_won_value: data
      ?.filter(l => l.stage === 'won')
      .reduce((sum, l) => sum + (l.estimated_value || 0), 0) || 0,
    avg_deal_size: 0,
  };

  if (stats.won_leads > 0) {
    stats.avg_deal_size = stats.total_won_value / stats.won_leads;
  }

  return stats;
}

/**
 * Main hook for managing leads
 */
export const useLeads = (userId: string | undefined, organizationId: string | null | undefined) => {
  const queryClient = useQueryClient();

  // Fetch leads with React Query
  const {
    data: leads = [],
    isLoading: leadsLoading,
    error: leadsError,
    refetch: refetchLeads,
  } = useQuery({
    queryKey: leadsKeys.list(organizationId),
    queryFn: () => fetchLeads(userId, organizationId),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    onError: (error: Error) => {
      console.error('Error fetching leads:', error.message);
      toast.error('Error al cargar leads', {
        description: error.message || 'Intenta de nuevo más tarde',
      });
    },
  });

  // Fetch user stats
  const {
    data: userStats = [],
    isLoading: userStatsLoading,
  } = useQuery({
    queryKey: leadsKeys.userStats(organizationId),
    queryFn: () => fetchUserStats(organizationId),
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
    onError: (error: Error) => {
      console.error('Error fetching user stats:', error.message);
      toast.error('Error al cargar estadísticas de usuarios');
    },
  });

  // Fetch global stats
  const {
    data: globalStats = null,
    isLoading: globalStatsLoading,
  } = useQuery({
    queryKey: leadsKeys.globalStats(organizationId),
    queryFn: () => fetchGlobalStats(organizationId),
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
    onError: (error: Error) => {
      console.error('Error fetching global stats:', error.message);
      toast.error('Error al cargar estadísticas globales');
    },
  });

  // Delete lead mutation
  const deleteMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: leadsKeys.list(organizationId) });
      queryClient.invalidateQueries({ queryKey: leadsKeys.globalStats(organizationId) });
      toast.success('Lead eliminado correctamente');
    },
    onError: (error: Error) => {
      console.error('Error deleting lead:', error.message);
      toast.error('Error al eliminar lead', {
        description: error.message || 'Intenta de nuevo',
      });
    },
  });

  // Update lead stage mutation
  const updateStageMutation = useMutation({
    mutationFn: async ({ leadId, newStage }: { leadId: string; newStage: string }) => {
      const { error } = await supabase
        .from('leads')
        .update({ stage: newStage })
        .eq('id', leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: leadsKeys.list(organizationId) });
      queryClient.invalidateQueries({ queryKey: leadsKeys.globalStats(organizationId) });
      toast.success('Etapa actualizada');
    },
    onError: (error: Error) => {
      console.error('Error updating lead stage:', error.message);
      toast.error('Error al actualizar etapa', {
        description: error.message,
      });
    },
  });

  // Combine loading states
  const loading = leadsLoading || userStatsLoading || globalStatsLoading;

  // Return same API as before for backward compatibility
  return {
    leads,
    userStats,
    globalStats,
    loading,
    error: leadsError as Error | null,
    refetch: refetchLeads,
    deleteLead: (leadId: string) => deleteMutation.mutate(leadId),
    updateLeadStage: (leadId: string, newStage: string) =>
      updateStageMutation.mutate({ leadId, newStage }),
  };
};
