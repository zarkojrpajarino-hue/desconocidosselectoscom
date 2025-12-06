import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  className?: string;
}

export function FloatingActionButton({
  onClick,
  icon = <Plus className="w-6 h-6" />,
  label,
  className,
}: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        'fixed z-40 shadow-lg shadow-primary/25',
        'h-14 rounded-full transition-all duration-200',
        'active:scale-95 touch-manipulation',
        'md:hidden',
        // Position above bottom nav
        'bottom-20 right-4 mb-safe',
        label ? 'px-5 gap-2' : 'w-14 p-0',
        className
      )}
    >
      {icon}
      {label && <span className="font-medium">{label}</span>}
    </Button>
  );
}
