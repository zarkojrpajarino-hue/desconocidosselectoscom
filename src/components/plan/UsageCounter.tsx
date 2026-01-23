import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { Users, Target, Sparkles, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface UsageCounterProps {
  type: 'users' | 'leads' | 'okrs' | 'ai_analysis';
  showUpgradeButton?: boolean;
  compact?: boolean;
}

export function UsageCounter({ type, showUpgradeButton = true, compact = false }: UsageCounterProps) {
  const navigate = useNavigate();
  const {
    plan,
    limits,
    isLoading,
    userCount,
    leadCount,
    okrCount,
    aiAnalysisCount,
  } = useSubscriptionLimits();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const configs = {
    users: {
      label: 'Usuarios',
      icon: Users,
      current: userCount,
      limit: limits.max_users,
      color: 'text-blue-500',
    },
    leads: {
      label: 'Leads este mes',
      icon: Target,
      current: leadCount,
      limit: limits.max_leads_per_month,
      color: 'text-green-500',
    },
    okrs: {
      label: 'OKRs activos',
      icon: TrendingUp,
      current: okrCount,
      limit: limits.max_objectives,
      color: 'text-purple-500',
    },
    ai_analysis: {
      label: 'Análisis IA este mes',
      icon: Sparkles,
      current: aiAnalysisCount,
      limit: limits.max_ai_analysis_per_month,
      color: 'text-orange-500',
    },
  };

  const config = configs[type];
  const Icon = config.icon;
  const isUnlimited = config.limit === -1;
  const percentage = isUnlimited ? 0 : Math.min(100, (config.current / config.limit) * 100);
  const isNearLimit = percentage >= 80 && !isUnlimited;
  const isAtLimit = config.current >= config.limit && !isUnlimited;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
        <Icon className={`h-5 w-5 ${config.color}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{config.label}</p>
          <p className="text-xs text-muted-foreground">
            {config.current} {isUnlimited ? '' : `/ ${config.limit}`}
            {isUnlimited && <Badge variant="secondary" className="ml-2 text-xs">Ilimitado</Badge>}
          </p>
        </div>
        {isNearLimit && (
          <Badge variant={isAtLimit ? 'destructive' : 'secondary'} className="text-xs">
            {isAtLimit ? 'Límite' : 'Cerca'}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={isAtLimit ? 'border-destructive' : isNearLimit ? 'border-warning' : ''}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${config.color.split('-')[1]}-100`}>
              <Icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{config.label}</p>
              <p className="text-2xl font-bold">
                {config.current}
                {!isUnlimited && <span className="text-sm font-normal text-muted-foreground"> / {config.limit}</span>}
              </p>
            </div>
          </div>
          {isUnlimited && (
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Ilimitado
            </Badge>
          )}
        </div>

        {!isUnlimited && (
          <>
            <Progress value={percentage} className="h-2 mb-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{Math.round(percentage)}% usado</span>
              <span>{config.limit - config.current} restantes</span>
            </div>
          </>
        )}

        {isAtLimit && showUpgradeButton && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Has alcanzado el límite de tu plan actual
            </p>
            <Button
              onClick={() => navigate('/pricing')}
              variant="default"
              size="sm"
              className="w-full gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Mejorar Plan
            </Button>
          </div>
        )}

        {isNearLimit && !isAtLimit && showUpgradeButton && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Estás cerca del límite. Considera mejorar tu plan.
            </p>
            <Button
              onClick={() => navigate('/pricing')}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Ver Planes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Componente de resumen de uso - Muestra todos los contadores
 */
export function UsageSummary() {
  const { plan, limits } = useSubscriptionLimits();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Uso de tu Plan</h3>
        <Badge variant="outline">{plan.toUpperCase()}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <UsageCounter type="users" />
        <UsageCounter type="leads" />
        {limits.max_objectives !== 0 && <UsageCounter type="okrs" />}
        {limits.max_ai_analysis_per_month !== 0 && <UsageCounter type="ai_analysis" />}
      </div>
    </div>
  );
}
