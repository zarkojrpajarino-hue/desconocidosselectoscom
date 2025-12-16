# Guía de Configuración de Integraciones

## Requisitos Previos

Antes de configurar cualquier integración, asegúrate de:
1. Tener un plan Professional o superior
2. Ser administrador de la organización
3. Tener acceso a las consolas de desarrollador de cada plataforma

---

## 1. HubSpot

### Paso 1: Crear App en HubSpot
1. Ve a [HubSpot Developer Portal](https://developers.hubspot.com/)
2. Crea una nueva app privada
3. Configura los scopes:
   - `crm.objects.contacts.read`
   - `crm.objects.contacts.write`
   - `crm.objects.deals.read`
   - `crm.objects.deals.write`

### Paso 2: Configurar OAuth
1. En la app, ve a Auth > OAuth
2. Añade Redirect URI: `https://[TU_PROYECTO].supabase.co/functions/v1/hubspot-auth-callback`
3. Copia Client ID y Client Secret

### Paso 3: Configurar Secrets en Lovable
1. Ve a Lovable Cloud > Secrets
2. Añade:
   - `HUBSPOT_CLIENT_ID`
   - `HUBSPOT_CLIENT_SECRET`

### Paso 4: Conectar
1. En OPTIMUS-K, ve a Ajustes > Integraciones > HubSpot
2. Click "Conectar HubSpot"
3. Autoriza la aplicación

---

## 2. Slack

### Paso 1: Crear App en Slack
1. Ve a [Slack API](https://api.slack.com/apps)
2. Crea nueva app "From scratch"
3. Selecciona tu workspace

### Paso 2: Configurar Permisos
1. Ve a OAuth & Permissions
2. Añade Bot Token Scopes:
   - `chat:write`
   - `channels:read`
   - `commands`
   - `incoming-webhook`

### Paso 3: Configurar Slash Commands
1. Ve a Slash Commands
2. Crea comando `/optimusk`
3. Request URL: `https://[TU_PROYECTO].supabase.co/functions/v1/slack-commands`

### Paso 4: Configurar OAuth
1. Redirect URL: `https://[TU_PROYECTO].supabase.co/functions/v1/slack-auth-callback`
2. Copia Client ID y Client Secret

### Paso 5: Instalar y Conectar
1. Instala la app en tu workspace
2. Configura secrets en Lovable Cloud
3. Conecta desde OPTIMUS-K

---

## 3. Google Calendar

### Paso 1: Crear Proyecto en GCP
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea nuevo proyecto
3. Habilita Google Calendar API

### Paso 2: Configurar OAuth
1. Ve a APIs & Services > Credentials
2. Crea OAuth Client ID (Web application)
3. Añade Redirect URI: `https://[TU_PROYECTO].supabase.co/functions/v1/google-auth-callback`

### Paso 3: Configurar Consent Screen
1. Configura OAuth consent screen
2. Añade scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`

### Paso 4: Configurar Secrets
1. `GOOGLE_CLIENT_ID`
2. `GOOGLE_CLIENT_SECRET`

---

## 4. Microsoft Outlook

### Paso 1: Registrar App en Azure
1. Ve a [Azure Portal](https://portal.azure.com/)
2. Azure Active Directory > App registrations
3. Nueva registro

### Paso 2: Configurar Permisos
1. API permissions > Add permission
2. Microsoft Graph:
   - `Calendars.ReadWrite`
   - `User.Read`

### Paso 3: Configurar Authentication
1. Add platform > Web
2. Redirect URI: `https://[TU_PROYECTO].supabase.co/functions/v1/outlook-auth-callback`

### Paso 4: Crear Secret
1. Certificates & secrets > New client secret
2. Copia el valor (solo visible una vez)

### Paso 5: Configurar en Lovable
1. `MICROSOFT_CLIENT_ID` (Application ID)
2. `MICROSOFT_CLIENT_SECRET`

---

## 5. Asana

### Paso 1: Crear App
1. Ve a [Asana Developer Console](https://app.asana.com/0/developer-console)
2. Crea nueva app

### Paso 2: Configurar OAuth (opcional)
Para OAuth completo:
1. Redirect URI: `https://[TU_PROYECTO].supabase.co/functions/v1/asana-auth-callback`
2. Copia Client ID y Client Secret

### Paso 3: Alternativa: Personal Access Token
1. En Asana > My Settings > Apps > Personal Access Tokens
2. Crea nuevo token
3. Copia el token

### Paso 4: Conectar
1. En OPTIMUS-K, ingresa tu API key o conecta via OAuth
2. Selecciona workspace y proyecto destino

---

## 6. Trello

### Paso 1: Obtener API Key
1. Ve a [Trello Developer Portal](https://trello.com/power-ups/admin)
2. Copia tu API Key

### Paso 2: Generar Token
1. Visita: `https://trello.com/1/authorize?expiration=never&name=OPTIMUS-K&scope=read,write&response_type=token&key=[TU_API_KEY]`
2. Autoriza y copia el token

### Paso 3: Conectar
1. En OPTIMUS-K, ingresa API Key y Token
2. Selecciona board y lista destino

---

## 7. Zapier

### Configuración de Webhooks

Zapier funciona mediante webhooks internos. No requiere configuración externa.

### Crear un Zap
1. En Zapier, crea nuevo Zap
2. Trigger: Webhooks by Zapier > Catch Hook
3. Copia la URL del webhook
4. En OPTIMUS-K, ve a Ajustes > API > Webhooks
5. Añade la URL para los eventos deseados

### Eventos Disponibles
- `lead_created` - Cuando se crea un lead
- `lead_updated` - Cuando se actualiza un lead
- `task_completed` - Cuando se completa una tarea
- `deal_won` - Cuando se gana una oportunidad
- `deal_lost` - Cuando se pierde una oportunidad

---

## Verificación de Conexión

Después de configurar cada integración:

1. Ve al Dashboard de Integraciones
2. Verifica que el estado sea "Activa" (verde)
3. Prueba una sincronización manual
4. Revisa el historial de sync para confirmar

---

## Solución de Problemas Comunes

### "Error de autenticación"
- Verifica que los secrets estén correctamente configurados
- Regenera tokens si han expirado
- Confirma que los scopes/permisos sean correctos

### "Conexión rechazada"
- Verifica las URLs de redirect
- Confirma que la app esté instalada/autorizada
- Revisa los logs de Edge Functions

### "Sincronización fallida"
- Verifica límites de rate
- Confirma que el proyecto/board/workspace exista
- Revisa permisos de la cuenta conectada

---

## Soporte

¿Necesitas ayuda? Contacta a info@optimus-k.com
