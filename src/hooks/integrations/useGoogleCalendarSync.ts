import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { CalendarSyncEvent } from '@/types/integrations';

interface SyncOptions {
  timezone?: string;
  taskId?: string;
}

interface SyncResult {
  success: boolean;
  synced?: number;
  errors?: number;
  errorDetails?: string[];
  message?: string;
  code?: string;
}

interface ImportResult {
  success: boolean;
  imported_count?: number;
  skipped_count?: number;
  total_found?: number;
  message?: string;
  code?: string;
}

export function useGoogleCalendarSync() {
  const queryClient = useQueryClient();

  // Detectar timezone del usuario
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid';

  const { data: syncedEvents, isLoading, refetch } = useQuery({
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

  // Check connection status
  const { data: isConnected, refetch: refetchConnection } = useQuery({
    queryKey: ['google-calendar-connected'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data } = await supabase
        .from('google_calendar_tokens')
        .select('is_active, token_expiry')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!data) return false;

      // Verificar que el token no haya expirado hace mucho tiempo
      const expiry = new Date(data.token_expiry);
      const now = new Date();
      // Considerar conectado si el token expira en más de 1 hora
      // (el refresh se hace automáticamente en las Edge Functions)
      return data.is_active;
    },
    refetchInterval: 60000, // Verificar cada minuto
  });

  // Sync single task
  const syncTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user authenticated');

      const { data, error } = await supabase.functions.invoke<SyncResult>('sync-calendar-events', {
        body: { 
          user_id: user.id,
          task_id: taskId,
          timezone: userTimezone
        },
      });

      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.message || 'Sync failed');
      }
      return data;
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
    mutationFn: async (options: SyncOptions | void) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user authenticated');
      const opts = options || {};

      const { data, error } = await supabase.functions.invoke<SyncResult>('sync-calendar-events', {
        body: { 
          user_id: user.id,
          timezone: opts.timezone || userTimezone
        },
      });

      if (error) throw error;
      
      // Handle specific error codes
      if (!data?.success) {
        if (data?.code === 'NOT_CONNECTED') {
          throw new Error('Google Calendar no está conectado');
        }
        if (data?.code === 'TOKEN_REFRESH_FAILED') {
          throw new Error('La conexión expiró. Por favor, reconecta Google Calendar.');
        }
        throw new Error(data?.message || 'Sync failed');
      }
      
      return data;
    },
    onSuccess: (data) => {
      const message = data?.message || 'Agenda exportada a Google Calendar';
      if (data?.errors && data.errors > 0) {
        toast.warning(message, {
          description: `${data.synced} sincronizados, ${data.errors} con errores`
        });
      } else {
        toast.success(message);
      }
      queryClient.invalidateQueries({ queryKey: ['calendar-sync-events'] });
    },
    onError: (error) => {
      if (error.message.includes('reconecta')) {
        toast.error('Reconexión necesaria', { 
          description: error.message,
          action: {
            label: 'Reconectar',
            onClick: () => window.location.href = '/settings?tab=integrations'
          }
        });
      } else {
        toast.error('Error al exportar', { description: error.message });
      }
    },
  });

  // Import events from Google Calendar as tasks
  const importEvents = useMutation({
    mutationFn: async (options: { daysAhead?: number } | void) => {
      const { data: { user } } = await supabase.auth.getUser();
      const opts = options || {};
      if (!user) throw new Error('No user authenticated');

      const { data, error } = await supabase.functions.invoke<ImportResult>('import-calendar-events', {
        body: { 
          user_id: user.id,
          days_ahead: opts.daysAhead || 14
        },
      });

      if (error) throw error;
      
      if (!data?.success) {
        if (data?.code === 'NOT_CONNECTED') {
          throw new Error('Google Calendar no está conectado');
        }
        throw new Error(data?.message || 'Import failed');
      }
      
      return data;
    },
    onSuccess: (data) => {
      const count = data?.imported_count || 0;
      const skipped = data?.skipped_count || 0;
      
      if (count === 0 && skipped > 0) {
        toast.info('No hay eventos nuevos', {
          description: `${skipped} eventos ya estaban importados`
        });
      } else {
        toast.success(`${count} eventos importados`, {
          description: skipped > 0 ? `${skipped} ya existían` : undefined
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['calendar-sync-events'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      toast.error('Error al importar', { description: error.message });
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

  const disconnect = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('google_calendar_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Google Calendar desconectado');
      queryClient.invalidateQueries({ queryKey: ['google-calendar-connected'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-sync-events'] });
    },
    onError: (error) => {
      toast.error('Error al desconectar', { description: error.message });
    },
  });

  return {
    // Data
    syncedEvents,
    isLoading,
    isConnected,
    userTimezone,
    
    // Mutations
    syncTask,
    syncAll,
    importEvents,
    removeSyncedEvent,
    disconnect,
    
    // Helpers
    getEventByTaskId,
    refetch,
    refetchConnection,
    
    // Loading states
    syncing: syncAll.isPending,
    importing: importEvents.isPending,
    disconnecting: disconnect.isPending,
  };
}
