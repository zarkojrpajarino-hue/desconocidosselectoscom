# 🔧 CONFIGURACIONES MANUALES - HUBSPOT, ASANA, TRELLO

**Para completar durante SEMANA 2-3**

---

## 🟠 HUBSPOT - CONFIGURACIÓN WEBHOOKS (DÍA 8)

**Tiempo**: 30 minutos  
**Requiere**: Admin access a HubSpot Developer account

---

### PASO 1: Acceder a Developer Dashboard (5 min)

1. **Ve a**: https://developers.hubspot.com
2. **Login** con tu cuenta HubSpot
3. **Navega a**: Apps
4. **Selecciona** tu app OPTIMUS-K

---

### PASO 2: Configurar Webhooks (15 min)

1. **Sidebar izquierdo** → "Webhooks"
2. Click **"Create subscription"**

### Subscription #1: Contact Property Change
```
Event Type: contact.propertyChange
Target URL: https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/hubspot-webhook
Properties to watch:
  ✅ firstname
  ✅ lastname
  ✅ email
  ✅ phone
  ✅ company
  ✅ lifecyclestage
  ✅ hs_lead_status
```

Click **"Subscribe"**

---

### Subscription #2: Contact Creation
```
Event Type: contact.creation
Target URL: https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/hubspot-webhook
```

Click **"Subscribe"**

---

### Subscription #3: Deal Creation (opcional)
```
Event Type: deal.creation
Target URL: https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/hubspot-webhook
```

Click **"Subscribe"**

---

### PASO 3: Verificar Webhook Handler existe (5 min)

```bash
# En terminal
supabase functions list

# Debe mostrar:
# hubspot-webhook ✓
```

**Si NO existe**, necesitas crear:

```typescript
// supabase/functions/hubspot-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const events = await req.json();
  
  console.log('🪝 HubSpot webhook received:', events);
  
  for (const event of events) {
    if (event.subscriptionType === 'contact.propertyChange') {
      // Handle contact update
      await handleContactUpdate(event.objectId);
    } else if (event.subscriptionType === 'contact.creation') {
      // Handle new contact
      await handleContactCreation(event.objectId);
    }
  }
  
  return new Response('OK', { status: 200 });
});
```

---

### PASO 4: Testing (5 min)

1. **En HubSpot**, edita un contacto
2. **Ve a**: Supabase → Functions → hubspot-webhook → Logs
3. **Verifica**: Webhook llegó
4. **Ve a**: OPTIMUS-K → CRM Leads
5. **Verifica**: Lead actualizado

**✅ Si todo funciona**: HubSpot webhooks configurados

---

## 📋 ASANA - CONFIGURACIÓN WEBHOOKS (DÍA 11)

**Tiempo**: 20 minutos  
**Requiere**: Admin access a Asana Developer Console

---

### PASO 1: Acceder a Developer Console (5 min)

1. **Ve a**: https://app.asana.com/0/developer-console
2. **Login** con tu cuenta Asana
3. **Selecciona** tu app OPTIMUS-K

---

### PASO 2: Crear Webhook via API (10 min)

**Asana requiere crear webhooks por API, no por UI**

```bash
# En terminal local o en curl

curl https://app.asana.com/api/1.0/webhooks \
  -H "Authorization: Bearer YOUR_ASANA_PAT" \
  -H "Content-Type: application/json" \
  -d '{
    "resource": "PROJECT_GID",
    "target": "https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/asana-webhook"
  }'
```

**Donde**:
- `YOUR_ASANA_PAT`: Tu Personal Access Token
- `PROJECT_GID`: El GID del proyecto que quieres watch

---

### PASO 3: Obtener PROJECT_GID

1. **Abre tu proyecto** en Asana
2. **URL** será: `https://app.asana.com/0/PROJECT_GID/board`
3. **Copia** el PROJECT_GID

O vía API:
```bash
curl https://app.asana.com/api/1.0/projects \
  -H "Authorization: Bearer YOUR_ASANA_PAT"
```

---

### PASO 4: Verificar Webhook Handler (5 min)

```bash
# Verificar función existe
supabase functions list

# Debe mostrar:
# asana-webhook ✓
```

**Si NO existe**, crear:

```typescript
// supabase/functions/asana-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  // Handshake verification
  if (req.headers.get('x-hook-secret')) {
    const secret = req.headers.get('x-hook-secret');
    return new Response(null, {
      headers: { 'X-Hook-Secret': secret! },
      status: 200
    });
  }
  
  // Handle events
  const events = await req.json();
  console.log('🪝 Asana webhook:', events);
  
  for (const event of events.events) {
    if (event.action === 'changed') {
      await handleTaskUpdate(event.resource.gid);
    } else if (event.action === 'added') {
      await handleTaskCreation(event.resource.gid);
    }
  }
  
  return new Response('OK', { status: 200 });
});
```

---

### PASO 5: Testing

