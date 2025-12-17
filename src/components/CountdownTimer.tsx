import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Clock, AlertTriangle, Lock, HelpCircle, ChevronDown } from 'lucide-react';
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
  const [showExplanation, setShowExplanation] = useState(false);

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
          
          {/* Collapsible explanation */}
          <Collapsible open={showExplanation} onOpenChange={setShowExplanation} className="w-full mt-2">
            <CollapsibleTrigger className="flex items-center justify-center gap-1 text-xs opacity-80 hover:opacity-100 transition-opacity w-full">
              <HelpCircle className="w-3 h-3" />
              <span>¿Cómo funciona?</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showExplanation ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="bg-background/20 backdrop-blur-sm rounded-lg p-3 text-xs space-y-2 text-left">
                <p className="font-semibold">📅 Sistema de Ciclos Semanales</p>
                <ul className="space-y-1.5 pl-4">
                  <li className="list-disc">Cada semana comienza el <strong>miércoles a las 10:30</strong></li>
                  <li className="list-disc">Tienes hasta el <strong>miércoles siguiente a las 10:30</strong> para completar tus tareas</li>
                  <li className="list-disc">Si no completas tus tareas a tiempo, la semana se cierra y no puedes hacer más cambios</li>
                  <li className="list-disc">Tu disponibilidad debe estar configurada <strong>antes del lunes a las 13:00</strong></li>
                </ul>
                <p className="pt-1 opacity-90">
                  💡 Este sistema te permite planificar tu semana con anticipación y mantener un ritmo constante de trabajo.
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
};

export default CountdownTimer;
