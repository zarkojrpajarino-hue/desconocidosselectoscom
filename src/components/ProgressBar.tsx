import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

interface ProgressBarProps {
  completedTasks: number;
  totalTasks: number;
}

const ProgressBar = ({ completedTasks, totalTasks }: ProgressBarProps) => {
  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Card className="shadow-card">
      <CardContent className="py-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="font-medium">Progreso Semanal</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {completedTasks}/{totalTasks} tareas
            </span>
          </div>
          <Progress value={percentage} className="h-3" />
          <p className="text-center text-sm text-muted-foreground">
            {percentage}% completado
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressBar;