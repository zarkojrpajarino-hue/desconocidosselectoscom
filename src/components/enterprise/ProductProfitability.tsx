import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { 
  Package, TrendingUp, TrendingDown, DollarSign,
  BarChart3, AlertTriangle, Eye 
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ProductData {
  product_name: string;
  revenue: number;
  cost: number;
  margin: number;
  margin_percentage: number;
  units_sold: number;
  status: 'profitable' | 'break_even' | 'loss';
}

// Demo data for empty states
const DEMO_PRODUCTS: ProductData[] = [
  { product_name: 'Servicio Premium', revenue: 45000, cost: 22500, margin: 22500, margin_percentage: 50, units_sold: 45, status: 'profitable' },
  { product_name: 'Consultoría Básica', revenue: 28000, cost: 16800, margin: 11200, margin_percentage: 40, units_sold: 56, status: 'profitable' },
  { product_name: 'Soporte Técnico', revenue: 15000, cost: 10500, margin: 4500, margin_percentage: 30, units_sold: 120, status: 'profitable' },
  { product_name: 'Implementación', revenue: 12000, cost: 9600, margin: 2400, margin_percentage: 20, units_sold: 8, status: 'break_even' },
  { product_name: 'Formación', revenue: 8000, cost: 7200, margin: 800, margin_percentage: 10, units_sold: 16, status: 'break_even' },
];

interface ProductProfitabilityProps {
  showDemoData?: boolean;
}

export function ProductProfitability({ showDemoData: externalShowDemo }: ProductProfitabilityProps) {
  const { organizationId } = useCurrentOrganization();
  const [data, setData] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showDemoData, setShowDemoData] = useState(externalShowDemo ?? true);

  useEffect(() => {
    async function fetchProductData() {
      if (!organizationId) return;
      try {
        setLoading(true);

        // Obtener ingresos por producto
        const { data: revenues, error: revError } = await supabase
          .from('revenue_entries')
          .select('product_name, product_category, amount')
          .eq('organization_id', organizationId)
          .not('product_name', 'is', null);

        if (revError) throw revError;

        // Agrupar por producto
        const productMap = new Map<string, ProductData>();

        (revenues || []).forEach((rev: { product_name?: string; product_category?: string; amount?: number }) => {
          const name = rev.product_name || rev.product_category || 'Sin categoría';
          const current = productMap.get(name) || {
            product_name: name,
            revenue: 0,
            cost: 0,
            margin: 0,
            margin_percentage: 0,
            units_sold: 0,
            status: 'profitable' as const,
          };

          current.revenue += rev.amount || 0;
          current.units_sold += 1;
          
          // Estimar costo (en producción vendría de otra tabla)
          current.cost = current.revenue * 0.6; // 60% costo estimado
          current.margin = current.revenue - current.cost;
          current.margin_percentage = current.revenue > 0 
            ? (current.margin / current.revenue) * 100 
            : 0;
          
          if (current.margin_percentage > 20) current.status = 'profitable';
          else if (current.margin_percentage >= 0) current.status = 'break_even';
          else current.status = 'loss';

          productMap.set(name, current);
        });

        const products = Array.from(productMap.values())
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);

        setData(products);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetchProductData();
  }, [organizationId]);

  const hasRealData = data.length > 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <p className="text-destructive text-center">Error cargando rentabilidad</p>
        </CardContent>
      </Card>
    );
  }

  const products = hasRealData ? data : (showDemoData ? DEMO_PRODUCTS : []);
  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
  const totalMargin = products.reduce((sum, p) => sum + p.margin, 0);
  const avgMargin = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;
  const profitableCount = products.filter(p => p.status === 'profitable').length;

  const statusColors = {
    profitable: 'hsl(var(--chart-2))',
    break_even: 'hsl(var(--chart-4))',
    loss: 'hsl(var(--destructive))',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Rentabilidad por Producto/Servicio</h2>
          <p className="text-muted-foreground">Análisis de margen por línea de producto o servicio</p>
        </div>
        <div className="flex items-center gap-4">
          {!hasRealData && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="product-demo-toggle" className="text-xs text-muted-foreground">
                Demo
              </Label>
              <Switch
                id="product-demo-toggle"
                checked={showDemoData}
                onCheckedChange={setShowDemoData}
              />
            </div>
          )}
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                €{totalRevenue.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-muted-foreground">Ingresos Totales</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${avgMargin >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {avgMargin.toFixed(1)}%
              </p>
              <p className="text-muted-foreground">Margen Promedio</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Margen por Producto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={products} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tickFormatter={(v) => `${v}%`} className="text-xs" />
                <YAxis dataKey="product_name" type="category" width={120} className="text-xs" />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Margen']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="margin_percentage" radius={[0, 4, 4, 0]}>
                  {products.map((entry, index) => (
                    <Cell key={index} fill={statusColors[entry.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay datos de productos</p>
            <p className="text-sm text-muted-foreground mt-1">
              Registra ingresos con nombre de producto para ver el análisis
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((product, index) => {
            const isProfit = product.status === 'profitable';
            const isLoss = product.status === 'loss';

            return (
              <Card 
                key={index} 
                className={`${
                  isProfit ? 'border-emerald-500/30 bg-emerald-500/5' :
                  isLoss ? 'border-rose-500/30 bg-rose-500/5' :
                  ''
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {product.product_name}
                    </CardTitle>
                    <Badge 
                      variant="outline" 
                      className={
                        isProfit ? 'text-emerald-600 border-emerald-500' :
                        isLoss ? 'text-rose-600 border-rose-500' :
                        'text-amber-600 border-amber-500'
                      }
                    >
                      {isProfit ? 'Rentable' : isLoss ? 'Pérdida' : 'Break-even'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Revenue & Margin */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Ingresos</p>
                      <p className="text-xl font-bold">
                        €{product.revenue.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Margen</p>
                      <p className={`text-xl font-bold ${
                        isProfit ? 'text-emerald-600' : isLoss ? 'text-rose-600' : 'text-amber-600'
                      }`}>
                        €{product.margin.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>

                  {/* Margin Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>% Margen</span>
                      <span>{product.margin_percentage.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={Math.max(0, product.margin_percentage)} 
                      className="h-2"
                    />
                  </div>

                  {/* Additional Info */}
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Unidades: {product.units_sold}</span>
                    <span>Costo est.: €{product.cost.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</span>
                  </div>

                  {/* Warning for low margin */}
                  {product.margin_percentage < 15 && product.margin_percentage >= 0 && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-500/10 p-2 rounded">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Margen bajo - revisar costos</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
