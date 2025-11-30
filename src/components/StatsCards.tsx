import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Circle, ListTodo, TrendingUp } from 'lucide-react';
import { useTasks, useTaskCompletions } from '@/hooks/useTasks';
import { calculatePercentage } from '@/lib/dateUtils';

interface StatsCardsProps {
  userId: string | undefined;
  currentPhase: number | undefined;
  organizationId: string | undefined;
  taskLimit: number | undefined;
}

const StatsCards = ({ userId, currentPhase, organizationId, taskLimit }: StatsCardsProps) => {
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(userId, currentPhase, organizationId, taskLimit);
  const { data: completions = new Map(), isLoading: completionsLoading } = useTaskCompletions(userId);

  const completed = tasks.filter(task => completions.has(task.id) && completions.get(task.id).validated_by_leader).length;
  const total = tasks.length;
  const pending = total - completed;
  const progress = calculatePercentage(completed, total);

  if (tasksLoading || completionsLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="shadow-card">
            <CardContent className="pt-4 md:pt-6">
              <div className="animate-pulse space-y-3">
                <div className="h-10 w-10 bg-muted rounded-full mx-auto"></div>
                <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                <div className="h-8 bg-muted rounded w-3/4 mx-auto"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    { label: 'Total Tareas', value: total, icon: ListTodo, color: 'text-primary' },
    { label: 'Completadas', value: completed, icon: CheckCircle2, color: 'text-success' },
    { label: 'Pendientes', value: pending, icon: Circle, color: 'text-warning' },
    { label: 'Progreso', value: `${progress}%`, icon: TrendingUp, color: 'text-accent' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="shadow-card hover:shadow-premium transition-shadow">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex flex-col items-center gap-2">
              <div className={`h-10 w-10 md:h-12 md:w-12 rounded-full bg-muted/50 flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div className="text-center">
                <p className="text-xs md:text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-xl md:text-3xl font-bold">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
