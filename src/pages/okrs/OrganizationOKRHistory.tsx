import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Building2, 
  Calendar,
  TrendingUp,
  CheckCircle2,
  Target,
  History,
  RefreshCw,
  CalendarDays,
  Link2,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { PhaseTimeline } from '@/components/phases/PhaseTimeline';
import { OKRQuarterlyView } from '@/components/enterprise/OKRQuarterlyView';
import { OKRCheckInForm } from '@/components/enterprise/OKRCheckInForm';
import { OKRDependencyMap } from '@/components/enterprise/OKRDependencyMap';
import { OKRRetrospective } from '@/components/enterprise/OKRRetrospective';

interface KeyResult {
  id: string;
  title: string;
  current_value: number;
  target_value: number;
  start_value: number;
  unit: string;
  status: string;
  weight?: number;
}

interface Objective {
  id: string;
  title: string;
  description: string;
  quarter: string;
  year: number;
  status: string;
  target_date: string | null;
  created_at: string;
  progress: number;
  key_results: KeyResult[];
}

const OrganizationOKRHistory = () => {
  const { user, currentOrganizationId } = useAuth();
  const navigate = useNavigate();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('historial');

  useEffect(() => {
    if (user && currentOrganizationId) {
      fetchOrganizationOKRHistory();
    }
  }, [user, currentOrganizationId]);

  const fetchOrganizationOKRHistory = async () => {
    setLoading(true);
    try {
      if (!currentOrganizationId) {
        setLoading(false);
        return;
      }

      // Obtener todos los OKRs organizacionales (histórico completo)
      const { data: objectivesData, error: objError } = await supabase
        .from('objectives')
        .select('*')
        .eq('organization_id', currentOrganizationId)
        .is('phase', null)
        .order('created_at', { ascending: false });

      if (objError) throw objError;

      // Batch query para todos los key_results
      const objectiveIds = (objectivesData || []).map(obj => obj.id);
      const { data: allKeyResults } = await supabase
        .from('key_results')
        .select('*')
        .in('objective_id', objectiveIds);

      // Crear Map para lookup rápido
      const krsMap = new Map<string, KeyResult[]>();
      (allKeyResults || []).forEach((kr: KeyResult & { objective_id: string }) => {
        const existing = krsMap.get(kr.objective_id) || [];
        krsMap.set(kr.objective_id, [...existing, kr]);
      });

      const objectivesWithKRs = (objectivesData || []).map(obj => {
        const krs = krsMap.get(obj.id) || [];
        const krsWithProgress = krs.map(kr => {
          const progress = calculateKRProgress(kr);
          return {
            ...kr,
            progress
          };
        });

        const totalWeight = krsWithProgress.reduce((sum, kr) => sum + (kr.weight || 1), 0);
        const weightedProgress = krsWithProgress.reduce(
          (sum, kr) => sum + ((kr as KeyResult & { progress: number }).progress * (kr.weight || 1)),
          0
        );
        const objectiveProgress = totalWeight > 0 ? weightedProgress / totalWeight : 0;

        return {
          ...obj,
          key_results: krsWithProgress,
          progress: objectiveProgress
        };
      });

      setObjectives(objectivesWithKRs);
    } catch (error: unknown) {
      console.error('Error fetching organization OKR history:', error);
      const message = error instanceof Error ? error.message : 'Error al cargar el historial';
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
      case 'completed':
      case 'achieved':
        return 'bg-success text-success-foreground';
      case 'active':
      case 'on_track':
        return 'bg-primary text-primary-foreground';
      case 'at_risk':
        return 'bg-warning text-warning-foreground';
      case 'cancelled':
      case 'behind':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      active: 'Activo',
      completed: 'Completado',
      cancelled: 'Cancelado',
      at_risk: 'En riesgo',
      achieved: 'Logrado',
      on_track: 'En camino',
      behind: 'Atrasado'
    };
    return statusMap[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <RefreshCw className="w-12 h-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Cargando historial...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background pb-20 md:pb-0">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <History className="w-6 h-6 md:w-8 md:h-8 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
                OKRs Organizacionales
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground truncate">
                Gestión estratégica de la empresa
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/okrs/organization')}
            className="gap-1 md:gap-2 h-8 md:h-9 px-2 md:px-3 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden md:inline">Volver</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tabs sin "Semanales" ya que OKRs organizacionales no son semanales */}
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-muted/50">
            <TabsTrigger value="historial" className="gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Historial</span>
            </TabsTrigger>
            <TabsTrigger value="trimestral" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Trimestral</span>
            </TabsTrigger>
            <TabsTrigger value="checkin" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Check-in</span>
            </TabsTrigger>
            <TabsTrigger value="dependencias" className="gap-2">
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline">Dependencias</span>
            </TabsTrigger>
            <TabsTrigger value="retrospectiva" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Retrospectiva</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Historial */}
          <TabsContent value="historial" className="space-y-6">
            {/* Progreso General */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Progreso General</h2>
                  <p className="text-sm text-muted-foreground">Fases, objetivos y tareas del negocio</p>
                </div>
              </div>
              <PhaseTimeline />
            </div>

            {/* Historial de OKRs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Historial Completo</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {objectives.length} objetivo(s) organizacional(es)
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchOrganizationOKRHistory}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Actualizar
                </Button>
              </div>

              {objectives.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <History className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No hay OKRs organizacionales</h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      El historial de OKRs organizacionales aparecerá aquí una vez que se generen durante el onboarding.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {objectives.map((objective) => (
                    <Card key={objective.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <CardTitle className="text-xl">{objective.title}</CardTitle>
                              <Badge className={getStatusColor(objective.status)}>
                                {getStatusText(objective.status)}
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <Building2 className="w-3 h-3" />
                                Organizacional
                              </Badge>
                            </div>
                            {objective.description && (
                              <CardDescription>{objective.description}</CardDescription>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Creado: {formatDate(objective.created_at)}
                              </span>
                              {objective.target_date && (
                                <span className="flex items-center gap-1">
                                  <Target className="w-4 h-4" />
                                  Meta: {formatDate(objective.target_date)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-3xl font-bold text-primary">
                              {Math.round(objective.progress)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Progreso</div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <Progress value={objective.progress} className="h-2" />
                        </div>
                      </CardHeader>

                      <CardContent>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Key Results ({objective.key_results.length})
                        </h4>
                        <div className="space-y-2">
                          {objective.key_results.map((kr) => (
                            <div key={kr.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{kr.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Progress value={calculateKRProgress(kr)} className="h-1.5 flex-1 max-w-[200px]" />
                                  <span className="text-xs text-muted-foreground">
                                    {kr.current_value} / {kr.target_value} {kr.unit}
                                  </span>
                                </div>
                              </div>
                              <Badge variant="secondary" className={getStatusColor(kr.status)}>
                                {getStatusText(kr.status)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab: Trimestral */}
          <TabsContent value="trimestral">
            <OKRQuarterlyView />
          </TabsContent>

          {/* Tab: Check-in */}
          <TabsContent value="checkin">
            <OKRCheckInForm />
          </TabsContent>

          {/* Tab: Dependencias */}
          <TabsContent value="dependencias">
            <OKRDependencyMap type="organizational" />
          </TabsContent>

          {/* Tab: Retrospectiva */}
          <TabsContent value="retrospectiva">
            <OKRRetrospective type="organizational" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default OrganizationOKRHistory;
