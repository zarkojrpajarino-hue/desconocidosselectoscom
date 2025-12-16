# ✅ GOOGLE CALENDAR - CHECKLIST DE TESTING

**Fecha**: Día 1 - Lunes  
**Objetivo**: Google Calendar al 100% funcional

---

## 🔧 PREPARACIÓN (10 min)

### Verificar OAuth configurado
1. Ve a: https://console.cloud.google.com/apis/credentials
2. Verifica que existe tu OAuth Client ID
3. Verifica Redirect URI: `https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/google-auth-callback`
4. Verifica scopes autorizados:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`

### Verificar Edge Functions
```bash
# En terminal local
supabase functions list

# Debe mostrar:
# - google-auth-url
# - google-auth-callback
# - sync-calendar-events
```

---

## 🧪 TEST 1: CONEXIÓN INICIAL (15 min)

### Pasos:
1. **Abrir OPTIMUS-K en incógnito**
2. **Login con tu usuario de prueba**
3. **Ir a**: Settings → Integrations → Google Calendar
4. **Click**: "Conectar Google Calendar"

### ✅ Debe pasar:
- [ ] Te redirige a Google OAuth
- [ ] Pantalla de permisos aparece correctamente
- [ ] Lista de scopes es correcta (Calendar access)
- [ ] Al aceptar, vuelve a OPTIMUS-K
- [ ] Mensaje "Conectado exitosamente" aparece
- [ ] Badge "✓ Conectado" visible

### ❌ Si falla:
**Error: "Redirect URI mismatch"**
```
Solución:
1. Ve a Google Cloud Console
2. OAuth 2.0 Client → Edit
3. Añade EXACTAMENTE: https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/google-auth-callback
4. Save
5. Espera 5 minutos (propagación)
6. Intenta de nuevo
```

**Error: "Invalid client"**
```
Solución:
1. Verifica GOOGLE_CLIENT_ID en Supabase Secrets
2. Debe coincidir con el de Google Cloud Console
```

**Error: "Token storage failed"**
```
Solución:
1. Verifica que tabla google_calendar_tokens existe
2. Verifica permisos de RLS
```

---

## 🧪 TEST 2: EXPORT - OPTIMUS → GOOGLE (30 min)

### Crear tarea en OPTIMUS-K
1. **Dashboard → Tasks**
2. **Crear tarea**:
   - Título: "TEST: Reunión con cliente"
   - Fecha: Hoy a las 15:00
   - Duración: 1 hora
   - Descripción: "Discutir propuesta Q1"
3. **Guardar**

### Trigger sync manual
1. **Dashboard → Integrations**
2. **Google Calendar → "Sincronizar ahora"**
3. **Esperar** (15-30 segundos)

### Verificar en Google Calendar
1. **Abrir** https://calendar.google.com
2. **Buscar** evento "TEST: Reunión con cliente"

### ✅ Debe pasar:
- [ ] Evento aparece en Calendar
- [ ] Fecha/hora correcta
- [ ] Descripción correcta
- [ ] Creador es "OPTIMUS-K"
- [ ] En OPTIMUS-K dice "Última sync: hace X segundos"

### ❌ Si falla:
**Evento no aparece**
```
Debug:
1. Abrir DevTools → Console
2. Ver errores en network tab
3. Ir a Supabase → Logs
4. Buscar función sync-calendar-events
5. Ver error específico

