import { CheckCircle2, ListTodo, Target, Flame } from 'lucide-react';
import { useTasks, useTaskCompletions } from '@/hooks/useTasks';
import { calculatePercentage } from '@/lib/dateUtils';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsCardsProps {
  userId: string | undefined;
  currentPhase: number | undefined;
  organizationId: string | undefined;
  taskLimit: number | undefined;
  remainingSwaps?: number;
  swapLimit?: number;
}

const StatsCards = ({ userId, currentPhase, organizationId, taskLimit, remainingSwaps = 0, swapLimit = 3 }: StatsCardsProps) => {
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(userId, currentPhase, organizationId, taskLimit);
  const { data: completions = new Map(), isLoading: completionsLoading } = useTaskCompletions(userId, organizationId);

  const completed = tasks.filter(task => completions.has(task.id) && completions.get(task.id).validated_by_leader).length;
  const total = tasks.length;
  const pending = total - completed;
  const progress = calculatePercentage(completed, total);

  // Calcular completadas hoy
  const today = new Date().toDateString();
  const completedToday = Array.from(completions.values()).filter(c => 
    c.validated_by_leader && new Date(c.completed_at).toDateString() === today
  ).length;

  if (tasksLoading || completionsLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <StatCard
        variant="success"
        size="md"
        value={completedToday}
        label="Tareas Hoy"
        change={`${completed} esta semana`}
        trend={completedToday > 0 ? "up" : "neutral"}
        icon={<CheckCircle2 className="w-5 h-5 text-success" />}
        className="animate-fade-in"
      />
      
      <StatCard
        variant="primary"
        size="md"
        value={`${progress}%`}
        label="Progreso Semanal"
        change={`${completed}/${total} tareas`}
        trend={progress > 50 ? "up" : progress > 25 ? "neutral" : "down"}
        icon={<Target className="w-5 h-5 text-primary" />}
        className="animate-fade-in"
        style={{ animationDelay: '100ms' }}
      />
      
      <StatCard
        variant="info"
        size="md"
        value={pending}
        label="Pendientes"
        change={`Fase ${currentPhase || 1}`}
        trend="neutral"
        icon={<ListTodo className="w-5 h-5 text-info" />}
        className="animate-fade-in"
        style={{ animationDelay: '200ms' }}
      />
      
      <StatCard
        variant="warning"
        size="md"
        value={remainingSwaps}
        label="Swaps Restantes"
        change={`de ${swapLimit} totales`}
        trend={remainingSwaps > 2 ? "up" : remainingSwaps > 0 ? "neutral" : "down"}
        icon={<Flame className="w-5 h-5 text-warning" />}
        className="animate-fade-in"
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
};

export default StatsCards;
