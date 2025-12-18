import React, { useState } from 'react';
import { Calendar, Settings, RefreshCw, Cog, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GlobalAgendaSettings } from '@/components/agenda/GlobalAgendaSettings';
import { CreatePersonalTaskModal } from '@/components/agenda/CreatePersonalTaskModal';
import { GlobalAgendaLockedCard } from '@/components/plan/GlobalAgendaLockedCard';
import { WorkConfigReadOnly } from '@/components/agenda/WorkConfigReadOnly';
import { ProfessionalAgendaView } from '@/components/agenda/ProfessionalAgendaView';
import GoogleCalendarConnect from '@/components/GoogleCalendarConnect';
import { useGenerateGlobalSchedule, type AgendaFilters as FiltersType } from '@/hooks/useGlobalAgenda';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentWeekStart } from '@/lib/weekUtils';
import { format } from 'date-fns';

// Get the correct week start based on custom rules
const getCorrectWeekStart = (): string => {
  const weekStart = getCurrentWeekStart(new Date());
  return format(weekStart, 'yyyy-MM-dd');
};

export default function GlobalAgenda() {
  const { hasFeature } = usePlanAccess();
  const { user, currentOrganizationId } = useAuth();
  const hasAccess = hasFeature('global_agenda');

  const [activeTab, setActiveTab] = useState('agenda');
  const [weekStart] = useState(getCorrectWeekStart());
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FiltersType>({
    showPersonal: true,
    showOrganizational: true,
    selectedOrgs: [],
    status: 'all',
    collaborative: 'all',
  });

  // Fetch organization settings to determine has_team
  const { data: orgSettings, isLoading: orgLoading } = useQuery({
    queryKey: ['org-work-settings', currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return null;
      const { data, error } = await supabase
        .from('organizations')
        .select('has_team, collaborative_percentage, team_size')
        .eq('id', currentOrganizationId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrganizationId,
  });

  const generateSchedule = useGenerateGlobalSchedule();

  const hasTeam = orgSettings?.has_team ?? false;
  const collaborativePercentage = orgSettings?.collaborative_percentage ?? 0;

  const handleRegenerate = () => {
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

  if (orgLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 pb-20 flex items-center justify-center">
        <div className="text-muted-foreground">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <Calendar className="w-7 h-7 text-primary" />
            Mi Agenda
            <Badge variant={hasTeam ? 'default' : 'secondary'} className="ml-2">
              {hasTeam ? (
                <><Users className="w-3 h-3 mr-1" /> Equipo</>
              ) : (
                <><User className="w-3 h-3 mr-1" /> Individual</>
              )}
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            {hasTeam 
              ? `Tareas colaborativas (${collaborativePercentage}%) + individuales (${100 - collaborativePercentage}%)`
              : 'Todas tus tareas son individuales - trabaja a tu ritmo'
            }
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

          <Sheet open={showSettings} onOpenChange={setShowSettings}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Ajustes
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:w-[500px] overflow-y-auto">
              <GlobalAgendaSettings onClose={() => setShowSettings(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="agenda" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Mi Agenda
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Cog className="w-4 h-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agenda" className="space-y-6">
          <ProfessionalAgendaView 
            weekStart={weekStart} 
            filters={activeFilters}
            hasTeam={hasTeam}
            collaborativePercentage={collaborativePercentage}
            onCreateTask={() => setShowCreateTask(true)}
          />
          
          {/* Google Calendar Connect - Below agenda */}
          {user && <GoogleCalendarConnect userId={user.id} />}
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
