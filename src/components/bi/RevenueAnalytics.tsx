import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { DEMO_REVENUE_ANALYTICS } from '@/data/demo-bi-data';

interface RevenueAnalyticsProps {
  organizationId: string;
  dateRange: string;
  showDemoData?: boolean;
}

interface RevenueData {
  daily: Array<{ date: string; revenue: number; expenses: number; profit: number }>;
  byProduct: Array<{ name: string; value: number; percentage: number }>;
  byChannel: Array<{ name: string; value: number }>;
  trends: {
    avgDaily: number;
    bestDay: string;
    worstDay: string;
    growthRate: number;
  };
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const RevenueAnalytics = ({ organizationId, dateRange, showDemoData = false }: RevenueAnalyticsProps) => {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : dateRange === '365d' ? 365 : 1000;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Fetch revenue entries
        const { data: revenueData } = await supabase
          .from('revenue_entries')
          .select('*')
          .eq('organization_id', organizationId)
          .gte('date', startDate.toISOString().split('T')[0])
          .order('date', { ascending: true });

        // Fetch expense entries
        const { data: expenseData } = await supabase
          .from('expense_entries')
          .select('*')
          .eq('organization_id', organizationId)
          .gte('date', startDate.toISOString().split('T')[0])
          .order('date', { ascending: true });

        // Group by date
        const dailyMap = new Map<string, { revenue: number; expenses: number }>();
        
        revenueData?.forEach(r => {
          const date = r.date;
          const existing = dailyMap.get(date) || { revenue: 0, expenses: 0 };
          existing.revenue += Number(r.amount);
          dailyMap.set(date, existing);
        });

        expenseData?.forEach(e => {
          const date = e.date;
          const existing = dailyMap.get(date) || { revenue: 0, expenses: 0 };
          existing.expenses += Number(e.amount);
          dailyMap.set(date, existing);
        });

        const daily = Array.from(dailyMap.entries())
          .map(([date, values]) => ({
            date: new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
            revenue: values.revenue,
            expenses: values.expenses,
            profit: values.revenue - values.expenses,
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Group by product
        const productMap = new Map<string, number>();
        revenueData?.forEach(r => {
          const product = r.product_name || 'Sin categoría';
          productMap.set(product, (productMap.get(product) || 0) + Number(r.amount));
        });

        const totalRevenue = Array.from(productMap.values()).reduce((sum, v) => sum + v, 0);
        const byProduct = Array.from(productMap.entries())
          .map(([name, value]) => ({
            name,
            value,
            percentage: totalRevenue > 0 ? (value / totalRevenue) * 100 : 0,
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6);

        // Group by channel (using category as proxy)
        const channelMap = new Map<string, number>();
        revenueData?.forEach(r => {
          const channel = r.product_category || 'Directo';
          channelMap.set(channel, (channelMap.get(channel) || 0) + Number(r.amount));
        });

        const byChannel = Array.from(channelMap.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

        // Calculate trends
        const avgDaily = daily.length > 0 ? daily.reduce((sum, d) => sum + d.revenue, 0) / daily.length : 0;
        const profitsByDay = daily.map(d => ({ day: d.date, profit: d.profit }));
        const bestDay = profitsByDay.reduce((best, curr) => curr.profit > best.profit ? curr : best, { day: 'N/A', profit: -Infinity });
        const worstDay = profitsByDay.reduce((worst, curr) => curr.profit < worst.profit ? curr : worst, { day: 'N/A', profit: Infinity });

        // Growth rate (comparing first half to second half)
        const midpoint = Math.floor(daily.length / 2);
        const firstHalf = daily.slice(0, midpoint).reduce((sum, d) => sum + d.revenue, 0);
        const secondHalf = daily.slice(midpoint).reduce((sum, d) => sum + d.revenue, 0);
        const growthRate = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;

        setData({
          daily,
          byProduct,
          byChannel,
          trends: {
            avgDaily,
            bestDay: bestDay.day,
            worstDay: worstDay.day,
            growthRate,
          },
        });
      } catch (error) {
        console.error('Error fetching revenue analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organizationId, dateRange, showDemoData]);

  // Use demo data if enabled
  const displayData = showDemoData ? DEMO_REVENUE_ANALYTICS : data;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };

  if (loading && !showDemoData) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className={i === 0 ? 'lg:col-span-2' : ''}>
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
      {/* Revenue vs Expenses Over Time */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Ingresos vs Gastos</CardTitle>
          <CardDescription>Evolución temporal de ingresos, gastos y beneficio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData.daily}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis tickFormatter={(v) => formatCurrency(v)} className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Ingresos"
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  name="Gastos"
                  stroke="#EF4444" 
                  fillOpacity={1} 
                  fill="url(#colorExpenses)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Product */}
      <Card>
        <CardHeader>
          <CardTitle>Ingresos por Producto</CardTitle>
          <CardDescription>Distribución de ingresos por categoría de producto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayData.byProduct}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {displayData.byProduct.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Channel */}
      <Card>
        <CardHeader>
          <CardTitle>Ingresos por Canal</CardTitle>
          <CardDescription>Distribución de ingresos por canal de venta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData.byChannel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Insights Clave</CardTitle>
          <CardDescription>Métricas y tendencias destacadas del período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-sm text-muted-foreground">Promedio Diario</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(displayData.trends.avgDaily)}</p>
            </div>
            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <p className="text-sm text-muted-foreground">Mejor Día</p>
              <p className="text-2xl font-bold text-emerald-600">{displayData.trends.bestDay}</p>
            </div>
            <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/10">
              <p className="text-sm text-muted-foreground">Peor Día</p>
              <p className="text-2xl font-bold text-red-600">{displayData.trends.worstDay}</p>
            </div>
            <div className="p-4 rounded-lg bg-accent/5 border border-accent/10">
              <p className="text-sm text-muted-foreground">Tasa de Crecimiento</p>
              <p className={`text-2xl font-bold ${displayData.trends.growthRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {displayData.trends.growthRate >= 0 ? '+' : ''}{displayData.trends.growthRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
