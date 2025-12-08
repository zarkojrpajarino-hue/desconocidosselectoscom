/**
 * @fileoverview Componentes UI reutilizables para integraciones
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { IntegrationType, IntegrationConfig } from './types';
import { getPlanDisplayName } from './IntegrationConfig';

interface IntegrationButtonUIProps {
  config: IntegrationConfig;
  targetType: Exclude<IntegrationType, 'all'>;
  loading: boolean;
  locked: boolean;
  label?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  className?: string;
  onClick: () => void;
}

export function IntegrationButtonUI({
  config,
  targetType,
  loading,
  locked,
  label,
  size = 'sm',
  variant = 'outline',
  className = '',
  onClick
}: IntegrationButtonUIProps) {
  const planName = getPlanDisplayName(config.minPlan);

  const buttonContent = (
    <>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : locked ? (
        <Lock className="h-4 w-4" />
      ) : (
        <span className={config.colorClass}>{config.icon}</span>
      )}
      <span className="ml-2">{label || config.label}</span>
    </>
  );

  if (locked) {
    return (
      <TooltipProvider key={targetType}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size={size} 
              variant={variant}
              className={className}
              disabled
            >
              {buttonContent}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Requiere plan {planName}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button 
      size={size} 
      variant={variant}
      className={className}
      onClick={onClick}
      disabled={loading}
    >
      {buttonContent}
    </Button>
  );
}

interface IntegrationDropdownItemProps {
  config: IntegrationConfig;
  targetType: Exclude<IntegrationType, 'all'>;
  locked: boolean;
  onClick: () => void;
}

export function IntegrationDropdownItem({
  config,
  targetType,
  locked,
  onClick
}: IntegrationDropdownItemProps) {
  const planName = getPlanDisplayName(config.minPlan);

  if (locked) {
    return (
      <TooltipProvider key={targetType}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 px-2 py-1.5 text-sm opacity-50 cursor-not-allowed">
              <Lock className="h-4 w-4" />
              <span>{config.label}</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {planName}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Requiere plan {planName}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <DropdownMenuItem key={targetType} onClick={onClick}>
      <span className={config.colorClass}>{config.icon}</span>
      <span className="ml-2">{config.label}</span>
    </DropdownMenuItem>
  );
}
