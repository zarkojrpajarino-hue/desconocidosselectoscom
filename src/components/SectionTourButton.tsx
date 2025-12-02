import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useSectionTour } from '@/hooks/useSectionTour';

interface SectionTourButtonProps {
  sectionId: string;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const SectionTourButton = ({ 
  sectionId, 
  variant = 'outline',
  size = 'sm'
}: SectionTourButtonProps) => {
  const { startSectionTour } = useSectionTour(sectionId);
  
  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={startSectionTour}
      className="gap-2"
    >
      <HelpCircle className="h-4 w-4" />
      ¿Cómo funciona?
    </Button>
  );
};
