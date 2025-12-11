import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  device_name: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  location_country: string | null;
  location_city: string | null;
  is_active: boolean;
  last_activity_at: string;
  created_at: string;
  expires_at: string;
}

export function useSessions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['user-sessions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_activity_at', { ascending: false });

      if (error) throw error;
      return data as UserSession[];
    },
  });

  const revokeSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Sesión cerrada' });
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
    },
  });

  const revokeOtherSessions = useMutation({
    mutationFn: async (currentSessionId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .neq('id', currentSessionId)
        .eq('is_active', true)
        .select();

      if (error) throw error;
      return data?.length || 0;
    },
    onSuccess: (count) => {
      toast({ 
        title: `${count} sesión(es) cerrada(s)`,
        description: 'Todas las demás sesiones han sido cerradas',
      });
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
    },
  });

  return {
    sessions,
    isLoading,
    revokeSession,
    revokeOtherSessions,
  };
}
