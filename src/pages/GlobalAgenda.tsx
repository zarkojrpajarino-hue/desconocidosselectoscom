import React, { useState } from 'react';
import { format, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Settings, Plus, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { GlobalWeeklyView } from '@/components/agenda/GlobalWeeklyView';
import { GlobalAgendaSettings } from '@/components/agenda/GlobalAgendaSettings';
import { CreatePersonalTaskModal } from '@/components/agenda/CreatePersonalTaskModal';
import { AgendaFilters, AgendaStats } from '@/components/agenda/AgendaFilters';
import { useGlobalAgendaStats, useGenerateGlobalSchedule, type AgendaFilters as FiltersType } from '@/hooks/useGlobalAgenda';

export default function GlobalAgenda() {
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <Calendar className="w-7 h-7 text-primary" />
            Agenda Global
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tareas de todas tus organizaciones + personales
          </p>
        </div>

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
      </div>

      {/* Stats */}
      {stats && <AgendaStats stats={stats} />}

      {/* Navigation + Filters */}
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

      {/* Main Content */}
      <Tabs defaultValue="week" className="space-y-6">
        <TabsList>
          <TabsTrigger value="week">
            <Calendar className="w-4 h-4 mr-2" />
            Vista Semanal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="week">
          <GlobalWeeklyView weekStart={weekStart} filters={activeFilters} />
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
