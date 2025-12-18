import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, FunnelChart, Funnel, LabelList } from 'recharts';
import { Trophy, Target, TrendingUp, Clock } from 'lucide-react';
import { DEMO_SALES_PERFORMANCE } from '@/data/demo-bi-data';

interface SalesPerformanceProps {
  organizationId: string;
  dateRange: string;
  showDemoData?: boolean;
}

interface SalesData {
  pipeline: Array<{ stage: string; count: number; value: number }>;
  velocity: Array<{ stage: string; avgDays: number }>;
  performers: Array<{ name: string; deals: number; value: number; conversion: number }>;
  funnel: Array<{ name: string; value: number; fill: string }>;
}

export const SalesPerformance = ({ organizationId, dateRange, showDemoData = false }: SalesPerformanceProps) => {
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : dateRange === '365d' ? 365 : 1000;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Fetch leads with stage info
        const { data: leadsData } = await supabase
          .from('leads')
          .select('id, stage, estimated_value, created_at, assigned_to')
          .eq('organization_id', organizationId)
          .gte('created_at', startDate.toISOString());

        // Group by stage
        const stageOrder = ['descubrimiento', 'calificacion', 'propuesta', 'negociacion', 'won', 'lost'];
        const stageLabels: Record<string, string> = {
          descubrimiento: 'Descubrimiento',
          calificacion: 'Calificación',
          propuesta: 'Propuesta',
          negociacion: 'Negociación',
          won: 'Ganado',
          lost: 'Perdido',
        };

        const stageMap = new Map<string, { count: number; value: number }>();
        stageOrder.forEach(stage => stageMap.set(stage, { count: 0, value: 0 }));

        leadsData?.forEach(lead => {
          const stage = lead.stage?.toLowerCase() || 'descubrimiento';
          const existing = stageMap.get(stage) || { count: 0, value: 0 };
          existing.count += 1;
          existing.value += Number(lead.estimated_value || 0);
          stageMap.set(stage, existing);
        });

        const pipeline = stageOrder
          .filter(stage => stage !== 'lost')
          .map(stage => ({
            stage: stageLabels[stage] || stage,
            count: stageMap.get(stage)?.count || 0,
            value: stageMap.get(stage)?.value || 0,
          }));

        // Funnel data
        const funnelColors = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10B981', '#F59E0B', '#22C55E'];
        const funnel = pipeline.map((item, index) => ({
          name: item.stage,
          value: item.count,
          fill: funnelColors[index % funnelColors.length],
        }));

        // Fetch deal velocity from cache
        const { data: velocityData } = await supabase
          .from('deal_velocity_cache')
          .select('*')
          .eq('organization_id', organizationId);

        const velocity = velocityData?.map(v => ({
          stage: stageLabels[v.stage] || v.stage,
          avgDays: Number(v.average_days) || 0,
        })) || [];

        // Top performers - simplified without join
        const performerMap = new Map<string, { name: string; deals: number; value: number; won: number }>();
        leadsData?.forEach(lead => {
          const userName = lead.assigned_to || 'Sin asignar';
          const existing = performerMap.get(userName) || { name: userName, deals: 0, value: 0, won: 0 };
          existing.deals += 1;
          existing.value += Number(lead.estimated_value || 0);
          if (lead.stage === 'won') existing.won += 1;
          performerMap.set(userName, existing);
        });

        const performers = Array.from(performerMap.values())
          .map(p => ({
            name: p.name,
            deals: p.deals,
            value: p.value,
            conversion: p.deals > 0 ? (p.won / p.deals) * 100 : 0,
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);

        setData({ pipeline, velocity, performers, funnel });
      } catch (error) {
        console.error('Error fetching sales performance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organizationId, dateRange, showDemoData]);

  // Use demo data if enabled
  const displayData = showDemoData ? DEMO_SALES_PERFORMANCE : data;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };

  if (loading && !showDemoData) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!displayData) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sales Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Pipeline de Ventas
          </CardTitle>
          <CardDescription>Distribución de deals por etapa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData.pipeline}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="stage" className="text-xs" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip 
                  formatter={(value: number, name: string) => 
                    name === 'value' ? formatCurrency(value) : value
                  }
                />
                <Legend />
                <Bar yAxisId="left" dataKey="count" name="Deals" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="value" name="Valor" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Sales Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Embudo de Conversión
          </CardTitle>
          <CardDescription>Flujo de leads a través del pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip formatter={(value: number) => `${value} leads`} />
                <Funnel
                  dataKey="value"
                  data={displayData.funnel}
                  isAnimationActive
                >
                  <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Deal Velocity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Velocidad de Deals
          </CardTitle>
          <CardDescription>Tiempo promedio en cada etapa (días)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {displayData.velocity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={displayData.velocity}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="stage" className="text-xs" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)} días`} />
                  <Line 
                    type="monotone" 
                    dataKey="avgDays" 
                    name="Días promedio"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No hay datos de velocidad disponibles
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Top Vendedores
          </CardTitle>
          <CardDescription>Rendimiento del equipo de ventas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayData.performers.length > 0 ? (
              displayData.performers.map((performer, index) => (
                <div key={performer.name} className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                    index === 0 ? 'bg-amber-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-amber-700 text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{performer.name}</span>
                      <span className="text-sm text-muted-foreground">{performer.deals} deals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={performer.conversion} className="flex-1 h-2" />
                      <span className="text-xs text-muted-foreground w-12">{performer.conversion.toFixed(0)}%</span>
                    </div>
                    <p className="text-sm text-primary font-medium mt-1">{formatCurrency(performer.value)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No hay datos de vendedores disponibles
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
