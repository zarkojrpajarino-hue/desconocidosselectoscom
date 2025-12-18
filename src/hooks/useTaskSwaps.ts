import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para gestionar los intercambios de tareas
 * Límite = 50% del total de tareas de la fase
 */
export const useTaskSwaps = (userId: string, phaseNumber?: number) => {
  const { currentOrganizationId } = useAuth();
  const [remainingSwaps, setRemainingSwaps] = useState<number>(0);
  const [totalSwaps, setTotalSwaps] = useState<number>(0);
  const [usedSwaps, setUsedSwaps] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calcula el número de semana actual
   */
  const getCurrentWeekNumber = useCallback(async (): Promise<number> => {
    try {
      const { data: systemConfig, error: fetchError } = await supabase
        .from('system_config')
        .select('week_start')
        .single();
      
      if (fetchError || !systemConfig?.week_start) {
        return calculateWeekOfYear();
      }

      const weekStart = new Date(systemConfig.week_start);
      if (isNaN(weekStart.getTime())) {
        return calculateWeekOfYear();
      }

      const now = new Date();
      const diffMs = now.getTime() - weekStart.getTime();
      
      if (diffMs < 0) {
        return calculateWeekOfYear();
      }

      return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
      
    } catch {
      return calculateWeekOfYear();
    }
  }, []);

  const calculateWeekOfYear = (): number => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const diffMs = now.getTime() - startOfYear.getTime();
    return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
  };

  /**
   * Carga los swaps restantes basado en 50% del total de tareas de la fase
   */
  const loadRemainingSwaps = useCallback(async () => {
    if (!userId || !currentOrganizationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get total tasks for the current phase
      let totalTasks = 0;
      
      if (phaseNumber) {
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .eq('organization_id', currentOrganizationId)
          .eq('phase', phaseNumber);
        
        if (!tasksError) {
          totalTasks = tasks?.length || 0;
        }
      } else {
        // Get current phase number first
        const { data: phase } = await supabase
          .from('business_phases')
          .select('phase_number')
          .eq('organization_id', currentOrganizationId)
          .eq('status', 'active')
          .maybeSingle();
        
        if (phase?.phase_number) {
          const { data: tasks } = await supabase
            .from('tasks')
            .select('id', { count: 'exact' })
            .eq('user_id', userId)
            .eq('organization_id', currentOrganizationId)
            .eq('phase', phase.phase_number);
          
          totalTasks = tasks?.length || 0;
        }
      }
      
      // Calculate swap limit = 50% of total tasks (minimum 3)
      const swapLimit = Math.max(3, Math.floor(totalTasks * 0.5));
      setTotalSwaps(swapLimit);
      
      // Get used swaps for this phase
      const weekNumber = await getCurrentWeekNumber();
      const { data: swapsUsed, error: fetchError } = await supabase
        .from('task_swaps')
        .select('id')
        .eq('user_id', userId);

      if (fetchError) {
        throw new Error(`Error al cargar swaps: ${fetchError.message}`);
      }

      const used = swapsUsed?.length || 0;
      setUsedSwaps(used);
      setRemainingSwaps(Math.max(0, swapLimit - used));
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error loading swaps:', message);
      setError(message);
      setRemainingSwaps(3); // Fallback mínimo
      setTotalSwaps(3);
    } finally {
      setLoading(false);
    }
  }, [userId, currentOrganizationId, phaseNumber, getCurrentWeekNumber]);

  useEffect(() => {
    loadRemainingSwaps();
  }, [loadRemainingSwaps]);

  return {
    remainingSwaps,
    totalSwaps,
    usedSwaps,
    loading,
    error,
    reload: loadRemainingSwaps,
  };
};
