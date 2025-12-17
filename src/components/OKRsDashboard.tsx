import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  RefreshCw,
  Calendar,
  BarChart3,
  Sparkles,
  Edit,
  Lock,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { OKRProgressModal } from './OKRProgressModal';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { useBackendValidation } from '@/hooks/useBackendValidation';
import { useWeeklyOKRGeneration } from '@/hooks/useWeeklyOKRGeneration';
import { UpgradeModal } from '@/components/UpgradeModal';
import { logger } from '@/lib/logger';
import { handleError } from '@/utils/errorHandler';
import { OKRPlaybook } from './okrs/OKRPlaybook';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PlaybookData {
  title: string;
  description: string;
  steps: string[];
  tips: string[];
  resources?: string[];
  daily_focus?: string[];
}

interface KeyResultDB {
  id: string;
  title: string;
  description: string;
  metric_type: string;
  start_value: number;
  target_value: number;
  current_value: number;
  unit: string;
  status: string;
  weight: number;
}

interface KeyResult extends KeyResultDB {
  status: 'on_track' | 'at_risk' | 'behind' | 'achieved';
  progress: number;
}

interface Objective {
  id: string;
  title: string;
  description: string;
  quarter: string;
  year: number;
  status: 'active' | 'completed' | 'cancelled' | 'at_risk';
  target_date: string;
  owner_name: string;
  progress: number;
  key_results: KeyResult[];
  total_key_results: number;
  achieved_krs: number;
  on_track_krs: number;
  at_risk_krs: number;
  behind_krs: number;
  playbook?: PlaybookData | null;
}

