/**
 * TRIAL STATUS WIDGET - VERSIÓN CORREGIDA
 * 
 * ✅ CORREGIDO: Usa trial_ends_at en vez de created_at
 * ✅ CORREGIDO: Variables de estado correctas
 * ✅ CORREGIDO: Lógica de cálculo precisa
 * ✅ OPTIMIZADO: Un solo useState
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export const TrialStatusWidget = () => {
  const navigate = useNavigate();
  const { user, currentOrganizationId } = useAuth();
  
  // ✅ OPTIMIZADO: Un solo estado objeto
  const [trialState, setTrialState] = useState({
    daysRemaining: null as number | null,
    hoursRemaining: null as number | null,
    progressPercentage: 0,
    loading: true,
    hasTrialEndsAt: false
  });

  useEffect(() => {
    const fetchTrialStatus = async () => {
      if (!user || !currentOrganizationId) return;

      try {
        const { data: org, error } = await supabase
          .from('organizations')
          .select('created_at, trial_ends_at, plan')
          .eq('id', currentOrganizationId)
          .maybeSingle(); // ✅ CORREGIDO: .maybeSingle() en vez de .single()

        if (error || !org) {
          setTrialState(prev => ({ ...prev, loading: false }));
          return;
        }

        // Si no está en trial/free, no mostrar el widget
        if (org.plan !== 'trial' && org.plan !== 'free') {
          setTrialState(prev => ({ ...prev, loading: false }));
          return;
        }

        const now = new Date();
        let daysRemaining: number;
        let hoursRemaining: number;
        let progressPercentage: number;
        let hasTrialEndsAt = false;

        // ✅ CORREGIDO: Usar trial_ends_at si existe (es la fuente de verdad)
        if (org.trial_ends_at) {
          hasTrialEndsAt = true;
          const trialEnd = new Date(org.trial_ends_at);
          const trialStart = new Date(trialEnd.getTime() - (14 * 24 * 60 * 60 * 1000)); // 14 días antes
          
          const timeRemaining = trialEnd.getTime() - now.getTime();
          
          // Calcular días y horas restantes
          daysRemaining = Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)));
          hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)));
          
          // Calcular progreso desde el inicio del trial
          const totalDuration = trialEnd.getTime() - trialStart.getTime();
          const elapsed = now.getTime() - trialStart.getTime();
          progressPercentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
        } else {
          // ✅ Fallback: Si no hay trial_ends_at, usar created_at
          // (solo para organizaciones antiguas)
          const trialDurationDays = 14;
          const trialStart = new Date(org.created_at);
          const daysElapsed = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
          
          daysRemaining = Math.max(0, trialDurationDays - daysElapsed);
          hoursRemaining = Math.max(0, (trialDurationDays - daysElapsed) * 24);
          progressPercentage = Math.min(100, (daysElapsed / trialDurationDays) * 100);
        }

        // ✅ CORREGIDO: Un solo setState
        setTrialState({
          daysRemaining,
          hoursRemaining,
          progressPercentage,
          loading: false,
          hasTrialEndsAt
        });

      } catch (error: unknown) {
        // ✅ CORREGIDO: error: unknown en vez de any
        console.error('Error fetching trial status:', error);
        setTrialState(prev => ({ ...prev, loading: false }));
      }
    };

    fetchTrialStatus();

    // ✅ Actualizar cada hora para mantener el contador preciso
    const interval = setInterval(fetchTrialStatus, 60 * 60 * 1000); // Cada hora

    return () => clearInterval(interval);
  }, [user, currentOrganizationId]);

  // ✅ CORREGIDO: Usar trialState.loading y trialState.daysRemaining
  if (trialState.loading || trialState.daysRemaining === null) return null;

  // Determinar color del badge según días restantes
  const getBadgeColor = () => {
    if (trialState.daysRemaining <= 2) return 'destructive';
    if (trialState.daysRemaining <= 5) return 'default';
    return 'secondary';
  };

  // Determinar mensaje según días restantes
  const getMessage = () => {
    if (trialState.daysRemaining === 0) {
      return `${trialState.hoursRemaining} horas`;
    }
    return `${trialState.daysRemaining} días`;
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg mb-6">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-shrink-0">
            <Badge 
              variant={getBadgeColor()} 
              className="text-sm font-semibold px-3 py-1"
            >
              {trialState.daysRemaining <= 2 ? (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  ⏰ Trial Expirando
                </>
              ) : (
                '🆓 Versión Gratuita'
              )}
            </Badge>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm text-muted-foreground mb-1">
              Tiempo restante del trial:
            </p>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-primary">
                {getMessage()}
              </span>
              <Progress 
                value={trialState.progressPercentage} 
                className="flex-1 h-2"
              />
            </div>
            {trialState.daysRemaining <= 2 && (
              <p className="text-xs text-destructive mt-1">
                ⚠️ Tu trial está por expirar. Actualiza ahora para no perder acceso.
              </p>
            )}
          </div>
          
          <Button 
            variant={trialState.daysRemaining <= 2 ? "default" : "outline"}
            size="sm" 
            onClick={() => navigate('/select-plan')}
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

export default TrialStatusWidget;
