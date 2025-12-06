// Types para el sistema de integraciones

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  scopes: string[];
  rate_limit: number;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface WebhookType {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  last_delivery_at: string | null;
  last_delivery_status: string | null;
  created_at: string;
}

export interface WebhookDelivery {
  id: string;
  event_type: string;
  status: string;
  http_status_code: number | null;
  response_time_ms: number | null;
  created_at: string;
}

export interface SlackWorkspace {
  id: string;
  team_id: string;
  team_name: string;
  enabled: boolean;
  total_messages_sent: number;
  last_message_at: string | null;
  created_at: string;
}

export interface SlackChannel {
  id: string;
  channel_id: string;
  channel_name: string;
  is_private: boolean;
}

export interface SlackEventMapping {
  id: string;
  event_type: string;
  channel_id: string;
  channel_name: string;
  enabled: boolean;
}

export interface ZapierSubscription {
  id: string;
  target_url: string;
  event_type: string;
  is_active: boolean;
  created_at: string;
}

export interface OutlookAccount {
  id: string;
  email: string;
  display_name: string | null;
  sync_enabled: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  created_at: string;
}

export interface HubSpotAccount {
  id: string;
  portal_id: string;
  hub_domain: string;
  sync_enabled: boolean;
  sync_direction: string;
  total_contacts_synced: number;
  total_deals_synced: number;
  last_sync_at: string | null;
  last_sync_status: string | null;
  created_at: string;
}

export interface AsanaAccount {
  id: string;
  workspace_id: string | null;
  workspace_name: string | null;
  project_id: string | null;
  project_name: string | null;
  sync_enabled: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  created_at: string;
}

export interface TrelloAccount {
  id: string;
  board_id: string | null;
  board_name: string | null;
  sync_enabled: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  created_at: string;
}

export const SLACK_EVENT_TYPES = [
  { value: 'lead.created', label: 'Nuevo Lead Creado', icon: '🎯' },
  { value: 'lead.won', label: 'Lead Ganado', icon: '🎉' },
  { value: 'task.completed', label: 'Tarea Completada', icon: '✅' },
  { value: 'okr.at_risk', label: 'OKR en Riesgo', icon: '⚠️' },
];

export const ZAPIER_EVENT_TYPES = [
  { value: 'lead.created', label: 'Nuevo Lead' },
  { value: 'lead.updated', label: 'Lead Actualizado' },
  { value: 'task.completed', label: 'Tarea Completada' },
  { value: 'okr.updated', label: 'OKR Actualizado' },
  { value: 'metric.created', label: 'Métrica Registrada' },
];

export const WEBHOOK_EVENT_TYPES = [
  { value: 'lead.created', label: 'Lead creado' },
  { value: 'lead.updated', label: 'Lead actualizado' },
  { value: 'lead.deleted', label: 'Lead eliminado' },
  { value: 'task.completed', label: 'Tarea completada' },
  { value: 'okr.updated', label: 'OKR actualizado' },
  { value: 'metric.created', label: 'Métrica registrada' }
];
