/**
 * @fileoverview Tipos para el sistema de integraciones
 */

export type IntegrationType = 
  | 'slack' 
  | 'hubspot' 
  | 'calendar'
  | 'outlook' 
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

export type PlanLevel = 'free' | 'starter' | 'professional' | 'enterprise';

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

// Configuración de integración
export interface IntegrationConfig {
  icon: React.ReactNode;
  label: string;
  colorClass: string;
  minPlan: PlanLevel;
  endpoint: string;
}

// Props del componente
export interface IntegrationButtonProps {
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
