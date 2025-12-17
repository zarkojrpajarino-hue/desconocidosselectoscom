// ============================================
// SECCIÓN BENCHMARKING
// ============================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import type { Benchmarking } from '@/types/ai-analysis.types';

interface BenchmarkingSectionProps {
  data: Benchmarking;
}

export function BenchmarkingSection({ data }: BenchmarkingSectionProps) {
  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No hay datos de benchmarking disponibles
        </CardContent>
      </Card>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Prepare radar chart data
  const radarData = [
    {
      metric: 'Crecimiento',
      'Tu Empresa': data.your_position?.revenue_growth || 0,
      'Industria': data.industry_avg?.revenue_growth || 0,
    },
    {
      metric: 'Margen',
      'Tu Empresa': data.your_position?.profit_margin || 0,
      'Industria': data.industry_avg?.profit_margin || 0,
    },
    {
      metric: 'LTV/CAC',
      'Tu Empresa': data.your_position?.ltv && data.your_position?.cac 
        ? Math.min((data.your_position.ltv / data.your_position.cac) * 10, 100) 
        : 0,
      'Industria': data.industry_avg?.ltv && data.industry_avg?.cac 
        ? Math.min((data.industry_avg.ltv / data.industry_avg.cac) * 10, 100) 
        : 0,
    },
    {
      metric: 'Retención',
      'Tu Empresa': 100 - (data.your_position?.churn_rate || 0),
      'Industria': 100 - (data.industry_avg?.churn_rate || 0),
    },
    {
      metric: 'Productividad',
      'Tu Empresa': data.your_position?.team_productivity || 0,
      'Industria': data.industry_avg?.team_productivity || 0,
    },
  ];

  const getPercentileText = (percentile: number) => {
    if (percentile >= 80) return { text: 'Top 20%', color: 'text-green-500' };
    if (percentile >= 60) return { text: 'Top 40%', color: 'text-blue-500' };
    if (percentile >= 40) return { text: 'Promedio', color: 'text-yellow-500' };
    if (percentile >= 20) return { text: 'Por debajo', color: 'text-orange-500' };
    return { text: 'Necesita mejora', color: 'text-red-500' };
  };

  const percentileInfo = getPercentileText(data.percentile_rank || 50);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-cyan-500/10 border-2 border-indigo-500/30">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                📊 Benchmarking vs Industria
              </CardTitle>
              <CardDescription>
                Cómo te comparas con empresas similares en tu sector
              </CardDescription>
            </div>
            <div className="text-center p-4 bg-card rounded-lg border">
              <div className="text-3xl md:text-4xl font-bold text-primary">{data.percentile_rank || 50}%</div>
              <p className={`text-sm font-medium ${percentileInfo.color}`}>
                {percentileInfo.text}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Percentil en tu industria</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Radar Chart Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Comparativa de Métricas Clave
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  name="Tu Empresa"
                  dataKey="Tu Empresa"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Radar
                  name="Industria"
                  dataKey="Industria"
                  stroke="#888"
                  fill="#888"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Metric Comparisons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Revenue Growth */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Crecimiento de Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Tu empresa</span>
                  <span className="font-bold">{data.your_position?.revenue_growth?.toFixed(1) || 0}%</span>
                </div>
                <Progress value={Math.min(data.your_position?.revenue_growth || 0, 100)} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1 text-muted-foreground">
                  <span>Promedio industria</span>
                  <span>{data.industry_avg?.revenue_growth?.toFixed(1) || 0}%</span>
                </div>
                <Progress value={Math.min(data.industry_avg?.revenue_growth || 0, 100)} className="h-2 bg-muted" />
              </div>
              <ComparisonIndicator
                yours={data.your_position?.revenue_growth || 0}
                industry={data.industry_avg?.revenue_growth || 0}
              />
            </div>
          </CardContent>
        </Card>

        {/* Profit Margin */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              Margen de Beneficio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Tu empresa</span>
                  <span className="font-bold">{data.your_position?.profit_margin?.toFixed(1) || 0}%</span>
                </div>
                <Progress value={Math.min(data.your_position?.profit_margin || 0, 100)} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1 text-muted-foreground">
                  <span>Promedio industria</span>
                  <span>{data.industry_avg?.profit_margin?.toFixed(1) || 0}%</span>
                </div>
                <Progress value={Math.min(data.industry_avg?.profit_margin || 0, 100)} className="h-2 bg-muted" />
              </div>
              <ComparisonIndicator
                yours={data.your_position?.profit_margin || 0}
                industry={data.industry_avg?.profit_margin || 0}
              />
            </div>
          </CardContent>
        </Card>

        {/* Churn Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              Tasa de Abandono
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Tu empresa</span>
                  <span className="font-bold">{data.your_position?.churn_rate?.toFixed(1) || 0}%</span>
                </div>
                <Progress value={Math.min(data.your_position?.churn_rate || 0, 100)} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1 text-muted-foreground">
                  <span>Promedio industria</span>
                  <span>{data.industry_avg?.churn_rate?.toFixed(1) || 0}%</span>
                </div>
                <Progress value={Math.min(data.industry_avg?.churn_rate || 0, 100)} className="h-2 bg-muted" />
              </div>
              <ComparisonIndicator
                yours={data.your_position?.churn_rate || 0}
                industry={data.industry_avg?.churn_rate || 0}
                lowerIsBetter
              />
            </div>
          </CardContent>
        </Card>

        {/* Team Productivity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-500" />
              Productividad del Equipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Tu empresa</span>
                  <span className="font-bold">{data.your_position?.team_productivity?.toFixed(1) || 0}/100</span>
                </div>
                <Progress value={data.your_position?.team_productivity || 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1 text-muted-foreground">
                  <span>Promedio industria</span>
                  <span>{data.industry_avg?.team_productivity?.toFixed(1) || 0}/100</span>
                </div>
                <Progress value={data.industry_avg?.team_productivity || 0} className="h-2 bg-muted" />
              </div>
              <ComparisonIndicator
                yours={data.your_position?.team_productivity || 0}
                industry={data.industry_avg?.team_productivity || 0}
              />
            </div>
          </CardContent>
        </Card>

        {/* CAC */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              💰 Coste de Adquisición (CAC)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Tu empresa</span>
                <span className="text-lg font-bold">€{data.your_position?.cac?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="text-sm">Promedio industria</span>
                <span>€{data.industry_avg?.cac?.toLocaleString() || 0}</span>
              </div>
              <ComparisonIndicator
                yours={data.your_position?.cac || 0}
                industry={data.industry_avg?.cac || 0}
                lowerIsBetter
              />
            </div>
          </CardContent>
        </Card>

        {/* LTV */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              💎 Valor de Vida del Cliente (LTV)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Tu empresa</span>
                <span className="text-lg font-bold">€{data.your_position?.ltv?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="text-sm">Promedio industria</span>
                <span>€{data.industry_avg?.ltv?.toLocaleString() || 0}</span>
              </div>
              <ComparisonIndicator
                yours={data.your_position?.ltv || 0}
                industry={data.industry_avg?.ltv || 0}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gaps to Close */}
      {data.gaps && data.gaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              🎯 Brechas a Cerrar
            </CardTitle>
            <CardDescription>
              Áreas donde necesitas mejorar para alcanzar el promedio de tu industria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.gaps.map((gap, idx) => (
                <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{gap.metric}</span>
                      <Badge className={getPriorityColor(gap.priority)} variant="outline">
                        {gap.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {gap.improvement_needed}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-red-500">{gap.gap}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Peer Comparison */}
      {data.peer_comparison && (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Award className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-2">Comparativa con Empresas Similares</h4>
                <p className="text-sm text-muted-foreground">{data.peer_comparison}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Comparison Indicator Component
function ComparisonIndicator({ 
  yours, 
  industry, 
  lowerIsBetter = false 
}: { 
  yours: number; 
  industry: number; 
  lowerIsBetter?: boolean;
}) {
  const diff = yours - industry;
  const isPositive = lowerIsBetter ? diff < 0 : diff > 0;
  const absPercentage = Math.abs(diff);

  if (absPercentage < 1) {
    return (
      <div className="text-xs text-center text-muted-foreground py-1">
        ≈ Similar al promedio
      </div>
    );
  }

  return (
    <div className={`text-xs text-center py-1 px-2 rounded ${
      isPositive ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
    }`}>
      {isPositive ? '↑' : '↓'} {absPercentage.toFixed(1)}% {isPositive ? 'mejor' : 'peor'} que el promedio
    </div>
  );
}