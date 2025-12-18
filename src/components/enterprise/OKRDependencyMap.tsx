import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Target, ArrowRight, Users, Link2, 
  AlertTriangle, CheckCircle2, Plus, Trash2,
  RefreshCw, ChevronDown, Info, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface OKRDependencyMapProps {
  type?: 'organizational' | 'weekly';
  showDemoData?: boolean;
}

interface Objective {
  id: string;
  title: string;
  progress: number;
  status: string;
  owner_name: string;
}

interface DependencyLink {
  id: string;
  from: string;
  to: string;
  from_title: string;
  to_title: string;
  dependency_type: string;
  description?: string;
  status: 'healthy' | 'at_risk' | 'blocked';
}

// Datos demo
const DEMO_OBJECTIVES: Objective[] = [
  { id: 'demo-1', title: 'Incrementar MRR', progress: 75, status: 'active', owner_name: 'Tu nombre' },
  { id: 'demo-2', title: 'Mejorar NPS', progress: 45, status: 'active', owner_name: 'Tu nombre' },
  { id: 'demo-3', title: 'Lanzar nueva feature', progress: 30, status: 'active', owner_name: 'Tu nombre' },
];

const DEMO_LINKS: DependencyLink[] = [
  { id: 'dep-1', from: 'demo-3', to: 'demo-1', from_title: 'Lanzar nueva feature', to_title: 'Incrementar MRR', dependency_type: 'enables', status: 'at_risk' },
  { id: 'dep-2', from: 'demo-2', to: 'demo-1', from_title: 'Mejorar NPS', to_title: 'Incrementar MRR', dependency_type: 'relates_to', status: 'healthy' },
];

