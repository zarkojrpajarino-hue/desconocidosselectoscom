/**
 * @fileoverview Lógica de negocio para integraciones
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  IntegrationType, 
  IntegrationAction, 
  IntegrationData,
  CalendarSyncData 
} from './types';
import { INTEGRATION_CONFIG, PLAN_ORDER, getPlanDisplayName } from './IntegrationConfig';

export function hasIntegrationAccess(
  type: Exclude<IntegrationType, 'all'>, 
  plan: string
): boolean {
  const config = INTEGRATION_CONFIG[type];
  const currentPlanLevel = PLAN_ORDER[plan] ?? 0;
  const requiredPlanLevel = PLAN_ORDER[config.minPlan] ?? 0;
  return currentPlanLevel >= requiredPlanLevel;
}

export function getIntegrationEndpoint(
  type: Exclude<IntegrationType, 'all'>, 
  action: IntegrationAction
): string {
  const config = INTEGRATION_CONFIG[type];
  
  // Para HubSpot, cambiar endpoint si es import
  if (type === 'hubspot' && action === 'import') {
    return 'sync-from-hubspot';
  }
  
  return config.endpoint;
}

export function prepareIntegrationBody(
  type: Exclude<IntegrationType, 'all'>,
  action: IntegrationAction,
  data: IntegrationData
): IntegrationData {
  switch (type) {
    case 'zapier':
      return {
        ...data,
        event_type: action
      };
    
    case 'calendar':
      return data as CalendarSyncData;
    
    default:
      return data;
  }
}

export async function executeIntegration(
  type: Exclude<IntegrationType, 'all'>,
  action: IntegrationAction,
  data: IntegrationData,
  plan: string,
  callbacks?: {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  }
): Promise<boolean> {
  const config = INTEGRATION_CONFIG[type];
  
  // Validar acceso
  if (!hasIntegrationAccess(type, plan)) {
    const planName = getPlanDisplayName(config.minPlan);
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
    return false;
  }

  try {
    const endpoint = getIntegrationEndpoint(type, action);
    const body = prepareIntegrationBody(type, action, data);

    const { data: result, error } = await supabase.functions.invoke(endpoint, {
      body
    });

    if (error) throw error;

    const resultMessage = result && typeof result === 'object' && 'message' in result 
      ? result.message 
      : 'Operación completada exitosamente';
    
    toast.success(`✓ ${config.label} actualizado correctamente`, {
      description: resultMessage
    });
    
    callbacks?.onSuccess?.();
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : `Error al conectar con ${config.label}`;
    
    toast.error(errorMessage, {
      description: 'Por favor, verifica la configuración en Settings'
    });
    
    if (callbacks?.onError && error instanceof Error) {
      callbacks.onError(error);
    }
    return false;
  }
}
