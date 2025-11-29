import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';

interface MetricsReminderState {
  showReminder: boolean;
  daysSinceLastUpdate: number;
}

export const useMetricsReminder = (userId: string | undefined) => {
  const [reminderState, setReminderState] = useState<MetricsReminderState>({
    showReminder: false,
    daysSinceLastUpdate: 0
  });

  useEffect(() => {
    if (!userId) return;

    const checkLastUpdate = async () => {
      try {
        // Get the most recent metric update
        const { data, error } = await supabase
          .from('business_metrics')
          .select('metric_date, updated_at')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking metrics:', error);
          return;
        }

        if (!data) {
          // No metrics yet - show reminder after 3 days of signup
          const { data: userData } = await supabase
            .from('users')
            .select('created_at')
            .eq('id', userId)
            .single();

          if (userData?.created_at) {
            const daysSinceSignup = differenceInDays(new Date(), new Date(userData.created_at));
            if (daysSinceSignup >= 3) {
              setReminderState({
                showReminder: true,
                daysSinceLastUpdate: daysSinceSignup
              });
            }
          }
          return;
        }

        // Check days since last update
        const lastUpdate = new Date(data.updated_at);
        const daysSince = differenceInDays(new Date(), lastUpdate);

        // Show reminder if more than 7 days
        if (daysSince >= 7) {
          setReminderState({
            showReminder: true,
            daysSinceLastUpdate: daysSince
          });
        }
      } catch (err) {
        console.error('Error in metrics reminder:', err);
      }
    };

    checkLastUpdate();
  }, [userId]);

  return reminderState;
};
