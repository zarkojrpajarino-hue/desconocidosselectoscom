import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCashFlowForecast } from '@/hooks/useEnterpriseData';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { 
  TrendingUp, TrendingDown, Calendar, ArrowUpRight, 
  ArrowDownRight, Wallet 
} from 'lucide-react';
import { formatCurrency } from '@/lib/currencyUtils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export function CashFlowForecast() {
  const { organizationId } = useCurrentOrganization();
  const [months, setMonths] = useState<6 | 12>(6);
  const { data, loading, error } = useCashFlowForecast(organizationId, months);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <p className="text-destructive text-center">
            Error cargando proyección de cash flow
          </p>
        </CardContent>
      </Card>
    );
  }

  const lastMonth = data[data.length - 1];
  const firstMonth = data[0];
  const netChange = lastMonth.closing_balance - firstMonth.opening_balance;
  const isPositive = netChange >= 0;

  // Preparar datos para gráficos
  const chartData = data.map(month => ({
    name: month.month,
    balance: month.closing_balance,
    inflows: month.projected_inflows,
    outflows: month.projected_outflows,
    netFlow: month.net_cash_flow,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Proyección de Cash Flow</h2>
          <p className="text-muted-foreground">Forecast a {months} meses</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={months === 6 ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setMonths(6)}
          >
            6 meses
          </Button>
          <Button 
            variant={months === 12 ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setMonths(12)}
          >
            12 meses
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Balance Inicial</span>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(firstMonth.opening_balance)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Balance Final</span>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(lastMonth.closing_balance)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Cambio Neto</span>
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-rose-500" />
              )}
            </div>
            <p className={`text-2xl font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isPositive ? '+' : ''}{formatCurrency(netChange)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Tendencia</span>
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-rose-500" />
              )}
            </div>
            <Badge variant={isPositive ? 'default' : 'destructive'}>
              {isPositive ? 'Creciente' : 'Decreciente'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Balance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evolución del Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis 
                  tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                  className="text-xs"
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelClassName="font-semibold"
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorBalance)"
                  name="Balance"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Inflows vs Outflows Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Entradas vs Salidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis 
                  tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                  className="text-xs"
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelClassName="font-semibold"
                />
                <Legend />
                <Bar dataKey="inflows" fill="hsl(142, 76%, 36%)" name="Entradas" />
                <Bar dataKey="outflows" fill="hsl(346, 87%, 43%)" name="Salidas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalle Mensual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Mes</th>
                  <th className="text-right py-3 px-2">Balance Inicial</th>
                  <th className="text-right py-3 px-2">Entradas</th>
                  <th className="text-right py-3 px-2">Salidas</th>
                  <th className="text-right py-3 px-2">Flujo Neto</th>
                  <th className="text-right py-3 px-2">Balance Final</th>
                </tr>
              </thead>
              <tbody>
                {data.map((month, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2 font-medium">{month.month}</td>
                    <td className="text-right py-3 px-2">{formatCurrency(month.opening_balance)}</td>
                    <td className="text-right py-3 px-2 text-emerald-600">
                      +{formatCurrency(month.projected_inflows)}
                    </td>
                    <td className="text-right py-3 px-2 text-rose-600">
                      -{formatCurrency(month.projected_outflows)}
                    </td>
                    <td className={`text-right py-3 px-2 font-medium ${
                      month.net_cash_flow >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {month.net_cash_flow >= 0 ? '+' : ''}{formatCurrency(month.net_cash_flow)}
                    </td>
                    <td className="text-right py-3 px-2 font-semibold">
                      {formatCurrency(month.closing_balance)}
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
}
