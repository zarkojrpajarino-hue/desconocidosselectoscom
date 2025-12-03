import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Plus, Trash2, Target, BarChart3 } from 'lucide-react';
import { Step7Props, CriticalHypothesis } from '@/types/startup-onboarding';

const COMMON_PRELAUNCH_METRICS = [
  'Signups waitlist', 'Entrevistas completadas', 'Cartas de intención (LOI)',
  'Pre-orders', 'Leads cualificados', 'Seguidores redes', 'Menciones PR'
];

const COMMON_POSTLAUNCH_KPIS = [
  'MRR', 'Usuarios activos', 'Churn rate', 'NPS', 'CAC real',
  'LTV real', 'Conversion rate', 'Activación (Day 1)', 'Retención (Week 1)'
];

export default function StartupStep7Validation({ data, updateData }: Step7Props) {
  const [newMetric, setNewMetric] = useState('');
  const [newKPI, setNewKPI] = useState('');
  const [newHypothesis, setNewHypothesis] = useState<CriticalHypothesis>({
    hypothesis: '', validationMethod: '', successCriteria: ''
  });

  const addHypothesis = () => {
    if (newHypothesis.hypothesis.trim() && newHypothesis.validationMethod.trim()) {
      updateData({ criticalHypotheses: [...data.criticalHypotheses, { ...newHypothesis }] });
      setNewHypothesis({ hypothesis: '', validationMethod: '', successCriteria: '' });
    }
  };

  const removeHypothesis = (index: number) => {
    updateData({ criticalHypotheses: data.criticalHypotheses.filter((_, i) => i !== index) });
  };

  const addMetric = (metric: string) => {
    if (metric.trim() && !data.prelaunchMetrics.includes(metric)) {
      updateData({ prelaunchMetrics: [...data.prelaunchMetrics, metric.trim()] });
      setNewMetric('');
    }
  };

  const removeMetric = (index: number) => {
    updateData({ prelaunchMetrics: data.prelaunchMetrics.filter((_, i) => i !== index) });
  };

  const addKPI = (kpi: string) => {
    if (kpi.trim() && !data.postlaunchKPIs.includes(kpi)) {
      updateData({ postlaunchKPIs: [...data.postlaunchKPIs, kpi.trim()] });
      setNewKPI('');
    }
  };

  const removeKPI = (index: number) => {
    updateData({ postlaunchKPIs: data.postlaunchKPIs.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2 pb-6 border-b">
        <FlaskConical className="w-12 h-12 text-primary mx-auto" />
        <h2 className="text-2xl font-bold">Validación</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Define qué necesitas probar y cómo sabrás si tu idea funciona
        </p>
      </div>

      {/* Critical Hypotheses */}
      <Card className="border-2 border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Hipótesis Críticas
          </CardTitle>
          <CardDescription>
            ¿Qué asunciones deben ser verdad para que tu negocio funcione?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.criticalHypotheses.length > 0 && (
            <div className="space-y-3">
              {data.criticalHypotheses.map((hyp, index) => (
                <Card key={index} className="bg-muted/30">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-2">
                        <p className="font-medium">"{hyp.hypothesis}"</p>
                        <p className="text-sm"><strong>Método:</strong> {hyp.validationMethod}</p>
                        <p className="text-sm"><strong>Éxito si:</strong> {hyp.successCriteria}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeHypothesis(index)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="space-y-3 p-4 border-2 border-dashed rounded-lg">
            <Label className="font-semibold">➕ Agregar Hipótesis</Label>
            <Textarea placeholder="Ej: Los founders de SaaS pagarían €79/mes por automatizar sus reportes"
              value={newHypothesis.hypothesis}
              onChange={(e) => setNewHypothesis({ ...newHypothesis, hypothesis: e.target.value })}
              rows={2} />
            <Input placeholder="Método de validación (Ej: 20 entrevistas de customer discovery)"
              value={newHypothesis.validationMethod}
              onChange={(e) => setNewHypothesis({ ...newHypothesis, validationMethod: e.target.value })} />
            <Input placeholder="Criterio de éxito (Ej: 15/20 confirman disposición a pagar)"
              value={newHypothesis.successCriteria}
              onChange={(e) => setNewHypothesis({ ...newHypothesis, successCriteria: e.target.value })} />
            <Button onClick={addHypothesis} className="w-full"
              disabled={!newHypothesis.hypothesis.trim() || !newHypothesis.validationMethod.trim()}>
              <Plus className="w-4 h-4 mr-2" />Agregar Hipótesis
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prelaunch Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Métricas Pre-Lanzamiento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {COMMON_PRELAUNCH_METRICS.map((metric) => {
              const isSelected = data.prelaunchMetrics.includes(metric);
              return (
                <Badge key={metric} variant={isSelected ? 'default' : 'outline'} className="cursor-pointer"
                  onClick={() => { if (isSelected) removeMetric(data.prelaunchMetrics.indexOf(metric)); else addMetric(metric); }}>
                  {metric}
                </Badge>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Otra métrica..." value={newMetric} onChange={(e) => setNewMetric(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addMetric(newMetric)} />
            <Button onClick={() => addMetric(newMetric)} disabled={!newMetric.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Postlaunch KPIs */}
      <Card>
        <CardHeader>
          <CardTitle>KPIs Post-Lanzamiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {COMMON_POSTLAUNCH_KPIS.map((kpi) => {
              const isSelected = data.postlaunchKPIs.includes(kpi);
              return (
                <Badge key={kpi} variant={isSelected ? 'default' : 'outline'} className="cursor-pointer"
                  onClick={() => { if (isSelected) removeKPI(data.postlaunchKPIs.indexOf(kpi)); else addKPI(kpi); }}>
                  {kpi}
                </Badge>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Otro KPI..." value={newKPI} onChange={(e) => setNewKPI(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addKPI(newKPI)} />
            <Button onClick={() => addKPI(newKPI)} disabled={!newKPI.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pivot Criteria */}
      <Card className="border-2 border-red-300 dark:border-red-700">
        <CardHeader>
          <CardTitle>Criterios de Pivote</CardTitle>
          <CardDescription>¿En qué circunstancias abandonarías o cambiarías significativamente la idea?</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ej: Si después de 100 entrevistas menos del 20% muestra interés real. Si después de 3 meses de MVP activo tenemos menos de 10 usuarios de pago. Si el CAC real es 3x mayor que el estimado..."
            value={data.pivotCriteria}
            onChange={(e) => updateData({ pivotCriteria: e.target.value })}
            rows={4} />
        </CardContent>
      </Card>

      {/* Success Definition */}
      <Card className="border-2 border-green-300 dark:border-green-700">
        <CardHeader>
          <CardTitle>Definición de Éxito</CardTitle>
          <CardDescription>¿Cómo se ve el éxito para este proyecto en 12 meses?</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ej: 500 clientes de pago, €40K MRR, equipo de 5 personas, pre-seed de €500K cerrado, producto con 3 features core validadas y NPS &gt; 50"
            value={data.successDefinition}
            onChange={(e) => updateData({ successDefinition: e.target.value })}
            rows={4} />
        </CardContent>
      </Card>

      <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">🎯 Tips para este paso:</h4>
        <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1 list-disc list-inside">
          <li>Define 3-5 hipótesis críticas máximo - prioriza las más importantes</li>
          <li>Cada hipótesis debe poder falsificarse (demostrar que es falsa)</li>
          <li>Tener criterios de pivote ANTES de empezar evita sesgos</li>
        </ul>
      </div>
    </div>
  );
}
