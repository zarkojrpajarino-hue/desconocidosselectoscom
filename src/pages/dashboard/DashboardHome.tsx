import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, Users, Clock, User, Lightbulb, Zap, ChevronDown, AlertTriangle } from 'lucide-react';
import { InfoMessage } from '@/components/marketing/MarketingMessage';
import StatsCards from '@/components/StatsCards';
import TeamProgress from '@/components/TeamProgress';
import NotificationBell from '@/components/NotificationBell';
import { getCurrentWeekStart, getNextWeekStart } from '@/lib/weekUtils';
import { SectionTourButton } from '@/components/SectionTourButton';
import { IntegrationButton } from '@/components/IntegrationButton';
import { TrialCountdown } from '@/components/TrialCountdown';
import { PhaseWeeklyTasks } from '@/components/dashboard/PhaseWeeklyTasks';
import { RoadmapPreview } from '@/components/phases/RoadmapPreview';
import { WorkPreferencesCollapsible } from '@/components/agenda/WorkPreferencesCollapsible';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Verificar si estamos en periodo de transición (miércoles 10:30 - 13:30)
const isInTransitionPeriod = (): boolean => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  if (dayOfWeek !== 3) return false; // Solo miércoles
  
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const transitionStart = 10 * 60 + 30; // 10:30
  const transitionEnd = 13 * 60 + 30;   // 13:30
  
  return currentMinutes >= transitionStart && currentMinutes < transitionEnd;
};

