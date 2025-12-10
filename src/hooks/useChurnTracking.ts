import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface ChurnSurvey {
  id: string;
  organization_id: string;
  user_id: string;
  cancellation_date: string;
  plan_before_cancel: string;
  mrr_lost: number | null;
  reason: string;
  reason_detail: string | null;
  reason_category: string;
  missing_features: string[] | null;
  retention_offer_shown: boolean;
  retention_offer_type: string | null;
  retention_offer_accepted: boolean;
  discount_percentage: number | null;
  nps_score: number | null;
  would_recommend: boolean | null;
  competitor_name: string | null;
  created_at: string;
}

export interface ChurnRateData {
  period_start: string;
  period_end: string;
  total_customers: number;
  churned_customers: number;
  churn_rate: number;
  mrr_lost: number;
}

export interface ChurnReasonBreakdown {
  reason: string;
  reason_category: string;
  count: number;
  percentage: number;
}

export interface RetentionOfferStats {
  offer_type: string;
  offers_shown: number;
  offers_accepted: number;
  success_rate: number;
  mrr_saved: number;
}

export interface ChurnSurveyData {
  plan_before_cancel: string;
  mrr_lost?: number;
  reason: string;
  reason_detail?: string;
  missing_features?: string[];
  retention_offer_shown?: boolean;
  retention_offer_type?: string;
  retention_offer_accepted?: boolean;
  discount_percentage?: number;
  nps_score?: number;
  would_recommend?: boolean;
  competitor_name?: string;
}

interface UseChurnTrackingReturn {
  surveys: ChurnSurvey[];
  churnRate: ChurnRateData | null;
  reasonsBreakdown: ChurnReasonBreakdown[];
  retentionStats: RetentionOfferStats[];
  loading: boolean;
  error: Error | null;
  submitChurnSurvey: (data: ChurnSurveyData) => void;
  refreshData: () => void;
}

export function useChurnTracking(periodMonths: number = 3): UseChurnTrackingReturn {
  const { user, currentOrganizationId } = useAuth();
  const queryClient = useQueryClient();

  const { 
    data: surveys = [], 
    isLoading: surveysLoading,
    error: surveysError 
  } = useQuery({
    queryKey: ['churn-surveys', currentOrganizationId, periodMonths],
    queryFn: async () => {
      if (!currentOrganizationId) return [];

      logger.log('[useChurnTracking] Fetching surveys for org:', currentOrganizationId);

      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - periodMonths);

      const { data, error } = await supabase
        .from('churn_surveys')
        .select('*')
        .eq('organization_id', currentOrganizationId)
        .gte('cancellation_date', startDate.toISOString())
        .order('cancellation_date', { ascending: false });

      if (error) throw error;

      return data as ChurnSurvey[];
    },
    enabled: !!currentOrganizationId,
  });

  const { 
    data: churnRate = null, 
    isLoading: rateLoading 
  } = useQuery({
    queryKey: ['churn-rate', currentOrganizationId, periodMonths],
    queryFn: async () => {
      if (!currentOrganizationId) return null;

      logger.log('[useChurnTracking] Calculating churn rate');

      const { data, error } = await supabase.rpc('calculate_churn_rate', {
        p_organization_id: currentOrganizationId,
        p_period_months: periodMonths,
      });

      if (error) throw error;

      return data?.[0] as ChurnRateData || null;
    },
    enabled: !!currentOrganizationId,
  });

  const { 
    data: reasonsBreakdown = [], 
    isLoading: reasonsLoading 
  } = useQuery({
    queryKey: ['churn-reasons', currentOrganizationId, periodMonths],
    queryFn: async () => {
      if (!currentOrganizationId) return [];

      logger.log('[useChurnTracking] Fetching reasons breakdown');

      const { data, error } = await supabase.rpc('get_churn_reasons_breakdown', {
        p_organization_id: currentOrganizationId,
        p_period_months: periodMonths,
      });

      if (error) throw error;

      return data as ChurnReasonBreakdown[];
    },
    enabled: !!currentOrganizationId,
  });

  const { 
    data: retentionStats = [], 
    isLoading: retentionLoading 
  } = useQuery({
    queryKey: ['retention-stats', currentOrganizationId, periodMonths],
    queryFn: async () => {
      if (!currentOrganizationId) return [];

      logger.log('[useChurnTracking] Fetching retention stats');

      const { data, error } = await supabase.rpc('get_retention_success_rate', {
        p_organization_id: currentOrganizationId,
        p_period_months: periodMonths,
      });

      if (error) throw error;

      return data as RetentionOfferStats[];
    },
    enabled: !!currentOrganizationId,
  });

  const submitChurnSurveyMutation = useMutation({
    mutationFn: async (surveyData: ChurnSurveyData) => {
      if (!user?.id || !currentOrganizationId) {
        throw new Error('User not authenticated');
      }

      logger.log('[useChurnTracking] Submitting churn survey:', surveyData);

      const { error } = await supabase
        .from('churn_surveys')
        .insert({
          organization_id: currentOrganizationId,
          user_id: user.id,
          ...surveyData,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['churn-surveys'] });
      queryClient.invalidateQueries({ queryKey: ['churn-rate'] });
      queryClient.invalidateQueries({ queryKey: ['churn-reasons'] });
      queryClient.invalidateQueries({ queryKey: ['retention-stats'] });
      
      toast.success('Gracias por tu feedback');
      
      logger.log('[useChurnTracking] Survey submitted successfully');
    },
    onError: (error: Error) => {
      logger.error('[useChurnTracking] Error submitting survey:', error);
      toast.error('Error al enviar feedback');
    },
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['churn-surveys'] });
    queryClient.invalidateQueries({ queryKey: ['churn-rate'] });
    queryClient.invalidateQueries({ queryKey: ['churn-reasons'] });
    queryClient.invalidateQueries({ queryKey: ['retention-stats'] });
  };

  const loading = surveysLoading || rateLoading || reasonsLoading || retentionLoading;
  const error = surveysError as Error | null;

  return {
    surveys,
    churnRate,
    reasonsBreakdown,
    retentionStats,
    loading,
    error,
    submitChurnSurvey: submitChurnSurveyMutation.mutate,
    refreshData,
  };
}
