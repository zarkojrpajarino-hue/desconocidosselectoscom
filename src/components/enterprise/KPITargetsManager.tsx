import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { 
  Target, TrendingUp, TrendingDown, CheckCircle2, 
  AlertTriangle, Plus, Edit2, Save, X 
} from 'lucide-react';
import { toast } from 'sonner';

interface KPITarget {
  id: string;
  kpi_metric: string;
  target_value: number;
  current_value: number | null;
  period_type: string;
  target_date: string | null;
  progress: number;
  status: 'on_track' | 'at_risk' | 'behind' | 'achieved';
}

const statusConfig = {
  achieved: { color: 'text-emerald-600', bg: 'bg-emerald-500/10', icon: CheckCircle2, label: 'Logrado' },
  on_track: { color: 'text-blue-600', bg: 'bg-blue-500/10', icon: TrendingUp, label: 'En camino' },
  at_risk: { color: 'text-amber-600', bg: 'bg-amber-500/10', icon: AlertTriangle, label: 'En riesgo' },
  behind: { color: 'text-rose-600', bg: 'bg-rose-500/10', icon: TrendingDown, label: 'Atrasado' },
};

const kpiLabels: Record<string, string> = {
  revenue: 'Ingresos',
  leads: 'Leads',
  conversion_rate: 'Tasa de Conversión',
  cac: 'CAC',
  ltv: 'LTV',
  mrr: 'MRR',
  churn: 'Churn Rate',
  nps: 'NPS',
};

export function KPITargetsManager() {
  const { organizationId } = useCurrentOrganization();
  const [data, setData] = useState<KPITarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  useEffect(() => {
    fetchTargets();
  }, [organizationId]);

  async function fetchTargets() {
    if (!organizationId) return;
    try {
      setLoading(true);
      const { data: targets, error: targetsError } = await supabase
        .from('kpi_targets')
        .select('*')
        .eq('organization_id', organizationId)
        .order('kpi_metric');

      if (targetsError) throw targetsError;

      const formattedTargets: KPITarget[] = (targets || []).map((target: any) => {
        const current = target.current_value || 0;
        const targetVal = target.target_value || 1;
        const progress = Math.min(100, Math.round((current / targetVal) * 100));
        
        let status: KPITarget['status'] = 'behind';
        if (progress >= 100) status = 'achieved';
        else if (progress >= 75) status = 'on_track';
        else if (progress >= 50) status = 'at_risk';

        return {
          id: target.id,
          kpi_metric: target.kpi_metric,
          target_value: target.target_value,
          current_value: target.current_value,
          period_type: target.period_type || 'monthly',
          target_date: target.target_date,
          progress,
          status,
        };
      });

      setData(formattedTargets);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveTarget(id: string) {
    try {
      const { error: updateError } = await supabase
        .from('kpi_targets')
        .update({ target_value: editValue })
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Meta actualizada');
      setEditingId(null);
      fetchTargets();
    } catch (err) {
      toast.error('Error al actualizar meta');
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <p className="text-destructive text-center">Error cargando metas de KPIs</p>
        </CardContent>
      </Card>
    );
  }

  const targets = data || [];
  const achievedCount = targets.filter(t => t.status === 'achieved').length;
  const onTrackCount = targets.filter(t => t.status === 'on_track').length;
  const overallProgress = targets.length > 0
    ? Math.round(targets.reduce((sum, t) => sum + t.progress, 0) / targets.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Metas KPI</h2>
          <p className="text-muted-foreground">Define y monitorea tus objetivos</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{achievedCount}</p>
            <p className="text-muted-foreground">Logradas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{onTrackCount}</p>
            <p className="text-muted-foreground">En Camino</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{overallProgress}%</p>
            <p className="text-muted-foreground">Progreso Global</p>
          </div>
        </div>
      </div>

      {/* Targets Grid */}
      {targets.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay metas configuradas</p>
            <p className="text-sm text-muted-foreground mt-1">
              Las metas se crean automáticamente cuando registras KPIs
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {targets.map((target) => {
            const config = statusConfig[target.status];
            const StatusIcon = config.icon;
            const isEditing = editingId === target.id;

            return (
              <Card key={target.id} className={`${config.bg} border-transparent`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">
                      {kpiLabels[target.kpi_metric] || target.kpi_metric}
                    </CardTitle>
                    <Badge variant="outline" className={config.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current vs Target */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Actual</p>
                      <p className={`text-2xl font-bold ${config.color}`}>
                        {target.current_value?.toLocaleString('es-ES') || '0'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Meta</p>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(Number(e.target.value))}
                            className="w-24 h-8 text-right"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleSaveTarget(target.id)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold">
                            {target.target_value.toLocaleString('es-ES')}
                          </p>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingId(target.id);
                              setEditValue(target.target_value);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progreso</span>
                      <span>{target.progress}%</span>
                    </div>
                    <Progress value={target.progress} className="h-2" />
                  </div>

                  {/* Period */}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Período: {target.period_type}</span>
                    {target.target_date && (
                      <span>Fecha límite: {new Date(target.target_date).toLocaleDateString('es-ES')}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
