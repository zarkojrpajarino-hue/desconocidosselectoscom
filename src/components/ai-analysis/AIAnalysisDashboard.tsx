// ============================================
// DASHBOARD PRINCIPAL - ANÁLISIS IA V2.0
// src/components/ai-analysis/AIAnalysisDashboard.tsx
// ============================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Users,
  Heart,
  Target,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  Lock,
  Star,
  Sparkles,
  Download,
  Share2,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  BarChart,
  LineChart,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { 
  AIAnalysisResult, 
  HealthStatus, 
  TrendDirection, 
  Priority, 
  IndividualPerformance,
  FutureRoadmap,
  Projections,
  Decision,
  Investment,
  HiringPlan,
  Scenario,
  Projection,
  HonestFeedback as HonestFeedbackType,
  Alert as AlertType,
  Benchmarking,
  PriorityLevel,
} from '@/types/ai-analysis.types';

interface AIAnalysisDashboardProps {
  data: AIAnalysisResult;
  onRefresh?: () => void;
  onExport?: (format: 'pdf' | 'csv') => void;
  loading?: boolean;
}

export function AIAnalysisDashboard({ data, onRefresh, onExport, loading }: AIAnalysisDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Handle both old format (executive_summary) and new format (executive_dashboard)
  // Use type assertion to handle legacy data structure
  const rawData = data as unknown as Record<string, unknown>;
  const executiveDashboard = data?.executive_dashboard || (rawData?.executive_summary as typeof data.executive_dashboard);
  const hasValidData = executiveDashboard && (executiveDashboard.overall_score !== undefined || (executiveDashboard as unknown as Record<string, unknown>)?.overall_health !== undefined);

  // Get overall score - handle different data structures
  const overallScore = executiveDashboard?.overall_score ?? 
    (executiveDashboard?.key_metrics?.efficiency_score ? 
      Math.round((executiveDashboard.key_metrics.efficiency_score + 
        executiveDashboard.key_metrics.team_performance + 
        executiveDashboard.key_metrics.customer_satisfaction) / 3) : 0);
  
  // Get health status
  const healthStatus: HealthStatus = executiveDashboard?.health_status || 
    ((executiveDashboard as any)?.overall_health as HealthStatus) || 'warning';

  if (!hasValidData) {
    return (
      <Card className="p-8">
        <CardContent className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay datos de análisis disponibles</h3>
          <p className="text-muted-foreground mb-4">Genera un nuevo análisis para ver los resultados.</p>
          <Button onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Generar Análisis
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* HERO SECTION - RESUMEN EJECUTIVO */}
      <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-2 border-primary/20 shadow-lg">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <h2 className="text-5xl font-bold">{overallScore}/100</h2>
                <Badge className={getHealthStatusColor(healthStatus)} variant="outline">
                  {getHealthStatusText(healthStatus)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Score General de Salud Empresarial</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => onExport?.('pdf')}>
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>

          {/* Mini KPIs Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <MiniMetricCard
              icon={<TrendingUp className="w-6 h-6" />}
              label="Ingresos"
              value={`${(executiveDashboard?.key_metrics?.revenue_trend ?? 0) > 0 ? '+' : ''}${(executiveDashboard?.key_metrics?.revenue_trend ?? 0).toFixed(1)}%`}
              trend={executiveDashboard?.key_metrics?.revenue_trend ?? 0}
              iconColor="text-success"
            />
            <MiniMetricCard
              icon={<Zap className="w-6 h-6" />}
              label="Eficiencia"
              value={`${executiveDashboard?.key_metrics?.efficiency_score ?? 0}/100`}
              iconColor="text-warning"
            />
            <MiniMetricCard
              icon={<Users className="w-6 h-6" />}
              label="Equipo"
              value={`${executiveDashboard?.key_metrics?.team_performance ?? 0}/100`}
              iconColor="text-primary"
            />
            <MiniMetricCard
              icon={<Heart className="w-6 h-6" />}
              label="Clientes"
              value={`${executiveDashboard?.key_metrics?.customer_satisfaction ?? 0}/100`}
              iconColor="text-destructive"
            />
          </div>

          {/* Resumen ejecutivo */}
          <div className="p-6 bg-card rounded-lg border">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Resumen Ejecutivo</h3>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {executiveDashboard?.summary || 
                   (rawData?.executive_summary as Record<string, unknown>)?.key_insight as string ||
                   'Análisis en proceso...'}
                </p>
              </div>
            </div>
          </div>

          {/* Comparación con periodo anterior */}
          {executiveDashboard?.comparison_last_period && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <ComparisonMetric
                label="Ingresos"
                change={executiveDashboard.comparison_last_period.revenue_change ?? 0}
              />
              <ComparisonMetric
                label="Beneficio"
                change={executiveDashboard.comparison_last_period.profit_change ?? 0}
              />
              <ComparisonMetric
                label="Productividad"
                change={executiveDashboard.comparison_last_period.team_productivity_change ?? 0}
              />
              <ComparisonMetric
                label="Clientes"
                change={executiveDashboard.comparison_last_period.customer_growth ?? 0}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* TABS PRINCIPALES */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full h-auto p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            💰 Finanzas
          </TabsTrigger>
          <TabsTrigger value="growth" className="data-[state=active]:bg-success data-[state=active]:text-white">
            📈 Crecimiento
          </TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-warning data-[state=active]:text-white">
            👥 Equipo
          </TabsTrigger>
          <TabsTrigger value="strategy" className="data-[state=active]:bg-info data-[state=active]:text-white">
            🎯 Estrategia
          </TabsTrigger>
          <TabsTrigger value="future" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
            🔮 Futuro
          </TabsTrigger>
          <TabsTrigger value="honest" className="data-[state=active]:bg-destructive data-[state=active]:text-white">
            🔥 Opinión IA
          </TabsTrigger>
        </TabsList>

        {/* TAB FINANZAS */}
        <TabsContent value="overview" className="space-y-6">
          <FinancialHealthSection data={data.financial_health} />
        </TabsContent>

        {/* TAB CRECIMIENTO */}
        <TabsContent value="growth" className="space-y-6">
          <GrowthAnalysisSection data={data.growth_analysis} />
        </TabsContent>

        {/* TAB EQUIPO */}
        <TabsContent value="team" className="space-y-6">
          <TeamPerformanceSection data={data.team_performance} />
        </TabsContent>

        {/* TAB ESTRATEGIA */}
        <TabsContent value="strategy" className="space-y-6">
          <StrategySection 
            priorities={data.strategic_priorities} 
            questions={data.strategic_questions}
          />
        </TabsContent>

        {/* TAB FUTURO */}
        <TabsContent value="future" className="space-y-6">
          <FutureSection 
            roadmap={data.future_roadmap}
            projections={data.projections}
          />
        </TabsContent>

        {/* TAB OPINIÓN SINCERA */}
        <TabsContent value="honest" className="space-y-6">
          <HonestFeedbackSection data={data.honest_feedback} />
        </TabsContent>
      </Tabs>

      {/* ALERTAS CRÍTICAS (Siempre visible) */}
      {data.critical_alerts && data.critical_alerts.length > 0 && (
        <CriticalAlertsSection alerts={data.critical_alerts} />
      )}

      {/* BENCHMARKING */}
      <BenchmarkingSection data={data.benchmarking} />
    </div>
  );
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

interface MiniMetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: number;
  iconColor?: string;
}

function MiniMetricCard({ icon, label, value, trend, iconColor = "text-primary" }: MiniMetricCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
      <div className={`p-3 rounded-full bg-primary/10 ${iconColor}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold">{value}</p>
          {trend !== undefined && trend !== 0 && (
            <span className={`text-xs flex items-center ${trend > 0 ? 'text-success' : 'text-destructive'}`}>
              {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface ComparisonMetricProps {
  label: string;
  change: number;
}

function ComparisonMetric({ label, change }: ComparisonMetricProps) {
  const isPositive = change > 0;
  return (
    <div className="p-3 bg-card rounded-lg border text-center">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center justify-center gap-1">
        {isPositive ? (
          <TrendingUp className="w-4 h-4 text-success" />
        ) : (
          <TrendingDown className="w-4 h-4 text-destructive" />
        )}
        <span className={`text-lg font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
          {isPositive ? '+' : ''}{change.toFixed(1)}%
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">vs periodo anterior</p>
    </div>
  );
}

function getHealthStatusColor(status: HealthStatus): string {
  const colors = {
    excellent: 'bg-success/10 text-success border-success',
    good: 'bg-primary/10 text-primary border-primary',
    warning: 'bg-warning/10 text-warning border-warning',
    critical: 'bg-destructive/10 text-destructive border-destructive',
  };
  return colors[status];
}

function getHealthStatusText(status: HealthStatus): string {
  const texts = {
    excellent: '🌟 Excelente',
    good: '✅ Bueno',
    warning: '⚠️ Atención',
    critical: '🚨 Crítico',
  };
  return texts[status];
}

// ============================================
// SECCIONES PRINCIPALES (stubs - se crearán después)
// ============================================

// Las secciones usan los tipos específicos de ai-analysis.types.ts
import type { 
  FinancialHealth, 
  GrowthAnalysis, 
  TeamPerformance, 
  StrategicPriorities, 
  StrategicQuestions
} from '@/types/ai-analysis.types';

function FinancialHealthSection({ data }: { data: FinancialHealth }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💰 Salud Financiera
          <Badge variant="outline">{data.score ?? 0}/100</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Componente de finanzas en desarrollo...</p>
      </CardContent>
    </Card>
  );
}

