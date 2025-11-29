import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AvailabilityQuestionnaireProps {
  userId: string;
  weekStart: string;
  onComplete: () => void;
}

interface DayAvailability {
  available: boolean;
  start: string;
  end: string;
}

const DAYS = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

const TIME_OPTIONS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00'
];

const AvailabilityQuestionnaire = ({ userId, weekStart, onComplete }: AvailabilityQuestionnaireProps) => {
  const [availability, setAvailability] = useState<Record<string, DayAvailability>>({});
  const [hoursPerDay, setHoursPerDay] = useState<number>(4);
  const [preferredTime, setPreferredTime] = useState<string>('flexible');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Inicializar availability
    const initial: Record<string, DayAvailability> = {};
    DAYS.forEach(day => {
      initial[day.key] = { available: false, start: '09:00', end: '18:00' };
    });
    setAvailability(initial);
  }, []);

  const toggleDay = (dayKey: string) => {
    setAvailability(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        available: !prev[dayKey].available
      }
    }));
  };

  const updateDayTime = (dayKey: string, field: 'start' | 'end', value: string) => {
    setAvailability(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    // Validar que al menos un día esté disponible
    const hasAnyDay = Object.values(availability).some(day => day.available);
    if (!hasAnyDay) {
      toast.error('Debes seleccionar al menos un día disponible');
      return;
    }

    setIsSubmitting(true);
    try {
      const data: any = {
        user_id: userId,
        week_start: weekStart,
        preferred_hours_per_day: hoursPerDay,
        preferred_time_of_day: preferredTime,
        submitted_at: new Date().toISOString(),
      };

      // Agregar disponibilidad por día
      DAYS.forEach(day => {
        const dayData = availability[day.key];
        data[`${day.key}_available`] = dayData.available;
        if (dayData.available) {
          data[`${day.key}_start`] = dayData.start;
          data[`${day.key}_end`] = dayData.end;
        }
      });

      const { error } = await supabase
        .from('user_weekly_availability')
        .upsert(data, { onConflict: 'user_id,week_start' });

      if (error) throw error;

      // Generar preview automáticamente después de guardar
      try {
        await supabase.functions.invoke('generate-preview-schedule', {
          body: { userId, weekStart }
        });
      } catch (previewError) {
        console.error('Error generando preview:', previewError);
        // No bloqueamos el flujo si falla el preview
      }

      toast.success('✅ Disponibilidad guardada correctamente', {
        description: 'Tu preview se está generando...'
      });

      onComplete();
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Error al guardar disponibilidad');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Configura tu Disponibilidad Semanal
        </CardTitle>
        <CardDescription>
          Semana del {new Date(weekStart).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
          {' '}- La IA generará tu agenda coordinada automáticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Disponibilidad por día */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">¿Qué días puedes trabajar?</h3>
          {DAYS.map(day => (
            <div key={day.key} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={day.key}
                    checked={availability[day.key]?.available || false}
                    onCheckedChange={() => toggleDay(day.key)}
                  />
                  <Label htmlFor={day.key} className="text-base font-medium cursor-pointer">
                    {day.label}
                  </Label>
                </div>
              </div>

              {availability[day.key]?.available && (
                <div className="flex items-center gap-4 ml-8">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <Select
                      value={availability[day.key].start}
                      onValueChange={(value) => updateDayTime(day.key, 'start', value)}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <span className="text-muted-foreground">a</span>

                  <Select
                    value={availability[day.key].end}
                    onValueChange={(value) => updateDayTime(day.key, 'end', value)}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Horas por día */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            ¿Cuántas horas al día puedes dedicar a las tareas?
          </Label>
          <Select value={hoursPerDay.toString()} onValueChange={(v) => setHoursPerDay(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2, 3, 4, 5, 6, 7, 8].map(h => (
                <SelectItem key={h} value={h.toString()}>{h} horas</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Preferencia de horario */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            ¿Prefieres trabajar en...?
          </Label>
          <RadioGroup value={preferredTime} onValueChange={setPreferredTime}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="morning" id="morning" />
              <Label htmlFor="morning" className="cursor-pointer">🌅 Mañanas (9:00-14:00)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="afternoon" id="afternoon" />
              <Label htmlFor="afternoon" className="cursor-pointer">☀️ Tardes (14:00-19:00)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="evening" id="evening" />
              <Label htmlFor="evening" className="cursor-pointer">🌙 Noches (19:00-22:00)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="flexible" id="flexible" />
              <Label htmlFor="flexible" className="cursor-pointer">🔄 Flexible (cualquier horario)</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Info importante */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100 space-y-1">
              <p className="font-medium">ℹ️ Importante:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Tu agenda se generará <strong>automáticamente el Lunes a las 13:01</strong></li>
                <li>Las tareas colaborativas se coordinarán con tus compañeros</li>
                <li>Podrás revisar y ajustar la agenda entre Lunes 13:30 y Miércoles 13:29</li>
                <li>La semana comenzará oficialmente el <strong>Miércoles a las 13:30</strong></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botón submit */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-gradient-primary h-12 text-lg"
        >
          {isSubmitting ? 'Guardando...' : '✅ Guardar Disponibilidad'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AvailabilityQuestionnaire;
