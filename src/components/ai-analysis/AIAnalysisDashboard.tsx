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
import { AIAnalysisResult, HealthStatus, TrendDirection, Priority, IndividualPerformance } from '@/types/ai-analysis.types';

interface AIAnalysisDashboardProps {
  data: AIAnalysisResult;
  onRefresh?: () => void;
  onExport?: (format: 'pdf' | 'csv') => void;
  loading?: boolean;
}

export function AIAnalysisDashboard({ data, onRefresh, onExport, loading }: AIAnalysisDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-8 pb-12">
      {/* HERO SECTION - RESUMEN EJECUTIVO */}
      <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-2 border-primary/20 shadow-lg">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <h2 className="text-5xl font-bold">{data.executive_dashboard.overall_score}/100</h2>
                <Badge className={getHealthStatusColor(data.executive_dashboard.health_status)} variant="outline">
                  {getHealthStatusText(data.executive_dashboard.health_status)}
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
              value={`${data.executive_dashboard.key_metrics.revenue_trend > 0 ? '+' : ''}${data.executive_dashboard.key_metrics.revenue_trend.toFixed(1)}%`}
              trend={data.executive_dashboard.key_metrics.revenue_trend}
              iconColor="text-success"
            />
            <MiniMetricCard
              icon={<Zap className="w-6 h-6" />}
              label="Eficiencia"
              value={`${data.executive_dashboard.key_metrics.efficiency_score}/100`}
              iconColor="text-warning"
            />
            <MiniMetricCard
              icon={<Users className="w-6 h-6" />}
              label="Equipo"
              value={`${data.executive_dashboard.key_metrics.team_performance}/100`}
              iconColor="text-primary"
            />
            <MiniMetricCard
              icon={<Heart className="w-6 h-6" />}
              label="Clientes"
              value={`${data.executive_dashboard.key_metrics.customer_satisfaction}/100`}
              iconColor="text-destructive"
            />
          </div>

          {/* Resumen ejecutivo */}
          <div className="p-6 bg-card rounded-lg border">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Resumen Ejecutivo</h3>
                <p className="text-lg leading-relaxed text-muted-foreground">{data.executive_dashboard.summary}</p>
              </div>
            </div>
          </div>

          {/* Comparación con periodo anterior */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <ComparisonMetric
              label="Ingresos"
              change={data.executive_dashboard.comparison_last_period.revenue_change}
            />
            <ComparisonMetric
              label="Beneficio"
              change={data.executive_dashboard.comparison_last_period.profit_change}
            />
            <ComparisonMetric
              label="Productividad"
              change={data.executive_dashboard.comparison_last_period.team_productivity_change}
            />
            <ComparisonMetric
              label="Clientes"
              change={data.executive_dashboard.comparison_last_period.customer_growth}
            />
          </div>
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

function FinancialHealthSection({ data }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💰 Salud Financiera
          <Badge variant="outline">{data.score}/100</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Componente de finanzas en desarrollo...</p>
      </CardContent>
    </Card>
  );
}

function GrowthAnalysisSection({ data }: any) {
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

function TeamPerformanceSection({ data }: any) {
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

function StrategySection({ priorities, questions }: any) {
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

function FutureSection({ roadmap, projections }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>🔮 Futuro y Proyecciones</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Componente de futuro en desarrollo...</p>
      </CardContent>
    </Card>
  );
}

function HonestFeedbackSection({ data }: any) {
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

function CriticalAlertsSection({ alerts }: any) {
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

function BenchmarkingSection({ data }: any) {
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
