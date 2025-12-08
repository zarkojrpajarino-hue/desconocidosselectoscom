/**
 * @fileoverview IntegrationButton - Componente principal simplificado
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { IntegrationButtonProps, IntegrationType } from './types';
import { INTEGRATION_CONFIG } from './IntegrationConfig';
import { executeIntegration, hasIntegrationAccess } from './IntegrationHandlers';
import { IntegrationButtonUI, IntegrationDropdownItem } from './IntegrationUI';

export function IntegrationButton({ 
  type, 
  action, 
  data, 
  label, 
  size = 'sm',
  variant = 'outline',
  className = '',
  onSuccess,
  onError
}: IntegrationButtonProps) {
  const [loading, setLoading] = useState(false);
  const { plan } = useSubscriptionLimits();

  const handleAction = async (targetType: Exclude<IntegrationType, 'all'>) => {
    setLoading(true);
    await executeIntegration(targetType, action, data, plan, { onSuccess, onError });
    setLoading(false);
  };

  // Renderizar item para dropdown o botón individual
  const renderItem = (
    targetType: Exclude<IntegrationType, 'all'>,
    inDropdown: boolean = false
  ) => {
    const config = INTEGRATION_CONFIG[targetType];
    const locked = !hasIntegrationAccess(targetType, plan);

    if (inDropdown) {
      return (
        <IntegrationDropdownItem
          key={targetType}
          config={config}
          targetType={targetType}
          locked={locked}
          onClick={() => handleAction(targetType)}
        />
      );
    }

    return (
      <IntegrationButtonUI
        key={targetType}
        config={config}
        targetType={targetType}
        loading={loading}
        locked={locked}
        label={label}
        size={size}
        variant={variant}
        className={className}
        onClick={() => handleAction(targetType)}
      />
    );
  };

  // Si es "all", mostrar dropdown con todas las opciones
  if (type === 'all') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            size={size} 
            variant={variant}
            className={className}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            <span className="ml-2">{label || 'Exportar'}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {renderItem('slack', true)}
          {renderItem('hubspot', true)}
          {renderItem('calendar', true)}
          <DropdownMenuSeparator />
          {renderItem('asana', true)}
          {renderItem('trello', true)}
          <DropdownMenuSeparator />
          {renderItem('zapier', true)}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Botón individual
  return renderItem(type, false);
}
