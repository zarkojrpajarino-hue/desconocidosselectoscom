# OPTIMUS-K Integrations API Documentation

## Resumen

Este documento describe las APIs de integración disponibles en OPTIMUS-K para conectar con servicios externos.

---

## Integraciones Disponibles

| Integración | Plan Mínimo | Tipo | Estado |
|------------|-------------|------|--------|
| Google Calendar | Starter | OAuth 2.0 | ✅ Producción |
| Slack | Professional | OAuth 2.0 + Webhooks | ✅ Producción |
| HubSpot | Professional | OAuth 2.0 | ✅ Producción |
| Outlook Calendar | Professional | OAuth 2.0 | ✅ Producción |
| Asana | Professional | API Key | ✅ Producción |
| Trello | Professional | API Key + Token | ✅ Producción |
| Zapier | Professional | Webhooks | ✅ Producción |

---

## Edge Functions

### HubSpot

#### `sync-to-hubspot`
Exporta leads de OPTIMUS-K a HubSpot.

```typescript
// Request
POST /functions/v1/sync-to-hubspot
{
  "organization_id": "uuid"
}

// Response
{
  "success": true,
  "synced": 15,
  "errors": 0
}
```

#### `import-from-hubspot`
Importa contactos de HubSpot a OPTIMUS-K.

```typescript
// Request
POST /functions/v1/import-from-hubspot
{
  "organization_id": "uuid",
  "limit": 100,
  "sync_deals": true
}

// Response
{
  "success": true,
  "imported": 50,
  "updated": 10,
  "skipped": 5
}
```

#### `hubspot-auth-url`
Genera URL de autorización OAuth para HubSpot.

```typescript
// Request
POST /functions/v1/hubspot-auth-url
{
  "organization_id": "uuid"
}

// Response
{
  "auth_url": "https://app.hubspot.com/oauth/authorize?..."
}
```

#### `hubspot-auth-callback`
Maneja callback OAuth de HubSpot.

```typescript
// Request (GET from HubSpot redirect)
GET /functions/v1/hubspot-auth-callback?code=xxx&state=org_id

// Response
Redirect to /settings/integrations?success=hubspot
```

---

### Slack

#### `slack-notify`
Envía notificación a canal de Slack.

```typescript
// Request
POST /functions/v1/slack-notify
{
  "organization_id": "uuid",
  "message": "📊 Nuevo lead registrado",
  "channel": "#sales" // opcional
}

// Response
{
  "success": true,
  "message_ts": "1234567890.123456"
}
```

#### `slack-commands`
Maneja comandos slash de Slack.

**Comandos disponibles:**
- `/optimusk help` - Muestra ayuda
- `/optimusk leads` - Resumen de leads
- `/optimusk tasks` - Tareas pendientes
- `/optimusk team` - Estadísticas del equipo
- `/optimusk report [daily|weekly]` - Reportes

```typescript
// Request (from Slack)
POST /functions/v1/slack-commands
{
  "command": "/optimusk",
  "text": "leads",
  "team_id": "T123456",
  "channel_id": "C123456"
}

// Response
{
  "response_type": "in_channel",
  "blocks": [...]
}
```

---

### Google Calendar

#### `google-auth-url`
Genera URL de autorización OAuth.

```typescript
// Request
POST /functions/v1/google-auth-url
{
  "user_id": "uuid"
}

// Response
{
  "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

#### `sync-calendar-events`
Exporta tareas programadas a Google Calendar.

```typescript
// Request
POST /functions/v1/sync-calendar-events
{
  "user_id": "uuid"
}

// Response
{
  "success": true,
  "synced": 8,
  "created": 3,
  "updated": 5
}
```

#### `import-calendar-events`
Importa eventos de Google Calendar como tareas.

```typescript
// Request
POST /functions/v1/import-calendar-events
{
  "user_id": "uuid",
  "days_ahead": 14
}

// Response
{
  "success": true,
  "imported": 12
}
```

---

### Outlook Calendar

#### `outlook-auth-url`
Genera URL de autorización Microsoft OAuth.

```typescript
// Request
POST /functions/v1/outlook-auth-url
{
  "user_id": "uuid"
}

// Response
{
  "auth_url": "https://login.microsoftonline.com/..."
}
```

#### `sync-outlook-events`
Sincroniza eventos con Outlook Calendar.

```typescript
// Request
POST /functions/v1/sync-outlook-events
{
  "user_id": "uuid"
}

// Response
{
  "success": true,
  "synced": 5
}
```

---

### Asana

#### `sync-to-asana`
Exporta tareas a Asana.

```typescript
// Request
POST /functions/v1/sync-to-asana
{
  "organization_id": "uuid",
  "task_id": "uuid" // opcional, para sync individual
}

