// src/components/BackButton.tsx
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  to?: string;
  label?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  className?: string;
}

export const BackButton = ({ 
  to, 
  label = 'Volver', 
  variant = 'ghost',
  className = ''
}: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/');
      }
    }
  };

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleClick}
      className={`gap-2 ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
};