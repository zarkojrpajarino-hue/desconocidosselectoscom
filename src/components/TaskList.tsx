import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users } from 'lucide-react';
import { toast } from 'sonner';
import TaskEvaluationModal from './TaskEvaluationModal';
import { TaskSwapModal } from './TaskSwapModal';
import { useTaskSwaps } from '@/hooks/useTaskSwaps';
import { getLeadersForArea, getLeaderDisplayName, isUserLeaderOfArea } from '@/lib/areaLeaders';

interface TaskListProps {
  userId: string | undefined;
  currentPhase: number | undefined;
  isLocked?: boolean;
  mode?: 'conservador' | 'moderado' | 'agresivo';
  taskLimit?: number;
}

const TaskList = ({ userId, currentPhase, isLocked = false, mode = 'moderado', taskLimit }: TaskListProps) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [completions, setCompletions] = useState<Set<string>>(new Set());
  const [evaluationModalOpen, setEvaluationModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [taskToSwap, setTaskToSwap] = useState<any>(null);
  const { remainingSwaps, reload: reloadSwaps } = useTaskSwaps(userId || '', mode);
  const [leadersById, setLeadersById] = useState<Record<string, string>>({});

  useEffect(() => {
    if (userId && currentPhase) {
      fetchTasks();
    }
  }, [userId, currentPhase]);

  const fetchTasks = async () => {
    if (!userId || !currentPhase) return;

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('phase', currentPhase)
      .order('order_index');

    if (taskLimit) {
      query = query.limit(taskLimit);
    }

    const { data: taskData } = await query;

    const { data: completionData } = await supabase
      .from('task_completions')
      .select('task_id')
      .eq('user_id', userId);

    if (taskData) {
      setTasks(taskData);

      const leaderIds = Array.from(
        new Set(
          taskData
            .map((t: any) => t.leader_id)
            .filter((id: string | null) => Boolean(id))
        )
      ) as string[];

      if (leaderIds.length > 0) {
        const { data: leaders } = await supabase
          .from('users')
          .select('id, full_name, username')
          .in('id', leaderIds);

        if (leaders) {
          const map: Record<string, string> = {};
          leaders.forEach((leader: any) => {
            map[leader.id] = leader.full_name || leader.username;
          });
          setLeadersById(map);
        }
      }
    }
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
        // Check if task has leader
        if (task.leader_id) {
          // Solo el líder puede marcar como completada
          const isLeader = task.area && isUserLeaderOfArea(userId, task.area);
          if (!isLeader) {
            toast.error('Solo el líder puede completar esta tarea compartida');
            return;
          }
          
          // Leader completes directly
          await supabase
            .from('task_completions')
            .insert({
              task_id: task.id,
              user_id: task.user_id,
              validated_by_leader: true
            });
          
          setCompletions(prev => new Set(prev).add(task.id));
          toast.success('¡Tarea completada!');
        } else {
          // Tarea individual - abrir evaluación
          setSelectedTask(task);
          setEvaluationModalOpen(true);
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
      
      // Create notification for leader
      if (selectedTask.leader_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: selectedTask.leader_id,
            type: 'evaluation_pending',
            message: `Nueva evaluación pendiente: "${selectedTask.title}"`
          });
      }
      
      toast.success('¡Tarea completada! Evaluación enviada al líder');
    } catch (error) {
      toast.error('Error al completar tarea');
      throw error;
    }
  };

  const handleOpenSwapModal = (task: any) => {
    setTaskToSwap(task);
    setSwapModalOpen(true);
  };

  const handleSwapComplete = async () => {
    setSwapModalOpen(false);
    setTaskToSwap(null);
    await fetchTasks();
    await reloadSwaps();
    toast.success('Tarea actualizada correctamente');
  };

  const canUserSwapTask = (task: any) => {
    // El usuario asignado puede cambiar su tarea
    return task.user_id === userId;
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {isLocked 
          ? 'La semana ha terminado. Las tareas estarán disponibles en la próxima semana.' 
          : 'No hay tareas asignadas para esta fase'}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 md:space-y-3">
        {tasks.map((task) => {
          const isCompleted = completions.has(task.id);
          return (
            <div
              key={task.id}
              className={`flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg border transition-all min-h-[72px] ${
                isCompleted
                  ? 'bg-success/5 border-success/20'
                  : 'bg-card hover:shadow-sm'
              }`}
            >
              <Checkbox
                checked={isCompleted}
                onCheckedChange={() => handleToggleTask(task, isCompleted)}
                className="mt-1 h-5 w-5 md:h-4 md:w-4"
                disabled={isLocked}
              />
              <div className="flex-1 space-y-2">
                <p className={`font-medium text-sm md:text-base ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs md:text-sm text-muted-foreground">{task.description}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  {task.area && (
                    <Badge variant="secondary" className="text-xs">
                      {task.area}
                    </Badge>
                  )}
                  {task.leader_id && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Líder: {leadersById[task.leader_id] || 'Por asignar'}
                    </Badge>
                  )}
                </div>
                <details className="mt-1 text-xs md:text-sm text-muted-foreground">
                  <summary className="cursor-pointer font-medium">Instrucciones / Pasos a seguir</summary>
                  <p className="mt-1">
                    {task.description
                      ? task.description
                      : 'Revisa los objetivos de la tarea, coordina con tu líder si aplica y deja evidencias claras al finalizar.'}
                  </p>
                </details>
              </div>
              {!isCompleted && !isLocked && canUserSwapTask(task) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenSwapModal(task)}
                  disabled={remainingSwaps === 0}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden md:inline">Cambiar</span>
                </Button>
              )}
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

      {taskToSwap && swapModalOpen && userId && (
        <TaskSwapModal
          task={taskToSwap}
          userId={userId}
          mode={mode}
          remainingSwaps={remainingSwaps}
          onSwapComplete={handleSwapComplete}
          onCancel={() => {
            setSwapModalOpen(false);
            setTaskToSwap(null);
          }}
        />
      )}
    </>
  );
};

export default TaskList;