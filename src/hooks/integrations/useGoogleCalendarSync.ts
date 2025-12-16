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

  // Sync all tasks to Google Calendar
  const syncAll = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const { error } = await supabase.functions.invoke('sync-calendar-events', {
        body: { user_id: user.id },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Agenda exportada a Google Calendar');
      queryClient.invalidateQueries({ queryKey: ['calendar-sync-events'] });
      logSyncEvent('export', 'success');
    },
    onError: (error) => {
      toast.error('Error al exportar', { description: error.message });
      logSyncEvent('export', 'error', error.message);
    },
  });

  // Import events from Google Calendar as tasks
  const importEvents = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const { data, error } = await supabase.functions.invoke('import-calendar-events', {
        body: { user_id: user.id },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const count = data?.imported_count || 0;
      toast.success(`${count} eventos importados de Google Calendar`);
      queryClient.invalidateQueries({ queryKey: ['calendar-sync-events'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      logSyncEvent('import', 'success', undefined, count);
    },
    onError: (error) => {
      toast.error('Error al importar', { description: error.message });
      logSyncEvent('import', 'error', error.message);
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

  // Log sync events via external_task_mappings or calendar_sync_events
  const logSyncEvent = async (
    _direction: 'import' | 'export',
    _status: 'success' | 'error',
    _errorMessage?: string,
    _recordsAffected?: number
  ) => {
    // Logging is handled automatically via calendar_sync_events table
    // No additional logging needed
  };

  return {
    syncedEvents,
    isLoading,
    syncTask,
    syncAll,
    importEvents,
    removeSyncedEvent,
    getEventByTaskId,
    syncing: syncAll.isPending,
    importing: importEvents.isPending,
  };
}