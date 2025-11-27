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

const WORK_MODES = [
  { id: 'conservador', label: '🐢 Conservador', tasks: 5, hours: '2-3h' },
  { id: 'moderado', label: '🚶 Moderado', tasks: 8, hours: '4-5h' },
  { id: 'agresivo', label: '🚀 Agresivo', tasks: 12, hours: '6-8h' },
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

      // Upsert user weekly data
      const { error } = await supabase
        .from('user_weekly_data')
        .upsert({
          user_id: userId,
          week_start: weekStart.toISOString(),
          week_deadline: deadline.toISOString(),
          mode: modeId,
          task_limit: mode.tasks
        }, {
          onConflict: 'user_id,week_start'
        });

      if (error) throw error;

      toast.success('Modo de trabajo actualizado', {
        description: `Ahora trabajas en modo ${mode.label}`
      });
      onModeChange();
    } catch (error) {
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
              <span className="text-2xl md:text-3xl">{mode.label.split(' ')[0]}</span>
              <span className="font-semibold text-sm md:text-base">{mode.label.split(' ')[1]}</span>
              <div className="text-xs opacity-80">
                <div>{mode.tasks} tareas/semana</div>
                <div>{mode.hours}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkModeSelector;