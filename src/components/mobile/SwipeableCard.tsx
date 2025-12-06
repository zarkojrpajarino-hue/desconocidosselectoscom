import { useState, useRef, TouchEvent as ReactTouchEvent } from 'react';
import { cn } from '@/lib/utils';
import { Check, Trash2 } from 'lucide-react';

interface SwipeAction {
  icon?: React.ReactNode;
  label: string;
  className: string;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  className?: string;
  disabled?: boolean;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = {
    icon: <Trash2 className="w-5 h-5" />,
    label: 'Eliminar',
    className: 'bg-destructive text-destructive-foreground',
  },
  rightAction = {
    icon: <Check className="w-5 h-5" />,
    label: 'Completar',
    className: 'bg-primary text-primary-foreground',
  },
  className,
  disabled = false,
}: SwipeableCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const SWIPE_THRESHOLD = 80;
  const MAX_SWIPE = 120;

  const handleTouchStart = (e: ReactTouchEvent) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: ReactTouchEvent) => {
    if (!isSwiping || disabled) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startX.current;
    const diffY = currentY - startY.current;

    // Determine swipe direction on first significant move
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
        isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    // Only handle horizontal swipes
    if (isHorizontalSwipe.current) {
      e.preventDefault();
      const limitedDiff = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diffX));
      setTranslateX(limitedDiff);
    }
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    setIsSwiping(false);

    if (translateX < -SWIPE_THRESHOLD && onSwipeLeft) {
      setTranslateX(-200);
      setTimeout(() => {
        onSwipeLeft();
        setTranslateX(0);
      }, 150);
    } else if (translateX > SWIPE_THRESHOLD && onSwipeRight) {
      setTranslateX(200);
      setTimeout(() => {
        onSwipeRight();
        setTranslateX(0);
      }, 150);
    } else {
      setTranslateX(0);
    }
  };

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      {/* Background Actions */}
      <div className="absolute inset-0 flex items-center justify-between">
        {/* Left action (visible on right swipe) */}
        {onSwipeRight && (
          <div
            className={cn(
              'flex items-center gap-2 px-4 h-full rounded-l-lg transition-opacity',
              rightAction.className,
              translateX > 20 ? 'opacity-100' : 'opacity-0'
            )}
          >
            {rightAction.icon}
            <span className="text-sm font-medium">{rightAction.label}</span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right action (visible on left swipe) */}
        {onSwipeLeft && (
          <div
            className={cn(
              'flex items-center gap-2 px-4 h-full rounded-r-lg transition-opacity',
              leftAction.className,
              translateX < -20 ? 'opacity-100' : 'opacity-0'
            )}
          >
            <span className="text-sm font-medium">{leftAction.label}</span>
            {leftAction.icon}
          </div>
        )}
      </div>

      {/* Main Card */}
      <div
        className="relative bg-card touch-pan-y"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
