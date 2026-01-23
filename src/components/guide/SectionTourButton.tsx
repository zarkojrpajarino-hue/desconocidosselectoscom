import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle, Play } from 'lucide-react';
import { useSectionTour } from '@/hooks/useSectionTour';
import { cn } from '@/lib/utils';

interface SectionTourButtonProps {
  sectionId: string;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  label?: string;
  className?: string;
}

export const SectionTourButton = ({
  sectionId,
  variant = 'outline',
  size = 'sm',
  label = '¿Cómo funciona?',
  className
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
      className={cn("gap-2", className)}
    >
      {isRunning ? (
        <>
          <Play className="h-4 w-4 animate-pulse" />
          <span className="hidden sm:inline">Tour...</span>
        </>
      ) : (
        <>
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </>
      )}
    </Button>
  );
};