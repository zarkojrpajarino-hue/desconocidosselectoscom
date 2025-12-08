/**
 * @fileoverview Re-export del módulo de integraciones para compatibilidad
 * @deprecated Importar directamente desde '@/components/integrations'
 */

export { 
  IntegrationButton,
  useIntegrationAccess,
  useAvailableIntegrations
} from './integrations';

export type {
  IntegrationType,
  IntegrationAction,
  IntegrationData,
  SlackNotifyData,
  HubSpotExportData,
  CalendarSyncData,
  AsanaTrelloExportData,
  ZapierWebhookData
} from './integrations';
