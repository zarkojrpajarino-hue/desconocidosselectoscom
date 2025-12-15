/**
 * SUBSCRIPTION BANNER - Banner de información de plan en dashboard
 * ✅ Multi-org safe: Usa currentOrganizationId
 * ✅ Muestra plan actual, fechas y días restantes
 * ✅ Botón "Subir Plan" si no es Enterprise
 * ✅ Estados: active, trial, free, past_due, canceled
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Crown, 
  Rocket, 
  Zap, 
  Sparkles, 
  ArrowUp, 
  AlertCircle, 
  Calendar,
  CreditCard 
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Iconos por plan
const PLAN_ICONS = {
  free: Sparkles,
  trial: Sparkles,
  starter: Zap,
  professional: Rocket,
  enterprise: Crown,
};

// Colores por plan (usando semantic tokens)
const PLAN_COLORS = {
  free: 'text-muted-foreground',
  trial: 'text-primary',
  starter: 'text-emerald-600 dark:text-emerald-400',
  professional: 'text-violet-600 dark:text-violet-400',
  enterprise: 'text-amber-600 dark:text-amber-400',
};

// Nombres por plan
const PLAN_NAMES = {
  free: 'Free',
  trial: 'Trial',
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

export function SubscriptionBanner() {
  const { currentOrganizationId } = useAuth();
  const navigate = useNavigate();

  // Obtener información de la organización actual
  const { data: org, isLoading } = useQuery({
    queryKey: ['subscription-banner', currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return null;

      const { data, error } = await supabase
        .from('organizations')
        .select('plan, subscription_status, current_period_end, trial_ends_at, created_at')
        .eq('id', currentOrganizationId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!currentOrganizationId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  // Si está cargando o no hay org, no mostrar
  if (isLoading || !org) return null;

  const plan = org.plan as keyof typeof PLAN_NAMES;
  const status = org.subscription_status;
  const Icon = PLAN_ICONS[plan] || Sparkles;

  // Calcular fechas y días restantes
  const now = new Date();
  let startDate: Date | null = null;
  let endDate: Date | null = null;
  let daysRemaining: number | null = null;

  if (plan === 'trial' || plan === 'free') {
    // Trial o Free: usar trial_ends_at o calcular desde created_at
    if (org.trial_ends_at) {
      endDate = new Date(org.trial_ends_at);
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 14); // 14 días antes
    } else if (org.created_at) {
      startDate = new Date(org.created_at);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 14);
    }
  } else {
    // Plan de pago: usar current_period_end
    if (org.current_period_end) {
      endDate = new Date(org.current_period_end);
      startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 1); // 1 mes antes
    }
  }

  // Calcular días restantes (solo mostrar si ≤7 días)
  if (endDate) {
    const diffMs = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays <= 7) {
      daysRemaining = diffDays;
    }
  }

  // Formatear fechas (formato: 1/12/2025)
  const formatDate = (date: Date) => format(date, 'd/M/yyyy');

  // Determinar qué mostrar según el estado
  const renderContent = () => {
    // Estado: Canceled
    if (status === 'canceled') {
      return (
        <>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium">Cancelado</span>
            <span className="text-xs text-muted-foreground">· Ahora en Free</span>
          </div>
          <Button 
            size="sm" 
            variant="default"
            onClick={() => navigate('/pricing')}
            className="h-7 text-xs"
          >
            Ver Planes
          </Button>
        </>
      );
    }

    // Estado: Past Due
    if (status === 'past_due') {
      return (
        <>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">Pago pendiente</span>
          </div>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => navigate('/settings/billing')}
            className="h-7 text-xs"
          >
            <CreditCard className="w-3 h-3 mr-1" />
            Actualizar Método
          </Button>
        </>
      );
    }

    // Estado: Normal (Active, Trial, Free)
    return (
      <>
        {/* Plan name y fechas */}
        <div className="flex items-center gap-2 flex-wrap">
          <Icon className={`w-4 h-4 ${PLAN_COLORS[plan]}`} />
          <span className="text-sm font-medium">{PLAN_NAMES[plan]}</span>
          
          {/* Fechas (si existen) */}
          {startDate && endDate && (
            <>
              <span className="text-xs text-muted-foreground hidden sm:inline">·</span>
              <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>
                  {formatDate(startDate)} - {formatDate(endDate)}
                </span>
              </div>
            </>
          )}

          {/* Días restantes (solo si ≤7 días) */}
          {daysRemaining !== null && (
            <>
              <span className="text-xs text-muted-foreground">·</span>
              <Badge 
                variant={daysRemaining <= 2 ? "destructive" : daysRemaining <= 5 ? "default" : "secondary"}
                className="text-xs"
              >
                {daysRemaining === 0 ? 'Expira hoy' : `${daysRemaining} días`}
              </Badge>
            </>
          )}
        </div>

        {/* Botón "Subir Plan" (solo si NO es Enterprise) */}
        {plan !== 'enterprise' && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate('/pricing')}
            className="h-7 text-xs"
          >
            <ArrowUp className="w-3 h-3 mr-1" />
            {plan === 'free' || plan === 'trial' ? 'Actualizar' : 'Subir Plan'}
          </Button>
        )}
      </>
    );
  };

  return (
    <div className="flex items-center gap-3 px-3 md:px-4 py-2 bg-card border border-border rounded-lg shadow-sm">
      {renderContent()}
    </div>
  );
}
