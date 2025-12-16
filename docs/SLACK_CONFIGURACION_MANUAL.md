# 📱 SLACK - CONFIGURACIÓN MANUAL PASO A PASO

**Tiempo estimado**: 30-45 minutos  
**Requisitos**: Acceso admin a tu Slack workspace

---

## 🎯 OBJETIVO

Configurar 6 Slash Commands para que funcionen con tu edge function.

---

## 📋 PREPARACIÓN (5 min)

### 1. Verifica que tu Edge Function está desplegada

```bash
# En terminal
supabase functions list

# Debe mostrar:
# slack-commands ✓
```

### 2. Anota tu URL
```
https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/slack-commands
```

### 3. Ten listo tu SLACK_SIGNING_SECRET
```bash
# En Supabase dashboard → Project Settings → Edge Functions → Secrets
# Busca: SLACK_SIGNING_SECRET
```

---

## 🔧 PASO 1: Acceder a tu Slack App (5 min)

1. **Ve a**: https://api.slack.com/apps
2. **Login** con tu cuenta Slack admin
3. **Selecciona** tu app OPTIMUS-K (o créala si no existe)

### Si NO tienes app todavía:

**Crear nueva app**:
1. Click "Create New App"
2. Selecciona "From scratch"
3. **App Name**: OPTIMUS-K
4. **Workspace**: Tu workspace
5. Click "Create App"

---

## 🔧 PASO 2: Configurar Slash Commands (20 min)

### 2.1: Ir a Slash Commands

1. **Sidebar izquierdo** → "Slash Commands"
2. Click **"Create New Command"**

### 2.2: Comando #1 - /leads

**Formulario**:
```
Command: /leads
Request URL: https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/slack-commands
Short Description: Ver leads calientes de OPTIMUS-K
Usage Hint: [opcional: show, hot, all]
Escape channels, users, and links sent to your app: ☑️ Checked
```

Click **"Save"**

---

### 2.3: Comando #2 - /tasks

**Formulario**:
```
Command: /tasks
Request URL: https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/slack-commands
Short Description: Ver y gestionar tus tareas
Usage Hint: [opcional: list, create, complete]
Escape channels, users, and links sent to your app: ☑️ Checked
```

Click **"Save"**

---

### 2.4: Comando #3 - /okrs

**Formulario**:
```
Command: /okrs
Request URL: https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/slack-commands
Short Description: Ver tu progreso en OKRs
Usage Hint: [opcional: show, progress]
Escape channels, users, and links sent to your app: ☑️ Checked
```

Click **"Save"**

---

### 2.5: Comando #4 - /metrics

**Formulario**:
```
Command: /metrics
Request URL: https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/slack-commands
Short Description: Ver métricas del mes
Usage Hint: [opcional: revenue, tasks, okrs]
Escape channels, users, and links sent to your app: ☑️ Checked
```

Click **"Save"**

---

### 2.6: Comando #5 - /sync

**Formulario**:
```
Command: /sync
Request URL: https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/slack-commands
Short Description: Estado de integraciones
Usage Hint: [opcional: status, now]
Escape channels, users, and links sent to your app: ☑️ Checked
```

Click **"Save"**

---

### 2.7: Comando #6 - /optimusk

**Formulario**:
```
Command: /optimusk
Request URL: https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/slack-commands
Short Description: Ayuda de OPTIMUS-K
Usage Hint: [opcional: help]
Escape channels, users, and links sent to your app: ☑️ Checked
```

Click **"Save"**

---

## 🔧 PASO 3: Configurar OAuth & Permissions (10 min)

### 3.1: OAuth Scopes

1. **Sidebar izquierdo** → "OAuth & Permissions"
2. Scroll a **"Bot Token Scopes"**
3. Click **"Add an OAuth Scope"**

**Añade TODOS estos scopes**:
```
✅ channels:history
✅ channels:read
✅ chat:write
✅ chat:write.public
✅ commands
✅ users:read
✅ users:read.email
```

