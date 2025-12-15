import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Clock, RefreshCw, User, Building2, MapPin, Lightbulb, Zap } from 'lucide-react';
import { InfoMessage } from '@/components/marketing/MarketingMessage';
import { toast } from 'sonner';
import CountdownTimer from '@/components/CountdownTimer';
import PhaseSelector from '@/components/PhaseSelector';
import WorkModeSelector from '@/components/WorkModeSelector';
import ProgressBar from '@/components/ProgressBar';
import TaskList from '@/components/TaskList';
import StatsCards from '@/components/StatsCards';
import TeamProgress from '@/components/TeamProgress';
import UrgentAlert from '@/components/UrgentAlert';
import NotificationBell from '@/components/NotificationBell';
import AvailabilityBlockScreen from '@/components/AvailabilityBlockScreen';
import AvailabilityQuestionnaire from '@/components/AvailabilityQuestionnaire';
import { useTaskSwaps } from '@/hooks/useTaskSwaps';
import { getCurrentWeekDeadline } from '@/lib/weekUtils';
import GoogleCalendarConnect from '@/components/GoogleCalendarConnect';
import { SectionTourButton } from '@/components/SectionTourButton';
import { IntegrationButton } from '@/components/IntegrationButton';
import { TrialCountdown } from '@/components/TrialCountdown';

interface SystemConfig {
  week_start: string;
  current_phase: number;
  [key: string]: unknown;
}

interface UserWeeklyData {
  mode: 'agresivo' | 'conservador' | 'moderado';
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
  const { user, userProfile, currentOrganizationId, userOrganizations, loading } = useAuth();
  const navigate = useNavigate();
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [userWeeklyData, setUserWeeklyData] = useState<UserWeeklyData | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [completions, setCompletions] = useState<CompletionItem[]>([]);
  const [isWeekLocked, setIsWeekLocked] = useState(false);
  const [showAvailabilityBlock, setShowAvailabilityBlock] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [availabilityDeadline, setAvailabilityDeadline] = useState<Date | null>(null);
  const [nextWeekStart, setNextWeekStart] = useState<string>('');
  const { remainingSwaps, limit } = useTaskSwaps(user?.id || '', userWeeklyData?.mode || 'moderado');

  // Obtener el rol actual del usuario en la organización seleccionada
  const currentUserRole = userOrganizations.find(
    org => org.organization_id === currentOrganizationId
  )?.role || 'member';
  const isAdmin = currentUserRole === 'admin';

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

  useEffect(() => {
    if (user) {
      checkAvailabilityStatus();
    }
  }, [user]);

  const fetchSystemConfig = async () => {
    const { data } = await supabase
      .from('system_config')
      .select('*')
      .single();
    if (data) setSystemConfig(data);
  };

