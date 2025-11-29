import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  History, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle,
  Calendar
} from 'lucide-react';

interface KeyResult {
  id: string;
  title: string;
  current_value: number;
  target_value: number;
  unit: string;
  status: string;
  progress: number;
}

interface WeeklyOKR {
  id: string;
  title: string;
  description: string;
  quarter: string;
  week_start: string;
  target_date: string;
  status: string;
  progress: number;
  key_results: KeyResult[];
  achieved_krs: number;
  on_track_krs: number;
  at_risk_krs: number;
  behind_krs: number;
  total_krs: number;
}

const OKRsHistory = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [weeklyOKRs, setWeeklyOKRs] = useState<WeeklyOKR[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchHistoricalOKRs();
    }
  }, [user]);

  const fetchHistoricalOKRs = async () => {
    setLoadingData(true);
    try {
      // Obtener todos los objetivos del usuario ordenados por fecha
      const { data: objectivesData, error: objError } = await supabase
        .from('objectives')
        .select('*')
        .eq('owner_user_id', user?.id)
        .ilike('quarter', 'Semana%')
        .order('created_at', { ascending: false });

      if (objError) throw objError;

      const historicalOKRs = await Promise.all(
        (objectivesData || []).map(async (obj) => {
          // Obtener KRs de cada objetivo
          const { data: krs } = await supabase
            .from('key_results')
            .select('*')
            .eq('objective_id', obj.id);

          const krsWithProgress = (krs || []).map(kr => {
            const progress = calculateKRProgress(kr);
            return {
              ...kr,
              progress
            };
          });

          // Calcular progreso ponderado del objetivo
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

          // Extraer fecha de inicio de semana del quarter
          const weekMatch = obj.quarter.match(/Semana (\d{4}-\d{2}-\d{2})/);
          const week_start = weekMatch ? weekMatch[1] : obj.quarter;

          return {
            id: obj.id,
            title: obj.title,
            description: obj.description,
            quarter: obj.quarter,
            week_start,
            target_date: obj.target_date,
            status: obj.status,
            progress: objectiveProgress,
            key_results: krsWithProgress,
            achieved_krs,
            on_track_krs,
            at_risk_krs,
            behind_krs,
            total_krs: krsWithProgress.length
          };
        })
      );

      setWeeklyOKRs(historicalOKRs);
    } catch (error) {
      console.error('Error fetching historical OKRs:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const calculateKRProgress = (kr: any) => {
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
      case 'active':
        return 'Activo';
      case 'completed':
        return 'Completado';
      default:
        return status;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando historial...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Historial de OKRs Semanales
              </h1>
              <p className="text-sm text-muted-foreground">
                Revisa el progreso de tus objetivos y key results de semanas pasadas
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/okrs')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a OKRs
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          {/* Estadísticas generales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Total Semanas
                </CardDescription>
                <CardTitle className="text-3xl">
                  {weeklyOKRs.length}
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
                  {weeklyOKRs.reduce((sum, okr) => sum + okr.achieved_krs, 0)}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Progreso Promedio
                </CardDescription>
                <CardTitle className="text-3xl text-primary">
                  {weeklyOKRs.length > 0
                    ? Math.round(
                        weeklyOKRs.reduce((sum, okr) => sum + okr.progress, 0) / weeklyOKRs.length
                      )
                    : 0}%
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Total KRs
                </CardDescription>
                <CardTitle className="text-3xl">
                  {weeklyOKRs.reduce((sum, okr) => sum + okr.total_krs, 0)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Listado de semanas */}
          {weeklyOKRs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <History className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No hay historial aún</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Cuando generes OKRs semanales, aparecerán aquí para que puedas revisar tu progreso histórico
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {weeklyOKRs.map((weekOKR) => (
                <Card key={weekOKR.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(weekOKR.week_start)}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(weekOKR.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(weekOKR.status)}
                              {getStatusText(weekOKR.status)}
                            </span>
                          </Badge>
                        </div>
                        <CardTitle className="text-xl">{weekOKR.title}</CardTitle>
                        {weekOKR.description && (
                          <CardDescription>{weekOKR.description}</CardDescription>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-4xl font-bold text-primary">
                          {Math.round(weekOKR.progress)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Progreso</div>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <Progress value={weekOKR.progress} className="h-3" />
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="gap-1">
                            <CheckCircle2 className="w-3 h-3 text-success" />
                            {weekOKR.achieved_krs} logrados
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <TrendingUp className="w-3 h-3 text-primary" />
                            {weekOKR.on_track_krs} en camino
                          </Badge>
                          {weekOKR.at_risk_krs > 0 && (
                            <Badge variant="outline" className="gap-1">
                              <AlertTriangle className="w-3 h-3 text-warning" />
                              {weekOKR.at_risk_krs} en riesgo
                            </Badge>
                          )}
                          {weekOKR.behind_krs > 0 && (
                            <Badge variant="outline" className="gap-1">
                              <AlertTriangle className="w-3 h-3 text-destructive" />
                              {weekOKR.behind_krs} atrasados
                            </Badge>
                          )}
                        </div>
                        <span className="text-muted-foreground">
                          {weekOKR.total_krs} Key Results
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      {weekOKR.key_results.map((kr) => (
                        <Card key={kr.id} className="bg-muted/30">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="font-medium text-sm">{kr.title}</h5>
                                  <Badge className={getStatusColor(kr.status)} variant="secondary">
                                    <span className="flex items-center gap-1 text-xs">
                                      {getStatusIcon(kr.status)}
                                      {getStatusText(kr.status)}
                                    </span>
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold">
                                  {kr.current_value}
                                  {kr.unit && <span className="text-xs font-normal text-muted-foreground"> {kr.unit}</span>}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  de {kr.target_value} {kr.unit}
                                </div>
                              </div>
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
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OKRsHistory;
