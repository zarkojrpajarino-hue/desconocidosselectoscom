import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Trophy,
  Target,
  TrendingUp,
  Clock,
  Award,
  BarChart3,
  CheckCircle2,
  Flame,
  Download,
  Building2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

interface ProfileStats {
  totalCompleted: number;
  totalValidated: number;
  totalCollaborative: number;
  averageRating: string | number;
}

interface WeeklyProgressItem {
  week: string;
  tareas: number;
  fecha: string;
}

interface AreaDataItem {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface TaskWithCompletions {
  area: string | null;
  task_completions: Array<{ validated_by_leader: boolean | null }>;
}

interface FeedbackData {
  collaborator_feedback: { rating?: number } | null;
}

interface AchievementsData {
  total_points: number | null;
  current_streak: number | null;
  tasks_completed_total: number | null;
  tasks_validated_total: number | null;
  perfect_weeks: number | null;
}

interface BadgeData {
  id: string;
  earned_at: string | null;
  badges: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    icon_emoji: string | null;
    rarity: string | null;
  };
}

interface RecentTaskData {
  id: string;
  completed_at: string | null;
  tasks: { title: string; area: string | null } | null;
}

const UserProfile = () => {
  const { user, userProfile, currentOrganizationId, userOrganizations } = useAuth();
  const currentOrganization = userOrganizations.find(org => org.organization_id === currentOrganizationId);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgressItem[]>([]);
  const [tasksByArea, setTasksByArea] = useState<AreaDataItem[]>([]);
  const [recentTasks, setRecentTasks] = useState<RecentTaskData[]>([]);
  const [achievements, setAchievements] = useState<AchievementsData | null>(null);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchWeeklyProgress(),
        fetchTasksByArea(),
        fetchRecentTasks(),
        fetchAchievements(),
        fetchBadges(),
      ]);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    // Total de tareas completadas
    const { data: completedTasks } = await supabase
      .from('task_completions')
      .select('*')
      .eq('user_id', user.id)
      .eq('validated_by_leader', true);

    // Tareas validadas como líder
    const { data: validatedTasks } = await supabase
      .from('task_completions')
      .select('*')
      .eq('validated_by_leader', true)
      .not('collaborator_feedback', 'is', null);

    // Tareas colaborativas
    const { data: collaborativeTasks } = await supabase
      .from('tasks')
      .select('*, task_completions(*)')
      .eq('user_id', user.id)
      .not('leader_id', 'is', null);

    // Promedio de rating recibido
    const { data: feedbacks } = await supabase
      .from('task_completions')
      .select('collaborator_feedback')
      .eq('user_id', user.id)
      .not('collaborator_feedback', 'is', null);

    interface CollaboratorFeedbackData {
      collaborator_feedback: { rating?: number } | null;
    }

    const ratings = (feedbacks as CollaboratorFeedbackData[] | null)
      ?.map((f) => f.collaborator_feedback?.rating)
      .filter((r): r is number => typeof r === 'number') || [];
    
    const avgRating = ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : 0;

    interface CollaborativeTaskData {
      task_completions: Array<{ validated_by_leader: boolean | null }>;
    }

    setStats({
      totalCompleted: completedTasks?.length || 0,
      totalValidated: validatedTasks?.length || 0,
      totalCollaborative: (collaborativeTasks as CollaborativeTaskData[] | null)?.filter((t) => 
        t.task_completions?.some((c) => c.validated_by_leader)
      ).length || 0,
      averageRating: avgRating,
    });
  };

  const fetchWeeklyProgress = async () => {
    if (!user) return;

    // Últimas 8 semanas
    const weeks = [];
    const now = new Date();

    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const { data: completed } = await supabase
        .from('task_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('validated_by_leader', true)
        .gte('completed_at', weekStart.toISOString())
        .lt('completed_at', weekEnd.toISOString());

      weeks.push({
        week: `Sem ${8 - i}`,
        tareas: completed?.length || 0,
        fecha: weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      });
    }

    setWeeklyProgress(weeks);
  };

  const fetchTasksByArea = async () => {
    if (!user) return;

    const { data: tasks } = await supabase
      .from('tasks')
      .select('area, task_completions(validated_by_leader)')
      .eq('user_id', user.id);

    const areaCount: Record<string, number> = {};

    interface TaskWithAreaCompletions {
      area: string | null;
      task_completions: Array<{ validated_by_leader: boolean | null }>;
    }

    (tasks as TaskWithAreaCompletions[] | null)?.forEach((task) => {
      if (task.task_completions?.some((c) => c.validated_by_leader)) {
        const area = task.area || 'Sin área';
        areaCount[area] = (areaCount[area] || 0) + 1;
      }
    });

    const areaData = Object.entries(areaCount).map(([name, value]) => ({
      name,
      value,
    }));

    setTasksByArea(areaData);
  };

  const fetchRecentTasks = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('task_completions')
      .select('*, tasks(title, area)')
      .eq('user_id', user.id)
      .eq('validated_by_leader', true)
      .order('completed_at', { ascending: false })
      .limit(10);

    setRecentTasks(data || []);
  };

  const fetchAchievements = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    setAchievements(data);
  };

  const fetchBadges = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_badges')
      .select('*, badges(*)')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false });

    setBadges(data || []);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30';
      case 'epic':
        return 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30';
      case 'rare':
        return 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30';
      default:
        return 'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <User className="w-12 h-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header del perfil - Mobile optimized */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="pt-4 md:pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
            {/* Avatar */}
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-primary flex items-center justify-center text-2xl md:text-4xl font-bold text-white shadow-lg shrink-0">
              {userProfile?.full_name?.charAt(0) || 'U'}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h2 className="text-xl md:text-3xl font-bold mb-1 truncate">{userProfile?.full_name}</h2>
              <p className="text-sm text-muted-foreground mb-2">@{userProfile?.username}</p>
              {currentOrganization && (
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium truncate">{currentOrganization.organization_name}</span>
                  <Badge variant="outline" className="text-xs shrink-0">{currentOrganization.role}</Badge>
                </div>
              )}

              {/* Stats - Horizontal scroll on mobile */}
              <div className="flex gap-3 overflow-x-auto pb-2 sm:pb-0 sm:flex-wrap sm:gap-4 -mx-4 px-4 sm:mx-0 sm:px-0 justify-start">
                <div className="flex items-center gap-1 md:gap-2 shrink-0">
                  <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                  <span className="font-semibold text-sm md:text-base">{achievements?.total_points || 0}</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2 shrink-0">
                  <Flame className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
                  <span className="font-semibold text-sm md:text-base">{achievements?.current_streak || 0}w</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2 shrink-0">
                  <Award className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
                  <span className="font-semibold text-sm md:text-base">{badges.length}</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2 shrink-0">
                  <Target className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                  <span className="font-semibold text-sm md:text-base">{stats?.totalCompleted || 0}</span>
                </div>
              </div>
            </div>

            {/* Botón de exportar - Hidden on mobile */}
            <Button variant="outline" className="gap-2 hidden md:flex shrink-0">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de contenido - Mobile scrollable */}
      <Tabs defaultValue="overview" className="space-y-4 md:space-y-6">
        <TabsList className="flex w-full overflow-x-auto md:grid md:grid-cols-4 gap-1 p-1">
          <TabsTrigger value="overview" className="gap-1 md:gap-2 shrink-0">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Vista</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-1 md:gap-2 shrink-0">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="badges" className="gap-1 md:gap-2 shrink-0">
            <Award className="w-4 h-4" />
            <span className="hidden sm:inline">Badges</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1 md:gap-2 shrink-0">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Historial</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB: Vista General */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards - Grid on all sizes, 2 cols mobile */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tareas Completadas</p>
                    <p className="text-3xl font-bold text-primary">{stats?.totalCompleted || 0}</p>
                  </div>
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tareas Validadas</p>
                    <p className="text-3xl font-bold text-primary">{stats?.totalValidated || 0}</p>
                  </div>
                  <Trophy className="w-10 h-10 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Colaborativas</p>
                    <p className="text-3xl font-bold text-primary">{stats?.totalCollaborative || 0}</p>
                  </div>
                  <User className="w-10 h-10 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Rating Promedio</p>
                    <p className="text-3xl font-bold text-primary">{stats?.averageRating || 0}</p>
                    <div className="flex text-yellow-500 text-sm mt-1">
                      {'⭐'.repeat(Math.round(parseFloat(String(stats?.averageRating || '0'))))}
                    </div>
                  </div>
                  <Award className="w-10 h-10 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfica de progreso semanal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Progreso Últimas 8 Semanas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="tareas"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ fill: '#6366f1', r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Estadísticas */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tareas por área */}
            <Card>
              <CardHeader>
                <CardTitle>Tareas por Área</CardTitle>
              </CardHeader>
              <CardContent>
                {tasksByArea.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={tasksByArea}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {tasksByArea.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No hay datos de áreas disponibles
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progreso de achievements */}
            <Card>
              <CardHeader>
                <CardTitle>Progreso de Logros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Tareas Completadas</span>
                    <span className="font-semibold">{achievements?.tasks_completed_total || 0} / 200</span>
                  </div>
                  <Progress value={((achievements?.tasks_completed_total || 0) / 200) * 100} />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Tareas Validadas</span>
                    <span className="font-semibold">{achievements?.tasks_validated_total || 0} / 100</span>
                  </div>
                  <Progress value={((achievements?.tasks_validated_total || 0) / 100) * 100} className="[&>div]:bg-yellow-500" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Racha Actual</span>
                    <span className="font-semibold">{achievements?.current_streak || 0} / 20 semanas</span>
                  </div>
                  <Progress value={((achievements?.current_streak || 0) / 20) * 100} className="[&>div]:bg-orange-500" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Semanas Perfectas</span>
                    <span className="font-semibold">{achievements?.perfect_weeks || 0} / 10</span>
                  </div>
                  <Progress value={((achievements?.perfect_weeks || 0) / 10) * 100} className="[&>div]:bg-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: Badges */}
        <TabsContent value="badges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Colección de Badges ({badges.length}/19)</CardTitle>
            </CardHeader>
            <CardContent>
              {badges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {badges.map((userBadge) => (
                    <div
                      key={userBadge.id}
                      className={`p-4 rounded-lg border-2 text-center transition-all hover:scale-105 ${getRarityColor(
                        userBadge.badges.rarity
                      )}`}
                    >
                      <div className="text-5xl mb-2">{userBadge.badges.icon_emoji}</div>
                      <p className="text-xs font-bold mb-1">{userBadge.badges.name}</p>
                      <p className="text-xs opacity-70 mb-2">{userBadge.badges.description}</p>
                      <Badge variant="secondary" className="text-xs">
                        {userBadge.badges.rarity}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(userBadge.earned_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Aún no has desbloqueado ningún badge</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Historial */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Últimas 10 Tareas Completadas</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTasks.length > 0 ? (
                <div className="space-y-3">
                  {recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{task.tasks.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {task.tasks.area && (
                            <Badge variant="secondary" className="text-xs">
                              {task.tasks.area}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(task.completed_at).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No hay tareas completadas aún</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile;