interface SystemConfig {
  week_start: string;
  current_phase: number;
  [key: string]: unknown;
}
interface UserWeeklyData {
  task_limit: number;
  [key: string]: unknown;
}
interface TaskItem {
  id: string;
  title: string;
  [key: string]: unknown;
}
interface CompletionItem {
  id: string;
  task_id: string;
  [key: string]: unknown;
}
const DashboardHome = () => {
  const {
    user,
    userProfile,
    currentOrganizationId,
    userOrganizations,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [userWeeklyData, setUserWeeklyData] = useState<UserWeeklyData | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [completions, setCompletions] = useState<CompletionItem[]>([]);
  const [roadmapOpen, setRoadmapOpen] = useState(false);
  
  const [adminVisibilityTeam, setAdminVisibilityTeam] = useState(false);
  const [hasTeam, setHasTeam] = useState(true);
  const [isTransition, setIsTransition] = useState(isInTransitionPeriod());
  const [overdueTasksOpen, setOverdueTasksOpen] = useState(true);
  const [overdueTasks, setOverdueTasks] = useState<TaskItem[]>([]);

  // Detectar periodo de transición cada minuto
  useEffect(() => {
    const checkTransition = () => {
      setIsTransition(isInTransitionPeriod());
    };
    const interval = setInterval(checkTransition, 60000);
    return () => clearInterval(interval);
  }, []);

  // Cargar tareas atrasadas (de semanas anteriores no completadas)
  useEffect(() => {
    const fetchOverdueTasks = async () => {
      if (!user || !currentOrganizationId) return;
      
      const currentWeekStart = getCurrentWeekStart();
      
      // Obtener tareas del schedule de semanas anteriores que no están completadas
      const { data: overdueSchedule } = await supabase
        .from('task_schedule')
        .select(`
          task_id,
          tasks (id, title, description, area, phase, estimated_hours)
        `)
        .eq('user_id', user.id)
        .lt('week_start', currentWeekStart.toISOString().split('T')[0])
        .neq('status', 'completed');
      
      if (overdueSchedule) {
        // Filtrar tareas únicas que no están completadas
        const taskIds = overdueSchedule.map(s => s.task_id);
        
        // Verificar cuáles realmente no están completadas
        const { data: completedIds } = await supabase
          .from('task_completions')
          .select('task_id')
          .in('task_id', taskIds)
          .eq('validated_by_leader', true);
        
        const completedSet = new Set(completedIds?.map(c => c.task_id) || []);
        
        const uniqueOverdue = overdueSchedule
          .filter(s => s.tasks && !completedSet.has(s.task_id))
          .map(s => s.tasks as TaskItem)
          .filter((task, index, self) => 
            index === self.findIndex(t => t.id === task.id)
          );
        
        setOverdueTasks(uniqueOverdue);
      }
    };
    
    fetchOverdueTasks();
  }, [user, currentOrganizationId]);

  // Obtener el rol actual del usuario en la organización seleccionada
  const currentUserRole = userOrganizations.find(org => org.organization_id === currentOrganizationId)?.role || 'member';
  const isAdmin = currentUserRole === 'admin';
  
  // Fetch organization settings including visibility and has_team
  useEffect(() => {
    const fetchOrgSettings = async () => {
      if (!currentOrganizationId) return;
      const { data } = await supabase
        .from('organizations')
        .select('admin_visibility_team, has_team')
        .eq('id', currentOrganizationId)
        .single();
      if (data) {
        setAdminVisibilityTeam(data.admin_visibility_team ?? false);
        setHasTeam(data.has_team ?? true);
      }
    };
    fetchOrgSettings();
  }, [currentOrganizationId]);
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);
  useEffect(() => {
    if (user) {
      fetchSystemConfig();
      fetchUserWeeklyData();
    }
  }, [user]);
  useEffect(() => {
    if (user && systemConfig && userWeeklyData) {
      fetchTasksAndCompletions();
    }
  }, [user, systemConfig, userWeeklyData]);
  const fetchSystemConfig = async () => {
    const {
      data
    } = await supabase.from('system_config').select('*').single();
    if (data) setSystemConfig(data);
  };
  const fetchUserWeeklyData = async () => {
    if (!user) return;
    const {
      data
    } = await supabase.from('user_weekly_data').select('*').eq('user_id', user.id).order('week_start', {
      ascending: false
    }).limit(1).maybeSingle();
    if (data) setUserWeeklyData(data as UserWeeklyData);
  };
  const fetchTasksAndCompletions = async () => {
    if (!user || !systemConfig || !userWeeklyData) return;
    try {
      const taskLimit = userWeeklyData.task_limit || 8;
      const {
        data: taskData
      } = await supabase.from('tasks').select('*').eq('user_id', user.id).eq('phase', systemConfig.current_phase).order('order_index').limit(taskLimit);

      // IMPORTANTE: Solo contar completaciones VALIDADAS
      const {
        data: completionData
      } = await supabase.from('task_completions').select('*').eq('user_id', user.id).eq('validated_by_leader', true);
      if (taskData) setTasks(taskData);
      if (completionData) setCompletions(completionData);
    } catch (error) {
      console.error('Error fetching tasks and completions:', error);
    }
  };

  // Calcular tareas completadas al 100% (validated_by_leader = true)
  const fullyCompletedCount = completions.length; // Ya están filtradas por validated_by_leader en el fetch

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>;
  }
  return <>
      {/* Header - Mobile optimized */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <h1 className="text-base sm:text-lg md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
              Hola, {userProfile.full_name?.split(' ')[0]}
            </h1>
            {isAdmin && <Badge variant="secondary" className="bg-gradient-primary text-primary-foreground text-[10px] md:text-xs shrink-0 hidden sm:flex">
                Admin
              </Badge>}
          </div>
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <SectionTourButton sectionId="dashboard" variant="ghost" size="sm" className="hidden md:flex" />
            <Button onClick={() => navigate('/profile')} variant="outline" size="sm" className="gap-1 p-2 md:px-3 text-xs md:text-sm">
              <User className="h-4 w-4" />
              <span className="hidden md:inline">Mi Perfil</span>
            </Button>
            {(isAdmin || adminVisibilityTeam) && <Button onClick={() => navigate('/admin')} variant="outline" size="sm" className="gap-1 p-2 md:px-3 text-xs md:text-sm hidden sm:flex">
                <Users className="h-4 w-4" />
                <span className="hidden md:inline">{hasTeam ? 'Equipo' : 'Tu Trabajo'}</span>
              </Button>}
            {user && <NotificationBell />}
            <Button onClick={() => navigate('/home')} variant="outline" size="sm" className="gap-1 p-2 md:px-3 text-xs md:text-sm">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden md:inline">Menú</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8 space-y-4 md:space-y-6 max-w-7xl">
        {/* DASHBOARD NORMAL */}
        <>
            {/* Trial Countdown */}
            <TrialCountdown />

            {/* Marketing Message */}
            <InfoMessage icon={Lightbulb} title="💡 Tu Dashboard Personalizado" message="Este no es un dashboard genérico. Es <strong>tu espacio de trabajo</strong> con tareas y métricas específicas para tu negocio." className="mb-2" />

            {/* Roadmap Preview - Collapsible */}
            {currentOrganizationId && <Collapsible open={roadmapOpen} onOpenChange={setRoadmapOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-auto py-4 px-4 bg-gradient-to-r from-primary/5 to-violet-500/5 border-primary/20 hover:bg-primary/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <span className="font-semibold block">Roadmap Estratégico con IA</span>
                        <span className="text-xs text-muted-foreground">Plan de crecimiento personalizado</span>
                      </div>
                    </div>
                    <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${roadmapOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <RoadmapPreview organizationId={currentOrganizationId} />
                </CollapsibleContent>
              </Collapsible>}

            {/* Progreso General movido a /okrs/organization */}

            {/* Work Preferences - Collapsible and MANDATORY */}
            <WorkPreferencesCollapsible onPreferencesChange={fetchUserWeeklyData} />

            {/* PhaseSelector removed - PhaseTimeline replaces it */}

            {/* Stats */}
            <div data-testid="stats-cards">
              <StatsCards userId={user?.id} currentPhase={systemConfig?.current_phase} organizationId={currentOrganizationId || undefined} taskLimit={userWeeklyData?.task_limit} />
            </div>

            {/* Sync All Card */}
            <Card className="shadow-card border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Sincronización Rápida
                </CardTitle>
                <CardDescription>
                  Sincroniza tu trabajo con todas tus herramientas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <IntegrationButton type="slack" action="notify" data={{
                message: `📊 *Resumen del día - ${userProfile?.full_name}*\n\n` + `✅ Tareas completadas: ${completions.length}/${tasks.length}\n` + `📅 Semana: ${format(getCurrentWeekStart(), "d 'de' MMMM", { locale: es })}\n\n` + `_¡Seguimos avanzando! 💪_`,
                channel: '#daily-updates'
              }} label="Resumen a Slack" size="sm" />
                  
                  <IntegrationButton type="calendar" action="sync" data={{
                title: 'Sincronizar tareas pendientes',
                description: `${tasks.length - completions.length} tareas por completar`,
                start_time: new Date().toISOString(),
                end_time: getNextWeekStart().toISOString()
              }} label="Sync Calendario" size="sm" variant="outline" />
                  
                  <IntegrationButton type="asana" action="export" data={{
                name: 'Tareas semanales',
                notes: `${tasks.length} tareas de la semana`
              }} label="Exportar Asana" size="sm" variant="outline" />
                </div>
              </CardContent>
            </Card>

            {/* Team Progress - Now available for ALL users */}
            <TeamProgress currentPhase={systemConfig?.current_phase || 1} currentUserId={user?.id} organizationId={currentOrganizationId || undefined} />

            {/* Tareas Atrasadas - SIEMPRE VISIBLE si hay tareas atrasadas */}
            {overdueTasks.length > 0 && (
              <Collapsible open={overdueTasksOpen} onOpenChange={setOverdueTasksOpen}>
                <Card className="shadow-card border-destructive/30 bg-destructive/5">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-destructive/5 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                          </div>
                          <div>
                            <CardTitle className="text-destructive">Tareas Atrasadas</CardTitle>
                            <CardDescription>
                              {overdueTasks.length} tarea{overdueTasks.length !== 1 ? 's' : ''} pendiente{overdueTasks.length !== 1 ? 's' : ''} de semanas anteriores
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">{overdueTasks.length}</Badge>
                          <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${overdueTasksOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {overdueTasks.map((task) => (
                          <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-destructive/20">
                            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{task.title}</p>
                              {task.area && <p className="text-xs text-muted-foreground">{String(task.area)}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-4 p-2 bg-destructive/10 rounded">
                        ⚠️ Estas tareas son obligatorias y se acumularán hasta que las completes.
                      </p>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}

            {/* Mensaje de Transición */}
            {isTransition && (
              <Card className="shadow-card border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
                <CardContent className="flex items-center gap-4 py-6">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">La semana ha terminado</h3>
                    <p className="text-muted-foreground">
                      La nueva semana comienza hoy a las 13:30. 
                      Prepara tu disponibilidad para la semana del {format(getNextWeekStart(), "d 'de' MMMM", { locale: es })}.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tareas de la Fase por Semanas */}
            <PhaseWeeklyTasks />
          </>
      </main>
    </>;
};
export default DashboardHome;