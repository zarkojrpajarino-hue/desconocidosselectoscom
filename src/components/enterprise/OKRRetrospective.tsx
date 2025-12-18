import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Target, CheckCircle2, XCircle, TrendingUp,
  Lightbulb, AlertTriangle, Award,
  Calendar, ThumbsUp, ThumbsDown, Star,
  Save, FileText, RefreshCw, ChevronDown, Info, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface OKRRetrospectiveProps {
  type?: 'organizational' | 'weekly';
  showDemoData?: boolean;
}

interface ObjectiveSummary {
  id: string;
  title: string;
  quarter: string;
  final_progress: number;
  status: 'achieved' | 'partial' | 'missed';
  key_results_achieved: number;
  key_results_total: number;
  hasRetro?: boolean;
}

interface PeriodStats {
  total_objectives: number;
  achieved: number;
  partial: number;
  missed: number;
  average_progress: number;
}

interface RetroData {
  what_went_well: string[];
  what_to_improve: string[];
  lessons_learned: string;
  satisfaction_rating: number;
}

// Datos demo
const DEMO_OBJECTIVES: ObjectiveSummary[] = [
  { id: 'demo-1', title: 'Incrementar MRR a €50k', quarter: 'Semana 1-2', final_progress: 95, status: 'achieved', key_results_achieved: 2, key_results_total: 2 },
  { id: 'demo-2', title: 'Mejorar satisfacción cliente', quarter: 'Semana 1-2', final_progress: 72, status: 'partial', key_results_achieved: 1, key_results_total: 2 },
  { id: 'demo-3', title: 'Lanzar nueva feature', quarter: 'Semana 1-2', final_progress: 45, status: 'missed', key_results_achieved: 0, key_results_total: 2 },
];

const DEMO_STATS: PeriodStats = {
  total_objectives: 3,
  achieved: 1,
  partial: 1,
  missed: 1,
  average_progress: 71,
};

