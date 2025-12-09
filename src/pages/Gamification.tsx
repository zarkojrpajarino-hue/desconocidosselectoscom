import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Share2 } from 'lucide-react';
import GamificationDashboard from '@/components/GamificationDashboard';
import { IntegrationButton } from '@/components/IntegrationButton';
import { supabase } from '@/integrations/supabase/client';

const Gamification = () => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [userPoints, setUserPoints] = useState(0);
  const [userBadges, setUserBadges] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserGamificationData();
    }
  }, [user]);

  const fetchUserGamificationData = async () => {
    if (!user) return;
    
    try {
      // Fetch badges - user_badges exists in the schema
      const { data: badgesData } = await supabase
        .from('user_badges')
        .select('badge_id, badges(name)')
        .eq('user_id', user.id);
      
      if (badgesData) {
        const badgeNames = badgesData
          .map((b) => (b as { badges?: { name?: string } }).badges?.name)
          .filter(Boolean) as string[];
        setUserBadges(badgeNames);
      }

      // Count points from task completions as a proxy
      const { count } = await supabase
        .from('task_completions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('validated_by_leader', true);
      
      // Rough calculation: 50 points per completed task
      setUserPoints((count || 0) * 50);
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background pb-20 md:pb-0">
      <Button
        variant="outline"
        onClick={() => navigate('/home')}
        size="sm"
        className="fixed top-3 right-3 md:top-4 md:right-4 z-50 gap-1 md:gap-2 shadow-lg"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Volver al Menú</span>
      </Button>

      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-7xl">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-1 md:mb-2">
              🏆 Gamificación
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Tu progreso, badges y ranking en el equipo
            </p>
          </div>
          
          {/* Compartir logros en Slack */}
          <IntegrationButton
            type="slack"
            action="notify"
            data={{
              message: `🏆 *Logros de ${userProfile?.full_name}*\n\n` +
                `⭐ Puntos totales: ${userPoints.toLocaleString()}\n` +
                `🎖️ Badges: ${userBadges.length > 0 ? userBadges.join(', ') : 'Aún sin badges'}\n\n` +
                `_¡Sigue así! 💪_`,
              channel: '#achievements'
            }}
            label="Compartir logros"
            variant="outline"
          />
        </div>

        <GamificationDashboard />
      </div>
    </div>
  );
};

export default Gamification;
