import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useBudgetComparison } from '@/hooks/useEnterpriseData';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  PieChart as PieChartIcon
} from 'lucide-react';
import { formatCurrency } from '@/lib/currencyUtils';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 76%, 36%)',
  'hsl(221, 83%, 53%)',
  'hsl(262, 83%, 58%)',
  'hsl(25, 95%, 53%)',
];

interface BudgetTrackingProps {
  showDemoData?: boolean;
}

export function BudgetTracking({ showDemoData = false }: BudgetTrackingProps) {
  const { organizationId } = useCurrentOrganization();
  const { data: realData, loading, error } = useBudgetComparison(organizationId);

  // Demo data
  const demoData = [
    { category: 'Marketing', budgeted_amount: 15000, actual_amount: 12500, variance_amount: 2500, variance_percentage: 16.7, status: 'under_budget' as const },
    { category: 'Operaciones', budgeted_amount: 25000, actual_amount: 27000, variance_amount: -2000, variance_percentage: -8, status: 'over_budget' as const },
    { category: 'Tecnología', budgeted_amount: 10000, actual_amount: 9800, variance_amount: 200, variance_percentage: 2, status: 'on_budget' as const },
    { category: 'Personal', budgeted_amount: 45000, actual_amount: 44500, variance_amount: 500, variance_percentage: 1.1, status: 'on_budget' as const },
    { category: 'Ventas', budgeted_amount: 8000, actual_amount: 11000, variance_amount: -3000, variance_percentage: -37.5, status: 'over_budget' as const },
  ];

  const budgetData = showDemoData ? demoData : (realData || []);

  if (loading && !showDemoData) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (error && !showDemoData) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <p className="text-destructive text-center">
            Error cargando datos de presupuesto
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calcular totales
  const totalBudgeted = budgetData.reduce((sum, item) => sum + (item.budgeted_amount || 0), 0);
  const totalActual = budgetData.reduce((sum, item) => sum + (item.actual_amount || 0), 0);
  const totalVariance = totalBudgeted - totalActual;
  const variancePercentage = totalBudgeted > 0 ? (totalVariance / totalBudgeted) * 100 : 0;

  // Stats
  const onBudgetCount = budgetData.filter(i => i.status === 'on_budget').length;
  const overBudgetCount = budgetData.filter(i => i.status === 'over_budget').length;
  const underBudgetCount = budgetData.filter(i => i.status === 'under_budget').length;

  // Datos para gráfico de pie
  const pieData = budgetData.map(item => ({
    name: item.category,
    value: item.actual_amount || 0,
  }));

  // Datos para gráfico de barras
  const barData = budgetData.map(item => ({
    category: item.category?.slice(0, 10) || 'Otro',
    presupuesto: item.budgeted_amount || 0,
    real: item.actual_amount || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Control de Presupuesto</h2>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Badge variant={variancePercentage >= 0 ? 'default' : 'destructive'} className="text-sm">
          {variancePercentage >= 0 ? 'Bajo Presupuesto' : 'Sobre Presupuesto'}
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Presupuestado</span>
              <PieChartIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalBudgeted)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Gasto Real</span>
              {totalActual <= totalBudgeted ? (
                <TrendingDown className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingUp className="h-4 w-4 text-rose-500" />
              )}
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalActual)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Variación</span>
              {totalVariance >= 0 ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-500" />
              )}
            </div>
            <p className={`text-2xl font-bold ${
              totalVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {totalVariance >= 0 ? '+' : ''}{formatCurrency(totalVariance)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.abs(variancePercentage).toFixed(1)}% {variancePercentage >= 0 ? 'bajo' : 'sobre'} presupuesto
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Categorías</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                ✅ {onBudgetCount} OK
              </Badge>
              {overBudgetCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  ⚠️ {overBudgetCount} Sobre
                </Badge>
              )}
              {underBudgetCount > 0 && (
                <Badge className="text-xs bg-emerald-500">
                  📉 {underBudgetCount} Bajo
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución de Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Presupuesto vs Real</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="category" className="text-xs" />
                  <YAxis 
                    tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                    className="text-xs"
                  />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="presupuesto" fill="hsl(var(--muted-foreground))" name="Presupuesto" />
                  <Bar dataKey="real" fill="hsl(var(--primary))" name="Real" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalle por Categoría</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {budgetData.map((item, index) => (
            <CategoryRow key={index} item={item} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function CategoryRow({ item }: { item: { category: string; budgeted_amount: number; actual_amount: number; status: string } }) {
  const budgeted = item.budgeted_amount || 0;
  const actual = item.actual_amount || 0;
  const percentage = budgeted > 0 ? (actual / budgeted) * 100 : 0;
  const variance = budgeted - actual;
  const isOverBudget = actual > budgeted;

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-medium">{item.category}</span>
          <Badge 
            variant={item.status === 'on_budget' ? 'secondary' : 
                    item.status === 'over_budget' ? 'destructive' : 'default'}
          >
            {item.status === 'on_budget' ? 'En presupuesto' :
             item.status === 'over_budget' ? 'Sobre presupuesto' : 'Bajo presupuesto'}
          </Badge>
        </div>
        <div className="text-right">
          <span className={`font-semibold ${isOverBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
            {isOverBudget ? '-' : '+'}{formatCurrency(Math.abs(variance))}
          </span>
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Gastado: {formatCurrency(actual)}</span>
          <span>Presupuesto: {formatCurrency(budgeted)}</span>
        </div>
        <Progress 
          value={Math.min(percentage, 100)} 
          className={`h-2 ${isOverBudget ? '[&>div]:bg-rose-500' : ''}`}
        />
        <p className="text-xs text-muted-foreground text-right">
          {percentage.toFixed(1)}% utilizado
        </p>
      </div>
    </div>
  );
}
