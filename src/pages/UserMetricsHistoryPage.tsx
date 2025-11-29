import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Calendar, DollarSign, TrendingUp, Package, Users, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MetricEntry {
  id: string;
  metric_date: string;
  updated_at: string;
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

const UserMetricsHistoryPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');
  const [metrics, setMetrics] = useState<MetricEntry[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MetricEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (userId) {
      loadUserData();
      loadUserMetrics();
    }
  }, [userId]);

  const loadUserData = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserName(data.full_name);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadUserMetrics = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('metric_date', { ascending: false });

      if (error) throw error;
      setMetrics(data || []);
    } catch (error) {
      console.error('Error loading user metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Ventas': return <DollarSign className="w-4 h-4" />;
      case 'Marketing': return <TrendingUp className="w-4 h-4" />;
      case 'Operaciones': return <Package className="w-4 h-4" />;
      case 'Cliente': return <Users className="w-4 h-4" />;
      default: return null;
    }
  };

  const getMetricCategories = (metric: MetricEntry) => {
    const categories = [];
    
    if (metric.revenue || metric.orders_count || metric.avg_ticket) {
      categories.push('Ventas');
    }
    if (metric.leads_generated || metric.conversion_rate || metric.cac) {
      categories.push('Marketing');
    }
    if (metric.production_time || metric.capacity_used || metric.error_rate || metric.operational_costs) {
      categories.push('Operaciones');
    }
    if (metric.nps_score || metric.repeat_rate || metric.lifetime_value || metric.satisfaction_score) {
      categories.push('Cliente');
    }
    
    return categories;
  };

  const renderMetricDetails = (metric: MetricEntry) => {
    return (
      <div className="space-y-6">
        {/* Ventas */}
        {(metric.revenue || metric.orders_count || metric.avg_ticket) && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              <h3 className="font-semibold">Ventas</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {metric.revenue && (
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Ingresos</p>
                  <p className="text-lg font-bold">{metric.revenue.toFixed(2)} €</p>
                </div>
              )}
              {metric.orders_count && (
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Pedidos</p>
                  <p className="text-lg font-bold">{metric.orders_count}</p>
                </div>
              )}
              {metric.avg_ticket && (
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Ticket medio</p>
                  <p className="text-lg font-bold">{metric.avg_ticket.toFixed(2)} €</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Marketing */}
        {(metric.leads_generated || metric.conversion_rate || metric.cac) && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold">Marketing</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {metric.leads_generated && (
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Leads generados</p>
                  <p className="text-lg font-bold">{metric.leads_generated}</p>
                </div>
              )}
              {metric.conversion_rate && (
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Conversión</p>
                  <p className="text-lg font-bold">{metric.conversion_rate.toFixed(1)}%</p>
                </div>
              )}
              {metric.cac && (
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">CAC</p>
                  <p className="text-lg font-bold">{metric.cac.toFixed(2)} €</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Operaciones */}
        {(metric.production_time || metric.capacity_used || metric.error_rate || metric.operational_costs) && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold">Operaciones</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {metric.production_time && (
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Tiempo producción</p>
                  <p className="text-lg font-bold">{metric.production_time.toFixed(1)} h</p>
                </div>
              )}
              {metric.capacity_used && (
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Capacidad</p>
                  <p className="text-lg font-bold">{metric.capacity_used.toFixed(1)}%</p>
                </div>
              )}
              {metric.error_rate && (
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Tasa errores</p>
                  <p className="text-lg font-bold">{metric.error_rate.toFixed(1)}%</p>
                </div>
              )}
              {metric.operational_costs && (
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Costes</p>
                  <p className="text-lg font-bold">{metric.operational_costs.toFixed(2)} €</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cliente */}
        {(metric.nps_score || metric.repeat_rate || metric.lifetime_value || metric.satisfaction_score || metric.reviews_count || metric.reviews_avg) && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold">Cliente</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {metric.nps_score !== null && metric.nps_score !== undefined && (
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">NPS Score</p>
                  <p className="text-lg font-bold">{metric.nps_score}</p>
                </div>
              )}
              {metric.repeat_rate && (
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Tasa repetición</p>
                  <p className="text-lg font-bold">{metric.repeat_rate.toFixed(1)}%</p>
                </div>
              )}
              {metric.lifetime_value && (
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">LTV</p>
                  <p className="text-lg font-bold">{metric.lifetime_value.toFixed(2)} €</p>
                </div>
              )}
              {metric.satisfaction_score && (
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Satisfacción</p>
                  <p className="text-lg font-bold">{metric.satisfaction_score.toFixed(1)}/5</p>
                </div>
              )}
              {metric.reviews_count && (
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Nº Reviews</p>
                  <p className="text-lg font-bold">{metric.reviews_count}</p>
                </div>
              )}
              {metric.reviews_avg && (
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Rating promedio</p>
                  <p className="text-lg font-bold">{metric.reviews_avg.toFixed(1)}/5</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notas */}
        {metric.notes && (
          <div>
            <h3 className="font-semibold mb-2">Notas</h3>
            <div className="bg-muted/30 p-3 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{metric.notes}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Historial de Métricas</h1>
              <p className="text-sm text-muted-foreground">{userName}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/business-metrics')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Ranking
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {selectedMetric ? (
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={() => setSelectedMetric(null)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al historial
            </Button>
            
            <Card>
              <CardHeader>
                <CardTitle>
                  Detalle de Métricas - {format(new Date(selectedMetric.metric_date), "d 'de' MMMM, yyyy", { locale: es })}
                </CardTitle>
                <CardDescription>
                  Actualizado el {format(new Date(selectedMetric.updated_at), "d/MM/yyyy 'a las' HH:mm", { locale: es })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderMetricDetails(selectedMetric)}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {metrics.length} actualizaciones de métricas
            </h2>
            
            {metrics.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Este usuario aún no ha registrado métricas
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.map((metric) => {
                  const categories = getMetricCategories(metric);
                  return (
                    <Card
                      key={metric.id}
                      className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                      onClick={() => setSelectedMetric(metric)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold">
                                {format(new Date(metric.metric_date), "d MMM yyyy", { locale: es })}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {categories.map((cat) => (
                                <Badge key={cat} variant="secondary" className="gap-1 text-xs">
                                  {getCategoryIcon(cat)}
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default UserMetricsHistoryPage;
