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
  const {
    startSectionTour
  } = useSectionTour(sectionId);
  return;
};