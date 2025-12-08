import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Lead, UserLeadStats, CRMGlobalStats } from '@/types';
import { toast } from 'sonner';

/**
 * Hook for managing CRM leads data
 * Centralizes leads fetching and state management
 * MULTI-TENANCY: Filters by organization_id
 */
export const useLeads = (userId: string | undefined, organizationId: string | null | undefined) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [userStats, setUserStats] = useState<UserLeadStats[]>([]);
  const [globalStats, setGlobalStats] = useState<CRMGlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLeads = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

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

      const { data, error: fetchError } = await query.order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Los datos de Supabase incluyen relaciones parciales, usar unknown primero
      setLeads((data || []) as unknown as Lead[]);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido');
      console.error('Error fetching leads:', error.message);
      setError(error);
      toast.error('Error al cargar leads', {
        description: error.message || 'Intenta de nuevo más tarde',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const { data, error: statsError } = await supabase
        .from('user_lead_stats')
        .select('*')
        .order('total_leads', { ascending: false });

      if (statsError) throw statsError;
      setUserStats(data || []);
    } catch (err) {
      console.error('Error fetching user stats:', err instanceof Error ? err.message : err);
      toast.error('Error al cargar estadísticas de usuarios');
    }
  };

  const fetchGlobalStats = async () => {
    try {
      // MULTI-TENANCY: Filter by organization_id
      let query = supabase
        .from('leads')
        .select('stage, estimated_value, created_at');

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error: globalError } = await query;

      if (globalError) throw globalError;

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

      setGlobalStats(stats);
    } catch (err) {
      console.error('Error fetching global stats:', err instanceof Error ? err.message : err);
      toast.error('Error al cargar estadísticas globales');
    }
  };

  const deleteLead = async (leadId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (deleteError) throw deleteError;

      toast.success('Lead eliminado correctamente');
      await fetchLeads();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido');
      console.error('Error deleting lead:', error.message);
      toast.error('Error al eliminar lead', {
        description: error.message || 'Intenta de nuevo',
      });
    }
  };

  const updateLeadStage = async (leadId: string, newStage: string) => {
    try {
      const { error: updateError } = await supabase
        .from('leads')
        .update({ stage: newStage })
        .eq('id', leadId);

      if (updateError) throw updateError;

      toast.success('Etapa actualizada');
      await fetchLeads();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido');
      console.error('Error updating lead stage:', error.message);
      toast.error('Error al actualizar etapa', {
        description: error.message,
      });
    }
  };

  useEffect(() => {
    if (userId) {
      fetchLeads();
      fetchUserStats();
      fetchGlobalStats();
    }
  }, [userId, organizationId]);

  return {
    leads,
    userStats,
    globalStats,
    loading,
    error,
    refetch: fetchLeads,
    deleteLead,
    updateLeadStage,
  };
};
