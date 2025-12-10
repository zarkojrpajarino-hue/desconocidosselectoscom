import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TimeLog {
  id: string;
  task_id: string;
  user_id: string;
  organization_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  notes: string | null;
  was_interrupted: boolean;
  created_at: string;
}

export function useTimeTracking(taskId?: string) {
  const { user, currentOrganizationId } = useAuth();
  const queryClient = useQueryClient();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Query for task's time logs
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["time-logs", taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const { data, error } = await supabase
        .from("task_time_logs")
        .select("*")
        .eq("task_id", taskId)
        .order("started_at", { ascending: false });
      
      if (error) throw error;
      return (data || []) as TimeLog[];
    },
    enabled: !!taskId,
  });

  // Query for user's active time log (any task)
  const { data: activeLog, isLoading: activeLoading } = useQuery({
    queryKey: ["active-time-log", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("task_time_logs")
        .select("*")
        .eq("user_id", user.id)
        .is("ended_at", null)
        .maybeSingle();
      
      if (error) throw error;
      return data as TimeLog | null;
    },
    enabled: !!user?.id,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Check if currently tracking this specific task
  const isTrackingThisTask = activeLog?.task_id === taskId;

  // Update elapsed time every second when tracking
  useEffect(() => {
    if (!activeLog || !isTrackingThisTask) {
      setElapsedSeconds(0);
      return;
    }

    const startTime = new Date(activeLog.started_at).getTime();
    
    const updateElapsed = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedSeconds(elapsed);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [activeLog, isTrackingThisTask]);

  // Start timer mutation
  const startMutation = useMutation({
    mutationFn: async (targetTaskId: string) => {
      if (!user?.id) throw new Error("No user");

      // Check if user already has an active timer
      if (activeLog) {
        throw new Error("Ya tienes un timer activo en otra tarea");
      }

      const { data, error } = await supabase
        .from("task_time_logs")
        .insert({
          task_id: targetTaskId,
          user_id: user.id,
          organization_id: currentOrganizationId,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-time-log"] });
      queryClient.invalidateQueries({ queryKey: ["time-logs"] });
      toast.success("Timer iniciado");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Stop timer mutation
  const stopMutation = useMutation({
    mutationFn: async ({ notes, wasInterrupted }: { notes?: string; wasInterrupted?: boolean }) => {
      if (!activeLog) throw new Error("No active timer");

      const { error } = await supabase
        .from("task_time_logs")
        .update({
          ended_at: new Date().toISOString(),
          notes: notes || null,
          was_interrupted: wasInterrupted || false,
        })
        .eq("id", activeLog.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-time-log"] });
      queryClient.invalidateQueries({ queryKey: ["time-logs"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setElapsedSeconds(0);
      toast.success("Timer detenido");
    },
    onError: () => {
      toast.error("Error al detener timer");
    },
  });

  // Delete log mutation
  const deleteMutation = useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase
        .from("task_time_logs")
        .delete()
        .eq("id", logId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-logs"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Registro eliminado");
    },
    onError: () => {
      toast.error("Error al eliminar registro");
    },
  });

  const startTimer = useCallback((targetTaskId: string) => {
    startMutation.mutate(targetTaskId);
  }, [startMutation]);

  const stopTimer = useCallback((notes?: string, wasInterrupted?: boolean) => {
    stopMutation.mutate({ notes, wasInterrupted });
  }, [stopMutation]);

  const deleteLog = useCallback((logId: string) => {
    deleteMutation.mutate(logId);
  }, [deleteMutation]);

  // Calculate total minutes from completed logs
  const totalMinutes = logs
    .filter(log => log.duration_minutes !== null)
    .reduce((sum, log) => sum + (log.duration_minutes || 0), 0);

  return {
    logs,
    activeLog,
    isTrackingThisTask,
    isTrackingAnyTask: !!activeLog,
    elapsedSeconds,
    elapsedMinutes: Math.floor(elapsedSeconds / 60),
    totalMinutes,
    loading: logsLoading || activeLoading,
    startTimer,
    stopTimer,
    deleteLog,
    isStarting: startMutation.isPending,
    isStopping: stopMutation.isPending,
  };
}
