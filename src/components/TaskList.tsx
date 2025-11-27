import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface TaskListProps {
  userId: string | undefined;
  currentPhase: number | undefined;
}

const TaskList = ({ userId, currentPhase }: TaskListProps) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [completions, setCompletions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (userId && currentPhase) {
      fetchTasks();
    }
  }, [userId, currentPhase]);

  const fetchTasks = async () => {
    if (!userId || !currentPhase) return;

    const { data: taskData } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('phase', currentPhase)
      .order('order_index');

    const { data: completionData } = await supabase
      .from('task_completions')
      .select('task_id')
      .eq('user_id', userId);

    if (taskData) setTasks(taskData);
    if (completionData) {
      setCompletions(new Set(completionData.map(c => c.task_id)));
    }
  };

  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    if (!userId) return;

    try {
      if (isCompleted) {
        // Remove completion
        await supabase
          .from('task_completions')
          .delete()
          .eq('task_id', taskId)
          .eq('user_id', userId);
        
        setCompletions(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
        toast.success('Tarea marcada como pendiente');
      } else {
        // Add completion
        await supabase
          .from('task_completions')
          .insert({
            task_id: taskId,
            user_id: userId,
            validated_by_leader: false
          });
        
        setCompletions(prev => new Set(prev).add(taskId));
        toast.success('¡Tarea completada!');
      }
    } catch (error) {
      toast.error('Error al actualizar tarea');
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay tareas asignadas para esta fase
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const isCompleted = completions.has(task.id);
        return (
          <div
            key={task.id}
            className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
              isCompleted
                ? 'bg-success/5 border-success/20'
                : 'bg-card hover:shadow-sm'
            }`}
          >
            <Checkbox
              checked={isCompleted}
              onCheckedChange={() => handleToggleTask(task.id, isCompleted)}
              className="mt-1"
            />
            <div className="flex-1 space-y-2">
              <p className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </p>
              {task.description && (
                <p className="text-sm text-muted-foreground">{task.description}</p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {task.area && (
                  <Badge variant="secondary" className="text-xs">
                    {task.area}
                  </Badge>
                )}
                {task.leader_id && (
                  <Badge variant="outline" className="text-xs">
                    Requiere evaluación
                  </Badge>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskList;