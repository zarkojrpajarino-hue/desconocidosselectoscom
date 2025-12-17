import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Target, Zap, Circle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { AgendaFilters } from '@/hooks/useGlobalAgenda';

interface IndividualAgendaViewProps {
  weekStart: string;
  filters: AgendaFilters;
}

export function IndividualAgendaView({ weekStart, filters }: IndividualAgendaViewProps) {
  const { user, currentOrganizationId } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's tasks for this week
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['individual-agenda-tasks', user?.id, weekStart],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('task_schedule')
        .select(`
          *,
          tasks (id, title, description, area, estimated_hours)
        `)
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .order('scheduled_date')
        .order('scheduled_start');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Group tasks by day
  const tasksByDay = React.useMemo(() => {
    if (!tasks) return {};
    
    return tasks.reduce((acc, task) => {
      const day = task.scheduled_date;
      if (!acc[day]) acc[day] = [];
      acc[day].push(task);
      return acc;
    }, {} as Record<string, typeof tasks>);
  }, [tasks]);

  const completedCount = tasks?.filter(t => t.status === 'completed').length || 0;
  const totalCount = tasks?.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Toggle task completion
  const handleToggleComplete = async (taskId: string, currentStatus: string) => {
    if (!user?.id || !currentOrganizationId) return;
    
    const isCompleted = currentStatus === 'completed';
    
    try {
      if (isCompleted) {
        // Desmarcar - eliminar completion
        const { error } = await supabase
          .from('task_completions')
          .delete()
          .eq('task_id', taskId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        // Actualizar status en task_schedule
        await supabase
          .from('task_schedule')
          .update({ status: 'pending' })
          .eq('task_id', taskId)
          .eq('user_id', user.id);
        
        toast.info('Tarea marcada como pendiente');
      } else {
        // Marcar como completada
        const { error } = await supabase
          .from('task_completions')
          .upsert({
            task_id: taskId,
            user_id: user.id,
            organization_id: currentOrganizationId,
            completed_by_user: true,
            validated_by_leader: true, // Auto-validate en modo individual
            completed_at: new Date().toISOString(),
          }, {
            onConflict: 'task_id,user_id'
          });
        
        if (error) throw error;
        
        // Actualizar status en task_schedule
        await supabase
          .from('task_schedule')
          .update({ status: 'completed' })
          .eq('task_id', taskId)
          .eq('user_id', user.id);
        
        toast.success('¡Tarea completada!');
      }
      
      // Refrescar datos
      queryClient.invalidateQueries({ queryKey: ['individual-agenda-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['global-agenda-stats'] });
    } catch (error) {
      toast.error('Error al actualizar la tarea');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Tu Progreso Semanal
              </h3>
              <p className="text-sm text-muted-foreground">
                Trabaja a tu ritmo - sin horarios fijos
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{progressPercent}%</div>
              <div className="text-sm text-muted-foreground">{completedCount}/{totalCount} tareas</div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Info Card for Individual Mode */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-warning mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">Modo Individual Activo</p>
              <p className="text-sm text-muted-foreground">
                Tienes flexibilidad total. Completa tus tareas cuando mejor te convenga.
                No hay coordinación con equipo ni deadlines de disponibilidad.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks by Day */}
      {Object.keys(tasksByDay).length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold text-lg mb-2">Sin tareas programadas</h3>
            <p className="text-muted-foreground">
              Crea tareas personales o genera tu agenda semanal desde el Dashboard.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(tasksByDay).map(([date, dayTasks]) => (
            <Card key={date}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>
                    {new Date(date).toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                  <Badge variant="outline">
                    {dayTasks.filter(t => t.status === 'completed').length}/{dayTasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      task.status === 'completed'
                        ? 'bg-success/10 border-success/20'
                        : 'bg-card border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleComplete(task.task_id, task.status)}
                        className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 transition-colors cursor-pointer ${
                          task.status === 'completed' 
                            ? 'bg-success text-success-foreground hover:bg-success/80' 
                            : 'border-2 border-muted-foreground hover:border-primary hover:bg-primary/10'
                        }`}
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Circle className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.tasks?.title || 'Tarea sin título'}
                        </p>
                        {task.tasks?.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.tasks.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {task.tasks?.area && (
                            <Badge variant="secondary" className="text-xs">
                              {task.tasks.area}
                            </Badge>
                          )}
                          {task.tasks?.estimated_hours && (
                            <span className="text-xs text-muted-foreground">
                              ~{task.tasks.estimated_hours}h
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
