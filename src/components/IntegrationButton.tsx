// src/components/IntegrationButton.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Link2, 
  Calendar, 
  ListTodo, 
  LayoutDashboard, 
  Zap,
  ExternalLink,
  Loader2,
  Lock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ==========================================
// TIPOS ESPECÍFICOS (NO "any")
// ==========================================

export type IntegrationType = 
  | 'slack' 
  | 'hubspot' 
  | 'calendar' 
  | 'asana' 
  | 'trello' 
  | 'zapier' 
  | 'all';

export type IntegrationAction = 
  | 'export' 
  | 'import' 
  | 'sync' 
  | 'share' 
  | 'notify';

// Tipos específicos por integración
export interface SlackNotifyData {
  message: string;
  channel?: string;
  lead_id?: string;
  task_id?: string;
  metric_id?: string;
  okr_id?: string;
}

export interface HubSpotExportData {
  lead_id?: string;
  lead_ids?: string[];
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  estimated_value?: number;
  probability?: number;
  action?: 'single' | 'bulk_export';
  lead?: {
    id: string;
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    estimated_value?: number;
    probability?: number;
  };
}

export interface CalendarSyncData {
  task_id: string;
  action?: 'create' | 'update' | 'delete';
  event?: {
    title: string;
    description?: string;
    start_date: string;
    duration_minutes?: number;
  };
}

export interface AsanaTrelloExportData {
  task_id?: string;
  task_ids?: string[];
  title: string;
  description?: string;
  due_date?: string;
}

export interface ZapierWebhookData {
  event_type: string;
  [key: string]: string | number | boolean | undefined;
}

// Unión de todos los tipos de data
export type IntegrationData = 
  | SlackNotifyData 
  | HubSpotExportData 
  | CalendarSyncData 
  | AsanaTrelloExportData 
  | ZapierWebhookData;

// ==========================================
// CONFIGURACIÓN DE INTEGRACIONES
// ==========================================

type PlanLevel = 'free' | 'starter' | 'professional' | 'enterprise';

interface IntegrationConfig {
  icon: React.ReactNode;
  label: string;
  colorClass: string;
  minPlan: PlanLevel;
  endpoint: string;
}

const INTEGRATION_CONFIG: Record<Exclude<IntegrationType, 'all'>, IntegrationConfig> = {
  slack: {
    icon: <MessageSquare className="h-4 w-4" />,
    label: 'Slack',
    colorClass: 'text-blue-400',
    minPlan: 'professional',
    endpoint: 'slack-notify'
  },
  hubspot: {
    icon: <Link2 className="h-4 w-4" />,
    label: 'HubSpot',
    colorClass: 'text-orange-500',
    minPlan: 'professional',
    endpoint: 'sync-to-hubspot'
  },
  calendar: {
    icon: <Calendar className="h-4 w-4" />,
    label: 'Calendario',
    colorClass: 'text-blue-500',
    minPlan: 'starter',
    endpoint: 'sync-calendar-events'
  },
  asana: {
    icon: <ListTodo className="h-4 w-4" />,
    label: 'Asana',
    colorClass: 'text-rose-500',
    minPlan: 'professional',
    endpoint: 'sync-to-asana'
  },
  trello: {
    icon: <LayoutDashboard className="h-4 w-4" />,
    label: 'Trello',
    colorClass: 'text-sky-600',
    minPlan: 'professional',
    endpoint: 'sync-to-trello'
  },
  zapier: {
    icon: <Zap className="h-4 w-4" />,
    label: 'Zapier',
    colorClass: 'text-orange-600',
    minPlan: 'professional',
    endpoint: 'trigger-webhook'
  }
};

// ==========================================
// PROPS DEL COMPONENTE
// ==========================================

interface IntegrationButtonProps {
  type: IntegrationType;
  action: IntegrationAction;
  data: IntegrationData;
  label?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

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

  // Orden de planes para validación
  const planOrder: Record<string, number> = {
    'free': 0,
    'trial': 0,
    'starter': 1,
    'professional': 2,
    'enterprise': 3
  };

  // Validación de plan
  const hasAccess = (integrationType: Exclude<IntegrationType, 'all'>): boolean => {
    const config = INTEGRATION_CONFIG[integrationType];
    const currentPlanLevel = planOrder[plan] ?? 0;
    const requiredPlanLevel = planOrder[config.minPlan] ?? 0;
    
    return currentPlanLevel >= requiredPlanLevel;
  };

  // Obtener endpoint según tipo y acción
  const getEndpoint = (targetType: Exclude<IntegrationType, 'all'>): string => {
    const config = INTEGRATION_CONFIG[targetType];
    
    // Para HubSpot, cambiar endpoint si es import
    if (targetType === 'hubspot' && action === 'import') {
      return 'sync-from-hubspot';
    }
    
    return config.endpoint;
  };

  // Preparar body según tipo
  const prepareBody = (targetType: Exclude<IntegrationType, 'all'>, inputData: IntegrationData) => {
    switch (targetType) {
      case 'zapier':
        return {
          ...inputData,
          event_type: action
        };
      
      case 'calendar':
        return inputData as CalendarSyncData;
      
      default:
        return inputData;
    }
  };

