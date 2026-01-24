import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

interface WeeklyOKRGenerationState {
  hasGeneratedThisWeek: boolean;
  allOKRsCompleted: boolean;
  canGenerate: boolean;
  canRegenerateEnterprise: boolean;
  currentWeekStart: string;
  generationCount: number;
  plan: string;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const weeklyOKRKeys = {
  all: ['weeklyOKRGeneration'] as const,
  status: (userId: string | null, organizationId: string | null) =>
    [...weeklyOKRKeys.all, 'status', { userId, organizationId }] as const,
};

// ============================================================================
// FETCH FUNCTION
// ============================================================================

/**
 * Fetch weekly OKR generation status
 *
 * @param userId - User ID
 * @param organizationId - Organization ID
 * @returns WeeklyOKRGenerationState
 * @throws Error if fetch fails
 */
async function fetchWeeklyOKRGenerationStatus(
  userId: string | null,
  organizationId: string | null
): Promise<WeeklyOKRGenerationState> {
  if (!userId || !organizationId) {
    return {
      hasGeneratedThisWeek: false,
      allOKRsCompleted: false,
      canGenerate: false,
      canRegenerateEnterprise: false,
      currentWeekStart: '',
      generationCount: 0,
      plan: 'free',
    };
  }

  // 1. Obtener el week_start actual
  const { data: systemConfig } = await supabase
    .from('system_config')
    .select('week_start')
    .single();

  const weekStart = systemConfig?.week_start
    ? new Date(systemConfig.week_start).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  // 2. Obtener el plan de la organización
  const { data: orgData } = await supabase
    .from('organizations')
    .select('plan')
    .eq('id', organizationId)
    .single();

  const currentPlan = orgData?.plan || 'free';

  // 3. Contar generaciones de OKRs esta semana para este usuario
  const { count: generationCount } = await supabase
    .from('objectives')
    .select('*', { count: 'exact', head: true })
    .eq('owner_user_id', userId)
    .eq('organization_id', organizationId)
    .ilike('quarter', `%${weekStart}%`);

  const hasGenerated = (generationCount || 0) > 0;

  // 4. Verificar si todos los OKRs de esta semana están completados
  const { data: objectives } = await supabase
    .from('objectives')
    .select('id, status')
    .eq('owner_user_id', userId)
    .eq('organization_id', organizationId)
    .ilike('quarter', `%${weekStart}%`);

  const allCompleted = objectives && objectives.length > 0 &&
    objectives.every(obj => obj.status === 'completed');

  // 5. Verificar que todos los KRs también estén completados
  let allKRsCompleted = true;
  if (objectives && objectives.length > 0) {
    const objectiveIds = objectives.map(o => o.id);
    const { data: keyResults } = await supabase
      .from('key_results')
      .select('id, current_value, target_value')
      .in('objective_id', objectiveIds);

    if (keyResults && keyResults.length > 0) {
      allKRsCompleted = keyResults.every(kr => kr.current_value >= kr.target_value);
    }
  }

  const allOKRsCompleted = allCompleted && allKRsCompleted;

  // 6. Determinar si puede generar
  // - Si no ha generado esta semana: PUEDE generar
  // - Si ha generado y NO es Enterprise: NO puede generar más
  // - Si ha generado, ES Enterprise y completó todos: PUEDE regenerar
  const isEnterprise = currentPlan === 'enterprise';
  const canGenerate = !hasGenerated;
  const canRegenerateEnterprise = hasGenerated && isEnterprise && allOKRsCompleted;

  return {
    hasGeneratedThisWeek: hasGenerated,
    allOKRsCompleted,
    canGenerate: canGenerate || canRegenerateEnterprise,
    canRegenerateEnterprise,
    currentWeekStart: weekStart,
    generationCount: generationCount || 0,
    plan: currentPlan,
  };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Hook para controlar la generación de OKRs semanales
 *
 * Features:
 * - 1 generación por semana para TODOS los planes
 * - Enterprise puede regenerar si completa todos los OKRs antes de que acabe la semana
 * - Automatic caching and revalidation with React Query
 *
 * @returns Weekly OKR generation status and controls
 *
 * @example
 * const { canGenerate, hasGeneratedThisWeek, refreshStatus } = useWeeklyOKRGeneration();
 */
export function useWeeklyOKRGeneration() {
  const { user, currentOrganizationId } = useAuth();
  const queryClient = useQueryClient();

  // Query for weekly OKR generation status
  const {
    data = {
      hasGeneratedThisWeek: false,
      allOKRsCompleted: false,
      canGenerate: false,
      canRegenerateEnterprise: false,
      currentWeekStart: '',
      generationCount: 0,
      plan: 'free',
    },
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: weeklyOKRKeys.status(user?.id || null, currentOrganizationId),
    queryFn: () => fetchWeeklyOKRGenerationStatus(user?.id || null, currentOrganizationId),
    enabled: !!user?.id && !!currentOrganizationId,
    staleTime: 60 * 1000, // 60 seconds - week status doesn't change frequently
    onError: (error: Error) => {
      logger.error('Error checking OKR generation status:', error);
    },
  });

  const getBlockedMessage = (): string => {
    if (data.canGenerate) return '';

    if (data.plan === 'enterprise' && data.hasGeneratedThisWeek && !data.allOKRsCompleted) {
      return 'Completa todos tus OKRs actuales para poder generar nuevos esta semana';
    }

    return 'Ya has generado tus OKRs esta semana. Podrás generar nuevos la próxima semana.';
  };

  return {
    // Data
    hasGeneratedThisWeek: data.hasGeneratedThisWeek,
    allOKRsCompleted: data.allOKRsCompleted,
    canGenerate: data.canGenerate,
    canRegenerateEnterprise: data.canRegenerateEnterprise,
    currentWeekStart: data.currentWeekStart,
    generationCount: data.generationCount,
    plan: data.plan,
    loading,
    error: error as Error | null,

    // Actions
    getBlockedMessage,
    refreshStatus: refetch,
  };
}
