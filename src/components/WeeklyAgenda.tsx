import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import RescheduleModal from './RescheduleModal';

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
    
    // Suscribirse a cambios en tiempo real
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
          console.log('Schedule updated, refreshing...');
          fetchSchedule();
        }
      )
      .subscribe();

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
          *,
          task:tasks(title, description, area),
          collaborator:users!task_schedule_collaborator_user_id_fkey(full_name, username)
        `)
        .eq('user_id', userId)
        .eq('week_start', weekStart)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_start', { ascending: true });

      if (error) throw error;

      // Agrupar por día
      const grouped = groupByDay(data || [], weekStart);
      setSchedule(grouped);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast.error('Error al cargar la agenda');
    } finally {
      setLoading(false);
    }
  };

  const groupByDay = (tasks: any[], weekStart: string): DaySchedule[] => {
    const weekStartDate = new Date(weekStart);
    const days: DaySchedule[] = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStartDate);
      currentDate.setDate(weekStartDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayName = DAYS_ES[currentDate.getDay()];

      const dayTasks = tasks.filter(t => t.scheduled_date === dateStr);

      days.push({
        date: dateStr,
        dayName,
        tasks: dayTasks,
      });
    }

    return days;
  };

  const handleAcceptTask = async (taskScheduleId: string) => {
    try {
      const { error } = await supabase
        .from('task_schedule')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', taskScheduleId);

      if (error) throw error;

      toast.success('✅ Tarea aceptada');

      // 🔄 Sincronizar con Google Calendar automáticamente
      try {
        await supabase.functions.invoke('sync-calendar-events', {
          body: { user_id: userId },
        });
        console.log('✅ Calendar synced after task acceptance');
      } catch (syncError) {
        console.error('Error syncing calendar:', syncError);
        // No mostrar error al usuario, es opcional
      }

      fetchSchedule();
    } catch (error) {
      console.error('Error accepting task:', error);
      toast.error('Error al aceptar tarea');
    }
  };

  const handleSuggestReschedule = (task: ScheduledTask) => {
    setSelectedTask(task);
    setRescheduleModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-success text-success-foreground">✅ Aceptada</Badge>;
      case 'rescheduling':
        return <Badge variant="outline" className="border-warning text-warning">🔄 Renegociando</Badge>;
      case 'locked':
        return <Badge variant="secondary">🔒 Bloqueada</Badge>;
      default:
        return <Badge variant="outline">⏳ Pendiente</Badge>;
    }
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:MM
  };

  const formatDate = (dateStr: string, dayName: string) => {
    const date = new Date(dateStr);
    return `${dayName} ${date.getDate()} ${date.toLocaleDateString('es-ES', { month: 'short' })}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando agenda...</p>
        </CardContent>
      </Card>
    );
  }

  if (schedule.every(day => day.tasks.length === 0)) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-lg">
            No tienes tareas programadas para esta semana
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Asegúrate de completar tu disponibilidad antes del Lunes 13:00
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                Mi Agenda Semanal
              </CardTitle>
              <CardDescription>
                Semana del {new Date(weekStart).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                {!isLocked && (
                  <span className="ml-2 text-warning">
                    ⚠️ Puedes ajustar hasta el Miércoles 13:29
                  </span>
                )}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSchedule}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {schedule.map((day) => (
            <div key={day.date} className="space-y-3">
              {/* Header del día */}
              <div className="flex items-center gap-2 pb-2 border-b">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    📍 {formatDate(day.date, day.dayName)}
                  </h3>
                  {day.tasks.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {day.tasks.length} tarea{day.tasks.length !== 1 ? 's' : ''} programada{day.tasks.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Tareas del día */}
              {day.tasks.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg">
                  Sin tareas programadas
                </div>
              ) : (
                <div className="space-y-3">
                  {day.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`border rounded-lg p-4 transition-all ${
                        task.status === 'accepted'
                          ? 'bg-success/5 border-success/20'
                          : task.status === 'locked'
                          ? 'bg-muted/50 border-muted'
                          : 'bg-card hover:shadow-md'
                      }`}
                    >
                      {/* Título y horario */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="font-semibold text-primary">
                              {formatTime(task.scheduled_start)} - {formatTime(task.scheduled_end)}
                            </span>
                          </div>
                          <h4 className="font-semibold text-lg">{task.task.title}</h4>
                        </div>
                        {getStatusBadge(task.status)}
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 mb-3">
                        {task.task.area && (
                          <Badge variant="secondary" className="text-xs">
                            {task.task.area}
                          </Badge>
                        )}
                        {task.is_collaborative && task.collaborator && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Con {task.collaborator.full_name}
                          </Badge>
                        )}
                      </div>

                      {/* Descripción */}
                      {task.task.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {task.task.description}
                        </p>
                      )}

                      {/* Botones de acción */}
                      {!isLocked && task.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptTask(task.id)}
                            className="flex-1 bg-success hover:bg-success/90"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Aceptar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSuggestReschedule(task)}
                            className="flex-1"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Sugerir otra hora
                          </Button>
                        </div>
                      )}

                      {task.status === 'rescheduling' && (
                        <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mt-3">
                          <div className="flex items-center gap-2 text-sm text-warning-foreground">
                            <AlertCircle className="w-4 h-4" />
                            <span>Esperando confirmación de nuevo horario...</span>
                          </div>
                        </div>
                      )}
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
