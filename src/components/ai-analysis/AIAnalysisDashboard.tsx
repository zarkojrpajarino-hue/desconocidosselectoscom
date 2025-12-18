// ============================================
// DASHBOARD PRINCIPAL - ANÁLISIS IA V3.0
// src/components/ai-analysis/AIAnalysisDashboard.tsx
// ============================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Users,
  Heart,
  AlertCircle,
  Sparkles,
  Download,
  RefreshCw,
  Globe,
  Target,
  Brain,
  BarChart3,
  FileText,
} from 'lucide-react';
import { AIAnalysisResult, HealthStatus } from '@/types/ai-analysis.types';
import { useTranslation } from 'react-i18next';

// Import section components
import { FinancialHealthSection } from './sections/FinancialHealthSection';
import { GrowthAnalysisSection } from './sections/GrowthAnalysisSection';
import { TeamPerformanceSection } from './sections/TeamPerformanceSection';
import { StrategySection } from './sections/StrategySection';
import { MarketStudySection } from './sections/MarketStudySection';
import { FutureSection } from './sections/FutureSection';
import { HonestFeedbackSection } from './sections/HonestFeedbackSection';
import { BenchmarkingSection } from './sections/BenchmarkingSection';
import { CriticalAlertsSection } from './sections/CriticalAlertsSection';

interface AIAnalysisDashboardProps {
  data: AIAnalysisResult;
  onRefresh?: () => void;
  onExport?: (format: 'pdf' | 'csv') => void;
  loading?: boolean;
  isDemo?: boolean;
}

