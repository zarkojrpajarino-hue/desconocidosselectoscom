/**
 * Componente para mostrar prompts de upgrade en diferentes contextos
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlanType, PLAN_NAMES, PLAN_PRICES } from '@/constants/subscriptionLimits';
import { PlanBadge } from './PlanBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ArrowRight, Sparkles, TrendingUp, Crown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpgradePromptProps {
  targetPlan: PlanType;
  title?: string;
  subtitle?: string;
  features?: string[];
  onUpgrade?: () => void;
  onComparePlans?: () => void;
  className?: string;
  variant?: 'default' | 'sidebar' | 'banner' | 'card';
  showPrice?: boolean;
}

export function UpgradePrompt({
  targetPlan,
  title,
  subtitle,
  features = [],
  onUpgrade,
  onComparePlans,
  className,
  variant = 'default',
  showPrice = true,
}: UpgradePromptProps) {
  const navigate = useNavigate();
  const planName = PLAN_NAMES[targetPlan];
  const planPrice = PLAN_PRICES[targetPlan];

  const defaultTitle = title || `Desbloquea ${planName}`;
  const defaultSubtitle = subtitle || `Obtén acceso a funciones avanzadas`;

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/#pricing');
    }
  };

  const handleComparePlans = () => {
    if (onComparePlans) {
      onComparePlans();
    } else {
      navigate('/#pricing');
    }
  };

  // Variant: Sidebar (compacto para sidebar)
  if (variant === 'sidebar') {
    return (
      <div className={cn(
        'p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20',
        className
      )}>
        <div className="flex items-start gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-1">
              {defaultTitle}
            </h4>
            <p className="text-xs text-muted-foreground">
              {defaultSubtitle}
            </p>
          </div>
        </div>

        {features.length > 0 && (
          <ul className="space-y-1 mb-3">
            {features.slice(0, 3).map((feature, index) => (
              <li key={index} className="flex items-start gap-1.5 text-xs">
                <Check className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        )}

        <Button 
          onClick={handleUpgrade}
          size="sm"
          className="w-full"
        >
          <TrendingUp className="w-3 h-3 mr-1.5" />
          Upgrade
        </Button>
      </div>
    );
  }

  // Variant: Banner (horizontal para headers)
  if (variant === 'banner') {
    return (
      <div className={cn(
        'flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20',
        className
      )}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">{defaultTitle}</h4>
            <p className="text-xs text-muted-foreground">{defaultSubtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {showPrice && planPrice > 0 && (
            <span className="text-sm font-semibold text-foreground">
              €{planPrice}/mes
            </span>
          )}
          <Button onClick={handleUpgrade} size="sm">
            Upgrade
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // Variant: Card (para dashboards)
  if (variant === 'card') {
    return (
      <Card className={cn(
        'bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20',
        className
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">{defaultTitle}</CardTitle>
          </div>
          <CardDescription>{defaultSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          {features.length > 0 && (
            <ul className="space-y-2 mb-4">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          )}
          
          <div className="flex items-center gap-2">
            <Button onClick={handleUpgrade} className="flex-1">
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade a {planName}
            </Button>
            <Button variant="outline" onClick={handleComparePlans}>
              Comparar
            </Button>
          </div>
          
          {showPrice && planPrice > 0 && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              Desde €{planPrice}/mes
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Variant: Default (completo)
  return (
    <div className={cn(
      'p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20',
      className
    )}>
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center">
          <Crown className="w-8 h-8 text-primary" />
        </div>
        <PlanBadge plan={targetPlan} className="mb-2" />
        <h3 className="text-xl font-bold text-foreground mb-2">{defaultTitle}</h3>
        <p className="text-sm text-muted-foreground">{defaultSubtitle}</p>
      </div>

      {features.length > 0 && (
        <ul className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-primary" />
              </div>
              <span className="text-sm text-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3">
        <Button onClick={handleUpgrade} className="w-full" size="lg">
          <Sparkles className="w-4 h-4 mr-2" />
          Upgrade a {planName}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        
        <Button variant="ghost" onClick={handleComparePlans} className="w-full">
          Comparar todos los planes
        </Button>
      </div>
      
      {showPrice && planPrice > 0 && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          Desde <span className="font-semibold">€{planPrice}/mes</span>
        </p>
      )}
    </div>
  );
}
