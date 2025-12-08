import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { 
  TrendingUp, TrendingDown, Target, DollarSign,
  BarChart3, AlertTriangle 
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

interface ForecastData {
  stage: string;
  count: number;
  value: number;
  probability: number;
  weighted_value: number;
}

interface Scenario {
  label: string;
  value: number;
  confidence: number;
}

const stageColors: Record<string, string> = {
  'nuevo': 'hsl(var(--chart-1))',
  'contactado': 'hsl(var(--chart-2))',
  'calificado': 'hsl(var(--chart-3))',
  'propuesta': 'hsl(var(--chart-4))',
  'negociacion': 'hsl(var(--chart-5))',
};

export function PipelineForecast() {
  const { organizationId } = useCurrentOrganization();
  const [data, setData] = useState<ForecastData[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchForecast() {
      if (!organizationId) return;
      try {
        setLoading(true);
        
        // Obtener leads por etapa
        const { data: leads, error: leadsError } = await supabase
          .from('leads')
          .select('stage, estimated_value, probability')
          .eq('organization_id', organizationId)
          .not('stage', 'in', '(won,lost,closed_won,closed_lost)');

        if (leadsError) throw leadsError;

        // Agrupar por etapa
        const stageMap = new Map<string, ForecastData>();
        const stageProbabilities: Record<string, number> = {
          'nuevo': 10,
          'contactado': 20,
          'calificado': 40,
          'propuesta': 60,
          'negociacion': 80,
        };

        interface RawLead {
          stage: string | null;
          estimated_value: number | null;
          probability: number | null;
        }

        ((leads || []) as RawLead[]).forEach((lead) => {
          const stage = lead.stage || 'nuevo';
          const current = stageMap.get(stage) || {
            stage,
            count: 0,
            value: 0,
            probability: stageProbabilities[stage] || 30,
            weighted_value: 0,
          };
          
          const value = lead.estimated_value || 0;
          const prob = lead.probability || stageProbabilities[stage] || 30;
          
          current.count += 1;
          current.value += value;
          current.weighted_value += value * (prob / 100);
          
          stageMap.set(stage, current);
        });

        const forecastData = Array.from(stageMap.values());
        setData(forecastData);

        // Calcular escenarios
        const totalWeighted = forecastData.reduce((sum, d) => sum + d.weighted_value, 0);
        const totalValue = forecastData.reduce((sum, d) => sum + d.value, 0);

        setScenarios([
          { label: 'Conservador', value: totalWeighted * 0.7, confidence: 90 },
          { label: 'Realista', value: totalWeighted, confidence: 70 },
          { label: 'Optimista', value: totalValue * 0.8, confidence: 40 },
        ]);

      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetchForecast();
  }, [organizationId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <p className="text-destructive text-center">Error cargando forecast</p>
        </CardContent>
      </Card>
    );
  }

  const totalPipeline = data.reduce((sum, d) => sum + d.value, 0);
  const totalWeighted = data.reduce((sum, d) => sum + d.weighted_value, 0);
  const totalDeals = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pipeline Forecast</h2>
          <p className="text-muted-foreground">Proyección de ingresos del pipeline</p>
        </div>
        <Badge variant="outline" className="text-primary">
          <BarChart3 className="h-4 w-4 mr-1" />
          {totalDeals} deals activos
        </Badge>
      </div>

      {/* Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((scenario, index) => (
          <Card key={index} className={index === 1 ? 'border-primary' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{scenario.label}</span>
                <Badge variant={index === 1 ? 'default' : 'outline'}>
                  {scenario.confidence}% confianza
                </Badge>
              </div>
              <p className="text-3xl font-bold">
                €{scenario.value.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Valor Total Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">
              €{totalPipeline.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Ponderado: €{totalWeighted.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Tasa de Conversión Esperada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">
              {totalPipeline > 0 
                ? Math.round((totalWeighted / totalPipeline) * 100) 
                : 0}%
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Basado en probabilidades por etapa
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart by Stage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Valor por Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No hay datos de pipeline
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="stage" className="text-xs" />
                <YAxis 
                  tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                  className="text-xs"
                />
                <Tooltip 
                  formatter={(value: number) => [
                    `€${value.toLocaleString('es-ES')}`,
                    'Valor'
                  ]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell 
                      key={index} 
                      fill={stageColors[entry.stage] || 'hsl(var(--primary))'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Stage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Desglose por Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.map((stage, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stageColors[stage.stage] || 'hsl(var(--primary))' }}
                  />
                  <div>
                    <p className="font-medium capitalize">{stage.stage}</p>
                    <p className="text-sm text-muted-foreground">{stage.count} deals</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    €{stage.value.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ponderado: €{stage.weighted_value.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
