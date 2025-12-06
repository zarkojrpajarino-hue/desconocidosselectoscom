import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ExecutiveSummaryProps {
  organizationId: string;
  dateRange: string;
}

interface SummaryMetrics {
  totalRevenue: number;
  revenueChange: number;
  totalCustomers: number;
  customersChange: number;
  totalDeals: number;
  dealsChange: number;
  conversionRate: number;
  conversionChange: number;
  avgDealSize: number;
  dealSizeChange: number;
  totalExpenses: number;
  expensesChange: number;
}

export const ExecutiveSummary = ({ organizationId, dateRange }: ExecutiveSummaryProps) => {
  const [metrics, setMetrics] = useState<SummaryMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : dateRange === '365d' ? 365 : 1000;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - days);

        // Fetch current period revenue
        const { data: revenueData } = await supabase
          .from('revenue_entries')
          .select('amount')
          .eq('organization_id', organizationId)
          .gte('date', startDate.toISOString().split('T')[0]);

        const totalRevenue = revenueData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

        // Fetch previous period revenue for comparison
        const { data: prevRevenueData } = await supabase
          .from('revenue_entries')
          .select('amount')
          .eq('organization_id', organizationId)
          .gte('date', prevStartDate.toISOString().split('T')[0])
          .lt('date', startDate.toISOString().split('T')[0]);

        const prevRevenue = prevRevenueData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
        const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

        // Fetch expenses
        const { data: expenseData } = await supabase
          .from('expense_entries')
          .select('amount')
          .eq('organization_id', organizationId)
          .gte('date', startDate.toISOString().split('T')[0]);

        const totalExpenses = expenseData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

        const { data: prevExpenseData } = await supabase
          .from('expense_entries')
          .select('amount')
          .eq('organization_id', organizationId)
          .gte('date', prevStartDate.toISOString().split('T')[0])
          .lt('date', startDate.toISOString().split('T')[0]);

        const prevExpenses = prevExpenseData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
        const expensesChange = prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0;

        // Fetch leads/deals
        const { data: leadsData } = await supabase
          .from('leads')
          .select('id, stage, estimated_value')
          .eq('organization_id', organizationId)
          .gte('created_at', startDate.toISOString());

        const totalDeals = leadsData?.length || 0;
        const wonDeals = leadsData?.filter(l => l.stage === 'won') || [];
        const conversionRate = totalDeals > 0 ? (wonDeals.length / totalDeals) * 100 : 0;
        const avgDealSize = wonDeals.length > 0 
          ? wonDeals.reduce((sum, d) => sum + Number(d.estimated_value || 0), 0) / wonDeals.length 
          : 0;

        // Fetch previous period leads
        const { data: prevLeadsData } = await supabase
          .from('leads')
          .select('id, stage, estimated_value')
          .eq('organization_id', organizationId)
          .gte('created_at', prevStartDate.toISOString())
          .lt('created_at', startDate.toISOString());

        const prevTotalDeals = prevLeadsData?.length || 0;
        const dealsChange = prevTotalDeals > 0 ? ((totalDeals - prevTotalDeals) / prevTotalDeals) * 100 : 0;

        const prevWonDeals = prevLeadsData?.filter(l => l.stage === 'won') || [];
        const prevConversionRate = prevTotalDeals > 0 ? (prevWonDeals.length / prevTotalDeals) * 100 : 0;
        const conversionChange = prevConversionRate > 0 ? conversionRate - prevConversionRate : 0;

        const prevAvgDealSize = prevWonDeals.length > 0 
          ? prevWonDeals.reduce((sum, d) => sum + Number(d.estimated_value || 0), 0) / prevWonDeals.length 
          : 0;
        const dealSizeChange = prevAvgDealSize > 0 ? ((avgDealSize - prevAvgDealSize) / prevAvgDealSize) * 100 : 0;

        // Unique customers (from won deals)
        const totalCustomers = wonDeals.length;
        const prevCustomers = prevWonDeals.length;
        const customersChange = prevCustomers > 0 ? ((totalCustomers - prevCustomers) / prevCustomers) * 100 : 0;

        setMetrics({
          totalRevenue,
          revenueChange,
          totalCustomers,
          customersChange,
          totalDeals,
          dealsChange,
          conversionRate,
          conversionChange,
          avgDealSize,
          dealSizeChange,
          totalExpenses,
          expensesChange,
        });
      } catch (error) {
        console.error('Error fetching executive summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [organizationId, dateRange]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const cards = [
    {
      title: 'Ingresos',
      value: formatCurrency(metrics.totalRevenue),
      change: metrics.revenueChange,
      icon: DollarSign,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Gastos',
      value: formatCurrency(metrics.totalExpenses),
      change: metrics.expensesChange,
      icon: TrendingDown,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      invertChange: true,
    },
    {
      title: 'Clientes',
      value: metrics.totalCustomers.toString(),
      change: metrics.customersChange,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Deals',
      value: metrics.totalDeals.toString(),
      change: metrics.dealsChange,
      icon: ShoppingCart,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Conversión',
      value: `${metrics.conversionRate.toFixed(1)}%`,
      change: metrics.conversionChange,
      icon: Target,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      isPercent: true,
    },
    {
      title: 'Ticket Promedio',
      value: formatCurrency(metrics.avgDealSize),
      change: metrics.dealSizeChange,
      icon: TrendingUp,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isPositive = card.invertChange ? card.change < 0 : card.change > 0;
        const ChangeIcon = isPositive ? ArrowUpRight : ArrowDownRight;
        
        return (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${card.bgColor}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className={`flex items-center text-xs mt-1 ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                <ChangeIcon className="w-3 h-3 mr-1" />
                {card.isPercent ? `${card.change >= 0 ? '+' : ''}${card.change.toFixed(1)}pp` : formatPercent(card.change)}
                <span className="text-muted-foreground ml-1">vs anterior</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
