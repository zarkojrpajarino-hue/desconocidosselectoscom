import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { 
  Target, ArrowRight, Users, Link2, 
  AlertTriangle, CheckCircle2 
} from 'lucide-react';

interface Objective {
  id: string;
  title: string;
  progress: number;
  status: string;
  owner_name: string;
  dependencies: string[];
  dependents: string[];
}

interface DependencyLink {
  from: string;
  to: string;
  from_title: string;
  to_title: string;
  status: 'healthy' | 'at_risk' | 'blocked';
}

export function OKRDependencyMap() {
  const { organizationId } = useCurrentOrganization();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [links, setLinks] = useState<DependencyLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchDependencies() {
      if (!organizationId) return;
      try {
        setLoading(true);

        // Obtener objetivos con key results
        const { data: objectivesData, error: objError } = await supabase
          .from('objectives')
          .select(`
            id,
            title,
            status,
            owner:owner_user_id (full_name),
            key_results (current_value, target_value)
          `)
          .eq('organization_id', organizationId)
          .eq('status', 'active');

        if (objError) throw objError;

        interface RawObjectiveData {
          id: string;
          title: string;
          status: string;
          owner?: { full_name?: string };
          key_results?: Array<{ current_value?: number; target_value?: number }>;
        }
        
        const formattedObjectives: Objective[] = ((objectivesData || []) as unknown as RawObjectiveData[]).map((obj) => {
          const keyResults = obj.key_results || [];
          const avgProgress = keyResults.length > 0
            ? Math.round(keyResults.reduce((sum: number, kr) => {
                const current = kr.current_value || 0;
                const target = kr.target_value || 1;
                return sum + Math.min(100, (current / target) * 100);
              }, 0) / keyResults.length)
            : 0;

          return {
            id: obj.id,
            title: obj.title,
            progress: avgProgress,
            status: obj.status,
            owner_name: obj.owner?.full_name || 'Sin asignar',
            dependencies: [],
            dependents: [],
          };
        });

        setObjectives(formattedObjectives);

        // Simular dependencias basadas en relaciones comunes
        // En producción, esto vendría de una tabla de dependencias
        const simulatedLinks: DependencyLink[] = [];
        if (formattedObjectives.length >= 2) {
          for (let i = 0; i < Math.min(3, formattedObjectives.length - 1); i++) {
            const fromObj = formattedObjectives[i];
            const toObj = formattedObjectives[i + 1];
            
            let status: DependencyLink['status'] = 'healthy';
            if (fromObj.progress < 30) status = 'blocked';
            else if (fromObj.progress < 60) status = 'at_risk';

            simulatedLinks.push({
              from: fromObj.id,
              to: toObj.id,
              from_title: fromObj.title,
              to_title: toObj.title,
              status,
            });
          }
        }
        setLinks(simulatedLinks);

      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetchDependencies();
  }, [organizationId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <p className="text-destructive text-center">Error cargando dependencias</p>
        </CardContent>
      </Card>
    );
  }

  const healthyLinks = links.filter(l => l.status === 'healthy').length;
  const atRiskLinks = links.filter(l => l.status === 'at_risk').length;
  const blockedLinks = links.filter(l => l.status === 'blocked').length;

  const statusColors = {
    healthy: 'border-emerald-500 bg-emerald-500/10',
    at_risk: 'border-amber-500 bg-amber-500/10',
    blocked: 'border-rose-500 bg-rose-500/10',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mapa de Dependencias</h2>
          <p className="text-muted-foreground">Visualiza cómo se relacionan tus OKRs</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{healthyLinks}</p>
            <p className="text-muted-foreground">Saludables</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{atRiskLinks}</p>
            <p className="text-muted-foreground">En Riesgo</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-rose-600">{blockedLinks}</p>
            <p className="text-muted-foreground">Bloqueadas</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500" />
              <span>Dependencia saludable (&gt;60% progreso)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500" />
              <span>En riesgo (30-60% progreso)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-rose-500/20 border border-rose-500" />
              <span>Bloqueada (&lt;30% progreso)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dependency Links */}
      {links.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay dependencias configuradas</p>
            <p className="text-sm text-muted-foreground mt-1">
              Las dependencias ayudan a identificar cuellos de botella
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {links.map((link, index) => (
            <Card key={index} className={`border-2 ${statusColors[link.status]}`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  {/* From Objective */}
                  <div className="flex-1 p-4 rounded-lg bg-background">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{link.from_title}</span>
                    </div>
                    {(() => {
                      const fromObj = objectives.find(o => o.id === link.from);
                      return fromObj ? (
                        <>
                          <Progress value={fromObj.progress} className="h-2 mb-2" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {fromObj.owner_name}
                            </span>
                            <span>{fromObj.progress}%</span>
                          </div>
                        </>
                      ) : null;
                    })()}
                  </div>

                  {/* Arrow */}
                  <div className="flex flex-col items-center gap-1">
                    <ArrowRight className={`h-6 w-6 ${
                      link.status === 'healthy' ? 'text-emerald-500' :
                      link.status === 'at_risk' ? 'text-amber-500' : 'text-rose-500'
                    }`} />
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        link.status === 'healthy' ? 'text-emerald-600 border-emerald-500' :
                        link.status === 'at_risk' ? 'text-amber-600 border-amber-500' : 'text-rose-600 border-rose-500'
                      }`}
                    >
                      {link.status === 'healthy' ? 'OK' : link.status === 'at_risk' ? 'Riesgo' : 'Bloqueado'}
                    </Badge>
                  </div>

                  {/* To Objective */}
                  <div className="flex-1 p-4 rounded-lg bg-background">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{link.to_title}</span>
                    </div>
                    {(() => {
                      const toObj = objectives.find(o => o.id === link.to);
                      return toObj ? (
                        <>
                          <Progress value={toObj.progress} className="h-2 mb-2" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {toObj.owner_name}
                            </span>
                            <span>{toObj.progress}%</span>
                          </div>
                        </>
                      ) : null;
                    })()}
                  </div>
                </div>

                {/* Status Message */}
                {link.status !== 'healthy' && (
                  <div className={`mt-4 p-3 rounded-md flex items-start gap-2 ${
                    link.status === 'at_risk' ? 'bg-amber-500/10 text-amber-700' : 'bg-rose-500/10 text-rose-700'
                  }`}>
                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                    <div className="text-sm">
                      {link.status === 'at_risk' ? (
                        <p>El objetivo "{link.from_title}" está retrasado, lo que puede afectar a "{link.to_title}".</p>
                      ) : (
                        <p>El objetivo "{link.from_title}" está muy retrasado y está bloqueando el progreso de "{link.to_title}".</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* All Objectives Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Todos los Objetivos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {objectives.map((obj) => (
              <div key={obj.id} className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm truncate">{obj.title}</span>
                  <Badge variant={obj.progress >= 70 ? 'default' : 'outline'}>
                    {obj.progress}%
                  </Badge>
                </div>
                <Progress value={obj.progress} className="h-1.5 mb-2" />
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {obj.owner_name}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
