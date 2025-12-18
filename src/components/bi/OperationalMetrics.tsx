import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Activity, CheckCircle, Clock, AlertTriangle, Users } from 'lucide-react';
import { DEMO_OPERATIONAL_METRICS } from '@/data/demo-bi-data';

interface OperationalMetricsProps {
  organizationId: string;
  dateRange: string;
  showDemoData?: boolean;
}

interface OperationalData {
  taskCompletion: Array<{ date: string; completed: number; total: number; rate: number }>;
  teamProductivity: Array<{ name: string; completed: number; pending: number; efficiency: number }>;
  okrProgress: Array<{ objective: string; progress: number; status: string }>;
  alerts: {
    overdueTasks: number;
    stalledDeals: number;
    lowPerformers: number;
    pendingApprovals: number;
  };
}

export const OperationalMetrics = ({ organizationId, dateRange, showDemoData = false }: OperationalMetricsProps) => {
  const [data, setData] = useState<OperationalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : dateRange === '365d' ? 365 : 1000;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Fetch task completions with explicit typing to avoid deep inference
        const taskCompletionsResult = await supabase
          .from('task_completions')
          .select('id, completed_at, user_id')
          .eq('organization_id', organizationId)
          .gte('completed_at', startDate.toISOString());

        const tasksData = taskCompletionsResult.data as Array<{ id: string; completed_at: string; user_id: string }> | null;

        // Group task completions by date
        const dateMap = new Map<string, { completed: number; total: number }>();
        tasksData?.forEach(tc => {
          const date = new Date(tc.completed_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
          const existing = dateMap.get(date) || { completed: 0, total: 0 };
          existing.completed += 1;
          existing.total += 1;
          dateMap.set(date, existing);
        });

        const taskCompletion = Array.from(dateMap.entries())
          .map(([date, values]) => ({
            date,
            completed: values.completed,
            total: values.total,
            rate: values.total > 0 ? (values.completed / values.total) * 100 : 0,
          }));

        // Team productivity
        const teamMap = new Map<string, { name: string; completed: number; pending: number }>();
        tasksData?.forEach(tc => {
          const userName = tc.user_id || 'Sin asignar';
          const existing = teamMap.get(userName) || { name: userName, completed: 0, pending: 0 };
          existing.completed += 1;
          teamMap.set(userName, existing);
        });

        const teamProductivity = Array.from(teamMap.values())
          .map(t => ({
            ...t,
            efficiency: t.completed + t.pending > 0 ? (t.completed / (t.completed + t.pending)) * 100 : 100,
          }))
          .sort((a, b) => b.completed - a.completed)
          .slice(0, 6);

        // Fetch OKRs with explicit typing
        const objectivesResult = await supabase
          .from('objectives')
          .select('id, title, status')
          .eq('organization_id', organizationId)
          .eq('status', 'active');

        const okrsData = objectivesResult.data as Array<{ id: string; title: string; status: string }> | null;
        const objectiveIds = okrsData?.map(o => o.id) || [];

        // Fetch key results
        const keyResultsResult = await supabase
          .from('key_results')
          .select('objective_id, current_value, target_value')
          .in('objective_id', objectiveIds.length > 0 ? objectiveIds : ['none']);

        const keyResultsData = keyResultsResult.data as Array<{ objective_id: string; current_value: number | null; target_value: number | null }> | null;

        const okrProgress = okrsData?.map(obj => {
          const keyResults = keyResultsData?.filter(kr => kr.objective_id === obj.id) || [];
          const avgProgress = keyResults.length > 0
            ? keyResults.reduce((sum, kr) => {
                const progress = kr.target_value && kr.target_value > 0
                  ? (Number(kr.current_value || 0) / Number(kr.target_value)) * 100
                  : 0;
                return sum + Math.min(progress, 100);
              }, 0) / keyResults.length
            : 0;
          
          return {
            objective: obj.title || 'Sin título',
            progress: avgProgress,
            status: avgProgress >= 70 ? 'on_track' : avgProgress >= 40 ? 'at_risk' : 'behind',
          };
        }).slice(0, 5) || [];

        // Fetch alerts data with count only
        const { count: overdueCount } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .lt('end_date', new Date().toISOString().split('T')[0]);

        const stalledResult = await supabase
          .from('stalled_deals')
          .select('id')
          .eq('organization_id', organizationId);

        const stalledDeals = stalledResult.data?.length || 0;

        const alerts = {
          overdueTasks: overdueCount || 0,
          stalledDeals,
          lowPerformers: teamProductivity.filter(t => t.efficiency < 50).length,
          pendingApprovals: 0,
        };

        setData({ taskCompletion, teamProductivity, okrProgress, alerts });
      } catch (error) {
        console.error('Error fetching operational metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organizationId, dateRange, showDemoData]);

  const displayData = showDemoData ? DEMO_OPERATIONAL_METRICS : data;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'text-emerald-600';
      case 'at_risk': return 'text-amber-600';
      case 'behind': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            Tareas Completadas
          </CardTitle>
          <CardDescription>Tendencia de completación de tareas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData.taskCompletion}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="completed" name="Completadas" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorCompleted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Productividad del Equipo
          </CardTitle>
          <CardDescription>Rendimiento por miembro del equipo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData.teamProductivity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" name="Completadas" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Progreso de OKRs
          </CardTitle>
          <CardDescription>Estado de objetivos activos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayData.okrProgress.map((okr, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate max-w-[200px]">{okr.objective}</span>
                  <span className={`text-sm font-medium ${getStatusColor(okr.status)}`}>{okr.progress.toFixed(0)}%</span>
                </div>
                <Progress value={okr.progress} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Alertas Operativas
          </CardTitle>
          <CardDescription>Elementos que requieren atención</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-red-500" />
                <span className="text-sm text-muted-foreground">Tareas Vencidas</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{displayData.alerts.overdueTasks}</p>
            </div>
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-muted-foreground">Deals Estancados</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">{displayData.alerts.stalledDeals}</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">Bajo Rendimiento</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{displayData.alerts.lowPerformers}</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Pendientes</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{displayData.alerts.pendingApprovals}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
