import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Users, User, Target, Circle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { AgendaFilters } from '@/hooks/useGlobalAgenda';

interface TeamAgendaViewProps {
  weekStart: string;
  filters: AgendaFilters;
  collaborativePercentage: number;
}

export function TeamAgendaView({ weekStart, filters, collaborativePercentage }: TeamAgendaViewProps) {
  const { user, currentOrganizationId } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's tasks for this week
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['team-agenda-tasks', user?.id, weekStart],
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

  // Separate collaborative and individual tasks
  const collaborativeTasks = tasks?.filter(t => t.is_collaborative) || [];
  const individualTasks = tasks?.filter(t => !t.is_collaborative) || [];

  const completedCount = tasks?.filter(t => t.status === 'completed').length || 0;
  const totalCount = tasks?.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Toggle task completion
  const handleToggleComplete = async (taskId: string, currentStatus: string, isCollaborative: boolean) => {
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
        
        await supabase
          .from('task_schedule')
          .update({ status: 'pending' })
          .eq('task_id', taskId)
          .eq('user_id', user.id);
        
        toast.info('Tarea marcada como pendiente');
      } else {
        // Marcar como completada
        // En modo colectivo, las colaborativas requieren validación del líder
        const { error } = await supabase
          .from('task_completions')
          .upsert({
            task_id: taskId,
            user_id: user.id,
            organization_id: currentOrganizationId,
            completed_by_user: true,
            validated_by_leader: !isCollaborative, // Solo auto-validate si NO es colaborativa
            completed_at: new Date().toISOString(),
          }, {
            onConflict: 'task_id,user_id'
          });
        
        if (error) throw error;
        
        // Si es colaborativa, el status queda pending hasta que líder valide
        await supabase
          .from('task_schedule')
          .update({ status: isCollaborative ? 'pending' : 'completed' })
          .eq('task_id', taskId)
          .eq('user_id', user.id);
        
        if (isCollaborative) {
          toast.success('Tarea enviada al líder para validación');
        } else {
          toast.success('¡Tarea completada!');
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['team-agenda-tasks'] });
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

  const TaskCard = ({ task, isCollaborative }: { task: typeof tasks[0], isCollaborative: boolean }) => (
    <div
      className={`p-3 rounded-lg border transition-colors ${
        task.status === 'completed'
          ? 'bg-success/10 border-success/20'
          : 'bg-card border-border hover:bg-muted/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => handleToggleComplete(task.task_id, task.status, isCollaborative)}
          className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 transition-colors cursor-pointer ${
            task.status === 'completed' 
              ? 'bg-success text-success-foreground hover:bg-success/80' 
              : 'border-2 border-muted-foreground hover:border-primary hover:bg-primary/10'
          }`}
        >
          {task.status === 'completed' ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <Circle className="w-3 h-3 opacity-0" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {task.tasks?.title || 'Tarea sin título'}
            </p>
            {isCollaborative && (
              <Badge variant="outline" className="text-xs bg-primary/10">
                <Users className="w-3 h-3 mr-1" />
                Equipo
              </Badge>
            )}
          </div>
          {task.tasks?.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {task.tasks.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {task.scheduled_start && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {task.scheduled_start} - {task.scheduled_end}
              </Badge>
            )}
            {task.tasks?.area && (
              <Badge variant="outline" className="text-xs">
                {task.tasks.area}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Progreso del Equipo
              </h3>
              <p className="text-sm text-muted-foreground">
                {collaborativePercentage}% colaborativo • {100 - collaborativePercentage}% individual
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

      {/* Distribution Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold text-foreground">{collaborativeTasks.length}</div>
            <div className="text-sm text-muted-foreground">Tareas Colaborativas</div>
            <div className="text-xs text-primary mt-1">Con líder de área</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <User className="w-8 h-8 mx-auto mb-2 text-secondary-foreground" />
            <div className="text-2xl font-bold text-foreground">{individualTasks.length}</div>
            <div className="text-sm text-muted-foreground">Tareas Individuales</div>
            <div className="text-xs text-muted-foreground mt-1">Trabajo autónomo</div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Sections */}
      {tasks?.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold text-lg mb-2">Sin tareas programadas</h3>
            <p className="text-muted-foreground">
              Las tareas se generarán según tu fase de negocio actual.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Collaborative Tasks */}
          {collaborativeTasks.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Tareas Colaborativas
                  <Badge variant="outline" className="ml-auto">
                    {collaborativeTasks.filter(t => t.status === 'completed').length}/{collaborativeTasks.length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Trabaja con tu líder de área para completar estas tareas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {collaborativeTasks.map((task) => (
                  <TaskCard key={task.id} task={task} isCollaborative={true} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Individual Tasks */}
          {individualTasks.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Tareas Individuales
                  <Badge variant="outline" className="ml-auto">
                    {individualTasks.filter(t => t.status === 'completed').length}/{individualTasks.length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Trabajo autónomo - completa a tu ritmo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {individualTasks.map((task) => (
                  <TaskCard key={task.id} task={task} isCollaborative={false} />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
