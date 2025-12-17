import React, { useState, useEffect } from 'react';
import { format, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Settings, Plus, ChevronLeft, ChevronRight, RefreshCw, Globe, CalendarDays, Cog, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GlobalWeeklyView } from '@/components/agenda/GlobalWeeklyView';
import { GlobalAgendaSettings } from '@/components/agenda/GlobalAgendaSettings';
import { CreatePersonalTaskModal } from '@/components/agenda/CreatePersonalTaskModal';
import { AgendaFilters, AgendaStats } from '@/components/agenda/AgendaFilters';
import { GlobalAgendaLockedCard } from '@/components/plan/GlobalAgendaLockedCard';
import { WorkConfigReadOnly } from '@/components/agenda/WorkConfigReadOnly';
import AvailabilityQuestionnaire from '@/components/AvailabilityQuestionnaire';
import WeeklyAgenda from '@/components/WeeklyAgenda';
import GoogleCalendarConnect from '@/components/GoogleCalendarConnect';
import { useGlobalAgendaStats, useGenerateGlobalSchedule, type AgendaFilters as FiltersType } from '@/hooks/useGlobalAgenda';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentWeekStart, getCurrentWeekDeadline, getNextWednesdayStart } from '@/lib/weekUtils';

// Check if we're in the transition period (Wednesday 10:30 - 13:30)
const isInTransitionPeriod = (): boolean => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  if (dayOfWeek !== 3) return false; // Only on Wednesday
  
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  
  // Transition: 10:30 (630 min) to 13:30 (810 min)
  return currentTime >= 630 && currentTime < 810;
};

// Get the correct week start based on custom rules
const getCorrectWeekStart = (): string => {
  const weekStart = getCurrentWeekStart(new Date());
  return format(weekStart, 'yyyy-MM-dd');
};

export default function GlobalAgenda() {
  const { hasFeature } = usePlanAccess();
  const { user } = useAuth();
  const hasAccess = hasFeature('global_agenda');

  const [activeTab, setActiveTab] = useState('global');
  const [weekStart, setWeekStart] = useState(getCorrectWeekStart());
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [isTransition, setIsTransition] = useState(isInTransitionPeriod());
  const [activeFilters, setActiveFilters] = useState<FiltersType>({
    showPersonal: true,
    showOrganizational: true,
    selectedOrgs: [],
    status: 'all',
    collaborative: 'all',
  });

  // Update transition state every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransition(isInTransitionPeriod());
      // Also update week start if transition ended
      if (!isInTransitionPeriod()) {
        setWeekStart(getCorrectWeekStart());
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Check if user has availability for this week
  const { data: availability, isLoading: availabilityLoading, refetch: refetchAvailability } = useQuery({
    queryKey: ['user-availability', user?.id, weekStart],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_weekly_availability')
        .select('id, submitted_at')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && hasAccess,
  });

  const { data: stats } = useGlobalAgendaStats(weekStart);
  const generateSchedule = useGenerateGlobalSchedule();

  const goToPreviousWeek = () => {
    const prev = subWeeks(new Date(weekStart), 1);
    setWeekStart(format(prev, 'yyyy-MM-dd'));
  };

  const goToNextWeek = () => {
    const next = addWeeks(new Date(weekStart), 1);
    setWeekStart(format(next, 'yyyy-MM-dd'));
  };

  const goToCurrentWeek = () => {
    setWeekStart(getCorrectWeekStart());
  };

  const handleRegenerate = () => {
    generateSchedule.mutate({ weekStart, forceRegenerate: true });
  };

  const handleAvailabilityComplete = async () => {
    await refetchAvailability();
    // Auto-generate schedule after availability is set
    generateSchedule.mutate({ weekStart, forceRegenerate: true });
  };

  // Show locked card if user doesn't have access
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 pb-20">
        <GlobalAgendaLockedCard />
      </div>
    );
  }

  // Show availability questionnaire if not set for this week (only if not in transition)
  if (!isTransition && !availabilityLoading && !availability && user?.id) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 pb-20">
        <AvailabilityQuestionnaire
          userId={user.id}
          weekStart={weekStart}
          onComplete={handleAvailabilityComplete}
        />
      </div>
    );
  }

  // Show transition message if between weeks (Wednesday 10:30 - 13:30)
  if (isTransition) {
    const nextWeekStart = getNextWednesdayStart();
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 pb-20 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              La semana ha terminado
            </h2>
            <p className="text-muted-foreground">
              La nueva semana comienza hoy a las 13:30.
            </p>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Próxima semana: <span className="font-medium text-foreground">{format(nextWeekStart, "d 'de' MMMM", { locale: es })}</span>
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Podrás configurar tu disponibilidad cuando comience la nueva semana.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6 pb-20">
      {/* Header - Only show full controls in Agenda Global tab */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <Calendar className="w-7 h-7 text-primary" />
            Mi Agenda
          </h1>
          <p className="text-muted-foreground mt-1">
            {activeTab === 'global' 
              ? 'Gestiona tu agenda global de todas tus organizaciones'
              : activeTab === 'weekly'
              ? 'Vista semanal de tus tareas'
              : 'Configuración de trabajo (solo lectura)'
            }
          </p>
        </div>

        {/* Buttons only visible in Agenda Global tab */}
        {activeTab === 'global' && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={handleRegenerate}
              variant="outline"
              size="sm"
              disabled={generateSchedule.isPending}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${generateSchedule.isPending ? 'animate-spin' : ''}`} />
              Regenerar
            </Button>

            <Button onClick={() => setShowCreateTask(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Tarea Personal
            </Button>

            <Sheet open={showSettings} onOpenChange={setShowSettings}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:w-[500px] overflow-y-auto">
                <GlobalAgendaSettings onClose={() => setShowSettings(false)} />
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>

      {/* Google Calendar Connect - Always visible */}
      {user && <GoogleCalendarConnect userId={user.id} />}

      {/* Stats - Only in Agenda Global tab */}
      {activeTab === 'global' && stats && <AgendaStats stats={stats} />}

      {/* Navigation + Filters - Only in Agenda Global tab */}
      {activeTab === 'global' && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="text-center min-w-[180px]">
              <div className="text-xs text-muted-foreground">Semana del</div>
              <div className="text-lg font-semibold text-foreground">
                {format(new Date(weekStart), "d 'de' MMMM", { locale: es })}
              </div>
            </div>

            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>

            <Button variant="ghost" size="sm" onClick={goToCurrentWeek}>
              Hoy
            </Button>
          </div>

          <AgendaFilters filters={activeFilters} onFiltersChange={setActiveFilters} />
        </div>
      )}

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            <span className="hidden sm:inline">Agenda</span> Semanal
          </TabsTrigger>
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Agenda</span> Global
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Cog className="w-4 h-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          {user?.id && (
            <WeeklyAgenda
              userId={user.id}
              weekStart={weekStart}
              isLocked={false}
            />
          )}
        </TabsContent>

        <TabsContent value="global">
          <GlobalWeeklyView weekStart={weekStart} filters={activeFilters} />
        </TabsContent>

        <TabsContent value="config">
          <WorkConfigReadOnly />
        </TabsContent>
      </Tabs>

      {/* Modal */}
      <CreatePersonalTaskModal
        open={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        weekStart={weekStart}
      />
    </div>
  );
}
