/**
 * @fileoverview Hooks para control de acceso a integraciones
 */

import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import type { IntegrationType } from './types';
import { INTEGRATION_CONFIG, PLAN_ORDER } from './IntegrationConfig';

/**
 * Hook para verificar si el usuario tiene acceso a una integración
 */
export function useIntegrationAccess(type: Exclude<IntegrationType, 'all'>): boolean {
  const { plan } = useSubscriptionLimits();
  const config = INTEGRATION_CONFIG[type];
  return (PLAN_ORDER[plan] ?? 0) >= (PLAN_ORDER[config.minPlan] ?? 0);
}

/**
 * Hook para obtener todas las integraciones disponibles para el usuario
 */
export function useAvailableIntegrations() {
  const { plan } = useSubscriptionLimits();
  
  const available: Exclude<IntegrationType, 'all'>[] = [];
  const locked: Exclude<IntegrationType, 'all'>[] = [];

  Object.entries(INTEGRATION_CONFIG).forEach(([key]) => {
    const integrationType = key as Exclude<IntegrationType, 'all'>;
    const config = INTEGRATION_CONFIG[integrationType];

    if ((PLAN_ORDER[plan] ?? 0) >= (PLAN_ORDER[config.minPlan] ?? 0)) {
      available.push(integrationType);
    } else {
      locked.push(integrationType);
    }
  });

  return { available, locked };
}

/**
 * Hook para verificar si el usuario tiene todas las integraciones especificadas
 */
export function useHasAllIntegrations(types: Exclude<IntegrationType, 'all'>[]): boolean {
  const { plan } = useSubscriptionLimits();
  
  return types.every(type => {
    const config = INTEGRATION_CONFIG[type];
    return (PLAN_ORDER[plan] ?? 0) >= (PLAN_ORDER[config.minPlan] ?? 0);
  });
}

/**
 * Hook para verificar si el usuario tiene al menos una de las integraciones
 */
export function useHasAnyIntegration(types: Exclude<IntegrationType, 'all'>[]): boolean {
  const { plan } = useSubscriptionLimits();
  
  return types.some(type => {
    const config = INTEGRATION_CONFIG[type];
    return (PLAN_ORDER[plan] ?? 0) >= (PLAN_ORDER[config.minPlan] ?? 0);
  });
}
