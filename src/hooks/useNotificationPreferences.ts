import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface NotificationPreferences {
  user_id: string;
  organization_id: string | null;
  // Canales
  email_enabled: boolean;
  push_enabled: boolean;
  slack_enabled: boolean;
  // Tareas
  task_assigned: boolean;
  task_due_soon: boolean;
  task_completed: boolean;
  task_overdue: boolean;
  // OKRs
  okr_update: boolean;
  okr_at_risk: boolean;
  // Leads
  lead_assigned: boolean;
  lead_status_change: boolean;
  // Team
  team_invite: boolean;
  role_changed: boolean;
  // Resúmenes
  milestone_reached: boolean;
  weekly_summary: boolean;
  monthly_report: boolean;
  // Quiet hours
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
  // Digest
  daily_digest: boolean;
  weekly_digest: boolean;
  // Metadata
  created_at: string;
  updated_at: string;
}

export function useNotificationPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ['notificationPreferences', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      // Si no existe, crear con defaults
      if (!data) {
        const { data: newPrefs, error: insertError } = await supabase
          .from('user_notification_preferences')
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newPrefs as NotificationPreferences;
      }
      
      return data as NotificationPreferences;
    },
    enabled: !!user,
  });

  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      if (!user) throw new Error('No user');
      
      const { error } = await supabase
        .from('user_notification_preferences')
        .update(updates)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences', user?.id] });
      toast.success('Preferencias actualizadas');
    },
    onError: () => {
      toast.error('Error al actualizar preferencias');
    },
  });

  return {
    preferences,
    isLoading,
    error,
    updatePreferences: updatePreferences.mutate,
    isUpdating: updatePreferences.isPending,
  };
}
