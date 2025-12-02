import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, AlertTriangle, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CountdownTimerProps {
  deadline: string;
  onTimeExpired?: (isExpired: boolean) => void;
}

const CountdownTimer = ({ deadline, onTimeExpired }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [hoursRemaining, setHoursRemaining] = useState(0);

  // Memoizar fecha de deadline (no recalcular en cada render)
  const deadlineDate = useMemo(() => new Date(deadline), [deadline]);

  // Memoizar fecha formateada
  const formattedDeadline = useMemo(() => {
    try {
      return format(deadlineDate, "EEEE d 'de' MMMM, HH:mm", { locale: es });
    } catch {
      return 'Fecha no válida';
    }
  }, [deadlineDate]);

  // useCallback para evitar recrear función en cada render
  const updateTimer = useCallback(() => {
    const now = new Date();
    const diff = deadlineDate.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeLeft('TIEMPO AGOTADO');
      setIsExpired(true);
      setHoursRemaining(0);
      onTimeExpired?.(true);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const totalHours = Math.floor(diff / (1000 * 60 * 60));

    setHoursRemaining(totalHours);
    setIsExpired(false);
    onTimeExpired?.(false);

    // Format in Spanish
    const parts: string[] = [];
    if (days > 0) parts.push(`${days} ${days === 1 ? 'día' : 'días'}`);
    if (hours > 0 || days > 0) parts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`);
    parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);

    setTimeLeft(parts.join(', '));
  }, [deadlineDate, onTimeExpired]);

  useEffect(() => {
    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [updateTimer]);

  // Memoizar estado visual para evitar recálculos innecesarios
  const visualState = useMemo(() => {
    if (isExpired) {
      return {
        bgClass: 'bg-destructive',
        textClass: 'text-destructive-foreground',
        icon: <Lock className="h-6 w-6" />,
        message: 'La semana ha terminado. Espera la próxima semana.',
        statusText: 'SEMANA CERRADA'
      };
    } else if (hoursRemaining < 48) {
      return {
        bgClass: 'bg-warning',
        textClass: 'text-warning-foreground',
        icon: <AlertTriangle className="h-6 w-6" />,
        message: null,
        statusText: 'Tiempo restante'
      };
    } else {
      return {
        bgClass: 'bg-gradient-primary',
        textClass: 'text-primary-foreground',
        icon: <Clock className="h-6 w-6" />,
        message: null,
        statusText: 'Tiempo restante'
      };
    }
  }, [isExpired, hoursRemaining]);

  return (
    <Card className={`shadow-card ${visualState.bgClass} ${visualState.textClass}`}>
      <CardContent className="py-4 md:py-6">
        <div className="flex flex-col items-center gap-2 md:gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            {visualState.icon}
            <div className="text-center">
              <p className="text-xs md:text-sm font-medium opacity-90">
                {visualState.statusText}
              </p>
              <p className={`text-xl md:text-3xl font-bold ${isExpired ? 'text-destructive-foreground' : ''}`}>
                {timeLeft}
              </p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs md:text-sm opacity-90 capitalize">
              Cierre: {formattedDeadline}
            </p>
            {visualState.message && (
              <p className="text-xs mt-2 opacity-90 font-medium">
                {visualState.message}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CountdownTimer;