  const fetchUserWeeklyData = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_weekly_data')
      .select('*')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) setUserWeeklyData(data as UserWeeklyData);
  };

  const checkAvailabilityStatus = async () => {
    if (!user) return;

    try {
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

      // Calcular deadline (Lunes 13:00 de esa semana)
      const deadline = new Date(nextWed);
      deadline.setDate(nextWed.getDate() - 2); // 2 días antes = Lunes
      deadline.setHours(13, 0, 0, 0);
      
      setAvailabilityDeadline(deadline);

      // Verificar si ya pasó el deadline
      if (today > deadline) {
        // Ya pasó el deadline, no bloquear
        setShowAvailabilityBlock(false);
        return;
      }

      // Verificar si usuario completó disponibilidad
      const { data } = await supabase
        .from('user_weekly_availability')
        .select('submitted_at')
        .eq('user_id', user.id)
        .eq('week_start', nextWed.toISOString().split('T')[0])
        .maybeSingle();

      if (!data || !data.submitted_at) {
        // No ha completado, mostrar bloqueo
        setShowAvailabilityBlock(true);
      } else {
        setShowAvailabilityBlock(false);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
    }
  };

  const fetchTasksAndCompletions = async () => {
    if (!user || !systemConfig || !userWeeklyData) return;

    try {
      const taskLimit = userWeeklyData.task_limit || 8;

      const { data: taskData } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('phase', systemConfig.current_phase)
        .order('order_index')
        .limit(taskLimit);

      // IMPORTANTE: Solo contar completaciones VALIDADAS
      const { data: completionData } = await supabase
        .from('task_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('validated_by_leader', true);

      if (taskData) setTasks(taskData);
      if (completionData) setCompletions(completionData);
    } catch (error) {
      console.error('Error fetching tasks and completions:', error);
    }
  };

  // Calcular tareas completadas al 100% (validated_by_leader = true)
  const fullyCompletedCount = completions.length; // Ya están filtradas por validated_by_leader en el fetch

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header - Mobile optimized */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <h1 className="text-base sm:text-lg md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
              Hola, {userProfile.full_name?.split(' ')[0]}
            </h1>
            {isAdmin && (
              <Badge variant="secondary" className="bg-gradient-primary text-primary-foreground text-[10px] md:text-xs shrink-0 hidden sm:flex">
                Admin
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <SectionTourButton sectionId="dashboard" variant="ghost" size="sm" className="hidden md:flex" />
            <Button
              onClick={() => navigate('/profile')}
              variant="outline"
              size="sm"
              className="gap-1 p-2 md:px-3 text-xs md:text-sm"
            >
              <User className="h-4 w-4" />
              <span className="hidden md:inline">Mi Perfil</span>
            </Button>
            {isAdmin && (
              <Button
                onClick={() => navigate('/admin')}
                variant="outline"
                size="sm"
                className="gap-1 p-2 md:px-3 text-xs md:text-sm hidden sm:flex"
              >
                <Users className="h-4 w-4" />
                <span className="hidden md:inline">Equipo</span>
              </Button>
            )}
            {user && <NotificationBell />}
            <Button
              onClick={() => navigate('/home')}
              variant="outline"
              size="sm"
              className="gap-1 p-2 md:px-3 text-xs md:text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden md:inline">Menú</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8 space-y-4 md:space-y-6 max-w-7xl">
        {/* MOSTRAR BLOQUEO SI NO COMPLETÓ DISPONIBILIDAD */}
        {showAvailabilityBlock && !showQuestionnaire && availabilityDeadline && (
          <AvailabilityBlockScreen
            deadlineDate={availabilityDeadline}
            onConfigure={() => setShowQuestionnaire(true)}
          />
        )}

        {/* MOSTRAR CUESTIONARIO SI LO PIDIÓ */}
        {showQuestionnaire && (
          <AvailabilityQuestionnaire
            userId={user!.id}
            weekStart={nextWeekStart}
            onComplete={() => {
              setShowQuestionnaire(false);
              setShowAvailabilityBlock(false);
              toast.success('Disponibilidad guardada correctamente');
            }}
          />
        )}

        {/* DASHBOARD NORMAL (solo si no está bloqueado) */}
        {!showAvailabilityBlock && !showQuestionnaire && (
          <>
            {/* Trial Countdown */}
            <TrialCountdown />

            {/* Marketing Message */}
            <InfoMessage
              icon={Lightbulb}
              title="💡 Tu Dashboard Personalizado"
              message="Este no es un dashboard genérico. Es <strong>tu espacio de trabajo</strong> con tareas y métricas específicas para tu negocio."
              className="mb-2"
            />

            {/* Phase Selector - Only for Admins */}
            {isAdmin && systemConfig && (
              <PhaseSelector
                currentPhase={systemConfig.current_phase}
                onPhaseChange={fetchSystemConfig}
              />
            )}

            {/* Countdown */}
            <CountdownTimer 
              deadline={getCurrentWeekDeadline().toISOString()}
              onTimeExpired={setIsWeekLocked}
            />

            {/* Urgent Alert */}
            {!isWeekLocked && (
              <UrgentAlert
                deadline={getCurrentWeekDeadline().toISOString()}
                totalTasks={tasks.length}
                completedTasks={completions.length}
                pendingTasks={tasks.filter(
                  task => !completions.some(c => c.task_id === task.id)
                )}
              />
            )}

            {/* Stats */}
            <div data-testid="stats-cards">
              <StatsCards 
                userId={user?.id} 
                currentPhase={systemConfig?.current_phase} 
                organizationId={currentOrganizationId || undefined}
                taskLimit={userWeeklyData?.task_limit}
                remainingSwaps={remainingSwaps}
                swapLimit={limit}
              />
            </div>

            {/* Google Calendar Connect */}
            {user && <GoogleCalendarConnect userId={user.id} />}

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
                  <IntegrationButton
                    type="slack"
                    action="notify"
                    data={{
                      message: `📊 *Resumen del día - ${userProfile?.full_name}*\n\n` +
                        `✅ Tareas completadas: ${completions.length}/${tasks.length}\n` +
                        `🔄 Cambios restantes: ${remainingSwaps}/${limit}\n` +
                        `📅 Deadline: ${getCurrentWeekDeadline().toLocaleDateString()}\n\n` +
                        `_¡Seguimos avanzando! 💪_`,
                      channel: '#daily-updates'
                    }}
                    label="Resumen a Slack"
                    size="sm"
                  />
                  
                  <IntegrationButton
                    type="calendar"
                    action="sync"
                    data={{
                      title: 'Sincronizar tareas pendientes',
                      description: `${tasks.length - completions.length} tareas por completar`,
                      start_time: new Date().toISOString(),
                      end_time: getCurrentWeekDeadline().toISOString()
                    }}
                    label="Sync Calendario"
                    size="sm"
                    variant="outline"
                  />
                  
                  <IntegrationButton
                    type="asana"
                    action="export"
                    data={{
                      name: 'Tareas semanales',
                      notes: `${tasks.length} tareas de la semana`
                    }}
                    label="Exportar Asana"
                    size="sm"
                    variant="outline"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Team Progress */}
            <TeamProgress 
              currentPhase={systemConfig?.current_phase || 1}
              currentUserId={user?.id}
            />

            {/* Swaps Info Card */}
            {userWeeklyData?.mode && (
              <Card className="shadow-card bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5" />
                        Cambios de Tareas Disponibles
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Puedes intercambiar tareas que no te convengan esta semana
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      {remainingSwaps}/{limit}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Modo <span className="font-semibold">{userWeeklyData.mode}</span>: 
                    {remainingSwaps > 0 
                      ? ` Te quedan ${remainingSwaps} cambio${remainingSwaps !== 1 ? 's' : ''} esta semana.`
                      : ' Has usado todos tus cambios esta semana.'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Work Mode Selector */}
            <WorkModeSelector
              userId={user?.id}
              currentMode={userWeeklyData?.mode}
              onModeChange={fetchUserWeeklyData}
            />

            {/* Progress Bar */}
            <ProgressBar
              completedTasks={fullyCompletedCount}
              totalTasks={tasks.length}
            />

            {/* Task List */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Mis Tareas Esta Semana</CardTitle>
                <CardDescription>
                  Tareas asignadas a ti en esta fase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TaskList
                  userId={user?.id}
                  currentPhase={systemConfig?.current_phase}
                  isLocked={isWeekLocked}
                  mode={userWeeklyData?.mode || 'moderado'}
                  taskLimit={userWeeklyData?.task_limit}
                />
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </>
  );
};

export default DashboardHome;
