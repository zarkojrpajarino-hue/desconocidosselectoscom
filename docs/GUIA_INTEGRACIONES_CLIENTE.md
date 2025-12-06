# 📖 GUÍA COMPLETA: CÓMO FUNCIONAN LAS INTEGRACIONES

## 🎯 PARA EL CLIENTE: ¿QUÉ SON LAS INTEGRACIONES?

Las integraciones permiten que **OPTIMUS-K se conecte automáticamente con otras herramientas** que el cliente ya usa en su empresa, evitando trabajo manual y duplicado.

---

## 🔌 LAS 6 INTEGRACIONES DISPONIBLES

### **1. 📱 SLACK - Notificaciones Automáticas**

**¿Qué hace?**
- Envía notificaciones automáticas a canales de Slack cuando ocurren eventos importantes en OPTIMUS-K

**Ejemplos prácticos:**
```
Evento en OPTIMUS-K          →  Notificación en Slack
────────────────────────────────────────────────────────
Nuevo lead creado            →  Mensaje en #sales
Lead ganado (venta cerrada)  →  Mensaje en #sales con 🎉
Tarea completada             →  Mensaje en #equipo
OKR en riesgo                →  Mensaje en #management
Métrica crítica alcanzada    →  Mensaje en #alertas
```

**Cómo lo configura el cliente:**

1. **Ir a:** Configuración → API & Integraciones → Tab "Slack"
2. **Click:** "Conectar con Slack"
3. **Autorizar** en Slack (se abre ventana nueva)
4. **Seleccionar** qué eventos quiere recibir
5. **Elegir** a qué canal va cada notificación

**Ejemplo visual:**
```
┌─────────────────────────────────────┐
│ Slack Integration                   │
├─────────────────────────────────────┤
│ ✅ Conectado a: Mi Empresa SL       │
│                                     │
│ Configurar Notificaciones:          │
│ ☑ Nuevo Lead    → Canal: #sales    │
│ ☑ Lead Ganado   → Canal: #sales    │
│ ☑ Tarea Hecha   → Canal: #equipo   │
│ ☐ OKR en Riesgo → Canal: (elegir)  │
│                                     │
│ [Guardar Cambios]                   │
└─────────────────────────────────────┘
```

---

### **2. 🔵 HUBSPOT - Sincronización CRM**

**¿Qué hace?**
- Sincroniza automáticamente los leads entre OPTIMUS-K y HubSpot CRM

**Sincronización bidireccional:**
```
OPTIMUS-K  ↔  HubSpot
───────────────────────
Lead nuevo      →  Contact en HubSpot
Lead ganado     →  Deal "Won" en HubSpot
Contact nuevo   ←  Lead en OPTIMUS-K
Deal cerrado    ←  Lead ganado en OPTIMUS-K
```

**Mapeo de campos:**
```
OPTIMUS-K          HubSpot
─────────────────────────────
Lead.name       →  Contact.firstname + lastname
Lead.email      →  Contact.email
Lead.company    →  Contact.company
Lead.phone      →  Contact.phone
Lead.score      →  Contact.hs_lead_score
Lead.stage      →  Deal.dealstage
Lead.value      →  Deal.amount
```

**Cómo lo usa el cliente:**

1. **Conectar:** Click "Conectar HubSpot"
2. **Autorizar** con su cuenta de HubSpot
3. **Configurar:**
   - Dirección de sync: "Bidireccional" (recomendado)
   - Intervalo: "Cada 15 minutos" (automático)
4. **Resultado:** Los leads se sincronizan solos

**Caso de uso real:**

```
Vendedor añade lead en OPTIMUS-K:
  Nombre: Juan Pérez
  Email: juan@empresa.com
  Valor: €5,000

15 minutos después:
  ✅ Contact creado en HubSpot
  ✅ Deal creado con €5,000
  ✅ Asignado al vendedor

Si Marketing actualiza el lead en HubSpot:
  Score: 50 → 85
  
15 minutos después:
  ✅ Score actualizado en OPTIMUS-K
```

