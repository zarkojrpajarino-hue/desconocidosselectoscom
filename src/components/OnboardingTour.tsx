import { useEffect } from 'react';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';

interface OnboardingTourProps {
  autoStart?: boolean;
}

export const OnboardingTour = ({ autoStart = false }: OnboardingTourProps) => {
  const { startTour, isTourCompleted } = useOnboardingTour();

  useEffect(() => {
    if (autoStart && !isTourCompleted) {
      // Pequeño delay para asegurar que el DOM está completamente cargado
      const timer = setTimeout(() => {
        startTour();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [autoStart, isTourCompleted, startTour]);

  return null;
};
