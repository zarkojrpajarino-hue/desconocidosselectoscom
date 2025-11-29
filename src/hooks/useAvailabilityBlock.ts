import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseAvailabilityBlockProps {
  userId: string | undefined;
  weekStart: string;
}

export const useAvailabilityBlock = ({ userId, weekStart }: UseAvailabilityBlockProps) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [hasAvailability, setHasAvailability] = useState<boolean | null>(null);

  useEffect(() => {
    if (!userId || !weekStart) return;

    checkAvailabilityStatus();
  }, [userId, weekStart]);

  const checkAvailabilityStatus = async () => {
    if (!userId) return;

    try {
      // Verificar si usuario tiene disponibilidad
      const { data: availability } = await supabase
        .from('user_weekly_availability')
        .select('id')
        .eq('user_id', userId)
        .eq('week_start', weekStart)
        .maybeSingle();

      setHasAvailability(!!availability);

      // Verificar si estamos después del deadline (lunes 13:00)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const currentTime = now.getHours() * 100 + now.getMinutes();

      // Si es lunes después de las 13:00 o cualquier día después del lunes
      // Y NO tiene disponibilidad → BLOQUEAR
      if (((dayOfWeek === 1 && currentTime >= 1300) || dayOfWeek > 1) && !availability) {
        setIsBlocked(true);
      } else {
        setIsBlocked(false);
      }
    } catch (error) {
      console.error('Error checking availability status:', error);
    }
  };

  return {
    isBlocked,
    hasAvailability,
    recheckStatus: checkAvailabilityStatus
  };
};