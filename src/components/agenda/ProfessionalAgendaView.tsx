import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Clock, 
  Target, 
  Info, 
  Settings,
  ChevronLeft,
  ChevronRight,
  CalendarClock,
  CheckCircle2,
  Plus,
  Filter
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { format, addDays, parseISO, isSameDay, addWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AvailabilityBulkConfig } from './AvailabilityBulkConfig';
import { AgendaFilters } from './AgendaFilters';
import { useCurrentPhase, usePhaseWeeklyTasks } from '@/hooks/usePhaseWeeklyTasks';
import { useAgendaPhaseWeeks, type PhaseWeekInfo } from '@/hooks/useAgendaPhaseWeeks';
import { getCurrentWeekStart } from '@/lib/weekUtils';
import type { AgendaFilters as FiltersType } from '@/hooks/useGlobalAgenda';

interface ProfessionalAgendaViewProps {
  weekStart: string;
  filters: FiltersType;
  hasTeam: boolean;
  collaborativePercentage: number;
  onCreateTask: () => void;
}

interface TaskScheduleWithTask {
  id: string;
  task_id: string;
  user_id: string;
  scheduled_date: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  status: string;
  is_collaborative: boolean;
  tasks: {
    id: string;
    title: string;
    description: string | null;
    area: string | null;
    estimated_hours: number | null;
  } | null;
}

