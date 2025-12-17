import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getCurrentWeekStart, getCurrentWeekDeadline } from '@/lib/weekUtils';

interface WorkModeSelectorProps {
  userId: string | undefined;
  currentMode: string | undefined;
  onModeChange: () => void;
}

// Los modos ahora son multiplicadores sobre el cálculo adaptativo de tareas
// Se guarda el mode y se usa el multiplicador en el backend
export const WORK_MODES = [
  { id: 'conservador', label: 'Conservador', emoji: '🐢', multiplier: 0.75, description: 'Ritmo relajado' },
  { id: 'moderado', label: 'Moderado', emoji: '🚶', multiplier: 1.0, description: 'Ritmo equilibrado' },
  { id: 'agresivo', label: 'Agresivo', emoji: '🚀', multiplier: 1.35, description: 'Ritmo intenso' },
];

const WorkModeSelector = ({ userId, currentMode, onModeChange }: WorkModeSelectorProps) => {
  const [loading, setLoading] = useState(false);

  const handleModeChange = async (modeId: string) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const mode = WORK_MODES.find(m => m.id === modeId);
      if (!mode) return;

      // Get current week start and deadline using utility functions
      const weekStart = getCurrentWeekStart();
      const deadline = getCurrentWeekDeadline();

      // Check if user already has data for this week
      const { data: existingData } = await supabase
        .from('user_weekly_data')
        .select('id')
        .eq('user_id', userId)
        .eq('week_start', weekStart.toISOString())
        .maybeSingle();

      // El task_limit ahora es un placeholder - el cálculo real ocurre en el backend
      // Guardamos un valor base que será multiplicado por el sistema adaptativo
      const baseTaskLimit = Math.round(10 * mode.multiplier); // 10 como base, se ajusta con multiplicador

      let error;
      if (existingData) {
        const updateResult = await supabase
          .from('user_weekly_data')
          .update({
            mode: modeId,
            task_limit: baseTaskLimit,
            week_deadline: deadline.toISOString()
          })
          .eq('id', existingData.id);
        error = updateResult.error;
      } else {
        const insertResult = await supabase
          .from('user_weekly_data')
          .insert({
            user_id: userId,
            week_start: weekStart.toISOString(),
            week_deadline: deadline.toISOString(),
            mode: modeId,
            task_limit: baseTaskLimit
          });
        error = insertResult.error;
      }

      if (error) throw error;

      // Obtener información del usuario
      const { data: userData } = await supabase
        .from('users')
        .select('username, full_name')
        .eq('id', userId)
        .single();

      const userName = userData?.full_name || userData?.username || 'Usuario';

      // Obtener la fase actual
      const { data: config } = await supabase
        .from('system_config')
        .select('current_phase')
        .single();

      const currentPhase = config?.current_phase || 1;

      // Obtener todos los líderes de este usuario
      const { data: tasksWithLeaders } = await supabase
        .from('tasks')
        .select('leader_id')
        .eq('user_id', userId)
        .eq('phase', currentPhase)
        .not('leader_id', 'is', null);

      // Obtener IDs únicos de líderes
      const leaderIds = [...new Set(tasksWithLeaders?.map(t => t.leader_id).filter(Boolean) || [])];

      // Obtener modo anterior
      const oldMode = WORK_MODES.find(m => m.id === currentMode);

      // Crear notificaciones para cada líder
      if (leaderIds.length > 0 && oldMode?.id !== mode.id) {
        const alerts = leaderIds.map(leaderId => ({
          alert_type: 'mode_change',
          severity: 'important',
          title: '⚙️ Cambio de Modo de Trabajo',
          message: `${userName} cambió de ${oldMode?.label || 'modo anterior'} (×${oldMode?.multiplier || 1}) a ${mode.label} (×${mode.multiplier}). La carga de trabajo se ajustará proporcionalmente.`,
          source: 'tasks',
          category: 'workload',
          target_user_id: leaderId,
          actionable: false
        }));

        await supabase
          .from('smart_alerts')
          .insert(alerts);
      }

      toast.success('Modo de trabajo actualizado', {
        description: `Ahora trabajas en modo ${mode.label} (×${mode.multiplier})${leaderIds.length > 0 ? `. Se notificó a ${leaderIds.length} líder(es).` : ''}`
      });
      onModeChange();
    } catch (error) {
      console.error('Error updating work mode:', error);
      toast.error('Error al actualizar modo de trabajo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base md:text-lg">Modo de Trabajo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {WORK_MODES.map((mode) => (
            <Button
              key={mode.id}
              onClick={() => handleModeChange(mode.id)}
              variant={currentMode === mode.id ? 'default' : 'outline'}
              disabled={loading}
              className={`h-auto py-4 px-3 md:px-4 flex flex-col gap-2 ${
                currentMode === mode.id
                  ? 'bg-gradient-primary hover:opacity-90'
                  : ''
              }`}
            >
              <span className="text-2xl md:text-3xl">{mode.emoji}</span>
              <span className="font-semibold text-sm md:text-base">{mode.label}</span>
              <div className="text-xs opacity-80">
                <div className="font-bold text-base">×{mode.multiplier}</div>
                <div>{mode.description}</div>
              </div>
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          El multiplicador se aplica sobre el cálculo adaptativo de tareas basado en tu contexto empresarial.
        </p>
      </CardContent>
    </Card>
  );
};

export default WorkModeSelector;