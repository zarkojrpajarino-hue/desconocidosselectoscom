import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import WeeklyAgenda from '@/components/WeeklyAgenda';
import AvailabilityQuestionnaire from '@/components/AvailabilityQuestionnaire';
import WeeklySchedulePreview from '@/components/WeeklySchedulePreview';
import AvailabilityBlockScreen from '@/components/AvailabilityBlockScreen';
import { toast } from 'sonner';

const AgendaSemanal = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isWeekLocked, setIsWeekLocked] = useState(false);
  const [nextWeekStart, setNextWeekStart] = useState<string>('');
  const [hasAvailability, setHasAvailability] = useState<boolean | null>(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduleKey, setScheduleKey] = useState(0);
  const [allUsersReady, setAllUsersReady] = useState<boolean | null>(null);
  const [isAfterDeadline, setIsAfterDeadline] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      calculateNextWeekStart();
      checkAvailability();
      checkWeekStatus();
      checkDeadline();
    }
  }, [user]);

  const checkWeekStatus = async () => {
    if (!nextWeekStart) return;

    try {
      const { data: weekConfig } = await supabase
        .from('week_config')
        .select('all_users_ready')
        .eq('week_start', nextWeekStart)
        .maybeSingle();

      setAllUsersReady(weekConfig?.all_users_ready || false);
    } catch (error) {
      console.error('Error checking week status:', error);
    }
  };

  const checkDeadline = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    // Verificar si es después del deadline (lunes 13:00)
    if (dayOfWeek === 1 && currentTime >= 1300) {
      setIsAfterDeadline(true);
    } else if (dayOfWeek > 1) {
      setIsAfterDeadline(true);
    }
  };

  const checkAvailability = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_weekly_availability')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      setHasAvailability(!!data);
    } catch (error) {
      console.error('Error checking availability:', error);
      setHasAvailability(false);
    }
  };

  const handleGenerateSchedules = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-weekly-schedules');
      
      if (error) throw error;
      
      toast.success('✅ Agenda generada exitosamente', {
        description: 'Tu agenda semanal ha sido creada'
      });
      
      // Forzar recarga del componente WeeklyAgenda
      setScheduleKey(prev => prev + 1);
    } catch (error: any) {
      console.error('Error generating schedules:', error);
      toast.error('Error al generar agenda', {
        description: error.message || 'Intenta nuevamente'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateNextWeekStart = () => {
    // Calcular próximo miércoles
    const today = new Date();
    const dayOfWeek = today.getDay();
    let daysUntilWednesday = (3 - dayOfWeek + 7) % 7;
    
    // Si hoy es miércoles y ya pasó la 13:30, siguiente miércoles
    if (dayOfWeek === 3 && today.getHours() >= 13 && today.getMinutes() >= 30) {
      daysUntilWednesday = 7;
    }
    
    const nextWed = new Date(today);
    nextWed.setDate(today.getDate() + daysUntilWednesday);
    nextWed.setHours(13, 30, 0, 0);
    
    setNextWeekStart(nextWed.toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <Card className="shadow-card bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/10 dark:to-blue-950/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              📅 Agenda Semanal
            </CardTitle>
            <CardDescription>
              Agenda generada automáticamente según tu disponibilidad y coordinada con tu equipo
            </CardDescription>
          </div>
          {hasAvailability && (
            <Button
              onClick={handleGenerateSchedules}
              disabled={isGenerating}
              className="bg-gradient-primary gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generando...' : 'Generar Agenda'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hasAvailability === null ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Cargando agenda...</p>
          </div>
        ) : !hasAvailability && !showQuestionnaire ? (
          isAfterDeadline ? (
            <AvailabilityBlockScreen
              deadlineDate={new Date(nextWeekStart + 'T13:00:00')}
              onConfigure={() => setShowQuestionnaire(true)}
            />
          ) : (
            <div className="text-center py-12 space-y-4">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-warning" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
                  Configura tu disponibilidad
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Para generar tu agenda semanal, primero necesitas configurar tus horarios disponibles.
                  Esto permitirá al sistema coordinar tus tareas con el resto del equipo.
                </p>
              </div>
              <Button
                onClick={() => setShowQuestionnaire(true)}
                className="bg-gradient-primary"
                size="lg"
              >
                📅 Configurar Disponibilidad
              </Button>
            </div>
          )
        ) : showQuestionnaire ? (
          <AvailabilityQuestionnaire
            userId={user!.id}
            weekStart={nextWeekStart}
            onComplete={() => {
              setShowQuestionnaire(false);
              setHasAvailability(true);
              toast.success('✅ Disponibilidad guardada', {
                description: 'Tu preview se generará automáticamente'
              });
              checkWeekStatus();
            }}
          />
        ) : allUsersReady === false && nextWeekStart ? (
          <WeeklySchedulePreview
            userId={user!.id}
            weekStart={nextWeekStart}
            onSuggestChange={() => {
              toast.info('Funcionalidad de sugerencias en desarrollo');
            }}
          />
        ) : nextWeekStart ? (
          <WeeklyAgenda
            key={scheduleKey}
            userId={user!.id}
            weekStart={nextWeekStart}
            isLocked={isWeekLocked}
          />
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Cargando agenda...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgendaSemanal;
