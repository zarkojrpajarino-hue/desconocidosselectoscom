/**
 * Badge visual para mostrar el plan requerido de una feature
 * Usa tokens semánticos del design system
 */

import React from 'react';
import { PlanType } from '@/constants/subscriptionLimits';
import { cn } from '@/lib/utils';
import { Lock, Crown, Zap, Star, Sparkles } from 'lucide-react';

interface PlanBadgeProps {
  plan: PlanType;
  variant?: 'default' | 'compact' | 'icon-only';
  showIcon?: boolean;
  className?: string;
}

const planConfig = {
  trial: {
    label: 'TRIAL',
    icon: Sparkles,
    className: 'bg-muted text-muted-foreground border-border',
  },
  free: {
    label: 'FREE',
    icon: Sparkles,
    className: 'bg-muted text-muted-foreground border-border',
  },
  starter: {
    label: 'STARTER',
    icon: Star,
    className: 'bg-primary/10 text-primary border-primary/30',
  },
  professional: {
    label: 'PRO',
    icon: Zap,
    className: 'bg-accent/10 text-accent border-accent/30',
  },
  enterprise: {
    label: 'ENTERPRISE',
    icon: Crown,
    className: 'bg-warning/10 text-warning border-warning/30',
  },
};

export function PlanBadge({ 
  plan, 
  variant = 'default',
  showIcon = true,
  className 
}: PlanBadgeProps) {
  const config = planConfig[plan] || planConfig.free;
  const Icon = config.icon;

  if (variant === 'icon-only') {
    return (
      <div className={cn(
        'inline-flex items-center justify-center w-5 h-5 rounded',
        config.className,
        className
      )}>
        <Icon className="w-3 h-3" />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide',
        config.className,
        className
      )}>
        {showIcon && <Icon className="w-3 h-3" />}
        {config.label}
      </span>
    );
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border uppercase tracking-wide',
      config.className,
      className
    )}>
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      {config.label}
    </span>
  );
}

/**
 * Badge para mostrar que una feature está bloqueada
 */
interface LockedBadgeProps {
  requiredPlan: PlanType;
  variant?: 'default' | 'compact' | 'icon-only';
  className?: string;
}

export function LockedBadge({ 
  requiredPlan, 
  variant = 'default',
  className 
}: LockedBadgeProps) {
  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <Lock className="w-3 h-3 text-muted-foreground" />
      <PlanBadge plan={requiredPlan} variant={variant} showIcon={false} />
    </div>
  );
}

/**
 * Badge pequeño para items de navegación
 */
interface NavLockBadgeProps {
  requiredPlan: PlanType;
  className?: string;
}

export function NavLockBadge({ requiredPlan, className }: NavLockBadgeProps) {
  const config = planConfig[requiredPlan] || planConfig.professional;
  
  return (
    <span className={cn(
      'ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold',
      config.className,
      className
    )}>
      <Lock className="w-2.5 h-2.5" />
      {config.label}
    </span>
  );
}
