import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SWAP_LIMITS, WorkMode } from '@/constants/limits';

/**
 * Hook para gestionar los intercambios de tareas semanales
 * Con validaciones robustas y fallback inteligente
 */
export const useTaskSwaps = (userId: string, mode: WorkMode) => {
  const [remainingSwaps, setRemainingSwaps] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calcula el número de semana actual con validaciones
   */
  const getCurrentWeekNumber = useCallback(async (): Promise<number> => {
    try {
      const { data: systemConfig, error: fetchError } = await supabase
        .from('system_config')
        .select('week_start')
        .single();
      
      if (fetchError) {
        console.warn('Error fetching system_config:', fetchError);
        // Fallback: calcular semana del año
        return calculateWeekOfYear();
      }

      if (!systemConfig?.week_start) {
        console.warn('week_start no configurado en system_config');
        return calculateWeekOfYear();
      }

      const weekStart = new Date(systemConfig.week_start);
      
      // Validar que la fecha sea válida
      if (isNaN(weekStart.getTime())) {
        console.warn('week_start tiene formato inválido:', systemConfig.week_start);
        return calculateWeekOfYear();
      }

      const now = new Date();
      const diffMs = now.getTime() - weekStart.getTime();
      
      // Si la fecha es futura, usar fallback
      if (diffMs < 0) {
        console.warn('week_start está en el futuro');
        return calculateWeekOfYear();
      }

      const weekNumber = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
      return weekNumber;
      
    } catch (err) {
      console.error('Error calculating week number:', err);
      return calculateWeekOfYear();
    }
  }, []);

  /**
   * Fallback: calcular semana del año actual
   */
  const calculateWeekOfYear = (): number => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const diffMs = now.getTime() - startOfYear.getTime();
    return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
  };

  /**
   * Carga los swaps restantes para la semana actual
   */
  const loadRemainingSwaps = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const weekNumber = await getCurrentWeekNumber();
      
      const { data, error: fetchError } = await supabase
        .from('task_swaps')
        .select('id')
        .eq('user_id', userId)
        .eq('week_number', weekNumber);

      if (fetchError) {
        throw new Error(`Error al cargar swaps: ${fetchError.message}`);
      }

      const used = data?.length || 0;
      const limit = SWAP_LIMITS[mode];
      setRemainingSwaps(Math.max(0, limit - used));
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error loading swaps:', message);
      setError(message);
      // En caso de error, mostrar el límite completo
      setRemainingSwaps(SWAP_LIMITS[mode]);
    } finally {
      setLoading(false);
    }
  }, [userId, mode, getCurrentWeekNumber]);

  useEffect(() => {
    loadRemainingSwaps();
  }, [loadRemainingSwaps]);

  return {
    remainingSwaps,
    loading,
    error,
    reload: loadRemainingSwaps,
    limit: SWAP_LIMITS[mode]
  };
};
