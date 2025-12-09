import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface ResponsiveCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  compact?: boolean;
  hoverable?: boolean;
  onClick?: () => void;
}

/**
 * Card que se adapta automáticamente a móvil con padding y bordes apropiados
 */
export function ResponsiveCard({
  title,
  description,
  children,
  footer,
  className,
  compact = false,
  hoverable = false,
  onClick,
}: ResponsiveCardProps) {
  const isMobile = useIsMobile();

  return (
    <Card
      className={cn(
        // Padding responsivo
        isMobile ? (compact ? 'p-3' : 'p-4') : (compact ? 'p-4' : 'p-6'),
        // Bordes responsivos
        isMobile ? 'rounded-lg' : 'rounded-xl',
        // Hover effect
        hoverable && 'cursor-pointer hover:shadow-lg transition-shadow',
        // Touch feedback en móvil
        onClick && isMobile && 'active:scale-[0.98] transition-transform',
        className
      )}
      onClick={onClick}
    >
      {(title || description) && (
        <CardHeader className={isMobile ? 'p-0 pb-3' : 'p-0 pb-4'}>
          {title && (
            <CardTitle className={isMobile ? 'text-base' : 'text-lg'}>
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className={isMobile ? 'text-xs' : 'text-sm'}>
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}

      <CardContent className="p-0">
        {children}
      </CardContent>

      {footer && (
        <CardFooter className={cn(
          'p-0',
          isMobile ? 'pt-3' : 'pt-4'
        )}>
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}

type TrendType = 'up' | 'down' | 'neutral';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: React.ElementType;
  trend?: TrendType;
  trendLabel?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * Card para estadísticas con valor grande y label
 * Usa tokens semánticos para colores de tendencia
 */
export function StatsCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  className,
  onClick,
}: StatsCardProps) {
  const isMobile = useIsMobile();

  // Tokens semánticos en lugar de colores hardcoded
  const trendColors: Record<TrendType, string> = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-destructive',
    neutral: 'text-muted-foreground',
  };

  return (
    <ResponsiveCard
      compact
      hoverable={!!onClick}
      onClick={onClick}
      className={cn('flex flex-col justify-between min-h-[100px]', className)}
    >
      <div className="flex items-start justify-between mb-2">
        <span className={cn(
          'text-muted-foreground font-medium',
          isMobile ? 'text-xs' : 'text-sm'
        )}>
          {label}
        </span>
        {Icon && (
          <div className="p-1.5 rounded-md bg-primary/10">
            <Icon className={cn(
              'text-primary',
              isMobile ? 'w-4 h-4' : 'w-5 h-5'
            )} />
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <span className={cn(
          'font-bold',
          isMobile ? 'text-xl' : 'text-2xl'
        )}>
          {value}
        </span>

        {trend && trendLabel && (
          <span className={cn(
            'text-xs font-medium',
            trendColors[trend]
          )}>
            {trendLabel}
          </span>
        )}
      </div>
    </ResponsiveCard>
  );
}

interface ActionCardProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  onClick: () => void;
  className?: string;
  variant?: 'default' | 'primary' | 'muted';
}

/**
 * Card clickeable para acciones rápidas
 */
export function ActionCard({
  icon: Icon,
  title,
  description,
  onClick,
  className,
  variant = 'default',
}: ActionCardProps) {
  const isMobile = useIsMobile();

  const iconBgVariants = {
    default: 'bg-primary/10',
    primary: 'bg-primary',
    muted: 'bg-muted',
  };

  const iconColorVariants = {
    default: 'text-primary',
    primary: 'text-primary-foreground',
    muted: 'text-muted-foreground',
  };

  return (
    <ResponsiveCard
      hoverable
      onClick={onClick}
      className={cn('touch-manipulation', className)}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'rounded-lg flex items-center justify-center',
          iconBgVariants[variant],
          isMobile ? 'p-2 min-w-[40px] min-h-[40px]' : 'p-3 min-w-[48px] min-h-[48px]'
        )}>
          <Icon className={cn(
            iconColorVariants[variant],
            isMobile ? 'w-5 h-5' : 'w-6 h-6'
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'font-semibold truncate',
            isMobile ? 'text-sm' : 'text-base'
          )}>
            {title}
          </h3>
          {description && (
            <p className={cn(
              'text-muted-foreground truncate',
              isMobile ? 'text-xs' : 'text-sm'
            )}>
              {description}
            </p>
          )}
        </div>
      </div>
    </ResponsiveCard>
  );
}
