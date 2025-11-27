import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CountdownTimerProps {
  deadline: string;
}

const CountdownTimer = ({ deadline }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isUrgent: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isUrgent: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const difference = deadlineTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        // Check if less than 48 hours
        const totalHours = days * 24 + hours;
        const isUrgent = totalHours < 48;

        setTimeLeft({ days, hours, minutes, seconds, isUrgent });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isUrgent: false });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <div className="space-y-4">
      <Card className="shadow-premium bg-gradient-card border-2">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tiempo hasta deadline</p>
                <p className="text-2xl font-bold text-foreground">
                  {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {timeLeft.isUrgent && (
        <Alert variant="destructive" className="animate-pulse">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            ¡Atención! Quedan menos de 48 horas para el deadline. Asegúrate de completar tus tareas pendientes.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CountdownTimer;