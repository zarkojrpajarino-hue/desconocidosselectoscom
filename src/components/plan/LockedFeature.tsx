/**
 * LOCKED FEATURE CARD - Componente Universal
 * ✅ CORREGIDO: Tokens semánticos para dark mode
 * ✅ CORREGIDO: Sin colores hardcodeados
 * ✅ CORREGIDO: Soporte i18n opcional
 */

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Sparkles, Zap, Rocket, Crown, Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PlanType } from '@/constants/subscriptionLimits';
import { cn } from '@/lib/utils';

interface LockedFeatureProps {
  // Identificación
  featureName: string;
  featureId?: string;
  
  // Descripción del valor
  description: string;
  detailedDescription?: string;
  
  // Beneficios (puntos clave de valor)
  benefits?: string[];
  
  // Casos de uso (ejemplos concretos)
  useCases?: string[];
  
  // Plan requerido
  requiredPlan: PlanType;
  
  // Visual
  icon?: React.ReactNode;
  variant?: 'card' | 'inline' | 'banner';
  size?: 'sm' | 'md' | 'lg';
  
  // Comportamiento
  showUpgradeButton?: boolean;
  customUpgradeText?: string;
  onUpgradeClick?: () => void;
  
  // Estilo
  className?: string;
}

// ✅ CORREGIDO: Tokens semánticos en vez de colores hardcodeados
const PLAN_CONFIG = {
  free: {
    icon: Sparkles,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    borderColor: 'border-muted',
    badgeBg: 'bg-muted/50',
    name: 'Free',
  },
  trial: {
    icon: Sparkles,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
    badgeBg: 'bg-primary/10',
    name: 'Trial',
  },
  starter: {
    icon: Zap,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    name: 'Starter',
  },
  professional: {
    icon: Rocket,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-50 dark:bg-violet-950/30',
    borderColor: 'border-violet-200 dark:border-violet-800',
    badgeBg: 'bg-violet-50 dark:bg-violet-950/50',
    name: 'Professional',
  },
  enterprise: {
    icon: Crown,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/50',
    name: 'Enterprise',
  },
};

export function LockedFeature({
  featureName,
  description,
  detailedDescription,
  benefits,
  useCases,
  requiredPlan,
  icon,
  variant = 'card',
  size = 'md',
  showUpgradeButton = true,
  customUpgradeText,
  onUpgradeClick,
  className,
}: LockedFeatureProps) {
  const navigate = useNavigate();
  const config = PLAN_CONFIG[requiredPlan];
  const PlanIcon = config.icon;

  const handleUpgradeClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      navigate('/select-plan');
    }
  };

  // VARIANT: Inline (mini badge + tooltip)
  if (variant === 'inline') {
    return (
      <div className={cn('inline-flex items-center gap-2', className)}>
        <span className="text-muted-foreground">{featureName}</span>
        <Badge 
          variant="outline" 
          className={cn(
            'cursor-pointer hover:bg-accent transition-colors',
            config.borderColor
          )}
          onClick={handleUpgradeClick}
        >
          <Lock className="h-3 w-3 mr-1" />
          {config.name}
        </Badge>
      </div>
    );
  }

  // VARIANT: Banner (full-width, horizontal)
  if (variant === 'banner') {
    return (
      <div className={cn(
        'w-full rounded-lg border-2 p-4 flex items-center justify-between',
        config.borderColor,
        config.bgColor,
        className
      )}>
        <div className="flex items-start gap-4 flex-1">
          <div className={cn(
            'p-2 rounded-lg bg-background border',
            config.borderColor
          )}>
            {icon || <Lock className={cn('h-6 w-6', config.color)} />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{featureName}</h4>
              <Badge variant="secondary" className="text-xs">
                <PlanIcon className="h-3 w-3 mr-1" />
                {config.name}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {showUpgradeButton && (
          <Button onClick={handleUpgradeClick} className="ml-4">
            {customUpgradeText || 'Desbloquear'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    );
  }

  // VARIANT: Card (default, full card con detalles)
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
  };

  return (
    <Card className={cn(
      'relative overflow-hidden',
      sizeClasses[size],
      className
    )}>
      {/* Header stripe with plan color */}
      <div className={cn('absolute top-0 left-0 right-0 h-1', config.bgColor)} />
      
      <CardHeader className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            {/* Icon */}
            <div className={cn(
              'p-3 rounded-lg border-2 transition-all',
              config.bgColor,
              config.borderColor
            )}>
              {icon || <Lock className={cn('h-6 w-6', config.color)} />}
            </div>
            
            {/* Title */}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl mb-1 flex items-center gap-2">
                {featureName}
              </CardTitle>
              <CardDescription className="text-sm">
                {description}
              </CardDescription>
            </div>
          </div>

          {/* Plan badge */}
          <Badge 
            variant="secondary" 
            className={cn(
              'flex items-center gap-1.5 px-3 py-1',
              config.badgeBg,
              config.borderColor
            )}
          >
            <PlanIcon className="h-4 w-4" />
            <span className="font-semibold">{config.name}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Detailed description */}
        {detailedDescription && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {detailedDescription}
          </p>
        )}

        {/* Benefits */}
        {benefits && benefits.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Beneficios
            </h4>
            <ul className="space-y-2">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className={cn('h-4 w-4 mt-0.5 flex-shrink-0', config.color)} />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Use cases */}
        {useCases && useCases.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Casos de uso:</h4>
            <ul className="space-y-1.5">
              {useCases.map((useCase, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className={cn('text-lg leading-none', config.color)}>→</span>
                  <span>{useCase}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      {showUpgradeButton && (
        <CardFooter className={cn('border-t', config.bgColor)}>
          <Button 
            onClick={handleUpgradeClick} 
            className="w-full"
            size="lg"
          >
            {customUpgradeText || `Actualizar a ${config.name}`}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

// Variante compacta para usar en listas/grids
export function LockedFeatureCompact({
  featureName,
  description,
  requiredPlan,
  icon,
  onClick,
}: {
  featureName: string;
  description: string;
  requiredPlan: PlanType;
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  const config = PLAN_CONFIG[requiredPlan];
  const PlanIcon = config.icon;

  return (
    <Card 
      className={cn(
        'relative overflow-hidden cursor-pointer transition-all hover:shadow-md',
        'border-2 opacity-75 hover:opacity-100',
        config.borderColor
      )}
      onClick={onClick}
    >
      {/* Lock overlay indicator */}
      <div className="absolute top-2 right-2">
        <div className={cn('p-1.5 rounded-full', config.bgColor)}>
          <Lock className={cn('h-3 w-3', config.color)} />
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {icon && (
            <div className={cn('p-2 rounded-lg', config.bgColor)}>
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base mb-1">{featureName}</CardTitle>
            <CardDescription className="text-xs line-clamp-2">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardFooter className="pt-0">
        <Badge 
          variant="outline" 
          className={cn('text-xs', config.badgeBg, config.borderColor)}
        >
          <PlanIcon className="h-3 w-3 mr-1" />
          {config.name}
        </Badge>
      </CardFooter>
    </Card>
  );
}

export default LockedFeature;
