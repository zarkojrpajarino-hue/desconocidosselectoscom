import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, Check, X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  description: string;
  user_id: string;
  leader_id: string | null;
  area: string;
  phase: number;
}

interface TaskAlternative {
  id: string;
  title: string;
  description: string;
  leader_id: string | null;
  area: string;
}

interface TaskSwapModalProps {
  task: Task;
  userId: string;
  mode: 'conservador' | 'moderado' | 'agresivo';
  remainingSwaps: number;
  onSwapComplete: () => void;
  onCancel: () => void;
}

const swapLimits = {
  conservador: 5,
  moderado: 7,
  agresivo: 10
};

export const TaskSwapModal: React.FC<TaskSwapModalProps> = ({ 
  task, 
  userId,
  mode,
  remainingSwaps,
  onSwapComplete, 
  onCancel 
}) => {
  const [alternatives, setAlternatives] = useState<TaskAlternative[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [leaderComment, setLeaderComment] = useState('');
  const [showCommentError, setShowCommentError] = useState(false);
  const { toast } = useToast();
  
  // Determinar si el usuario actual es líder de la tarea
  const isLeaderSwapping = task.leader_id === userId;

  useEffect(() => {
    generateAlternatives();
  }, []);

  const generateAlternatives = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-task-alternatives', {
        body: { task }
      });

      if (error) throw error;

      if (data.alternatives) {
        setAlternatives(data.alternatives);
      } else if (data.fallback) {
        setAlternatives(data.fallback);
        toast({
          title: "Usando alternativas de respaldo",
          description: "No se pudo conectar con el servicio de IA",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error generando alternativas:', error);
      toast({
        title: "Error",
        description: "No se pudieron generar alternativas",
        variant: "destructive"
      });
      onCancel();
    }
    setLoading(false);
  };

  const handleSwap = async () => {
    if (!selectedId || remainingSwaps <= 0) return;

    const selected = alternatives.find(a => a.id === selectedId);
    if (!selected) return;

    // Validar que el líder haya escrito el comentario (obligatorio)
    if (isLeaderSwapping && !leaderComment.trim()) {
      setShowCommentError(true);
      toast({
        title: "⚠️ Campo obligatorio",
        description: "Debes explicar por qué cambias esta tarea",
        variant: "destructive"
      });
      return;
    }

    try {
      // VALIDACIÓN DE SEGURIDAD: Verificar permisos según tipo de tarea
      const isIndividual = !task.leader_id;
      const isAssignedUser = task.user_id === userId;
      const isCollaborative = !isIndividual;
      const isTaskLeader = task.leader_id === userId;

      // REGLA 1: Tarea individual → solo la persona asignada (user_id) puede cambiarla
      // REGLA 2: Tarea colaborativa (con líder) → SOLO el líder de la tarea (leader_id) puede cambiarla
      const hasPermission = isIndividual ? isAssignedUser : isTaskLeader;

      if (!hasPermission) {
        toast({
          title: "⛔ Acción no permitida",
          description: isIndividual
            ? "Solo puedes cambiar tus propias tareas individuales"
            : "Solo el líder de esta tarea colaborativa puede cambiarla",
          variant: "destructive"
        });
        return;
      }

      // Obtener número de semana actual
      const { data: systemConfig } = await supabase
        .from('system_config')
        .select('week_start')
        .single();

      if (!systemConfig) throw new Error('No system config found');

      const weekStart = new Date(systemConfig.week_start);
      const now = new Date();
      const weekNumber = Math.floor((now.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

      // 1. ACTUALIZAR LA TAREA EN LA DB
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          title: selected.title,
          description: selected.description
        })
        .eq('id', task.id);

      if (updateError) throw updateError;

      // 2. REGISTRAR EL CAMBIO EN task_swaps
      const { error: swapError } = await supabase
        .from('task_swaps')
        .insert({
          user_id: userId,
          task_id: task.id,
          old_title: task.title,
          new_title: selected.title,
          new_description: selected.description,
          week_number: weekNumber,
          mode: mode,
          leader_comment: isLeaderSwapping ? leaderComment.trim() : null
        });

      if (swapError) throw swapError;

      // 3. Si un líder cambia la tarea de otra persona, enviar notificación
      if (isLeaderSwapping && task.user_id !== userId) {
        // Insertar notificación en la base de datos
        await supabase.from('notifications').insert({
          user_id: task.user_id,
          type: 'task_changed_by_leader',
          message: `🔄 Tu líder cambió tu tarea: "${task.title}" → "${selected.title}". Razón: ${leaderComment.trim()}`
        });

        // Obtener datos del líder para el email
        const { data: leaderData } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', userId)
          .single();

        // Enviar email al usuario afectado
        await supabase.functions.invoke('send-task-change-email', {
          body: {
            to_user_id: task.user_id,
            old_title: task.title,
            new_title: selected.title,
            new_description: selected.description,
            leader_name: leaderData?.full_name || 'Tu líder',
            leader_comment: leaderComment.trim()
          }
        });
      }

      toast({
        title: "✅ Tarea actualizada",
        description: `"${task.title}" → "${selected.title}"`,
      });

      onSwapComplete();
    } catch (error) {
      console.error('Error cambiando tarea:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar la tarea",
        variant: "destructive"
      });
    }
  };

  const getModeColor = () => {
    if (mode === 'conservador') return 'text-green-600 bg-green-50 border-green-200';
    if (mode === 'moderado') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getModeLabel = () => {
    if (mode === 'conservador') return '🟢 Conservador';
    if (mode === 'moderado') return '🟡 Moderado';
    return '🔴 Agresivo';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold">🔄 Cambiar Tarea</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Tarea original: <span className="font-medium">"{task.title}"</span>
            </p>
            {task.leader_id && (
              <p className="text-xs text-blue-600 mt-1">
                ✓ Líder: {task.leader_id} (se mantendrá en todas las alternativas)
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-1 rounded border ${getModeColor()}`}>
                {getModeLabel()}
              </span>
              <span className="text-xs font-medium">
                Cambios restantes: {remainingSwaps}/{swapLimits[mode]}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {remainingSwaps === 0 && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              ⚠️ Has alcanzado el límite de cambios para esta semana en modo {mode}.
              {mode === 'conservador' && ' Prueba cambiar a modo Moderado (7 cambios) o Agresivo (10 cambios).'}
            </AlertDescription>
          </Alert>
        )}

        {isLeaderSwapping && (
          <div className="mb-4 space-y-2">
            <label className="text-sm font-semibold text-foreground">
              ¿Por qué quieres cambiar esta tarea? <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={leaderComment}
              onChange={(e) => {
                setLeaderComment(e.target.value);
                setShowCommentError(false);
              }}
              placeholder="Explica la razón del cambio al colaborador..."
              className={`min-h-[100px] ${showCommentError && !leaderComment.trim() ? 'border-red-500' : ''}`}
            />
            {showCommentError && !leaderComment.trim() && (
              <p className="text-xs text-red-500">Este campo es obligatorio</p>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3">Generando 5 alternativas con IA...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {alternatives.map((alt, index) => (
              <Card
                key={alt.id}
                className={`p-4 cursor-pointer transition-all ${
                  selectedId === alt.id
                    ? 'border-2 border-primary bg-primary/5'
                    : 'border hover:border-primary/50'
                } ${remainingSwaps === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => remainingSwaps > 0 && setSelectedId(alt.id)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary mr-3">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">{alt.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{alt.description}</p>
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                        {alt.area}
                      </span>
                      {alt.leader_id && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          Líder: {alt.leader_id}
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedId === alt.id && (
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSwap}
            disabled={!selectedId || loading || remainingSwaps === 0}
            className="flex-1"
          >
            {remainingSwaps === 0 ? 'Sin cambios disponibles' : 'Confirmar Cambio'}
          </Button>
        </div>
      </Card>
    </div>
  );
};