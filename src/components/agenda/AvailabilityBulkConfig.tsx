import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Clock, Calendar, ChevronDown, Settings2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PhaseWeekSelector } from './PhaseWeekSelector';
import { format, addWeeks, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface DayAvailability {
  available: boolean;
  start: string;
  end: string;
}

interface PhaseWeek {
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  taskCount: number;
  hasAvailability: boolean;
}

interface AvailabilityBulkConfigProps {
  userId: string;
  phaseWeeks: PhaseWeek[];
  currentWeekStart: string;
  onComplete: () => void;
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

export function AvailabilityBulkConfig({ 
  userId, 
  phaseWeeks, 
  currentWeekStart,
  onComplete 
}: AvailabilityBulkConfigProps) {
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([]);
  const [availability, setAvailability] = useState<Record<string, DayAvailability>>({});
  const [hoursPerDay, setHoursPerDay] = useState<number>(4);
  const [preferredTime, setPreferredTime] = useState<string>('flexible');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWeekSelector, setShowWeekSelector] = useState(false);

  // Find current week number
  const currentWeekNumber = phaseWeeks.find(w => w.weekStart === currentWeekStart)?.weekNumber || 1;

  useEffect(() => {
    // Initialize availability
    const initial: Record<string, DayAvailability> = {};
    DAYS.forEach(day => {
      initial[day.key] = { available: false, start: '09:00', end: '18:00' };
    });
    setAvailability(initial);
    
    // Initialize selected weeks empty (user must select)
    setSelectedWeeks([]);
  }, [phaseWeeks]);

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

  const saveForWeeks = async (weeksToSave: PhaseWeek[]) => {
    const hasAnyDay = Object.values(availability).some(day => day.available);
    if (!hasAnyDay) {
      toast.error('Debes seleccionar al menos un día disponible');
      return;
    }

    if (weeksToSave.length === 0) {
      toast.error('Debes seleccionar al menos una semana');
      return;
    }

    setIsSubmitting(true);
    try {
      // Save availability for each selected week
      for (const week of weeksToSave) {
        const data = {
          user_id: userId,
          week_start: week.weekStart,
          preferred_hours_per_day: hoursPerDay,
          preferred_time_of_day: preferredTime,
          submitted_at: new Date().toISOString(),
          monday_available: availability.monday.available,
          monday_start: availability.monday.available ? availability.monday.start : null,
          monday_end: availability.monday.available ? availability.monday.end : null,
          tuesday_available: availability.tuesday.available,
          tuesday_start: availability.tuesday.available ? availability.tuesday.start : null,
          tuesday_end: availability.tuesday.available ? availability.tuesday.end : null,
          wednesday_available: availability.wednesday.available,
          wednesday_start: availability.wednesday.available ? availability.wednesday.start : null,
          wednesday_end: availability.wednesday.available ? availability.wednesday.end : null,
          thursday_available: availability.thursday.available,
          thursday_start: availability.thursday.available ? availability.thursday.start : null,
          thursday_end: availability.thursday.available ? availability.thursday.end : null,
          friday_available: availability.friday.available,
          friday_start: availability.friday.available ? availability.friday.start : null,
          friday_end: availability.friday.available ? availability.friday.end : null,
          saturday_available: availability.saturday.available,
          saturday_start: availability.saturday.available ? availability.saturday.start : null,
          saturday_end: availability.saturday.available ? availability.saturday.end : null,
          sunday_available: availability.sunday.available,
          sunday_start: availability.sunday.available ? availability.sunday.start : null,
          sunday_end: availability.sunday.available ? availability.sunday.end : null,
        };

        const { error } = await supabase
          .from('user_weekly_availability')
          .upsert(data, { onConflict: 'user_id,week_start' });

        if (error) throw error;
      }

      toast.success(`✅ Disponibilidad guardada para ${weeksToSave.length} semana(s)`, {
        description: 'Tu agenda se ha actualizado'
      });

      onComplete();
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Error al guardar disponibilidad');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCurrentWeek = () => {
    const currentWeek = phaseWeeks.find(w => w.weekStart === currentWeekStart);
    if (currentWeek) {
      saveForWeeks([currentWeek]);
    }
  };

  const handleSaveSelectedWeeks = () => {
    const weeksToSave = phaseWeeks.filter(w => selectedWeeks.includes(w.weekNumber));
    saveForWeeks(weeksToSave);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="w-6 h-6" />
          Configurar Disponibilidad
        </CardTitle>
        <CardDescription>
          Configura tu disponibilidad para la semana {currentWeekNumber} o aplícala a más semanas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Day availability */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">¿Qué días puedes trabajar?</h3>
          {DAYS.map(day => (
            <div key={day.key} className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`bulk-${day.key}`}
                    checked={availability[day.key]?.available || false}
                    onCheckedChange={() => toggleDay(day.key)}
                  />
                  <Label htmlFor={`bulk-${day.key}`} className="text-base font-medium cursor-pointer">
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

        {/* Hours per day */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            ¿Cuántas horas al día puedes dedicar?
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

        {/* Time preference */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            ¿Prefieres trabajar en...?
          </Label>
          <RadioGroup value={preferredTime} onValueChange={setPreferredTime}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="morning" id="bulk-morning" />
              <Label htmlFor="bulk-morning" className="cursor-pointer">🌅 Mañanas</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="afternoon" id="bulk-afternoon" />
              <Label htmlFor="bulk-afternoon" className="cursor-pointer">☀️ Tardes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="evening" id="bulk-evening" />
              <Label htmlFor="bulk-evening" className="cursor-pointer">🌙 Noches</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="flexible" id="bulk-flexible" />
              <Label htmlFor="bulk-flexible" className="cursor-pointer">🔄 Flexible</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Submit buttons - Two separate buttons */}
        <div className="space-y-4 pt-4 border-t border-border">
          {/* Save for current week only */}
          <Button
            onClick={handleSaveCurrentWeek}
            disabled={isSubmitting}
            className="w-full h-12"
          >
            {isSubmitting ? 'Guardando...' : `✅ Guardar solo para esta semana (Semana ${currentWeekNumber})`}
          </Button>

          {/* Save for more weeks - Collapsible */}
          <Collapsible open={showWeekSelector} onOpenChange={setShowWeekSelector}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full h-12 justify-between">
                <span>📅 Guardar para más semanas</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showWeekSelector ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-3">
                  Selecciona las semanas en las que quieres aplicar esta disponibilidad:
                </p>
                <PhaseWeekSelector
                  weeks={phaseWeeks}
                  selectedWeeks={selectedWeeks}
                  onSelectionChange={setSelectedWeeks}
                  mode="multiple"
                />
              </div>
              
              <Button
                onClick={handleSaveSelectedWeeks}
                disabled={isSubmitting || selectedWeeks.length === 0}
                className="w-full h-12"
                variant="default"
              >
                {isSubmitting 
                  ? 'Guardando...' 
                  : `✅ Guardar para ${selectedWeeks.length} semana(s) seleccionada(s)`
                }
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
}
