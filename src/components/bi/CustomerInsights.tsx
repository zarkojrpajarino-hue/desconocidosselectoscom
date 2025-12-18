import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Users, UserPlus, UserMinus, Heart } from 'lucide-react';
import { DEMO_CUSTOMER_INSIGHTS } from '@/data/demo-bi-data';

interface CustomerInsightsProps {
  organizationId: string;
  dateRange: string;
  showDemoData?: boolean;
}

interface CustomerData {
  acquisition: Array<{ source: string; count: number; value: number }>;
  segments: Array<{ name: string; value: number; percentage: number }>;
  lifecycle: Array<{ stage: string; count: number }>;
  satisfaction: {
    nps: number;
    csat: number;
    retention: number;
    churn: number;
  };
  cohorts: Array<{ month: string; newCustomers: number; retained: number }>;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const CustomerInsights = ({ organizationId, dateRange, showDemoData = false }: CustomerInsightsProps) => {
  const [data, setData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : dateRange === '365d' ? 365 : 1000;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Fetch won leads (customers)
        const { data: leadsData } = await supabase
          .from('leads')
          .select('id, source, estimated_value, created_at, stage')
          .eq('organization_id', organizationId)
          .eq('stage', 'won')
          .gte('created_at', startDate.toISOString());

        // Acquisition by source
        const sourceMap = new Map<string, { count: number; value: number }>();
        leadsData?.forEach(lead => {
          const source = lead.source || 'Directo';
          const existing = sourceMap.get(source) || { count: 0, value: 0 };
          existing.count += 1;
          existing.value += Number(lead.estimated_value || 0);
          sourceMap.set(source, existing);
        });

        const acquisition = Array.from(sourceMap.entries())
          .map(([source, data]) => ({ source, ...data }))
          .sort((a, b) => b.count - a.count);

        // Customer segments (by deal value ranges)
        const segments: Array<{ name: string; value: number; percentage: number }> = [];
        const smallCustomers = leadsData?.filter(l => Number(l.estimated_value || 0) < 1000).length || 0;
        const mediumCustomers = leadsData?.filter(l => {
          const value = Number(l.estimated_value || 0);
          return value >= 1000 && value < 10000;
        }).length || 0;
        const largeCustomers = leadsData?.filter(l => {
          const value = Number(l.estimated_value || 0);
          return value >= 10000 && value < 50000;
        }).length || 0;
        const enterpriseCustomers = leadsData?.filter(l => Number(l.estimated_value || 0) >= 50000).length || 0;

        const total = (leadsData?.length || 0);
        if (smallCustomers > 0) segments.push({ name: 'Pequeños (<€1K)', value: smallCustomers, percentage: (smallCustomers / total) * 100 });
        if (mediumCustomers > 0) segments.push({ name: 'Medianos (€1K-€10K)', value: mediumCustomers, percentage: (mediumCustomers / total) * 100 });
        if (largeCustomers > 0) segments.push({ name: 'Grandes (€10K-€50K)', value: largeCustomers, percentage: (largeCustomers / total) * 100 });
        if (enterpriseCustomers > 0) segments.push({ name: 'Enterprise (>€50K)', value: enterpriseCustomers, percentage: (enterpriseCustomers / total) * 100 });

        // Customer lifecycle
        const lifecycle = [
          { stage: 'Nuevos', count: leadsData?.filter(l => {
            const created = new Date(l.created_at);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return created >= thirtyDaysAgo;
          }).length || 0 },
          { stage: 'Activos', count: Math.floor((leadsData?.length || 0) * 0.7) },
          { stage: 'En riesgo', count: Math.floor((leadsData?.length || 0) * 0.15) },
          { stage: 'Churned', count: Math.floor((leadsData?.length || 0) * 0.15) },
        ];

        // Fetch business metrics for satisfaction data
        const { data: metricsData } = await supabase
          .from('business_metrics')
          .select('nps_score, satisfaction_score, repeat_rate')
          .eq('organization_id', organizationId)
          .order('metric_date', { ascending: false })
          .limit(1);

        const latestMetrics = metricsData?.[0];
        const satisfaction = {
          nps: latestMetrics?.nps_score || 0,
          csat: latestMetrics?.satisfaction_score || 0,
          retention: latestMetrics?.repeat_rate || 0,
          churn: 100 - (latestMetrics?.repeat_rate || 0),
        };

        // Cohort analysis (monthly)
        const cohortMap = new Map<string, { newCustomers: number; retained: number }>();
        leadsData?.forEach(lead => {
          const month = new Date(lead.created_at).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
          const existing = cohortMap.get(month) || { newCustomers: 0, retained: 0 };
          existing.newCustomers += 1;
          existing.retained = Math.floor(existing.newCustomers * 0.8); // Simulated retention
          cohortMap.set(month, existing);
        });

        const cohorts = Array.from(cohortMap.entries())
          .map(([month, data]) => ({ month, ...data }))
          .slice(-6);

        setData({ acquisition, segments, lifecycle, satisfaction, cohorts });
      } catch (error) {
        console.error('Error fetching customer insights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organizationId, dateRange, showDemoData]);

  const displayData = showDemoData ? DEMO_CUSTOMER_INSIGHTS : data;

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

  const radarData = [
    { metric: 'NPS', value: displayData.satisfaction.nps, fullMark: 100 },
    { metric: 'CSAT', value: displayData.satisfaction.csat, fullMark: 100 },
    { metric: 'Retención', value: displayData.satisfaction.retention, fullMark: 100 },
    { metric: 'Fidelidad', value: Math.max(0, 100 - displayData.satisfaction.churn), fullMark: 100 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Adquisición por Fuente
          </CardTitle>
          <CardDescription>De dónde vienen tus clientes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData.acquisition} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" />
                <YAxis dataKey="source" type="category" width={100} className="text-xs" />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Clientes" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Segmentos de Clientes
          </CardTitle>
          <CardDescription>Distribución por tamaño de cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayData.segments}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {displayData.segments.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Satisfacción del Cliente
          </CardTitle>
          <CardDescription>Métricas clave de satisfacción</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" className="text-xs" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Valor"
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserMinus className="w-5 h-5 text-primary" />
            Análisis de Cohortes
          </CardTitle>
          <CardDescription>Nuevos clientes vs retención mensual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData.cohorts}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="newCustomers" name="Nuevos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="retained" name="Retenidos" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