  // Handle de acción
  const handleAction = async (targetType: Exclude<IntegrationType, 'all'>) => {
    // Validar acceso
    if (!hasAccess(targetType)) {
      const config = INTEGRATION_CONFIG[targetType];
      const planName = config.minPlan === 'professional' ? 'Professional' : 
                       config.minPlan === 'enterprise' ? 'Enterprise' : 'Starter';
      toast.error(
        `${config.label} requiere plan ${planName}`,
        {
          description: 'Actualiza tu plan para usar esta integración',
          action: {
            label: 'Ver planes',
            onClick: () => window.location.href = '/pricing'
          }
        }
      );
      return;
    }

    setLoading(true);
    
    try {
      const endpoint = getEndpoint(targetType);
      const body = prepareBody(targetType, data);

      const { data: result, error } = await supabase.functions.invoke(endpoint, {
        body
      });

      if (error) throw error;

      const config = INTEGRATION_CONFIG[targetType];
      const resultMessage = result && typeof result === 'object' && 'message' in result 
        ? result.message 
        : 'Operación completada exitosamente';
      
      toast.success(`✓ ${config.label} actualizado correctamente`, {
        description: resultMessage
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const config = INTEGRATION_CONFIG[targetType];
      const errorMessage = error instanceof Error ? error.message : `Error al conectar con ${config.label}`;
      
      toast.error(errorMessage, {
        description: 'Por favor, verifica la configuración en Settings'
      });
      
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Renderizar botón con lock si no tiene acceso
  const renderButton = (
    targetType: Exclude<IntegrationType, 'all'>, 
    config: IntegrationConfig,
    inDropdown: boolean = false
  ) => {
    const locked = !hasAccess(targetType);

    const buttonContent = (
      <>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : locked ? (
          <Lock className="h-4 w-4" />
        ) : (
          <span className={config.colorClass}>{config.icon}</span>
        )}
        {!inDropdown && (
          <span className="ml-2">{label || config.label}</span>
        )}
      </>
    );

    if (locked) {
      const planName = config.minPlan === 'professional' ? 'Pro' : 
                       config.minPlan === 'enterprise' ? 'Enterprise' : 'Starter';
      
      return (
        <TooltipProvider key={targetType}>
          <Tooltip>
            <TooltipTrigger asChild>
              {inDropdown ? (
                <div className="flex items-center gap-2 px-2 py-1.5 text-sm opacity-50 cursor-not-allowed">
                  <Lock className="h-4 w-4" />
                  <span>{config.label}</span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {planName}
                  </Badge>
                </div>
              ) : (
                <Button 
                  size={size} 
                  variant={variant}
                  className={className}
                  disabled
                >
                  {buttonContent}
                </Button>
              )}
            </TooltipTrigger>
            <TooltipContent>
              <p>Requiere plan {planName}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return inDropdown ? (
      <DropdownMenuItem key={targetType} onClick={() => handleAction(targetType)}>
        <span className={config.colorClass}>{config.icon}</span>
        <span className="ml-2">{config.label}</span>
      </DropdownMenuItem>
    ) : (
      <Button 
        size={size} 
        variant={variant}
        className={className}
        onClick={() => handleAction(targetType)}
        disabled={loading}
      >
        {buttonContent}
      </Button>
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
          {renderButton('slack', INTEGRATION_CONFIG.slack, true)}
          {renderButton('hubspot', INTEGRATION_CONFIG.hubspot, true)}
          {renderButton('calendar', INTEGRATION_CONFIG.calendar, true)}
          <DropdownMenuSeparator />
          {renderButton('asana', INTEGRATION_CONFIG.asana, true)}
          {renderButton('trello', INTEGRATION_CONFIG.trello, true)}
          <DropdownMenuSeparator />
          {renderButton('zapier', INTEGRATION_CONFIG.zapier, true)}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Botón individual
  const config = INTEGRATION_CONFIG[type];
  return renderButton(type, config, false);
}

// ==========================================
// EXPORT HELPER HOOKS
// ==========================================

/**
 * Hook para verificar si el usuario tiene acceso a una integración
 */
export function useIntegrationAccess(type: Exclude<IntegrationType, 'all'>): boolean {
  const { plan } = useSubscriptionLimits();
  
  const config = INTEGRATION_CONFIG[type];
  
  const planOrder: Record<string, number> = {
    'free': 0,
    'trial': 0,
    'starter': 1,
    'professional': 2,
    'enterprise': 3
  };

  return (planOrder[plan] ?? 0) >= (planOrder[config.minPlan] ?? 0);
}

/**
 * Hook para obtener todas las integraciones disponibles para el usuario
 */
export function useAvailableIntegrations() {
  const { plan } = useSubscriptionLimits();
  
  const available: Exclude<IntegrationType, 'all'>[] = [];
  const locked: Exclude<IntegrationType, 'all'>[] = [];

  const planOrder: Record<string, number> = {
    'free': 0,
    'trial': 0,
    'starter': 1,
    'professional': 2,
    'enterprise': 3
  };

  Object.entries(INTEGRATION_CONFIG).forEach(([key]) => {
    const integrationType = key as Exclude<IntegrationType, 'all'>;
    const config = INTEGRATION_CONFIG[integrationType];

    if ((planOrder[plan] ?? 0) >= (planOrder[config.minPlan] ?? 0)) {
      available.push(integrationType);
    } else {
      locked.push(integrationType);
    }
  });

  return { available, locked };
}
