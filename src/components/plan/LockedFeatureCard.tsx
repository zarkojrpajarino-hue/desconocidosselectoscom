/**
 * Card para mostrar features bloqueadas con CTA de upgrade
 * Usa tokens semánticos del design system
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlanType, PLAN_PRICES, PLAN_NAMES } from '@/constants/subscriptionLimits';
import { PlanBadge } from './PlanBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ArrowRight, Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LockedFeatureCardProps {
  icon?: string | React.ReactNode;
  title: string;
  description: string;
  requiredPlan: PlanType;
  features?: string[];
  onUpgrade?: () => void;
  className?: string;
  variant?: 'default' | 'compact' | 'inline';
}

export function LockedFeatureCard({
  icon,
  title,
  description,
  requiredPlan,
  features = [],
  onUpgrade,
  className,
  variant = 'default',
}: LockedFeatureCardProps) {
  const navigate = useNavigate();
  const planPrice = PLAN_PRICES[requiredPlan];
  const planName = PLAN_NAMES[requiredPlan];

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/#pricing');
    }
  };

  // Variant compact - más pequeño
  if (variant === 'compact') {
    return (
      <Card className={cn('border-2 border-dashed border-border bg-muted/30', className)}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {icon && (
              <div className="flex-shrink-0 text-2xl">
                {typeof icon === 'string' ? icon : icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm">{title}</h4>
                <PlanBadge plan={requiredPlan} variant="compact" />
              </div>
              <p className="text-xs text-muted-foreground mb-3">{description}</p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleUpgrade}
                className="w-full"
              >
                <Sparkles className="w-3 h-3 mr-1.5" />
                Desbloquear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Variant inline - para usar dentro de otras páginas
  if (variant === 'inline') {
    return (
      <div className={cn(
        'p-4 rounded-lg border-2 border-dashed border-border bg-muted/30 text-center',
        className
      )}>
        <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="font-medium text-sm">{title}</span>
          <PlanBadge plan={requiredPlan} variant="compact" />
        </div>
        <p className="text-xs text-muted-foreground mb-3">{description}</p>
        <Button size="sm" onClick={handleUpgrade}>
          Upgrade a {planName}
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    );
  }

  // Variant default - card completa
  return (
    <Card className={cn(
      'border-2 border-dashed border-border bg-gradient-to-br from-muted/50 to-muted/30 overflow-hidden',
      className
    )}>
      <CardHeader className="text-center pb-4">
        {/* Icon */}
        {icon && (
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-3xl">
            {typeof icon === 'string' ? icon : icon}
          </div>
        )}
        
        {/* Lock badge */}
        <div className="flex justify-center mb-2">
          <PlanBadge plan={requiredPlan} />
        </div>
        
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Features list */}
        {features.length > 0 && (
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {/* CTA */}
        <div className="pt-2 space-y-2">
          <Button 
            onClick={handleUpgrade}
            className="w-full"
            size="lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade a {planName}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          
          {planPrice > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              Desde €{planPrice}/mes
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
