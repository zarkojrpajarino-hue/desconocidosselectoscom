// ============================================
// COMPONENTE: SALUD FINANCIERA
// src/components/ai-analysis/FinancialHealthSection.tsx
// ============================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  LineChart,
  AreaChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  PiggyBank,
  Calendar,
} from 'lucide-react';
import { FinancialHealth, HealthStatus, TrendDirection } from '@/types/ai-analysis.types';

interface FinancialHealthSectionProps {
  data: FinancialHealth;
}

export function FinancialHealthSection({ data }: FinancialHealthSectionProps) {
  return (
    <div className="space-y-6">
      {/* HEADER CON SCORE */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl flex items-center gap-3">
                💰 Salud Financiera
                <Badge variant="outline" className="text-xl">
                  {data.score}/100
                </Badge>
              </CardTitle>
              <CardDescription className="mt-2">
                Estado: <HealthStatusBadge status={data.status} />
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Tendencia</p>
              <TrendBadge trend={data.trends.margin_trend} />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* MÉTRICAS CLAVE - GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialMetricCard
          icon={<DollarSign className="w-5 h-5" />}
          title="Ingresos Mensuales"
          value={formatCurrency(data.metrics.monthly_revenue)}
          change={data.trends.revenue_growth}
          iconBg="bg-success/10"
          iconColor="text-success"
        />
        <FinancialMetricCard
          icon={<CreditCard className="w-5 h-5" />}
          title="Gastos Mensuales"
          value={formatCurrency(data.metrics.monthly_expenses)}
          change={data.trends.expense_growth}
          iconBg="bg-destructive/10"
          iconColor="text-destructive"
        />
        <FinancialMetricCard
          icon={<PiggyBank className="w-5 h-5" />}
          title="Margen de Beneficio"
          value={`${data.metrics.profit_margin.toFixed(1)}%`}
          benchmark={25}
          iconBg="bg-primary/10"
          iconColor="text-primary"
        />
        <FinancialMetricCard
          icon={<Calendar className="w-5 h-5" />}
          title="Runway"
          value={`${data.metrics.runway_months.toFixed(1)} meses`}
          alert={data.metrics.runway_months < 6}
          iconBg="bg-warning/10"
          iconColor="text-warning"
        />
      </div>

      {/* MÉTRICAS ADICIONALES - GRID SECUNDARIO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Métricas Detalladas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Balance de Caja</p>
              <p className="text-2xl font-bold">{formatCurrency(data.metrics.cash_balance)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Burn Rate</p>
              <p className="text-2xl font-bold">{formatCurrency(data.metrics.burn_rate)}/mes</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Revenue/Empleado</p>
              <p className="text-2xl font-bold">{formatCurrency(data.metrics.revenue_per_employee)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Eficiencia Operativa</p>
              <p className="text-2xl font-bold">{data.metrics.operating_efficiency.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GRÁFICA PRINCIPAL: INGRESOS VS GASTOS */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución de Ingresos vs Gastos</CardTitle>
          <CardDescription>Últimos meses</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={data.charts.revenue_vs_expenses}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Bar 
                dataKey="revenue" 
                fill="hsl(var(--success))" 
                name="Ingresos"
                radius={[8, 8, 0, 0]}
              />
              <Bar 
                dataKey="expenses" 
                fill="hsl(var(--destructive))" 
                name="Gastos"
                radius={[8, 8, 0, 0]}
              />
              <Line 
                type="monotone" 
                dataKey="margin" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                name="Margen"
                dot={{ r: 5, fill: 'hsl(var(--primary))' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* GRÁFICA: EVOLUCIÓN DEL MARGEN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolución del Margen</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.charts.margin_evolution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Area 
                  type="monotone" 
                  dataKey="margin" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                  name="Margen"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Proyección de Cash Runway</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.charts.cash_runway}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Line 
                  type="monotone" 
                  dataKey="cash" 
                  stroke="hsl(var(--warning))" 
                  strokeWidth={3}
                  name="Balance"
                  dot={{ r: 4, fill: 'hsl(var(--warning))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* INSIGHTS DE LA IA */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🤖 Insights de la IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.insights.map((insight, idx) => (
            <Alert key={idx} className="border-primary/50">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription className="ml-2">{insight}</AlertDescription>
            </Alert>
          ))}
        </CardContent>
      </Card>

      {/* RECOMENDACIONES */}
      <Card className="border-success">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ✅ Recomendaciones Accionables
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-success/5 rounded-lg border border-success/20">
              <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span className="text-sm">{rec}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* SEÑALES DE ALARMA */}
      {data.warning_signs && data.warning_signs.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              ⚠️ Señales de Alarma
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.warning_signs.map((warning, idx) => (
              <Alert key={idx} variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="ml-2">{warning}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

interface FinancialMetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  change?: number;
  benchmark?: number;
  alert?: boolean;
  iconBg?: string;
  iconColor?: string;
}

function FinancialMetricCard({
  icon,
  title,
  value,
  change,
  benchmark,
  alert,
  iconBg = 'bg-primary/10',
  iconColor = 'text-primary',
}: FinancialMetricCardProps) {
  return (
    <Card className={alert ? 'border-destructive' : ''}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-full ${iconBg}`}>
            <div className={iconColor}>{icon}</div>
          </div>
          {alert && <AlertCircle className="w-5 h-5 text-destructive" />}
        </div>
        
        <p className="text-sm text-muted-foreground mb-2">{title}</p>
        <p className="text-3xl font-bold mb-2">{value}</p>
        
        {change !== undefined && (
          <div className="flex items-center gap-1">
            {change > 0 ? (
              <ArrowUpRight className="w-4 h-4 text-success" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-destructive" />
            )}
            <span className={`text-sm font-medium ${change > 0 ? 'text-success' : 'text-destructive'}`}>
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">vs mes anterior</span>
          </div>
        )}

        {benchmark !== undefined && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>vs benchmark ({benchmark}%)</span>
            </div>
            <Progress 
              value={parseFloat(value) / benchmark * 100} 
              className="h-2"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HealthStatusBadge({ status }: { status: HealthStatus }) {
  const config = {
    excellent: { color: 'bg-success/10 text-success border-success', text: '🌟 Excelente' },
    good: { color: 'bg-primary/10 text-primary border-primary', text: '✅ Bueno' },
    warning: { color: 'bg-warning/10 text-warning border-warning', text: '⚠️ Atención' },
    critical: { color: 'bg-destructive/10 text-destructive border-destructive', text: '🚨 Crítico' },
  };

  return (
    <Badge variant="outline" className={config[status].color}>
      {config[status].text}
    </Badge>
  );
}

function TrendBadge({ trend }: { trend: TrendDirection }) {
  const config = {
    improving: { icon: <TrendingUp className="w-4 h-4" />, color: 'text-success', text: 'Mejorando' },
    stable: { icon: <div className="w-4 h-0.5 bg-current" />, color: 'text-muted-foreground', text: 'Estable' },
    declining: { icon: <TrendingDown className="w-4 h-4" />, color: 'text-destructive', text: 'Declinando' },
  };

  return (
    <div className={`flex items-center gap-2 ${config[trend].color}`}>
      {config[trend].icon}
      <span className="font-medium">{config[trend].text}</span>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default FinancialHealthSection;
