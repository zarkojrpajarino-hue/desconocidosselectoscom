import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
interface ProgressBarProps {
  completedTasks: number;
  totalTasks: number;
}
const ProgressBar = ({
  completedTasks,
  totalTasks
}: ProgressBarProps) => {
  const percentage = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
  return;
};
export default ProgressBar;