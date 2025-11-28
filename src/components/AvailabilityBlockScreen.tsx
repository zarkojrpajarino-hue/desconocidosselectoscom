import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, AlertTriangle } from 'lucide-react';

interface AvailabilityBlockScreenProps {
  deadlineDate: Date;
  onConfigure: () => void;
}

const AvailabilityBlockScreen = ({ deadlineDate, onConfigure }: AvailabilityBlockScreenProps) => {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const diff = deadlineDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('¡Tiempo agotado!');
        setIsUrgent(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours < 2) {
        setIsUrgent(true);
      }

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeRemaining(`${days} día${days !== 1 ? 's' : ''}, ${hours % 24} hora${(hours % 24) !== 1 ? 's' : ''}`);
      } else {
        setTimeRemaining(`${hours} hora${hours !== 1 ? 's' : ''}, ${minutes} minuto${minutes !== 1 ? 's' : ''}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, [deadlineDate]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className={`max-w-2xl w-full ${isUrgent ? 'border-destructive border-2' : 'border-primary'}`}>
        <CardContent className="pt-12 pb-8 text-center space-y-6">
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${
            isUrgent ? 'bg-destructive/10' : 'bg-primary/10'
          }`}>
            {isUrgent ? (
              <AlertTriangle className="w-12 h-12 text-destructive" />
            ) : (
              <Calendar className="w-12 h-12 text-primary" />
            )}
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-2">
              {isUrgent ? '🚨 ¡Urgente!' : '⏰ Configura tu Agenda Primero'}
            </h2>
            <p className="text-muted-foreground text-lg">
              Debes completar tu disponibilidad horaria antes de acceder a tus tareas
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-center gap-2 text-lg">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">Deadline:</span>
              <span>
                {deadlineDate.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>

            <div className={`text-3xl font-bold ${isUrgent ? 'text-destructive' : 'text-primary'}`}>
              {timeRemaining}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left">
            <p className="font-semibold mb-2">📋 ¿Qué sucederá después?</p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>✅ Completas tu disponibilidad (5 minutos)</li>
              <li>🤖 La IA genera tu agenda coordinada (Lunes 13:01)</li>
              <li>📧 Recibes notificación cuando esté lista</li>
              <li>📅 Puedes revisar y ajustar hasta el Miércoles 13:29</li>
              <li>🚀 La semana comienza oficialmente el Miércoles 13:30</li>
            </ul>
          </div>

          <Button
            onClick={onConfigure}
            size="lg"
            className="w-full h-14 text-lg bg-gradient-primary"
          >
            🚀 Configurar mi Disponibilidad Ahora
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AvailabilityBlockScreen;
