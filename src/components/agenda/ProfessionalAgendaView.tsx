import React, { useState } from 'react';
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
  ChevronRight,
  CalendarClock,
  CheckCircle2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { format, addDays, parseISO, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import AvailabilityQuestionnaire from '@/components/AvailabilityQuestionnaire';
import type { AgendaFilters } from '@/hooks/useGlobalAgenda';

interface ProfessionalAgendaViewProps {
  weekStart: string;
  filters: AgendaFilters;
  hasTeam: boolean;
  collaborativePercentage: number;
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
  weekStart, 
  filters, 
  hasTeam, 
  collaborativePercentage 
}: ProfessionalAgendaViewProps) {
  const { user } = useAuth();
  const [showAvailabilitySheet, setShowAvailabilitySheet] = useState(false);

  // Check if user has availability configured
  const { data: availability, refetch: refetchAvailability } = useQuery({
    queryKey: ['user-availability-check', user?.id, weekStart],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_weekly_availability')
        .select('id, submitted_at')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['professional-agenda-tasks', user?.id, weekStart],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('task_schedule')
        .select(`
          *,
          tasks (id, title, description, area, estimated_hours)
        `)
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .order('scheduled_date')
        .order('scheduled_start');
      
      if (error) throw error;
      return (data || []) as TaskScheduleWithTask[];
    },
    enabled: !!user?.id,
  });

  const hasAvailability = !!availability;

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(parseISO(weekStart), i);
    return {
      date,
      dateStr: format(date, 'yyyy-MM-dd'),
      dayName: format(date, 'EEEE', { locale: es }),
      dayNumber: format(date, 'd'),
      monthName: format(date, 'MMM', { locale: es }),
      isToday: isSameDay(date, new Date()),
    };
  });

  // Group tasks by day
  const tasksByDay = React.useMemo(() => {
    if (!tasks) return {};
    return tasks.reduce((acc, task) => {
      const day = task.scheduled_date;
      if (!acc[day]) acc[day] = [];
      acc[day].push(task);
      return acc;
    }, {} as Record<string, TaskScheduleWithTask[]>);
  }, [tasks]);

  const completedCount = tasks?.filter(t => t.status === 'completed').length || 0;
  const totalCount = tasks?.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Read-only notice */}
      <Alert className="bg-muted/50 border-muted">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Esta es una vista de solo lectura. Para completar tareas, ve al <strong>Dashboard</strong>.
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
                  {hasAvailability ? '✓ Semana configurada' : 'Configura tu semana'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {hasAvailability 
                    ? 'Tu agenda tiene horarios personalizados' 
                    : 'Opcional: Define tus horarios para ver la agenda con bloques de tiempo'
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
              <SheetContent className="w-full sm:w-[600px] overflow-y-auto">
                <div className="py-4">
                  <h2 className="text-xl font-bold mb-4">Configura tu disponibilidad</h2>
                  {user && (
                    <AvailabilityQuestionnaire
                      userId={user.id}
                      weekStart={weekStart}
                      onComplete={() => {
                        setShowAvailabilitySheet(false);
                        refetchAvailability();
                      }}
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
                <p className="text-sm opacity-90">Progreso semanal</p>
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

      {/* Professional Calendar View */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Agenda Semanal
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
                            task.status === 'completed'
                              ? 'bg-success/20 border border-success/30'
                              : task.is_collaborative
                                ? 'bg-primary/10 border border-primary/30'
                                : 'bg-muted/50 border border-border'
                          }`}
                        >
                          <div className="flex items-start gap-1">
                            {task.status === 'completed' && (
                              <CheckCircle2 className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />
                            )}
                            <p className={`font-medium line-clamp-2 ${
                              task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                            }`}>
                              {task.tasks?.title || 'Sin título'}
                            </p>
                          </div>
                          {hasAvailability && task.scheduled_start && (
                            <p className="text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.scheduled_start}
                            </p>
                          )}
                          {task.tasks?.estimated_hours && (
                            <p className="text-muted-foreground mt-0.5">
                              ~{task.tasks.estimated_hours}h
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
          <span>Individual</span>
        </div>
        {hasTeam && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary/10 border border-primary/30" />
            <span>Colaborativa</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-success/20 border border-success/30" />
          <span>Completada</span>
        </div>
      </div>
    </div>
  );
}
