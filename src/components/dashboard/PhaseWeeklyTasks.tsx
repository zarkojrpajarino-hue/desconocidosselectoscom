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
  Circle, 
  Target, 
  Calendar,
  Lightbulb,
  Clock
} from 'lucide-react';
import { usePhaseWeeklyTasks, useCurrentPhase } from '@/hooks/usePhaseWeeklyTasks';
import { useTranslation } from 'react-i18next';

interface PhaseWeeklyTasksProps {
  onTaskClick?: (taskId: string) => void;
}

export function PhaseWeeklyTasks({ onTaskClick }: PhaseWeeklyTasksProps) {
  const { t } = useTranslation();
  const { data: currentPhase, isLoading: phaseLoading } = useCurrentPhase();
  const { data: weeklyData, isLoading: tasksLoading } = usePhaseWeeklyTasks(currentPhase?.phase_number);
  
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  
  // Usar la semana actual si no se ha seleccionado ninguna
  const displayWeek = selectedWeek ?? weeklyData?.currentWeek ?? 1;
  
  const isLoading = phaseLoading || tasksLoading;
  
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
            <div className="space-y-2">
              {currentWeekTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick?.(task.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    task.is_completed
                      ? 'bg-success/10 border-success/20'
                      : 'bg-card hover:bg-muted/50 border-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 shrink-0 ${
                      task.is_completed 
                        ? 'bg-success text-success-foreground' 
                        : 'border-2 border-muted-foreground'
                    }`}>
                      {task.is_completed ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Circle className="w-3 h-3 opacity-0" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${
                        task.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {task.area && (
                          <Badge variant="secondary" className="text-xs">
                            {task.area}
                          </Badge>
                        )}
                        {task.estimated_hours && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            ~{task.estimated_hours}h
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
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
                las tareas pendientes se acumulan hasta que las termines.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
