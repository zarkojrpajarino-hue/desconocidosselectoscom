import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { CalendarSyncEvent } from '@/types/integrations';

export function useGoogleCalendarSync() {
  const queryClient = useQueryClient();

  const { data: syncedEvents, isLoading } = useQuery({
    queryKey: ['calendar-sync-events'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('calendar_sync_events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_start', { ascending: true });

      if (error) throw error;
      return (data || []) as CalendarSyncEvent[];
    },
  });

  const syncTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.functions.invoke('sync-calendar-events', {
        body: { task_id: taskId },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tarea sincronizada con Google Calendar');
      queryClient.invalidateQueries({ queryKey: ['calendar-sync-events'] });
    },
    onError: (error) => {
      toast.error('Error al sincronizar', { description: error.message });
    },
  });

  const removeSyncedEvent = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('calendar_sync_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Evento eliminado del calendario');
      queryClient.invalidateQueries({ queryKey: ['calendar-sync-events'] });
    },
  });

  const getEventByTaskId = (taskId: string) => {
    return syncedEvents?.find(e => e.task_id === taskId);
  };

  return {
    syncedEvents,
    isLoading,
    syncTask,
    removeSyncedEvent,
    getEventByTaskId,
  };
}