export function OKRRetrospective({ type = 'organizational', showDemoData = false }: OKRRetrospectiveProps) {
  const { t } = useTranslation();
  const { organizationId } = useCurrentOrganization();
  const { user } = useAuth();
  const [objectives, setObjectives] = useState<ObjectiveSummary[]>([]);
  const [stats, setStats] = useState<PeriodStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);

  // Retro modal state
  const [showRetroModal, setShowRetroModal] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<ObjectiveSummary | null>(null);
  const [retroData, setRetroData] = useState<RetroData>({
    what_went_well: [''],
    what_to_improve: [''],
    lessons_learned: '',
    satisfaction_rating: 3
  });
  const [saving, setSaving] = useState(false);
  const [existingRetros, setExistingRetros] = useState<Record<string, boolean>>({});

  const fetchRetrospective = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);

      const now = new Date();
      
      let query = supabase
        .from('objectives')
        .select(`
          id,
          title,
          quarter,
          status,
          key_results (current_value, target_value, status)
        `)
        .eq('organization_id', organizationId);

      if (type === 'organizational') {
        setSelectedPeriod('OKRs Organizacionales');
        query = query
          .is('phase', null)
          .not('quarter', 'ilike', 'Semana%');
      } else {
        setSelectedPeriod('OKRs Semanales Anteriores');
        
        if (user?.id) {
          query = query
            .eq('owner_user_id', user.id)
            .ilike('quarter', 'Semana%')
            .order('created_at', { ascending: false })
            .limit(20);
        }
      }

      const { data: objectivesData, error: objError } = await query;

      if (objError) throw objError;

      const summaries: ObjectiveSummary[] = (objectivesData || []).map((obj: { 
        id: string; 
        title: string; 
        quarter: string;
        key_results?: Array<{ 
          current_value?: number; 
          target_value?: number 
        }> 
      }) => {
        const keyResults = obj.key_results || [];
        const totalKRs = keyResults.length;
        const achievedKRs = keyResults.filter((kr) => {
          const current = kr.current_value || 0;
          const target = kr.target_value || 1;
          return current >= target;
        }).length;

        const avgProgress = totalKRs > 0
          ? Math.round(keyResults.reduce((sum: number, kr) => {
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
          quarter: obj.quarter,
          final_progress: avgProgress,
          status,
          key_results_achieved: achievedKRs,
          key_results_total: totalKRs,
        };
      });

      setObjectives(summaries);

      // Check which objectives have retrospectives
      const objIds = summaries.map(s => s.id);
      if (objIds.length > 0) {
        const { data: retros } = await supabase
          .from('okr_retrospectives')
          .select('objective_id')
          .in('objective_id', objIds);

        const retroMap: Record<string, boolean> = {};
        (retros || []).forEach((r: { objective_id: string }) => {
          retroMap[r.objective_id] = true;
        });
        setExistingRetros(retroMap);
      }

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
  };

  useEffect(() => {
    fetchRetrospective();
  }, [organizationId, user?.id, type]);

  const openRetroModal = async (obj: ObjectiveSummary) => {
    setSelectedObjective(obj);
    
    // Load existing retro if any
    const { data: existing } = await supabase
      .from('okr_retrospectives')
      .select('*')
      .eq('objective_id', obj.id)
      .maybeSingle();

    if (existing) {
      setRetroData({
        what_went_well: existing.what_went_well || [''],
        what_to_improve: existing.what_to_improve || [''],
        lessons_learned: existing.lessons_learned || '',
        satisfaction_rating: existing.satisfaction_rating || 3
      });
    } else {
      setRetroData({
        what_went_well: [''],
        what_to_improve: [''],
        lessons_learned: '',
        satisfaction_rating: 3
      });
    }
    
    setShowRetroModal(true);
  };

  const handleSaveRetro = async () => {
    if (!selectedObjective || !organizationId || !user?.id) return;

    setSaving(true);
    try {
      const retroPayload = {
        objective_id: selectedObjective.id,
        organization_id: organizationId,
        user_id: user.id,
        what_went_well: retroData.what_went_well.filter(w => w.trim()),
        what_to_improve: retroData.what_to_improve.filter(w => w.trim()),
        lessons_learned: retroData.lessons_learned,
        satisfaction_rating: retroData.satisfaction_rating,
        final_progress: selectedObjective.final_progress,
        krs_achieved: selectedObjective.key_results_achieved,
        krs_total: selectedObjective.key_results_total
      };

      // Upsert
      const { error } = await supabase
        .from('okr_retrospectives')
        .upsert(retroPayload, {
          onConflict: 'objective_id',
          ignoreDuplicates: false
        });

      if (error) throw error;

      toast.success('Retrospectiva guardada correctamente');
      setShowRetroModal(false);
      setExistingRetros(prev => ({ ...prev, [selectedObjective.id]: true }));
    } catch (err) {
      console.error('Error saving retro:', err);
      toast.error('Error al guardar retrospectiva');
    } finally {
      setSaving(false);
    }
  };

  const addItem = (field: 'what_went_well' | 'what_to_improve') => {
    setRetroData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const updateItem = (field: 'what_went_well' | 'what_to_improve', index: number, value: string) => {
    setRetroData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const removeItem = (field: 'what_went_well' | 'what_to_improve', index: number) => {
    setRetroData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

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

  // Use demo data if enabled and no real data
  const displayObjectives = (objectives.length === 0 && showDemoData) ? DEMO_OBJECTIVES : objectives;
  const displayStats = (objectives.length === 0 && showDemoData) ? DEMO_STATS : stats;
  const isDemo = objectives.length === 0 && showDemoData;

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
                  <CardTitle className="text-base">¿Qué es la Retrospectiva?</CardTitle>
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform ${showExplanation ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 text-sm text-muted-foreground space-y-2">
              <p><strong className="text-foreground">Reflexión estructurada</strong> sobre tus OKRs completados.</p>
              <p>La retrospectiva te permite:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Qué funcionó:</strong> Identificar prácticas exitosas</li>
                <li><strong>Qué mejorar:</strong> Detectar obstáculos y áreas de mejora</li>
                <li><strong>Lecciones aprendidas:</strong> Documentar aprendizajes clave</li>
                <li><strong>Satisfacción:</strong> Evaluar cómo te sientes con el resultado</li>
              </ul>
              <p className="text-primary">💡 Haz retrospectiva al final de cada ciclo para mejorar continuamente.</p>
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
            Datos de ejemplo. Completa OKRs para hacer retrospectivas reales.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">
            Retrospectiva de OKRs {type === 'weekly' ? 'Semanales' : 'Organizacionales'}
          </h2>
          <p className="text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {selectedPeriod}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRetrospective} disabled={isDemo}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      {displayStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Target className="h-4 w-4" />
                <span className="text-sm">Progreso General</span>
              </div>
              <p className="text-3xl font-bold text-primary">{displayStats.average_progress}%</p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Logrados</span>
              </div>
              <p className="text-3xl font-bold text-emerald-600">{displayStats.achieved}</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Parciales</span>
              </div>
              <p className="text-3xl font-bold text-amber-600">{displayStats.partial}</p>
            </CardContent>
          </Card>
          <Card className="bg-rose-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-rose-600 mb-1">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">No Logrados</span>
              </div>
              <p className="text-3xl font-bold text-rose-600">{displayStats.missed}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Objectives Summary */}
      {displayObjectives.length === 0 && !isDemo ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              {type === 'organizational' 
                ? 'No hay OKRs organizacionales'
                : 'No hay OKRs semanales anteriores'}
            </p>
            <p className="text-sm text-muted-foreground">
              Las retrospectivas te ayudan a aprender de cada ciclo de OKRs
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {displayObjectives.map((obj) => {
            const config = statusConfig[obj.status];
            const StatusIcon = config.icon;
            const hasRetro = existingRetros[obj.id];

            return (
              <Card key={obj.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg">{obj.title}</CardTitle>
                        {type === 'weekly' && (
                          <Badge variant="secondary" className="text-xs">
                            {obj.quarter}
                          </Badge>
                        )}
                        {hasRetro && (
                          <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500">
                            <FileText className="h-3 w-3 mr-1" />
                            Retrospectiva
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {obj.key_results_achieved}/{obj.key_results_total} Key Results completados
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={config.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant={hasRetro ? "outline" : "default"}
                        onClick={() => openRetroModal(obj)}
                      >
                        {hasRetro ? 'Ver/Editar' : 'Añadir'} Retro
                      </Button>
                    </div>
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

      {/* Lessons Learned Summary */}
      {stats && stats.total_objectives > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Resumen del {type === 'weekly' ? 'Período' : 'Ciclo'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-emerald-500/10">
                <h4 className="font-medium text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Éxitos a Celebrar
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {stats.achieved > 0 && (
                    <li>• {stats.achieved} objetivo(s) completamente logrado(s)</li>
                  )}
                  {stats.average_progress >= 70 && (
                    <li>• Progreso general por encima del 70%</li>
                  )}
                  {stats.achieved + stats.partial > 0 && (
                    <li>• {stats.achieved + stats.partial} objetivos con progreso significativo</li>
                  )}
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-amber-500/10">
                <h4 className="font-medium text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Áreas de Mejora
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {stats.missed > 0 && (
                    <li>• Revisar {stats.missed} objetivo(s) no alcanzado(s)</li>
                  )}
                  {stats.average_progress < 70 && (
                    <li>• Mejorar seguimiento semanal de KRs</li>
                  )}
                  <li>• Documentar aprendizajes en retrospectivas</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Retro Modal */}
      <Dialog open={showRetroModal} onOpenChange={setShowRetroModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Retrospectiva: {selectedObjective?.title}</DialogTitle>
            <DialogDescription>
              Documenta lo aprendido de este OKR para mejorar en el futuro
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Satisfaction Rating */}
            <div className="space-y-2">
              <Label>¿Qué tan satisfecho/a estás con el resultado?</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    variant={retroData.satisfaction_rating === rating ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setRetroData(prev => ({ ...prev, satisfaction_rating: rating }))}
                  >
                    <Star className={`h-4 w-4 ${retroData.satisfaction_rating >= rating ? 'fill-current' : ''}`} />
                  </Button>
                ))}
              </div>
            </div>

            {/* What Went Well */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-emerald-600" />
                ¿Qué funcionó bien?
              </Label>
              {retroData.what_went_well.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    value={item}
                    onChange={(e) => updateItem('what_went_well', index, e.target.value)}
                    placeholder="Algo que funcionó bien..."
                    rows={2}
                    className="flex-1"
                  />
                  {retroData.what_went_well.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeItem('what_went_well', index)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addItem('what_went_well')}>
                + Añadir otro
              </Button>
            </div>

            {/* What to Improve */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ThumbsDown className="h-4 w-4 text-amber-600" />
                ¿Qué se puede mejorar?
              </Label>
              {retroData.what_to_improve.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    value={item}
                    onChange={(e) => updateItem('what_to_improve', index, e.target.value)}
                    placeholder="Algo a mejorar..."
                    rows={2}
                    className="flex-1"
                  />
                  {retroData.what_to_improve.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeItem('what_to_improve', index)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addItem('what_to_improve')}>
                + Añadir otro
              </Button>
            </div>

            {/* Lessons Learned */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                Lecciones aprendidas
              </Label>
              <Textarea
                value={retroData.lessons_learned}
                onChange={(e) => setRetroData(prev => ({ ...prev, lessons_learned: e.target.value }))}
                placeholder="¿Qué aprendiste que aplicarás en el futuro?"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRetroModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRetro} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Retrospectiva'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
