import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Settings, Plus, ChevronLeft, ChevronRight, RefreshCw, Globe, CalendarDays, Cog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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

export default function GlobalAgenda() {
  const { hasFeature } = usePlanAccess();
  const { user } = useAuth();
  const hasAccess = hasFeature('global_agenda');

  const [activeTab, setActiveTab] = useState('global');
  const [weekStart, setWeekStart] = useState(
    format(startOfWeek(new Date(), { weekStartsOn: 3 }), 'yyyy-MM-dd')
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FiltersType>({
    showPersonal: true,
    showOrganizational: true,
    selectedOrgs: [],
    status: 'all',
    collaborative: 'all',
  });

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
    setWeekStart(format(startOfWeek(prev, { weekStartsOn: 3 }), 'yyyy-MM-dd'));
  };

  const goToNextWeek = () => {
    const next = addWeeks(new Date(weekStart), 1);
    setWeekStart(format(startOfWeek(next, { weekStartsOn: 3 }), 'yyyy-MM-dd'));
  };

  const goToCurrentWeek = () => {
    setWeekStart(format(startOfWeek(new Date(), { weekStartsOn: 3 }), 'yyyy-MM-dd'));
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

  // Show availability questionnaire if not set for this week
  if (!availabilityLoading && !availability && user?.id) {
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
