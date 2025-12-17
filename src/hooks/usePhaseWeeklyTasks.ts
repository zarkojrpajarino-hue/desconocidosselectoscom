import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PhaseTask {
  id: string;
  title: string;
  description: string | null;
  area: string | null;
  phase: number;
  phase_id: string | null;
  week_number: number;
  estimated_hours: number | null;
  actual_hours: number | null;
  is_completed: boolean;
  user_id: string;
  leader_id: string | null;
  order_index: number;
}

export interface PhaseWeeklyData {
  totalTasks: number;
  totalWeeks: number;
  currentWeek: number;
  completedTasks: number;
  tasksByWeek: Record<number, PhaseTask[]>;
  progressPercent: number;
}

// Calcular cuántas semanas necesita la fase basado en tareas y capacidad semanal
function calculateWeeksForPhase(totalTasks: number, tasksPerWeek: number = 8): number {
  return Math.max(1, Math.ceil(totalTasks / tasksPerWeek));
}

// Distribuir tareas en semanas
function distributeTasksInWeeks(tasks: PhaseTask[], tasksPerWeek: number = 8): Record<number, PhaseTask[]> {
  const weeks: Record<number, PhaseTask[]> = {};
  
  tasks.forEach((task, index) => {
    const weekNumber = Math.floor(index / tasksPerWeek) + 1;
    if (!weeks[weekNumber]) {
      weeks[weekNumber] = [];
    }
    weeks[weekNumber].push({ ...task, week_number: weekNumber });
  });
  
  return weeks;
}

export function usePhaseWeeklyTasks(phaseNumber: number | undefined) {
  const { user, currentOrganizationId } = useAuth();
  
  return useQuery({
    queryKey: ['phase-weekly-tasks', user?.id, currentOrganizationId, phaseNumber],
    queryFn: async (): Promise<PhaseWeeklyData | null> => {
      if (!user?.id || !currentOrganizationId || !phaseNumber) return null;
      
      // Obtener todas las tareas del usuario para esta fase
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', currentOrganizationId)
        .eq('phase', phaseNumber)
        .order('order_index');
      
      if (tasksError) throw tasksError;
      if (!tasks || tasks.length === 0) {
        return {
          totalTasks: 0,
          totalWeeks: 0,
          currentWeek: 1,
          completedTasks: 0,
          tasksByWeek: {},
          progressPercent: 0,
        };
      }
      
      // Obtener completaciones validadas
      const taskIds = tasks.map(t => t.id);
      const { data: completions } = await supabase
        .from('task_completions')
        .select('task_id')
        .in('task_id', taskIds)
        .eq('validated_by_leader', true);
      
      const completedIds = new Set(completions?.map(c => c.task_id) || []);
      
      // Mapear tareas con estado de completado
      const phaseTasks: PhaseTask[] = tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        area: task.area,
        phase: task.phase,
        phase_id: task.phase_id,
        week_number: 1, // Se asignará en distributeTasksInWeeks
        estimated_hours: task.estimated_hours,
        actual_hours: task.actual_hours,
        is_completed: completedIds.has(task.id),
        user_id: task.user_id,
        leader_id: task.leader_id,
        order_index: task.order_index || 0,
      }));
      
      // Distribuir en semanas (8 tareas por semana por defecto)
      const tasksPerWeek = 8;
      const tasksByWeek = distributeTasksInWeeks(phaseTasks, tasksPerWeek);
      const totalWeeks = calculateWeeksForPhase(phaseTasks.length, tasksPerWeek);
      
      // Encontrar la semana actual (primera semana con tareas pendientes)
      let currentWeek = 1;
      for (let week = 1; week <= totalWeeks; week++) {
        const weekTasks = tasksByWeek[week] || [];
        const hasPending = weekTasks.some(t => !t.is_completed);
        if (hasPending) {
          currentWeek = week;
          break;
        }
        // Si todas las tareas de esta semana están completadas, pasar a la siguiente
        if (week === totalWeeks) {
          currentWeek = totalWeeks; // Última semana
        }
      }
      
      const completedTasks = phaseTasks.filter(t => t.is_completed).length;
      const progressPercent = phaseTasks.length > 0 
        ? Math.round((completedTasks / phaseTasks.length) * 100) 
        : 0;
      
      return {
        totalTasks: phaseTasks.length,
        totalWeeks,
        currentWeek,
        completedTasks,
        tasksByWeek,
        progressPercent,
      };
    },
    enabled: !!user?.id && !!currentOrganizationId && !!phaseNumber,
    staleTime: 30000,
  });
}

// Hook para obtener la fase actual de la organización
export function useCurrentPhase() {
  const { currentOrganizationId } = useAuth();
  
  return useQuery({
    queryKey: ['current-phase', currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return null;
      
      const { data, error } = await supabase
        .from('business_phases')
        .select('id, phase_number, phase_name, status, progress_percentage')
        .eq('organization_id', currentOrganizationId)
        .eq('status', 'active')
        .order('phase_number')
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      
      // Si no hay fase activa, obtener la primera
      if (!data) {
        const { data: firstPhase } = await supabase
          .from('business_phases')
          .select('id, phase_number, phase_name, status, progress_percentage')
          .eq('organization_id', currentOrganizationId)
          .order('phase_number')
          .limit(1)
          .maybeSingle();
        
        return firstPhase;
      }
      
      return data;
    },
    enabled: !!currentOrganizationId,
  });
}
