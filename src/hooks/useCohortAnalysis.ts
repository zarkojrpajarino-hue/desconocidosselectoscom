import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UserCohort {
  id: string;
  organization_id: string;
  user_id: string;
  cohort_month: string;
  cohort_type: 'signup' | 'first_purchase' | 'plan_upgrade' | 'custom';
  first_action_at: string;
  last_action_at: string | null;
  total_actions: number;
  total_revenue: number;
  is_churned: boolean;
  churned_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CohortMetric {
  id: string;
  organization_id: string;
  cohort_month: string;
  cohort_type: string;
  period_month: string;
  period_number: number;
  total_users: number;
  active_users: number;
  retained_users: number;
  churned_users: number;
  retention_rate: number;
  avg_revenue_per_user: number;
  total_revenue: number;
  calculated_at: string;
}

export interface CohortRetentionData {
  cohort_month: string;
  cohort_size: number;
  retention: Array<{
    month: number;
    rate: number;
    users: number;
  }>;
}

/**
 * Hook for cohort analysis
 */
export function useCohortAnalysis() {
  const { currentOrganizationId } = useAuth();
  const queryClient = useQueryClient();

  // Fetch cohort metrics
  const { data: cohortMetrics = [], isLoading: loadingMetrics } = useQuery({
    queryKey: ['cohort-metrics', currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return [];

      const { data, error } = await supabase
        .from('cohort_metrics')
        .select('*')
        .eq('organization_id', currentOrganizationId)
        .order('cohort_month', { ascending: false })
        .order('period_number', { ascending: true });

      if (error) throw error;
      return data as CohortMetric[];
    },
    enabled: !!currentOrganizationId,
  });

  // Fetch user cohorts
  const { data: userCohorts = [], isLoading: loadingCohorts } = useQuery({
    queryKey: ['user-cohorts', currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return [];

      const { data, error } = await supabase
        .from('user_cohorts')
        .select('*')
        .eq('organization_id', currentOrganizationId)
        .order('cohort_month', { ascending: false });

      if (error) throw error;
      return data as UserCohort[];
    },
    enabled: !!currentOrganizationId,
  });

  // Calculate cohort metrics
  const calculateMetricsMutation = useMutation({
    mutationFn: async () => {
      if (!currentOrganizationId) throw new Error('No organization');

      const { data, error } = await supabase.rpc('calculate_cohort_metrics', {
        p_organization_id: currentOrganizationId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohort-metrics'] });
      toast.success('Métricas de cohortes actualizadas');
    },
    onError: () => {
      toast.error('Error al calcular métricas');
    },
  });

  // Group metrics by cohort for heatmap display
  const cohortsByMonth = cohortMetrics.reduce((acc, metric) => {
    if (!acc[metric.cohort_month]) {
      acc[metric.cohort_month] = {
        cohort_month: metric.cohort_month,
        cohort_size: metric.total_users,
        retention: [],
      };
    }
    acc[metric.cohort_month].retention.push({
      month: metric.period_number,
      rate: metric.retention_rate,
      users: metric.active_users,
    });
    return acc;
  }, {} as Record<string, CohortRetentionData>);

  const cohorts = Object.values(cohortsByMonth);

  // Calculate average retention by month
  const avgRetentionByMonth: Record<number, number> = {};
  cohortMetrics.forEach(metric => {
    if (!avgRetentionByMonth[metric.period_number]) {
      avgRetentionByMonth[metric.period_number] = 0;
    }
    avgRetentionByMonth[metric.period_number] += metric.retention_rate;
  });

  const uniqueMonths = [...new Set(cohortMetrics.map(m => m.period_number))];
  uniqueMonths.forEach(month => {
    const count = cohortMetrics.filter(m => m.period_number === month).length;
    if (count > 0) {
      avgRetentionByMonth[month] = avgRetentionByMonth[month] / count;
    }
  });

  // Get cohort summary stats
  const stats = {
    totalCohorts: cohorts.length,
    avgMonth3Retention: avgRetentionByMonth[3] ?? 0,
    avgMonth6Retention: avgRetentionByMonth[6] ?? 0,
    avgMonth12Retention: avgRetentionByMonth[12] ?? 0,
    totalUsers: userCohorts.length,
    churnedUsers: userCohorts.filter(u => u.is_churned).length,
  };

  return {
    cohortMetrics,
    userCohorts,
    cohorts,
    avgRetentionByMonth,
    stats,
    loadingMetrics,
    loadingCohorts,
    calculateMetrics: calculateMetricsMutation.mutate,
    isCalculating: calculateMetricsMutation.isPending,
  };
}