function GrowthAnalysisSection({ data }: { data: GrowthAnalysis }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>📈 Análisis de Crecimiento</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Componente de crecimiento en desarrollo...</p>
      </CardContent>
    </Card>
  );
}

function TeamPerformanceSection({ data }: { data: TeamPerformance }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>👥 Rendimiento del Equipo</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Componente de equipo en desarrollo...</p>
      </CardContent>
    </Card>
  );
}

function StrategySection({ priorities, questions }: { priorities: StrategicPriorities; questions: StrategicQuestions }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>🎯 Estrategia y Prioridades</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Componente de estrategia en desarrollo...</p>
      </CardContent>
    </Card>
  );
}

function FutureSection({ roadmap, projections }: { roadmap: FutureRoadmap; projections: Projections }) {
  const [activeTimeline, setActiveTimeline] = useState<'30' | '90' | 'year'>('30');
  
  const getPriorityColor = (priority: PriorityLevel) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  const getTimelineData = () => {
    switch (activeTimeline) {
      case '30': return roadmap?.next_30_days || [];
      case '90': return roadmap?.next_90_days || [];
      case 'year': return roadmap?.next_year || [];
      default: return [];
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header con tabs de timeline */}
      <Card className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 border-2 border-violet-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                🔮 Roadmap Estratégico
              </CardTitle>
              <CardDescription>
                Tu plan de crecimiento personalizado generado con IA
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeTimeline === '30' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTimeline('30')}
              >
                30 días
              </Button>
              <Button
                variant={activeTimeline === '90' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTimeline('90')}
              >
                90 días
              </Button>
              <Button
                variant={activeTimeline === 'year' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTimeline('year')}
              >
                12 meses
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Decisiones Clave - Próximos {activeTimeline === '30' ? '30 días' : activeTimeline === '90' ? '90 días' : '12 meses'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getTimelineData().length > 0 ? (
            <div className="relative">
              {/* Línea vertical del timeline */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20" />
              
              <div className="space-y-6">
                {getTimelineData().map((decision, index) => (
                  <div key={decision.id || index} className="relative pl-14">
                    {/* Punto del timeline */}
                    <div className={`absolute left-4 w-5 h-5 rounded-full border-2 border-primary ${
                      index === 0 ? 'bg-primary' : 'bg-background'
                    }`} />
                    
                    <Card className={`${index === 0 ? 'border-primary shadow-md' : ''}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base flex items-center gap-2">
                              {decision.title}
                              <Badge className={getPriorityColor(decision.priority)} variant="outline">
                                {decision.priority}
                              </Badge>
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {decision.description}
                            </CardDescription>
                          </div>
                          {decision.estimated_impact && (
                            <Badge variant="secondary" className="shrink-0">
                              Impacto: {decision.estimated_impact}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {decision.action_items && decision.action_items.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Acciones:</p>
                            <div className="flex flex-wrap gap-2">
                              {decision.action_items.map((action, idx) => (
                                <span 
                                  key={idx}
                                  className="text-xs bg-muted px-2 py-1 rounded-full"
                                >
                                  {action}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {decision.dependencies && decision.dependencies.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <span className="font-medium">Dependencias:</span> {decision.dependencies.join(', ')}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No hay decisiones planificadas para este período
            </p>
          )}
        </CardContent>
      </Card>

      {/* Proyecciones Financieras */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {projections?.next_month && (
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                📅 Próximo Mes
                <Badge variant="outline">{projections.next_month.confidence}% confianza</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ingresos</span>
                  <span className="font-semibold text-green-500">{formatCurrency(projections.next_month.revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Gastos</span>
                  <span className="font-semibold text-red-500">{formatCurrency(projections.next_month.expenses)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Beneficio Neto</span>
                  <span className={`font-bold ${projections.next_month.net_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(projections.next_month.net_profit)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pt-1">
                  <span>👥 {projections.next_month.team_size} personas</span>
                  <span>🎯 {projections.next_month.customers} clientes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {projections?.next_quarter && (
          <Card className="border-purple-500/30 bg-purple-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                📊 Próximo Trimestre
                <Badge variant="outline">{projections.next_quarter.confidence}% confianza</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ingresos</span>
                  <span className="font-semibold text-green-500">{formatCurrency(projections.next_quarter.revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Gastos</span>
                  <span className="font-semibold text-red-500">{formatCurrency(projections.next_quarter.expenses)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Beneficio Neto</span>
                  <span className={`font-bold ${projections.next_quarter.net_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(projections.next_quarter.net_profit)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pt-1">
                  <span>👥 {projections.next_quarter.team_size} personas</span>
                  <span>🎯 {projections.next_quarter.customers} clientes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {projections?.next_year && (
          <Card className="border-indigo-500/30 bg-indigo-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                🎯 Próximo Año
                <Badge variant="outline">{projections.next_year.confidence}% confianza</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ingresos</span>
                  <span className="font-semibold text-green-500">{formatCurrency(projections.next_year.revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Gastos</span>
                  <span className="font-semibold text-red-500">{formatCurrency(projections.next_year.expenses)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Beneficio Neto</span>
                  <span className={`font-bold ${projections.next_year.net_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(projections.next_year.net_profit)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pt-1">
                  <span>👥 {projections.next_year.team_size} personas</span>
                  <span>🎯 {projections.next_year.customers} clientes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Gráfico de Proyecciones */}
      {projections?.charts?.revenue_projection && projections.charts.revenue_projection.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📈 Proyección de Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projections.charts.revenue_projection}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`} className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan de Escalamiento */}
      {roadmap?.scaling_plan && (
        <Card className="border-2 border-emerald-500/30">
          <CardHeader className="bg-emerald-500/5">
            <CardTitle className="text-xl flex items-center gap-2">
              🚀 Plan de Escalamiento
            </CardTitle>
            <CardDescription>
              De {roadmap.scaling_plan.current_capacity} → {roadmap.scaling_plan.target_capacity}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cuellos de Botella */}
              {roadmap.scaling_plan.bottlenecks_for_scale && roadmap.scaling_plan.bottlenecks_for_scale.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    Cuellos de Botella a Resolver
                  </h4>
                  <ul className="space-y-2">
                    {roadmap.scaling_plan.bottlenecks_for_scale.map((bottleneck, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-orange-500 mt-1">⚠️</span>
                        {bottleneck}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Infraestructura */}
              {roadmap.scaling_plan.infrastructure_needs && roadmap.scaling_plan.infrastructure_needs.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-500" />
                    Necesidades de Infraestructura
                  </h4>
                  <ul className="space-y-2">
                    {roadmap.scaling_plan.infrastructure_needs.map((need, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-blue-500 mt-1">🔧</span>
                        {need}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Inversiones Requeridas */}
            {roadmap.scaling_plan.required_investments && roadmap.scaling_plan.required_investments.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  Inversiones Requeridas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {roadmap.scaling_plan.required_investments.map((investment, idx) => (
                    <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                      <div className="font-medium text-sm">{investment.area}</div>
                      <div className="text-lg font-bold text-primary">{investment.amount}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        ROI: {investment.roi_percentage}% • {investment.timeline}
                      </div>
                      <div className={`text-xs mt-1 ${getRiskColor(investment.risk_level)}`}>
                        Riesgo: {investment.risk_level}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Plan de Contratación */}
            {roadmap.scaling_plan.hiring_plan && roadmap.scaling_plan.hiring_plan.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  Plan de Contratación
                </h4>
                <div className="space-y-3">
                  {roadmap.scaling_plan.hiring_plan.map((hire, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{hire.role}</div>
                        <div className="text-xs text-muted-foreground">{hire.why}</div>
                      </div>
                      <Badge className={getPriorityColor(hire.priority)} variant="outline">
                        {hire.priority}
                      </Badge>
                      <div className="text-right">
                        <div className="text-sm font-medium">{hire.when}</div>
                        <div className="text-xs text-muted-foreground">{hire.estimated_cost}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline de escalado */}
            {roadmap.scaling_plan.timeline_to_scale && (
              <div className="mt-6 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium">Tiempo estimado para escalar:</span>
                  <span className="text-lg font-bold text-emerald-600">{roadmap.scaling_plan.timeline_to_scale}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Escenarios */}
      {projections?.scenarios && projections.scenarios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🎲 Análisis de Escenarios</CardTitle>
            <CardDescription>Proyecciones bajo diferentes condiciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projections.scenarios.map((scenario, idx) => (
                <Card key={idx} className={`${
                  scenario.name.toLowerCase().includes('optimista') ? 'border-green-500/30 bg-green-500/5' :
                  scenario.name.toLowerCase().includes('pesimista') ? 'border-red-500/30 bg-red-500/5' :
                  'border-yellow-500/30 bg-yellow-500/5'
                }`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      {scenario.name}
                      <Badge variant="outline">{scenario.probability}% prob.</Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">{scenario.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Ingresos</span>
                      <span className="font-medium">{formatCurrency(scenario.projected_revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gastos</span>
                      <span className="font-medium">{formatCurrency(scenario.projected_expenses)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Equipo</span>
                      <span className="font-medium">{scenario.projected_team_size} personas</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Clientes</span>
                      <span className="font-medium">{scenario.projected_customers}</span>
                    </div>
                    {scenario.risk_factors && scenario.risk_factors.length > 0 && (
                      <div className="pt-2 border-t">
                        <span className="text-xs text-muted-foreground">Riesgos:</span>
                        <ul className="text-xs text-muted-foreground mt-1">
                          {scenario.risk_factors.slice(0, 2).map((risk, ridx) => (
                            <li key={ridx}>• {risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supuestos Clave */}
      {projections?.key_assumptions && projections.key_assumptions.length > 0 && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">📋 Supuestos Clave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {projections.key_assumptions.map((assumption, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {assumption}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Factores de Riesgo */}
      {projections?.risk_factors && projections.risk_factors.length > 0 && (
        <Card className="border-orange-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Factores de Riesgo a Monitorear
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {projections.risk_factors.map((risk, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-orange-500">⚡</span>
                  {risk}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function HonestFeedbackSection({ data }: { data: HonestFeedbackType }) {
  return (
    <Card className="border-2 border-destructive">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Lock className="w-8 h-8 text-destructive" />
          <div>
            <CardTitle className="text-2xl">🔥 Opinión Sincera de la IA</CardTitle>
            <CardDescription>Feedback sin filtros. Solo datos duros y verdades incómodas.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Componente de feedback honesto en desarrollo...</p>
      </CardContent>
    </Card>
  );
}

function CriticalAlertsSection({ alerts }: { alerts: AlertType[] }) {
  return (
    <Card className="border-2 border-destructive shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-6 h-6" />
          ⚠️ Alertas Críticas ({alerts.length})
        </CardTitle>
        <CardDescription>Requieren atención inmediata</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Componente de alertas en desarrollo...</p>
      </CardContent>
    </Card>
  );
}

function BenchmarkingSection({ data }: { data: Benchmarking }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 Benchmarking vs Sector</CardTitle>
        <CardDescription>Cómo te comparas con empresas similares</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Componente de benchmarking en desarrollo...</p>
      </CardContent>
    </Card>
  );
}

export default AIAnalysisDashboard;
