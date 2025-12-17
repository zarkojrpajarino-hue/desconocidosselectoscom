import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

interface WeeklyOKRGenerationState {
  hasGeneratedThisWeek: boolean;
  allOKRsCompleted: boolean;
  canGenerate: boolean;
  canRegenerateEnterprise: boolean;
  loading: boolean;
  currentWeekStart: string;
  generationCount: number;
}

/**
 * Hook para controlar la generación de OKRs semanales
 * - 1 generación por semana para TODOS los planes
 * - Enterprise puede regenerar si completa todos los OKRs antes de que acabe la semana
 */
export function useWeeklyOKRGeneration() {
  const { user, currentOrganizationId } = useAuth();
  const [state, setState] = useState<WeeklyOKRGenerationState>({
    hasGeneratedThisWeek: false,
    allOKRsCompleted: false,
    canGenerate: true,
    canRegenerateEnterprise: false,
    loading: true,
    currentWeekStart: '',
    generationCount: 0
  });
  const [plan, setPlan] = useState<string>('free');

  const checkGenerationStatus = useCallback(async () => {
    if (!user?.id || !currentOrganizationId) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Obtener el week_start actual
      const { data: systemConfig } = await supabase
        .from('system_config')
        .select('week_start')
        .single();

      const weekStart = systemConfig?.week_start 
        ? new Date(systemConfig.week_start).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      // Obtener el plan de la organización
      const { data: orgData } = await supabase
        .from('organizations')
        .select('plan')
        .eq('id', currentOrganizationId)
        .single();

      const currentPlan = orgData?.plan || 'free';
      setPlan(currentPlan);

      // Contar generaciones de OKRs esta semana para este usuario
      const { count: generationCount } = await supabase
        .from('objectives')
        .select('*', { count: 'exact', head: true })
        .eq('owner_user_id', user.id)
        .eq('organization_id', currentOrganizationId)
        .ilike('quarter', `%${weekStart}%`);

      const hasGenerated = (generationCount || 0) > 0;

      // Verificar si todos los OKRs de esta semana están completados
      const { data: objectives } = await supabase
        .from('objectives')
        .select('id, status')
        .eq('owner_user_id', user.id)
        .eq('organization_id', currentOrganizationId)
        .ilike('quarter', `%${weekStart}%`);

      const allCompleted = objectives && objectives.length > 0 && 
        objectives.every(obj => obj.status === 'completed');

      // Verificar que todos los KRs también estén completados
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

      // Determinar si puede generar
      // - Si no ha generado esta semana: PUEDE generar
      // - Si ha generado y NO es Enterprise: NO puede generar más
      // - Si ha generado, ES Enterprise y completó todos: PUEDE regenerar
      const isEnterprise = currentPlan === 'enterprise';
      const canGenerate = !hasGenerated;
      const canRegenerateEnterprise = hasGenerated && isEnterprise && allOKRsCompleted;

      setState({
        hasGeneratedThisWeek: hasGenerated,
        allOKRsCompleted,
        canGenerate: canGenerate || canRegenerateEnterprise,
        canRegenerateEnterprise,
        loading: false,
        currentWeekStart: weekStart,
        generationCount: generationCount || 0
      });

    } catch (error) {
      logger.error('Error checking OKR generation status:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user?.id, currentOrganizationId]);

  useEffect(() => {
    checkGenerationStatus();
  }, [checkGenerationStatus]);

  const getBlockedMessage = (): string => {
    if (state.canGenerate) return '';
    
    if (plan === 'enterprise' && state.hasGeneratedThisWeek && !state.allOKRsCompleted) {
      return 'Completa todos tus OKRs actuales para poder generar nuevos esta semana';
    }
    
    return 'Ya has generado tus OKRs esta semana. Podrás generar nuevos la próxima semana.';
  };

  return {
    ...state,
    plan,
    getBlockedMessage,
    refreshStatus: checkGenerationStatus
  };
}
