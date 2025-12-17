import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Target, TrendingUp, TrendingDown, CheckCircle2,
  AlertTriangle, Calendar, Users 
} from 'lucide-react';

interface OKRQuarterlyViewProps {
  type?: 'organizational' | 'weekly';
}

interface Objective {
  id: string;
  title: string;
  description: string;
  quarter: string;
  year: number;
  status: string;
  progress: number;
  owner_name: string;
  key_results: KeyResult[];
}

interface KeyResult {
  id: string;
  title: string;
  current_value: number;
  target_value: number;
  progress: number;
  status: string;
}

const statusConfig = {
  achieved: { color: 'text-emerald-600', bg: 'bg-emerald-500/10', icon: CheckCircle2, label: 'Logrado' },
  on_track: { color: 'text-blue-600', bg: 'bg-blue-500/10', icon: TrendingUp, label: 'En camino' },
  at_risk: { color: 'text-amber-600', bg: 'bg-amber-500/10', icon: AlertTriangle, label: 'En riesgo' },
  behind: { color: 'text-rose-600', bg: 'bg-rose-500/10', icon: TrendingDown, label: 'Atrasado' },
  active: { color: 'text-blue-600', bg: 'bg-blue-500/10', icon: Target, label: 'Activo' },
};

export function OKRQuarterlyView({ type = 'organizational' }: OKRQuarterlyViewProps) {
  const { organizationId } = useCurrentOrganization();
  const { user } = useAuth();
  const [data, setData] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');

  useEffect(() => {
    async function fetchOKRs() {
      if (!organizationId) return;
      try {
        setLoading(true);

        const now = new Date();
        let query = supabase
          .from('objectives')
          .select(`
            *,
            owner:owner_user_id (full_name),
            key_results (*)
          `)
          .eq('organization_id', organizationId);

        if (type === 'organizational') {
          // OKRs organizacionales: trimestre actual, sin fase
          const currentQuarter = `Q${Math.floor(now.getMonth() / 3) + 1}`;
          const currentYear = now.getFullYear();
          setSelectedPeriod(`${currentQuarter} ${currentYear}`);
          
          query = query
            .eq('quarter', currentQuarter)
            .eq('year', currentYear)
            .is('phase', null);
        } else {
          // OKRs semanales: filtrar por usuario y quarter que empiece con "Semana"
          setSelectedPeriod('Semana Actual');
          
          if (user?.id) {
            query = query
              .eq('owner_user_id', user.id)
              .ilike('quarter', 'Semana%')
              .order('created_at', { ascending: false })
              .limit(10);
          }
        }

        const { data: objectives, error: objError } = await query;

        if (objError) throw objError;

        interface RawKeyResult {
          id: string;
          title: string;
          current_value: number | null;
          target_value: number | null;
          status: string | null;
        }

        interface RawObjective {
          id: string;
          title: string;
          description: string | null;
          quarter: string;
          year: number;
          status: string | null;
          owner: { full_name: string } | null;
          key_results: RawKeyResult[];
        }

        const formattedObjectives: Objective[] = ((objectives || []) as unknown as RawObjective[]).map((obj) => {
          const keyResults = (obj.key_results || []).map((kr) => {
            const current = kr.current_value || 0;
            const target = kr.target_value || 1;
            const progress = Math.min(100, Math.round((current / target) * 100));
            
            return {
              id: kr.id,
              title: kr.title,
              current_value: current,
              target_value: target,
              progress,
              status: kr.status || 'active',
            };
          });

          const avgProgress = keyResults.length > 0
            ? Math.round(keyResults.reduce((sum: number, kr: KeyResult) => sum + kr.progress, 0) / keyResults.length)
            : 0;

          return {
            id: obj.id,
            title: obj.title,
            description: obj.description || '',
            quarter: obj.quarter,
            year: obj.year,
            status: obj.status || 'active',
            progress: avgProgress,
            owner_name: obj.owner?.full_name || 'Sin asignar',
            key_results: keyResults,
          };
        });

        setData(formattedObjectives);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetchOKRs();
  }, [organizationId, user?.id, type]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <p className="text-destructive text-center">Error cargando OKRs</p>
        </CardContent>
      </Card>
    );
  }

  const objectives = data || [];
  const avgProgress = objectives.length > 0
    ? Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / objectives.length)
    : 0;
  const onTrackCount = objectives.filter(o => o.progress >= 70).length;
  const atRiskCount = objectives.filter(o => o.progress < 50).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">
            {type === 'organizational' ? 'Vista Trimestral OKRs' : 'OKRs Semanales'}
          </h2>
          <p className="text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {selectedPeriod}
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{avgProgress}%</p>
            <p className="text-muted-foreground">Progreso Global</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{onTrackCount}</p>
            <p className="text-muted-foreground">En Camino</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-rose-600">{atRiskCount}</p>
            <p className="text-muted-foreground">En Riesgo</p>
          </div>
        </div>
      </div>

      {/* Global Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {type === 'organizational' ? 'Progreso General del Trimestre' : 'Progreso Semanal'}
              </span>
              <span className="font-medium">{avgProgress}%</span>
            </div>
            <Progress value={avgProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Objectives List */}
      {objectives.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {type === 'organizational' 
                ? 'No hay OKRs organizacionales para este trimestre'
                : 'No hay OKRs semanales generados'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {objectives.map((objective) => {
            const config = statusConfig[objective.status as keyof typeof statusConfig] || statusConfig.active;

            return (
              <Card key={objective.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{objective.title}</CardTitle>
                      {objective.description && (
                        <p className="text-sm text-muted-foreground">{objective.description}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={config.color}>
                      {objective.progress}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {objective.owner_name}
                    </span>
                    <span>{objective.key_results.length} Key Results</span>
                    {type === 'weekly' && (
                      <Badge variant="secondary" className="text-xs">
                        {objective.quarter}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Objective Progress */}
                  <Progress value={objective.progress} className="h-2" />

                  {/* Key Results */}
                  <div className="space-y-3">
                    {objective.key_results.map((kr) => {
                      const krConfig = statusConfig[kr.status as keyof typeof statusConfig] || statusConfig.active;
                      const KRIcon = krConfig.icon;

                      return (
                        <div 
                          key={kr.id} 
                          className="p-3 rounded-lg bg-muted/50 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <KRIcon className={`h-4 w-4 ${krConfig.color}`} />
                              <span className="text-sm font-medium">{kr.title}</span>
                            </div>
                            <Badge variant="outline" className={krConfig.color}>
                              {kr.progress}%
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Actual: {kr.current_value.toLocaleString('es-ES')}</span>
                            <span>Meta: {kr.target_value.toLocaleString('es-ES')}</span>
                          </div>
                          <Progress value={kr.progress} className="h-1" />
                        </div>
                      );
                    })}
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