import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useFinancialFromKPIs } from '@/hooks/useEnterpriseData';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { 
  TrendingUp, TrendingDown, DollarSign, AlertTriangle, 
  Target, Gauge, Clock, PiggyBank 
} from 'lucide-react';
import { formatCurrency } from '@/lib/currencyUtils';

interface FinancialFromKPIsProps {
  showDemoData?: boolean;
}

export function FinancialFromKPIs({ showDemoData = false }: FinancialFromKPIsProps) {
  const { organizationId } = useCurrentOrganization();
  const { data: realData, loading, error } = useFinancialFromKPIs(organizationId);

  // Demo data
  const demoData = {
    period: 'Proyección Mensual - Demo',
    projected_revenue: 125000,
    projected_expenses: 78000,
    projected_profit: 47000,
    confidence: 78,
    breakdown: {
      revenue_from_pipeline: 45000,
      revenue_from_recurring: 55000,
      revenue_from_new_customers: 25000,
    },
    metrics: {
      calculated_cac: 320,
      expected_cac: 250,
      ltv: 2400,
      ltv_cac_ratio: 7.5,
      gross_margin: 62,
      burn_rate: 78000,
      runway_months: 18,
    },
    alerts: [
      { severity: 'warning' as const, message: 'CAC por encima del objetivo', recommendation: 'Optimizar canales de adquisición' },
      { severity: 'info' as const, message: 'Runway saludable de 18 meses', recommendation: 'Considerar inversión en crecimiento' },
    ],
  };

  const data = showDemoData ? demoData : realData;

  if (loading && !showDemoData) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if ((error || !data) && !showDemoData) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <p className="text-destructive text-center">
            Error cargando proyecciones financieras
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const metrics = data.metrics;
  const isHealthy = metrics.runway_months > 12 && metrics.ltv_cac_ratio >= 3;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Proyecciones Financieras</h2>
          <p className="text-muted-foreground">{data.period}</p>
        </div>
        <Badge variant={isHealthy ? 'default' : 'destructive'} className="text-sm">
          {isHealthy ? 'Saludable' : 'Requiere Atención'}
        </Badge>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ingresos Proyectados"
          value={formatCurrency(data.projected_revenue)}
          icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
          trend={data.projected_profit > 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Gastos Proyectados"
          value={formatCurrency(data.projected_expenses)}
          icon={<TrendingDown className="h-5 w-5 text-rose-500" />}
          subtitle="Burn rate mensual"
        />
        <MetricCard
          title="Beneficio Proyectado"
          value={formatCurrency(data.projected_profit)}
          icon={<DollarSign className="h-5 w-5 text-primary" />}
          trend={data.projected_profit > 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Confianza"
          value={`${data.confidence}%`}
          icon={<Target className="h-5 w-5 text-amber-500" />}
          subtitle="Precisión estimada"
        />
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Desglose de Ingresos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <BreakdownItem
              label="Pipeline actual"
              value={data.breakdown.revenue_from_pipeline}
              total={data.projected_revenue}
              color="bg-emerald-500"
            />
            <BreakdownItem
              label="Ingresos recurrentes"
              value={data.breakdown.revenue_from_recurring}
              total={data.projected_revenue}
              color="bg-blue-500"
            />
            <BreakdownItem
              label="Nuevos clientes"
              value={data.breakdown.revenue_from_new_customers}
              total={data.projected_revenue}
              color="bg-purple-500"
            />
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Métricas Clave</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">CAC</span>
              </div>
              <div className="text-right">
                <span className="font-semibold">{formatCurrency(metrics.calculated_cac)}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  (Target: {formatCurrency(metrics.expected_cac)})
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">LTV</span>
              </div>
              <span className="font-semibold">{formatCurrency(metrics.ltv)}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">LTV/CAC Ratio</span>
              </div>
              <Badge variant={metrics.ltv_cac_ratio >= 3 ? 'default' : 'destructive'}>
                {metrics.ltv_cac_ratio.toFixed(1)}x
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Runway</span>
              </div>
              <Badge variant={metrics.runway_months >= 12 ? 'default' : 'destructive'}>
                {metrics.runway_months.toFixed(1)} meses
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Alertas Financieras
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.alerts.map((alert, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  alert.severity === 'critical' 
                    ? 'border-destructive/50 bg-destructive/10' 
                    : 'border-amber-500/50 bg-amber-500/10'
                }`}
              >
                <p className="font-medium text-sm">{alert.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{alert.recommendation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  icon, 
  subtitle, 
  trend 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  subtitle?: string;
  trend?: 'up' | 'down';
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{title}</span>
          {icon}
        </div>
        <p className={`text-2xl font-bold ${
          trend === 'up' ? 'text-emerald-600' : 
          trend === 'down' ? 'text-rose-600' : ''
        }`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function BreakdownItem({ 
  label, 
  value, 
  total, 
  color 
}: { 
  label: string; 
  value: number; 
  total: number; 
  color: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{formatCurrency(value)}</span>
      </div>
      <Progress value={percentage} className={`h-2 ${color}`} />
      <p className="text-xs text-muted-foreground text-right">{percentage.toFixed(1)}%</p>
    </div>
  );
}
