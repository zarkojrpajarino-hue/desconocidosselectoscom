import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import RescheduleModal from './RescheduleModal';
import { formatTime, formatShortDate } from '@/lib/dateUtils';
import { logger } from '@/lib/logger';

interface WeeklyAgendaProps {
  userId: string;
  weekStart: string;
  isLocked: boolean;
}

interface ScheduledTask {
  id: string;
  task_id: string;
  scheduled_date: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  is_collaborative: boolean;
  collaborator_user_id: string | null;
  task: {
    title: string;
    description: string;
    area: string;
  };
  collaborator?: {
    full_name: string;
    username: string;
  };
}

interface DaySchedule {
  date: string;
  dayName: string;
  tasks: ScheduledTask[];
}

const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const WeeklyAgenda = ({ userId, weekStart, isLocked }: WeeklyAgendaProps) => {
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);

  useEffect(() => {
    fetchSchedule();
    
    // FASE 1: Fix memory leak - suscripción con cleanup
    const channel = supabase
      .channel('schedule-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_schedule',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          logger.log('Schedule updated, refreshing...');
          fetchSchedule();
        }
      )
      .subscribe();

    // Cleanup para evitar memory leak
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, weekStart]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('task_schedule')
        .select(`
          id,
          task_id,
          scheduled_date,
          scheduled_start,
          scheduled_end,
          status,
          is_collaborative,
          collaborator_user_id,
          task:tasks(title, description, area),
          collaborator:users!task_schedule_collaborator_user_id_fkey(full_name, username)
        `)
        .eq('user_id', userId)
        .eq('week_start', weekStart)
        .order('scheduled_date')
        .order('scheduled_start');

      if (error) throw error;

      // Agrupar por día
      const weekDays: DaySchedule[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Transform data to proper ScheduledTask type
        const dayTasks: ScheduledTask[] = (data || [])
          .filter(t => t.scheduled_date === dateStr)
          .map(t => ({
            id: t.id,
            task_id: t.task_id,
            scheduled_date: t.scheduled_date || '',
            scheduled_start: t.scheduled_start || '',
            scheduled_end: t.scheduled_end || '',
            status: t.status || 'pending',
            is_collaborative: t.is_collaborative || false,
            collaborator_user_id: t.collaborator_user_id,
            task: {
              title: (t.task as { title?: string })?.title || 'Sin título',
              description: (t.task as { description?: string })?.description || '',
              area: (t.task as { area?: string })?.area || 'general',
            },
            collaborator: t.collaborator ? {
              full_name: (t.collaborator as { full_name?: string })?.full_name || '',
              username: (t.collaborator as { username?: string })?.username || '',
            } : undefined,
          }));

        weekDays.push({
          date: dateStr,
          dayName: DAYS_ES[date.getDay()],
          tasks: dayTasks,
        });
      }

      setSchedule(weekDays);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast.error('Error al cargar la agenda');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (taskScheduleId: string) => {
    try {
      const { error } = await supabase
        .from('task_schedule')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', taskScheduleId);

      if (error) throw error;

      toast.success('✅ Tarea completada');
      fetchSchedule();
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Error al completar tarea');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'in_progress':
        return 'bg-primary text-primary-foreground';
      case 'rescheduling':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'in_progress':
        return 'En Progreso';
      case 'rescheduling':
        return 'Reprogramando';
      default:
        return 'Pendiente';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Cargando agenda...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalTasks = schedule.reduce((acc, day) => acc + day.tasks.length, 0);
  const completedTasks = schedule.reduce(
    (acc, day) => acc + day.tasks.filter(t => t.status === 'completed').length,
    0
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Agenda Semanal
              </CardTitle>
              <CardDescription>
                {completedTasks}/{totalTasks} tareas completadas
              </CardDescription>
            </div>
            {isLocked && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Semana Activa
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {schedule.map((day) => (
            <div key={day.date} className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{day.dayName}</h3>
                <span className="text-sm text-muted-foreground">
                  {formatShortDate(day.date, day.dayName)}
                </span>
                {day.tasks.length > 0 && (
                  <Badge variant="outline" className="ml-auto">
                    {day.tasks.length} tarea{day.tasks.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              {day.tasks.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                  Sin tareas programadas
                </div>
              ) : (
                <div className="space-y-2">
                  {day.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-3 rounded-lg border transition-all ${
                        task.status === 'completed'
                          ? 'bg-success/5 border-success/30'
                          : 'bg-card hover:bg-muted/50 active:bg-muted/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 md:gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-1">
                            <Clock className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs md:text-sm font-medium">
                              {formatTime(task.scheduled_start)} - {formatTime(task.scheduled_end)}
                            </span>
                            <Badge className={`${getStatusColor(task.status)} text-[10px] md:text-xs`} variant="secondary">
                              {getStatusLabel(task.status)}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-sm md:text-base truncate">{task.task.title}</h4>
                          {task.is_collaborative && task.collaborator && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Users className="w-3 h-3" />
                              <span className="truncate">Con {task.collaborator.full_name}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                          {task.status !== 'completed' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedTask(task);
                                  setRescheduleModalOpen(true);
                                }}
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                className="h-8 w-8 p-0"
                                onClick={() => handleMarkComplete(task.id)}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Modal de reprogramación */}
      {selectedTask && (
        <RescheduleModal
          open={rescheduleModalOpen}
          onOpenChange={setRescheduleModalOpen}
          task={selectedTask}
          userId={userId}
          weekStart={weekStart}
          onRescheduleComplete={() => {
            fetchSchedule();
            setRescheduleModalOpen(false);
            setSelectedTask(null);
          }}
        />
      )}
    </>
  );
};

export default WeeklyAgenda;
