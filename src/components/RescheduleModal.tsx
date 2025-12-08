import { useState, useEffect } from 'react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RescheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Record<string, unknown>;
  userId: string;
  weekStart: string;
  onRescheduleComplete: () => void;
}

interface AlternativeSlot {
  date: string;
  start: string;
  end: string;
  is_available: boolean;
  conflict_reason?: string;
}

const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const RescheduleModal = ({
  open,
  onOpenChange,
  task,
  userId,
  weekStart,
  onRescheduleComplete,
}: RescheduleModalProps) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStart, setSelectedStart] = useState('');
  const [selectedEnd, setSelectedEnd] = useState('');
  const [alternatives, setAlternatives] = useState<AlternativeSlot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedDate(task.scheduled_date);
      setSelectedStart(task.scheduled_start);
      setSelectedEnd(task.scheduled_end);
    }
  }, [open, task]);

  const calculateDurationForUI = (start: string, end: string): number => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  };

  const checkAlternatives = async () => {
    if (!selectedDate || !selectedStart || !selectedEnd) return;

    setChecking(true);
    try {
      // Si es tarea colaborativa, verificar disponibilidad del colaborador
      if (task.is_collaborative && task.collaborator_user_id) {
        const { data, error } = await supabase
          .from('task_schedule')
          .select('scheduled_date, scheduled_start, scheduled_end')
          .eq('user_id', task.collaborator_user_id)
          .eq('week_start', weekStart)
          .eq('scheduled_date', selectedDate);

        if (error) throw error;

        // Verificar si hay conflicto
        const hasConflict = data?.some(s => 
          timesOverlap(selectedStart, selectedEnd, s.scheduled_start, s.scheduled_end)
        );

        if (hasConflict) {
          // Sugerir alternativas
          const alts = await findAlternativeSlots();
          setAlternatives(alts);
          toast.warning('⚠️ El colaborador no está disponible en ese horario', {
            description: 'Revisa las alternativas sugeridas'
          });
        } else {
          setAlternatives([]);
        }
      }
    } catch (error) {
      console.error('Error checking alternatives:', error);
      toast.error('Error al verificar disponibilidad');
    } finally {
      setChecking(false);
    }
  };

  const calculateDuration = (start: string, end: string): number => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  };

  const findAlternativeSlots = async (): Promise<AlternativeSlot[]> => {
    try {
      const duration = calculateDuration(task.scheduled_start, task.scheduled_end);
      
      const { data, error } = await supabase.functions.invoke('find-alternative-slots', {
        body: {
          user_id: userId,
          collaborator_user_id: task.collaborator_user_id,
          week_start: weekStart,
          duration_hours: duration / 60,
          exclude_schedule_id: task.id,
        },
      });

      if (error) throw error;

      return data.alternatives || [];
    } catch (error) {
      console.error('Error finding alternatives:', error);
      toast.error('Error al buscar horarios alternativos');
      return [];
    }
  };

  const timesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
    const parseTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const s1 = parseTime(start1);
    const e1 = parseTime(end1);
    const s2 = parseTime(start2);
    const e2 = parseTime(end2);
    return s1 < e2 && e1 > s2;
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedStart || !selectedEnd) {
      toast.error('Selecciona fecha y horario');
      return;
    }

    setIsSubmitting(true);
    try {
      // Actualizar el schedule
      const { error } = await supabase
        .from('task_schedule')
        .update({
          scheduled_date: selectedDate,
          scheduled_start: selectedStart,
          scheduled_end: selectedEnd,
          status: task.is_collaborative ? 'rescheduling' : 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      if (error) throw error;

      // Si es colaborativa, actualizar también el schedule del colaborador
      if (task.is_collaborative && task.collaborator_user_id) {
        await supabase
          .from('task_schedule')
          .update({
            scheduled_date: selectedDate,
            scheduled_start: selectedStart,
            scheduled_end: selectedEnd,
            status: 'rescheduling',
            updated_at: new Date().toISOString(),
          })
          .eq('task_id', task.task_id)
          .eq('user_id', task.collaborator_user_id);

        // Crear alerta de cambio de horario
        await supabase.from('smart_alerts').insert({
          alert_type: 'schedule_change',
          severity: 'important',
          title: '📅 Cambio de Horario',
          message: `Se sugirió mover "${task.task.title}" a ${new Date(selectedDate).toLocaleDateString('es-ES')} ${selectedStart}`,
          source: 'tasks',
          category: 'schedule',
          target_user_id: task.collaborator_user_id,
          actionable: false
        });
      }

      toast.success('✅ Horario actualizado correctamente');
      onRescheduleComplete();
    } catch (error) {
      console.error('Error rescheduling:', error);
      toast.error('Error al actualizar horario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return DAYS_ES[date.getDay()];
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Sugerir Nuevo Horario"
      description={`Tarea: ${task.task.title}${task.is_collaborative && task.collaborator ? ` (con ${task.collaborator.full_name})` : ''}`}
      className="max-w-2xl"
    >

        <div className="space-y-6 py-4">
          {/* Horario actual */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">Horario actual:</p>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span>
                {getDayName(task.scheduled_date)} {new Date(task.scheduled_date).toLocaleDateString('es-ES')}
                {' '}{task.scheduled_start.substring(0, 5)} - {task.scheduled_end.substring(0, 5)}
              </span>
            </div>
          </div>

          {/* Nuevo horario */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Nuevo horario:</Label>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Fecha</Label>
                <Select value={selectedDate} onValueChange={setSelectedDate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 7 }).map((_, i) => {
                      const date = new Date(weekStart);
                      date.setDate(date.getDate() + i);
                      const dateStr = date.toISOString().split('T')[0];
                      return (
                        <SelectItem key={dateStr} value={dateStr}>
                          {getDayName(dateStr)} {date.getDate()}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Inicio</Label>
                <Select value={selectedStart} onValueChange={setSelectedStart}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }).map((_, i) => {
                      const hour = Math.floor(8 + i / 2);
                      const min = (i % 2) * 30;
                      const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
                      return (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Fin</Label>
                <Select value={selectedEnd} onValueChange={setSelectedEnd}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }).map((_, i) => {
                      const hour = Math.floor(8 + i / 2);
                      const min = (i % 2) * 30;
                      const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
                      return (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={checkAlternatives}
              disabled={checking}
              className="w-full"
            >
              {checking ? 'Verificando...' : '🔍 Verificar Disponibilidad'}
            </Button>
          </div>

          {/* Alternativas sugeridas */}
          {alternatives.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Alternativas sugeridas:</Label>
              {alternatives.map((alt, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    alt.is_available
                      ? 'hover:bg-success/5 hover:border-success'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (alt.is_available) {
                      setSelectedDate(alt.date);
                      setSelectedStart(alt.start);
                      setSelectedEnd(alt.end);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {getDayName(alt.date)} {alt.start} - {alt.end}
                      </span>
                    </div>
                    {alt.is_available ? (
                      <Badge className="bg-success">✅ Disponible</Badge>
                    ) : (
                      <Badge variant="destructive">❌ {alt.conflict_reason}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Warning si es colaborativa */}
          {task.is_collaborative && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-3">
                <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-medium mb-1">Tarea colaborativa</p>
                  <p>
                    El nuevo horario debe ser aprobado por {task.collaborator?.full_name}.
                    Se enviará una notificación automáticamente.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedDate || !selectedStart || !selectedEnd}
            className="flex-1 bg-gradient-primary"
          >
            {isSubmitting ? 'Guardando...' : '✅ Confirmar Cambio'}
          </Button>
        </div>
    </ResponsiveModal>
  );
};

export default RescheduleModal;
