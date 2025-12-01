import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TrendingUp, DollarSign, Users, Package, Save, RefreshCw } from 'lucide-react';

interface BusinessMetrics {
  revenue?: number;
  orders_count?: number;
  avg_ticket?: number;
  leads_generated?: number;
  conversion_rate?: number;
  cac?: number;
  production_time?: number;
  capacity_used?: number;
  error_rate?: number;
  operational_costs?: number;
  nps_score?: number;
  repeat_rate?: number;
  lifetime_value?: number;
  satisfaction_score?: number;
  reviews_count?: number;
  reviews_avg?: number;
  notes?: string;
}

const BusinessMetricsDashboard = () => {
  const { user, currentOrganizationId } = useAuth();
  const [metrics, setMetrics] = useState<BusinessMetrics>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    loadTodayMetrics();
  }, [user]);

  const loadTodayMetrics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('business_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('metric_date', today)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setMetrics(data);
        setLastUpdate(new Date(data.updated_at).toLocaleString());
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast.error('Error al cargar métricas de negocio');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // MULTI-TENANCY: Include organization_id
      const { error } = await supabase
        .from('business_metrics')
        .upsert({
          user_id: user.id,
          metric_date: today,
          organization_id: currentOrganizationId,
          ...metrics,
        }, {
          onConflict: 'user_id,metric_date'
        });

      if (error) throw error;

      toast.success('Métricas guardadas correctamente');
      setLastUpdate(new Date().toLocaleString());
    } catch (error) {
      console.error('Error saving metrics:', error);
      toast.error('Error al guardar métricas');
    } finally {
      setSaving(false);
    }
  };

  const updateMetric = (key: keyof BusinessMetrics, value: any) => {
    setMetrics({ ...metrics, [key]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Métricas del Negocio</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Actualiza las métricas clave de tu negocio para análisis más precisos
          </p>
          {lastUpdate && (
            <p className="text-xs text-muted-foreground mt-1">
              Última actualización: {lastUpdate}
            </p>
          )}
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar
        </Button>
      </div>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">
            <DollarSign className="w-4 h-4 mr-2" />
            Ventas
          </TabsTrigger>
          <TabsTrigger value="marketing">
            <TrendingUp className="w-4 h-4 mr-2" />
            Marketing
          </TabsTrigger>
          <TabsTrigger value="operations">
            <Package className="w-4 h-4 mr-2" />
            Operaciones
          </TabsTrigger>
          <TabsTrigger value="customer">
            <Users className="w-4 h-4 mr-2" />
            Cliente
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ventas e Ingresos</CardTitle>
              <CardDescription>Métricas de facturación y volumen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="revenue">Ingresos (€)</Label>
                  <Input
                    id="revenue"
                    type="number"
                    step="0.01"
                    value={metrics.revenue || ''}
                    onChange={(e) => updateMetric('revenue', parseFloat(e.target.value) || 0)}
                    placeholder="Ej: 12450.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orders">Número de pedidos</Label>
                  <Input
                    id="orders"
                    type="number"
                    value={metrics.orders_count || ''}
                    onChange={(e) => updateMetric('orders_count', parseInt(e.target.value) || 0)}
                    placeholder="Ej: 45"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticket">Ticket medio (€)</Label>
                  <Input
                    id="ticket"
                    type="number"
                    step="0.01"
                    value={metrics.avg_ticket || ''}
                    onChange={(e) => updateMetric('avg_ticket', parseFloat(e.target.value) || 0)}
                    placeholder="Ej: 276.67"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Marketing y Leads</CardTitle>
              <CardDescription>Métricas de generación y conversión</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leads">Leads generados</Label>
                  <Input
                    id="leads"
                    type="number"
                    value={metrics.leads_generated || ''}
                    onChange={(e) => updateMetric('leads_generated', parseInt(e.target.value) || 0)}
                    placeholder="Ej: 120"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conversion">Tasa de conversión (%)</Label>
                  <Input
                    id="conversion"
                    type="number"
                    step="0.01"
                    value={metrics.conversion_rate || ''}
                    onChange={(e) => updateMetric('conversion_rate', parseFloat(e.target.value) || 0)}
                    placeholder="Ej: 23.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cac">CAC - Coste por cliente (€)</Label>
                  <Input
                    id="cac"
                    type="number"
                    step="0.01"
                    value={metrics.cac || ''}
                    onChange={(e) => updateMetric('cac', parseFloat(e.target.value) || 0)}
                    placeholder="Ej: 15.50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Operaciones</CardTitle>
              <CardDescription>Métricas de producción y eficiencia</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="production">Tiempo de producción (horas)</Label>
                  <Input
                    id="production"
                    type="number"
                    step="0.1"
                    value={metrics.production_time || ''}
                    onChange={(e) => updateMetric('production_time', parseFloat(e.target.value) || 0)}
                    placeholder="Ej: 120.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacidad utilizada (%)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    step="0.1"
                    value={metrics.capacity_used || ''}
                    onChange={(e) => updateMetric('capacity_used', parseFloat(e.target.value) || 0)}
                    placeholder="Ej: 87.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="errors">Tasa de errores/devoluciones (%)</Label>
                  <Input
                    id="errors"
                    type="number"
                    step="0.1"
                    value={metrics.error_rate || ''}
                    onChange={(e) => updateMetric('error_rate', parseFloat(e.target.value) || 0)}
                    placeholder="Ej: 2.3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costs">Costes operacionales (€)</Label>
                  <Input
                    id="costs"
                    type="number"
                    step="0.01"
                    value={metrics.operational_costs || ''}
                    onChange={(e) => updateMetric('operational_costs', parseFloat(e.target.value) || 0)}
                    placeholder="Ej: 3500.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
              <CardDescription>Métricas de satisfacción y retención</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nps">NPS Score (-100 a 100)</Label>
                  <Input
                    id="nps"
                    type="number"
                    value={metrics.nps_score || ''}
                    onChange={(e) => updateMetric('nps_score', parseInt(e.target.value) || 0)}
                    placeholder="Ej: 45"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repeat">Tasa de repetición (%)</Label>
                  <Input
                    id="repeat"
                    type="number"
                    step="0.1"
                    value={metrics.repeat_rate || ''}
                    onChange={(e) => updateMetric('repeat_rate', parseFloat(e.target.value) || 0)}
                    placeholder="Ej: 34.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ltv">Lifetime Value (€)</Label>
                  <Input
                    id="ltv"
                    type="number"
                    step="0.01"
                    value={metrics.lifetime_value || ''}
                    onChange={(e) => updateMetric('lifetime_value', parseFloat(e.target.value) || 0)}
                    placeholder="Ej: 850.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="satisfaction">Satisfacción (1-5)</Label>
                  <Input
                    id="satisfaction"
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={metrics.satisfaction_score || ''}
                    onChange={(e) => updateMetric('satisfaction_score', parseFloat(e.target.value) || 0)}
                    placeholder="Ej: 4.7"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reviews_count">Número de reviews</Label>
                  <Input
                    id="reviews_count"
                    type="number"
                    value={metrics.reviews_count || ''}
                    onChange={(e) => updateMetric('reviews_count', parseInt(e.target.value) || 0)}
                    placeholder="Ej: 28"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reviews_avg">Rating promedio (1-5)</Label>
                  <Input
                    id="reviews_avg"
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={metrics.reviews_avg || ''}
                    onChange={(e) => updateMetric('reviews_avg', parseFloat(e.target.value) || 0)}
                    placeholder="Ej: 4.8"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Notas adicionales</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={metrics.notes || ''}
            onChange={(e) => updateMetric('notes', e.target.value)}
            placeholder="Añade contexto sobre estas métricas: cambios estratégicos, eventos especiales, decisiones tomadas..."
            rows={4}
            className="resize-none"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Métricas
        </Button>
      </div>
    </div>
  );
};

export default BusinessMetricsDashboard;
