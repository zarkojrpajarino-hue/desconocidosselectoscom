import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Users, CheckCircle, Trophy, TrendingUp, RefreshCw, ArrowUpDown, Filter, Calendar as CalendarIcon, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import PhaseSelector from '@/components/PhaseSelector';
import NotificationBell from '@/components/NotificationBell';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

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

interface WeeklyProgress {
  week: string;
  completed: number;
  validated: number;
  points: number;
}

interface WeekComparison {
  week: string;
  tasksCompleted: number;
  avgProgress: number;
  totalPoints: number;
  activeUsers: number;
}

const Admin = () => {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [teamStats, setTeamStats] = useState<UserStats[]>([]);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'progress' | 'points' | 'tasks'>('progress');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Filtros avanzados
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [showFilters, setShowFilters] = useState(false);

  // Datos para gráficos
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress[]>([]);
  const [weekComparison, setWeekComparison] = useState<WeekComparison[]>([]);

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
      await fetchWeeklyProgress();
      await fetchWeekComparison();
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchTeamStats = async () => {
    try {
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .order('full_name');

      if (!users) return;

      const enrichedStats: UserStats[] = await Promise.all(
        users.map(async (user) => {
          let tasksQuery = supabase
            .from('tasks')
            .select('id')
            .eq('user_id', user.id);

          let completionsQuery = supabase
            .from('task_completions')
            .select('id, validated_by_leader, completed_at')
            .eq('user_id', user.id);

          // Aplicar filtros de fecha si están definidos
          if (dateFrom) {
            completionsQuery = completionsQuery.gte('completed_at', dateFrom.toISOString());
          }
          if (dateTo) {
            completionsQuery = completionsQuery.lte('completed_at', dateTo.toISOString());
          }

          const { data: tasks } = await tasksQuery;
          const { data: completions } = await completionsQuery;

          const { data: achievements } = await supabase
            .from('user_achievements')
            .select('total_points')
            .eq('user_id', user.id)
            .maybeSingle();

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

  const fetchWeeklyProgress = async () => {
    try {
      const weeks = [];
      for (let i = 5; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

        const { data: completions } = await supabase
          .from('task_completions')
          .select('id, validated_by_leader, completed_at')
          .gte('completed_at', weekStart.toISOString())
          .lte('completed_at', weekEnd.toISOString());

        const { data: points } = await supabase
          .from('points_history')
          .select('points')
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString());

        weeks.push({
          week: format(weekStart, 'dd MMM', { locale: es }),
          completed: completions?.length || 0,
          validated: completions?.filter(c => c.validated_by_leader === true).length || 0,
          points: points?.reduce((sum, p) => sum + p.points, 0) || 0,
        });
      }

      setWeeklyProgress(weeks);
    } catch (error) {
      console.error('Error fetching weekly progress:', error);
    }
  };

  const fetchWeekComparison = async () => {
    try {
      const comparisons = [];
      
      for (let i = 3; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

        // Tareas completadas
        const { data: completions } = await supabase
          .from('task_completions')
          .select('user_id, completed_at')
          .gte('completed_at', weekStart.toISOString())
          .lte('completed_at', weekEnd.toISOString());

        // Progreso promedio de usuarios activos
        const activeUserIds = [...new Set(completions?.map(c => c.user_id) || [])];
        let avgProgress = 0;
        
        if (activeUserIds.length > 0) {
          const progressValues = await Promise.all(
            activeUserIds.map(async (userId) => {
              const { data: tasks } = await supabase
                .from('tasks')
                .select('id')
                .eq('user_id', userId);

              const { data: userCompletions } = await supabase
                .from('task_completions')
                .select('id')
                .eq('user_id', userId)
                .lte('completed_at', weekEnd.toISOString());

              const total = tasks?.length || 0;
              const completed = userCompletions?.length || 0;
              return total > 0 ? (completed / total) * 100 : 0;
            })
          );

          avgProgress = progressValues.reduce((sum, p) => sum + p, 0) / progressValues.length;
        }

        // Puntos totales
        const { data: points } = await supabase
          .from('points_history')
          .select('points')
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString());

        comparisons.push({
          week: format(weekStart, 'dd MMM', { locale: es }),
          tasksCompleted: completions?.length || 0,
          avgProgress: Math.round(avgProgress),
          totalPoints: points?.reduce((sum, p) => sum + p.points, 0) || 0,
          activeUsers: activeUserIds.length,
        });
      }

      setWeekComparison(comparisons);
    } catch (error) {
      console.error('Error fetching week comparison:', error);
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

  const clearFilters = () => {
    setFilterRole('all');
    setFilterMode('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    fetchData();
  };

  const applyFilters = () => {
    fetchTeamStats();
    toast.success('Filtros aplicados');
  };

  // Aplicar filtros a los datos
  const filteredTeamStats = teamStats.filter(user => {
    if (filterRole !== 'all' && user.role !== filterRole) return false;
    if (filterMode !== 'all' && user.weeklyMode !== filterMode) return false;
    return true;
  });

  const sortedTeamStats = [...filteredTeamStats].sort((a, b) => {
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
  const totalUsers = filteredTeamStats.length;
  const totalTasksCompleted = filteredTeamStats.reduce((sum, u) => sum + u.completedTasks, 0);
  const totalPoints = filteredTeamStats.reduce((sum, u) => sum + u.totalPoints, 0);
  const averageProgress = filteredTeamStats.length > 0 
    ? filteredTeamStats.reduce((sum, u) => sum + u.progress, 0) / filteredTeamStats.length 
    : 0;

  // Calcular métricas de comparación
  const getCurrentWeekMetrics = () => {
    if (weekComparison.length === 0) return null;
    const current = weekComparison[weekComparison.length - 1];
    const previous = weekComparison[weekComparison.length - 2];
    
    if (!previous) return null;

    return {
      tasksDelta: current.tasksCompleted - previous.tasksCompleted,
      tasksPercent: previous.tasksCompleted > 0 
        ? ((current.tasksCompleted - previous.tasksCompleted) / previous.tasksCompleted) * 100 
        : 0,
      progressDelta: current.avgProgress - previous.avgProgress,
      pointsDelta: current.totalPoints - previous.totalPoints,
      pointsPercent: previous.totalPoints > 0 
        ? ((current.totalPoints - previous.totalPoints) / previous.totalPoints) * 100 
        : 0,
    };
  };

  const metrics = getCurrentWeekMetrics();

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
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
            </Button>
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

        {/* Filtros Avanzados */}
        {showFilters && (
          <div className="border-t bg-card/80 backdrop-blur-sm">
            <div className="container mx-auto px-3 md:px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rol</label>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="leader">Leader</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Modo</label>
                  <Select value={filterMode} onValueChange={setFilterMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los modos</SelectItem>
                      <SelectItem value="conservador">🐢 Conservador</SelectItem>
                      <SelectItem value="moderado">🚶 Moderado</SelectItem>
                      <SelectItem value="agresivo">🚀 Agresivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Desde</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : 'Fecha inicio'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Hasta</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, 'dd/MM/yyyy') : 'Fecha fin'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={applyFilters} className="bg-gradient-primary">
                  Aplicar Filtros
                </Button>
                <Button onClick={clearFilters} variant="outline">
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </div>
        )}
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
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="resumen">📊 Resumen</TabsTrigger>
            <TabsTrigger value="evolucion">📈 Evolución</TabsTrigger>
            <TabsTrigger value="comparacion">📅 Comparación</TabsTrigger>
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

          {/* Tab: Evolución Temporal */}
          <TabsContent value="evolucion" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Evolución de Tareas</CardTitle>
                  <CardDescription>Últimas 6 semanas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={weeklyProgress}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="completed" stroke="#8884d8" fill="#8884d8" name="Completadas" />
                      <Area type="monotone" dataKey="validated" stroke="#82ca9d" fill="#82ca9d" name="Validadas" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Evolución de Puntos</CardTitle>
                  <CardDescription>Últimas 6 semanas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={weeklyProgress}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="points" stroke="#ffc658" strokeWidth={2} name="Puntos" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Comparación Semanal */}
          <TabsContent value="comparacion" className="space-y-4">
            {/* Métricas de mejora */}
            {metrics && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="shadow-card border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Tareas vs Semana Anterior
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {metrics.tasksDelta >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-success" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-destructive" />
                      )}
                      <p className="text-2xl font-bold">
                        {metrics.tasksDelta >= 0 ? '+' : ''}{metrics.tasksDelta}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {metrics.tasksPercent >= 0 ? '+' : ''}{Math.round(metrics.tasksPercent)}% cambio
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-card border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Progreso Promedio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {metrics.progressDelta >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-success" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-destructive" />
                      )}
                      <p className="text-2xl font-bold">
                        {metrics.progressDelta >= 0 ? '+' : ''}{Math.round(metrics.progressDelta)}%
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Cambio en completitud
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-card border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Puntos vs Semana Anterior
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {metrics.pointsDelta >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-success" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-destructive" />
                      )}
                      <p className="text-2xl font-bold">
                        {metrics.pointsDelta >= 0 ? '+' : ''}{metrics.pointsDelta}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {metrics.pointsPercent >= 0 ? '+' : ''}{Math.round(metrics.pointsPercent)}% cambio
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Gráfico de comparación */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Comparación de Últimas 4 Semanas</CardTitle>
                <CardDescription>
                  Métricas clave por semana
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={weekComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="tasksCompleted" fill="#8884d8" name="Tareas Completadas" />
                    <Bar yAxisId="left" dataKey="totalPoints" fill="#82ca9d" name="Puntos Totales" />
                    <Bar yAxisId="right" dataKey="avgProgress" fill="#ffc658" name="Progreso %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tabla de comparación */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Detalle Semanal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Semana</TableHead>
                        <TableHead className="text-center">Tareas</TableHead>
                        <TableHead className="text-center">Progreso</TableHead>
                        <TableHead className="text-center">Puntos</TableHead>
                        <TableHead className="text-center">Usuarios Activos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weekComparison.map((week, index) => (
                        <TableRow key={index} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{week.week}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="default">{week.tasksCompleted}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{week.avgProgress}%</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{week.totalPoints}</Badge>
                          </TableCell>
                          <TableCell className="text-center">{week.activeUsers}</TableCell>
                        </TableRow>
                      ))}
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