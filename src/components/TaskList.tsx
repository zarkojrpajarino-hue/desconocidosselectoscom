import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import TaskFeedbackModal from "./TaskFeedbackModal";
import TaskImpactMeasurementModal from "./TaskImpactMeasurementModal";
import { TaskSwapModal } from "./TaskSwapModal";
import { useTaskSwaps } from "@/hooks/useTaskSwaps";
import { isUserLeaderOfArea } from "@/lib/areaLeaders";
import ConfettiEffect from "./ConfettiEffect";
import BadgeUnlockAnimation from "./BadgeUnlockAnimation";
import { useAuth } from "@/contexts/AuthContext";

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
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [taskToSwap, setTaskToSwap] = useState<any>(null);
  const { remainingSwaps, reload: reloadSwaps } = useTaskSwaps(userId || "", mode);
  const [leadersById, setLeadersById] = useState<Record<string, string>>({});
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [impactMeasurementModalOpen, setImpactMeasurementModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'to_leader' | 'to_collaborator'>('to_leader');
  const [showConfetti, setShowConfetti] = useState(false);
  const [unlockedBadge, setUnlockedBadge] = useState<any>(null);

  // Get current organization for multi-tenancy
  const { currentOrganizationId } = useAuth();

  useEffect(() => {
    if (userId && currentPhase) {
      fetchTasks();
    }
  }, [userId, currentPhase, taskLimit]);

  useEffect(() => {
    if (!userId) return;

    // FASE 1: Fix memory leak - Suscripción a badges con cleanup
    const channel = supabase
      .channel('badge-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'smart_alerts',
          filter: `target_user_id=eq.${userId}`,
        },
        (payload) => {
          const alert = payload.new as any;
          if (alert.alert_type === 'badge_earned' && alert.context?.badge_data) {
            setUnlockedBadge(alert.context.badge_data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

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
        const { error } = await supabase
          .from("task_completions")
          .delete()
          .eq("task_id", task.id)
          .eq("user_id", userId);

        if (error) throw error;

        setCompletions((prev) => {
          const newMap = new Map(prev);
          newMap.delete(task.id);
          return newMap;
        });
        toast.success("Tarea marcada como pendiente");
      } else {
        const isSharedTask = task.leader_id !== null;
        const isLeader = task.user_id !== userId;

        if (isSharedTask && !isLeader) {
          // COLABORADOR: Primero da feedback al líder
          setSelectedTask(task);
          setFeedbackType('to_leader');
          setFeedbackModalOpen(true);
        } else {
          // INDIVIDUAL o LÍDER: Abrir medición de impacto directamente
          setSelectedTask(task);
          setImpactMeasurementModalOpen(true);
        }
      }
    } catch (error) {
      // FASE 1: Error handling mejorado
      console.error('Error al actualizar tarea:', error);
      toast.error("Error al actualizar tarea. Por favor intenta nuevamente.");
    }
  };

  const handleSubmitFeedback = async (feedback: {
    whatWentWell: string;
    metDeadlines: 'always' | 'almost_always' | 'sometimes' | 'rarely' | 'never';
    whatToImprove: string;
    wouldRecommend: 'definitely_yes' | 'probably_yes' | 'not_sure' | 'probably_no' | 'definitely_no';
    rating: number;
  }) => {
    if (!userId || !selectedTask) return;

    try {
      const isLeader = selectedTask.user_id !== userId;

      if (isLeader) {
        // Líder da feedback a colaborador
        const completion = completions.get(selectedTask.id);

        if (completion) {
          await supabase
            .from("task_completions")
            .update({ collaborator_feedback: feedback })
            .eq("id", completion.id);
        } else {
          // MULTI-TENANCY: Include organization_id in insert
          await supabase.from("task_completions").insert({
            task_id: selectedTask.id,
            user_id: selectedTask.user_id,
            completed_by_user: false,
            validated_by_leader: false,
            collaborator_feedback: feedback,
            organization_id: currentOrganizationId,
          });
        }

        // 🎮 OTORGAR PUNTOS POR DAR FEEDBACK
        await supabase.functions.invoke('award-points', {
          body: {
            user_id: userId,
            action: 'feedback_given',
            task_id: selectedTask.id,
          },
        });

        toast.success("Feedback guardado +15 puntos 🎮. Ahora completa tu medición");
        
        // Cerrar modal de feedback y abrir medición
        setFeedbackModalOpen(false);
        setImpactMeasurementModalOpen(true);
      } else {
        // Colaborador da feedback a líder → 40%
        // MULTI-TENANCY: Include organization_id
        await supabase.from("task_completions").insert({
          task_id: selectedTask.id,
          user_id: userId,
          completed_by_user: true,
          validated_by_leader: false,
          leader_feedback: feedback,
          organization_id: currentOrganizationId,
        });

        // 🎮 OTORGAR PUNTOS POR DAR FEEDBACK
        await supabase.functions.invoke('award-points', {
          body: {
            user_id: userId,
            action: 'feedback_given',
            task_id: selectedTask.id,
          },
        });

        toast.success("Feedback enviado (40%) +15 puntos 🎮. Ahora completa la medición");

        // Cerrar modal de feedback y abrir medición
        setFeedbackModalOpen(false);
        setImpactMeasurementModalOpen(true);
      }

      await fetchTasks();
    } catch (error) {
      toast.error("Error al guardar feedback");
      throw error;
    }
  };

  const handleSubmitImpactMeasurement = async (data: {
    ai_questions: Record<string, any>;
    key_metrics: Array<{ metric: string; value: string; unit: string }>;
    impact_rating: 'exceeded' | 'met' | 'close' | 'below';
    impact_explanation: string;
    future_decisions: string;
    investments_needed: any;
  }) => {
    if (!userId || !selectedTask) return;

    try {
      const isSharedTask = selectedTask.leader_id !== null;
      const isLeader = selectedTask.user_id !== userId;
      const completion = completions.get(selectedTask.id);

      if (isSharedTask) {
        if (isLeader) {
          // Líder completa medición → 100%
          if (completion) {
            const { error } = await supabase
              .from("task_completions")
              .update({
                validated_by_leader: true,
                impact_measurement: data,
              })
              .eq("id", completion.id);

            if (error) throw error;
          } else {
            // MULTI-TENANCY: Include organization_id
            const { error } = await supabase.from("task_completions").insert({
              task_id: selectedTask.id,
              user_id: selectedTask.user_id,
              completed_by_user: true,
              validated_by_leader: true,
              impact_measurement: data,
              organization_id: currentOrganizationId,
            });

            if (error) throw error;
          }

          // 🎮 OTORGAR PUNTOS AL LÍDER POR VALIDAR
          await supabase.functions.invoke('award-points', {
            body: {
              user_id: userId,
              action: 'task_validated',
              task_id: selectedTask.id,
            },
          });

          // ALERTA: Líder validó
          await supabase.from("smart_alerts").insert({
            alert_type: 'task_validated',
            severity: 'celebration',
            title: '🎉 ¡Tarea 100% Completada!',
            message: `${leadersById[userId] || "Tu líder"} validó tu tarea "${selectedTask.title}". ¡100% completado!`,
            source: 'tasks',
            category: 'completion',
            target_user_id: selectedTask.user_id,
            actionable: false
          });

          toast.success("¡Tarea completada al 100%! +30 puntos 🎮");
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 100);
        } else {
          // Colaborador completa medición → 50%
          if (completion) {
            const { error } = await supabase
              .from("task_completions")
              .update({ impact_measurement: data })
              .eq("id", completion.id);

            if (error) throw error;
          }

          // 🎮 OTORGAR PUNTOS AL COLABORADOR POR COMPLETAR TAREA COLABORATIVA
          await supabase.functions.invoke('award-points', {
            body: {
              user_id: userId,
              action: 'task_completed_collaborative',
              task_id: selectedTask.id,
            },
          });

          // ALERTA: Ejecutor completó
          await supabase.from("smart_alerts").insert({
            alert_type: 'validation_request',
            severity: 'important',
            title: '✅ Tarea Lista para Validación',
            message: `${leadersById[userId] || "Un colaborador"} completó la tarea "${selectedTask.title}" y necesita tu validación`,
            source: 'tasks',
            category: 'validation',
            target_user_id: selectedTask.leader_id,
            actionable: true,
            action_label: 'Validar Tarea',
            action_url: '/dashboard'
          });

          toast.success("¡Medición completada! Tarea al 50% +75 puntos 🎮");
        }
      } else {
        // Tarea individual → 100%
        // MULTI-TENANCY: Include organization_id
        const { error } = await supabase.from("task_completions").insert({
          task_id: selectedTask.id,
          user_id: userId,
          completed_by_user: true,
          validated_by_leader: true,
          impact_measurement: data,
          ai_questions: data.ai_questions,
          organization_id: currentOrganizationId,
        });

        if (error) throw error;

        // 🎮 OTORGAR PUNTOS POR TAREA INDIVIDUAL
        await supabase.functions.invoke('award-points', {
          body: {
            user_id: userId,
            action: 'task_completed_individual',
            task_id: selectedTask.id,
          },
        });

        toast.success("¡Tarea completada al 100%! +50 puntos 🎮");
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 100);
      }

      await fetchTasks();
    } catch (error) {
      // FASE 1: Error handling mejorado
      console.error('Error al completar tarea:', error);
      toast.error("Error al completar tarea. Por favor intenta nuevamente.");
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
      const hasImpact = completion.impact_measurement && completion.ai_questions;
      return hasImpact
        ? { percentage: 100, message: "✅ Completada", needsFeedback: false, needsImpactMeasurement: false, buttonText: "" }
        : { percentage: 0, message: "", needsFeedback: false, needsImpactMeasurement: false, buttonText: "" };
    }

    // TAREA COLABORATIVA - SOY EJECUTOR
    if (!isLeader) {
      // Estado 1: Solo feedback al líder (40%)
      if (completion.leader_feedback && !completion.impact_measurement) {
        return {
          percentage: 40,
          message: "Para llegar al 50%:",
          needsFeedback: false,
          needsImpactMeasurement: true,
          buttonText: "Completar Medición de Impacto"
        };
      }

      // Estado 2: Feedback + Medición (50%)
      if (completion.leader_feedback && completion.impact_measurement && !completion.validated_by_leader) {
        const leaderName = leadersById[task.leader_id] || "líder";
        return {
          percentage: 50,
          message: `⏳ Esperando validación de ${leaderName}`,
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
      // Obtener completion del ejecutor
      const executorCompletionData = Array.from(completions.values()).find(
        c => c.task_id === task.id && c.user_id === task.user_id
      );

      // ESCENARIO A: Ejecutor completó primero (tiene leader_feedback + impact_measurement)
      if (executorCompletionData?.leader_feedback && executorCompletionData?.impact_measurement) {
        // Líder dio feedback pero no completó medición (90%)
        if (completion.collaborator_feedback && !completion.impact_measurement) {
          return {
            percentage: 90,
            message: "Para llegar al 100%:",
            needsFeedback: false,
            needsImpactMeasurement: true,
            buttonText: "Completar tu Medición de Impacto"
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

        // Líder no ha dado feedback aún (0%)
        if (!completion.collaborator_feedback) {
          return {
            percentage: 0,
            message: "Da feedback al colaborador para validar",
            needsFeedback: true,
            needsImpactMeasurement: false,
            buttonText: "Dar Feedback al Colaborador"
          };
        }
      }

      // ESCENARIO B: Líder validó primero (sin que ejecutor haya completado)
      if (completion.collaborator_feedback && !executorCompletionData?.leader_feedback) {
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
      
      // REGLA 1: Tarea individual (sin líder) → Solo el asignado (user_id) puede cambiarla
      if (!task.leader_id) {
        return task.user_id === userId;
      }
      
      // REGLA 2: Tarea colaborativa (con líder) → SOLO el líder puede cambiarla
      // El colaborador (user_id) NO puede cambiar tareas donde hay líder
      if (task.leader_id) {
        return task.leader_id === userId;
      }
      
      return false;
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
                        setFeedbackType('to_collaborator');
                        setFeedbackModalOpen(true);
                      }}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      {buttonText || "Dar Feedback (OBLIGATORIO)"}
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
          <TaskFeedbackModal
            open={feedbackModalOpen}
            onOpenChange={setFeedbackModalOpen}
            taskTitle={selectedTask.title}
            feedbackType={feedbackType}
            leaderName={leadersById[selectedTask.leader_id]}
            collaboratorName={leadersById[selectedTask.user_id]}
            onSubmit={handleSubmitFeedback}
          />

          <TaskImpactMeasurementModal
            open={impactMeasurementModalOpen}
            onOpenChange={setImpactMeasurementModalOpen}
            taskTitle={selectedTask.title}
            taskDescription={selectedTask.description || ""}
            taskArea={selectedTask.area || ""}
            onSubmit={handleSubmitImpactMeasurement}
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

      {/* Confetti al completar tareas */}
      <ConfettiEffect trigger={showConfetti} type="task" />

      {/* Animación de badge desbloqueado */}
      <BadgeUnlockAnimation
        badge={unlockedBadge}
        onClose={() => setUnlockedBadge(null)}
      />
    </>
  );
};

export default TaskList;
