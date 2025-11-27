import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Circle, TrendingUp } from 'lucide-react';

interface StatsCardsProps {
  userId: string | undefined;
  currentPhase: number | undefined;
  taskLimit: number | undefined;
}

const StatsCards = ({ userId, currentPhase, taskLimit }: StatsCardsProps) => {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    progress: 0
  });

  useEffect(() => {
    if (userId && currentPhase && taskLimit) {
      fetchStats();
    }
  }, [userId, currentPhase, taskLimit]);

  const fetchStats = async () => {
    if (!userId || !currentPhase || !taskLimit) return;

    // Limit tasks and stats to the current phase and the selected weekly task limit
    let tasksQuery = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('phase', currentPhase)
      .order('order_index');

    tasksQuery = tasksQuery.limit(taskLimit);

    const { data: tasks } = await tasksQuery;

    if (!tasks || tasks.length === 0) {
      setStats({ total: 0, completed: 0, pending: 0, progress: 0 });
      return;
    }

    const taskIds = tasks.map((t) => t.id);

    const { data: completions } = await supabase
      .from('task_completions')
      .select('*')
      .eq('user_id', userId)
      .in('task_id', taskIds);

    const total = tasks.length;
    const completed = completions?.length || 0;
    const pending = total - completed;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    setStats({ total, completed, pending, progress });
  };

  const statCards = [
    { label: 'Total Tareas', value: stats.total, icon: Circle, color: 'text-primary' },
    { label: 'Completadas', value: stats.completed, icon: CheckCircle2, color: 'text-success' },
    { label: 'Pendientes', value: stats.pending, icon: Circle, color: 'text-warning' },
    { label: 'Progreso', value: `${stats.progress}%`, icon: TrendingUp, color: 'text-accent' },
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