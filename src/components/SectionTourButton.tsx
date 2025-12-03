import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle, Play } from 'lucide-react';
import { useSectionTour } from '@/hooks/useSectionTour';

interface SectionTourButtonProps {
  sectionId: string;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  label?: string;
}

export const SectionTourButton = ({
  sectionId,
  variant = 'outline',
  size = 'sm',
  label = '¿Cómo funciona?'
}: SectionTourButtonProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const { startSectionTour } = useSectionTour(sectionId);
  
  const handleClick = async () => {
    setIsRunning(true);
    try {
      await startSectionTour();
    } finally {
      setIsRunning(false);
    }
  };
  
  return (
    <Button 
      variant={variant} 
      size={size}
      onClick={handleClick}
      disabled={isRunning}
      className="gap-2"
    >
      {isRunning ? (
        <>
          <Play className="h-4 w-4 animate-pulse" />
          Tour en proceso...
        </>
      ) : (
        <>
          <HelpCircle className="h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  );
};