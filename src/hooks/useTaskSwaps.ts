import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const swapLimits = {
  conservador: 5,
  moderado: 7,
  agresivo: 10
};

export const useTaskSwaps = (userId: string, mode: 'conservador' | 'moderado' | 'agresivo') => {
  const [remainingSwaps, setRemainingSwaps] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const getCurrentWeekNumber = async () => {
    const { data: systemConfig } = await supabase
      .from('system_config')
      .select('week_start')
      .single();

    if (!systemConfig) return 1;

    const weekStart = new Date(systemConfig.week_start);
    const now = new Date();
    const weekNumber = Math.floor((now.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
    return weekNumber;
  };

  const loadRemainingSwaps = async () => {
    setLoading(true);
    try {
      const weekNumber = await getCurrentWeekNumber();
      
      const { data, error } = await supabase
        .from('task_swaps')
        .select('id')
        .eq('user_id', userId)
        .eq('week_number', weekNumber);

      if (error) throw error;

      const used = data?.length || 0;
      const limit = swapLimits[mode];
      setRemainingSwaps(Math.max(0, limit - used));
    } catch (error) {
      console.error('Error loading swaps:', error);
      setRemainingSwaps(swapLimits[mode]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userId) {
      loadRemainingSwaps();
    }
  }, [userId, mode]);

  return {
    remainingSwaps,
    loading,
    reload: loadRemainingSwaps,
    limit: swapLimits[mode]
  };
};