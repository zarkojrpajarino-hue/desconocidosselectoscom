import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, Users, Clock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import CountdownTimer from '@/components/CountdownTimer';
import WorkModeSelector from '@/components/WorkModeSelector';
import TaskList from '@/components/TaskList';
import StatsCards from '@/components/StatsCards';
import UrgentAlert from '@/components/UrgentAlert';
import NotificationBell from '@/components/NotificationBell';
import { useUrgentNotification } from '@/hooks/useUrgentNotification';
import { useTaskSwaps } from '@/hooks/useTaskSwaps';
import { getCurrentWeekDeadline, isWeekActive } from '@/lib/weekUtils';

const Dashboard = () => {
  const { user, userProfile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [userWeeklyData, setUserWeeklyData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [isWeekLocked, setIsWeekLocked] = useState(false);
  const { remainingSwaps, limit } = useTaskSwaps(user?.id || '', userWeeklyData?.mode || 'moderado');

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

  const fetchTasksAndCompletions = async () => {
    if (!user || !systemConfig || !userWeeklyData) return;

    // Obtener límite de tareas según el modo
    const taskLimit = userWeeklyData.task_limit || 8;

    const { data: taskData } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('phase', systemConfig.current_phase)
      .order('order_index')
      .limit(taskLimit); // Limitar según el modo

    const { data: completionData } = await supabase
      .from('task_completions')
      .select('*')
      .eq('user_id', user.id);

    if (taskData) setTasks(taskData);
    if (completionData) setCompletions(completionData);
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Sesión cerrada');
  };

  // Send urgent notification when conditions are met
  useUrgentNotification({
    userId: user?.id,
    deadline: getCurrentWeekDeadline().toISOString(),
    totalTasks: tasks.length,
    completedTasks: completions.length
  });

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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
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
            {user && <NotificationBell userId={user.id} />}
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="gap-1 md:gap-2 text-xs md:text-sm"
            >
              <LogOut className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8 space-y-4 md:space-y-6 max-w-7xl">
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
        <StatsCards userId={user?.id} />

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

        {/* Task List */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Mis Tareas</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList
              userId={user?.id}
              currentPhase={systemConfig?.current_phase}
              isLocked={isWeekLocked}
              mode={userWeeklyData?.mode || 'moderado'}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;