import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Clock, RefreshCw, User, Building2, MapPin } from 'lucide-react';
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
import { OnboardingTour } from '@/components/OnboardingTour';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const DashboardHome = () => {
  const { user, userProfile, signOut, loading, currentOrganizationId, userOrganizations, switchOrganization } = useAuth();
  const navigate = useNavigate();
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [userWeeklyData, setUserWeeklyData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [isWeekLocked, setIsWeekLocked] = useState(false);
  const [showAvailabilityBlock, setShowAvailabilityBlock] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [availabilityDeadline, setAvailabilityDeadline] = useState<Date | null>(null);
  const [nextWeekStart, setNextWeekStart] = useState<string>('');
  const { remainingSwaps, limit } = useTaskSwaps(user?.id || '', userWeeklyData?.mode || 'moderado');
  const { startTour } = useOnboardingTour();
  
  const currentOrganization = userOrganizations.find(org => org.organization_id === currentOrganizationId);

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
    
    if (data) setUserWeeklyData(data);
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

  if (loading || !userProfile) {
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
      <OnboardingTour autoStart={true} />
      
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <h1 className="text-lg md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
              Bienvenido, {userProfile.full_name}
            </h1>
            {userProfile.role === 'admin' && (
              <Badge variant="secondary" className="bg-gradient-primary text-primary-foreground text-xs shrink-0">
                Admin
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <Button
              onClick={() => navigate('/profile')}
              variant="outline"
              size="sm"
              className="gap-1 md:gap-2 text-xs md:text-sm"
            >
              <User className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Mi Perfil</span>
            </Button>
            {userProfile.role === 'admin' && (
              <Button
                onClick={() => navigate('/admin')}
                variant="outline"
                size="sm"
                className="gap-1 md:gap-2 text-xs md:text-sm"
              >
                <Users className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Revisar Equipo</span>
                <span className="sm:hidden">Admin</span>
              </Button>
            )}
            {user && <NotificationBell />}
            <Button
              onClick={() => navigate('/home')}
              variant="outline"
              size="sm"
              className="gap-1 md:gap-2 text-xs md:text-sm"
            >
              <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Volver al Menú</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8 space-y-4 md:space-y-6 max-w-7xl">
        {/* Profile Card with Organization Selector */}
        <div id="user-profile-section">
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                    {userProfile?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{userProfile?.full_name}</h2>
                    <p className="text-sm text-muted-foreground">@{userProfile?.username}</p>
                    {currentOrganization && (
                      <div className="flex items-center gap-1 text-sm mt-1">
                        <Building2 className="h-3 w-3" />
                        <span className="font-medium">{currentOrganization.organization_name}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={startTour}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                    Tour Guiado
                  </Button>
                  
                  {userOrganizations.length > 1 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Building2 className="h-4 w-4" />
                          Cambiar Organización
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuLabel>Tus Organizaciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {userOrganizations.map((org) => (
                          <DropdownMenuItem
                            key={org.organization_id}
                            onClick={() => switchOrganization(org.organization_id)}
                            className={currentOrganizationId === org.organization_id ? 'bg-primary/10' : ''}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{org.organization_name}</span>
                              <span className="text-xs text-muted-foreground">{org.role}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
            {/* Phase Selector - Only for Admins */}
            {userProfile?.role === 'admin' && systemConfig && (
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
            <StatsCards 
              userId={user?.id} 
              currentPhase={systemConfig?.current_phase} 
              organizationId={userProfile?.organization_id}
              taskLimit={userWeeklyData?.task_limit} 
            />

            {/* Google Calendar Connect */}
            {user && <GoogleCalendarConnect userId={user.id} />}

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
