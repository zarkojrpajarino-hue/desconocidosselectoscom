import { useEffect } from 'react';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';

interface OnboardingTourProps {
  autoStart?: boolean;
}

export const OnboardingTour = ({ autoStart = false }: OnboardingTourProps) => {
  const { startTour, isTourCompleted } = useOnboardingTour();

  useEffect(() => {
    // Solo auto-iniciar si autoStart está activo Y no se ha completado antes
    if (autoStart && !isTourCompleted) {
      // Pequeño delay para asegurar que el DOM está listo
      const timer = setTimeout(() => {
        startTour();
      }, 500);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Ejecutar solo una vez al montar el componente

  return null;
};
