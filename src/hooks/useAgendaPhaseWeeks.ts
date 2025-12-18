import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, addWeeks, addDays } from 'date-fns';
import { getCurrentWeekStart } from '@/lib/weekUtils';

export interface PhaseWeekInfo {
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  taskCount: number;
  completedCount: number;
  hasAvailability: boolean;
}

export function useAgendaPhaseWeeks(phaseNumber: number | undefined, weekStartDay: number = 1) {
  const { user, currentOrganizationId } = useAuth();

  return useQuery({
    queryKey: ['agenda-phase-weeks', user?.id, currentOrganizationId, phaseNumber, weekStartDay],
    queryFn: async (): Promise<PhaseWeekInfo[]> => {
      if (!user?.id || !currentOrganizationId || !phaseNumber) return [];

      // Fetch all tasks for this phase
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, organization_id')
        .eq('user_id', user.id)
        .eq('organization_id', currentOrganizationId)
        .eq('phase', phaseNumber)
        .order('order_index');

      if (tasksError) throw tasksError;
      if (!tasks || tasks.length === 0) return [];

      // Get completions
      const taskIds = tasks.map(t => t.id);
      const { data: completions } = await supabase
        .from('task_completions')
        .select('task_id')
        .in('task_id', taskIds)
        .eq('validated_by_leader', true);

      const completedIds = new Set(completions?.map(c => c.task_id) || []);

      // Calculate weeks needed (8 tasks per week)
      const tasksPerWeek = 8;
      const totalWeeks = Math.max(1, Math.ceil(tasks.length / tasksPerWeek));

      // Get current week start as base, using organization's configured week start day
      const baseWeekStart = getCurrentWeekStart(new Date(), weekStartDay);

      // Get all availability records for the user
      const { data: availabilities } = await supabase
        .from('user_weekly_availability')
        .select('week_start')
        .eq('user_id', user.id);

      const availabilitySet = new Set(availabilities?.map(a => a.week_start) || []);

      // Create week info for each week
      const weeks: PhaseWeekInfo[] = [];

      for (let weekNum = 1; weekNum <= totalWeeks; weekNum++) {
        const weekStartDate = addWeeks(baseWeekStart, weekNum - 1);
        const weekStart = format(weekStartDate, 'yyyy-MM-dd');
        const weekEnd = format(addDays(weekStartDate, 6), 'yyyy-MM-dd');

        // Count tasks for this week
        const startIndex = (weekNum - 1) * tasksPerWeek;
        const endIndex = Math.min(startIndex + tasksPerWeek, tasks.length);
        const weekTasks = tasks.slice(startIndex, endIndex);

        const completedCount = weekTasks.filter(t => completedIds.has(t.id)).length;

        weeks.push({
          weekNumber: weekNum,
          weekStart,
          weekEnd,
          taskCount: weekTasks.length,
          completedCount,
          hasAvailability: availabilitySet.has(weekStart),
        });
      }

      return weeks;
    },
    enabled: !!user?.id && !!currentOrganizationId && !!phaseNumber,
    staleTime: 30000,
  });
}
