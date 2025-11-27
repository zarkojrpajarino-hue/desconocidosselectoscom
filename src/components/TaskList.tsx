import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Users, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import TaskEvaluationModal from './TaskEvaluationModal';
import TaskInsightsModal from './TaskInsightsModal';
import TaskCollaboratorFeedbackModal from './TaskCollaboratorFeedbackModal';
import { TaskSwapModal } from './TaskSwapModal';
import { useTaskSwaps } from '@/hooks/useTaskSwaps';
import { isUserLeaderOfArea } from '@/lib/areaLeaders';

interface TaskListProps {
  userId: string | undefined;
  currentPhase: number | undefined;
  isLocked?: boolean;
  mode?: 'conservador' | 'moderado' | 'agresivo';
  taskLimit?: number;
}

const TaskList = ({ userId, currentPhase, isLocked = false, mode = 'moderado', taskLimit }: TaskListProps) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [sharedTasks, setSharedTasks] = useState<any[]>([]);
  const [completions, setCompletions] = useState<Map<string, any>>(new Map());
  const [evaluationModalOpen, setEvaluationModalOpen] = useState(false);
  const [collaboratorFeedbackModalOpen, setCollaboratorFeedbackModalOpen] = useState(false);
  const [insightsModalOpen, setInsightsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [taskToSwap, setTaskToSwap] = useState<any>(null);
  const { remainingSwaps, reload: reloadSwaps } = useTaskSwaps(userId || '', mode);
  const [leadersById, setLeadersById] = useState<Record<string, string>>({});

  useEffect(() => {
    if (userId && currentPhase) {
      fetchTasks();
    }
  }, [userId, currentPhase, taskLimit]);

  const fetchTasks = async () => {
    if (!userId || !currentPhase) return;

    // Obtener TODAS las tareas asignadas al usuario (según su modo: 5, 8 o 12 tareas)
    // Esto incluye tanto tareas individuales como tareas donde el usuario es el asignado principal
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

    // Obtener tareas de OTROS USUARIOS donde este usuario está involucrado como colaborador
    // Es decir, tareas donde:
    // 1. El user_id NO es este usuario (es tarea de otro)
    // 2. Y este usuario aparece como leader_id (está involucrado como líder/colaborador)
    const { data: sharedTaskData } = await supabase
      .from('tasks')
      .select('*')
      .eq('phase', currentPhase)
      .eq('leader_id', userId)
      .neq('user_id', userId)
      .order('order_index');

    // Obtener completaciones con detalles
    const { data: completionData } = await supabase
      .from('task_completions')
      .select('*')
      .eq('user_id', userId);

    if (taskData) {
      setTasks(taskData);

      // Obtener IDs de todos los líderes y usuarios involucrados
      const allTasks = [...taskData, ...(sharedTaskData || [])];
      const userIds = Array.from(
        new Set([
          ...allTasks.map((t: any) => t.leader_id).filter(Boolean),
          ...allTasks.map((t: any) => t.user_id).filter(Boolean)
        ])
      ) as string[];

      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name, username')
          .in('id', userIds);

        if (users) {
          const map: Record<string, string> = {};
          users.forEach((user: any) => {
            map[user.id] = user.full_name || user.username;
          });
          setLeadersById(map);
        }
      }
    }

    if (sharedTaskData) {
      setSharedTasks(sharedTaskData);
    }

    if (completionData) {
      const map = new Map();
      completionData.forEach(c => {
        map.set(c.task_id, c);
      });
      setCompletions(map);
    }
  };

  const handleToggleTask = async (task: any, completion: any, isCompleted: boolean) => {
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
          const newMap = new Map(prev);
          newMap.delete(task.id);
          return newMap;
        });
        toast.success('Tarea marcada como pendiente');
      } else {
        // Verificar si es tarea compartida
        const isSharedTask = task.leader_id !== null;
        const isLeader = task.area && isUserLeaderOfArea(userId, task.area);

        if (isSharedTask) {
          // Tarea compartida
          if (isLeader) {
            // Líder completa la tarea - primero feedback a colaboradores
            setSelectedTask(task);
            setCollaboratorFeedbackModalOpen(true);
          } else {
            // Colaborador - primero feedback al líder
            setSelectedTask(task);
            setEvaluationModalOpen(true);
          }
        } else {
          // Tarea individual - abrir modal de insights
          setSelectedTask(task);
          setInsightsModalOpen(true);
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
      // Colaborador da feedback al líder (40%)
      const { data: newCompletion } = await supabase
        .from('task_completions')
        .insert({
          task_id: selectedTask.id,
          user_id: userId,
          completed_by_user: true,
          validated_by_leader: false,
          leader_evaluation: evaluation
        })
        .select()
        .single();
      
      await fetchTasks();
      
      // Notificar al líder y enviar email
      if (selectedTask.leader_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: selectedTask.leader_id,
            type: 'evaluation_pending',
            message: `${leadersById[userId] || 'Un colaborador'} completó la tarea "${selectedTask.title}" y envió feedback`
          });

        // Enviar email al líder
        if (newCompletion) {
          await supabase.functions.invoke('send-collaborator-feedback-notification', {
            body: {
              leaderId: selectedTask.leader_id,
              taskId: selectedTask.id,
              collaboratorId: userId,
              completionId: newCompletion.id
            }
          });
        }
      }
      
      // Abrir modal de insights después del feedback
      setInsightsModalOpen(true);
    } catch (error) {
      toast.error('Error al completar tarea');
      throw error;
    }
  };

  const handleSubmitCollaboratorFeedback = async (feedback: {
    q1: string;
    q2: string;
    q3: string;
    stars: number;
  }) => {
    if (!userId || !selectedTask) return;

    try {
      // Líder da feedback a colaboradores (90%)
      const completion = completions.get(selectedTask.id);
      let completionId = completion?.id;
      
      if (completion) {
        // Actualizar completion existente
        await supabase
          .from('task_completions')
          .update({
            collaborator_feedback: feedback
          })
          .eq('id', completion.id);
      } else {
        // Crear nuevo completion
        const { data: newCompletion } = await supabase
          .from('task_completions')
          .insert({
            task_id: selectedTask.id,
            user_id: selectedTask.user_id,
            completed_by_user: true,
            validated_by_leader: false,
            collaborator_feedback: feedback
          })
          .select()
          .single();
        
        completionId = newCompletion?.id;
      }
      
      await fetchTasks();

      // Enviar email al colaborador
      if (completionId) {
        await supabase.functions.invoke('send-leader-feedback-notification', {
          body: {
            collaboratorId: selectedTask.user_id,
            taskId: selectedTask.id,
            leaderId: userId,
            completionId
          }
        });
      }
      
      // Abrir modal de insights después del feedback
      setInsightsModalOpen(true);
    } catch (error) {
      toast.error('Error al guardar feedback');
      throw error;
    }
  };

  const handleSubmitInsights = async (insights: {
    learnings: string;
    contribution: string;
    futureDecisions: string;
    suggestions: string;
  }) => {
    if (!userId || !selectedTask) return;

    try {
      const isSharedTask = selectedTask.leader_id !== null;
      const isLeader = selectedTask.area && isUserLeaderOfArea(userId, selectedTask.area);
      const completion = completions.get(selectedTask.id);

      if (isSharedTask) {
        if (isLeader) {
          // Líder completa insights - marcar al 100%
          if (completion) {
            await supabase
              .from('task_completions')
              .update({
                validated_by_leader: true,
                user_insights: insights
              })
              .eq('id', completion.id);

            // Enviar email de celebración al colaborador
            await supabase.functions.invoke('send-task-completed-celebration', {
              body: {
                collaboratorId: selectedTask.user_id,
                taskId: selectedTask.id,
                leaderId: userId,
                completionId: completion.id
              }
            });
          } else {
            const { data: newCompletion } = await supabase
              .from('task_completions')
              .insert({
                task_id: selectedTask.id,
                user_id: selectedTask.user_id,
                completed_by_user: true,
                validated_by_leader: true,
                user_insights: insights
              })
              .select()
              .single();

            // Enviar email de celebración al colaborador
            if (newCompletion) {
              await supabase.functions.invoke('send-task-completed-celebration', {
                body: {
                  collaboratorId: selectedTask.user_id,
                  taskId: selectedTask.id,
                  leaderId: userId,
                  completionId: newCompletion.id
                }
              });
            }
          }

          // Notificar al colaborador
          await supabase
            .from('notifications')
            .insert({
              user_id: selectedTask.user_id,
              type: 'task_validated',
              message: `El líder ha completado la tarea "${selectedTask.title}" al 100%`
            });

          toast.success('¡Tarea completada al 100%!');
        } else {
          // Colaborador completa insights - queda al 50% esperando validación del líder
          if (completion) {
            await supabase
              .from('task_completions')
              .update({
                user_insights: insights
              })
              .eq('id', completion.id);
          }

          toast.success('¡Insights completados! Tarea al 50%, esperando validación del líder');
        }
      } else {
        // Tarea individual completada al 100%
        await supabase
          .from('task_completions')
          .insert({
            task_id: selectedTask.id,
            user_id: userId,
            completed_by_user: true,
            validated_by_leader: true,
            user_insights: insights
          });

        toast.success('¡Tarea completada al 100%!');
      }

      await fetchTasks();
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

  const getTaskCompletionStatus = (task: any, completion: any) => {
    if (!completion) return { percentage: 0, message: '', needsInsights: false };

    const isSharedTask = task.leader_id !== null;
    const isLeader = task.area && isUserLeaderOfArea(userId || '', task.area);
    
    if (!isSharedTask) {
      // Tarea individual
      return completion.validated_by_leader 
        ? { percentage: 100, message: '', needsInsights: false }
        : { percentage: 0, message: '', needsInsights: false };
    }

    // Tarea compartida
    if (completion.validated_by_leader) {
      return { percentage: 100, message: '✓ Tarea completada y validada', needsInsights: false };
    }
    
    if (isLeader) {
      // Líder
      if (completion.collaborator_feedback && completion.user_insights) {
        return { percentage: 100, message: '✓ Tarea completada', needsInsights: false };
      } else if (completion.collaborator_feedback && !completion.user_insights) {
        return { 
          percentage: 90, 
          message: '⏳ 90% completado. Faltan insights por completar',
          needsInsights: true
        };
      }
    } else {
      // Colaborador
      if (completion.leader_evaluation && completion.user_insights) {
        const leaderName = leadersById[task.leader_id] || 'el líder';
        return { 
          percentage: 50, 
          message: `⏳ 50% completado. Esperando validación de ${leaderName}`,
          needsInsights: false
        };
      } else if (completion.leader_evaluation && !completion.user_insights) {
        return { 
          percentage: 40, 
          message: '⏳ 40% completado. Faltan insights por completar',
          needsInsights: true
        };
      }
    }
    
    return { percentage: 0, message: '', needsInsights: false };
  };

  if (tasks.length === 0 && sharedTasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {isLocked 
          ? 'La semana ha terminado. Las tareas estarán disponibles en la próxima semana.' 
          : 'No hay tareas asignadas para esta fase'}
      </div>
    );
  }

  const renderTask = (task: any, canSwap: boolean = false) => {
    const completion = completions.get(task.id);
    const isCompleted = completion?.validated_by_leader || false;
    const { percentage, message, needsInsights } = getTaskCompletionStatus(task, completion);

    return (
      <div
        key={task.id}
        className={`flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg border transition-all min-h-[72px] ${
          isCompleted
            ? 'bg-success/5 border-success/20'
            : percentage > 0
            ? 'bg-primary/5 border-primary/20'
            : 'bg-card hover:shadow-sm'
        }`}
      >
        <Checkbox
          checked={isCompleted}
          onCheckedChange={() => handleToggleTask(task, completion, isCompleted)}
          className="mt-1 h-5 w-5 md:h-4 md:w-4"
          disabled={isLocked}
        />
        <div className="flex-1 space-y-2">
          <p className={`font-medium text-sm md:text-base ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </p>
          
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
            {task.user_id !== userId && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Users className="w-3 h-3" />
                Asignado: {leadersById[task.user_id] || 'Usuario'}
              </Badge>
            )}
          </div>

          {needsInsights && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTask(task);
                setInsightsModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-950/30"
            >
              <AlertCircle className="w-4 h-4" />
              ⚠️ Completar insights obligatorios para avanzar
            </Button>
          )}

          {percentage > 0 && percentage < 100 && (
            <div className="space-y-1">
              <Progress value={percentage} className="h-2" />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {message}
              </p>
            </div>
          )}

          <details className="mt-1 text-xs md:text-sm text-muted-foreground">
            <summary className="cursor-pointer font-medium">Instrucciones / Pasos a seguir</summary>
            <p className="mt-1">
              {task.description
                ? task.description
                : 'Revisa los objetivos de la tarea, coordina con tu líder si aplica y deja evidencias claras al finalizar.'}
            </p>
          </details>
        </div>
        {!isCompleted && !isLocked && canSwap && (
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
  };

  return (
    <>
      {/* Tareas principales del usuario */}
      {tasks.length > 0 && (
        <div className="space-y-2 md:space-y-3">
          {tasks.map((task) => renderTask(task, canUserSwapTask(task)))}
        </div>
      )}

      {/* Tareas en las que participa como colaborador o líder */}
      {sharedTasks.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Tareas en Colaboración
          </h3>
          <div className="space-y-2 md:space-y-3">
            {sharedTasks.map((task) => renderTask(task, false))}
          </div>
        </div>
      )}

      {selectedTask && (
        <>
          <TaskEvaluationModal
            open={evaluationModalOpen}
            onOpenChange={setEvaluationModalOpen}
            taskTitle={selectedTask.title}
            onSubmit={handleSubmitEvaluation}
          />
          
          <TaskCollaboratorFeedbackModal
            open={collaboratorFeedbackModalOpen}
            onOpenChange={setCollaboratorFeedbackModalOpen}
            taskTitle={selectedTask.title}
            onSubmit={handleSubmitCollaboratorFeedback}
          />
          
          <TaskInsightsModal
            open={insightsModalOpen}
            onOpenChange={setInsightsModalOpen}
            taskTitle={selectedTask.title}
            isLeader={selectedTask.area && isUserLeaderOfArea(userId || '', selectedTask.area)}
            onSubmit={handleSubmitInsights}
          />
        </>
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