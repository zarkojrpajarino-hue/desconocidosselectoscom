import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { 
  Target, CheckCircle2, XCircle, TrendingUp,
  TrendingDown, Lightbulb, AlertTriangle, Award,
  Calendar, ThumbsUp, ThumbsDown 
} from 'lucide-react';

interface ObjectiveSummary {
  id: string;
  title: string;
  final_progress: number;
  status: 'achieved' | 'partial' | 'missed';
  key_results_achieved: number;
  key_results_total: number;
  lessons_learned?: string;
}

interface QuarterStats {
  total_objectives: number;
  achieved: number;
  partial: number;
  missed: number;
  average_progress: number;
}

export function OKRRetrospective() {
  const { organizationId } = useCurrentOrganization();
  const [objectives, setObjectives] = useState<ObjectiveSummary[]>([]);
  const [stats, setStats] = useState<QuarterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<string>('');

  useEffect(() => {
    async function fetchRetrospective() {
      if (!organizationId) return;
      try {
        setLoading(true);

        // Calcular trimestre anterior
        const now = new Date();
        const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
        const prevQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1;
        const prevYear = currentQuarter === 1 ? now.getFullYear() - 1 : now.getFullYear();
        setSelectedQuarter(`Q${prevQuarter} ${prevYear}`);

        // Obtener objetivos del trimestre anterior
        const { data: objectivesData, error: objError } = await supabase
          .from('objectives')
          .select(`
            id,
            title,
            status,
            key_results (current_value, target_value, status)
          `)
          .eq('organization_id', organizationId)
          .eq('quarter', `Q${prevQuarter}`)
          .eq('year', prevYear);

        if (objError) throw objError;

        const summaries: ObjectiveSummary[] = (objectivesData || []).map((obj: any) => {
          const keyResults = obj.key_results || [];
          const totalKRs = keyResults.length;
          const achievedKRs = keyResults.filter((kr: any) => {
            const current = kr.current_value || 0;
            const target = kr.target_value || 1;
            return current >= target;
          }).length;

          const avgProgress = totalKRs > 0
            ? Math.round(keyResults.reduce((sum: number, kr: any) => {
                const current = kr.current_value || 0;
                const target = kr.target_value || 1;
                return sum + Math.min(100, (current / target) * 100);
              }, 0) / totalKRs)
            : 0;

          let status: ObjectiveSummary['status'] = 'missed';
          if (avgProgress >= 100) status = 'achieved';
          else if (avgProgress >= 70) status = 'partial';

          return {
            id: obj.id,
            title: obj.title,
            final_progress: avgProgress,
            status,
            key_results_achieved: achievedKRs,
            key_results_total: totalKRs,
          };
        });

        setObjectives(summaries);

        // Calcular estadísticas
        const achieved = summaries.filter(o => o.status === 'achieved').length;
        const partial = summaries.filter(o => o.status === 'partial').length;
        const missed = summaries.filter(o => o.status === 'missed').length;
        const avgProgress = summaries.length > 0
          ? Math.round(summaries.reduce((sum, o) => sum + o.final_progress, 0) / summaries.length)
          : 0;

        setStats({
          total_objectives: summaries.length,
          achieved,
          partial,
          missed,
          average_progress: avgProgress,
        });

      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetchRetrospective();
  }, [organizationId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
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
          <p className="text-destructive text-center">Error cargando retrospectiva</p>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = {
    achieved: { color: 'text-emerald-600', bg: 'bg-emerald-500/10', icon: CheckCircle2, label: 'Logrado' },
    partial: { color: 'text-amber-600', bg: 'bg-amber-500/10', icon: TrendingUp, label: 'Parcial' },
    missed: { color: 'text-rose-600', bg: 'bg-rose-500/10', icon: XCircle, label: 'No logrado' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Retrospectiva de OKRs</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {selectedQuarter}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Target className="h-4 w-4" />
                <span className="text-sm">Progreso General</span>
              </div>
              <p className="text-3xl font-bold text-primary">{stats.average_progress}%</p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Logrados</span>
              </div>
              <p className="text-3xl font-bold text-emerald-600">{stats.achieved}</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Parciales</span>
              </div>
              <p className="text-3xl font-bold text-amber-600">{stats.partial}</p>
            </CardContent>
          </Card>
          <Card className="bg-rose-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-rose-600 mb-1">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">No Logrados</span>
              </div>
              <p className="text-3xl font-bold text-rose-600">{stats.missed}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Objectives Summary */}
      {objectives.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay OKRs del trimestre anterior</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {objectives.map((obj) => {
            const config = statusConfig[obj.status];
            const StatusIcon = config.icon;

            return (
              <Card key={obj.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{obj.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {obj.key_results_achieved}/{obj.key_results_total} Key Results completados
                      </p>
                    </div>
                    <Badge variant="outline" className={config.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progreso Final</span>
                      <span className={`font-medium ${config.color}`}>{obj.final_progress}%</span>
                    </div>
                    <Progress value={obj.final_progress} className="h-3" />
                  </div>

                  {/* Quick Assessment */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-3 rounded-lg ${obj.status === 'achieved' ? 'bg-emerald-500/10' : 'bg-muted/50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <ThumbsUp className={`h-4 w-4 ${obj.status === 'achieved' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium">Lo que funcionó</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {obj.status === 'achieved' 
                          ? 'Objetivo alcanzado con éxito'
                          : obj.key_results_achieved > 0 
                            ? `${obj.key_results_achieved} KRs completados`
                            : 'Identificar mejoras'}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${obj.status === 'missed' ? 'bg-rose-500/10' : 'bg-muted/50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <ThumbsDown className={`h-4 w-4 ${obj.status === 'missed' ? 'text-rose-600' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium">A mejorar</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {obj.status === 'missed'
                          ? 'Revisar estrategia y recursos'
                          : obj.key_results_total - obj.key_results_achieved > 0
                            ? `${obj.key_results_total - obj.key_results_achieved} KRs pendientes`
                            : 'Mantener el ritmo'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Lessons Learned */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Lecciones del Trimestre
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-emerald-500/10">
              <h4 className="font-medium text-emerald-700 mb-2 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Éxitos a Celebrar
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {stats && stats.achieved > 0 && (
                  <li>• {stats.achieved} objetivo(s) completamente logrado(s)</li>
                )}
                {stats && stats.average_progress >= 70 && (
                  <li>• Progreso general por encima del 70%</li>
                )}
                <li>• Equipo comprometido con los objetivos</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-amber-500/10">
              <h4 className="font-medium text-amber-700 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Áreas de Mejora
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {stats && stats.missed > 0 && (
                  <li>• Revisar {stats.missed} objetivo(s) no alcanzado(s)</li>
                )}
                {stats && stats.average_progress < 70 && (
                  <li>• Mejorar seguimiento semanal</li>
                )}
                <li>• Definir KRs más específicos y medibles</li>
              </ul>
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Notas adicionales para el próximo trimestre
            </label>
            <Textarea 
              placeholder="Documenta aprendizajes, decisiones importantes, y recomendaciones para el equipo..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
