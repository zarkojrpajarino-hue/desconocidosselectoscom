/**
 * Overlay que se coloca sobre secciones bloqueadas
 * Muestra un blur y un mensaje de upgrade
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlanType, PLAN_NAMES } from '@/constants/subscriptionLimits';
import { PlanBadge } from './PlanBadge';
import { Button } from '@/components/ui/button';
import { Lock, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LockedFeatureOverlayProps {
  children: React.ReactNode;
  requiredPlan: PlanType;
  featureName: string;
  description?: string;
  onUpgrade?: () => void;
  className?: string;
  blurIntensity?: 'light' | 'medium' | 'heavy';
  showContent?: boolean;
}

export function LockedFeatureOverlay({
  children,
  requiredPlan,
  featureName,
  description,
  onUpgrade,
  className,
  blurIntensity = 'medium',
  showContent = true,
}: LockedFeatureOverlayProps) {
  const navigate = useNavigate();
  const planName = PLAN_NAMES[requiredPlan];

  const blurClasses = {
    light: 'backdrop-blur-[2px]',
    medium: 'backdrop-blur-sm',
    heavy: 'backdrop-blur-md',
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/#pricing');
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Content (potentially blurred) */}
      <div 
        className={cn(
          showContent ? 'opacity-40 pointer-events-none select-none' : 'opacity-0'
        )}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Overlay */}
      <div className={cn(
        'absolute inset-0 flex items-center justify-center',
        'bg-background/80',
        blurClasses[blurIntensity],
        'border-2 border-dashed border-border rounded-lg'
      )}>
        <div className="text-center px-6 py-8 max-w-md">
          {/* Lock icon */}
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>

          {/* Plan badge */}
          <div className="mb-3 flex justify-center">
            <PlanBadge plan={requiredPlan} />
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-foreground mb-2">
            {featureName}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground mb-4">
              {description}
            </p>
          )}

          {/* CTA */}
          <Button onClick={handleUpgrade} className="w-full max-w-xs">
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade a {planName}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Mensaje simple de feature bloqueada (sin overlay)
 */
interface SimpleLockedMessageProps {
  requiredPlan: PlanType;
  featureName: string;
  onUpgrade?: () => void;
  className?: string;
}

export function SimpleLockedMessage({
  requiredPlan,
  featureName,
  onUpgrade,
  className,
}: SimpleLockedMessageProps) {
  const navigate = useNavigate();
  const planName = PLAN_NAMES[requiredPlan];

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/#pricing');
    }
  };

  return (
    <div className={cn(
      'flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-dashed border-border',
      className
    )}>
      <div className="flex items-center gap-3">
        <Lock className="w-5 h-5 text-muted-foreground" />
        <div>
          <p className="font-medium text-sm">{featureName}</p>
          <p className="text-xs text-muted-foreground">
            Requiere plan {planName}
          </p>
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={handleUpgrade}>
        <Sparkles className="w-3 h-3 mr-1.5" />
        Upgrade
      </Button>
    </div>
  );
}
