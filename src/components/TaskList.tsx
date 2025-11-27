import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import TaskEvaluationModal from './TaskEvaluationModal';

interface TaskListProps {
  userId: string | undefined;
  currentPhase: number | undefined;
}

const TaskList = ({ userId, currentPhase }: TaskListProps) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [completions, setCompletions] = useState<Set<string>>(new Set());
  const [evaluationModalOpen, setEvaluationModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

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

  const handleToggleTask = async (task: any, isCompleted: boolean) => {
    if (!userId) return;

    try {
      if (isCompleted) {
        // Remove completion
        await supabase
          .from('task_completions')
          .delete()
          .eq('task_id', task.id)
          .eq('user_id', userId);
        
        setCompletions(prev => {
          const newSet = new Set(prev);
          newSet.delete(task.id);
          return newSet;
        });
        toast.success('Tarea marcada como pendiente');
      } else {
        // Check if task requires evaluation
        if (task.leader_id) {
          setSelectedTask(task);
          setEvaluationModalOpen(true);
        } else {
          // Direct completion for individual tasks
          await supabase
            .from('task_completions')
            .insert({
              task_id: task.id,
              user_id: userId,
              validated_by_leader: null
            });
          
          setCompletions(prev => new Set(prev).add(task.id));
          toast.success('¡Tarea completada!');
        }
      }
    } catch (error) {
      toast.error('Error al actualizar tarea');
    }
  };

  const handleSubmitEvaluation = async (evaluation: {
    q1: string;
    q2: string;
    q3: string;
    stars: number;
  }) => {
    if (!userId || !selectedTask) return;

    try {
      await supabase
        .from('task_completions')
        .insert({
          task_id: selectedTask.id,
          user_id: userId,
          validated_by_leader: false,
          leader_evaluation: evaluation
        });
      
      setCompletions(prev => new Set(prev).add(selectedTask.id));
      toast.success('¡Tarea completada! Evaluación enviada al líder');
    } catch (error) {
      toast.error('Error al completar tarea');
      throw error;
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
    <>
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
                onCheckedChange={() => handleToggleTask(task, isCompleted)}
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

      {selectedTask && (
        <TaskEvaluationModal
          open={evaluationModalOpen}
          onOpenChange={setEvaluationModalOpen}
          taskTitle={selectedTask.title}
          onSubmit={handleSubmitEvaluation}
        />
      )}
    </>
  );
};

export default TaskList;