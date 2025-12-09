import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  RefreshCw,
  Calendar,
  BarChart3,
  ArrowLeft,
  Building2,
  History
} from 'lucide-react';
import { toast } from 'sonner';
import { OKRProgressModal } from '@/components/OKRProgressModal';

interface KeyResult {
  id: string;
  title: string;
  description: string;
  metric_type: string;
  start_value: number;
  target_value: number;
  current_value: number;
  unit: string;
  status: 'on_track' | 'at_risk' | 'behind' | 'achieved';
  weight: number;
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
}

const OrganizationOKRs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKR, setSelectedKR] = useState<{
    id: string;
    title: string;
    currentValue: number;
    targetValue: number;
    unit: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrganizationOKRs();
    }
  }, [user]);

  const fetchOrganizationOKRs = async () => {
    setLoading(true);
    try {
      // Obtener la organización del usuario desde user_roles
      const { data: userRoleData, error: userRoleError } = await supabase
        .from('user_roles')
        .select('organization_id')
        .eq('user_id', user?.id)
        .single();

      if (userRoleError) throw userRoleError;

      // Obtener OKRs organizacionales (no tienen owner_user_id o tienen phase)
      const { data: objectivesData, error: objError } = await supabase
        .from('objectives')
        .select('*')
        .eq('organization_id', userRoleData.organization_id)
        .is('phase', null) // Solo OKRs organizacionales (sin phase)
        .order('created_at', { ascending: false });

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
            owner_name: ownerData?.full_name || 'Organización',
            progress: objectiveProgress,
            key_results: krsWithProgress,
            total_key_results: krsWithProgress.length,
            achieved_krs,
            on_track_krs,
            at_risk_krs,
            behind_krs
          };
        })
      );

      setObjectives(objectivesWithKRs);
    } catch (error: unknown) {
      console.error('Error fetching organization OKRs:', error);
      const message = error instanceof Error ? error.message : 'Error al cargar OKRs organizacionales';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const calculateKRProgress = (kr: { target_value: number; start_value: number; current_value: number }) => {
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

  const calculateDaysRemaining = (targetDate: string | null) => {
    if (!targetDate) return null;
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <RefreshCw className="w-12 h-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Cargando OKRs organizacionales...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background pb-20 md:pb-0">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <Building2 className="w-6 h-6 md:w-8 md:h-8 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
                OKRs Organizacionales
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground truncate">
                Objetivos estratégicos de la empresa
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/okrs/organization/history')}
              className="gap-1 md:gap-2 h-8 md:h-9 text-xs md:text-sm"
            >
              <History className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden md:inline">Historial OKRs</span>
              <span className="md:hidden">Historial</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/okrs')}
              className="gap-1 md:gap-2 h-8 md:h-9 text-xs md:text-sm"
            >
              <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden md:inline">Volver</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-7xl">
        <div className="space-y-6">
          {/* Header con refresh */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">OKRs Estratégicos</h2>
              <p className="text-muted-foreground">
                Generados automáticamente durante el onboarding basados en los objetivos del negocio
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrganizationOKRs}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </Button>
          </div>

          {/* Mensaje explicativo */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">¿Qué son los OKRs Organizacionales?</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Estos son los <strong>objetivos estratégicos de toda la empresa</strong>, generados automáticamente 
                      por IA durante el proceso de onboarding basándose en:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      <li>• Objetivos principales del negocio</li>
                      <li>• Industria y mercado objetivo</li>
                      <li>• Retos actuales de la empresa</li>
                      <li>• Propuesta de valor y ventajas competitivas</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2">
                      💡 Estos OKRs son de <strong>largo plazo</strong> (trimestral/anual) y guían la estrategia 
                      general, a diferencia de los OKRs semanales personales que son tácticos.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPIs Summary */}
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
                    {objectives.length > 0 
                      ? Math.round(objectives.reduce((sum, obj) => sum + obj.progress, 0) / objectives.length)
                      : 0}%
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

          {/* OKRs List */}
          {objectives.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Building2 className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No hay OKRs organizacionales</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Los OKRs organizacionales se generan automáticamente durante el onboarding. 
                  Si no ves ninguno, contacta al administrador.
                </p>
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
                          <Badge variant="secondary" className="gap-1">
                            <Building2 className="w-3 h-3" />
                            Organizacional
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
                          {objective.target_date && calculateDaysRemaining(objective.target_date) && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {calculateDaysRemaining(objective.target_date)} días restantes
                            </span>
                          )}
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
                                <Badge className={getStatusColor(kr.status)}>
                                  {getStatusIcon(kr.status)}
                                  <span className="ml-1">{getStatusText(kr.status)}</span>
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Progreso</span>
                                <span className="font-semibold">
                                  {kr.current_value} / {kr.target_value} {kr.unit}
                                </span>
                              </div>
                              <Progress value={kr.progress} className="h-2" />
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{Math.round(kr.progress)}% completado</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs"
                                  onClick={() => setSelectedKR({
                                    id: kr.id,
                                    title: kr.title,
                                    currentValue: kr.current_value,
                                    targetValue: kr.target_value,
                                    unit: kr.unit
                                  })}
                                >
                                  Actualizar progreso
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal para actualizar progreso */}
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
            setSelectedKR(null);
            fetchOrganizationOKRs();
          }}
        />
      )}
    </div>
  );
};

export default OrganizationOKRs;
