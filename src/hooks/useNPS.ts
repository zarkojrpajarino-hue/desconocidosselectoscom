import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface NPSSurvey {
  id: string;
  organization_id: string;
  user_id: string;
  score: number;
  category: 'promoter' | 'passive' | 'detractor';
  feedback: string | null;
  improvement_suggestion: string | null;
  would_recommend_reason: string | null;
  follow_up_requested: boolean;
  follow_up_completed: boolean;
  follow_up_notes: string | null;
  survey_context: string | null;
  feature_ratings: Record<string, number> | null;
  created_at: string;
  updated_at: string;
}

export interface NPSScore {
  nps_score: number;
  promoters_count: number;
  passives_count: number;
  detractors_count: number;
  total_responses: number;
  promoters_pct: number;
  detractors_pct: number;
}

export interface NPSTrend {
  month: string;
  nps_score: number;
  responses: number;
}

/**
 * Hook for NPS surveys
 */
export function useNPS() {
  const { user, currentOrganizationId } = useAuth();
  const queryClient = useQueryClient();

  // Fetch recent NPS surveys
  const { data: surveys = [], isLoading: loadingSurveys } = useQuery({
    queryKey: ['nps-surveys', currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return [];

      const { data, error } = await supabase
        .from('nps_surveys')
        .select('*')
        .eq('organization_id', currentOrganizationId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as NPSSurvey[];
    },
    enabled: !!currentOrganizationId,
  });

  // Calculate NPS score
  const { data: npsScore, isLoading: loadingScore } = useQuery({
    queryKey: ['nps-score', currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return null;

      const { data, error } = await supabase.rpc('calculate_nps_score', {
        p_organization_id: currentOrganizationId,
        p_days: 90,
      });

      if (error) throw error;
      return data?.[0] as NPSScore | undefined;
    },
    enabled: !!currentOrganizationId,
  });

  // Get NPS trends
  const { data: npsTrends = [], isLoading: loadingTrends } = useQuery({
    queryKey: ['nps-trends', currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return [];

      const { data, error } = await supabase.rpc('get_nps_trends', {
        p_organization_id: currentOrganizationId,
        p_months: 6,
      });

      if (error) throw error;
      return data as NPSTrend[];
    },
    enabled: !!currentOrganizationId,
  });

  // Submit NPS response
  const submitNPSMutation = useMutation({
    mutationFn: async ({
      score,
      feedback,
      improvementSuggestion,
      surveyContext = 'manual',
      featureRatings,
    }: {
      score: number;
      feedback?: string;
      improvementSuggestion?: string;
      surveyContext?: string;
      featureRatings?: Record<string, number>;
    }) => {
      if (!user?.id || !currentOrganizationId) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase.from('nps_surveys').insert({
        organization_id: currentOrganizationId,
        user_id: user.id,
        score,
        feedback,
        improvement_suggestion: improvementSuggestion,
        survey_context: surveyContext,
        feature_ratings: featureRatings,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nps-surveys'] });
      queryClient.invalidateQueries({ queryKey: ['nps-score'] });
      queryClient.invalidateQueries({ queryKey: ['nps-trends'] });
      toast.success('¡Gracias por tu feedback!');
    },
    onError: () => {
      toast.error('Error al enviar encuesta');
    },
  });

  // Get category from score
  const getCategory = (score: number): 'promoter' | 'passive' | 'detractor' => {
    if (score >= 9) return 'promoter';
    if (score >= 7) return 'passive';
    return 'detractor';
  };

  // Get promoters, passives, detractors
  const promoters = surveys.filter(s => s.category === 'promoter');
  const passives = surveys.filter(s => s.category === 'passive');
  const detractors = surveys.filter(s => s.category === 'detractor');

  return {
    surveys,
    npsScore,
    npsTrends,
    promoters,
    passives,
    detractors,
    loadingSurveys,
    loadingScore,
    loadingTrends,
    submitNPS: submitNPSMutation.mutate,
    isSubmitting: submitNPSMutation.isPending,
    getCategory,
  };
}
