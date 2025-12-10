import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useChurnTracking } from '@/hooks/useChurnTracking';
import { 
  TrendingDown, 
  TrendingUp,
  DollarSign, 
  Users, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Gift
} from 'lucide-react';
import { useMemo } from 'react';

interface ChurnDashboardProps {
  periodMonths?: number;
}

export function ChurnDashboard({ periodMonths = 3 }: ChurnDashboardProps) {
  const { 
    surveys,
    churnRate, 
    reasonsBreakdown, 
    retentionStats,
    loading, 
    refreshData 
  } = useChurnTracking(periodMonths);

  const summaryStats = useMemo(() => {
    const totalRetentionOffers = retentionStats.reduce((sum, stat) => sum + Number(stat.offers_shown), 0);
    const totalAccepted = retentionStats.reduce((sum, stat) => sum + Number(stat.offers_accepted), 0);
    const totalMRRSaved = retentionStats.reduce((sum, stat) => sum + Number(stat.mrr_saved), 0);
    
    return {
      totalRetentionOffers,
      totalAccepted,
      overallSuccessRate: totalRetentionOffers > 0 
        ? (totalAccepted / totalRetentionOffers) * 100 
        : 0,
      totalMRRSaved,
    };
  }, [retentionStats]);

  const getReasonEmoji = (reason: string) => {
    const map: Record<string, string> = {
      'too_expensive': '💰',
      'missing_feature': '🔧',
      'too_complex': '🤯',
      'found_alternative': '🔄',
      'no_longer_needed': '✋',
      'other': '💭',
    };
    return map[reason] || '📊';
  };

  const getCategoryColor = (category: string) => {
    const map: Record<string, string> = {
      'pricing': 'text-destructive',
      'product': 'text-orange-500',
      'ux': 'text-yellow-500',
      'competition': 'text-primary',
      'business': 'text-muted-foreground',
      'other': 'text-muted-foreground',
    };
    return map[category] || 'text-muted-foreground';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análisis de Churn</h2>
          <p className="text-sm text-muted-foreground">
            Últimos {periodMonths} meses
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Churn Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className={`h-4 w-4 ${
                churnRate && churnRate.churn_rate > 5 ? 'text-destructive' : 'text-primary'
              }`} />
              <span className="text-3xl font-bold">
                {churnRate?.churn_rate.toFixed(1) || '0'}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {churnRate?.churned_customers || 0} de {churnRate?.total_customers || 0} clientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MRR Perdido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-destructive" />
              <span className="text-3xl font-bold">
                €{Math.round(churnRate?.mrr_lost || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Este período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Retención Exitosa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-3xl font-bold">
                {summaryStats.overallSuccessRate.toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summaryStats.totalAccepted} de {summaryStats.totalRetentionOffers} ofertas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MRR Salvado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-3xl font-bold">
                €{Math.round(summaryStats.totalMRRSaved).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Con ofertas de retención
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Razones de Cancelación</CardTitle>
          <CardDescription>
            ¿Por qué nos dejan los clientes?
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reasonsBreakdown.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay datos de cancelaciones en este período</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reasonsBreakdown.map((item, index) => (
                <div key={item.reason}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getReasonEmoji(item.reason)}</span>
                      <span className="font-medium capitalize">
                        {item.reason.replace(/_/g, ' ')}
                      </span>
                      <Badge variant="outline" className={getCategoryColor(item.reason_category)}>
                        {item.reason_category}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">{item.count}</span>
                      <span className="text-muted-foreground ml-1">
                        ({item.percentage.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  {index < reasonsBreakdown.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Efectividad de Ofertas de Retención
          </CardTitle>
          <CardDescription>
            ¿Qué ofertas funcionan mejor para retener clientes?
          </CardDescription>
        </CardHeader>
        <CardContent>
          {retentionStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay ofertas de retención en este período</p>
            </div>
          ) : (
            <div className="space-y-4">
              {retentionStats.map((stat) => (
                <div key={stat.offer_type} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">
                      {stat.offer_type?.replace(/_/g, ' ') || 'Sin tipo'}
                    </span>
                    <Badge variant={stat.success_rate > 50 ? 'default' : 'secondary'}>
                      {stat.success_rate.toFixed(0)}% éxito
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Mostradas</span>
                      <p className="font-bold">{stat.offers_shown}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Aceptadas</span>
                      <p className="font-bold">{stat.offers_accepted}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">MRR Salvado</span>
                      <p className="font-bold text-primary">€{Math.round(stat.mrr_saved).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {surveys.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Últimas Cancelaciones</CardTitle>
            <CardDescription>
              Detalle de las últimas {Math.min(surveys.length, 5)} cancelaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {surveys.slice(0, 5).map((survey) => (
                <div key={survey.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{getReasonEmoji(survey.reason)}</span>
                      <span className="font-medium capitalize">
                        {survey.reason.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Plan: {survey.plan_before_cancel} • 
                      {new Date(survey.cancellation_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {survey.mrr_lost && (
                      <p className="font-bold text-destructive">
                        -€{survey.mrr_lost.toLocaleString()}
                      </p>
                    )}
                    {survey.retention_offer_accepted && (
                      <Badge variant="default" className="text-xs">
                        Retenido
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
