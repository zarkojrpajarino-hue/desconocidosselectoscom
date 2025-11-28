import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Star, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import PhaseSelector from '@/components/PhaseSelector';
import NotificationBell from '@/components/NotificationBell';
import { format } from 'date-fns';

const Admin = () => {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [teamData, setTeamData] = useState<any[]>([]);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [validationFilter, setValidationFilter] = useState<string>('all');

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
          .maybeSingle();

        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id);

        const { data: completions } = await supabase
          .from('task_completions')
          .select(`
            *,
            tasks:task_id (
              title,
              description,
              area,
              leader_id
            )
          `)
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false });

        const totalTasks = tasks?.length || 0;
        const completedTasks = completions?.length || 0;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return {
          ...user,
          weeklyData,
          totalTasks,
          completedTasks,
          completions: completions || [],
          progress
        };
      })
    );

    setTeamData(enrichedData);
  };

  const handleValidateTask = async (completionId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('task_completions')
        .update({ validated_by_leader: true })
        .eq('id', completionId);

      if (error) throw error;

      // Create notification for user
      const { data: completion } = await supabase
        .from('task_completions')
        .select('*, tasks:task_id(title)')
        .eq('id', completionId)
        .single();

      if (completion) {
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'task_validated',
            message: `Tu tarea "${completion.tasks.title}" ha sido validada`
          });
      }

      toast.success('Tarea validada exitosamente');
      fetchTeamData();
    } catch (error) {
      toast.error('Error al validar tarea');
      console.error(error);
    }
  };

  const filteredTeamData = teamData
    .filter(member => selectedMember === 'all' || member.id === selectedMember)
    .map(member => ({
      ...member,
      completions: member.completions.filter((completion: any) => {
        if (validationFilter === 'all') return true;
        if (validationFilter === 'validated') return completion.validated_by_leader === true;
        if (validationFilter === 'pending') return completion.validated_by_leader === false;
        return true;
      })
    }));

  if (loading || !userProfile) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Botón Volver al Menú */}
      <Button
        variant="outline"
        onClick={() => navigate('/home')}
        className="fixed top-4 right-4 z-50 gap-2 shadow-lg"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Volver al Menú</span>
      </Button>

      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3">
            <h1 className="text-lg md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Panel de Administración
            </h1>
          </div>
          {userProfile && <NotificationBell userId={userProfile.id} />}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8 space-y-4 md:space-y-6 max-w-7xl">
        {/* Phase Selector */}
        {systemConfig && (
          <PhaseSelector
            currentPhase={systemConfig.current_phase}
            onPhaseChange={fetchSystemConfig}
          />
        )}

        {/* Filters */}
        <Card className="shadow-card">
          <CardContent className="pt-4 md:pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-medium">Miembro del Equipo</label>
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los miembros" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los miembros</SelectItem>
                    {teamData.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs md:text-sm font-medium">Estado de Validación</label>
                <Select value={validationFilter} onValueChange={setValidationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="validated">Validadas</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members Detail */}
        {filteredTeamData.map((member) => (
          <Card key={member.id} className="shadow-card">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-lg">
                    {member.full_name[0]}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{member.full_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">@{member.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {member.weeklyData && (
                    <Badge variant="secondary" className="text-sm">
                      {member.weeklyData.mode === 'conservador' && '🐢 Conservador'}
                      {member.weeklyData.mode === 'moderado' && '🚶 Moderado'}
                      {member.weeklyData.mode === 'agresivo' && '🚀 Agresivo'}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-lg font-bold">
                    {member.completedTasks}/{member.totalTasks}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progreso General</span>
                  <span className="font-medium">{Math.round(member.progress)}%</span>
                </div>
                <Progress value={member.progress} className="h-2" />
              </div>
            </CardHeader>
            <CardContent>
              {member.completions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay tareas completadas
                </p>
              ) : (
                <Accordion type="single" collapsible className="space-y-2">
                  {member.completions.map((completion: any) => (
                    <AccordionItem
                      key={completion.id}
                      value={completion.id}
                      className="border rounded-lg px-4 bg-card/50"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="text-left">
                              <p className="font-medium">{completion.tasks?.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {completion.completed_at && format(new Date(completion.completed_at), 'dd/MM/yyyy HH:mm')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {completion.tasks?.area && (
                              <Badge variant="secondary" className="text-xs">
                                {completion.tasks.area}
                              </Badge>
                            )}
                            {completion.leader_evaluation && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-primary text-primary" />
                                <span className="text-sm font-medium">
                                  {completion.leader_evaluation.stars}
                                </span>
                              </div>
                            )}
                            {completion.validated_by_leader === true && (
                              <Badge variant="default" className="bg-success text-success-foreground">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Validada
                              </Badge>
                            )}
                            {completion.validated_by_leader === false && (
                              <Badge variant="outline" className="text-warning border-warning">
                                Pendiente
                              </Badge>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4 space-y-4">
                        {completion.tasks?.description && (
                          <div>
                            <p className="text-sm font-medium mb-1">Descripción</p>
                            <p className="text-sm text-muted-foreground">
                              {completion.tasks.description}
                            </p>
                          </div>
                        )}
                        {completion.leader_evaluation && (
                          <div className="space-y-3 border-t pt-4">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold">Evaluación</p>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= completion.leader_evaluation.stars
                                        ? 'fill-primary text-primary'
                                        : 'text-muted-foreground'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  ¿Qué aprendiste?
                                </p>
                                <p className="text-sm">{completion.leader_evaluation.q1}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  ¿Qué desafíos encontraste?
                                </p>
                                <p className="text-sm">{completion.leader_evaluation.q2}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  ¿Qué mejorarías?
                                </p>
                                <p className="text-sm">{completion.leader_evaluation.q3}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {completion.validated_by_leader === false && completion.tasks?.leader_id === userProfile?.id && (
                          <div className="border-t pt-4">
                            <Button
                              onClick={() => handleValidateTask(completion.id, member.id)}
                              className="w-full bg-gradient-primary hover:opacity-90"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Validar Tarea
                            </Button>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        ))}
      </main>
    </div>
  );
};

export default Admin;