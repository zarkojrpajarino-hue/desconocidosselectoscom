import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  RefreshCw,
  PieChart,
  BarChart3,
  Target,
  Clock,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface FinancialMetrics {
  month: string;
  total_revenue: number;
  total_expenses: number;
  gross_margin: number;
  margin_percentage: number;
  burn_rate: number;
  runway_months: number;
  customer_count: number;
  new_customers: number;
  avg_order_value: number;
}

interface RevenueByProduct {
  product_category: string;
  total_revenue: number;
  total_quantity: number;
  percentage_of_total: number;
}

interface ExpenseByCategory {
  category: string;
  total_amount: number;
  percentage_of_total: number;
  [key: string]: string | number;
}

interface MarketingROI {
  channel: string;
  total_spend: number;
  total_leads: number;
  total_conversions: number;
  total_revenue: number;
  roi_ratio: number;
  cac: number;
  conversion_rate: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--warning))', 'hsl(var(--success))', 'hsl(var(--destructive))', 'hsl(var(--secondary))'];

const FinancialDashboard = () => {
  const { userProfile, currentOrganizationId, userOrganizations } = useAuth();
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [revenueByProduct, setRevenueByProduct] = useState<RevenueByProduct[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseByCategory[]>([]);
  const [marketingROI, setMarketingROI] = useState<MarketingROI[]>([]);
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  // Obtener el rol actual del usuario en la organización seleccionada
  const currentUserRole = userOrganizations.find(
    org => org.organization_id === currentOrganizationId
  )?.role || 'member';
  const canViewFinancials = currentUserRole === 'admin' || currentUserRole === 'leader';

  useEffect(() => {
    if (currentOrganizationId) {
      fetchFinancialData();
    }
  }, [selectedMonth, currentOrganizationId]);

  const fetchFinancialData = async () => {
    if (!currentOrganizationId) return;
    
    setLoading(true);
    try {
      const monthStart = `${selectedMonth}-01`;

      // 1. Métricas mensuales
      const { data: metricsData, error: metricsError } = await supabase
        .from('financial_metrics')
        .select('*')
        .eq('month', monthStart)
        .eq('organization_id', currentOrganizationId)
        .maybeSingle();

      if (metricsError && metricsError.code !== 'PGRST116') throw metricsError;

      if (metricsData) {
        setMetrics(metricsData);
      } else {
        // Si no existen métricas, calcularlas
        const { error: rpcError } = await supabase.rpc('update_financial_metrics', { target_month: monthStart });
        if (rpcError) throw rpcError;
        
        const { data: newMetrics, error: newError } = await supabase
          .from('financial_metrics')
          .select('*')
          .eq('month', monthStart)
          .eq('organization_id', currentOrganizationId)
          .maybeSingle();
        
        if (newError) throw newError;
        setMetrics(newMetrics);
      }

      // 2. Ingresos por producto (vista agregada - no filtrar por org_id)
      const { data: revenueData, error: revenueError } = await supabase
        .from('revenue_by_product_current_month')
        .select('product_category, total_revenue, total_quantity, percentage_of_total');
      
      if (revenueError) throw revenueError;
      setRevenueByProduct((revenueData as RevenueByProduct[]) || []);

      // 3. Gastos por categoría (vista agregada - no filtrar por org_id)
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses_by_category_current_month')
        .select('category, total_amount, percentage_of_total');
      
      if (expensesError) throw expensesError;
      setExpensesByCategory((expensesData as ExpenseByCategory[]) || []);

      // 4. ROI de marketing (vista agregada - no filtrar por org_id)
      const { data: marketingData, error: marketingError } = await supabase
        .from('marketing_roi_by_channel')
        .select('channel, total_spend, total_leads, total_conversions, total_revenue, roi_ratio, cac, conversion_rate');
      
      if (marketingError) throw marketingError;
      setMarketingROI((marketingData as MarketingROI[]) || []);

      // 5. Balance de caja actual
      const { data: balanceData, error: balanceError } = await supabase
        .from('cash_balance')
        .select('balance')
        .eq('organization_id', currentOrganizationId)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (balanceError && balanceError.code !== 'PGRST116') throw balanceError;
      setCashBalance(balanceData?.balance || 0);

    } catch (error) {
      console.error('Error fetching financial data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar datos financieros';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      premium: 'Premium',
      personalizadas: 'Personalizadas',
      estandar: 'Estándar',
      basicas: 'Básicas',
      corporativas: 'Corporativas',
      produccion: 'Producción',
      marketing: 'Marketing',
      operaciones: 'Operaciones',
      salarios: 'Salarios',
      herramientas: 'Herramientas',
      otros: 'Otros'
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Cargando datos financieros...</p>
        </div>
      </div>
    );
  }

  // Verificar permisos
  if (!canViewFinancials) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="w-16 h-16 text-destructive mb-4" />
          <h3 className="text-xl font-semibold mb-2">Acceso Restringido</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Solo administradores y líderes pueden ver información financiera
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex items-center justify-end gap-3">
        {/* Selector de mes */}
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 border border-input rounded-lg bg-background text-foreground"
        />

        <Button
          variant="outline"
          size="sm"
          onClick={fetchFinancialData}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </Button>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos */}
        <Card data-metric="revenue">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" />
              Ingresos del Mes
            </CardDescription>
            <CardTitle className="text-3xl text-success" data-value="amount">
              {formatCurrency(metrics?.total_revenue || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {metrics?.customer_count || 0} clientes ({metrics?.new_customers || 0} nuevos)
            </div>
          </CardContent>
        </Card>

        {/* Gastos */}
        <Card data-metric="expenses">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              Gastos del Mes
            </CardDescription>
            <CardTitle className="text-3xl text-destructive" data-value="amount">
              {formatCurrency(metrics?.total_expenses || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Burn rate mensual
            </div>
          </CardContent>
        </Card>

        {/* Margen */}
        <Card data-metric="margin">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Margen Neto
            </CardDescription>
            <CardTitle className="text-3xl" data-value="amount">
              {formatCurrency(metrics?.gross_margin || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Progress value={metrics?.margin_percentage || 0} className="h-2" />
              <span className="text-sm font-medium">
                {formatPercentage(metrics?.margin_percentage || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Runway */}
        <Card data-metric="runway">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Runway
            </CardDescription>
            <CardTitle className="text-3xl">
              {Math.round(metrics?.runway_months || 0)} meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Caja: {formatCurrency(cashBalance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert de margen bajo */}
      {(metrics?.margin_percentage || 0) < 20 && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
              <div>
                <h4 className="font-semibold text-warning">Margen Bajo Detectado</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Tu margen neto es {formatPercentage(metrics?.margin_percentage || 0)}. 
                  Se recomienda un margen mínimo del 20% para crecimiento sostenible.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficas principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos por Producto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Ingresos por Producto
            </CardTitle>
            <CardDescription>
              Distribución de ingresos por categoría de producto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div id="revenue-by-product-chart">
              <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByProduct}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="product_category" 
                  tickFormatter={getCategoryLabel}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis tickFormatter={(value) => `€${value}`} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={getCategoryLabel}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                />
                <Bar dataKey="total_revenue" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>

            {/* Tabla de detalles */}
            <div className="mt-4 space-y-2">
              {revenueByProduct.map((product, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{getCategoryLabel(product.product_category)}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      {product.total_quantity} unidades
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(product.total_revenue)}
                    </span>
                    <Badge variant="secondary">
                      {formatPercentage(product.percentage_of_total)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </CardContent>
        </Card>

        {/* Gastos por Categoría */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Gastos por Categoría
            </CardTitle>
            <CardDescription>
              Distribución de gastos mensuales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div id="expenses-by-category-chart">
              <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={expensesByCategory}
                  dataKey="total_amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)} 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>

            {/* Tabla de detalles */}
            <div className="mt-4 space-y-2">
              {expensesByCategory.map((expense, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{getCategoryLabel(expense.category)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      {formatCurrency(expense.total_amount)}
                    </span>
                    <Badge variant="secondary">
                      {formatPercentage(expense.percentage_of_total)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROI de Marketing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            ROI de Marketing por Canal
          </CardTitle>
          <CardDescription>
            Rendimiento de inversión en marketing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto" id="marketing-roi-table">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Canal</th>
                  <th className="text-right py-3 px-4">Inversión</th>
                  <th className="text-right py-3 px-4">Leads</th>
                  <th className="text-right py-3 px-4">Conversiones</th>
                  <th className="text-right py-3 px-4">Conv. %</th>
                  <th className="text-right py-3 px-4">CAC</th>
                  <th className="text-right py-3 px-4">Ingresos</th>
                  <th className="text-right py-3 px-4">ROI</th>
                </tr>
              </thead>
              <tbody>
                {marketingROI.map((channel, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium capitalize">{channel.channel}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(channel.total_spend)}</td>
                    <td className="text-right py-3 px-4">{channel.total_leads}</td>
                    <td className="text-right py-3 px-4">{channel.total_conversions}</td>
                    <td className="text-right py-3 px-4">
                      <Badge variant={channel.conversion_rate > 30 ? 'default' : 'secondary'}>
                        {formatPercentage(channel.conversion_rate)}
                      </Badge>
                    </td>
                    <td className="text-right py-3 px-4">{formatCurrency(channel.cac)}</td>
                    <td className="text-right py-3 px-4 text-success font-semibold">
                      {formatCurrency(channel.total_revenue)}
                    </td>
                    <td className="text-right py-3 px-4">
                      <Badge 
                        variant={channel.roi_ratio > 5 ? 'default' : channel.roi_ratio > 2 ? 'secondary' : 'destructive'}
                      >
                        {channel.roi_ratio.toFixed(1)}x
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialDashboard;