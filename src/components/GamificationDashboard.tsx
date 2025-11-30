import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Flame, Star, Target, Crown, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const GamificationDashboard = () => {
  const { user } = useAuth();
  const [achievement, setAchievement] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [recentPoints, setRecentPoints] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    
    fetchGamificationData();
    
    // FASE 1: Suscripción a cambios en tiempo real con cleanup
    const channel = supabase
      .channel('gamification-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchGamificationData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchGamificationData = async () => {
    try {
      // Achievements
      const { data: achievementData, error: achievementError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (achievementError) throw achievementError;
      setAchievement(achievementData);

      // Badges del usuario
      const { data: badgesData, error: badgesError } = await supabase
        .from('user_badges')
        .select('*, badges(*)')
        .eq('user_id', user?.id)
        .order('earned_at', { ascending: false });
      
      if (badgesError) throw badgesError;
      setBadges(badgesData || []);

      // Leaderboard (top 10)
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('user_achievements')
        .select('*, users(username, full_name)')
        .order('total_points', { ascending: false })
        .limit(10);
      
      if (leaderboardError) throw leaderboardError;
      setLeaderboard(leaderboardData || []);

      // Historial reciente de puntos
      const { data: pointsData, error: pointsError } = await supabase
        .from('points_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (pointsError) throw pointsError;
      setRecentPoints(pointsData || []);
    } catch (error) {
      // FASE 1: Error handling mejorado
      console.error('Error fetching gamification data:', error);
      toast.error('Error al cargar datos de gamificación');
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-900 dark:text-yellow-300';
      case 'epic': return 'border-purple-500 bg-purple-50 dark:bg-purple-950/20 text-purple-900 dark:text-purple-300';
      case 'rare': return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300';
      default: return 'border-border bg-muted text-foreground';
    }
  };

  const getUserRank = () => {
    const index = leaderboard.findIndex(entry => entry.user_id === user?.id);
    return index >= 0 ? index + 1 : '?';
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Puntos Totales</p>
                <p className="text-3xl font-bold text-foreground">{achievement?.total_points || 0}</p>
              </div>
              <Trophy className="w-12 h-12 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Racha Actual</p>
                <p className="text-3xl font-bold flex items-center gap-2 text-foreground">
                  {achievement?.current_streak || 0}
                  <Flame className="w-6 h-6 text-orange-500" />
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                Mejor: {achievement?.best_streak || 0}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Badges</p>
                <p className="text-3xl font-bold text-foreground">{badges.length}</p>
              </div>
              <Award className="w-12 h-12 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ranking</p>
                <p className="text-3xl font-bold text-foreground">#{getUserRank()}</p>
              </div>
              <Crown className="w-12 h-12 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Mis Badges ({badges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {badges.map((userBadge) => (
              <div
                key={userBadge.id}
                className={`p-4 rounded-lg border-2 text-center transition-transform hover:scale-105 ${getRarityColor(userBadge.badges.rarity)}`}
              >
                <div className="text-4xl mb-2">{userBadge.badges.icon_emoji}</div>
                <p className="text-xs font-semibold">{userBadge.badges.name}</p>
                <p className="text-xs opacity-70 mt-1">{userBadge.badges.description}</p>
              </div>
            ))}
          </div>
          {badges.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Aún no has desbloqueado ningún badge. ¡Completa tareas para ganar tu primero!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Leaderboard del Equipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboard.map((entry, index) => {
              const isCurrentUser = entry.user_id === user?.id;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 p-3 rounded-lg ${
                    isCurrentUser ? 'bg-primary/10 border-2 border-primary' : 'bg-muted/50'
                  }`}
                >
                  <div className="text-2xl font-bold w-8">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `#${index + 1}`}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {entry.users?.full_name || entry.users?.username}
                      {isCurrentUser && <span className="text-xs ml-2 text-primary">(Tú)</span>}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{entry.tasks_completed_total} tareas</span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        {entry.current_streak} semanas
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{entry.total_points}</p>
                    <p className="text-xs text-muted-foreground">puntos</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Historial reciente de puntos */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentPoints.map((point) => (
              <div key={point.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                <span className="text-sm text-foreground">{point.reason}</span>
                <span className="font-bold text-success">+{point.points} pts</span>
              </div>
            ))}
          </div>
          {recentPoints.length === 0 && (
            <p className="text-center text-muted-foreground py-4">Sin actividad reciente</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GamificationDashboard;
