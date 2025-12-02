import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { handleError, handleSuccess } from '@/utils/errorHandler';
import { QUERY_STALE_TIMES } from '@/constants/limits';

/**
 * Interface para Task
 */
export interface Task {
  id: string;
  title: string;
  description: string | null;
  area: string | null;
  phase: number;
  user_id: string;
  leader_id: string | null;
  order_index: number;
  estimated_cost: number | null;
  actual_cost: number | null;
  created_at: string | null;
  organization_id?: string;
}

/**
 * Interface para TaskCompletion (flexible para JSON de Supabase)
 */
export interface TaskCompletion {
  id: string;
  task_id: string;
  user_id: string;
  organization_id?: string | null;
  completed_at: string;
  completed_by_user: boolean;
  validated_by_leader: boolean | null;
  leader_evaluation?: unknown;
  ai_questions?: unknown;
  user_insights?: unknown;
  task_metrics?: unknown;
  impact_measurement?: unknown;
  collaborator_feedback?: unknown;
}

/**
 * Interface para datos de completar tarea
 */
export interface TaskCompletionData {
  completed_at?: string;
  completed_by_user?: boolean;
  notes?: string;
  actual_cost?: number;
  [key: string]: unknown;
}

export interface CompleteTaskParams {
  taskId: string;
  userId: string;
  data: TaskCompletionData;
}

/**
 * Hook para obtener tareas del usuario
 * Multi-tenancy: filtra por organization_id
 */
export const useTasks = (
  userId: string | undefined, 
  currentPhase: number | undefined, 
  organizationId: string | undefined, 
  taskLimit?: number
) => {
  return useQuery({
    queryKey: ['tasks', userId, currentPhase, organizationId, taskLimit],
    queryFn: async () => {
      if (!userId || !currentPhase) return [];

      let query = supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("phase", currentPhase)
        .order("order_index");

      // CRITICAL: Filter by organization_id for multi-tenancy
      if (organizationId) {
        query = query.eq("organization_id", organizationId);
      }

      if (taskLimit) {
        query = query.limit(taskLimit);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!userId && !!currentPhase,
    staleTime: QUERY_STALE_TIMES.tasks,
  });
};

/**
 * Hook para obtener tareas compartidas (donde el usuario es líder)
 * Multi-tenancy: filtra por organization_id
 */
export const useSharedTasks = (
  userId: string | undefined, 
  currentPhase: number | undefined, 
  organizationId: string | undefined
) => {
  return useQuery({
    queryKey: ['sharedTasks', userId, currentPhase, organizationId],
    queryFn: async () => {
      if (!userId || !currentPhase) return [];

      let query = supabase
        .from("tasks")
        .select("*")
        .eq("phase", currentPhase)
        .eq("leader_id", userId)
        .neq("user_id", userId)
        .order("order_index");

      // CRITICAL: Filter by organization_id for multi-tenancy
      if (organizationId) {
        query = query.eq("organization_id", organizationId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!userId && !!currentPhase,
    staleTime: QUERY_STALE_TIMES.tasks,
  });
};

/**
 * Hook para obtener completaciones de tareas
 * CRÍTICO: Requiere organizationId para multi-tenancy
 */
export const useTaskCompletions = (
  userId: string | undefined,
  organizationId: string | undefined
) => {
  return useQuery({
    queryKey: ['taskCompletions', userId, organizationId],
    queryFn: async () => {
      if (!userId) return new Map<string, TaskCompletion>();

      let query = supabase
        .from("task_completions")
        .select("*")
        .eq("user_id", userId);

      // CRITICAL: Filter by organization_id for multi-tenancy security
      if (organizationId) {
        query = query.eq("organization_id", organizationId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const map = new Map<string, TaskCompletion>();
      data?.forEach((c) => {
        map.set(c.task_id, c as unknown as TaskCompletion);
      });
      return map;
    },
    enabled: !!userId,
    staleTime: QUERY_STALE_TIMES.taskCompletions,
  });
};

/**
 * Hook para completar una tarea
 * Invalidaciones específicas para evitar refetch innecesarios
 */
export const useCompleteTask = (organizationId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, userId, data }: CompleteTaskParams) => {
      const insertData = {
        task_id: taskId,
        user_id: userId,
        organization_id: organizationId || null,
        ...data,
      };

      const { error } = await supabase
        .from("task_completions")
        .insert(insertData);

      if (error) throw error;
      
      return { taskId, userId };
    },
    onSuccess: (result) => {
      // Invalidar solo queries específicas del usuario/organización
      queryClient.invalidateQueries({ 
        queryKey: ['tasks', result.userId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['taskCompletions', result.userId, organizationId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['sharedTasks', result.userId] 
      });
      
      handleSuccess("Tarea completada correctamente");
    },
    onError: (error) => {
      handleError(error, "Error al completar la tarea");
    },
  });
};
