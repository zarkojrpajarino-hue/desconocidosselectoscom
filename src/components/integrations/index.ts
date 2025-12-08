/**
 * @fileoverview Barrel export para módulo de integraciones
 */

// Componente principal
export { IntegrationButton } from './IntegrationButton';

// UI Components
export { IntegrationButtonUI, IntegrationDropdownItem } from './IntegrationUI';

// Hooks
export { 
  useIntegrationAccess, 
  useAvailableIntegrations,
  useHasAllIntegrations,
  useHasAnyIntegration 
} from './useIntegrationAccess';

// Configuración
export { 
  INTEGRATION_CONFIG, 
  PLAN_ORDER,
  getIntegrationConfig,
  getAllIntegrationTypes,
  isValidIntegrationType,
  getPlanDisplayName
} from './IntegrationConfig';

// Handlers
export { 
  hasIntegrationAccess, 
  getIntegrationEndpoint, 
  prepareIntegrationBody,
  executeIntegration 
} from './IntegrationHandlers';

// Types
export type { 
  IntegrationType, 
  IntegrationAction,
  IntegrationData,
  IntegrationConfig,
  IntegrationButtonProps,
  PlanLevel,
  SlackNotifyData,
  HubSpotExportData,
  CalendarSyncData,
  AsanaTrelloExportData,
  ZapierWebhookData
} from './types';
