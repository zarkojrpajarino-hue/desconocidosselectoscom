import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, Award, TrendingUp, Flame, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface UserMetricsStats {
  user_id: string;
  full_name: string;
  total_updates: number;
  last_update: string;
  streak_days: number;
  badge_level: 'beginner' | 'intermediate' | 'expert' | 'master';
}

const MetricsLeaderboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<UserMetricsStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserMetricsStats | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [user]);

  const loadLeaderboard = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get all users metrics counts
      const { data: metricsData, error } = await supabase
        .from('business_metrics')
        .select(`
          user_id,
          metric_date,
          updated_at
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get all users info
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, role')
        .neq('role', 'admin');

      if (!usersData || !metricsData) return;

      // Count updates per user and calculate stats
      const userStatsMap = new Map<string, UserMetricsStats>();
      
      usersData.forEach(userData => {
        const userMetrics = metricsData.filter(m => m.user_id === userData.id);
        const totalUpdates = userMetrics.length;
        const lastUpdate = userMetrics[0]?.updated_at || '';
        
        // Calculate streak (simplified: consecutive updates)
        let streak = 0;
        const sortedMetrics = userMetrics
          .map(m => new Date(m.metric_date))
          .sort((a, b) => b.getTime() - a.getTime());
        
        for (let i = 0; i < sortedMetrics.length - 1; i++) {
          const diff = Math.abs(sortedMetrics[i].getTime() - sortedMetrics[i + 1].getTime());
          const daysDiff = Math.ceil(diff / (1000 * 60 * 60 * 24));
          if (daysDiff <= 7) streak++;
          else break;
        }

        // Determine badge level
        let badgeLevel: 'beginner' | 'intermediate' | 'expert' | 'master' = 'beginner';
        if (totalUpdates >= 20) badgeLevel = 'master';
        else if (totalUpdates >= 10) badgeLevel = 'expert';
        else if (totalUpdates >= 5) badgeLevel = 'intermediate';

        userStatsMap.set(userData.id, {
          user_id: userData.id,
          full_name: userData.full_name,
          total_updates: totalUpdates,
          last_update: lastUpdate,
          streak_days: streak,
          badge_level: badgeLevel
        });
      });

      const sortedStats = Array.from(userStatsMap.values())
        .sort((a, b) => b.total_updates - a.total_updates);

      setLeaderboard(sortedStats);
      
      // Find current user stats
      const currentUserStats = sortedStats.find(s => s.user_id === user.id);
      setUserStats(currentUserStats || null);

    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (level: string) => {
    switch(level) {
      case 'master': return <Trophy className="w-5 h-5 text-amber-500" />;
      case 'expert': return <Medal className="w-5 h-5 text-purple-500" />;
      case 'intermediate': return <Award className="w-5 h-5 text-blue-500" />;
      default: return <Star className="w-5 h-5 text-gray-400" />;
    }
  };

  const getBadgeLabel = (level: string) => {
    switch(level) {
      case 'master': return 'Maestro del KPI';
      case 'expert': return 'Experto';
      case 'intermediate': return 'En progreso';
      default: return 'Principiante';
    }
  };

  const getRankIcon = (index: number) => {
    switch(index) {
      case 0: return <Trophy className="w-6 h-6 text-amber-500" />;
      case 1: return <Medal className="w-6 h-6 text-gray-400" />;
      case 2: return <Medal className="w-6 h-6 text-amber-700" />;
      default: return <span className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">#{index + 1}</span>;
    }
  };

  if (loading) return null;

  return (
    <Card className="border-2 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Métricas Obtenidas de la Empresa
            </CardTitle>
            <CardDescription className="mt-2">
              Ranking de usuarios por actualizaciones de KPI's - ¡Motívate y lidera el tablero!
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User's Own Stats */}
        {userStats && (
          <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {getBadgeIcon(userStats.badge_level)}
                  <div>
                    <p className="font-semibold">Tu Progreso</p>
                    <p className="text-sm text-muted-foreground">{getBadgeLabel(userStats.badge_level)}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-2xl font-bold text-primary">{userStats.total_updates}</p>
                    <p className="text-xs text-muted-foreground">actualizaciones</p>
                  </div>
                  {userStats.streak_days > 0 && (
                    <div className="flex items-center gap-1">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-xl font-bold text-orange-500">{userStats.streak_days}</p>
                        <p className="text-xs text-muted-foreground">racha</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Progreso al siguiente nivel</span>
                <span className="font-semibold">
                  {userStats.badge_level === 'beginner' && `${userStats.total_updates}/5`}
                  {userStats.badge_level === 'intermediate' && `${userStats.total_updates}/10`}
                  {userStats.badge_level === 'expert' && `${userStats.total_updates}/20`}
                  {userStats.badge_level === 'master' && 'Nivel máximo alcanzado'}
                </span>
              </div>
              <Progress 
                value={
                  userStats.badge_level === 'beginner' ? (userStats.total_updates / 5) * 100 :
                  userStats.badge_level === 'intermediate' ? (userStats.total_updates / 10) * 100 :
                  userStats.badge_level === 'expert' ? (userStats.total_updates / 20) * 100 :
                  100
                } 
                className="h-2"
              />
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Ranking del Equipo
          </h3>
          <div className="space-y-2">
            {leaderboard.map((stats, index) => (
              <div 
                key={stats.user_id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                  stats.user_id === user?.id 
                    ? 'bg-primary/10 border-primary/50 hover:bg-primary/15' 
                    : 'bg-muted/30 border-muted hover:bg-muted/50'
                }`}
                onClick={() => navigate(`/user-metrics/${stats.user_id}`)}
              >
                <div className="flex items-center gap-3 flex-1">
                  {getRankIcon(index)}
                  <div className="flex-1">
                    <p className={`font-semibold ${stats.user_id === user?.id ? 'text-primary' : ''}`}>
                      {stats.full_name}
                      {stats.user_id === user?.id && <span className="ml-2 text-xs">(Tú)</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {getBadgeIcon(stats.badge_level)}
                      <span className="text-xs text-muted-foreground">
                        {getBadgeLabel(stats.badge_level)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-lg font-bold">{stats.total_updates}</p>
                      <p className="text-xs text-muted-foreground">actualizaciones</p>
                    </div>
                    {stats.streak_days > 0 && (
                      <div className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-semibold text-orange-500">{stats.streak_days}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements info */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-semibold mb-3 text-sm">🏆 Niveles de Logro</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs font-semibold">Principiante</p>
                <p className="text-xs text-muted-foreground">0-4 updates</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-xs font-semibold">En Progreso</p>
                <p className="text-xs text-muted-foreground">5-9 updates</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Medal className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-xs font-semibold">Experto</p>
                <p className="text-xs text-muted-foreground">10-19 updates</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-xs font-semibold">Maestro</p>
                <p className="text-xs text-muted-foreground">20+ updates</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricsLeaderboard;
