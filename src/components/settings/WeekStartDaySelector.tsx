import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const DAYS_OF_WEEK = [
  { value: '0', label: 'Domingo' },
  { value: '1', label: 'Lunes' },
  { value: '2', label: 'Martes' },
  { value: '3', label: 'Miércoles' },
  { value: '4', label: 'Jueves' },
  { value: '5', label: 'Viernes' },
  { value: '6', label: 'Sábado' },
];

export const WeekStartDaySelector = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState<string>('1');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPreference = async () => {
      if (!user?.id) return;
      
      try {
        const { data } = await supabase
          .from('user_global_agenda_settings')
          .select('preferred_week_start_day')
          .eq('user_id', user.id)
          .single();
        
        if (data?.preferred_week_start_day !== null && data?.preferred_week_start_day !== undefined) {
          setSelectedDay(String(data.preferred_week_start_day));
        }
      } catch {
        // Settings may not exist yet, use default
      } finally {
        setLoading(false);
      }
    };

    fetchPreference();
  }, [user?.id]);

  const handleDayChange = async (value: string) => {
    if (!user?.id) return;
    
    setSaving(true);
    const dayNumber = parseInt(value);
    
    try {
      // Upsert user settings
      const { error } = await supabase
        .from('user_global_agenda_settings')
        .upsert({
          user_id: user.id,
          preferred_week_start_day: dayNumber,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      
      setSelectedDay(value);
      toast.success('Día de inicio de semana actualizado');
    } catch (error) {
      console.error('Error saving week start preference:', error);
      toast.error('Error al guardar la preferencia');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="h-24" />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Inicio de Semana</CardTitle>
        </div>
        <CardDescription>
          Configura qué día comienza tu semana laboral. Esto afecta cómo se calculan tus OKRs y tareas semanales.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="week-start-day">Mi semana empieza el</Label>
          <Select 
            value={selectedDay} 
            onValueChange={handleDayChange}
            disabled={saving}
          >
            <SelectTrigger id="week-start-day" className="w-full md:w-[200px]">
              <SelectValue placeholder="Selecciona un día" />
            </SelectTrigger>
            <SelectContent>
              {DAYS_OF_WEEK.map((day) => (
                <SelectItem key={day.value} value={day.value}>
                  <div className="flex items-center gap-2">
                    {day.label}
                    {day.value === selectedDay && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            Actualmente tu semana empieza el {DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label || 'Lunes'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
