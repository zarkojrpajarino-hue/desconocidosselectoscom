import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/dateUtils';

interface BusinessMetrics {
  metric_date: string;
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
  updated_at: string;
}

const UserMetricsHistory = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [metrics, setMetrics] = useState<BusinessMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadUserData();
      loadMetrics();
    }
  }, [userId]);

  const loadUserData = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('full_name, role')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserName(data.full_name);
      setUserRole(data.role);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Error al cargar datos del usuario');
    }
  };

  const loadMetrics = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('metric_date', { ascending: false })
        .limit(30);

      if (error) throw error;
      setMetrics(data || []);
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast.error('Error al cargar métricas del usuario');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return `€${value.toFixed(2)}`;
  };

  const formatPercentage = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return value.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Cargando KPIs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">
                  KPI's de {userName}
                </h1>
                <p className="text-sm text-muted-foreground capitalize">
                  {userRole} • {metrics.length} registros encontrados
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/business-metrics?tab=ranking')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Ranking
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        {metrics.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Sin datos de KPIs</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {userName} aún no ha registrado métricas de negocio
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {metrics.map((metric) => (
              <Card key={metric.metric_date} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        {formatDate(metric.metric_date)}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Actualizado: {new Date(metric.updated_at).toLocaleString('es-ES')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Ventas */}
                    {(metric.revenue || metric.orders_count || metric.avg_ticket) && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase">💰 Ventas</h4>
                        <div className="space-y-1 text-sm">
                          {metric.revenue && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Ingresos:</span>
                              <span className="font-bold">{formatCurrency(metric.revenue)}</span>
                            </div>
                          )}
                          {metric.orders_count && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Pedidos:</span>
                              <span className="font-bold">{formatNumber(metric.orders_count)}</span>
                            </div>
                          )}
                          {metric.avg_ticket && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Ticket medio:</span>
                              <span className="font-bold">{formatCurrency(metric.avg_ticket)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Marketing */}
                    {(metric.leads_generated || metric.conversion_rate || metric.cac) && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase">📈 Marketing</h4>
                        <div className="space-y-1 text-sm">
                          {metric.leads_generated && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Leads:</span>
                              <span className="font-bold">{formatNumber(metric.leads_generated)}</span>
                            </div>
                          )}
                          {metric.conversion_rate && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Conversión:</span>
                              <span className="font-bold">{formatPercentage(metric.conversion_rate)}</span>
                            </div>
                          )}
                          {metric.cac && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">CAC:</span>
                              <span className="font-bold">{formatCurrency(metric.cac)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Operaciones */}
                    {(metric.production_time || metric.capacity_used || metric.error_rate || metric.operational_costs) && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase">⚙️ Operaciones</h4>
                        <div className="space-y-1 text-sm">
                          {metric.production_time && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Prod. (h):</span>
                              <span className="font-bold">{formatNumber(metric.production_time)}</span>
                            </div>
                          )}
                          {metric.capacity_used && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Capacidad:</span>
                              <span className="font-bold">{formatPercentage(metric.capacity_used)}</span>
                            </div>
                          )}
                          {metric.error_rate && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Errores:</span>
                              <span className="font-bold">{formatPercentage(metric.error_rate)}</span>
                            </div>
                          )}
                          {metric.operational_costs && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Costes:</span>
                              <span className="font-bold">{formatCurrency(metric.operational_costs)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Cliente */}
                    {(metric.nps_score || metric.repeat_rate || metric.lifetime_value || metric.satisfaction_score) && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase">👥 Cliente</h4>
                        <div className="space-y-1 text-sm">
                          {metric.nps_score && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">NPS:</span>
                              <span className="font-bold">{formatNumber(metric.nps_score)}</span>
                            </div>
                          )}
                          {metric.repeat_rate && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Repetición:</span>
                              <span className="font-bold">{formatPercentage(metric.repeat_rate)}</span>
                            </div>
                          )}
                          {metric.lifetime_value && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">LTV:</span>
                              <span className="font-bold">{formatCurrency(metric.lifetime_value)}</span>
                            </div>
                          )}
                          {metric.satisfaction_score && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Satisfacción:</span>
                              <span className="font-bold">{metric.satisfaction_score.toFixed(1)}/5</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {metric.notes && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">📝 Notas:</strong> {metric.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default UserMetricsHistory;
