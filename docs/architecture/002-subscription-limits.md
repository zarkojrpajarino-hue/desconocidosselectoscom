# ADR 002: Subscription Limits System

## Estado
Aceptado

## Contexto
La aplicación tiene múltiples planes de suscripción (Free, Starter, Professional, Enterprise)
con diferentes límites y features. Necesitábamos un sistema que:
- Valide límites antes de acciones (crear leads, OKRs, usuarios)
- Sea rápido (frontend) pero seguro (backend)
- Proporcione feedback claro al usuario

## Decisión
Implementar validación en dos capas:

### 1. Frontend (rápido)
```tsx
const { canAddLead, showLimitReachedToast } = useSubscriptionLimits();

const handleCreate = () => {
  const { allowed } = canAddLead();
  if (!allowed) {
    showLimitReachedToast('leads');
    return;
  }
  // Crear lead...
};
```

### 2. Backend (seguro)
```tsx
const { canAddLead: validateBackend } = useBackendValidation();

const result = await validateBackend();
if (!result.allowed) {
  // Bloquear acción
}
```

## Límites por Plan

| Feature | Free | Starter | Professional | Enterprise |
|---------|------|---------|--------------|------------|
| max_users | 10 | 15 | 25 | -1 (∞) |
| max_leads_per_month | 2000 | 5000 | -1 | -1 |
| max_objectives | 10 | -1 | -1 | -1 |
| integrations_slack | ❌ | ❌ | ✅ | ✅ |
| integrations_hubspot | ❌ | ❌ | ✅ | ✅ |

## Consecuencias

### Positivas
- **Feedback inmediato**: Usuario sabe al instante si puede
- **Seguridad**: Backend previene bypass de límites
- **Flexibilidad**: Fácil añadir nuevos límites
- **Cacheo**: React Query reduce llamadas repetidas

### Negativas
- Doble validación = más código
- Sincronizar frontend/backend constants
- Edge function adicional para validación

## Archivos Clave
- `src/hooks/useSubscriptionLimits.ts`
- `src/hooks/useBackendValidation.ts`
- `src/constants/subscriptionLimits.ts`
- `supabase/functions/validate-plan-limits/`