### 3.2: Redirect URL

Scroll a **"Redirect URLs"**

**Añadir**:
```
https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/slack-oauth
```

Click **"Save URLs"**

---

## 🔧 PASO 4: Reinstalar App (5 min)

### 4.1: Reinstall to Workspace

1. En **"OAuth & Permissions"**
2. Scroll arriba
3. Verás mensaje: **"Please reinstall your app"**
4. Click **"Reinstall to Workspace"**
5. Autoriza permisos
6. ✅ Done!

---

## 🔧 PASO 5: Verificar Secrets en Supabase (5 min)

### 5.1: Ve a Slack App Settings

1. **Sidebar izquierdo** → "Basic Information"
2. Scroll a **"App Credentials"**

### 5.2: Copiar valores

**Anota**:
```
Client ID: xxxxxxxxxxx
Client Secret: xxxxxxxxxxx
Signing Secret: xxxxxxxxxxx
Verification Token: xxxxxxxxxxx (opcional)
```

### 5.3: Actualizar en Supabase

1. **Ve a**: Supabase Dashboard
2. **Project Settings** → **Edge Functions** → **Secrets**
3. **Verifica/Actualiza**:

```bash
SLACK_CLIENT_ID=tu_client_id
SLACK_CLIENT_SECRET=tu_client_secret
SLACK_SIGNING_SECRET=tu_signing_secret
```

---

## ✅ PASO 6: TESTING (10 min)

### 6.1: Test en Slack

1. **Abre tu Slack workspace**
2. **En cualquier canal**, escribe:

```
/leads
```

**Resultado esperado**:
```
Slack responde con:
"Ver leads calientes de OPTIMUS-K"
O un mensaje de error específico
```

### 6.2: Test todos los comandos

```
/leads
/tasks
/okrs  
/metrics
/sync
/optimusk
```

### 6.3: ¿Qué pasa si falla?

**Error: "Command not recognized"**
```
Solución:
- Espera 5 minutos (propagación de Slack)
- Reinstala app
- Verifica que guardaste todos los comandos
```

**Error: "dispatch_failed"**
```
Solución:
- Verifica que edge function está desplegada
- Verifica URL correcta
- Chequea logs en Supabase
```

**Error: "invalid_signature"**
```
Solución:
- Verifica SLACK_SIGNING_SECRET en Supabase
- Debe coincidir exactamente con Slack App
```

---

## 🐛 TROUBLESHOOTING

### Ver logs en tiempo real

**En Supabase**:
1. Functions → slack-commands → Logs
2. Click "Refresh" después de cada test

**En Slack**:
1. App Settings → Event Subscriptions → Recent Deliveries
2. Ver requests y responses

### Debug checklist

- [ ] Edge function desplegada
- [ ] URL correcta en todos los comandos
- [ ] Signing Secret correcto
- [ ] App reinstalada después de cambios
- [ ] Esperado 5 min de propagación

---

## ✅ CHECKLIST FINAL

Al terminar, verifica:

- [ ] Los 6 comandos creados en Slack
- [ ] Request URL correcta en todos
- [ ] OAuth scopes configurados
- [ ] Redirect URL añadida
- [ ] App reinstalada
- [ ] Secrets correctos en Supabase
- [ ] Todos los comandos responden en Slack
- [ ] No hay errores en logs

---

## 📸 SCREENSHOT PARA VERIFICAR

**Toma screenshots de**:
1. Slash Commands page (mostrando los 6)
2. OAuth & Permissions → Bot Token Scopes
3. Test exitoso de /optimusk en Slack

**Guárdalos** para documentación.

---

## 🎉 ¡LISTO!

Si todos los comandos responden, **Slack está 100% configurado**.

**Próximo paso**: Testing funcional completo (DÍA 3).

---

**Tiempo total real**: 30-45 minutos  
**Dificultad**: Media  
**¿Necesitas ayuda?**: Pregúntame en cualquier momento
