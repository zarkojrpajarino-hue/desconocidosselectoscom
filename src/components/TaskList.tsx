import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import TaskEvaluationModal from "./TaskEvaluationModal";
import TaskInsightsModal from "./TaskInsightsModal";
import TaskCollaboratorFeedbackModal from "./TaskCollaboratorFeedbackModal";
import { TaskSwapModal } from "./TaskSwapModal";
import { useTaskSwaps } from "@/hooks/useTaskSwaps";
import { isUserLeaderOfArea } from "@/lib/areaLeaders";

interface TaskListProps {
  userId: string | undefined;
  currentPhase: number | undefined;
  isLocked?: boolean;
  mode?: "conservador" | "moderado" | "agresivo";
  taskLimit?: number;
}

const TaskList = ({ userId, currentPhase, isLocked = false, mode = "moderado", taskLimit }: TaskListProps) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [sharedTasks, setSharedTasks] = useState<any[]>([]);
  const [completions, setCompletions] = useState<Map<string, any>>(new Map());
  const [evaluationModalOpen, setEvaluationModalOpen] = useState(false);
  const [collaboratorFeedbackModalOpen, setCollaboratorFeedbackModalOpen] = useState(false);
  const [insightsModalOpen, setInsightsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [taskToSwap, setTaskToSwap] = useState<any>(null);
  const { remainingSwaps, reload: reloadSwaps } = useTaskSwaps(userId || "", mode);
  const [leadersById, setLeadersById] = useState<Record<string, string>>({});
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [impactMeasurementModalOpen, setImpactMeasurementModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'to_leader' | 'to_collaborator'>('to_leader');

  useEffect(() => {
    if (userId && currentPhase) {
      fetchTasks();
    }
  }, [userId, currentPhase, taskLimit]);

  const fetchTasks = async () => {
    if (!userId || !currentPhase) return;

    // TAREAS DEL USUARIO: Obtener según el límite del modo (5, 8 o 12)
    // Solo tareas donde user_id = userId (tanto individuales como colaborativas propias)
    let query = supabase.from("tasks").select("*").eq("user_id", userId).eq("phase", currentPhase).order("order_index");

    // Aplicar el límite según el modo
    if (taskLimit) {
      query = query.limit(taskLimit);
    }

    const { data: taskData } = await query;

    // TAREAS EN COLABORACIÓN: Tareas de OTROS usuarios donde este usuario es colaborador (leader_id)
    // Estas NO cuentan para el límite del modo, son adicionales
    const { data: sharedTaskData } = await supabase
      .from("tasks")
      .select("*")
      .eq("phase", currentPhase)
      .eq("leader_id", userId)
      .neq("user_id", userId)
      .order("order_index");

    // Obtener completaciones con detalles
    const { data: completionData } = await supabase.from("task_completions").select("*").eq("user_id", userId);

    if (taskData) {
      setTasks(taskData);

      // Obtener IDs de todos los líderes y usuarios involucrados
      const allTasks = [...taskData, ...(sharedTaskData || [])];
      const userIds = Array.from(
        new Set([
          ...allTasks.map((t: any) => t.leader_id).filter(Boolean),
          ...allTasks.map((t: any) => t.user_id).filter(Boolean),
        ]),
      ) as string[];

      if (userIds.length > 0) {
        const { data: users } = await supabase.from("users").select("id, full_name, username").in("id", userIds);

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
      completionData.forEach((c) => {
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
        await supabase.from("task_completions").delete().eq("task_id", task.id).eq("user_id", userId);

        setCompletions((prev) => {
          const newMap = new Map(prev);
          newMap.delete(task.id);
          return newMap;
        });
        toast.success("Tarea marcada como pendiente");
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
      toast.error("Error al actualizar tarea");
    }
  };

  const handleSubmitEvaluation = async (evaluation: { q1: string; q2: string; q3: string; stars: number }) => {
    if (!userId || !selectedTask) return;

    try {
      // Colaborador da feedback al líder (40%)
      await supabase.from("task_completions").insert({
        task_id: selectedTask.id,
        user_id: userId,
        completed_by_user: true,
        validated_by_leader: false,
        leader_evaluation: evaluation,
      });

      await fetchTasks();

      // Notificar al líder
      if (selectedTask.leader_id) {
        await supabase.from("notifications").insert({
          user_id: selectedTask.leader_id,
          type: "evaluation_pending",
          message: `${leadersById[userId] || "Un colaborador"} completó la tarea "${selectedTask.title}" y envió feedback`,
        });
      }

      // Abrir modal de insights después del feedback
      setInsightsModalOpen(true);
    } catch (error) {
      toast.error("Error al completar tarea");
      throw error;
    }
  };

  const handleSubmitCollaboratorFeedback = async (feedback: { q1: string; q2: string; q3: string; stars: number }) => {
    if (!userId || !selectedTask) return;

    try {
      // Líder da feedback a colaboradores (90%)
      const completion = completions.get(selectedTask.id);

      if (completion) {
        // Actualizar completion existente
        await supabase
          .from("task_completions")
          .update({
            collaborator_feedback: feedback,
          })
          .eq("id", completion.id);

        // NOTIFICACIÓN 3: Líder valida primero (ejecutor → 80%)
        if (!completion.leader_evaluation) {
          await supabase.from('notifications').insert({
            user_id: selectedTask.user_id,
            type: 'leader_validated_first',
            message: `${leadersById[userId] || "Tu líder"} validó la tarea "${selectedTask.title}". Completa feedback + medición para 100%`
          });
        }
      } else {
        // Crear nuevo completion
        await supabase.from("task_completions").insert({
          task_id: selectedTask.id,
          user_id: selectedTask.user_id,
          completed_by_user: true,
          validated_by_leader: false,
          collaborator_feedback: feedback,
        });
      }

      await fetchTasks();

      // Abrir modal de insights después del feedback
      setInsightsModalOpen(true);
    } catch (error) {
      toast.error("Error al guardar feedback");
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
              .from("task_completions")
              .update({
                validated_by_leader: true,
                user_insights: insights,
              })
              .eq("id", completion.id);
          } else {
            await supabase.from("task_completions").insert({
              task_id: selectedTask.id,
              user_id: selectedTask.user_id,
              completed_by_user: true,
              validated_by_leader: true,
              user_insights: insights,
            });
          }

          // NOTIFICACIÓN 2: Líder valida → Notificar ejecutor
          await supabase.from("notifications").insert({
            user_id: selectedTask.user_id,
            type: "leader_validated",
            message: `${leadersById[userId] || "Tu líder"} validó tu tarea "${selectedTask.title}". ¡100% completado! 🎉`,
          });
          
          // EMAIL de validación
          await supabase.functions.invoke('send-leader-validation-email', {
            body: {
              to_user_id: selectedTask.user_id,
              task_title: selectedTask.title,
              leader_name: leadersById[userId] || "Tu líder",
              feedback: completion?.collaborator_feedback || {}
            }
          });

          toast.success("¡Tarea completada al 100%!");
        } else {
          // Colaborador completa insights - queda al 50% esperando validación del líder
          if (completion) {
            await supabase
              .from("task_completions")
              .update({
                user_insights: insights,
              })
              .eq("id", completion.id);
          }

          // NOTIFICACIÓN 1: Ejecutor completa (50%) → Notificar líder
          if (completion?.leader_evaluation && completion?.impact_measurement) {
            await supabase.from('notifications').insert({
              user_id: selectedTask.leader_id,
              type: 'validation_request',
              message: `${leadersById[userId] || "Un colaborador"} completó la tarea "${selectedTask.title}" y necesita tu validación`
            });
          }

          toast.success("¡Insights completados! Tarea al 50%, esperando validación del líder");
        }
      } else {
        // Tarea individual completada al 100%
        await supabase.from("task_completions").insert({
          task_id: selectedTask.id,
          user_id: userId,
          completed_by_user: true,
          validated_by_leader: true,
          user_insights: insights,
        });

        toast.success("¡Tarea completada al 100%!");
      }

      await fetchTasks();
    } catch (error) {
      toast.error("Error al completar tarea");
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
    toast.success("Tarea actualizada correctamente");
  };

  const canUserSwapTask = async (task: any) => {
    if (!userId) return false;
    
    // Obtener username del usuario actual
    const { data: userData } = await supabase
      .from('users')
      .select('username')
      .eq('id', userId)
      .single();
    
    if (!userData) return false;
    
    // REGLA 1: Si la tarea es individual (sin líder), solo el asignado puede cambiarla
    if (!task.leader_id) {
      return task.user_id === userId;
    }
    
    // REGLA 2: Si la tarea tiene líder, solo el líder del área puede cambiarla
    return isUserLeaderOfArea(userData.username, task.area);
  };

  const getTaskCompletionStatus = (task: any, completion: any) => {
    if (!completion) {
      return {
        percentage: 0,
        message: "",
        needsFeedback: false,
        needsImpactMeasurement: false,
        buttonText: ""
      };
    }

    const isSharedTask = task.leader_id !== null;
    const isLeader = task.user_id !== userId; // Si la tarea no es mía, soy líder

    // TAREA INDIVIDUAL
    if (!isSharedTask) {
      return completion.impact_measurement && completion.user_insights
        ? { percentage: 100, message: "✅ Completada", needsFeedback: false, needsImpactMeasurement: false, buttonText: "" }
        : { percentage: 0, message: "", needsFeedback: false, needsImpactMeasurement: false, buttonText: "" };
    }

    // TAREA COLABORATIVA - SOY EJECUTOR
    if (!isLeader) {
      // Estado 1: Solo feedback al líder (40%)
      if (completion.leader_evaluation && !completion.impact_measurement) {
        return {
          percentage: 40,
          message: "Para llegar al 50%:",
          needsFeedback: false,
          needsImpactMeasurement: true,
          buttonText: "Completar Medición de Impacto"
        };
      }

      // Estado 2: Feedback + Medición (50%)
      if (completion.leader_evaluation && completion.impact_measurement && !completion.validated_by_leader) {
        return {
          percentage: 50,
          message: "⏳ Esperando validación de " + (leadersById[task.leader_id] || "líder"),
          needsFeedback: false,
          needsImpactMeasurement: false,
          buttonText: ""
        };
      }

      // Estado 3: Líder validó (100%)
      if (completion.validated_by_leader) {
        return {
          percentage: 100,
          message: "✅ Completada y validada",
          needsFeedback: false,
          needsImpactMeasurement: false,
          buttonText: ""
        };
      }
    }

    // TAREA COLABORATIVA - SOY LÍDER
    if (isLeader) {
      const executorCompletion = completions.get(task.id);

      // ESCENARIO A: Ejecutor completó primero
      if (executorCompletion?.leader_evaluation && executorCompletion?.impact_measurement) {
        // Líder validó (90%)
        if (completion.collaborator_feedback && !completion.impact_measurement) {
          return {
            percentage: 90,
            message: "Para llegar al 100%:",
            needsFeedback: false,
            needsImpactMeasurement: true,
            buttonText: "Completar Medición de Impacto"
          };
        }

        // Líder completó todo (100%)
        if (completion.collaborator_feedback && completion.impact_measurement) {
          return {
            percentage: 100,
            message: "✅ Completada",
            needsFeedback: false,
            needsImpactMeasurement: false,
            buttonText: ""
          };
        }
      }

      // ESCENARIO B: Líder validó primero (líder 90%, ejecutor 80%)
      if (completion.collaborator_feedback && !executorCompletion?.leader_evaluation) {
        return {
          percentage: 90,
          message: "Esperando que ejecutor complete feedback + medición. Para tu 100%:",
          needsFeedback: false,
          needsImpactMeasurement: true,
          buttonText: "Completar tu Medición de Impacto"
        };
      }
    }

    return { 
      percentage: 0, 
      message: "", 
      needsFeedback: false, 
      needsImpactMeasurement: false,
      buttonText: ""
    };
  };

  if (tasks.length === 0 && sharedTasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {isLocked
          ? "La semana ha terminado. Las tareas estarán disponibles en la próxima semana."
          : "No hay tareas asignadas para esta fase"}
      </div>
    );
  }

  const renderTask = (task: any, canSwapOverride?: boolean) => {
    const completion = completions.get(task.id);
    const isCompleted = completion?.validated_by_leader || false;
    const { percentage, message, needsFeedback, needsImpactMeasurement, buttonText } = getTaskCompletionStatus(task, completion);
    
    // Calcular permisos de swap
    const canSwap = canSwapOverride !== undefined ? canSwapOverride : (() => {
      if (!userId) return false;
      
      // Si es individual, solo el asignado puede cambiarla
      if (!task.leader_id) return task.user_id === userId;
      
      // Si tiene líder, necesitamos verificar si el usuario es líder del área
      // Esto se hace de forma sincrónica usando leadersById que ya tenemos
      const currentUser = Object.entries(leadersById).find(([id]) => id === userId);
      if (!currentUser) return false;
      
      // Buscar el username del usuario actual
      return isUserLeaderOfArea(userId, task.area);
    })();

    return (
      <div
        key={task.id}
        className={`flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg border transition-all min-h-[72px] ${
          isCompleted
            ? "bg-success/5 border-success/20"
            : percentage > 0
              ? "bg-primary/5 border-primary/20"
              : "bg-card hover:shadow-sm"
        }`}
      >
        <Checkbox
          checked={isCompleted}
          onCheckedChange={() => handleToggleTask(task, completion, isCompleted)}
          className="mt-1 h-5 w-5 md:h-4 md:w-4"
          disabled={isLocked}
        />
        <div className="flex-1 space-y-2">
          <p className={`font-medium text-sm md:text-base ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
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
                Líder: {leadersById[task.leader_id] || "Por asignar"}
              </Badge>
            )}
            {task.user_id !== userId && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Users className="w-3 h-3" />
                Asignado: {leadersById[task.user_id] || "Usuario"}
              </Badge>
            )}
          </div>

          {percentage > 0 && percentage < 100 && (
            <div className="mt-3 space-y-2">
              {/* Barra de progreso */}
              <div className="flex items-center gap-2">
                <Progress value={percentage} className="h-2 flex-1" />
                <span className="text-xs font-semibold text-muted-foreground">
                  {percentage}%
                </span>
              </div>

              {/* Mensaje + botón si es necesario */}
              {message && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-2">
                    ⚠️ {message}
                  </p>

                  {needsImpactMeasurement && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedTask(task);
                        setImpactMeasurementModalOpen(true);
                      }}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      {buttonText || "Completar Medición de Impacto"}
                    </Button>
                  )}

                  {needsFeedback && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedTask(task);
                        setFeedbackModalOpen(true);
                      }}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      Dar Feedback (OBLIGATORIO)
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          <details className="mt-1 text-xs md:text-sm text-muted-foreground">
            <summary className="cursor-pointer font-medium">Instrucciones / Pasos a seguir</summary>
            <p className="mt-1">
              {task.description
                ? task.description
                : "Revisa los objetivos de la tarea, coordina con tu líder si aplica y deja evidencias claras al finalizar."}
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
      {/* MIS TAREAS - Según el modo (5, 8 o 12) */}
      {tasks.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">
            Mis Tareas ({tasks.length}/{taskLimit || 12})
          </h3>
          <div className="space-y-2 md:space-y-3">{tasks.map((task) => renderTask(task))}</div>
        </div>
      )}

      {/* TAREAS QUE VALIDO - Adicionales, no cuentan para el límite */}
      {sharedTasks.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            🤝 Tareas que Valido ({sharedTasks.length})
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Tareas de otros miembros donde tú eres el líder validador
          </p>
          <div className="space-y-2 md:space-y-3">{sharedTasks.map((task) => renderTask(task))}</div>
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
            isLeader={selectedTask.area && isUserLeaderOfArea(userId || "", selectedTask.area)}
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
