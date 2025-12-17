// ============================================
// FINANCIAL HEALTH SECTION - COMPLETE
// Beautiful charts, metrics, trends visualization
// ============================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Flame,
  Target,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { FinancialHealth, TrendDirection, HealthStatus } from '@/types/ai-analysis.types';

interface FinancialHealthSectionProps {
  data: FinancialHealth;
}

export function FinancialHealthSection({ data }: FinancialHealthSectionProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

  const getTrendIcon = (trend: TrendDirection) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-success" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-destructive" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: HealthStatus) => {
    switch (status) {
      case 'excellent': return 'bg-success/10 text-success border-success';
      case 'good': return 'bg-primary/10 text-primary border-primary';
      case 'warning': return 'bg-warning/10 text-warning border-warning';
      case 'critical': return 'bg-destructive/10 text-destructive border-destructive';
    }
  };

  const getStatusText = (status: HealthStatus) => {
    switch (status) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Bueno';
      case 'warning': return 'Atención';
      case 'critical': return 'Crítico';
    }
  };

  // Generate chart data if not provided
  const revenueVsExpensesData = data.charts?.revenue_vs_expenses || [
    { month: 'Ene', revenue: data.metrics?.monthly_revenue || 0, expenses: data.metrics?.monthly_expenses || 0 },
    { month: 'Feb', revenue: (data.metrics?.monthly_revenue || 0) * 1.1, expenses: (data.metrics?.monthly_expenses || 0) * 0.95 },
    { month: 'Mar', revenue: (data.metrics?.monthly_revenue || 0) * 1.2, expenses: (data.metrics?.monthly_expenses || 0) * 1.1 },
  ];

  const marginData = data.charts?.margin_evolution || [
    { month: 'Ene', margin: data.metrics?.profit_margin || 0 },
    { month: 'Feb', margin: (data.metrics?.profit_margin || 0) * 1.05 },
    { month: 'Mar', margin: (data.metrics?.profit_margin || 0) * 1.1 },
  ];

  const pieData = [
    { name: 'Beneficio', value: Math.max(0, (data.metrics?.monthly_revenue || 0) - (data.metrics?.monthly_expenses || 0)), fill: 'hsl(var(--success))' },
    { name: 'Gastos', value: data.metrics?.monthly_expenses || 0, fill: 'hsl(var(--destructive))' },
  ];

  return (
    <div className="space-y-6">
      {/* Header con Score */}
      <Card className="bg-gradient-to-br from-emerald-500/10 via-background to-background border-2 border-emerald-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl flex items-center gap-3">
                  Salud Financiera
                  <Badge className={getStatusColor(data.status)} variant="outline">
                    {getStatusText(data.status)}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-base">
                  Análisis completo de tu situación financiera
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-emerald-500">{data.score || 0}</div>
              <div className="text-sm text-muted-foreground">/ 100 puntos</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={<Wallet className="w-5 h-5" />}
          title="Ingresos Mensuales"
          value={formatCurrency(data.metrics?.monthly_revenue || 0)}
          change={data.trends?.revenue_growth}
          color="success"
        />
        <KPICard
          icon={<PiggyBank className="w-5 h-5" />}
          title="Gastos Mensuales"
          value={formatCurrency(data.metrics?.monthly_expenses || 0)}
          change={data.trends?.expense_growth}
          color="destructive"
          inverseColor
        />
        <KPICard
          icon={<Target className="w-5 h-5" />}
          title="Margen de Beneficio"
          value={`${(data.metrics?.profit_margin || 0).toFixed(1)}%`}
          trend={data.trends?.margin_trend}
          color="primary"
        />
        <KPICard
          icon={<Flame className="w-5 h-5" />}
          title="Burn Rate"
          value={formatCurrency(data.metrics?.burn_rate || 0)}
          subtitle={`${data.metrics?.runway_months || 0} meses de runway`}
          color="warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ingresos vs Gastos</CardTitle>
            <CardDescription>Evolución mensual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueVsExpensesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Ingresos" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Gastos" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Margin Evolution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolución del Margen</CardTitle>
            <CardDescription>Tendencia de rentabilidad</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={marginData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `${v}%`} />
                  <Tooltip 
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="margin" 
                    name="Margen"
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cash Flow */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Runway
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">
              {data.metrics?.runway_months || 0} meses
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Tiempo estimado antes de necesitar más capital
            </p>
            <Progress 
              value={Math.min(100, ((data.metrics?.runway_months || 0) / 18) * 100)} 
              className="h-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Crítico (&lt;3m)</span>
              <span>Saludable (&gt;12m)</span>
            </div>
          </CardContent>
        </Card>

        {/* Revenue per Employee */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Eficiencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-muted-foreground">Ingreso por empleado</span>
                  <span className="font-bold">{formatCurrency(data.metrics?.revenue_per_employee || 0)}</span>
                </div>
                <Progress value={Math.min(100, ((data.metrics?.revenue_per_employee || 0) / 100000) * 100)} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-muted-foreground">Eficiencia operativa</span>
                  <span className="font-bold">{(data.metrics?.operating_efficiency || 0).toFixed(1)}%</span>
                </div>
                <Progress value={data.metrics?.operating_efficiency || 0} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profit Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Distribución</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-xs">Beneficio</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-xs">Gastos</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Insights */}
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Insights Financieros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {(data.insights || ['Sin datos suficientes para insights']).map((insight, idx) => (
                <li key={idx} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">{idx + 1}</span>
                  </div>
                  <span className="text-sm">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="border-success/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-success" />
              Recomendaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {(data.recommendations || ['Añade más datos financieros para obtener recomendaciones']).map((rec, idx) => (
                <li key={idx} className="flex items-start gap-3 p-3 bg-success/5 rounded-lg border-l-4 border-success">
                  <ArrowUpRight className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Warning Signs */}
      {data.warning_signs && data.warning_signs.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5" />
              Señales de Alerta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.warning_signs.map((warning, idx) => (
                <li key={idx} className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{warning}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper Component
interface KPICardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  change?: number;
  trend?: TrendDirection;
  subtitle?: string;
  color: 'success' | 'destructive' | 'primary' | 'warning';
  inverseColor?: boolean;
}

function KPICard({ icon, title, value, change, trend, subtitle, color, inverseColor }: KPICardProps) {
  const colorClasses = {
    success: 'text-success bg-success/10',
    destructive: 'text-destructive bg-destructive/10',
    primary: 'text-primary bg-primary/10',
    warning: 'text-warning bg-warning/10',
  };

  const isPositive = change !== undefined ? (inverseColor ? change < 0 : change > 0) : true;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {change !== undefined && (
          <Badge 
            variant="outline" 
            className={isPositive ? 'text-success border-success' : 'text-destructive border-destructive'}
          >
            {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {Math.abs(change).toFixed(1)}%
          </Badge>
        )}
        {trend && (
          <Badge variant="outline" className="capitalize">
            {trend === 'improving' ? '📈' : trend === 'declining' ? '📉' : '➡️'}
          </Badge>
        )}
      </div>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </Card>
  );
}

export default FinancialHealthSection;
