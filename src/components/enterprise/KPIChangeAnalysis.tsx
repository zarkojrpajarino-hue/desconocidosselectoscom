import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { 
  TrendingUp, TrendingDown, Minus, HelpCircle,
  ArrowRight, Lightbulb, AlertTriangle 
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface KPIChange {
  id: string;
  kpi_metric: string;
  old_value: number | null;
  new_value: number | null;
  change_percentage: number | null;
  changed_at: string;
  contributing_factors: string[];
}

const kpiLabels: Record<string, string> = {
  revenue: 'Ingresos',
  leads: 'Leads',
  conversion_rate: 'Tasa de Conversión',
  cac: 'CAC',
  ltv: 'LTV',
  mrr: 'MRR',
  churn: 'Churn Rate',
  nps: 'NPS',
  avg_ticket: 'Ticket Promedio',
  operational_costs: 'Costos Operacionales',
};

const factorSuggestions: Record<string, string[]> = {
  revenue: [
    'Nuevos clientes adquiridos',
    'Aumento en ticket promedio',
    'Campaña de marketing exitosa',
    'Estacionalidad del mercado',
    'Lanzamiento de nuevo producto',
  ],
  leads: [
    'Mayor inversión en publicidad',
    'Optimización de landing pages',
    'Nuevo canal de adquisición',
    'Contenido viral en redes',
    'Referidos de clientes existentes',
  ],
  cac: [
    'Mayor competencia en ads',
    'Cambio en estrategia de marketing',
    'Optimización de embudo',
    'Nuevos canales más económicos',
    'Mejor segmentación de audiencia',
  ],
  conversion_rate: [
    'Mejora en proceso de ventas',
    'Calidad de leads mejorada',
    'Optimización de pricing',
    'Mejor seguimiento de leads',
    'Capacitación del equipo comercial',
  ],
};

export function KPIChangeAnalysis() {
  const { organizationId } = useCurrentOrganization();
  const [data, setData] = useState<KPIChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchChanges() {
      if (!organizationId) return;
      try {
        setLoading(true);
        const { data: changes, error: changesError } = await supabase
          .from('kpi_change_history')
          .select('*')
          .eq('organization_id', organizationId)
          .order('changed_at', { ascending: false })
          .limit(20);

        if (changesError) throw changesError;

        interface RawKPIChange {
          id: string;
          kpi_metric: string;
          old_value: number | null;
          new_value: number | null;
          change_percentage: number | null;
          changed_at: string | null;
          contributing_factors: string[] | null;
        }

        const formattedChanges: KPIChange[] = ((changes || []) as RawKPIChange[]).map((change) => ({
          id: change.id,
          kpi_metric: change.kpi_metric,
          old_value: change.old_value,
          new_value: change.new_value,
          change_percentage: change.change_percentage,
          changed_at: change.changed_at,
          contributing_factors: Array.isArray(change.contributing_factors) 
            ? change.contributing_factors 
            : [],
        }));

        setData(formattedChanges);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetchChanges();
  }, [organizationId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <p className="text-destructive text-center">Error cargando análisis de cambios</p>
        </CardContent>
      </Card>
    );
  }

  const changes = data || [];
  const positiveChanges = changes.filter(c => (c.change_percentage || 0) > 0).length;
  const negativeChanges = changes.filter(c => (c.change_percentage || 0) < 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análisis de Cambios</h2>
          <p className="text-muted-foreground">¿Por qué cambiaron tus KPIs?</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{positiveChanges}</p>
            <p className="text-muted-foreground">Mejoras</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-rose-600">{negativeChanges}</p>
            <p className="text-muted-foreground">Descensos</p>
          </div>
        </div>
      </div>

      {/* Changes List */}
      {changes.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay cambios significativos registrados</p>
            <p className="text-sm text-muted-foreground mt-1">
              Los cambios aparecerán cuando tus KPIs varíen significativamente
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {changes.map((change) => {
            const isPositive = (change.change_percentage || 0) > 0;
            const isNegative = (change.change_percentage || 0) < 0;
            const suggestions = factorSuggestions[change.kpi_metric] || [];

            return (
              <AccordionItem key={change.id} value={change.id} className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      {isPositive ? (
                        <div className="p-2 rounded-full bg-emerald-500/10">
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                        </div>
                      ) : isNegative ? (
                        <div className="p-2 rounded-full bg-rose-500/10">
                          <TrendingDown className="h-4 w-4 text-rose-600" />
                        </div>
                      ) : (
                        <div className="p-2 rounded-full bg-muted">
                          <Minus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="text-left">
                        <p className="font-medium">
                          {kpiLabels[change.kpi_metric] || change.kpi_metric}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(change.changed_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">
                          {change.old_value?.toLocaleString('es-ES') || '0'}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {change.new_value?.toLocaleString('es-ES') || '0'}
                        </span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={isPositive ? 'text-emerald-600' : isNegative ? 'text-rose-600' : ''}
                      >
                        {isPositive ? '+' : ''}{change.change_percentage?.toFixed(1) || '0'}%
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    {/* Factores Registrados */}
                    {change.contributing_factors.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-amber-500" />
                          Factores identificados
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {change.contributing_factors.map((factor, i) => (
                            <Badge key={i} variant="secondary">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sugerencias */}
                    {suggestions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          Posibles causas a investigar
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {suggestions.map((suggestion, i) => (
                            <div 
                              key={i} 
                              className="text-sm text-muted-foreground p-2 rounded-md bg-muted/50"
                            >
                              • {suggestion}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Alerta si es negativo */}
                    {isNegative && Math.abs(change.change_percentage || 0) > 15 && (
                      <div className="flex items-start gap-2 p-3 rounded-md bg-rose-500/10 text-rose-700">
                        <AlertTriangle className="h-4 w-4 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">Cambio significativo detectado</p>
                          <p>Este KPI ha bajado más del 15%. Se recomienda investigar las causas.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