Errores comunes:
- Token expirado → Implementar refresh
- Permisos insuficientes → Revisar scopes
- Rate limit → Añadir delay
```

---

## 🧪 TEST 3: IMPORT - GOOGLE → OPTIMUS (30 min)

### Crear evento en Google Calendar
1. **Abrir** Google Calendar
2. **Crear evento**:
   - Título: "TEST IMPORT: Llamada con equipo"
   - Fecha: Mañana a las 10:00
   - Duración: 30 min
3. **Guardar**

### Trigger sync en OPTIMUS-K
1. **Dashboard → Integrations**
2. **Google Calendar → "Importar eventos"**
3. **Esperar**

### Verificar en OPTIMUS-K
1. **Dashboard → Tasks**
2. **Buscar**: "TEST IMPORT: Llamada con equipo"

### ✅ Debe pasar:
- [ ] Tarea aparece en OPTIMUS-K
- [ ] Fecha/hora correcta
- [ ] Estado: "pending"
- [ ] Source: "google_calendar"
- [ ] google_event_id guardado

### ❌ Si falla:
```
Debug similar a TEST 2
Verificar que import está implementado en sync-calendar-events
```

---

## 🧪 TEST 4: SYNC BIDIRECCIONAL (45 min)

### Escenario: Editar en OPTIMUS-K
1. **Tarea existente** sincronizada con Calendar
2. **Editar** en OPTIMUS-K:
   - Cambiar hora de 15:00 → 16:00
   - Cambiar título
3. **Sync**
4. **Verificar en Google Calendar**

### ✅ Debe pasar:
- [ ] Cambios reflejados en Calendar
- [ ] Sin duplicados
- [ ] Timestamp correcto

### Escenario: Editar en Google Calendar
1. **Evento sincronizado**
2. **Editar en Calendar**:
   - Cambiar descripción
   - Cambiar fecha
3. **Sync en OPTIMUS-K**
4. **Verificar tarea actualizada**

### ✅ Debe pasar:
- [ ] Cambios reflejados en OPTIMUS-K
- [ ] Sin duplicados
- [ ] updated_at actualizado

---

## 🧪 TEST 5: DELETE SYNC (30 min)

### Borrar en OPTIMUS-K
1. **Seleccionar tarea** sincronizada
2. **Eliminar**
3. **Sync**
4. **Verificar en Calendar** → Debe estar borrado

### Borrar en Google Calendar
1. **Seleccionar evento** sincronizado
2. **Eliminar**
3. **Sync en OPTIMUS-K**
4. **Verificar tarea** → Debe estar borrada o marcada como cancelled

---

## 🧪 TEST 6: EDGE CASES (1 hora)

### Test 1: Token Expiration
```typescript
// Simular token expirado
// 1. En Supabase → google_calendar_tokens
// 2. Actualizar token_expiry a fecha pasada
// 3. Intentar sync
// 4. Debe refrescar automáticamente
```

### ✅ Debe pasar:
- [ ] Refresh automático funciona
- [ ] Nueva expiry guardada
- [ ] Sync continúa sin error visible al usuario

### Test 2: Eventos Recurrentes
```
1. Crear evento recurrente en Calendar (diario por 1 semana)
2. Import a OPTIMUS-K
3. Verificar que maneja correctamente
```

### ✅ Debe pasar:
- [ ] Crea múltiples tareas O una con recurrence
- [ ] No crashea
- [ ] Puede manejar ediciones

### Test 3: Zonas Horarias
```
1. Crear evento en Calendar con timezone UTC
2. Import a OPTIMUS-K
3. Verificar hora correcta en tu timezone
```

### Test 4: Eventos Largos (Todo el día)
```
1. Crear evento de todo el día
2. Import
3. Verificar que no pone hora específica
```

### Test 5: Sin Conexión
```
1. Desconectar internet
2. Intentar sync
3. Verificar error handling
4. Reconectar
5. Verificar retry automático
```

---

## 🧪 TEST 7: PERFORMANCE (30 min)

### Test con volumen
```
1. Crear 50 tareas en OPTIMUS-K
2. Sync todas
3. Medir tiempo
4. Verificar que todas llegaron
```

### ✅ Debe pasar:
- [ ] Completa en < 2 minutos
- [ ] Sin rate limit errors
- [ ] Todas las tareas sincronizadas
- [ ] Logs correctos

---

## 🧪 TEST 8: CONFLICT RESOLUTION (1 hora)

### Setup:
```
1. Crear tarea en OPTIMUS-K a las 15:00
2. Sync a Calendar
3. OFFLINE: Editar en ambos lados simultáneamente
   - OPTIMUS-K: Cambiar a 16:00
   - Calendar: Cambiar a 14:00
4. Sync
```

### ✅ Comportamiento esperado:
```
OPCIÓN A (Más reciente gana):
- Compara updated_at
- El más reciente sobrescribe

OPCIÓN B (Manual resolution):
- Detecta conflicto
- UI muestra ambas versiones
- Usuario elige
```

**IMPLEMENTAR** cual prefieres.

---

## 📊 CHECKLIST FINAL

Al terminar el día, todas estas deben estar ✅:

### Funcionalidad
- [ ] Conexión OAuth funciona
- [ ] Export OPTIMUS → Calendar funciona
- [ ] Import Calendar → OPTIMUS funciona
- [ ] Sync bidireccional funciona
- [ ] Delete sync funciona
- [ ] Token refresh automático funciona

### Edge Cases
- [ ] Eventos recurrentes manejados
- [ ] Zonas horarias correctas
- [ ] Eventos todo el día funcionan
- [ ] Sin conexión maneja gracefully
- [ ] Conflictos resueltos correctamente

### Performance
- [ ] Sync de 50+ tareas < 2 min
- [ ] Sin rate limits
- [ ] Logs completos

### UX
- [ ] Loading indicators
- [ ] Success messages
- [ ] Error messages útiles
- [ ] Badge de estado correcto

### Code Quality
- [ ] Console.logs removidos
- [ ] Error handling completo
- [ ] Commented code limpio

---

## 🐛 BUGS ENCONTRADOS

**Lista aquí bugs encontrados durante testing**:

1. _______________________________
2. _______________________________
3. _______________________________

**Bugs arreglados**:

1. ✅ _______________________________
2. ✅ _______________________________

---

## ✅ RESULTADO DÍA 1

- [ ] Google Calendar: 100% funcional
- [ ] Todos los tests pasados
- [ ] Bugs arreglados
- [ ] Documentation actualizada
- [ ] Ready para production

**Firma**: _____________ **Fecha**: _____________
