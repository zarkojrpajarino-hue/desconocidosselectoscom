# API Documentation - Edge Functions

> Documentación de las 32+ Edge Functions del proyecto

## Índice

1. [Autenticación](#autenticación)
2. [Análisis con IA](#análisis-con-ia)
3. [Generación de Contenido](#generación-de-contenido)
4. [Workspace & Onboarding](#workspace--onboarding)
5. [Calendario & Agenda](#calendario--agenda)
6. [Exportación](#exportación)
7. [Notificaciones](#notificaciones)
8. [Pagos (Stripe)](#pagos-stripe)
9. [Validación](#validación)

---

## Autenticación

Todas las funciones (excepto webhooks) requieren header:
```
Authorization: Bearer <supabase_jwt_token>
```

---

## Análisis con IA

### `analyze-project-data-v3`
Genera análisis completo del proyecto con IA incluyendo análisis competitivo.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **URL** | POST | `/functions/v1/analyze-project-data-v3` |
| **Auth** | Required | JWT Token |
| **Rate Limit** | 5/min | Por organización |

**Request Body:**
```json
{
  "organizationId": "uuid",
  "includeCompetitors": true
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "financialHealth": { "score": 75, "insights": [...] },
    "teamPerformance": { "score": 82, "feedback": [...] },
    "honestFeedback": { "strengths": [...], "weaknesses": [...] },
    "competitiveAnalysis": { "positioning": "...", "threats": [...] },
    "actionItems": [{ "priority": "high", "action": "..." }],
    "growthProjections": { "revenue": {...}, "customers": {...} }
  }
}
```

---

### `analyze-scalability`
Analiza escalabilidad del negocio en 5 dimensiones.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **URL** | POST | `/functions/v1/analyze-scalability` |
| **Auth** | Required | JWT Token |
| **Rate Limit** | 3/min | Por organización |

**Request Body:**
```json
{
  "organizationId": "uuid",
  "questionnaireData": {
    "teamSize": 5,
    "manualProcessHours": 20,
    "techStackModern": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "overallScore": 72,
    "categories": {
      "people": { "score": 65, "bottlenecks": [...] },
      "process": { "score": 70, "automationOpportunities": [...] },
      "product": { "score": 80, "scalabilityFactors": [...] },
      "financial": { "score": 75, "runway": "18 months" }
    },
    "recommendations": [...]
  }
}
```

---

## Generación de Contenido

### `generate-brand-kit`
Genera kit de marca completo con IA.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **URL** | POST | `/functions/v1/generate-brand-kit` |
| **Auth** | Required | JWT Token |
| **Rate Limit** | 3/min | Por organización |

**Request Body:**
```json
{
  "organizationId": "uuid",
  "industry": "tecnología",
  "targetAudience": "startups B2B",
  "brandValues": ["innovación", "confianza"]
}
```

---

### `generate-buyer-persona`
Genera buyer personas personalizados por país/industria.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **URL** | POST | `/functions/v1/generate-buyer-persona` |
| **Auth** | Required | JWT Token |
| **Rate Limit** | 5/min | Por organización |

**Request Body:**
```json
{
  "organizationId": "uuid",
  "countryCode": "ES",
  "industry": "ecommerce",
  "productDescription": "Software de gestión de inventario"
}
```

---

### `generate-tool-content`
Genera contenido para herramientas estratégicas (Customer Journey, Growth Model, etc).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **URL** | POST | `/functions/v1/generate-tool-content` |
| **Auth** | Required | JWT Token |
| **Rate Limit** | 5/min | Por organización |

**Request Body:**
```json
{
  "organizationId": "uuid",
  "toolType": "customer_journey" | "growth_model" | "lead_scoring",
  "context": { /* datos específicos del tool */ }
}
```

---

### `generate-task-ai-resources`
Genera recursos de IA para tareas específicas (videos, posts, templates).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **URL** | POST | `/functions/v1/generate-task-ai-resources` |
| **Auth** | Required | JWT Token |
| **Rate Limit** | 10/min | Por usuario |

**Request Body:**
```json
{
  "taskId": "uuid",
  "organizationId": "uuid",
  "resourceType": "video_scripts" | "social_posts" | "email_sequences" | "outreach_templates" | "influencer_list" | "ad_campaign" | "design_brief"
}
```

**Response:**
```json
{
  "success": true,
  "resources": {
    "type": "video_scripts",
    "items": [
      {
        "title": "Video 1 - Hook inicial",
        "duration": "30s",
        "script": "...",
        "platform": "TikTok"
      }
    ]
  }
}
```

---

## Workspace & Onboarding

### `generate-workspace`
Genera workspace completo para negocio existente.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **URL** | POST | `/functions/v1/generate-workspace` |
| **Auth** | Required | JWT Token |
| **Rate Limit** | 1/min | Por organización |

**Request Body:**
```json
{
  "organizationId": "uuid",
  "onboardingData": {
    "businessName": "Mi Empresa",
    "industry": "tecnología",
    "monthlyRevenue": 50000,
    "teamSize": 10,
    "products": [...],
    "competitors": [...]
  }
}
```

---

### `generate-startup-workspace`
Genera workspace para startup desde cero (8 pasos de onboarding).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **URL** | POST | `/functions/v1/generate-startup-workspace` |
| **Auth** | Required | JWT Token |
| **Rate Limit** | 1/min | Por organización |

**Request Body:**
```json
{
  "organizationId": "uuid",
  "startupData": {
    "vision": { "problemStatement": "...", "solution": "..." },
    "market": { "targetCustomer": "...", "tam": 1000000 },
    "businessModel": { "revenueStreams": [...] },
    "product": { "mvpFeatures": [...] },
    "goToMarket": { "launchStrategy": "..." },
    "resources": { "initialCapital": 50000 },
    "validation": { "hypotheses": [...] },
    "timeline": { "milestones": [...] }
  }
}
```

---

### `generate-role-tasks`
Genera tareas específicas según el rol del usuario.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **URL** | POST | `/functions/v1/generate-role-tasks` |
| **Auth** | Required | JWT Token |
| **Rate Limit** | 5/min | Por organización |

**Request Body:**
```json
{
  "organizationId": "uuid",
  "userId": "uuid",
  "role": "marketing" | "ventas" | "producto" | "finanzas"
}
```

---

### `generate-personalized-krs`
Genera Key Results personalizados para OKRs.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **URL** | POST | `/functions/v1/generate-personalized-krs` |
| **Auth** | Required | JWT Token |
| **Rate Limit** | 5/min | Por organización |

---

## Calendario & Agenda

### `google-auth-url`
Obtiene URL de autorización OAuth para Google Calendar.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **URL** | POST | `/functions/v1/google-auth-url` |
| **Auth** | Required | JWT Token |

**Response:**
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

---

### `google-auth-callback`
Procesa callback de OAuth y guarda tokens.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **URL** | POST | `/functions/v1/google-auth-callback` |
| **Auth** | Required | JWT Token |

---

### `sync-calendar-events`
Sincroniza tareas con Google Calendar.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **URL** | POST | `/functions/v1/sync-calendar-events` |
| **Auth** | Required | JWT Token |
| **Rate Limit** | 10/min | Por usuario |

---

### `generate-weekly-schedules`
Genera agenda semanal con IA basada en disponibilidad.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **URL** | POST | `/functions/v1/generate-weekly-schedules` |
| **Auth** | Required | JWT Token |
| **Rate Limit** | 3/min | Por organización |

---

### `find-alternative-slots`
Encuentra slots alternativos cuando hay conflictos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **URL** | POST | `/functions/v1/find-alternative-slots` |
| **Auth** | Required | JWT Token |

---

## Exportación

### `export-excel`
Exporta datos a formato Excel (.xlsx).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **URL** | POST | `/functions/v1/export-excel` |
| **Auth** | Required | JWT Token |
| **Plan** | Starter+ | Requiere plan Starter o superior |

**Request Body:**
```json
{
  "organizationId": "uuid",
  "dataType": "leads" | "okrs" | "financial" | "metrics",
  "filters": { "dateFrom": "2024-01-01", "dateTo": "2024-12-31" }
}
```

**Response:** Binary Excel file

---

### `export-pdf`
Exporta datos a formato PDF.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **URL** | POST | `/functions/v1/export-pdf` |
| **Auth** | Required | JWT Token |
| **Plan** | Enterprise | Solo plan Enterprise |

---

## Notificaciones

### `send-welcome-email`
Envía email de bienvenida a nuevos usuarios.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **URL** | POST | `/functions/v1/send-welcome-email` |
| **Auth** | Service Role | Interno/Trigger |
| **JWT** | false | No requiere JWT |

---

### `send-weekly-summary`
Envía resumen semanal por email.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **URL** | POST | `/functions/v1/send-weekly-summary` |
| **Auth** | Cron | Llamado por cron job |
| **JWT** | false | No requiere JWT |

---

### `send-urgent-alert`
Envía alertas urgentes por email.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **URL** | POST | `/functions/v1/send-urgent-alert` |
| **Auth** | Service Role | Interno |
| **JWT** | false | No requiere JWT |

---

## Pagos (Stripe)

### `create-checkout`
Crea sesión de checkout en Stripe.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **URL** | POST | `/functions/v1/create-checkout` |
| **Auth** | Required | JWT Token |

**Request Body:**
```json
{
  "organizationId": "uuid",
  "planName": "starter" | "professional" | "enterprise"
}
```

**Response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_..."
}
```

---

### `stripe-webhook`
Procesa webhooks de Stripe (pagos, suscripciones).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **URL** | POST | `/functions/v1/stripe-webhook` |
| **Auth** | Stripe Signature | Verificación de firma |
| **JWT** | false | No requiere JWT |

---

## Validación

### `validate-plan-limits`
Valida límites del plan antes de acciones.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **URL** | POST | `/functions/v1/validate-plan-limits` |
| **Auth** | Required | JWT Token |

**Request Body:**
```json
{
  "organizationId": "uuid",
  "limitType": "leads" | "users" | "okrs" | "ai_analysis"
}
```

**Response:**
```json
{
  "allowed": true,
  "currentCount": 45,
  "limit": 100,
  "message": null
}
```

---

## Rate Limits por Defecto

| Categoría | Límite | Ventana |
|-----------|--------|---------|
| AI Analysis | 5 requests | 1 minuto |
| Content Generation | 10 requests | 1 minuto |
| Workspace Generation | 1 request | 1 minuto |
| Calendar Sync | 10 requests | 1 minuto |
| Export | 5 requests | 1 minuto |
| General | 60 requests | 1 minuto |

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request - Parámetros inválidos |
| 401 | Unauthorized - Token inválido o expirado |
| 403 | Forbidden - Sin permisos para esta acción |
| 404 | Not Found - Recurso no existe |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Error del servidor |

---

## Ejemplos de Uso

### JavaScript/TypeScript
```typescript
import { supabase } from '@/integrations/supabase/client';

// Llamar Edge Function
const { data, error } = await supabase.functions.invoke('analyze-project-data-v3', {
  body: { organizationId: 'uuid-123' }
});

if (error) {
  console.error('Error:', error.message);
} else {
  console.log('Analysis:', data.analysis);
}
```

### cURL
```bash
curl -X POST \
  'https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/analyze-project-data-v3' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"organizationId": "uuid-123"}'
```

---

*Última actualización: Diciembre 2024*
