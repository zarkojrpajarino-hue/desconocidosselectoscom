/**
 * @fileoverview Componente que muestra el contador de días restantes del trial
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface TrialInfo {
  isOnTrial: boolean;
  daysRemaining: number;
  trialEndsAt: Date | null;
  plan: string;
}

export const TrialCountdown = () => {
  const { currentOrganizationId } = useAuth();
  const navigate = useNavigate();
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentOrganizationId) return;

    const fetchTrialInfo = async () => {
      try {
        const { data: org, error } = await supabase
          .from('organizations')
          .select('plan, trial_ends_at, subscription_status')
          .eq('id', currentOrganizationId)
          .single();

        if (error || !org) {
          setLoading(false);
          return;
        }

        const isOnTrial = org.plan === 'trial' && !!org.trial_ends_at;
        let daysRemaining = 0;
        let trialEndDate: Date | null = null;

        if (isOnTrial && org.trial_ends_at) {
          trialEndDate = new Date(org.trial_ends_at);
          const now = new Date();
          const diffTime = trialEndDate.getTime() - now.getTime();
          daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }

        setTrialInfo({
          isOnTrial,
          daysRemaining,
          trialEndsAt: trialEndDate,
          plan: org.plan || 'free'
        });
      } catch (error) {
        console.error('Error fetching trial info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrialInfo();
  }, [currentOrganizationId]);

  if (loading || !trialInfo || !trialInfo.isOnTrial) {
    return null;
  }

  const isUrgent = trialInfo.daysRemaining <= 3;
  const isExpired = trialInfo.daysRemaining === 0;

  if (isExpired) {
    return (
      <Card className="border-destructive bg-destructive/10">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-destructive">Tu periodo de prueba ha terminado</p>
              <p className="text-sm text-muted-foreground">
                Selecciona un plan para continuar usando todas las funciones
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/select-plan')} className="gap-2">
            <Zap className="h-4 w-4" />
            Elegir Plan
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isUrgent ? 'border-warning bg-warning/5' : 'border-primary/20 bg-primary/5'}>
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isUrgent ? 'bg-warning/20' : 'bg-primary/20'}`}>
            <Clock className={`h-5 w-5 ${isUrgent ? 'text-warning' : 'text-primary'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold">
                {trialInfo.daysRemaining === 1 
                  ? '¡Último día de prueba!' 
                  : `${trialInfo.daysRemaining} días de prueba restantes`
                }
              </p>
              <Badge variant={isUrgent ? 'destructive' : 'secondary'}>Trial</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Tu prueba gratuita termina el {trialInfo.trialEndsAt?.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long'
              })}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => navigate('/select-plan')} 
          variant={isUrgent ? 'default' : 'outline'}
          className="gap-2"
        >
          <Zap className="h-4 w-4" />
          Ver Planes
        </Button>
      </CardContent>
    </Card>
  );
};

export default TrialCountdown;
