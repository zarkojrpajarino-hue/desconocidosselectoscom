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
  Building2, 
  Calendar,
  TrendingUp,
  CheckCircle2,
  Target,
  History,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface KeyResult {
  id: string;
  title: string;
  current_value: number;
  target_value: number;
  unit: string;
  status: string;
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrganizationOKRHistory();
    }
  }, [user]);

  const fetchOrganizationOKRHistory = async () => {
    setLoading(true);
    try {
      // Obtener la organización del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user?.id)
        .single();

      if (userError) throw userError;

      // Obtener todos los OKRs organizacionales (histórico completo)
      const { data: objectivesData, error: objError } = await supabase
        .from('objectives')
        .select('*')
        .eq('organization_id', userData.organization_id)
        .is('phase', null)
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
            ...obj,
            key_results: krsWithProgress,
            progress: objectiveProgress
          };
        })
      );

      setObjectives(objectivesWithKRs);
    } catch (error: any) {
      console.error('Error fetching organization OKR history:', error);
      toast.error(error.message || 'Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const calculateKRProgress = (kr: any) => {
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Historial OKRs Organizacionales
              </h1>
              <p className="text-sm text-muted-foreground">
                Todos los OKRs estratégicos de la empresa
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/okrs/organization')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
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
      </main>
    </div>
  );
};

export default OrganizationOKRHistory;