---

### **3. 📅 OUTLOOK CALENDAR - Sincronización de Calendario**

**¿Qué hace?**
- Sincroniza tareas con fechas límite al calendario de Outlook automáticamente

**Flujo de sincronización:**
```
OPTIMUS-K                    Outlook Calendar
────────────────────────────────────────────────
Tarea con due_date      →   Evento en calendario
Tarea completada        →   Evento marcado como hecho
Evento actualizado      ←   Tarea actualizada
```

**Ejemplo práctico:**

```
Usuario crea tarea en OPTIMUS-K:
  "Llamar a cliente ABC"
  Fecha límite: 15 Dic, 10:00

Automáticamente aparece en Outlook:
  📅 15 Dic, 10:00 - 11:00
  📝 Llamar a cliente ABC
  🔔 Recordatorio 15 min antes
```

**Beneficios:**
- ✅ No olvidar tareas importantes
- ✅ Ver toda la agenda en Outlook
- ✅ Recordatorios automáticos en móvil
- ✅ Sincronización bidireccional

---

### **4. 📋 TRELLO - Sincronización de Tareas**

**¿Qué hace?**
- Convierte las tareas de OPTIMUS-K en tarjetas de Trello automáticamente

**Mapeo de fases:**
```
OPTIMUS-K Phase       Trello List
──────────────────────────────────
planning         →    "Por Hacer"
execution        →    "En Progreso"
review           →    "Completadas"
```

**Ejemplo visual:**

```
OPTIMUS-K                         Trello Board
────────────────────────────────────────────────────
Tarea: "Diseñar mockups"     →   [Card] Diseñar mockups
  Phase: planning                  List: Por Hacer
  Priority: high                   Label: 🔴 Alta

Usuario mueve card a              ←  Tarea actualizada
  "En Progreso" en Trello            Phase: execution
```

**Casos de uso:**
- Equipos que ya usan Trello
- Gestión visual con tableros Kanban
- Colaboración en tareas

---

### **5. 🔴 ASANA - Gestión de Proyectos**

**¿Qué hace?**
- Similar a Trello pero con Asana (gestión de proyectos más avanzada)

**Sincronización:**
```
OPTIMUS-K Task       Asana Task
───────────────────────────────────
Title            →   Name
Description      →   Notes
Due date         →   Due date
Assigned to      →   Assignee
Completed        →   Completed ✓
```

**Ventajas:**
- Equipos que prefieren Asana
- Gestión de proyectos compleja
- Dependencias entre tareas

---

### **6. ⚡ ZAPIER - Conectar con 5000+ Apps**

**¿Qué hace?**
- Permite conectar OPTIMUS-K con CUALQUIER aplicación que soporte Zapier

**Ejemplos de automatizaciones posibles:**

```
Trigger                    Action
──────────────────────────────────────────────────
Nuevo lead en OPTIMUS-K  → Email a ventas (Gmail)
Lead ganado              → Crear factura (QuickBooks)
Tarea completada         → Notificar en Discord
Métrica alcanzada        → Tweet automático
OKR actualizado          → Actualizar Google Sheets
```

**Zapier conecta con:**
- 📧 Email: Gmail, Outlook, SendGrid
- 💬 Chat: Discord, Teams, Telegram
- 📊 Sheets: Google Sheets, Excel, Airtable
- 💰 Finanzas: QuickBooks, Xero, Stripe
- 🎨 Diseño: Figma, Canva
- 📱 Marketing: Mailchimp, ActiveCampaign
- ...¡y 5000+ apps más!

**Cómo configurar un Zap:**

1. **En Zapier:** Create Zap
2. **Trigger:** OPTIMUS-K → "New Lead"
3. **Action:** Gmail → "Send Email"
4. **Configurar:** Template del email
5. **Activar:** El Zap se ejecuta automáticamente

---

## 🎯 CASOS DE USO REALES

### **Caso 1: Agencia de Marketing**

