import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useDealVelocity } from '@/hooks/useEnterpriseData';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { 
  Clock, AlertTriangle, TrendingUp, TrendingDown,
  RefreshCw, Target, Zap
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';

const STAGE_LABELS: Record<string, string> = {
  discovery: 'Descubrimiento',
  qualification: 'Calificación',
  proposal: 'Propuesta',
  negotiation: 'Negociación',
  closing: 'Cierre',
};

const TARGET_DAYS: Record<string, number> = {
  discovery: 3,
  qualification: 7,
  proposal: 10,
  negotiation: 14,
  closing: 6,
};

export function DealVelocity() {
  const { organizationId } = useCurrentOrganization();
  const { data, loading, error, refetch } = useDealVelocity(organizationId);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <p className="text-destructive text-center">
            Error cargando velocidad de deals
          </p>
          <Button variant="outline" className="mt-4 mx-auto block" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isOnTarget = data.variance_days <= 0;
  const hasBottlenecks = data.bottlenecks.length > 0;
  const hasStalledDeals = data.stalled_deals.length > 0;

  // Preparar datos para el gráfico
  const chartData = Object.entries(data.average_days_in_stage).map(([stage, days]) => ({
    stage: STAGE_LABELS[stage] || stage,
    days: days,
    target: TARGET_DAYS[stage] || 7,
    isBottleneck: days > (TARGET_DAYS[stage] || 7) * 1.2,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Velocidad de Deals</h2>
          <p className="text-muted-foreground">Tiempo promedio por etapa del pipeline</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Ciclo de Ventas Total</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{data.total_sales_cycle_days} días</p>
            <p className="text-xs text-muted-foreground mt-1">
              Target: {data.target_sales_cycle_days} días
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Variación vs Target</span>
              {isOnTarget ? (
                <TrendingDown className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingUp className="h-4 w-4 text-rose-500" />
              )}
            </div>
            <p className={`text-3xl font-bold ${isOnTarget ? 'text-emerald-600' : 'text-rose-600'}`}>
              {data.variance_days > 0 ? '+' : ''}{data.variance_days} días
            </p>
            <Badge variant={isOnTarget ? 'default' : 'destructive'} className="mt-2">
              {isOnTarget ? 'En objetivo' : 'Sobre objetivo'}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Alertas Activas</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {hasBottlenecks && (
                <Badge variant="outline" className="text-amber-600 border-amber-500">
                  {data.bottlenecks.length} Cuellos de botella
                </Badge>
              )}
              {hasStalledDeals && (
                <Badge variant="outline" className="text-rose-600 border-rose-500">
                  {data.stalled_deals.length} Deals estancados
                </Badge>
              )}
              {!hasBottlenecks && !hasStalledDeals && (
                <Badge variant="default">Sin alertas</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Velocity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Días Promedio por Etapa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" unit=" días" />
                <YAxis dataKey="stage" type="category" width={100} className="text-xs" />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value} días`,
                    name === 'days' ? 'Actual' : 'Target'
                  ]}
                />
                <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" />
                <Bar dataKey="target" fill="hsl(var(--muted))" name="Target" />
                <Bar dataKey="days" name="Actual">
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isBottleneck ? 'hsl(346, 87%, 43%)' : 'hsl(var(--primary))'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bottlenecks */}
      {hasBottlenecks && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Cuellos de Botella Detectados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.bottlenecks.map((bottleneck, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                <div>
                  <span className="font-medium">
                    {STAGE_LABELS[bottleneck.stage] || bottleneck.stage}
                  </span>
                  <p className="text-sm text-muted-foreground">
                    {bottleneck.average_days} días promedio (target: {bottleneck.target_days} días)
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={bottleneck.impact === 'high' ? 'destructive' : 'secondary'}>
                    +{bottleneck.excess_days} días exceso
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    Impacto: {bottleneck.impact === 'high' ? 'Alto' : 'Medio'}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Stalled Deals */}
      {hasStalledDeals && (
        <Card className="border-rose-500/50 bg-rose-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-rose-600">
              <Clock className="h-5 w-5" />
              Deals Estancados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.stalled_deals.slice(0, 5).map((deal, index) => (
                <div key={index} className="p-4 bg-background rounded-lg border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{deal.deal_name}</span>
                    <Badge variant="outline">
                      {STAGE_LABELS[deal.current_stage] || deal.current_stage}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {deal.days_in_stage} días en etapa (promedio: {Math.round(deal.average_for_stage)})
                    </span>
                    <span className="text-rose-600 font-medium">
                      +{deal.excess_days} días
                    </span>
                  </div>
                  <p className="text-xs bg-rose-500/10 p-2 rounded text-rose-700">
                    💡 {deal.recommended_action}
                  </p>
                </div>
              ))}
              {data.stalled_deals.length > 5 && (
                <p className="text-center text-sm text-muted-foreground">
                  +{data.stalled_deals.length - 5} deals más estancados
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
