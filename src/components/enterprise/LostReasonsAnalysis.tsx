import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useLostReasonsAnalysis } from '@/hooks/useEnterpriseData';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { 
  TrendingDown, AlertTriangle, Lightbulb, 
  DollarSign, BarChart3 
} from 'lucide-react';
import { formatCurrency } from '@/lib/currencyUtils';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

const COLORS = [
  'hsl(346, 87%, 43%)',
  'hsl(25, 95%, 53%)',
  'hsl(48, 96%, 53%)',
  'hsl(262, 83%, 58%)',
  'hsl(221, 83%, 53%)',
];

const REASON_LABELS: Record<string, string> = {
  price: 'Precio',
  competitor: 'Competencia',
  timing: 'Timing',
  budget: 'Presupuesto',
  features: 'Funcionalidades',
  no_response: 'Sin respuesta',
  other: 'Otros',
};

export function LostReasonsAnalysis() {
  const { organizationId } = useCurrentOrganization();
  const { data, loading, error } = useLostReasonsAnalysis(organizationId);

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
            Error cargando análisis de pérdidas
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasData = data.total_lost_deals > 0;
  const topReason = data.reasons[0];

  // Preparar datos para gráficos
  const pieData = data.reasons.map(r => ({
    name: REASON_LABELS[r.reason] || r.reason,
    value: r.count,
    percentage: r.percentage,
  }));

  const barData = data.reasons.map(r => ({
    reason: REASON_LABELS[r.reason] || r.reason,
    count: r.count,
    value: r.total_value,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análisis de Deals Perdidos</h2>
          <p className="text-muted-foreground">Últimos 90 días</p>
        </div>
        {hasData && topReason && (
          <Badge variant="destructive" className="text-sm">
            Principal: {REASON_LABELS[topReason.reason] || topReason.reason}
          </Badge>
        )}
      </div>

      {!hasData ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <TrendingDown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No hay datos de deals perdidos</p>
            <p className="text-sm text-muted-foreground mt-2">
              Los deals perdidos aparecerán aquí para su análisis
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Deals Perdidos</span>
                  <TrendingDown className="h-4 w-4 text-rose-500" />
                </div>
                <p className="text-3xl font-bold text-rose-600">{data.total_lost_deals}</p>
                <p className="text-xs text-muted-foreground mt-1">En los últimos 90 días</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Valor Total Perdido</span>
                  <DollarSign className="h-4 w-4 text-rose-500" />
                </div>
                <p className="text-3xl font-bold text-rose-600">
                  {formatCurrency(data.total_lost_value)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Oportunidad perdida</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Razón Principal</span>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                {topReason && (
                  <>
                    <p className="text-xl font-bold">
                      {REASON_LABELS[topReason.reason] || topReason.reason}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {topReason.percentage.toFixed(1)}% de los casos
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribución por Razón</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bar Chart - Value Lost */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Valor Perdido por Razón</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        type="number" 
                        tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                      />
                      <YAxis dataKey="reason" type="category" width={80} className="text-xs" />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="value" fill="hsl(346, 87%, 43%)" name="Valor perdido" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reasons Detail */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Detalle por Razón
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.reasons.map((reason, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">
                        {REASON_LABELS[reason.reason] || reason.reason}
                      </span>
                      <Badge variant="outline">{reason.count} deals</Badge>
                    </div>
                    <span className="font-semibold text-rose-600">
                      {formatCurrency(reason.total_value)}
                    </span>
                  </div>
                  <Progress 
                    value={reason.percentage} 
                    className="h-2 [&>div]:bg-rose-500"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{reason.percentage.toFixed(1)}% de los casos</span>
                    <span>Ticket promedio: {formatCurrency(reason.average_deal_size)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Insights */}
          {data.insights.length > 0 && (
            <Card className="border-amber-500/50 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Insights y Recomendaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.insights.map((insight, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${
                      insight.priority === 'high' 
                        ? 'border-rose-500/50 bg-rose-500/10' 
                        : 'border-amber-500/50 bg-amber-500/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Badge variant={insight.priority === 'high' ? 'destructive' : 'secondary'}>
                        {insight.priority === 'high' ? 'Alta' : 'Media'} prioridad
                      </Badge>
                      <div>
                        <p className="font-medium">{insight.finding}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          💡 {insight.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
