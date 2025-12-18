import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  RotateCcw,
  Eye
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

// Datos demo para el historial
const DEMO_OBJECTIVES: Objective[] = [
  {
    id: 'demo-1',
    title: 'Incrementar ingresos recurrentes mensuales (MRR)',
    description: 'Objetivo estratégico para aumentar la base de ingresos recurrentes de la empresa',
    quarter: 'Q1',
    year: 2024,
    status: 'active',
    target_date: '2024-03-31',
    created_at: '2024-01-01',
    progress: 75,
    key_results: [
      { id: 'kr-1', title: 'Aumentar MRR a €50,000', current_value: 37500, target_value: 50000, start_value: 25000, unit: '€', status: 'on_track', weight: 1 },
      { id: 'kr-2', title: 'Conseguir 20 nuevos clientes enterprise', current_value: 16, target_value: 20, start_value: 0, unit: 'clientes', status: 'on_track', weight: 1 },
      { id: 'kr-3', title: 'Reducir churn rate al 3%', current_value: 4.5, target_value: 3, start_value: 8, unit: '%', status: 'at_risk', weight: 1 }
    ]
  },
  {
    id: 'demo-2',
    title: 'Mejorar satisfacción y retención de clientes',
    description: 'Aumentar NPS y métricas de satisfacción del cliente',
    quarter: 'Q1',
    year: 2024,
    status: 'at_risk',
    target_date: '2024-03-31',
    created_at: '2024-01-01',
    progress: 58,
    key_results: [
      { id: 'kr-4', title: 'NPS score > 50', current_value: 42, target_value: 50, start_value: 30, unit: 'pts', status: 'at_risk', weight: 1 },
      { id: 'kr-5', title: 'Tiempo de respuesta soporte < 4h', current_value: 3.5, target_value: 4, start_value: 8, unit: 'horas', status: 'achieved', weight: 1 }
    ]
  },
  {
    id: 'demo-3',
    title: 'Optimizar eficiencia operativa',
    description: 'Reducir costes y mejorar procesos internos',
    quarter: 'Q1',
    year: 2024,
    status: 'completed',
    target_date: '2024-02-28',
    created_at: '2024-01-01',
    progress: 100,
    key_results: [
      { id: 'kr-6', title: 'Automatizar 5 procesos manuales', current_value: 5, target_value: 5, start_value: 0, unit: 'procesos', status: 'achieved', weight: 1 },
      { id: 'kr-7', title: 'Reducir costes operativos 15%', current_value: 18, target_value: 15, start_value: 0, unit: '%', status: 'achieved', weight: 1 }
    ]
  }
];

const OrganizationOKRHistory = () => {
  const { user, currentOrganizationId } = useAuth();
  const navigate = useNavigate();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('historial');
  const [showDemoData, setShowDemoData] = useState(true);

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

  // Determinar si mostrar demo data
  const hasRealData = objectives.length > 0;
  const displayObjectives = (showDemoData && !hasRealData) ? DEMO_OBJECTIVES : objectives;
  const isDemo = showDemoData && !hasRealData;

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
          <div className="flex items-center gap-2">
            {/* Toggle de datos demo */}
            <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-lg">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="okr-demo" className="text-xs text-muted-foreground hidden md:inline">
                Demo
              </Label>
              <Switch
                id="okr-demo"
                checked={showDemoData}
                onCheckedChange={setShowDemoData}
              />
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
            {/* Demo Alert */}
            {isDemo && (
              <Alert className="bg-primary/10 border-primary/30">
                <Eye className="h-4 w-4" />
                <AlertDescription className="flex items-center gap-2">
                  <Badge variant="secondary">DEMO</Badge>
                  Datos de ejemplo. Genera tus OKRs organizacionales para ver datos reales.
                </AlertDescription>
              </Alert>
            )}

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
                    {displayObjectives.length} objetivo(s) organizacional(es) {isDemo && '(demo)'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchOrganizationOKRHistory}
                  className="gap-2"
                  disabled={isDemo}
                >
                  <RefreshCw className="w-4 h-4" />
                  Actualizar
                </Button>
              </div>

              {displayObjectives.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <History className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No hay OKRs organizacionales</h3>
                    <p className="text-muted-foreground text-center max-w-md mb-4">
                      El historial de OKRs organizacionales aparecerá aquí una vez que se generen.
                    </p>
                    <Button variant="outline" onClick={() => setShowDemoData(true)} className="gap-2">
                      <Eye className="w-4 h-4" />
                      Ver datos demo
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {displayObjectives.map((objective) => (
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
            <OKRQuarterlyView showDemoData={showDemoData} />
          </TabsContent>

          {/* Tab: Check-in */}
          <TabsContent value="checkin">
            <OKRCheckInForm showDemoData={showDemoData} />
          </TabsContent>

          {/* Tab: Dependencias */}
          <TabsContent value="dependencias">
            <OKRDependencyMap type="organizational" showDemoData={showDemoData} />
          </TabsContent>

          {/* Tab: Retrospectiva */}
          <TabsContent value="retrospectiva">
            <OKRRetrospective type="organizational" showDemoData={showDemoData} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default OrganizationOKRHistory;
