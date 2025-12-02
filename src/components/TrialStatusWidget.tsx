import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export const TrialStatusWidget = () => {
  const navigate = useNavigate();
  const { user, currentOrganizationId } = useAuth();
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrialStatus = async () => {
      if (!user || !currentOrganizationId) return;

      try {
        const { data: org, error } = await supabase
          .from('organizations')
          .select('created_at, trial_ends_at, plan')
          .eq('id', currentOrganizationId)
          .single();

        if (error || !org) {
          setLoading(false);
          return;
        }

        // Si no está en trial, no mostrar el widget
        if (org.plan !== 'trial' && org.plan !== 'free') {
          setLoading(false);
          return;
        }

        const trialDurationDays = 14;
        const trialStart = new Date(org.created_at);
        const now = new Date();
        const daysElapsed = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
        const remaining = Math.max(0, trialDurationDays - daysElapsed);
        const progress = Math.min(100, (daysElapsed / trialDurationDays) * 100);

        setDaysRemaining(remaining);
        setProgressPercentage(progress);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching trial status:', error);
        setLoading(false);
      }
    };

    fetchTrialStatus();
  }, [user, currentOrganizationId]);

  if (loading || daysRemaining === null) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg mb-6">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-shrink-0">
            <Badge variant="secondary" className="text-sm font-semibold px-3 py-1">
              🆓 Versión Gratuita
            </Badge>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm text-muted-foreground mb-1">
              Tiempo restante del trial:
            </p>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-primary">
                {daysRemaining} días
              </span>
              <Progress value={progressPercentage} className="flex-1 h-2" />
            </div>
          </div>
          
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => navigate('/pricing')}
            className="gap-2 flex-shrink-0"
          >
            Ver Planes
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
