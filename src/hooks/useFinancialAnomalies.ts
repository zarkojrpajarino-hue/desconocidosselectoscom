import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface FinancialAnomaly {
  id: string;
  organization_id: string;
  anomaly_type: 'burn_rate_spike' | 'low_runway' | 'revenue_decline' | 'negative_margin' | 'high_cac' | 'high_churn';
  severity: 'critical' | 'high' | 'medium';
  title: string;
  message: string;
  metric_name: string;
  current_value: number | null;
  previous_value: number | null;
  threshold_value: number | null;
  period_start: string;
  period_end: string;
  action_url: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  dismissed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DetectedAnomaly {
  anomaly_type: string;
  severity: string;
  title: string;
  message: string;
  metric_name: string;
  current_value: number | null;
  previous_value: number | null;
  threshold_value: number | null;
  action_url: string | null;
}

interface UseFinancialAnomaliesReturn {
  anomalies: FinancialAnomaly[];
  criticalAnomalies: FinancialAnomaly[];
  loading: boolean;
  error: Error | null;
  detectAnomalies: () => Promise<DetectedAnomaly[]>;
  resolveAnomaly: (anomalyId: string) => void;
  dismissAnomaly: (anomalyId: string) => void;
  refreshAnomalies: () => void;
}

export function useFinancialAnomalies(): UseFinancialAnomaliesReturn {
  const { currentOrganizationId } = useAuth();
  const queryClient = useQueryClient();

  const { 
    data: anomalies = [], 
    isLoading: loading,
    error 
  } = useQuery({
    queryKey: ['financial-anomalies', currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return [];

      logger.log('[useFinancialAnomalies] Fetching anomalies for org:', currentOrganizationId);

      const { data, error } = await supabase
        .from('financial_anomalies')
        .select('*')
        .eq('organization_id', currentOrganizationId)
        .eq('is_resolved', false)
        .is('dismissed_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data as FinancialAnomaly[];
    },
    enabled: !!currentOrganizationId,
    refetchInterval: 5 * 60 * 1000,
  });

  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');

  const detectAnomalies = async (): Promise<DetectedAnomaly[]> => {
    if (!currentOrganizationId) {
      throw new Error('No organization selected');
    }

    logger.log('[useFinancialAnomalies] Detecting anomalies...');

    const { data, error } = await supabase.rpc('detect_financial_anomalies', {
      p_organization_id: currentOrganizationId,
    });

    if (error) {
      logger.error('[useFinancialAnomalies] Error detecting anomalies:', error);
      throw error;
    }

    logger.log('[useFinancialAnomalies] Detected anomalies:', data);

    return data as DetectedAnomaly[];
  };

  const resolveAnomalyMutation = useMutation({
    mutationFn: async (anomalyId: string) => {
      logger.log('[useFinancialAnomalies] Resolving anomaly:', anomalyId);

      const { error } = await supabase
        .from('financial_anomalies')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', anomalyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-anomalies'] });
      toast.success('Anomalía marcada como resuelta');
    },
    onError: (error: Error) => {
      logger.error('[useFinancialAnomalies] Error resolving anomaly:', error);
      toast.error('Error al resolver anomalía');
    },
  });

  const dismissAnomalyMutation = useMutation({
    mutationFn: async (anomalyId: string) => {
      logger.log('[useFinancialAnomalies] Dismissing anomaly:', anomalyId);

      const { error } = await supabase
        .from('financial_anomalies')
        .update({
          dismissed_at: new Date().toISOString(),
        })
        .eq('id', anomalyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-anomalies'] });
      toast.success('Alerta ocultada');
    },
    onError: (error: Error) => {
      logger.error('[useFinancialAnomalies] Error dismissing anomaly:', error);
      toast.error('Error al ocultar alerta');
    },
  });

  const refreshAnomalies = () => {
    queryClient.invalidateQueries({ queryKey: ['financial-anomalies'] });
  };

  return {
    anomalies,
    criticalAnomalies,
    loading,
    error: error as Error | null,
    detectAnomalies,
    resolveAnomaly: resolveAnomalyMutation.mutate,
    dismissAnomaly: dismissAnomalyMutation.mutate,
    refreshAnomalies,
  };
}
