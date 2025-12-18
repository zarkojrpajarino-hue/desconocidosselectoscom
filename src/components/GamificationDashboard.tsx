import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Flame, Star, Target, Crown, Award, Lock, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  DEMO_BADGES, 
  DEMO_ACHIEVEMENT, 
  DEMO_LEADERBOARD, 
  DEMO_POINTS_HISTORY,
  ALL_BADGES,
  LEVELS,
  getLevelFromPoints,
  getProgressToNextLevel
} from '@/data/demo-gamification-alerts-data';

interface UserAchievement {
  id: string;
  user_id: string;
  total_points: number;
  current_streak: number;
  best_streak: number;
  tasks_completed_total: number;
}

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon_emoji: string;
  rarity: string;
}

interface UserBadgeWithDetails {
  id: string;
  badges: BadgeData;
}

interface LeaderboardEntry {
  id: string;
  user_id: string;
  total_points: number;
  current_streak: number;
  tasks_completed_total: number;
  users?: {
    username?: string;
    full_name?: string;
  };
}

interface PointsHistoryEntry {
  id: string;
  reason: string;
  points: number;
  created_at: string;
}

const GamificationDashboard = () => {
  const { user, currentOrganizationId } = useAuth();
  const [achievement, setAchievement] = useState<UserAchievement | null>(null);
  const [badges, setBadges] = useState<UserBadgeWithDetails[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [recentPoints, setRecentPoints] = useState<PointsHistoryEntry[]>([]);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    if (user && currentOrganizationId) {
      fetchGamificationData();
    }
    
    const channel = supabase
      .channel('gamification-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchGamificationData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentOrganizationId]);

  const fetchGamificationData = async () => {
    if (!currentOrganizationId) return;
    
    try {
      const { data: achievementData } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      setAchievement(achievementData || null);

      const { data: badgesData } = await supabase
        .from('user_badges')
        .select('*, badges(*)')
        .eq('user_id', user?.id)
        .order('earned_at', { ascending: false });
      
      setBadges(badgesData || []);

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('organization_id', currentOrganizationId);
      
      const userIds = userRoles?.map(ur => ur.user_id) || [];
      
      if (userIds.length > 0) {
        const { data: leaderboardData } = await supabase
          .from('user_achievements')
          .select(`
            *, 
            users(username, full_name)
          `)
          .in('user_id', userIds)
          .order('total_points', { ascending: false })
          .limit(10);
        
        setLeaderboard(leaderboardData || []);
      } else {
        setLeaderboard([]);
      }

      const { data: pointsData } = await supabase
        .from('points_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentPoints(pointsData || []);
    } catch (error) {
      logger.debug('Gamification data not yet initialized:', error);
      setAchievement(null);
      setBadges([]);
      setLeaderboard([]);
      setRecentPoints([]);
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

  const getRarityBadgeVariant = (rarity: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (rarity) {
      case 'legendary': return 'destructive';
      case 'epic': return 'default';
      case 'rare': return 'secondary';
      default: return 'outline';
    }
  };

  const getUserRank = () => {
    const data = showDemo ? DEMO_LEADERBOARD : leaderboard;
    const userId = showDemo ? 'demo-user' : user?.id;
    const index = data.findIndex(entry => entry.user_id === userId);
    return index >= 0 ? index + 1 : '?';
  };

  // Use demo or real data
  const displayAchievement = showDemo ? DEMO_ACHIEVEMENT : achievement;
  const displayBadges = showDemo ? DEMO_BADGES : badges;
  const displayLeaderboard = showDemo ? DEMO_LEADERBOARD : leaderboard;
  const displayRecentPoints = showDemo ? DEMO_POINTS_HISTORY : recentPoints;

  const currentLevel = getLevelFromPoints(displayAchievement?.total_points || 0);
  const progressToNext = getProgressToNextLevel(displayAchievement?.total_points || 0);
  const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1);

  return (
    <div className="space-y-6">
      {/* Demo Toggle */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground">Modo Demo</span>
        <Switch checked={showDemo} onCheckedChange={setShowDemo} />
      </div>

      {/* Level Card */}
      <Card className="shadow-card bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className={`text-5xl ${currentLevel.color}`}>{currentLevel.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-foreground">Nivel {currentLevel.level}: {currentLevel.name}</h3>
                <Badge variant="outline" className="text-xs">
                  {displayAchievement?.total_points || 0} pts
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progreso al siguiente nivel</span>
                  {nextLevel && <span>{nextLevel.name} ({nextLevel.minPoints} pts)</span>}
                </div>
                <Progress value={progressToNext} className="h-3" />
              </div>
            </div>
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-4 md:pt-6 p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Puntos</p>
                <p className="text-xl md:text-3xl font-bold text-foreground">{displayAchievement?.total_points || 0}</p>
              </div>
              <Trophy className="w-8 h-8 md:w-12 md:h-12 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-4 md:pt-6 p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Racha</p>
                <p className="text-xl md:text-3xl font-bold flex items-center gap-1 md:gap-2 text-foreground">
                  {displayAchievement?.current_streak || 0}
                  <Flame className="w-4 h-4 md:w-6 md:h-6 text-orange-500" />
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                Mejor: {displayAchievement?.best_streak || 0}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-4 md:pt-6 p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Badges</p>
                <p className="text-xl md:text-3xl font-bold text-foreground">{displayBadges.length}</p>
              </div>
              <Award className="w-8 h-8 md:w-12 md:h-12 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="pt-4 md:pt-6 p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Ranking</p>
                <p className="text-xl md:text-3xl font-bold text-foreground">#{getUserRank()}</p>
              </div>
              <Crown className="w-8 h-8 md:w-12 md:h-12 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earned Badges */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Award className="w-5 h-5" />
            Mis Badges ({displayBadges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {displayBadges.map((userBadge) => (
              <div
                key={userBadge.id}
                className={`p-3 md:p-4 rounded-lg border-2 text-center transition-transform hover:scale-105 ${getRarityColor(userBadge.badges.rarity)}`}
              >
                <div className="text-3xl md:text-4xl mb-2">{userBadge.badges.icon_emoji}</div>
                <p className="text-xs font-semibold">{userBadge.badges.name}</p>
                <Badge variant={getRarityBadgeVariant(userBadge.badges.rarity)} className="text-[10px] mt-1">
                  {userBadge.badges.rarity}
                </Badge>
              </div>
            ))}
          </div>
          {displayBadges.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Aún no has desbloqueado ningún badge. ¡Completa tareas para ganar tu primero!
            </p>
          )}
        </CardContent>
      </Card>

      {/* All Badges to Unlock */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Target className="w-5 h-5" />
            Badges por Desbloquear
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ALL_BADGES.map((badge) => {
              const isUnlocked = displayBadges.some(ub => ub.badges.name === badge.name);
              return (
                <div
                  key={badge.code}
                  className={`p-3 rounded-lg border flex items-center gap-3 ${
                    isUnlocked 
                      ? 'bg-primary/10 border-primary' 
                      : 'bg-muted/30 border-border opacity-60'
                  }`}
                >
                  <div className={`text-2xl ${!isUnlocked && 'grayscale'}`}>
                    {isUnlocked ? badge.icon_emoji : <Lock className="w-6 h-6 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{badge.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{badge.description}</p>
                    <Badge variant={getRarityBadgeVariant(badge.rarity)} className="text-[10px] mt-1">
                      {badge.requirement}
                    </Badge>
                  </div>
                  {isUnlocked && <Star className="w-5 h-5 text-yellow-500 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Trophy className="w-5 h-5" />
            Leaderboard del Equipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {displayLeaderboard.map((entry, index) => {
              const userId = showDemo ? 'demo-user' : user?.id;
              const isCurrentUser = entry.user_id === userId;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-lg ${
                    isCurrentUser ? 'bg-primary/10 border-2 border-primary' : 'bg-muted/50'
                  }`}
                >
                  <div className="text-xl md:text-2xl font-bold w-8">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `#${index + 1}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm md:text-base truncate">
                      {entry.users?.full_name || entry.users?.username}
                      {isCurrentUser && <span className="text-xs ml-2 text-primary">(Tú)</span>}
                    </p>
                    <div className="flex items-center gap-2 md:gap-4 text-xs text-muted-foreground">
                      <span>{entry.tasks_completed_total} tareas</span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        {entry.current_streak} sem
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg md:text-2xl font-bold text-primary">{entry.total_points}</p>
                    <p className="text-xs text-muted-foreground">pts</p>
                  </div>
                </div>
              );
            })}
            {displayLeaderboard.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No hay datos de leaderboard aún
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Star className="w-5 h-5" />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {displayRecentPoints.map((point) => (
              <div key={point.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                <span className="text-xs md:text-sm text-foreground truncate flex-1">{point.reason}</span>
                <span className="font-bold text-green-600 dark:text-green-400 ml-2">+{point.points} pts</span>
              </div>
            ))}
          </div>
          {displayRecentPoints.length === 0 && (
            <p className="text-center text-muted-foreground py-4">Sin actividad reciente</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GamificationDashboard;
