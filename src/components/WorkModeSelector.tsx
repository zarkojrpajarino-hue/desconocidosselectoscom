import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

      // Get current week start and deadline
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysUntilWednesday = (3 - dayOfWeek + 7) % 7;
      const nextWednesday = new Date(now);
      nextWednesday.setDate(now.getDate() + daysUntilWednesday);
      nextWednesday.setHours(13, 30, 0, 0);

      const deadline = new Date(nextWednesday);
      deadline.setDate(deadline.getDate() + 7);
      deadline.setHours(10, 30, 0, 0);

      // Upsert user weekly data
      const { error } = await supabase
        .from('user_weekly_data')
        .upsert({
          user_id: userId,
          week_start: nextWednesday.toISOString(),
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
      <CardHeader>
        <CardTitle>Modo de Trabajo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {WORK_MODES.map((mode) => (
            <Button
              key={mode.id}
              onClick={() => handleModeChange(mode.id)}
              variant={currentMode === mode.id ? 'default' : 'outline'}
              disabled={loading}
              className={`h-auto py-4 flex flex-col gap-2 ${
                currentMode === mode.id
                  ? 'bg-gradient-primary hover:opacity-90'
                  : ''
              }`}
            >
              <span className="text-2xl">{mode.label.split(' ')[0]}</span>
              <span className="font-semibold">{mode.label.split(' ')[1]}</span>
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