const OKRsDashboard = () => {
  const { user, userProfile, currentOrganizationId } = useAuth();
  const { canAddOkr, plan, okrCount, limits } = useSubscriptionLimits();
  const { canAddOkr: validateOkrBackend, validating } = useBackendValidation();
  const weeklyOKR = useWeeklyOKRGeneration();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState<string>('');
  const [generatingWithAI, setGeneratingWithAI] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedKR, setSelectedKR] = useState<{
    id: string;
    title: string;
    currentValue: number;
    targetValue: number;
    unit: string;
  } | null>(null);

  useEffect(() => {
    fetchWeekStart();
  }, []);

  useEffect(() => {
    if (currentWeekStart) {
      fetchOKRs();
    }
  }, [currentWeekStart]);

  const fetchWeekStart = async () => {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('week_start')
        .single();

      if (error) throw error;
      if (data) {
        setCurrentWeekStart(new Date(data.week_start).toISOString().split('T')[0]);
      }
    } catch (error) {
      logger.error('Error fetching week start:', error);
    }
  };

  const fetchOKRs = async () => {
    setLoading(true);
    try {
      // MULTI-TENANCY: Filter by organization_id
      let query = supabase
        .from('objectives')
        .select('*, playbook')
        .eq('owner_user_id', user?.id)
        .ilike('quarter', `%${currentWeekStart}%`);

      if (currentOrganizationId) {
        query = query.eq('organization_id', currentOrganizationId);
      }

      const { data: objectivesData, error: objError } = await query.order('created_at', { ascending: false });

      if (objError) throw objError;

      const objectivesWithKRs = await Promise.all(
        (objectivesData || []).map(async (obj) => {
          const { data: krs } = await supabase
            .from('key_results')
            .select('*')
            .eq('objective_id', obj.id);

          const krsWithProgress = (krs || []).map(kr => {
            const progress = calculateKRProgress(kr);
            return {
              ...kr,
              status: kr.status as 'on_track' | 'at_risk' | 'behind' | 'achieved',
              progress
            };
          });

          const { data: ownerData } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', obj.owner_user_id)
            .single();

          const totalWeight = krsWithProgress.reduce((sum, kr) => sum + (kr.weight || 1), 0);
          const weightedProgress = krsWithProgress.reduce(
            (sum, kr) => sum + (kr.progress * (kr.weight || 1)),
            0
          );
          const objectiveProgress = totalWeight > 0 ? weightedProgress / totalWeight : 0;

          const achieved_krs = krsWithProgress.filter(kr => kr.status === 'achieved').length;
          const on_track_krs = krsWithProgress.filter(kr => kr.status === 'on_track').length;
          const at_risk_krs = krsWithProgress.filter(kr => kr.status === 'at_risk').length;
          const behind_krs = krsWithProgress.filter(kr => kr.status === 'behind').length;

          return {
            id: obj.id,
            title: obj.title,
            description: obj.description,
            quarter: obj.quarter,
            year: obj.year,
            status: obj.status as 'active' | 'completed' | 'cancelled' | 'at_risk',
            target_date: obj.target_date,
            owner_name: ownerData?.full_name || 'Usuario',
            progress: objectiveProgress,
            key_results: krsWithProgress,
            total_key_results: krsWithProgress.length,
            achieved_krs,
            on_track_krs,
            at_risk_krs,
            behind_krs,
            playbook: obj.playbook ? (obj.playbook as unknown as PlaybookData) : null
          };
        })
      );

      setObjectives(objectivesWithKRs);
    } catch (error) {
      handleError(error, 'Error al cargar OKRs');
    } finally {
      setLoading(false);
    }
  };

  const calculateKRProgress = (kr: KeyResultDB) => {
    if (kr.target_value === kr.start_value) return 0;
    const progress = ((kr.current_value - kr.start_value) / (kr.target_value - kr.start_value)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'achieved':
        return 'bg-success text-success-foreground';
      case 'on_track':
        return 'bg-primary text-primary-foreground';
      case 'at_risk':
        return 'bg-warning text-warning-foreground';
      case 'behind':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'achieved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'on_track':
        return <TrendingUp className="w-4 h-4" />;
      case 'at_risk':
      case 'behind':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'achieved':
        return 'Logrado';
      case 'on_track':
        return 'En camino';
      case 'at_risk':
        return 'En riesgo';
      case 'behind':
        return 'Atrasado';
      default:
        return status;
    }
  };

  const calculateDaysRemaining = (targetDate: string) => {
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleGenerateWeeklyOKR = async () => {
    // Validación de límite semanal (1 generación por semana)
    if (!weeklyOKR.canGenerate) {
      toast.error(weeklyOKR.getBlockedMessage());
      return;
    }

    // Validación frontend de plan (rápida)
    const { allowed } = canAddOkr();
    if (!allowed) {
      setShowUpgradeModal(true);
      return;
    }

    // Validación backend (segura)
    const backendValidation = await validateOkrBackend();
    if (!backendValidation.allowed) {
      toast.error(backendValidation.message || 'Has alcanzado el límite de OKRs de tu plan');
      setShowUpgradeModal(true);
      return;
    }

    setGeneratingWithAI(true);
    try {
      const { data: aiResult, error: aiError } = await supabase.functions.invoke('generate-personalized-krs', {
        body: { userId: user?.id }
      });

      if (aiError) throw aiError;
      
      if (aiResult.error) {
        throw new Error(aiResult.error);
      }

      toast.success(`✨ OKR semanal generado con ${aiResult.count} Key Results`);
      fetchOKRs();
      // Actualizar el estado del hook
      weeklyOKR.refreshStatus();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al generar OKR semanal';
      logger.error('Error generating weekly OKR:', error);
      if (errorMessage.includes('429')) {
        toast.error('Límite de IA alcanzado. Intenta en unos minutos.');
      } else if (errorMessage.includes('402')) {
        toast.error('Créditos de IA agotados. Contacta al administrador.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setGeneratingWithAI(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Cargando OKRs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">OKRs Semanales Personalizados</h2>
          <p className="text-muted-foreground">
            Semana actual: {currentWeekStart}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOKRs}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    size="sm"
                    onClick={handleGenerateWeeklyOKR}
                    disabled={generatingWithAI || weeklyOKR.loading || !weeklyOKR.canGenerate}
                    className="gap-2"
                  >
                    {!weeklyOKR.canGenerate ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {generatingWithAI 
                      ? 'Generando...' 
                      : weeklyOKR.canRegenerateEnterprise 
                        ? 'Regenerar OKRs (Enterprise)'
                        : weeklyOKR.hasGeneratedThisWeek 
                          ? 'OKRs Generados'
                          : 'Generar OKR Semanal con IA'}
                  </Button>
                </div>
              </TooltipTrigger>
              {!weeklyOKR.canGenerate && (
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-sm">{weeklyOKR.getBlockedMessage()}</p>
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Info de límite semanal */}
      {weeklyOKR.hasGeneratedThisWeek && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
          <Info className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {weeklyOKR.plan === 'enterprise' ? (
              weeklyOKR.allOKRsCompleted ? (
                <span className="text-primary font-medium">
                  ¡Completaste todos tus OKRs! Puedes generar nuevos esta semana.
                </span>
              ) : (
                <>Completa todos tus OKRs para poder generar nuevos esta semana <Badge variant="outline" className="ml-1">Enterprise</Badge></>
              )
            ) : (
              <>1 generación por semana. Próxima generación disponible la siguiente semana.</>
            )}
          </p>
        </div>
      )}

      {objectives.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Objetivos Activos
              </CardDescription>
              <CardTitle className="text-3xl">
                {objectives.filter(o => o.status === 'active').length}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Progreso Promedio
              </CardDescription>
              <CardTitle className="text-3xl text-primary">
                {Math.round(
                  objectives.reduce((sum, obj) => sum + obj.progress, 0) / objectives.length
                )}%
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                KRs Logrados
              </CardDescription>
              <CardTitle className="text-3xl text-success">
                {objectives.reduce((sum, obj) => sum + obj.achieved_krs, 0)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {objectives.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Sparkles className="w-16 h-16 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">¡Genera tu OKR semanal con IA!</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              La IA analizará tus tareas de esta semana y creará un objetivo con Key Results personalizados para ti.
            </p>
            <Button onClick={handleGenerateWeeklyOKR} disabled={generatingWithAI} className="gap-2">
              <Sparkles className="w-4 h-4" />
              {generatingWithAI ? 'Generando con IA...' : 'Generar Mi OKR Semanal'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {objectives.map((objective) => (
            <Card key={objective.id} className="border-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-2xl">{objective.title}</CardTitle>
                      <Badge variant="outline" className="gap-1">
                        <Sparkles className="w-3 h-3" />
                        Generado por IA
                      </Badge>
                    </div>
                    {objective.description && (
                      <CardDescription className="text-base">
                        {objective.description}
                      </CardDescription>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="text-4xl font-bold text-primary">
                        {Math.round(objective.progress)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Progreso</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Progress value={objective.progress} className="h-3" />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {calculateDaysRemaining(objective.target_date)} días restantes
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {objective.achieved_krs} logrados
                      </Badge>
                      {objective.at_risk_krs > 0 && (
                        <Badge variant="outline" className="gap-1 text-warning">
                          <AlertTriangle className="w-3 h-3" />
                          {objective.at_risk_krs} en riesgo
                        </Badge>
                      )}
                      {objective.behind_krs > 0 && (
                        <Badge variant="outline" className="gap-1 text-destructive">
                          <AlertTriangle className="w-3 h-3" />
                          {objective.behind_krs} atrasados
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Key Results ({objective.key_results.length})
                </h4>

                {objective.key_results.map((kr) => (
                  <Card key={kr.id} className="bg-muted/50">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-medium">{kr.title}</h5>
                            </div>
                            {kr.description && (
                              <p className="text-sm text-muted-foreground">{kr.description}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedKR({
                                id: kr.id,
                                title: kr.title,
                                currentValue: kr.current_value,
                                targetValue: kr.target_value,
                                unit: kr.unit
                              })}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Dejar Resultados
                            </Button>

                            <div className="text-right">
                            <div className="text-2xl font-bold">
                              {kr.current_value}
                              {kr.unit && <span className="text-sm font-normal text-muted-foreground"> {kr.unit}</span>}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              de {kr.target_value} {kr.unit}
                             </div>
                           </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Inicio: {kr.start_value} {kr.unit}
                            </span>
                            <span className="font-medium">{Math.round(kr.progress)}%</span>
                          </div>
                          <Progress 
                            value={kr.progress} 
                            className={`h-2 ${
                              kr.status === 'achieved' ? '[&>div]:bg-success' :
                              kr.status === 'on_track' ? '[&>div]:bg-primary' :
                              kr.status === 'at_risk' ? '[&>div]:bg-warning' :
                              '[&>div]:bg-destructive'
                            }`}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Playbook del OKR */}
                {objective.playbook && (
                  <OKRPlaybook 
                    playbook={objective.playbook} 
                    objectiveTitle={objective.title}
                    className="mt-4"
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de actualización de progreso */}
      {selectedKR && (
        <OKRProgressModal
          isOpen={!!selectedKR}
          onClose={() => setSelectedKR(null)}
          keyResultId={selectedKR.id}
          keyResultTitle={selectedKR.title}
          currentValue={selectedKR.currentValue}
          targetValue={selectedKR.targetValue}
          unit={selectedKR.unit}
          onProgressUpdated={() => {
            fetchOKRs();
            setSelectedKR(null);
          }}
        />
      )}

      {/* Modal de upgrade */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentPlan={plan}
        limitType="okrs"
        currentValue={okrCount}
        limitValue={limits.max_objectives}
      />
    </div>
  );
};

export default OKRsDashboard;
