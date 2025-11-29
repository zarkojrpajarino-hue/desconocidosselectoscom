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
  Plus,
  RefreshCw,
  Calendar,
  Users,
  Link as LinkIcon,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import CreateOKRModal from './CreateOKRModal';

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
  linked_tasks: number;
}

const OKRsDashboard = () => {
  const { user, userProfile } = useAuth();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState('Q4 2025');

  useEffect(() => {
    fetchOKRs();
  }, [selectedQuarter]);

  const fetchOKRs = async () => {
    setLoading(true);
    try {
      const [quarter, year] = selectedQuarter.split(' ');
      
      const { data: objectivesData, error: objError } = await supabase
        .from('okrs_with_progress')
        .select('*')
        .eq('quarter', quarter)
        .eq('year', parseInt(year))
        .order('created_at', { ascending: false });

      if (objError) throw objError;

      const objectivesWithKRs = await Promise.all(
        (objectivesData || []).map(async (obj) => {
          const { data: krs } = await supabase
            .from('key_results')
            .select('*')
            .eq('objective_id', obj.objective_id);

          const krsWithProgress = (krs || []).map(kr => ({
            ...kr,
            status: kr.status as 'on_track' | 'at_risk' | 'behind' | 'achieved',
            progress: calculateKRProgress(kr)
          }));

          return {
            id: obj.objective_id,
            title: obj.objective_title,
            description: obj.objective_description,
            quarter: obj.quarter,
            year: obj.year,
            status: obj.objective_status as 'active' | 'completed' | 'cancelled' | 'at_risk',
            target_date: obj.target_date,
            owner_name: obj.owner_name,
            progress: obj.objective_progress || 0,
            key_results: krsWithProgress,
            total_key_results: obj.total_key_results || 0,
            achieved_krs: obj.achieved_krs || 0,
            on_track_krs: obj.on_track_krs || 0,
            at_risk_krs: obj.at_risk_krs || 0,
            behind_krs: obj.behind_krs || 0,
            linked_tasks: obj.linked_tasks || 0
          };
        })
      );

      setObjectives(objectivesWithKRs);
    } catch (error) {
      console.error('Error fetching OKRs:', error);
      toast.error('Error al cargar OKRs');
    } finally {
      setLoading(false);
    }
  };

  const calculateKRProgress = (kr: any): number => {
    if (kr.target_value === kr.start_value) return 0;
    const progress = ((kr.current_value - kr.start_value) / (kr.target_value - kr.start_value)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const updateKRValue = async (krId: string, newValue: number) => {
    try {
      const { data: kr } = await supabase
        .from('key_results')
        .select('current_value')
        .eq('id', krId)
        .single();

      const { error: updateError } = await supabase
        .from('key_results')
        .update({ current_value: newValue })
        .eq('id', krId);

      if (updateError) throw updateError;

      await supabase
        .from('okr_updates')
        .insert({
          key_result_id: krId,
          previous_value: kr?.current_value || 0,
          new_value: newValue,
          updated_by: user?.id
        });

      toast.success('Progreso actualizado');
      fetchOKRs();
    } catch (error) {
      console.error('Error updating KR:', error);
      toast.error('Error al actualizar progreso');
    }
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
        return <AlertTriangle className="w-4 h-4" />;
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
        <div>
          <h2 className="text-3xl font-bold tracking-tight">OKRs - Objetivos y Resultados Clave</h2>
          <p className="text-muted-foreground">
            Sistema de objetivos trimestrales con seguimiento de progreso
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-background"
          >
            <option>Q4 2025</option>
            <option>Q1 2026</option>
            <option>Q2 2026</option>
            <option>Q3 2026</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchOKRs}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>

          {(userProfile?.role === 'admin' || userProfile?.role === 'leader') && (
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Objetivo
            </Button>
          )}
        </div>
      </div>

      {objectives.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Tareas Vinculadas
              </CardDescription>
              <CardTitle className="text-3xl">
                {objectives.reduce((sum, obj) => sum + obj.linked_tasks, 0)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {objectives.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay objetivos para {selectedQuarter}</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Crea tu primer objetivo trimestral con resultados clave medibles
            </p>
            {(userProfile?.role === 'admin' || userProfile?.role === 'leader') && (
              <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Crear Primer Objetivo
              </Button>
            )}
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
                      <Badge variant="outline">
                        {objective.quarter} {objective.year}
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
                        <Users className="w-4 h-4" />
                        {objective.owner_name || 'Sin asignar'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {calculateDaysRemaining(objective.target_date)} días restantes
                      </span>
                      <span className="flex items-center gap-1">
                        <LinkIcon className="w-4 h-4" />
                        {objective.linked_tasks} tareas vinculadas
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
                              <Badge className={getStatusColor(kr.status)} variant="secondary">
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(kr.status)}
                                  {getStatusText(kr.status)}
                                </span>
                              </Badge>
                            </div>
                            {kr.description && (
                              <p className="text-sm text-muted-foreground">{kr.description}</p>
                            )}
                          </div>

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

                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="number"
                            min={kr.start_value}
                            max={kr.target_value}
                            defaultValue={kr.current_value}
                            className="px-3 py-1 border rounded text-sm w-24"
                            onBlur={(e) => {
                              const newValue = parseFloat(e.target.value);
                              if (newValue !== kr.current_value && !isNaN(newValue)) {
                                updateKRValue(kr.id, newValue);
                              }
                            }}
                          />
                          <span className="text-sm text-muted-foreground">
                            Actualizar progreso
                          </span>
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

      {showCreateModal && (
        <CreateOKRModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchOKRs();
          }}
          selectedQuarter={selectedQuarter}
        />
      )}
    </div>
  );
};

export default OKRsDashboard;
