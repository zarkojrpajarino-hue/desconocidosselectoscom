import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  History,
  Sparkles,
  Users,
  User,
  Loader2,
  Eye
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

interface ActivePhase {
  id: string;
  phase_number: number;
  phase_name: string;
  phase_description: string;
  progress_percentage: number;
  duration_weeks: number;
  status: string;
}

// Demo data for when no real data exists
const DEMO_OBJECTIVES: Objective[] = [
  {
    id: 'demo-obj-1',
    title: 'Aumentar ingresos recurrentes mensuales (MRR)',
    description: 'Incrementar el MRR para alcanzar sostenibilidad financiera',
    quarter: 'Q1',
    year: 2024,
    status: 'active',
    target_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    owner_name: 'Organización',
    progress: 68,
    key_results: [
      { id: 'demo-kr-1', title: 'Alcanzar €50,000 en MRR', description: '', metric_type: 'currency', start_value: 20000, target_value: 50000, current_value: 34000, unit: '€', status: 'on_track', weight: 1, progress: 47 },
      { id: 'demo-kr-2', title: 'Conseguir 25 nuevos clientes', description: '', metric_type: 'number', start_value: 0, target_value: 25, current_value: 18, unit: 'clientes', status: 'on_track', weight: 1, progress: 72 },
    ],
    total_key_results: 2,
    achieved_krs: 0,
    on_track_krs: 2,
    at_risk_krs: 0,
    behind_krs: 0,
  },
  {
    id: 'demo-obj-2',
    title: 'Mejorar satisfacción y retención de clientes',
    description: 'Reducir churn y aumentar NPS',
    quarter: 'Q1',
    year: 2024,
    status: 'at_risk',
    target_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    owner_name: 'Organización',
    progress: 42,
    key_results: [
      { id: 'demo-kr-3', title: 'NPS superior a 50', description: '', metric_type: 'number', start_value: 30, target_value: 50, current_value: 42, unit: 'puntos', status: 'at_risk', weight: 1, progress: 60 },
      { id: 'demo-kr-4', title: 'Reducir churn a menos del 5%', description: '', metric_type: 'percentage', start_value: 12, target_value: 5, current_value: 8, unit: '%', status: 'behind', weight: 1, progress: 57 },
    ],
    total_key_results: 2,
    achieved_krs: 0,
    on_track_krs: 0,
    at_risk_krs: 1,
    behind_krs: 1,
  },
  {
    id: 'demo-obj-3',
    title: 'Escalar operaciones y productividad',
    description: 'Automatizar procesos y mejorar eficiencia del equipo',
    quarter: 'Q1',
    year: 2024,
    status: 'active',
    target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    owner_name: 'Organización',
    progress: 85,
    key_results: [
      { id: 'demo-kr-5', title: 'Automatizar 5 procesos manuales', description: '', metric_type: 'number', start_value: 0, target_value: 5, current_value: 4, unit: 'procesos', status: 'on_track', weight: 1, progress: 80 },
      { id: 'demo-kr-6', title: 'Reducir tiempo de respuesta a 2 horas', description: '', metric_type: 'number', start_value: 24, target_value: 2, current_value: 4, unit: 'horas', status: 'achieved', weight: 1, progress: 91 },
    ],
    total_key_results: 2,
    achieved_krs: 1,
    on_track_krs: 1,
    at_risk_krs: 0,
    behind_krs: 0,
  },
];

const DEMO_PHASE: ActivePhase = {
  id: 'demo-phase',
  phase_number: 1,
  phase_name: 'Fase de Lanzamiento',
  phase_description: 'Establecer bases sólidas para el crecimiento',
  progress_percentage: 65,
  duration_weeks: 4,
  status: 'active',
};

