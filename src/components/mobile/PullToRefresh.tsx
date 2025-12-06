import { useState, useRef, TouchEvent as ReactTouchEvent, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  disabled?: boolean;
}

export function PullToRefresh({
  children,
  onRefresh,
  className,
  disabled = false,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const TRIGGER_THRESHOLD = 80;
  const MAX_PULL = 120;

  const handleTouchStart = useCallback((e: ReactTouchEvent) => {
    if (disabled || isRefreshing) return;
    
    // Only start pull if at top of scroll
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: ReactTouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Apply resistance to pull
      const resistance = 0.4;
      const limitedPull = Math.min(MAX_PULL, diff * resistance);
      setPullDistance(limitedPull);
    }
  }, [isPulling, disabled, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled) return;

    setIsPulling(false);

    if (pullDistance >= TRIGGER_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(60); // Keep indicator visible during refresh
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, onRefresh, disabled]);

  const progress = Math.min(pullDistance / TRIGGER_THRESHOLD, 1);

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          'absolute left-0 right-0 flex items-center justify-center transition-opacity',
          'pointer-events-none z-10'
        )}
        style={{
          height: pullDistance,
          opacity: progress,
          top: 0,
        }}
      >
        <div className={cn(
          'w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center',
          'transition-transform'
        )}>
          {isRefreshing ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <ArrowDown 
              className={cn(
                "w-5 h-5 text-primary transition-transform",
                progress >= 1 && "rotate-180"
              )}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