export function OKRDependencyMap({ type = 'organizational', showDemoData = false }: OKRDependencyMapProps) {
  const { t } = useTranslation();
  const { organizationId } = useCurrentOrganization();
  const { user } = useAuth();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [links, setLinks] = useState<DependencyLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Modal state for creating dependencies
  const [showAddModal, setShowAddModal] = useState(false);
  const [sourceObjId, setSourceObjId] = useState('');
  const [targetObjId, setTargetObjId] = useState('');
  const [dependencyType, setDependencyType] = useState('blocks');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchDependencies = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);

      let objectivesQuery = supabase
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

      if (type === 'organizational') {
        objectivesQuery = objectivesQuery.is('phase', null).not('quarter', 'ilike', 'Semana%');
      } else {
        if (user?.id) {
          objectivesQuery = objectivesQuery
            .eq('owner_user_id', user.id)
            .ilike('quarter', 'Semana%');
        }
      }

      const { data: objectivesData, error: objError } = await objectivesQuery;

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
        };
      });

      setObjectives(formattedObjectives);

      // Obtener dependencias REALES
      const objectiveIds = formattedObjectives.map(o => o.id);
      
      if (objectiveIds.length > 0) {
        const { data: dependenciesData, error: depError } = await supabase
          .from('okr_dependencies')
          .select('*')
          .eq('organization_id', organizationId)
          .or(`source_objective_id.in.(${objectiveIds.join(',')}),target_objective_id.in.(${objectiveIds.join(',')})`);

        if (depError) throw depError;

        const realLinks: DependencyLink[] = (dependenciesData || []).map((dep: {
          id: string;
          source_objective_id: string;
          target_objective_id: string;
          dependency_type: string;
          description?: string;
        }) => {
          const fromObj = formattedObjectives.find(o => o.id === dep.source_objective_id);
          const toObj = formattedObjectives.find(o => o.id === dep.target_objective_id);
          
          let status: DependencyLink['status'] = 'healthy';
          if (fromObj) {
            if (fromObj.progress < 30) status = 'blocked';
            else if (fromObj.progress < 60) status = 'at_risk';
          }

          return {
            id: dep.id,
            from: dep.source_objective_id,
            to: dep.target_objective_id,
            from_title: fromObj?.title || 'Objetivo no encontrado',
            to_title: toObj?.title || 'Objetivo no encontrado',
            dependency_type: dep.dependency_type,
            description: dep.description,
            status,
          };
        });

        setLinks(realLinks);
      } else {
        setLinks([]);
      }

    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, [organizationId, user?.id, type]);

  const handleCreateDependency = async () => {
    if (!sourceObjId || !targetObjId || sourceObjId === targetObjId) {
      toast.error('Selecciona dos objetivos diferentes');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('okr_dependencies')
        .insert({
          source_objective_id: sourceObjId,
          target_objective_id: targetObjId,
          dependency_type: dependencyType,
          description: description || null,
          organization_id: organizationId,
          created_by: user?.id
        });

      if (error) throw error;

      toast.success('Dependencia creada correctamente');
      setShowAddModal(false);
      setSourceObjId('');
      setTargetObjId('');
      setDescription('');
      fetchDependencies();
    } catch (err) {
      toast.error('Error al crear dependencia');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDependency = async (depId: string) => {
    try {
      const { error } = await supabase
        .from('okr_dependencies')
        .delete()
        .eq('id', depId);

      if (error) throw error;

      toast.success('Dependencia eliminada');
      fetchDependencies();
    } catch (err) {
      toast.error('Error al eliminar dependencia');
    }
  };

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

  const statusColors = {
    healthy: 'border-emerald-500 bg-emerald-500/10',
    at_risk: 'border-amber-500 bg-amber-500/10',
    blocked: 'border-rose-500 bg-rose-500/10',
  };

  const dependencyTypeLabels: Record<string, string> = {
    blocks: 'Bloquea',
    enables: 'Habilita',
    relates_to: 'Relacionado',
    depends_on: 'Depende de',
  };

  // Use demo data if enabled and no real data
  const displayObjectives = (objectives.length === 0 && showDemoData) ? DEMO_OBJECTIVES : objectives;
  const displayLinks = (links.length === 0 && showDemoData) ? DEMO_LINKS : links;
  const isDemo = objectives.length === 0 && showDemoData;

  const healthyLinks = displayLinks.filter(l => l.status === 'healthy').length;
  const atRiskLinks = displayLinks.filter(l => l.status === 'at_risk').length;
  const blockedLinks = displayLinks.filter(l => l.status === 'blocked').length;

  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <div className="space-y-6">
      {/* Explanation Collapsible */}
      <Collapsible open={showExplanation} onOpenChange={setShowExplanation}>
        <Card className="border-primary/20 bg-primary/5">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-primary/10 transition-colors py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">¿Qué es el Mapa de Dependencias?</CardTitle>
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform ${showExplanation ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 text-sm text-muted-foreground space-y-2">
              <p><strong className="text-foreground">Visualiza las relaciones entre tus OKRs</strong> para identificar cuellos de botella.</p>
              <p>Tipos de dependencias:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Bloquea:</strong> Un objetivo debe completarse antes de otro</li>
                <li><strong>Habilita:</strong> Un objetivo facilita el progreso de otro</li>
                <li><strong>Depende de:</strong> Un objetivo requiere el progreso de otro</li>
                <li><strong>Relacionado:</strong> Conexión informativa sin bloqueo</li>
              </ul>
              <p className="text-primary">💡 Si un OKR bloqueante tiene bajo progreso, afectará a los objetivos dependientes.</p>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Demo Badge */}
      {isDemo && (
        <Alert className="border-info/50 bg-info/10">
          <Eye className="h-4 w-4" />
          <AlertDescription className="flex items-center gap-2">
            <Badge variant="secondary">DEMO</Badge>
            Datos de ejemplo. Crea OKRs y configura dependencias reales.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">
            Mapa de Dependencias {type === 'weekly' ? 'Semanales' : 'Organizacionales'}
          </h2>
          <p className="text-muted-foreground">Visualiza cómo se relacionan tus OKRs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchDependencies} disabled={isDemo}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={displayObjectives.length < 2 || isDemo}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Dependencia
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Dependencia entre OKRs</DialogTitle>
                <DialogDescription>
                  Define cómo un objetivo afecta o depende de otro
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Objetivo Origen</Label>
                  <Select value={sourceObjId} onValueChange={setSourceObjId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el objetivo origen" />
                    </SelectTrigger>
                    <SelectContent>
                      {objectives.map(obj => (
                        <SelectItem key={obj.id} value={obj.id}>
                          {obj.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Relación</Label>
                  <Select value={dependencyType} onValueChange={setDependencyType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blocks">Bloquea (debe completarse primero)</SelectItem>
                      <SelectItem value="enables">Habilita (facilita el progreso)</SelectItem>
                      <SelectItem value="depends_on">Depende de</SelectItem>
                      <SelectItem value="relates_to">Relacionado (sin bloqueo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Objetivo Destino</Label>
                  <Select value={targetObjId} onValueChange={setTargetObjId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el objetivo destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {objectives.filter(obj => obj.id !== sourceObjId).map(obj => (
                        <SelectItem key={obj.id} value={obj.id}>
                          {obj.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Descripción (opcional)</Label>
                  <Textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe la relación entre estos objetivos..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateDependency} disabled={saving || !sourceObjId || !targetObjId}>
                  {saving ? 'Guardando...' : 'Crear Dependencia'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4 text-sm">
        <Card className="flex-1 min-w-[100px]">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{healthyLinks}</p>
            <p className="text-muted-foreground text-xs">Saludables</p>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[100px]">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{atRiskLinks}</p>
            <p className="text-muted-foreground text-xs">En Riesgo</p>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[100px]">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-rose-600">{blockedLinks}</p>
            <p className="text-muted-foreground text-xs">Bloqueadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500" />
              <span>Saludable (&gt;60%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500" />
              <span>En riesgo (30-60%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-rose-500/20 border border-rose-500" />
              <span>Bloqueada (&lt;30%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dependency Links */}
      {displayLinks.length === 0 && !isDemo ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No hay dependencias configuradas</p>
            <p className="text-sm text-muted-foreground mb-4">
              Las dependencias ayudan a identificar cuellos de botella y planificar mejor
            </p>
            {displayObjectives.length >= 2 && !isDemo && (
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Dependencia
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {displayLinks.map((link) => (
            <Card key={link.id} className={`border-2 ${statusColors[link.status]}`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  {/* From Objective */}
                  <div className="flex-1 p-4 rounded-lg bg-background">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm line-clamp-2">{link.from_title}</span>
                    </div>
                    {(() => {
                      const fromObj = displayObjectives.find(o => o.id === link.from);
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
                  <div className="flex flex-col items-center gap-1 shrink-0">
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
                      {dependencyTypeLabels[link.dependency_type] || link.dependency_type}
                    </Badge>
                  </div>

                  {/* To Objective */}
                  <div className="flex-1 p-4 rounded-lg bg-background">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm line-clamp-2">{link.to_title}</span>
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

                  {/* Delete button */}
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteDependency(link.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Description */}
                {link.description && (
                  <p className="mt-3 text-sm text-muted-foreground border-t pt-3">
                    {link.description}
                  </p>
                )}

                {/* Status Message */}
                {link.status !== 'healthy' && (
                  <div className={`mt-4 p-3 rounded-md flex items-start gap-2 ${
                    link.status === 'at_risk' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                  }`}>
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      {link.status === 'at_risk' ? (
                        <p>El objetivo origen está retrasado, lo que puede afectar al objetivo destino.</p>
                      ) : (
                        <p>El objetivo origen está muy retrasado y está bloqueando el progreso del destino.</p>
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
          {objectives.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No hay objetivos {type === 'weekly' ? 'semanales' : 'organizacionales'} activos
            </p>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