export function AIAnalysisDashboard({ data, onRefresh, onExport, loading, isDemo }: AIAnalysisDashboardProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  // Show demo badge if in demo mode
  const showDemoBadge = isDemo;

  // Handle both old format (executive_summary) and new format (executive_dashboard)
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
    ((executiveDashboard as unknown as Record<string, unknown>)?.overall_health as HealthStatus) || 'warning';

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
    <div className="space-y-6 md:space-y-8 pb-12">
      {/* HERO SECTION - RESUMEN EJECUTIVO */}
      <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-2 border-primary/20 shadow-lg">
        <CardContent className="p-4 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-3">
                <h2 className="text-4xl md:text-5xl font-bold">{overallScore}/100</h2>
                <Badge className={getHealthStatusColor(healthStatus)} variant="outline">
                  {getHealthStatusText(healthStatus)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Score General de Salud Empresarial</p>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              <Button variant="outline" size="sm" onClick={() => onExport?.('pdf')} className="flex-1 md:flex-none">
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Exportar</span> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading} className="flex-1 md:flex-none">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>
            </div>
          </div>

          {/* Mini KPIs Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-6">
            <MiniMetricCard
              icon={<TrendingUp className="w-5 h-5 md:w-6 md:h-6" />}
              label="Ingresos"
              value={`${(executiveDashboard?.key_metrics?.revenue_trend ?? 0) > 0 ? '+' : ''}${(executiveDashboard?.key_metrics?.revenue_trend ?? 0).toFixed(1)}%`}
              trend={executiveDashboard?.key_metrics?.revenue_trend ?? 0}
              iconColor="text-green-500"
            />
            <MiniMetricCard
              icon={<Zap className="w-5 h-5 md:w-6 md:h-6" />}
              label="Eficiencia"
              value={`${executiveDashboard?.key_metrics?.efficiency_score ?? 0}/100`}
              iconColor="text-yellow-500"
            />
            <MiniMetricCard
              icon={<Users className="w-5 h-5 md:w-6 md:h-6" />}
              label="Equipo"
              value={`${executiveDashboard?.key_metrics?.team_performance ?? 0}/100`}
              iconColor="text-primary"
            />
            <MiniMetricCard
              icon={<Heart className="w-5 h-5 md:w-6 md:h-6" />}
              label="Clientes"
              value={`${executiveDashboard?.key_metrics?.customer_satisfaction ?? 0}/100`}
              iconColor="text-red-500"
            />
          </div>

          {/* Resumen ejecutivo */}
          <div className="p-4 md:p-6 bg-card rounded-lg border">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Resumen Ejecutivo</h3>
                <p className="text-sm md:text-base leading-relaxed text-muted-foreground">
                  {executiveDashboard?.summary || 
                   (rawData?.executive_summary as Record<string, unknown>)?.key_insight as string ||
                   'Análisis en proceso...'}
                </p>
              </div>
            </div>
          </div>

          {/* Comparación con periodo anterior */}
          {executiveDashboard?.comparison_last_period && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-4 md:mt-6">
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

      {/* TABS PRINCIPALES - Scrollable on mobile */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex h-auto p-1 w-max md:w-full md:grid md:grid-cols-8 gap-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap px-3 py-2">
              <BarChart3 className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Finanzas</span>
            </TabsTrigger>
            <TabsTrigger value="growth" className="data-[state=active]:bg-green-500 data-[state=active]:text-white whitespace-nowrap px-3 py-2">
              <TrendingUp className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Crecimiento</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white whitespace-nowrap px-3 py-2">
              <Users className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Equipo</span>
            </TabsTrigger>
            <TabsTrigger value="strategy" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white whitespace-nowrap px-3 py-2">
              <Target className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Estrategia</span>
            </TabsTrigger>
            <TabsTrigger value="market" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white whitespace-nowrap px-3 py-2">
              <Globe className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Mercado</span>
            </TabsTrigger>
            <TabsTrigger value="future" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white whitespace-nowrap px-3 py-2">
              <Sparkles className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Futuro</span>
            </TabsTrigger>
            <TabsTrigger value="honest" className="data-[state=active]:bg-red-500 data-[state=active]:text-white whitespace-nowrap px-3 py-2">
              <Brain className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Opinión IA</span>
            </TabsTrigger>
            <TabsTrigger value="benchmark" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white whitespace-nowrap px-3 py-2">
              <FileText className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Benchmark</span>
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" className="md:hidden" />
        </ScrollArea>

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

        {/* TAB MERCADO */}
        <TabsContent value="market" className="space-y-6">
          <MarketStudySection data={(data as unknown as Record<string, unknown>).market_study as Record<string, unknown>} />
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

        {/* TAB BENCHMARKING */}
        <TabsContent value="benchmark" className="space-y-6">
          <BenchmarkingSection data={data.benchmarking} />
        </TabsContent>
      </Tabs>

      {/* ALERTAS CRÍTICAS (Siempre visible si hay) */}
      {data.critical_alerts && data.critical_alerts.length > 0 && (
        <CriticalAlertsSection alerts={data.critical_alerts} />
      )}
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
    <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-card rounded-lg border">
      <div className={`p-2 md:p-3 rounded-full bg-primary/10 ${iconColor}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs md:text-sm text-muted-foreground truncate">{label}</p>
        <div className="flex items-center gap-1 md:gap-2">
          <p className="text-lg md:text-2xl font-bold">{value}</p>
          {trend !== undefined && trend !== 0 && (
            <span className={`text-xs flex items-center ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
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
    <div className="p-2 md:p-3 bg-card rounded-lg border text-center">
      <p className="text-xs md:text-sm text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center justify-center gap-1">
        {isPositive ? (
          <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
        ) : (
          <TrendingDown className="w-3 h-3 md:w-4 md:h-4 text-red-500" />
        )}
        <span className={`text-sm md:text-lg font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? '+' : ''}{change.toFixed(1)}%
        </span>
      </div>
      <p className="text-[10px] md:text-xs text-muted-foreground mt-1">vs periodo anterior</p>
    </div>
  );
}

function getHealthStatusColor(status: HealthStatus): string {
  const colors = {
    excellent: 'bg-green-500/10 text-green-500 border-green-500',
    good: 'bg-primary/10 text-primary border-primary',
    warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500',
    critical: 'bg-red-500/10 text-red-500 border-red-500',
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