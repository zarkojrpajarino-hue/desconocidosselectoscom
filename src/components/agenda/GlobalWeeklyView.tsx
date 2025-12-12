import React, { useMemo } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, Users, Building2, User, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useGlobalSchedule, type AgendaFilters, type GlobalScheduleSlot } from '@/hooks/useGlobalAgenda';

interface GlobalWeeklyViewProps {
  weekStart: string;
  filters: AgendaFilters;
}

export function GlobalWeeklyView({ weekStart, filters }: GlobalWeeklyViewProps) {
  const { data: schedule, isLoading, error } = useGlobalSchedule(weekStart, filters);

  const scheduleByDay = useMemo(() => {
    if (!schedule) return {};
    return schedule.reduce((acc, slot) => {
      const day = slot.scheduled_date;
      if (!acc[day]) acc[day] = [];
      acc[day].push(slot);
      return acc;
    }, {} as Record<string, GlobalScheduleSlot[]>);
  }, [schedule]);

  if (isLoading) return <WeeklyViewSkeleton />;

  if (error) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <p className="text-destructive">Error al cargar la agenda: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
      {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
        const date = addDays(new Date(weekStart), dayOffset);
        const dateKey = format(date, 'yyyy-MM-dd');
        const daySlots = scheduleByDay[dateKey] || [];
        const isToday = isSameDay(date, new Date());

        return (
          <DayColumn key={dateKey} date={date} slots={daySlots} isToday={isToday} />
        );
      })}
    </div>
  );
}

interface DayColumnProps {
  date: Date;
  slots: GlobalScheduleSlot[];
  isToday: boolean;
}

function DayColumn({ date, slots, isToday }: DayColumnProps) {
  const totalHours = slots.reduce((acc, slot) => {
    const start = new Date(`2000-01-01T${slot.scheduled_start}`);
    const end = new Date(`2000-01-01T${slot.scheduled_end}`);
    return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }, 0);

  return (
    <div className={`
      bg-card border rounded-lg p-3 min-h-[350px] transition-all
      ${isToday ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-border hover:border-muted-foreground/30'}
    `}>
      {/* Header */}
      <div className="mb-3 pb-2 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-xs font-medium uppercase tracking-wider ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
              {format(date, 'EEE', { locale: es })}
            </div>
            <div className={`text-xl font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
              {format(date, 'd')}
            </div>
          </div>
          {isToday && <Badge className="bg-primary text-primary-foreground text-xs">Hoy</Badge>}
        </div>

        {slots.length > 0 && (
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{totalHours.toFixed(1)}h</span>
            <span>•</span>
            <span>{slots.length} tarea{slots.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Tasks */}
      <div className="space-y-2">
        {slots.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs text-muted-foreground">Sin tareas</p>
          </div>
        ) : (
          slots.map((slot) => <TaskSlot key={slot.id} slot={slot} />)
        )}
      </div>
    </div>
  );
}

interface TaskSlotProps {
  slot: GlobalScheduleSlot;
}

function TaskSlot({ slot }: TaskSlotProps) {
  const isPersonal = slot.is_personal;
  const isCompleted = slot.status === 'completed';
  const isCollaborative = slot.is_collaborative;

  return (
    <div className={`
      p-2.5 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md
      ${isPersonal ? 'bg-primary/5 border-l-primary' : 'bg-secondary/30 border-l-accent'}
      ${isCompleted ? 'opacity-60' : ''}
    `}>
      {/* Time */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        <Clock className="w-3 h-3" />
        <span className="font-medium">
          {slot.scheduled_start.slice(0, 5)} - {slot.scheduled_end.slice(0, 5)}
        </span>
      </div>

      {/* Title */}
      <div className={`font-medium text-sm text-foreground mb-1 ${isCompleted ? 'line-through' : ''}`}>
        {slot.task_title}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {isPersonal ? (
          <Badge variant="outline" className="text-xs border-primary/50 text-primary">
            <User className="w-2.5 h-2.5 mr-1" />
            Personal
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs border-accent/50 text-accent-foreground">
            <Building2 className="w-2.5 h-2.5 mr-1" />
            {slot.organization_name || 'Org'}
          </Badge>
        )}

        {isCollaborative && (
          <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-600">
            <Users className="w-2.5 h-2.5 mr-1" />
            Colab
          </Badge>
        )}

        {isCompleted && (
          <Badge variant="outline" className="text-xs border-green-500/50 text-green-600">
            <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
            ✓
          </Badge>
        )}
      </div>
    </div>
  );
}

function WeeklyViewSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-lg p-3">
          <Skeleton className="h-10 mb-3" />
          <div className="space-y-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
