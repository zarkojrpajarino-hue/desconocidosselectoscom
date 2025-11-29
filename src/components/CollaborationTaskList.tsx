import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Check, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';
import LeaderValidationModal, { LeaderFeedback } from './LeaderValidationModal';

interface CollaborationTaskListProps {
  userId: string | undefined;
  currentPhase: number | undefined;
}

const CollaborationTaskList = ({ userId, currentPhase }: CollaborationTaskListProps) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  useEffect(() => {
    if (userId && currentPhase) {
      fetchCollaborationTasks();
    }
  }, [userId, currentPhase]);

  const fetchCollaborationTasks = async () => {
    if (!userId || !currentPhase) return;

    try {
      // Obtener tareas donde este usuario es el líder
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('leader_id', userId)
        .eq('phase', currentPhase)
        .neq('user_id', userId) // Excluir tareas donde también es el ejecutor
        .order('order_index');

      if (taskError) throw taskError;

      if (!taskData || taskData.length === 0) {
        setTasks([]);
        setLoading(false);
        return;
      }

      // Obtener IDs únicos de usuarios (ejecutores)
      const userIds = Array.from(new Set(taskData.map(t => t.user_id).filter(Boolean)));

      // Obtener información de los usuarios
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, username')
        .in('id', userIds);

      if (usersError) throw usersError;

      // Crear mapa de usuarios
      const usersMap: Record<string, any> = {};
      users?.forEach(user => {
        usersMap[user.id] = user;
      });

      // Obtener completaciones de todas las tareas
      const taskIds = taskData.map(t => t.id);
      const { data: completions, error: completionsError } = await supabase
        .from('task_completions')
        .select('*')
        .in('task_id', taskIds);

      if (completionsError) throw completionsError;

      // Crear mapa de completaciones
      const completionsMap: Record<string, any> = {};
      completions?.forEach(completion => {
        completionsMap[completion.task_id] = completion;
      });

      // Combinar datos
      const enrichedTasks = taskData.map(task => ({
        ...task,
        executor: usersMap[task.user_id],
        completion: completionsMap[task.id]
      }));

      setTasks(enrichedTasks);
    } catch (error) {
      console.error('Error fetching collaboration tasks:', error);
      toast.error('Error al cargar tareas de colaboración');
    } finally {
      setLoading(false);
    }
  };

  const getTaskStatus = (task: any) => {
    if (!task.completion) {
      return { icon: Clock, label: '⏳ Pendiente', color: 'text-muted-foreground', bgColor: 'bg-muted' };
    }

    if (task.completion.validated_by_leader) {
      return { icon: Check, label: '✅ Completada', color: 'text-success', bgColor: 'bg-success/10' };
    }

    if (task.completion.completed_by_user) {
      return { icon: FileText, label: '📝 Esperando validación', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950/20' };
    }

    return { icon: Clock, label: '⏳ Pendiente', color: 'text-muted-foreground', bgColor: 'bg-muted' };
  };

  const handleOpenValidationModal = (task: any) => {
    setSelectedTask(task);
    setValidationModalOpen(true);
  };

  const handleSubmitValidation = async (feedback: LeaderFeedback) => {
    if (!selectedTask?.completion) {
      toast.error('No hay completación para validar');
      return;
    }

    try {
      const { error } = await supabase
        .from('task_completions')
        .update({ 
          validated_by_leader: true,
          leader_feedback: feedback as any
        })
        .eq('id', selectedTask.completion.id);

      if (error) throw error;

      // Crear alerta de celebración
      await supabase.from('smart_alerts').insert({
        alert_type: 'task_validated',
        severity: 'celebration',
        title: '🎉 Tarea Validada',
        message: `El líder ha validado tu tarea "${selectedTask.title}"`,
        source: 'tasks',
        category: 'completion',
        target_user_id: selectedTask.user_id,
        actionable: false
      });

      toast.success('Tarea validada exitosamente');
      fetchCollaborationTasks();
    } catch (error) {
      console.error('Error validating task:', error);
      toast.error('Error al validar tarea');
      throw error;
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Cargando...</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No tienes tareas de colaboración en esta fase
      </div>
    );
  }

  return (
    <>
      <LeaderValidationModal
        open={validationModalOpen}
        onOpenChange={setValidationModalOpen}
        onSubmit={handleSubmitValidation}
        taskTitle={selectedTask?.title || ''}
        executorName={selectedTask?.executor?.full_name || selectedTask?.executor?.username || 'Usuario'}
      />
      
      <div className="space-y-3">
        <Accordion type="single" collapsible className="space-y-2">
        {tasks.map((task) => {
          const status = getTaskStatus(task);
          const StatusIcon = status.icon;

          return (
            <AccordionItem
              key={task.id}
              value={task.id}
              className={`border rounded-lg ${status.bgColor}`}
            >
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <StatusIcon className={`h-5 w-5 ${status.color} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm md:text-base truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tarea de {task.executor?.full_name || task.executor?.username || 'Usuario'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {task.area && (
                      <Badge variant="secondary" className="text-xs">
                        {task.area}
                      </Badge>
                    )}
                    <Badge variant="outline" className={`text-xs ${status.color}`}>
                      {status.label}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-4 pb-4 space-y-4">
                {/* Descripción */}
                {task.description && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Descripción:</p>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>
                )}

                {/* Evaluación del usuario (si existe) */}
                {task.completion?.leader_evaluation && (
                  <div className="space-y-2 bg-card p-3 rounded-lg border">
                    <p className="text-sm font-medium">📝 Evaluación del colaborador:</p>
                    <div className="space-y-2 text-xs">
                      <div>
                        <p className="font-medium text-muted-foreground">1. ¿Qué fue lo más desafiante?</p>
                        <p>{task.completion.leader_evaluation.q1}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">2. ¿Qué aprendiste?</p>
                        <p>{task.completion.leader_evaluation.q2}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">3. ¿Cómo mejorarías el proceso?</p>
                        <p>{task.completion.leader_evaluation.q3}</p>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        <p className="font-medium text-muted-foreground">Valoración:</p>
                        {'⭐'.repeat(task.completion.leader_evaluation.stars)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Insights del usuario (si existe) */}
                {task.completion?.user_insights && (
                  <div className="space-y-2 bg-card p-3 rounded-lg border">
                    <p className="text-sm font-medium">💡 Insights del colaborador:</p>
                    <div className="space-y-2 text-xs">
                      <div>
                        <p className="font-medium text-muted-foreground">Aprendizajes:</p>
                        <p>{task.completion.user_insights.learnings}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Contribución:</p>
                        <p>{task.completion.user_insights.contribution}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Decisiones futuras:</p>
                        <p>{task.completion.user_insights.futureDecisions}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Sugerencias:</p>
                        <p>{task.completion.user_insights.suggestions}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Feedback del líder (si existe) */}
                {task.completion?.leader_feedback && (
                  <div className="space-y-2 bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-sm font-medium">👨‍💼 Feedback del líder:</p>
                    <div className="space-y-2 text-xs">
                      <div>
                        <p className="font-medium text-muted-foreground">✅ Lo que hizo bien:</p>
                        <p>{task.completion.leader_feedback.whatWentWell}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">📈 Áreas de mejora:</p>
                        <p>{task.completion.leader_feedback.whatToImprove}</p>
                      </div>
                      {task.completion.leader_feedback.additionalComments && (
                        <div>
                          <p className="font-medium text-muted-foreground">💬 Comentarios adicionales:</p>
                          <p>{task.completion.leader_feedback.additionalComments}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-amber-500">
                        <p className="font-medium text-muted-foreground">Valoración del líder:</p>
                        {'⭐'.repeat(task.completion.leader_feedback.rating)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Botón de validación */}
                {task.completion?.completed_by_user && !task.completion?.validated_by_leader && (
                  <Button
                    onClick={() => handleOpenValidationModal(task)}
                    className="w-full"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Validar Tarea
                  </Button>
                )}

                {/* Mensaje si está pendiente */}
                {!task.completion && (
                  <div className="text-center py-2 text-sm text-muted-foreground">
                    ⏳ El colaborador aún no ha completado esta tarea
                  </div>
                )}

                {/* Mensaje si ya está validada */}
                {task.completion?.validated_by_leader && (
                  <div className="text-center py-2 text-sm text-success">
                    ✅ Tarea validada exitosamente
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
        </Accordion>
      </div>
    </>
  );
};

export default CollaborationTaskList;
