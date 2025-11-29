import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Users, CheckCircle, Trophy, TrendingUp, RefreshCw, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import PhaseSelector from '@/components/PhaseSelector';
import NotificationBell from '@/components/NotificationBell';

interface UserStats {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: string;
  totalTasks: number;
  completedTasks: number;
  validatedTasks: number;
  totalPoints: number;
  progress: number;
  weeklyMode?: string;
  taskLimit?: number;
}

const Admin = () => {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [teamStats, setTeamStats] = useState<UserStats[]>([]);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'progress' | 'points' | 'tasks'>('progress');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (!loading && userProfile?.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [userProfile, loading, navigate]);

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      fetchData();
    }
  }, [userProfile]);

  const fetchSystemConfig = async () => {
    const { data } = await supabase
      .from('system_config')
      .select('*')
      .single();
    if (data) setSystemConfig(data);
  };

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      await fetchSystemConfig();
      await fetchTeamStats();
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchTeamStats = async () => {
    try {
      // Obtener todos los usuarios
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .order('full_name');

      if (!users) return;

      // Enriquecer con estadísticas
      const enrichedStats: UserStats[] = await Promise.all(
        users.map(async (user) => {
          // Tareas totales
          const { data: tasks } = await supabase
            .from('tasks')
            .select('id')
            .eq('user_id', user.id);

          // Tareas completadas
          const { data: completions } = await supabase
            .from('task_completions')
            .select('id, validated_by_leader')
            .eq('user_id', user.id);

          // Puntos totales
          const { data: achievements } = await supabase
            .from('user_achievements')
            .select('total_points')
            .eq('user_id', user.id)
            .maybeSingle();

          // Datos semanales (modo y límite)
          const { data: weeklyData } = await supabase
            .from('user_weekly_data')
            .select('mode, task_limit')
            .eq('user_id', user.id)
            .order('week_start', { ascending: false })
            .limit(1)
            .maybeSingle();

          const totalTasks = tasks?.length || 0;
          const completedTasks = completions?.length || 0;
          const validatedTasks = completions?.filter(c => c.validated_by_leader === true).length || 0;
          const totalPoints = achievements?.total_points || 0;
          const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

          return {
            id: user.id,
            full_name: user.full_name,
            username: user.username,
            email: user.email,
            role: user.role,
            totalTasks,
            completedTasks,
            validatedTasks,
            totalPoints,
            progress,
            weeklyMode: weeklyData?.mode,
            taskLimit: weeklyData?.task_limit,
          };
        })
      );

      setTeamStats(enrichedStats);
    } catch (error) {
      console.error('Error fetching team stats:', error);
      toast.error('Error al cargar estadísticas');
    }
  };

  const handleSort = (newSortBy: 'progress' | 'points' | 'tasks') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const sortedTeamStats = [...teamStats].sort((a, b) => {
    let aValue = 0, bValue = 0;
    
    if (sortBy === 'progress') {
      aValue = a.progress;
      bValue = b.progress;
    } else if (sortBy === 'points') {
      aValue = a.totalPoints;
      bValue = b.totalPoints;
    } else if (sortBy === 'tasks') {
      aValue = a.completedTasks;
      bValue = b.completedTasks;
    }

    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
  });

  // Calcular totales
  const totalUsers = teamStats.length;
  const totalTasksCompleted = teamStats.reduce((sum, u) => sum + u.completedTasks, 0);
  const totalPoints = teamStats.reduce((sum, u) => sum + u.totalPoints, 0);
  const averageProgress = teamStats.length > 0 
    ? teamStats.reduce((sum, u) => sum + u.progress, 0) / teamStats.length 
    : 0;

  const getRoleColor = (role: string) => {
    if (role === 'admin') return 'default';
    if (role === 'leader') return 'secondary';
    return 'outline';
  };

  const getModeEmoji = (mode?: string) => {
    if (mode === 'conservador') return '🐢';
    if (mode === 'moderado') return '🚶';
    if (mode === 'agresivo') return '🚀';
    return '❓';
  };

  const getTopBadge = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return null;
  };

  if (loading || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-3 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/home')}
              className="hover:bg-accent"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Panel de Administración
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                Gestión del equipo y estadísticas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </Button>
            {userProfile && <NotificationBell userId={userProfile.id} />}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 md:px-6 py-4 md:py-8 space-y-6 max-w-7xl">
        {/* Phase Selector */}
        {systemConfig && (
          <PhaseSelector
            currentPhase={systemConfig.current_phase}
            onPhaseChange={fetchSystemConfig}
          />
        )}

        {/* Estadísticas Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-card border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuarios Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalUsers}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Miembros del equipo
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Tareas Completadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalTasksCompleted}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tareas finalizadas
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Puntos Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalPoints}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Puntos acumulados
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Progreso Promedio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{Math.round(averageProgress)}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                Completitud general
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Principal */}
        <Tabs defaultValue="resumen" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="resumen">📊 Resumen</TabsTrigger>
            <TabsTrigger value="tareas">✅ Tareas</TabsTrigger>
            <TabsTrigger value="gamificacion">🏆 Gamificación</TabsTrigger>
          </TabsList>

          {/* Tab: Resumen */}
          <TabsContent value="resumen" className="space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Vista General del Equipo</CardTitle>
                <CardDescription>
                  Rendimiento y estadísticas de todos los miembros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Modo</TableHead>
                        <TableHead className="text-center cursor-pointer hover:bg-accent/50" onClick={() => handleSort('tasks')}>
                          <div className="flex items-center justify-center gap-1">
                            Tareas <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead className="text-center cursor-pointer hover:bg-accent/50" onClick={() => handleSort('points')}>
                          <div className="flex items-center justify-center gap-1">
                            Puntos <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-accent/50" onClick={() => handleSort('progress')}>
                          <div className="flex items-center gap-1">
                            Progreso <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedTeamStats.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No hay datos disponibles
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedTeamStats.map((user, index) => (
                          <TableRow key={user.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">{index + 1}</span>
                                {getTopBadge(index)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm flex-shrink-0">
                                  {user.full_name[0]}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium truncate">{user.full_name}</p>
                                  <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getRoleColor(user.role)} className="capitalize">
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getModeEmoji(user.weeklyMode)} {user.weeklyMode || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-bold text-lg">{user.completedTasks}</span>
                                <span className="text-xs text-muted-foreground">/ {user.totalTasks}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="font-bold">
                                {user.totalPoints}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2 min-w-[120px]">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium">{Math.round(user.progress)}%</span>
                                </div>
                                <Progress value={user.progress} className="h-2" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Tareas */}
          <TabsContent value="tareas" className="space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Detalle de Tareas por Usuario</CardTitle>
                <CardDescription>
                  Estado de completitud y validación de tareas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead className="text-center">Asignadas</TableHead>
                        <TableHead className="text-center">Completadas</TableHead>
                        <TableHead className="text-center">Validadas</TableHead>
                        <TableHead className="text-center">Pendientes</TableHead>
                        <TableHead>Tasa de Validación</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedTeamStats.map((user) => {
                        const pendingTasks = user.totalTasks - user.completedTasks;
                        const validationRate = user.completedTasks > 0 
                          ? (user.validatedTasks / user.completedTasks) * 100 
                          : 0;

                        return (
                          <TableRow key={user.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-xs">
                                  {user.full_name[0]}
                                </div>
                                <span className="font-medium">{user.full_name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-semibold">
                              {user.totalTasks}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="default">
                                {user.completedTasks}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="bg-success text-success-foreground">
                                {user.validatedTasks}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="text-warning border-warning">
                                {pendingTasks}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2 min-w-[120px]">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium">{Math.round(validationRate)}%</span>
                                </div>
                                <Progress value={validationRate} className="h-2" />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Gamificación */}
          <TabsContent value="gamificacion" className="space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Ranking y Puntos</CardTitle>
                <CardDescription>
                  Clasificación del equipo por puntos acumulados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedTeamStats
                    .sort((a, b) => b.totalPoints - a.totalPoints)
                    .map((user, index) => (
                      <div
                        key={user.id}
                        className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                          index < 3 ? 'bg-accent/30 border-primary/20' : 'bg-card border-border'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-3xl font-bold w-12 text-center">
                            {index === 0 && '🥇'}
                            {index === 1 && '🥈'}
                            {index === 2 && '🥉'}
                            {index > 2 && <span className="text-muted-foreground">#{index + 1}</span>}
                          </div>
                          <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                            {user.full_name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{user.full_name}</p>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-primary" />
                            <span className="text-2xl font-bold">{user.totalPoints}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">puntos totales</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;