```
Herramientas que usan:
- Slack (comunicación)
- HubSpot (CRM corporativo)
- Trello (proyectos)

Configuración:
✅ Slack: Nuevos leads → #sales
✅ HubSpot: Sync bidireccional cada 15min
✅ Trello: Tareas → Board de proyectos

Resultado:
- Equipo notificado en tiempo real
- CRM centralizado (HubSpot es fuente verdad)
- Gestión visual en Trello
```

---

### **Caso 2: Startup Tecnológica**

```
Herramientas que usan:
- Slack (equipo)
- Asana (desarrollo)
- Outlook (calendarios)

Configuración:
✅ Slack: OKRs en riesgo → #management
✅ Asana: Sync de tareas técnicas
✅ Outlook: Reuniones importantes

Resultado:
- Alertas tempranas de problemas
- Desarrolladores ven tareas en Asana
- Calendario sincronizado
```

---

### **Caso 3: Consultoría**

```
Herramientas que usan:
- Zapier (conectar todo)
- Gmail (comunicación)
- Google Sheets (reportes)

Configuración:
✅ Zapier: Lead ganado → Email cliente
✅ Zapier: Métrica semanal → Google Sheet
✅ Zapier: Tarea vencida → SMS al equipo

Resultado:
- Automatización completa
- Reportes automáticos
- Recordatorios por SMS
```

---

## 📖 PARA EL CLIENTE: GUÍA RÁPIDA

### **¿Cómo empezar?**

**Paso 1: Identificar necesidad**
- ¿Ya usas Slack? → Conecta Slack
- ¿Ya usas HubSpot? → Conecta HubSpot
- ¿Usas Outlook? → Conecta Outlook

**Paso 2: Conectar**
1. Ir a Configuración → API & Integraciones
2. Click en la integración deseada
3. Click "Conectar [App]"
4. Autorizar en ventana que se abre

**Paso 3: Configurar**
- Elegir qué sincronizar
- Elegir dirección (bidireccional o solo una vía)
- Elegir frecuencia

**Paso 4: ¡Listo!**
- Las integraciones funcionan solas
- Revisa logs en la pestaña de cada integración

---

## 🔐 SEGURIDAD

**Todas las integraciones usan:**
- ✅ OAuth 2.0 (estándar industria)
- ✅ Tokens encriptados
- ✅ Permisos mínimos necesarios
- ✅ Revocables en cualquier momento

**El cliente puede desconectar en cualquier momento:**
1. Ir a la integración
2. Click "Desconectar"
3. Confirmar

---

## 💡 PREGUNTAS FRECUENTES

**¿Las integraciones tienen costo extra?**
- ❌ No en planes Professional y Enterprise
- ⚠️ En plan Starter solo API Keys

**¿Puedo conectar múltiples cuentas?**
- Slack: 1 workspace por organización
- HubSpot: 1 portal por organización  
- Outlook: 1 cuenta por usuario
- Trello: 1 board por organización
- Asana: 1 workspace por organización

**¿Qué pasa si desconecto?**
- Se detiene la sincronización
- Los datos en ambas apps permanecen
- No se borra nada

**¿Puedo elegir qué sincronizar?**
- ✅ Sí, cada integración permite filtros
- Ejemplo: Solo leads con score > 80

---

## 🎯 RESUMEN EJECUTIVO

**Para vender al cliente:**

> "OPTIMUS-K se integra con las herramientas que ya usas. No necesitas cambiar tu forma de trabajar. Si tu equipo usa Slack, recibirán notificaciones ahí. Si tienes HubSpot, todo se sincroniza automáticamente. Si prefieres Trello, las tareas aparecerán en tu board. Y si usas alguna app que no tenemos, Zapier te permite conectarla."

**Beneficios clave:**
- ✅ No trabajo duplicado
- ✅ No cambio de herramientas
- ✅ Automatización total
- ✅ Todo centralizado

---

**¿Necesitas más detalles sobre alguna integración específica?**
