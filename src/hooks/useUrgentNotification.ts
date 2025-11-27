import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInHours } from 'date-fns';

interface UseUrgentNotificationProps {
  userId: string | undefined;
  deadline: string | undefined;
  totalTasks: number;
  completedTasks: number;
}

export const useUrgentNotification = ({ 
  userId, 
  deadline, 
  totalTasks, 
  completedTasks 
}: UseUrgentNotificationProps) => {
  const notificationSentRef = useRef(false);

  useEffect(() => {
    if (!userId || !deadline || totalTasks === 0) return;

    const checkAndNotify = async () => {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const hours = differenceInHours(deadlineDate, now);
      
      const pendingPercentage = ((totalTasks - completedTasks) / totalTasks) * 100;
      
      // Send notification if: less than 48 hours AND more than 30% pending
      if (hours < 48 && hours > 0 && pendingPercentage > 30 && !notificationSentRef.current) {
        const pendingCount = totalTasks - completedTasks;
        
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'urgent_deadline',
            message: `🚨 URGENTE: Quedan ${hours} horas y tienes ${pendingCount} tareas pendientes (${Math.round(pendingPercentage)}%)`
          });
        
        notificationSentRef.current = true;
      }
      
      // Reset flag if conditions no longer met
      if (hours >= 48 || pendingPercentage <= 30) {
        notificationSentRef.current = false;
      }
    };

    checkAndNotify();
    const interval = setInterval(checkAndNotify, 3600000); // Check every hour

    return () => clearInterval(interval);
  }, [userId, deadline, totalTasks, completedTasks]);
};
