import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * FASE 2: React Query hook para tasks
 * Evita overfetching - múltiples componentes comparten el mismo cache
 */

interface Task {
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
}

export const useTasks = (userId: string | undefined, currentPhase: number | undefined, taskLimit?: number) => {
  return useQuery({
    queryKey: ['tasks', userId, currentPhase, taskLimit],
    queryFn: async () => {
      if (!userId || !currentPhase) return [];

      let query = supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("phase", currentPhase)
        .order("order_index");

      if (taskLimit) {
        query = query.limit(taskLimit);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!userId && !!currentPhase,
    staleTime: 5 * 60 * 1000, // Cache 5 minutos
  });
};

export const useSharedTasks = (userId: string | undefined, currentPhase: number | undefined) => {
  return useQuery({
    queryKey: ['sharedTasks', userId, currentPhase],
    queryFn: async () => {
      if (!userId || !currentPhase) return [];

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("phase", currentPhase)
        .eq("leader_id", userId)
        .neq("user_id", userId)
        .order("order_index");

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!userId && !!currentPhase,
    staleTime: 5 * 60 * 1000,
  });
};

export const useTaskCompletions = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['taskCompletions', userId],
    queryFn: async () => {
      if (!userId) return new Map();

      const { data, error } = await supabase
        .from("task_completions")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;

      const map = new Map();
      data?.forEach((c) => {
        map.set(c.task_id, c);
      });
      return map;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCompleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, userId, data }: { taskId: string; userId: string; data: any }) => {
      const { error } = await supabase
        .from("task_completions")
        .insert({
          task_id: taskId,
          user_id: userId,
          ...data,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskCompletions'] });
      toast.success("Tarea completada");
    },
    onError: (error) => {
      console.error('Error completing task:', error);
      toast.error("Error al completar tarea");
    },
  });
};