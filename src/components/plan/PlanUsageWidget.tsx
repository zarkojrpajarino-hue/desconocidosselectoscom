/**
 * Widget para mostrar el uso actual vs límites del plan
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanUsageWidgetProps {
  label: string;
  current: number;
  limit: number; // -1 para ilimitado
  onUpgrade?: () => void;
  className?: string;
  showUpgradeAt?: number; // Porcentaje para mostrar CTA (default: 80)
  variant?: 'default' | 'compact' | 'minimal';
}

export function PlanUsageWidget({
  label,
  current,
  limit,
  onUpgrade,
  className,
  showUpgradeAt = 80,
  variant = 'default',
}: PlanUsageWidgetProps) {
  const navigate = useNavigate();
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min(100, (current / limit) * 100);
  const remaining = isUnlimited ? Infinity : Math.max(0, limit - current);
  const shouldShowUpgrade = !isUnlimited && percentage >= showUpgradeAt;

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/#pricing');
    }
  };

  // Determinar color según porcentaje usando tokens semánticos
  const getColorClass = () => {
    if (isUnlimited) return 'text-primary';
    if (percentage >= 90) return 'text-destructive';
    if (percentage >= 75) return 'text-warning';
    return 'text-primary';
  };

  const getProgressClass = () => {
    if (isUnlimited) return 'bg-primary';
    if (percentage >= 90) return 'bg-destructive';
    if (percentage >= 75) return 'bg-warning';
    return 'bg-primary';
  };

  // Variant: Minimal (solo barra)
  if (variant === 'minimal') {
    return (
      <div className={cn('space-y-1', className)}>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className={cn('font-medium', getColorClass())}>
            {isUnlimited ? 'Ilimitado' : `${current.toLocaleString()}/${limit.toLocaleString()}`}
          </span>
        </div>
        {!isUnlimited && (
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn('h-full transition-all duration-300', getProgressClass())}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  // Variant: Compact
  if (variant === 'compact') {
    return (
      <div className={cn('p-3 rounded-lg border bg-card', className)}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{label}</span>
          <span className={cn('text-sm font-bold', getColorClass())}>
            {isUnlimited ? '∞' : `${current.toLocaleString()}/${limit.toLocaleString()}`}
          </span>
        </div>
        
        {!isUnlimited && (
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn('h-full transition-all duration-300', getProgressClass())}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
        
        {shouldShowUpgrade && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleUpgrade}
            className="w-full mt-2 h-7 text-xs"
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            Aumentar límite
          </Button>
        )}
      </div>
    );
  }

  // Variant: Default
  return (
    <Card className={cn(
      shouldShowUpgrade && 'border-warning/50 bg-warning/5',
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-medium text-sm">{label}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isUnlimited 
                ? 'Sin límites en tu plan actual'
                : `${remaining.toLocaleString()} restantes este mes`
              }
            </p>
          </div>
          <div className="text-right">
            <span className={cn('text-lg font-bold', getColorClass())}>
              {isUnlimited ? '∞' : `${current.toLocaleString()}`}
            </span>
            {!isUnlimited && (
              <span className="text-sm text-muted-foreground">
                /{limit.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {!isUnlimited && (
          <div className="space-y-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn('h-full transition-all duration-300', getProgressClass())}
                style={{ width: `${percentage}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {percentage.toFixed(0)}% utilizado
              </span>
              {percentage >= 90 && (
                <span className="flex items-center gap-1 text-destructive font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  Casi al límite
                </span>
              )}
            </div>
          </div>
        )}

        {shouldShowUpgrade && (
          <Button 
            onClick={handleUpgrade}
            className="w-full mt-3"
            size="sm"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Aumentar límite
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Grid de widgets de uso
 */
interface UsageItem {
  label: string;
  current: number;
  limit: number;
}

interface PlanUsageGridProps {
  items: UsageItem[];
  onUpgrade?: () => void;
  className?: string;
}

export function PlanUsageGrid({ items, onUpgrade, className }: PlanUsageGridProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-3', className)}>
      {items.map((item, index) => (
        <PlanUsageWidget
          key={index}
          label={item.label}
          current={item.current}
          limit={item.limit}
          onUpgrade={onUpgrade}
          variant="compact"
        />
      ))}
    </div>
  );
}
