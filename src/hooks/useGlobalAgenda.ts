import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface GlobalAgendaSettings {
  id: string;
  user_id: string;
  linked_organization_ids: string[];
  show_personal_tasks: boolean;
  show_org_tasks: boolean;
  default_view: 'week' | 'day' | 'month';
  org_color_map: Record<string, string>;
  saved_filters: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface GlobalAgendaStats {
  total_tasks: number;
  personal_tasks: number;
  org_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  collaborative_tasks: number;
  total_hours: number;
  organizations_count: number;
}

export interface GlobalScheduleSlot {
  id: string;
  task_id: string;
  user_id: string;
  organization_id: string | null;
  week_start: string;
  scheduled_date: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  is_collaborative: boolean;
  collaborator_user_id: string | null;
  task_title?: string;
  task_description?: string;
  is_personal?: boolean;
  organization_name?: string;
  org_color?: string;
}

export interface AgendaFilters {
  showPersonal: boolean;
  showOrganizational: boolean;
  selectedOrgs: string[];
  status: 'all' | 'pending' | 'completed';
  collaborative: 'all' | 'yes' | 'no';
}

export function useGlobalAgendaSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['global-agenda-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_global_agenda_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // ✅ CORREGIDO: maybeSingle() para 0 o 1 resultados

      if (error && error.code !== 'PGRST116') throw error;
      return data as GlobalAgendaSettings | null;
    },
    enabled: !!user?.id,
  });
}

export function useUpdateGlobalAgendaSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<GlobalAgendaSettings>) => {
      if (!user?.id) throw new Error('No user');

      // Check if settings exist
      const { data: existing } = await supabase
        .from('user_global_agenda_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle(); // ✅ CORREGIDO

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('user_global_agenda_settings')
          .update({
            linked_organization_ids: settings.linked_organization_ids,
            show_personal_tasks: settings.show_personal_tasks,
            show_org_tasks: settings.show_org_tasks,
            org_color_map: settings.org_color_map,
          })
          .eq('user_id', user.id)
          .select()
          .maybeSingle(); // ✅ CORREGIDO
        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('user_global_agenda_settings')
          .insert({
            user_id: user.id,
            linked_organization_ids: settings.linked_organization_ids || [],
            show_personal_tasks: settings.show_personal_tasks ?? true,
            show_org_tasks: settings.show_org_tasks ?? true,
            org_color_map: settings.org_color_map || {},
          })
          .select()
          .maybeSingle(); // ✅ CORREGIDO
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-agenda-settings'] });
      queryClient.invalidateQueries({ queryKey: ['global-schedule'] });
      toast.success('Configuración actualizada');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

export function useGlobalAgendaStats(weekStart: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['global-agenda-stats', weekStart, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .rpc('get_global_agenda_stats', {
          p_user_id: user.id,
          p_week_start: weekStart,
        });

      if (error) throw error;
      return (data?.[0] || null) as GlobalAgendaStats | null;
    },
    enabled: !!user?.id,
  });
}

export function useGlobalSchedule(weekStart: string, filters: AgendaFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['global-schedule', weekStart, filters, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Obtener schedule con datos de tareas
      let query = supabase
        .from('task_schedule')
        .select(`
          *,
          tasks!inner(id, title, description, is_personal, organization_id),
          organizations(id, name)
        `)
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .order('scheduled_date')
        .order('scheduled_start');

      const { data, error } = await query;
      if (error) throw error;

      // Transformar y filtrar datos
      const slots: GlobalScheduleSlot[] = (data || [])
        .map((slot) => ({
          ...slot,
          task_title: slot.tasks?.title || 'Sin título',
          task_description: slot.tasks?.description,
          is_personal: slot.tasks?.is_personal || false,
          organization_name: slot.organizations?.name,
        }))
        .filter((slot) => {
          if (!filters.showPersonal && slot.is_personal) return false;
          if (!filters.showOrganizational && !slot.is_personal) return false;
          if (filters.selectedOrgs.length > 0 && !filters.selectedOrgs.includes(slot.organization_id)) return false;
          if (filters.status !== 'all' && slot.status !== filters.status) return false;
          if (filters.collaborative === 'yes' && !slot.is_collaborative) return false;
          if (filters.collaborative === 'no' && slot.is_collaborative) return false;
          return true;
        });

      return slots;
    },
    enabled: !!user?.id,
  });
}

export function useGenerateGlobalSchedule() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ weekStart, forceRegenerate = false }: { weekStart: string; forceRegenerate?: boolean }) => {
      if (!user?.id) throw new Error('No user');

      const { data, error } = await supabase.functions.invoke('generate-global-weekly-schedule', {
        body: { userId: user.id, weekStart, forceRegenerate },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['global-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['global-agenda-stats'] });
      toast.success(`Agenda generada: ${data.slotsGenerated} tareas programadas`);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

export function useCreatePersonalTask() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: {
      title: string;
      description?: string;
      estimated_duration?: number;
      scheduled_date?: string;
      scheduled_time?: string;
      weekStart?: string;
    }) => {
      if (!user?.id) throw new Error('No user');

      // Crear tarea personal
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description || null,
          user_id: user.id,
          organization_id: null,
          is_personal: true,
          phase: 1,
          order_index: 0,
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Si hay fecha programada, crear slot
      if (taskData.scheduled_date && taskData.scheduled_time && taskData.weekStart) {
        const duration = taskData.estimated_duration || 60;
        const [hours, minutes] = taskData.scheduled_time.split(':').map(Number);
        const endMinutes = hours * 60 + minutes + duration;
        const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

        await supabase.from('task_schedule').insert({
          task_id: task.id,
          user_id: user.id,
          organization_id: null,
          week_start: taskData.weekStart,
          scheduled_date: taskData.scheduled_date,
          scheduled_start: taskData.scheduled_time,
          scheduled_end: endTime,
          status: 'pending',
          is_collaborative: false,
        });
      }

      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['global-agenda-stats'] });
      toast.success('Tarea personal creada');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}
