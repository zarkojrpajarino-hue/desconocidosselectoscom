import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiEffectProps {
  trigger: boolean;
  type?: 'task' | 'badge' | 'celebration';
}

const ConfettiEffect = ({ trigger, type = 'task' }: ConfettiEffectProps) => {
  useEffect(() => {
    if (!trigger) return;

    switch (type) {
      case 'task':
        // Confetti moderado al completar tarea
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef'],
        });
        break;

      case 'badge':
        // Confetti espectacular al ganar badge
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#FFD700', '#FFA500', '#FF6347'],
          });
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#FFD700', '#FFA500', '#FF6347'],
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();
        break;

      case 'celebration':
        // Confetti masivo para celebraciones especiales
        confetti({
          particleCount: 200,
          spread: 160,
          origin: { y: 0.5 },
          startVelocity: 45,
          colors: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#FFD700'],
        });
        break;
    }
  }, [trigger, type]);

  return null;
};

export default ConfettiEffect;