// Response
{
  "success": true,
  "synced": 10
}
```

#### `sync-from-asana`
Importa tareas de Asana.

```typescript
// Request
POST /functions/v1/sync-from-asana
{
  "organization_id": "uuid",
  "limit": 50
}

// Response
{
  "success": true,
  "imported": 25,
  "updated": 5,
  "skipped": 3
}
```

---

### Trello

#### `sync-to-trello`
Exporta tareas como tarjetas de Trello.

```typescript
// Request
POST /functions/v1/sync-to-trello
{
  "organization_id": "uuid",
  "task_id": "uuid" // opcional
}

// Response
{
  "success": true,
  "synced": 8
}
```

#### `sync-from-trello`
Importa tarjetas de Trello como tareas.

```typescript
// Request
POST /functions/v1/sync-from-trello
{
  "organization_id": "uuid",
  "limit": 50
}

// Response
{
  "success": true,
  "imported": 15,
  "updated": 3,
  "skipped": 2
}
```

---

### Zapier

#### `trigger-webhook`
Dispara webhook de Zapier.

```typescript
// Request
POST /functions/v1/trigger-webhook
{
  "organization_id": "uuid",
  "event_type": "lead_created",
  "data": {
    "lead_id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}

// Response
{
  "success": true,
  "delivered": 3 // número de suscriptores notificados
}
```

**Eventos disponibles:**
- `lead_created` - Nuevo lead
- `lead_updated` - Lead actualizado
- `task_completed` - Tarea completada
- `deal_won` - Oportunidad ganada
- `deal_lost` - Oportunidad perdida

---

## Tablas de Base de Datos

### `hubspot_accounts`
Almacena conexiones HubSpot por organización.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | FK a organizations |
| access_token | text | Token encriptado |
| refresh_token | text | Refresh token encriptado |
| portal_id | text | ID del portal HubSpot |
| hub_domain | text | Dominio del hub |
| sync_enabled | boolean | Auto-sync activo |
| last_sync_at | timestamp | Última sincronización |

### `hubspot_contact_mappings`
Mapeo entre leads y contactos HubSpot.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | Primary key |
| hubspot_account_id | uuid | FK a hubspot_accounts |
| lead_id | uuid | FK a leads |
| hubspot_contact_id | text | ID en HubSpot |
| sync_status | text | active/error/partial |
| last_synced_at | timestamp | Última sync |

### `slack_workspaces`
Conexiones Slack por organización.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | FK a organizations |
| team_id | text | ID del workspace Slack |
| team_name | text | Nombre del workspace |
| access_token | text | Bot token encriptado |
| webhook_url | text | URL del webhook |
| enabled | boolean | Notificaciones activas |

### `external_task_mappings`
Mapeo de tareas con Asana/Trello.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | FK a organizations |
| task_id | uuid | FK a tasks |
| platform | text | asana/trello |
| external_id | text | ID externo |
| sync_status | text | Estado de sync |

### `asana_accounts`
Conexiones Asana.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | FK a organizations |
| access_token | text | Token encriptado |
| workspace_id | text | ID workspace Asana |
| project_id | text | ID proyecto destino |
| sync_enabled | boolean | Auto-sync activo |

### `trello_accounts`
Conexiones Trello.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | FK a organizations |
| api_key | text | API key |
| api_token | text | Token encriptado |
| board_id | text | ID del board |
| list_id | text | ID de la lista destino |
| sync_enabled | boolean | Auto-sync activo |

### `outlook_accounts`
Conexiones Outlook Calendar.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | FK a auth.users |
| access_token | text | Token encriptado |
| refresh_token | text | Refresh token |
| sync_enabled | boolean | Auto-sync activo |

### `zapier_subscriptions`
Suscripciones a webhooks de Zapier.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | Primary key |
| organization_id | uuid | FK a organizations |
| event_type | text | Tipo de evento |
| webhook_url | text | URL del Zap |
| is_active | boolean | Suscripción activa |

---

## Componentes UI

### `IntegrationHealthMetrics`
Muestra métricas de salud de todas las integraciones.

```tsx
import { IntegrationHealthMetrics } from '@/components/integrations';

<IntegrationHealthMetrics />
```

### `UnifiedSyncLog`
Historial unificado de sincronizaciones con filtros.

```tsx
import { UnifiedSyncLog } from '@/components/integrations';

<UnifiedSyncLog />
```

### `QuickActionsPanel`
Panel de acciones rápidas para sincronizar.

```tsx
import { QuickActionsPanel } from '@/components/integrations';

<QuickActionsPanel />
```

### `IntegrationStatusBadge`
Badge de estado de integración.

```tsx
import { IntegrationStatusBadge } from '@/components/integrations';

<IntegrationStatusBadge 
  status="active" 
  lastSync="2024-01-15T10:30:00Z"
  showTime
  size="sm"
/>
```

### `IntegrationSyncLog`
Log de sincronización por integración.

```tsx
import { IntegrationSyncLog } from '@/components/integrations';

<IntegrationSyncLog
  integrationTable="hubspot_contact_mappings"
  accountId="uuid"
  organizationId="uuid"
  title="Historial HubSpot"
  maxItems={10}
/>
```

---

## Hooks

### `useHubSpotIntegration`
```tsx
const {
  account,
  loading,
  connecting,
  syncing,
  importing,
  connect,
  disconnect,
  toggleSync,
  syncNow,
  importNow
} = useHubSpotIntegration(organizationId);
```

### `useSlackIntegration`
```tsx
const {
  workspace,
  loading,
  connecting,
  sending,
  connect,
  disconnect,
  toggleWorkspace,
  sendNotification,
  sendTestNotification
} = useSlackIntegration(organizationId);
```

### `useAsanaIntegration`
```tsx
const {
  account,
  loading,
  syncing,
  importing,
  connect,
  disconnect,
  toggleSync,
  syncTask,
  importTasks
} = useAsanaIntegration(organizationId);
```

### `useTrelloIntegration`
```tsx
const {
  account,
  loading,
  syncing,
  importing,
  connect,
  disconnect,
  toggleSync,
  syncTask,
  importCards
} = useTrelloIntegration(organizationId);
```

### `useOutlookIntegration`
```tsx
const {
  account,
  loading,
  connecting,
  syncing,
  connect,
  disconnect,
  toggleSync,
  syncNow
} = useOutlookIntegration();
```

### `useGoogleCalendarSync`
```tsx
const {
  tokens,
  isLoading,
  syncing,
  importing,
  syncAll,
  importEvents
} = useGoogleCalendarSync();
```

---

## Configuración de Secrets

Las siguientes variables de entorno son requeridas:

| Secret | Integración | Descripción |
|--------|-------------|-------------|
| `HUBSPOT_CLIENT_ID` | HubSpot | Client ID de la app OAuth |
| `HUBSPOT_CLIENT_SECRET` | HubSpot | Client Secret |
| `SLACK_CLIENT_ID` | Slack | Client ID de la app Slack |
| `SLACK_CLIENT_SECRET` | Slack | Client Secret |
| `GOOGLE_CLIENT_ID` | Google Calendar | Client ID de GCP |
| `GOOGLE_CLIENT_SECRET` | Google Calendar | Client Secret |
| `MICROSOFT_CLIENT_ID` | Outlook | Client ID de Azure AD |
| `MICROSOFT_CLIENT_SECRET` | Outlook | Client Secret |

---

## Seguridad

### Encriptación de Tokens
Todos los tokens OAuth se encriptan usando pgcrypto AES-256 antes de almacenarse.

```sql
-- Los tokens se encriptan automáticamente via trigger
INSERT INTO hubspot_accounts (access_token, ...)
VALUES ('raw_token', ...);
-- El token se guarda encriptado
```

### RLS Policies
Todas las tablas de integración tienen políticas RLS que:
- Restringen acceso por `organization_id`
- Permiten solo a miembros de la organización ver/modificar
- Los tokens solo son accesibles por el propietario

### Rate Limiting
- HubSpot: 100 requests/10 segundos
- Slack: 1 request/segundo por workspace
- Google: 10 requests/segundo por usuario

---

## Troubleshooting

### Error: "Token expired"
El token de acceso expiró. La integración intentará refrescar automáticamente. Si persiste, reconectar manualmente.

### Error: "Rate limit exceeded"
Demasiadas solicitudes. Esperar y reintentar.

### Error: "Invalid credentials"
Las credenciales OAuth son inválidas. Verificar secrets en Supabase.

### Error: "Workspace not found"
El workspace/proyecto externo fue eliminado o el acceso fue revocado.

---

## Changelog

### v2.0.0 (2024-12)
- ✅ Dashboard unificado de integraciones
- ✅ Métricas de salud por integración
- ✅ Historial unificado con filtros
- ✅ Acciones rápidas panel
- ✅ Importación bidireccional HubSpot
- ✅ Comandos Slack avanzados (/team, /report)
- ✅ Importación desde Asana/Trello
- ✅ Tests E2E para integraciones

### v1.0.0 (2024-11)
- Integración inicial con 7 plataformas
- OAuth flows para todas las integraciones
- Sincronización unidireccional
