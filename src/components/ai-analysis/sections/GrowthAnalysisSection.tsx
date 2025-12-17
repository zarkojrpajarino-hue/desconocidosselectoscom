// ============================================
// GROWTH ANALYSIS SECTION - COMPLETE
// Bottlenecks, opportunities, market charts
// ============================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  DollarSign,
  AlertTriangle,
  Zap,
  Rocket,
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  BarChart3,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { GrowthAnalysis, GrowthStage, GrowthRate, Bottleneck, Opportunity, Severity, ImpactLevel } from '@/types/ai-analysis.types';

interface GrowthAnalysisSectionProps {
  data: GrowthAnalysis;
}

export function GrowthAnalysisSection({ data }: GrowthAnalysisSectionProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStageConfig = (stage: GrowthStage) => {
    const configs = {
      startup: { label: 'Startup', color: 'bg-blue-500', icon: '🚀', progress: 20 },
      growth: { label: 'Crecimiento', color: 'bg-green-500', icon: '📈', progress: 40 },
      scale: { label: 'Escalamiento', color: 'bg-purple-500', icon: '⚡', progress: 70 },
      mature: { label: 'Madurez', color: 'bg-amber-500', icon: '🏆', progress: 90 },
    };
    return configs[stage] || configs.startup;
  };

  const getGrowthRateConfig = (rate: GrowthRate) => {
    const configs = {
      fast: { label: 'Rápido', color: 'text-success', badge: 'success' as const },
      moderate: { label: 'Moderado', color: 'text-primary', badge: 'default' as const },
      slow: { label: 'Lento', color: 'text-warning', badge: 'secondary' as const },
      negative: { label: 'Negativo', color: 'text-destructive', badge: 'destructive' as const },
    };
    return configs[rate] || configs.moderate;
  };

  const getSeverityColor = (severity: Severity) => {
    const colors = {
      critical: 'bg-destructive/10 text-destructive border-destructive',
      high: 'bg-orange-500/10 text-orange-500 border-orange-500',
      medium: 'bg-warning/10 text-warning border-warning',
      low: 'bg-muted text-muted-foreground border-muted-foreground',
    };
    return colors[severity];
  };

  const getImpactColor = (impact: ImpactLevel) => {
    const colors = {
      high: 'bg-success/10 text-success border-success',
      medium: 'bg-primary/10 text-primary border-primary',
      low: 'bg-muted text-muted-foreground border-muted-foreground',
    };
    return colors[impact];
  };

  const stageConfig = getStageConfig(data.current_stage);
  const rateConfig = getGrowthRateConfig(data.growth_rate);

  // Radar chart data for metrics
  const radarData = [
    { subject: 'Adquisición', value: Math.min(100, (data.metrics?.customer_acquisition || 0) / 10), fullMark: 100 },
    { subject: 'Retención', value: data.metrics?.retention_rate || 0, fullMark: 100 },
    { subject: 'Expansión', value: Math.min(100, (data.metrics?.expansion_revenue || 0) / 1000), fullMark: 100 },
    { subject: 'Penetración', value: data.metrics?.market_penetration || 0, fullMark: 100 },
    { subject: 'Crecimiento', value: Math.min(100, (data.metrics?.monthly_growth_rate || 0) * 5), fullMark: 100 },
    { subject: 'LTV/CAC', value: Math.min(100, ((data.metrics?.customer_lifetime_value || 0) / Math.max(1, data.metrics?.customer_acquisition_cost || 1)) * 20), fullMark: 100 },
  ];

  // Customer growth chart
  const customerGrowthData = data.charts?.customer_growth || [
    { month: 'Ene', customers: 100, new: 20, churned: 5 },
    { month: 'Feb', customers: 115, new: 25, churned: 10 },
    { month: 'Mar', customers: 130, new: 22, churned: 7 },
    { month: 'Abr', customers: 145, new: 28, churned: 13 },
    { month: 'May', customers: 160, new: 30, churned: 15 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-violet-500/10 via-background to-background border-2 border-violet-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-3xl">
                {stageConfig.icon}
              </div>
              <div>
                <CardTitle className="text-3xl flex items-center gap-3">
                  Análisis de Crecimiento
                  <Badge className={rateConfig.badge === 'success' ? 'bg-success' : rateConfig.badge === 'destructive' ? 'bg-destructive' : ''}>
                    {rateConfig.label}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-base">
                  Etapa actual: <strong>{stageConfig.label}</strong>
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-violet-500">{data.growth_score || 0}</div>
              <div className="text-sm text-muted-foreground">/ 100 puntos</div>
            </div>
          </div>

          {/* Stage Progress */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>🚀 Startup</span>
              <span>📈 Crecimiento</span>
              <span>⚡ Escalamiento</span>
              <span>🏆 Madurez</span>
            </div>
            <Progress value={stageConfig.progress} className="h-3" />
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Users className="w-5 h-5" />}
          title="Nuevos Clientes/Mes"
          value={data.metrics?.customer_acquisition?.toString() || '0'}
          subtitle="Adquisición"
          color="primary"
        />
        <MetricCard
          icon={<Target className="w-5 h-5" />}
          title="Tasa de Retención"
          value={`${(data.metrics?.retention_rate || 0).toFixed(1)}%`}
          subtitle="Clientes que permanecen"
          color="success"
        />
        <MetricCard
          icon={<DollarSign className="w-5 h-5" />}
          title="LTV"
          value={formatCurrency(data.metrics?.customer_lifetime_value || 0)}
          subtitle="Valor de por vida"
          color="info"
        />
        <MetricCard
          icon={<DollarSign className="w-5 h-5" />}
          title="CAC"
          value={formatCurrency(data.metrics?.customer_acquisition_cost || 0)}
          subtitle="Costo de adquisición"
          color="warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart - Growth Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Radar de Crecimiento</CardTitle>
            <CardDescription>Visión 360° de tus métricas de crecimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" className="text-xs" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Tu empresa"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.5}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Customer Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Crecimiento de Clientes</CardTitle>
            <CardDescription>Nuevos vs Churned</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={customerGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="customers" name="Total Clientes" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="new" name="Nuevos" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="churned" name="Perdidos" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottlenecks & Opportunities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bottlenecks */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Cuellos de Botella ({(data.bottlenecks || []).length})
            </CardTitle>
            <CardDescription>Obstáculos que frenan tu crecimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data.bottlenecks || []).length > 0 ? (
                data.bottlenecks.map((bottleneck, idx) => (
                  <BottleneckCard key={idx} bottleneck={bottleneck} />
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-success" />
                  <p>No se detectaron cuellos de botella críticos</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Opportunities */}
        <Card className="border-success/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-success">
              <Lightbulb className="w-5 h-5" />
              Oportunidades ({(data.opportunities || []).length})
            </CardTitle>
            <CardDescription>Áreas de alto potencial para crecer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data.opportunities || []).length > 0 ? (
                data.opportunities.map((opportunity, idx) => (
                  <OpportunityCard key={idx} opportunity={opportunity} />
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Target className="w-8 h-8 mx-auto mb-2" />
                  <p>Añade más datos para identificar oportunidades</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Competitive Advantages & Market Threats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Competitive Advantages */}
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Ventajas Competitivas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(data.competitive_advantages || ['Define tu ventaja competitiva en el perfil']).map((advantage, idx) => (
                <li key={idx} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{advantage}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Market Threats */}
        <Card className="border-warning/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Amenazas de Mercado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(data.market_threats || ['No se identificaron amenazas específicas']).map((threat, idx) => (
                <li key={idx} className="flex items-start gap-3 p-3 bg-warning/5 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{threat}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({
  icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle?: string;
  color: 'primary' | 'success' | 'info' | 'warning';
}) {
  const colorClasses = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    info: 'text-info bg-info/10',
    warning: 'text-warning bg-warning/10',
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
    </Card>
  );
}

function BottleneckCard({ bottleneck }: { bottleneck: Bottleneck }) {
  const getSeverityBadge = (severity: Severity) => {
    const configs = {
      critical: { label: 'Crítico', variant: 'destructive' as const },
      high: { label: 'Alto', variant: 'destructive' as const },
      medium: { label: 'Medio', variant: 'secondary' as const },
      low: { label: 'Bajo', variant: 'outline' as const },
    };
    return configs[severity];
  };

  const badge = getSeverityBadge(bottleneck.severity);

  return (
    <Card className="p-4 border-destructive/20 bg-destructive/5">
      <div className="flex items-start justify-between mb-2">
        <span className="font-semibold">{bottleneck.area}</span>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{bottleneck.description}</p>
      <div className="p-2 bg-card rounded-lg">
        <p className="text-xs font-medium mb-1">💡 Solución:</p>
        <p className="text-xs text-muted-foreground">{bottleneck.solution}</p>
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
        <Clock className="w-3 h-3" />
        <span>Tiempo estimado: {bottleneck.estimated_resolution_time}</span>
      </div>
    </Card>
  );
}

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const getImpactBadge = (impact: ImpactLevel) => {
    const configs = {
      high: { label: 'Alto Impacto', variant: 'default' as const },
      medium: { label: 'Impacto Medio', variant: 'secondary' as const },
      low: { label: 'Bajo Impacto', variant: 'outline' as const },
    };
    return configs[impact];
  };

  const badge = getImpactBadge(opportunity.potential_impact);

  return (
    <Card className="p-4 border-success/20 bg-success/5">
      <div className="flex items-start justify-between mb-2">
        <span className="font-semibold">{opportunity.title}</span>
        <Badge variant={badge.variant} className="bg-success/20 text-success">{badge.label}</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{opportunity.description}</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-card rounded-lg">
          <span className="text-muted-foreground">Timeline:</span>
          <span className="font-medium ml-1">{opportunity.timeline}</span>
        </div>
        <div className="p-2 bg-card rounded-lg">
          <span className="text-muted-foreground">ROI:</span>
          <span className="font-medium ml-1 text-success">{opportunity.expected_roi}</span>
        </div>
      </div>
    </Card>
  );
}

export default GrowthAnalysisSection;
