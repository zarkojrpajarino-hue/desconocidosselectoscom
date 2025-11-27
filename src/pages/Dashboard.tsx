import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';
import CountdownTimer from '@/components/CountdownTimer';
import WorkModeSelector from '@/components/WorkModeSelector';
import TaskList from '@/components/TaskList';
import StatsCards from '@/components/StatsCards';
import UrgentAlert from '@/components/UrgentAlert';

const Dashboard = () => {
  const { user, userProfile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [userWeeklyData, setUserWeeklyData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);

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
    if (user && systemConfig) {
      fetchTasksAndCompletions();
    }
  }, [user, systemConfig]);

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
    if (!user || !systemConfig) return;

    const { data: taskData } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('phase', systemConfig.current_phase)
      .order('order_index');

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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Bienvenido, {userProfile.full_name}
            </h1>
            {userProfile.role === 'admin' && (
              <Badge variant="secondary" className="bg-gradient-primary text-primary-foreground">
                Admin
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {userProfile.role === 'admin' && (
              <Button
                onClick={() => navigate('/admin')}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Revisar Equipo
              </Button>
            )}
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-6 max-w-7xl">
        {/* Countdown */}
        {systemConfig && (
          <CountdownTimer deadline={systemConfig.week_deadline} />
        )}

        {/* Urgent Alert */}
        {systemConfig && (
          <UrgentAlert
            deadline={systemConfig.week_deadline}
            totalTasks={tasks.length}
            completedTasks={completions.length}
            pendingTasks={tasks.filter(
              task => !completions.some(c => c.task_id === task.id)
            )}
          />
        )}

        {/* Stats */}
        <StatsCards userId={user?.id} />

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
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;