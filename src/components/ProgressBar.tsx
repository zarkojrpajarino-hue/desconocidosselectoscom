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
    <Card className="shadow-card bg-gradient-to-r from-primary/5 to-success/5">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span className="font-semibold">Progreso de la Semana</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {percentage}%
            </span>
          </div>
          
          <Progress value={percentage} className="h-3" />
          
          <p className="text-sm text-muted-foreground text-center">
            {completedTasks} de {totalTasks} tareas completadas y validadas
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressBar;