export function ProfessionalAgendaView({ 
  weekStart: initialWeekStart, 
  filters, 
  hasTeam, 
  collaborativePercentage,
  onCreateTask
}: ProfessionalAgendaViewProps) {
  const { user } = useAuth();
  const [showAvailabilitySheet, setShowAvailabilitySheet] = useState(false);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [localFilters, setLocalFilters] = useState(filters);

  // Get current phase
  const { data: currentPhase } = useCurrentPhase();
  
  // Get all weeks for the phase
  const { data: phaseWeeks = [], isLoading: weeksLoading, refetch: refetchWeeks } = useAgendaPhaseWeeks(currentPhase?.phase_number);

  // Calculate current week start based on selected week index
  const currentWeekStart = useMemo(() => {
    if (phaseWeeks.length > 0 && currentWeekIndex < phaseWeeks.length) {
      return phaseWeeks[currentWeekIndex].weekStart;
    }
    return initialWeekStart;
  }, [phaseWeeks, currentWeekIndex, initialWeekStart]);

  const currentWeekInfo = phaseWeeks[currentWeekIndex];
  const totalWeeks = phaseWeeks.length;

  // Check if user has availability configured for current week
  const { data: availability, refetch: refetchAvailability } = useQuery({
    queryKey: ['user-availability-check', user?.id, currentWeekStart],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_weekly_availability')
        .select('id, submitted_at')
        .eq('user_id', user.id)
        .eq('week_start', currentWeekStart)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch tasks for current week using phase data
  const { data: phaseData } = usePhaseWeeklyTasks(currentPhase?.phase_number);

  // Get tasks for current week (weekNumber = currentWeekIndex + 1)
  const currentWeekTasks = useMemo(() => {
    if (!phaseData?.tasksByWeek) return [];
    return phaseData.tasksByWeek[currentWeekIndex + 1] || [];
  }, [phaseData, currentWeekIndex]);

  const hasAvailability = !!availability;

  // Generate week days
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(parseISO(currentWeekStart), i);
      return {
        date,
        dateStr: format(date, 'yyyy-MM-dd'),
        dayName: format(date, 'EEEE', { locale: es }),
        dayNumber: format(date, 'd'),
        monthName: format(date, 'MMM', { locale: es }),
        isToday: isSameDay(date, new Date()),
      };
    });
  }, [currentWeekStart]);

  // Distribute tasks across days (default distribution when no availability)
  const tasksByDay = useMemo(() => {
    const result: Record<string, typeof currentWeekTasks> = {};
    weekDays.forEach(day => {
      result[day.dateStr] = [];
    });

    // Simple distribution: spread tasks across working days (Mon-Fri)
    const workingDays = weekDays.slice(0, 5); // Mon-Fri
    currentWeekTasks.forEach((task, index) => {
      const dayIndex = index % workingDays.length;
      const dayStr = workingDays[dayIndex].dateStr;
      result[dayStr].push(task);
    });

    return result;
  }, [currentWeekTasks, weekDays]);

  const completedCount = currentWeekTasks.filter(t => t.is_completed).length;
  const totalCount = currentWeekTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const goToPreviousWeek = () => {
    if (currentWeekIndex > 0) {
      setCurrentWeekIndex(prev => prev - 1);
    }
  };

  const goToNextWeek = () => {
    if (currentWeekIndex < totalWeeks - 1) {
      setCurrentWeekIndex(prev => prev + 1);
    }
  };

  const handleAvailabilityComplete = () => {
    setShowAvailabilitySheet(false);
    refetchAvailability();
    refetchWeeks();
  };

  if (weeksLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  // If no tasks/weeks, show empty state
  if (phaseWeeks.length === 0) {
    return (
      <div className="space-y-6">
        <Alert className="bg-muted/50 border-muted">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            No hay tareas programadas para esta fase. Las tareas se generarán automáticamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Read-only notice */}
      <Alert className="bg-muted/50 border-muted">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Esta es una vista de solo lectura. Las tareas se completan desde el <strong>Dashboard</strong>.
        </AlertDescription>
      </Alert>

      {/* Configure week button - Always visible */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <CalendarClock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {hasAvailability ? '✓ Semana configurada' : 'Configura tu disponibilidad'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {hasAvailability 
                    ? 'Tu agenda tiene horarios personalizados' 
                    : 'Opcional: Define tus horarios para personalizar la agenda'
                  }
                </p>
              </div>
            </div>
            <Sheet open={showAvailabilitySheet} onOpenChange={setShowAvailabilitySheet}>
              <SheetTrigger asChild>
                <Button variant={hasAvailability ? 'outline' : 'default'} size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  {hasAvailability ? 'Modificar' : 'Configurar mi semana'}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:w-[700px] overflow-y-auto">
                <div className="py-4">
                  {user && (
                    <AvailabilityBulkConfig
                      userId={user.id}
                      phaseWeeks={phaseWeeks}
                      currentWeekStart={currentWeekStart}
                      onComplete={handleAvailabilityComplete}
                    />
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </CardContent>
      </Card>

      {/* Progress Summary */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/80 p-4">
          <div className="flex items-center justify-between text-primary-foreground">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6" />
              <div>
                <p className="text-sm opacity-90">Progreso Semana {currentWeekIndex + 1}</p>
                <p className="text-2xl font-bold">{progressPercent}%</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Tareas completadas</p>
              <p className="text-2xl font-bold">{completedCount}/{totalCount}</p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-primary-foreground/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-foreground transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Week Navigation + Controls - Moved below progress */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={goToPreviousWeek}
                disabled={currentWeekIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="text-center min-w-[200px]">
                <div className="text-xs text-muted-foreground">
                  Semana {currentWeekIndex + 1} de {totalWeeks}
                </div>
                <div className="text-lg font-semibold text-foreground">
                  {format(parseISO(currentWeekStart), "d 'de' MMMM", { locale: es })}
                </div>
                {currentWeekInfo && (
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <Badge variant={currentWeekInfo.hasAvailability ? 'default' : 'secondary'} className="text-xs">
                      {currentWeekInfo.taskCount} tareas
                    </Badge>
                    {currentWeekInfo.hasAvailability && (
                      <Badge variant="outline" className="text-xs text-success border-success">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Configurada
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <Button 
                variant="outline" 
                size="icon" 
                onClick={goToNextWeek}
                disabled={currentWeekIndex >= totalWeeks - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={onCreateTask} size="sm" variant="default">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Tarea
              </Button>
              <AgendaFilters filters={localFilters} onFiltersChange={setLocalFilters} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Calendar View */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Agenda - Semana {currentWeekIndex + 1}
            {hasTeam && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {collaborativePercentage}% colaborativo
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Week header */}
          <div className="grid grid-cols-7 border-b border-border">
            {weekDays.map((day) => (
              <div 
                key={day.dateStr}
                className={`p-3 text-center border-r last:border-r-0 border-border ${
                  day.isToday ? 'bg-primary/10' : ''
                }`}
              >
                <p className={`text-xs uppercase font-medium ${
                  day.isToday ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {day.dayName.slice(0, 3)}
                </p>
                <p className={`text-lg font-bold ${
                  day.isToday ? 'text-primary' : 'text-foreground'
                }`}>
                  {day.dayNumber}
                </p>
              </div>
            ))}
          </div>

          {/* Tasks grid */}
          <div className="grid grid-cols-7 min-h-[300px]">
            {weekDays.map((day) => {
              const dayTasks = tasksByDay[day.dateStr] || [];
              return (
                <div 
                  key={day.dateStr}
                  className={`p-2 border-r last:border-r-0 border-border min-h-[300px] ${
                    day.isToday ? 'bg-primary/5' : ''
                  }`}
                >
                  {dayTasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center mt-4">
                      Sin tareas
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {dayTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`p-2 rounded text-xs transition-colors ${
                            task.is_completed
                              ? 'bg-success/20 border border-success/30'
                              : 'bg-muted/50 border border-border'
                          }`}
                        >
                          <div className="flex items-start gap-1">
                            {task.is_completed && (
                              <CheckCircle2 className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />
                            )}
                            <p className={`font-medium line-clamp-2 ${
                              task.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'
                            }`}>
                              {task.title}
                            </p>
                          </div>
                          {task.estimated_hours && (
                            <p className="text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              ~{task.estimated_hours}h
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-muted/50 border border-border" />
          <span>Pendiente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-success/20 border border-success/30" />
          <span>Completada</span>
        </div>
        <div className="ml-auto text-muted-foreground">
          Fase: {totalWeeks} semanas totales
        </div>
      </div>
    </div>
  );
}
