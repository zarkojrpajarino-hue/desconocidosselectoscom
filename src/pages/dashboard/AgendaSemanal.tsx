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
import { SectionTourButton } from '@/components/SectionTourButton';
import { logger } from '@/lib/logger';

const AgendaSemanal = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [nextWeekStart, setNextWeekStart] = useState<string>('');
  const [hasAvailability, setHasAvailability] = useState<boolean | null>(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduleKey, setScheduleKey] = useState(0);
  const [allUsersReady, setAllUsersReady] = useState<boolean | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<'filling' | 'reviewing' | 'active'>('filling');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    calculateNextWeekStart();
    determinePeriod();
  }, []);

  useEffect(() => {
    if (user && nextWeekStart) {
      checkAvailability();
      checkWeekStatus();
    }
  }, [user, nextWeekStart]);

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

  const determinePeriod = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=domingo, 1=lunes, 3=miércoles
    const currentTime = now.getHours() * 100 + now.getMinutes();

    // PERÍODO 1: RELLENAR DISPONIBILIDAD (Miércoles 13:30 → Lunes 13:30)
    if (dayOfWeek === 3 && currentTime >= 1330) {
      // Miércoles después de las 13:30
      setCurrentPeriod('filling');
    } else if (dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) {
      // Jueves, Viernes, Sábado, Domingo
      setCurrentPeriod('filling');
    } else if (dayOfWeek === 1 && currentTime < 1330) {
      // Lunes antes de las 13:30
      setCurrentPeriod('filling');
    } 
    // PERÍODO 2: REVISIÓN Y AJUSTES (Lunes 13:30 → Miércoles 13:29)
    else if (dayOfWeek === 1 && currentTime >= 1330) {
      // Lunes después de las 13:30
      setCurrentPeriod('reviewing');
    } else if (dayOfWeek === 2) {
      // Martes (todo el día)
      setCurrentPeriod('reviewing');
    } else if (dayOfWeek === 3 && currentTime < 1330) {
      // Miércoles antes de las 13:30
      setCurrentPeriod('reviewing');
    }
    // PERÍODO 3: SEMANA ACTIVA (Miércoles 13:30 → siguiente Miércoles 10:30)
    // Este período se maneja en WeeklyAgenda con isLocked
  };

  const checkAvailability = async () => {
    if (!user || !nextWeekStart) return;
    
    try {
      const { data, error } = await supabase
        .from('user_weekly_availability')
        .select('id')
        .eq('user_id', user.id)
        .eq('week_start', nextWeekStart)
        .maybeSingle();
      
      if (error) throw error;
      setHasAvailability(!!data);
      logger.debug('Availability check:', { hasData: !!data, weekStart: nextWeekStart });
    } catch (error) {
      logger.error('Error checking availability:', error);
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
      
      setScheduleKey(prev => prev + 1);
    } catch (error) {
      logger.error('Error generating schedules:', error);
      toast.error('Error al generar agenda', {
        description: 'Intenta nuevamente'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateNextWeekStart = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const currentTime = today.getHours() * 100 + today.getMinutes();
    
    // Calcular el próximo miércoles 13:30 (inicio de semana)
    let daysUntilWednesday = (3 - dayOfWeek + 7) % 7;
    
    // Si hoy es miércoles
    if (dayOfWeek === 3) {
      if (currentTime < 1330) {
        // Antes de las 13:30 → semana actual (este miércoles)
        daysUntilWednesday = 0;
      } else {
        // Después de las 13:30 → siguiente semana (próximo miércoles)
        daysUntilWednesday = 7;
      }
    } else if (dayOfWeek > 3) {
      // Jueves-Sábado → siguiente miércoles
      daysUntilWednesday = 7 - dayOfWeek + 3;
    }
    // Domingo-Martes → siguiente miércoles (ya calculado con la fórmula inicial)
    
    const nextWed = new Date(today);
    nextWed.setDate(today.getDate() + daysUntilWednesday);
    nextWed.setHours(13, 30, 0, 0);
    
    const weekStartStr = nextWed.toISOString().split('T')[0];
    setNextWeekStart(weekStartStr);
    logger.debug('Next week start calculated:', weekStartStr, 'Days until:', daysUntilWednesday);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p>Cargando...</p>
      </div>
    );
  }

  // MOSTRAR PANTALLA SEGÚN ESTADO Y PERÍODO
  const renderContent = () => {
    // CASO 1: Usuario sin disponibilidad en período de RELLENADO
    if (!hasAvailability && currentPeriod === 'filling' && !showQuestionnaire) {
      return (
        <div className="text-center py-12 space-y-4">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-warning" />
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              ⏰ Rellena tu disponibilidad para generar agenda
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Para generar tu agenda semanal, primero necesitas rellenar tus horarios disponibles.
              El plazo finaliza el <strong>Lunes a las 13:30</strong>.
            </p>
          </div>
          <Button
            onClick={() => setShowQuestionnaire(true)}
            className="bg-gradient-primary"
            size="lg"
          >
            📅 Rellenar Disponibilidad
          </Button>
        </div>
      );
    }

    // CASO 2: Usuario rellenando cuestionario
    if (showQuestionnaire) {
      return (
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
            setScheduleKey(prev => prev + 1);
          }}
        />
      );
    }

    // CASO 3: Usuario con disponibilidad, esperando generación (antes de Lunes 13:30)
    if (hasAvailability && currentPeriod === 'filling') {
      return allUsersReady === false ? (
        <WeeklySchedulePreview
          userId={user!.id}
          weekStart={nextWeekStart}
          onSuggestChange={() => {
            toast.info('Funcionalidad de sugerencias en desarrollo');
          }}
        />
      ) : (
        <div className="text-center py-12 space-y-4">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-primary" />
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              ✅ Disponibilidad registrada
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Tu agenda se generará automáticamente el <strong>Lunes a las 13:01</strong>.
              Te notificaremos cuando esté lista para revisar.
            </p>
          </div>
        </div>
      );
    }

    // CASO 4: Período de revisión (Lunes 13:30 - Miércoles 13:29) o semana activa
    if (hasAvailability && (currentPeriod === 'reviewing' || currentPeriod === 'active')) {
      const isLocked = currentPeriod === 'active';
      
      return (
        <WeeklyAgenda
          key={scheduleKey}
          userId={user!.id}
          weekStart={nextWeekStart}
          isLocked={isLocked}
        />
      );
    }

    // CASO 5: Estado de carga
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">Cargando agenda...</p>
      </div>
    );
  };

  return (
    <Card className="shadow-card bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/10 dark:to-blue-950/10">
      <CardHeader className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Calendar className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
              <span className="truncate">📅 Agenda Semanal</span>
            </CardTitle>
            <CardDescription className="text-xs md:text-sm mt-1">
              {currentPeriod === 'filling' && 'Disponibilidad: hasta Lun 13:30'}
              {currentPeriod === 'reviewing' && 'Revisión: hasta Mié 13:29'}
              {currentPeriod === 'active' && 'Semana activa - Bloqueada'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <SectionTourButton sectionId="agenda" variant="ghost" size="sm" className="h-8 w-8 md:h-9 md:w-auto md:px-3" />
            {hasAvailability && currentPeriod === 'reviewing' && (
              <Button
                onClick={handleGenerateSchedules}
                disabled={isGenerating}
                size="sm"
                className="bg-gradient-primary gap-1 md:gap-2 h-8 md:h-9 text-xs md:text-sm"
              >
                <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">{isGenerating ? 'Regenerando...' : 'Regenerar'}</span>
                <span className="md:hidden">{isGenerating ? '...' : 'Regen.'}</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
        {hasAvailability === null ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Cargando agenda...</p>
          </div>
        ) : (
          renderContent()
        )}
      </CardContent>
    </Card>
  );
};

export default AgendaSemanal;