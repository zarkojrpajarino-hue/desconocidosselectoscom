import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { 
  Trophy, Target, TrendingUp, TrendingDown, 
  Minus, Building2, BarChart3 
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface Benchmark {
  kpi_metric: string;
  your_value: number;
  industry_average: number;
  top_25_percentile: number;
  top_10_percentile: number;
  position: 'above_top10' | 'above_top25' | 'above_avg' | 'below_avg';
}

const kpiLabels: Record<string, string> = {
  revenue_growth: 'Crecimiento Ingresos',
  conversion_rate: 'Tasa de Conversión',
  cac: 'CAC',
  ltv: 'LTV',
  ltv_cac_ratio: 'Ratio LTV/CAC',
  churn_rate: 'Churn Rate',
  nps: 'NPS',
  gross_margin: 'Margen Bruto',
};

const positionConfig = {
  above_top10: { color: 'text-emerald-600', bg: 'bg-emerald-500/10', icon: Trophy, label: 'Top 10%' },
  above_top25: { color: 'text-blue-600', bg: 'bg-blue-500/10', icon: TrendingUp, label: 'Top 25%' },
  above_avg: { color: 'text-amber-600', bg: 'bg-amber-500/10', icon: Target, label: 'Sobre Promedio' },
  below_avg: { color: 'text-rose-600', bg: 'bg-rose-500/10', icon: TrendingDown, label: 'Bajo Promedio' },
};

export function KPIBenchmarking() {
  const { organizationId } = useCurrentOrganization();
  const [data, setData] = useState<Benchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [industry, setIndustry] = useState<string>('');

  useEffect(() => {
    async function fetchBenchmarks() {
      if (!organizationId) return;
      try {
        setLoading(true);

        // Obtener industria de la organización
        const { data: org } = await supabase
          .from('organizations')
          .select('industry')
          .eq('id', organizationId)
          .single();

        setIndustry(org?.industry || 'general');

        // Obtener benchmarks de industria
        const { data: benchmarks, error: benchError } = await supabase
          .from('kpi_benchmarks')
          .select('*')
          .eq('industry', org?.industry || 'general');

        if (benchError) throw benchError;

        // Obtener valores actuales de la organización
        const { data: currentMetrics } = await supabase
          .from('financial_metrics')
          .select('*')
          .eq('organization_id', organizationId)
          .order('month', { ascending: false })
          .limit(1)
          .single();

        // Construir comparación
        const comparisonData: Benchmark[] = (benchmarks || []).map((bench: any) => {
          const yourValue = getMetricValue(currentMetrics, bench.kpi_metric);
          const avg = bench.average_value || 0;
          const top25 = bench.top_25_percentile || avg * 1.3;
          const top10 = bench.top_10_percentile || avg * 1.6;

          let position: Benchmark['position'] = 'below_avg';
          if (yourValue >= top10) position = 'above_top10';
          else if (yourValue >= top25) position = 'above_top25';
          else if (yourValue >= avg) position = 'above_avg';

          return {
            kpi_metric: bench.kpi_metric,
            your_value: yourValue,
            industry_average: avg,
            top_25_percentile: top25,
            top_10_percentile: top10,
            position,
          };
        });

        setData(comparisonData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetchBenchmarks();
  }, [organizationId]);

  function getMetricValue(metrics: any, kpiMetric: string): number {
    if (!metrics) return 0;
    const mapping: Record<string, string> = {
      conversion_rate: 'margin_percentage',
      gross_margin: 'gross_margin',
      cac: 'cac',
      ltv: 'ltv',
      ltv_cac_ratio: 'ltv_cac_ratio',
    };
    return metrics[mapping[kpiMetric]] || 0;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <p className="text-destructive text-center">Error cargando benchmarks</p>
        </CardContent>
      </Card>
    );
  }

  const benchmarks = data || [];
  const topPerformers = benchmarks.filter(b => b.position === 'above_top10' || b.position === 'above_top25').length;
  const belowAvg = benchmarks.filter(b => b.position === 'below_avg').length;

  // Preparar datos para gráfico
  const chartData = benchmarks.map(b => ({
    name: kpiLabels[b.kpi_metric] || b.kpi_metric,
    tu_valor: b.your_value,
    promedio: b.industry_average,
    top_25: b.top_25_percentile,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Benchmarking de Industria</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Comparación con sector: {industry || 'General'}
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{topPerformers}</p>
            <p className="text-muted-foreground">Top Performer</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-rose-600">{belowAvg}</p>
            <p className="text-muted-foreground">A Mejorar</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Comparativa Visual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="tu_valor" fill="hsl(var(--primary))" name="Tu valor" radius={[0, 4, 4, 0]} />
                <Bar dataKey="promedio" fill="hsl(var(--muted))" name="Promedio industria" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Benchmarks Grid */}
      {benchmarks.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay benchmarks disponibles para tu industria</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benchmarks.map((benchmark, index) => {
            const config = positionConfig[benchmark.position];
            const PositionIcon = config.icon;

            // Calcular posición relativa (0-100) donde tu valor está
            const range = benchmark.top_10_percentile - benchmark.industry_average * 0.5;
            const relativePosition = Math.min(100, Math.max(0, 
              ((benchmark.your_value - benchmark.industry_average * 0.5) / range) * 100
            ));

            return (
              <Card key={index} className={`${config.bg} border-transparent`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">
                      {kpiLabels[benchmark.kpi_metric] || benchmark.kpi_metric}
                    </CardTitle>
                    <Badge variant="outline" className={config.color}>
                      <PositionIcon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Your Value */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tu valor</span>
                    <span className={`text-2xl font-bold ${config.color}`}>
                      {benchmark.your_value.toLocaleString('es-ES', { maximumFractionDigits: 1 })}
                    </span>
                  </div>

                  {/* Position Bar */}
                  <div className="space-y-2">
                    <div className="relative h-3 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="absolute h-full bg-primary rounded-full transition-all"
                        style={{ width: `${relativePosition}%` }}
                      />
                      {/* Markers */}
                      <div className="absolute h-full w-0.5 bg-amber-500" style={{ left: '33%' }} />
                      <div className="absolute h-full w-0.5 bg-emerald-500" style={{ left: '66%' }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Promedio: {benchmark.industry_average.toFixed(1)}</span>
                      <span>Top 25%: {benchmark.top_25_percentile.toFixed(1)}</span>
                      <span>Top 10%: {benchmark.top_10_percentile.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Difference */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">vs Promedio</span>
                    <span className={benchmark.your_value >= benchmark.industry_average ? 'text-emerald-600' : 'text-rose-600'}>
                      {benchmark.your_value >= benchmark.industry_average ? '+' : ''}
                      {((benchmark.your_value - benchmark.industry_average) / benchmark.industry_average * 100).toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