const OrganizationOKRs = () => {
  const { user, currentOrganizationId } = useAuth();
  const navigate = useNavigate();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activePhase, setActivePhase] = useState<ActivePhase | null>(null);
  const [teamSize, setTeamSize] = useState(1);
  const [totalPhaseTasks, setTotalPhaseTasks] = useState(0);
  const [showDemoData, setShowDemoData] = useState(false);
  const [selectedKR, setSelectedKR] = useState<{
    id: string;
    title: string;
    currentValue: number;
    targetValue: number;
    unit: string;
  } | null>(null);

  const isIndividual = teamSize === 1;

  useEffect(() => {
    if (user && currentOrganizationId) {
      fetchActivePhase();
      fetchTeamSize();
    }
  }, [user, currentOrganizationId]);

  useEffect(() => {
    if (activePhase && currentOrganizationId) {
      fetchPhaseOKRs();
      fetchPhaseTasks();
    }
  }, [activePhase, currentOrganizationId]);

  const fetchActivePhase = async () => {
    try {
      const { data, error } = await supabase
        .from('business_phases')
        .select('*')
        .eq('organization_id', currentOrganizationId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setActivePhase({
          id: data.id,
          phase_number: data.phase_number,
          phase_name: data.phase_name,
          phase_description: data.phase_description || '',
          progress_percentage: data.progress_percentage || 0,
          duration_weeks: data.duration_weeks || 4,
          status: data.status || 'active'
        });
      }
    } catch (error) {
      console.error('Error fetching active phase:', error);
    }
  };

  const fetchTeamSize = async () => {
    try {
      const { count } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganizationId);

      setTeamSize(count || 1);
    } catch (error) {
      console.error('Error fetching team size:', error);
    }
  };

  const fetchPhaseTasks = async () => {
    if (!activePhase) return;
    try {
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganizationId)
        .eq('phase', activePhase.phase_number);

      setTotalPhaseTasks(count || 0);
    } catch (error) {
      console.error('Error fetching phase tasks:', error);
    }
  };

  const fetchPhaseOKRs = async () => {
    if (!activePhase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // OKRs organizacionales de la fase actual (phase = phaseNumber, owner_user_id IS NULL)
      const { data: objectivesData, error: objError } = await supabase
        .from('objectives')
        .select('*')
        .eq('organization_id', currentOrganizationId)
        .eq('phase', activePhase.phase_number)
        .is('owner_user_id', null)
        .order('created_at', { ascending: false });

      if (objError) throw objError;

      const objectiveIds = (objectivesData || []).map(obj => obj.id);
      
      if (objectiveIds.length === 0) {
        setObjectives([]);
        setLoading(false);
        return;
      }

      // Batch query para key_results
      const { data: allKeyResults } = await supabase
        .from('key_results')
        .select('*')
        .in('objective_id', objectiveIds);

      // Crear Map para lookup
      const krsMap = new Map<string, typeof allKeyResults>();
      (allKeyResults || []).forEach(kr => {
        const existing = krsMap.get(kr.objective_id) || [];
        krsMap.set(kr.objective_id, [...existing, kr]);
      });

      // Combinar datos
      const objectivesWithKRs = (objectivesData || []).map(obj => {
        const krs = krsMap.get(obj.id) || [];
        const krsWithProgress = krs.map(kr => {
          const progress = calculateKRProgress(kr);
          return {
            ...kr,
            status: kr.status as 'on_track' | 'at_risk' | 'behind' | 'achieved',
            progress
          };
        });

        const totalWeight = krsWithProgress.reduce((sum, kr) => sum + (kr.weight || 1), 0);
        const weightedProgress = krsWithProgress.reduce(
          (sum, kr) => sum + (kr.progress * (kr.weight || 1)),
          0
        );
        const objectiveProgress = totalWeight > 0 ? weightedProgress / totalWeight : 0;

        return {
          id: obj.id,
          title: obj.title,
          description: obj.description,
          quarter: obj.quarter,
          year: obj.year,
          status: obj.status as 'active' | 'completed' | 'cancelled' | 'at_risk',
          target_date: obj.target_date,
          owner_name: 'Organización',
          progress: objectiveProgress,
          key_results: krsWithProgress,
          total_key_results: krsWithProgress.length,
          achieved_krs: krsWithProgress.filter(kr => kr.status === 'achieved').length,
          on_track_krs: krsWithProgress.filter(kr => kr.status === 'on_track').length,
          at_risk_krs: krsWithProgress.filter(kr => kr.status === 'at_risk').length,
          behind_krs: krsWithProgress.filter(kr => kr.status === 'behind').length
        };
      });

      setObjectives(objectivesWithKRs);
    } catch (error) {
      console.error('Error fetching phase OKRs:', error);
      toast.error('Error al cargar OKRs de la fase');
    } finally {
      setLoading(false);
    }
  };

  const generatePhaseOKRs = async () => {
    if (!activePhase || !currentOrganizationId) {
      toast.error('No hay fase activa para generar OKRs');
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-organizational-okrs', {
        body: {
          organizationId: currentOrganizationId,
          phaseNumber: activePhase.phase_number
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message || 'OKRs organizacionales generados correctamente');
        fetchPhaseOKRs();
      } else {
        throw new Error(data?.error || 'Error al generar OKRs');
      }
    } catch (error) {
      console.error('Error generating OKRs:', error);
      toast.error(error instanceof Error ? error.message : 'Error al generar OKRs');
    } finally {
      setGenerating(false);
    }
  };

  const calculateKRProgress = (kr: { target_value: number; start_value: number; current_value: number }) => {
    if (kr.target_value === kr.start_value) return 0;
    const progress = ((kr.current_value - kr.start_value) / (kr.target_value - kr.start_value)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'achieved': return 'bg-success text-success-foreground';
      case 'on_track': return 'bg-primary text-primary-foreground';
      case 'at_risk': return 'bg-warning text-warning-foreground';
      case 'behind': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'achieved': return <CheckCircle2 className="w-4 h-4" />;
      case 'on_track': return <TrendingUp className="w-4 h-4" />;
      case 'at_risk':
      case 'behind': return <AlertTriangle className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'achieved': return 'Logrado';
      case 'on_track': return 'En camino';
      case 'at_risk': return 'En riesgo';
      case 'behind': return 'Atrasado';
      default: return status;
    }
  };

  const calculateDaysRemaining = (targetDate: string | null) => {
    if (!targetDate) return null;
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Use demo data if enabled and no real data
  const displayObjectives = (objectives.length === 0 && showDemoData) ? DEMO_OBJECTIVES : objectives;
  const displayPhase = (!activePhase && showDemoData) ? DEMO_PHASE : activePhase;
  const isDemo = objectives.length === 0 && showDemoData;
  const hasNoPhase = !loading && !activePhase;

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

  // No active phase - show explanation
  if (hasNoPhase && !showDemoData) {
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
                  Objetivos estratégicos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-2 mr-2 bg-muted/50 rounded-lg px-3 py-1.5">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="demo-okr-toggle" className="text-xs text-muted-foreground cursor-pointer">
                  Demo
                </Label>
                <Switch
                  id="demo-okr-toggle"
                  checked={showDemoData}
                  onCheckedChange={setShowDemoData}
                />
              </div>
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
          <Card className="border-dashed border-2 border-muted-foreground/25">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mb-6">
                <AlertTriangle className="w-10 h-10 text-warning" />
              </div>
              <h3 className="text-xl font-semibold mb-3">No hay fase activa</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Los OKRs Organizacionales se generan automáticamente cuando el administrador 
                activa la <strong>Fase 1</strong> del negocio. Esto asegura que los objetivos 
                estén alineados con la estrategia de cada fase.
              </p>
              <div className="bg-info/10 border border-info/30 rounded-lg p-4 max-w-md">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">¿Qué hacer?</strong><br />
                  El administrador debe ir al <strong>Dashboard → Progreso General</strong> y 
                  generar las fases del negocio. Una vez activa la Fase 1, los OKRs 
                  organizacionales se generarán automáticamente.
                </p>
              </div>
              <Button
                variant="outline"
                className="mt-6 gap-2"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="w-4 h-4" />
                Ir al Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
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
                {displayPhase ? `Fase ${displayPhase.phase_number}: ${displayPhase.phase_name}` : 'Objetivos estratégicos'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2 mr-2 bg-muted/50 rounded-lg px-3 py-1.5">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="demo-okr-toggle" className="text-xs text-muted-foreground cursor-pointer">
                Demo
              </Label>
              <Switch
                id="demo-okr-toggle"
                checked={showDemoData}
                onCheckedChange={setShowDemoData}
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/okrs/organization/history')}
              className="gap-1 md:gap-2 h-8 md:h-9 text-xs md:text-sm"
            >
              <History className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden md:inline">Historial</span>
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
          {/* Demo Badge */}
          {isDemo && (
            <div className="flex items-center gap-2 p-3 bg-info/10 border border-info/30 rounded-lg">
              <Badge variant="secondary" className="bg-info/20">DEMO</Badge>
              <span className="text-sm text-muted-foreground">
                Datos de ejemplo. Genera OKRs organizacionales para ver datos reales.
              </span>
            </div>
          )}

          {/* Info de Fase Actual */}
          {displayPhase && (
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1">
                        {isIndividual ? <User className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                        {isIndividual ? 'Individual' : `Equipo (${teamSize})`}
                      </Badge>
                      <Badge variant="outline">Fase {displayPhase.phase_number}</Badge>
                    </div>
                    <h3 className="text-xl font-bold">{displayPhase.phase_name}</h3>
                    {displayPhase.phase_description && (
                      <p className="text-sm text-muted-foreground">{displayPhase.phase_description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {isDemo ? 12 : totalPhaseTasks} tareas en fase
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {displayPhase.duration_weeks} semanas
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">{displayPhase.progress_percentage}%</div>
                      <div className="text-sm text-muted-foreground">Progreso de fase</div>
                    </div>
                    <Progress value={displayPhase.progress_percentage} className="w-32 h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botón Generar OKRs */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">OKRs de Fase</h2>
              <p className="text-sm text-muted-foreground">
                Objetivos organizacionales alineados con {isIndividual ? 'tu trabajo individual' : 'las tareas del equipo'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPhaseOKRs}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              {displayPhase && !isDemo && (
                <Button
                  onClick={generatePhaseOKRs}
                  disabled={generating || !activePhase}
                  className="gap-2"
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {generating ? 'Generando...' : 'Generar OKRs con IA'}
                </Button>
              )}
            </div>
          </div>

          {/* Explicación */}
          <Card className="border-muted">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <strong>¿Qué son los OKRs Organizacionales de Fase?</strong>
                  </p>
                  <p>
                    Son <strong>4 objetivos estratégicos</strong> generados por IA basándose en las <strong>{totalPhaseTasks} tareas</strong> de 
                    {isIndividual 
                      ? ' tu trabajo como emprendedor individual.' 
                      : ` tu equipo de ${teamSize} personas.`
                    }
                  </p>
                  <p>
                    <em>Diferencia con OKRs semanales:</em> Estos son de <strong>organización</strong> (estratégicos, para toda la fase) 
                    mientras que los semanales son <strong>personales</strong> (tácticos, por usuario).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPIs Summary */}
          {displayObjectives.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Objetivos Activos
                  </CardDescription>
                  <CardTitle className="text-3xl">
                    {displayObjectives.filter(o => o.status === 'active').length}
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
                    {displayObjectives.length > 0 
                      ? Math.round(displayObjectives.reduce((sum, obj) => sum + obj.progress, 0) / displayObjectives.length)
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
                    {displayObjectives.reduce((sum, obj) => sum + obj.achieved_krs, 0)}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
          )}

          {/* OKRs List */}
          {!displayPhase ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <AlertTriangle className="w-16 h-16 text-warning mb-4" />
                <h3 className="text-xl font-semibold mb-2">No hay fase activa</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Necesitas tener una fase de negocio activa para generar OKRs organizacionales.
                  Ve al Dashboard para activar una fase.
                </p>
                <Button className="mt-4" onClick={() => navigate('/dashboard')}>
                  Ir al Dashboard
                </Button>
              </CardContent>
            </Card>
          ) : objectives.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Building2 className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Sin OKRs para esta fase</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  No hay OKRs organizacionales para la Fase {activePhase.phase_number}. 
                  Genera objetivos estratégicos basados en las {totalPhaseTasks} tareas de 
                  {isIndividual ? ' tu trabajo.' : ' tu equipo.'}
                </p>
                <Button onClick={generatePhaseOKRs} disabled={generating} className="gap-2">
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Generar OKRs con IA
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
                        <div className="flex items-center gap-3 flex-wrap">
                          <CardTitle className="text-xl md:text-2xl">{objective.title}</CardTitle>
                          <Badge variant="secondary" className="gap-1">
                            <Building2 className="w-3 h-3" />
                            Fase {activePhase?.phase_number}
                          </Badge>
                        </div>
                        {objective.description && (
                          <CardDescription className="text-sm md:text-base">
                            {objective.description}
                          </CardDescription>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <div className="text-3xl md:text-4xl font-bold text-primary">
                            {Math.round(objective.progress)}%
                          </div>
                          <div className="text-xs md:text-sm text-muted-foreground">Progreso</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <Progress value={objective.progress} className="h-3" />
                      <div className="flex items-center justify-between text-sm text-muted-foreground flex-wrap gap-2">
                        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                          {objective.target_date && calculateDaysRemaining(objective.target_date) && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {calculateDaysRemaining(objective.target_date)} días
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
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
                        <CardContent className="pt-4 md:pt-6">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-sm md:text-base">{kr.title}</h5>
                                {kr.description && (
                                  <p className="text-xs md:text-sm text-muted-foreground">{kr.description}</p>
                                )}
                              </div>

                              <Badge className={`${getStatusColor(kr.status)} flex-shrink-0`}>
                                {getStatusIcon(kr.status)}
                                <span className="ml-1 hidden md:inline">{getStatusText(kr.status)}</span>
                              </Badge>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs md:text-sm">
                                <span className="text-muted-foreground">Progreso</span>
                                <span className="font-semibold">
                                  {kr.current_value} / {kr.target_value} {kr.unit}
                                </span>
                              </div>
                              <Progress value={kr.progress} className="h-2" />
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{Math.round(kr.progress)}%</span>
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
                                  Actualizar
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
            fetchPhaseOKRs();
          }}
        />
      )}
    </div>
  );
};

export default OrganizationOKRs;
