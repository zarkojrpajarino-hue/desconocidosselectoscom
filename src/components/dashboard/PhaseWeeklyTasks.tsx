import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Target, 
  Calendar,
  Lightbulb,
  Clock
} from 'lucide-react';
import { usePhaseWeeklyTasks, useCurrentPhase, PhaseTask } from '@/hooks/usePhaseWeeklyTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskSwaps } from '@/hooks/useTaskSwaps';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PhaseTaskCard } from './PhaseTaskCard';
import { useTranslation } from 'react-i18next';

export function PhaseWeeklyTasks() {
  const { t } = useTranslation();
  const { user, currentOrganizationId } = useAuth();
  const { data: currentPhase, isLoading: phaseLoading } = useCurrentPhase();
  const { data: weeklyData, isLoading: tasksLoading } = usePhaseWeeklyTasks(currentPhase?.phase_number);
  const { remainingSwaps, reload: reloadSwaps } = useTaskSwaps(user?.id || '', 'moderado');
  const queryClient = useQueryClient();
  
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  
  // Usar la semana actual si no se ha seleccionado ninguna
  const displayWeek = selectedWeek ?? weeklyData?.currentWeek ?? 1;
  
  const isLoading = phaseLoading || tasksLoading;
  
  const handleTaskComplete = async (taskId: string, completed: boolean) => {
    if (!user?.id || !currentOrganizationId) return;
    
    try {
      if (completed) {
        // Crear completion
        const { error } = await supabase
          .from('task_completions')
          .upsert({
            task_id: taskId,
            user_id: user.id,
            organization_id: currentOrganizationId,
            completed_by_user: true,
            validated_by_leader: true, // Auto-validate for now
            completed_at: new Date().toISOString(),
          }, {
            onConflict: 'task_id,user_id'
          });
        
        if (error) throw error;
        toast.success('¡Tarea completada!');
      } else {
        // Eliminar completion
        const { error } = await supabase
          .from('task_completions')
          .delete()
          .eq('task_id', taskId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        toast.info('Tarea marcada como pendiente');
      }
      
      // Refrescar datos
      queryClient.invalidateQueries({ queryKey: ['phase-weekly-tasks'] });
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Error al actualizar la tarea');
    }
  };
  
  const handleSwapComplete = () => {
    reloadSwaps();
    queryClient.invalidateQueries({ queryKey: ['phase-weekly-tasks'] });
  };
  
  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (!currentPhase || !weeklyData || weeklyData.totalTasks === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-12 text-center">
          <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-semibold text-lg mb-2">Sin tareas asignadas</h3>
          <p className="text-muted-foreground">
            Las tareas se generarán automáticamente cuando la fase se active.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const currentWeekTasks = weeklyData.tasksByWeek[displayWeek] || [];
  const completedThisWeek = currentWeekTasks.filter(t => t.is_completed).length;
  const weekProgress = currentWeekTasks.length > 0 
    ? Math.round((completedThisWeek / currentWeekTasks.length) * 100) 
    : 0;
  
  const goToPreviousWeek = () => {
    if (displayWeek > 1) {
      setSelectedWeek(displayWeek - 1);
    }
  };
  
  const goToNextWeek = () => {
    if (displayWeek < weeklyData.totalWeeks) {
      setSelectedWeek(displayWeek + 1);
    }
  };
  
  const goToCurrentWeek = () => {
    setSelectedWeek(null);
  };
  
  const isCurrentWeekSelected = displayWeek === weeklyData.currentWeek;
  
  
  return (
    <div className="space-y-4">
      {/* Progress Overview */}
      <Card className="shadow-card bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                {currentPhase.phase_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {weeklyData.completedTasks}/{weeklyData.totalTasks} tareas completadas
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{weeklyData.progressPercent}%</div>
              <div className="text-sm text-muted-foreground">Progreso de fase</div>
            </div>
          </div>
          <Progress value={weeklyData.progressPercent} className="mt-4 h-2" />
          
          {/* Swaps remaining */}
          {remainingSwaps > 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              Cambios disponibles esta semana: {remainingSwaps}
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* Week Navigation */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <CardTitle className="text-base">
                  Semana {displayWeek} de {weeklyData.totalWeeks}
                </CardTitle>
                <CardDescription>
                  {completedThisWeek}/{currentWeekTasks.length} tareas de esta semana
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousWeek}
                disabled={displayWeek <= 1}
                className="h-8 w-8"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              {!isCurrentWeekSelected && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToCurrentWeek}
                  className="text-xs"
                >
                  Ir a semana actual
                </Button>
              )}
              
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextWeek}
                disabled={displayWeek >= weeklyData.totalWeeks}
                className="h-8 w-8"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Week Progress Bar */}
          <div className="mt-3">
            <Progress value={weekProgress} className="h-1.5" />
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Week indicator pills */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-2">
            {Array.from({ length: weeklyData.totalWeeks }, (_, i) => i + 1).map(week => {
              const weekTasks = weeklyData.tasksByWeek[week] || [];
              const weekCompleted = weekTasks.filter(t => t.is_completed).length;
              const isComplete = weekTasks.length > 0 && weekCompleted === weekTasks.length;
              const isCurrent = week === weeklyData.currentWeek;
              const isSelected = week === displayWeek;
              
              return (
                <Button
                  key={week}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedWeek(week)}
                  className={`min-w-[40px] h-8 px-2 ${
                    isComplete ? 'border-success/50 bg-success/10' : ''
                  } ${isCurrent && !isSelected ? 'border-primary/50' : ''}`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-3 h-3 text-success" />
                  ) : (
                    <span className="text-xs">{week}</span>
                  )}
                </Button>
              );
            })}
          </div>
          
          {/* Tasks List */}
          {currentWeekTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No hay tareas para esta semana</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentWeekTasks.map((task) => (
                <PhaseTaskCard
                  key={task.id}
                  task={{ ...task, organization_id: currentOrganizationId }}
                  userId={user?.id || ''}
                  onComplete={handleTaskComplete}
                  remainingSwaps={remainingSwaps}
                  onSwapComplete={handleSwapComplete}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Info Card */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-warning mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">Cómo funciona</p>
              <p className="text-sm text-muted-foreground">
                La IA ha generado {weeklyData.totalTasks} tareas para completar esta fase, 
                distribuidas en {weeklyData.totalWeeks} semanas. Completa las tareas a tu ritmo - 
                las tareas pendientes se acumulan hasta que las termines. Expande cada tarea para 
                ver opciones de IA, tiempo y sincronización.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