1. **En Asana**, edita una tarea del proyecto watched
2. **Ve a**: Supabase Logs
3. **Verifica**: Webhook llegó
4. **Ve a**: OPTIMUS-K Tasks
5. **Verifica**: Tarea actualizada

---

## 📊 TRELLO - CONFIGURACIÓN WEBHOOKS (DÍA 12)

**Tiempo**: 20 minutos  
**Requiere**: Admin access a Trello

---

### PASO 1: Obtener Board ID (5 min)

1. **Abre tu board** en Trello
2. **URL** será: `https://trello.com/b/BOARD_ID/board-name`
3. **Copia** el BOARD_ID

O añade `.json` al URL para ver JSON:
```
https://trello.com/b/BOARD_ID/board-name.json
```

---

### PASO 2: Crear Webhook via API (10 min)

```bash
curl -X POST "https://api.trello.com/1/webhooks" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "YOUR_TRELLO_API_KEY",
    "token": "YOUR_TRELLO_TOKEN",
    "idModel": "BOARD_ID",
    "callbackURL": "https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/trello-webhook",
    "description": "OPTIMUS-K Webhook"
  }'
```

**Donde**:
- `YOUR_TRELLO_API_KEY`: Tu API Key (de Trello Settings)
- `YOUR_TRELLO_TOKEN`: Tu Token
- `BOARD_ID`: El ID del board

---

### PASO 3: Verificar Webhook creado

```bash
curl "https://api.trello.com/1/tokens/YOUR_TOKEN/webhooks?key=YOUR_API_KEY"
```

Debe retornar tu webhook con status `active`.

---

### PASO 4: Verificar Handler (5 min)

```typescript
// supabase/functions/trello-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  // HEAD request = verification
  if (req.method === 'HEAD') {
    return new Response(null, { status: 200 });
  }
  
  // Handle webhook
  const webhook = await req.json();
  console.log('🪝 Trello webhook:', webhook);
  
  if (webhook.action.type === 'updateCard') {
    await handleCardUpdate(webhook.action.data.card.id);
  } else if (webhook.action.type === 'createCard') {
    await handleCardCreation(webhook.action.data.card.id);
  }
  
  return new Response('OK', { status: 200 });
});
```

---

### PASO 5: Testing

1. **En Trello**, mueve una card
2. **Ve a**: Supabase Logs
3. **Verifica**: Webhook llegó
4. **Ve a**: OPTIMUS-K Tasks
5. **Verifica**: Tarea actualizada

---

## 📋 CHECKLIST FINAL - TODAS LAS CONFIGS

### Slack (DÍA 6):
- [ ] 6 slash commands creados
- [ ] OAuth scopes configurados
- [ ] Redirect URL añadida
- [ ] App reinstalada
- [ ] Secrets verificados en Supabase
- [ ] Comandos responden en Slack

### HubSpot (DÍA 8):
- [ ] 3 webhooks subscriptions creados
- [ ] Target URL correcta
- [ ] Handler desplegado
- [ ] Testing OK

### Asana (DÍA 11):
- [ ] Webhook creado vía API
- [ ] PROJECT_GID correcto
- [ ] Handler desplegado
- [ ] Handshake verification OK
- [ ] Testing OK

### Trello (DÍA 12):
- [ ] Webhook creado vía API
- [ ] BOARD_ID correcto
- [ ] Handler desplegado
- [ ] HEAD verification OK
- [ ] Testing OK

---

## 🐛 TROUBLESHOOTING COMÚN

### HubSpot: "Subscription failed"
```
Solución:
1. Verificar Target URL es HTTPS
2. Verificar endpoint responde 200
3. Verificar app tiene permisos correctos
4. Reinstalar app si necesario
```

### Asana: "Invalid hook secret"
```
Solución:
1. En webhook handler, debe responder con X-Hook-Secret header
2. El valor debe ser exactamente el recibido
3. Verificar en logs que handshake ocurre
```

### Trello: "Webhook not active"
```
Solución:
1. Verificar callbackURL es HTTPS
2. Verificar endpoint responde 200 a HEAD request
3. Re-crear webhook si necesario
```

---

## ✅ CUANDO TODO ESTÉ CONFIGURADO

**Tendrás**:
- ✅ 6 comandos de Slack funcionando
- ✅ HubSpot webhooks en tiempo real
- ✅ Asana webhooks en tiempo real
- ✅ Trello webhooks en tiempo real
- ✅ Sync bidireccional automático

**Resultado**: Sistema de integraciones empresarial 🚀

---

## 💡 TIPS FINALES

1. **Webhooks tardan en activarse**: Dale 5 minutos después de crear
2. **Guarda los IDs**: Anota todos los IDs de webhooks creados
3. **Monitorea logs**: Primeras 24h chequea logs frecuentemente
4. **Documenta**: Toma screenshots de cada configuración
5. **Backup**: Exporta configuraciones importantes

---

**Tiempo total de configuración**: ~2 horas  
**Una vez hecho**: ¡Nunca más! 🎉

**Buena suerte** 🚀
