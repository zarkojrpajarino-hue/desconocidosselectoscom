import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import PhaseSelector from '@/components/PhaseSelector';

const Admin = () => {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [teamData, setTeamData] = useState<any[]>([]);
  const [systemConfig, setSystemConfig] = useState<any>(null);

  useEffect(() => {
    if (!loading && userProfile?.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [userProfile, loading, navigate]);

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      fetchTeamData();
      fetchSystemConfig();
    }
  }, [userProfile]);

  const fetchSystemConfig = async () => {
    const { data } = await supabase
      .from('system_config')
      .select('*')
      .single();
    if (data) setSystemConfig(data);
  };

  const fetchTeamData = async () => {
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .order('username');

    if (!users) return;

    const enrichedData = await Promise.all(
      users.map(async (user) => {
        const { data: weeklyData } = await supabase
          .from('user_weekly_data')
          .select('*')
          .eq('user_id', user.id)
          .order('week_start', { ascending: false })
          .limit(1)
          .single();

        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id);

        const { data: completions } = await supabase
          .from('task_completions')
          .select('*')
          .eq('user_id', user.id);

        const totalTasks = tasks?.length || 0;
        const completedTasks = completions?.length || 0;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return {
          ...user,
          weeklyData,
          totalTasks,
          completedTasks,
          progress
        };
      })
    );

    setTeamData(enrichedData);
  };

  if (loading || !userProfile) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              size="icon"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Panel de Administración
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-6 max-w-7xl">
        {/* Phase Selector */}
        {systemConfig && (
          <PhaseSelector
            currentPhase={systemConfig.current_phase}
            onPhaseChange={fetchSystemConfig}
          />
        )}

        {/* Team Overview */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Progreso del Equipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamData.map((member) => (
                <div
                  key={member.id}
                  className="p-4 rounded-lg border bg-card/50 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                        {member.full_name[0]}
                      </div>
                      <div>
                        <p className="font-semibold">{member.full_name}</p>
                        <p className="text-sm text-muted-foreground">@{member.username}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {member.completedTasks}/{member.totalTasks}
                      </p>
                      <p className="text-xs text-muted-foreground">tareas</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-medium">{Math.round(member.progress)}%</span>
                    </div>
                    <Progress value={member.progress} className="h-2" />
                  </div>
                  {member.weeklyData && (
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant="secondary">
                        {member.weeklyData.mode === 'conservador' && '🐢 Conservador'}
                        {member.weeklyData.mode === 'moderado' && '🚶 Moderado'}
                        {member.weeklyData.mode === 'agresivo' && '🚀 Agresivo'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {member.weeklyData.task_limit} tareas/semana
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;