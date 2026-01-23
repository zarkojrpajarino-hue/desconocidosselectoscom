import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { differenceInHours } from 'date-fns';

interface UrgentAlertProps {
  deadline: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: Array<{ title: string }>;
}

const UrgentAlert = ({ deadline, totalTasks, completedTasks, pendingTasks }: UrgentAlertProps) => {
  const [hoursRemaining, setHoursRemaining] = useState(0);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const checkUrgency = () => {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const hours = differenceInHours(deadlineDate, now);
      
      setHoursRemaining(hours);
      
      // Calculate pending percentage
      const pendingPercentage = totalTasks > 0 
        ? ((totalTasks - completedTasks) / totalTasks) * 100 
        : 0;
      
      // Show alert if: less than 48 hours AND more than 30% pending
      const shouldShow = hours < 48 && hours > 0 && pendingPercentage > 30;
      setShowAlert(shouldShow);
    };

    checkUrgency();
    const interval = setInterval(checkUrgency, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [deadline, totalTasks, completedTasks]);

  if (!showAlert) return null;

  const pendingCount = totalTasks - completedTasks;
  const firstThreeTasks = pendingTasks.slice(0, 3);

  return (
    <Alert 
      variant="destructive" 
      className="border-destructive bg-destructive text-destructive-foreground shadow-lg"
    >
      <AlertCircle className="h-5 w-5" />
      <AlertTitle className="text-lg font-bold flex items-center gap-2">
        🚨 URGENTE - Te quedan {pendingCount} tareas pendientes
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm font-semibold">
          ⏰ Quedan {hoursRemaining} horas para el cierre
        </p>
        {firstThreeTasks.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Tareas pendientes prioritarias:</p>
            <ul className="space-y-1 ml-4">
              {firstThreeTasks.map((task, index) => (
                <li key={index} className="text-sm list-disc">
                  {task.title}
                </li>
              ))}
            </ul>
            {pendingCount > 3 && (
              <p className="text-xs mt-2 opacity-90">
                Y {pendingCount - 3} tareas más...
              </p>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default UrgentAlert;
