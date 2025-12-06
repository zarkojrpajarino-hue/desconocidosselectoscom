# ADR 001: Integration Button Pattern

## Estado
Aceptado

## Contexto
Necesitábamos una forma consistente de manejar 6+ integraciones externas
(Slack, HubSpot, Calendar, Asana, Trello, Zapier) con validación de plan 
y manejo de errores uniforme.

## Decisión
Crear un componente `IntegrationButton` reutilizable que:
- Valida automáticamente el plan del usuario antes de ejecutar acciones
- Maneja errores de forma consistente con toasts
- Soporta múltiples acciones (export, import, sync, notify, toggle)
- Usa tipos TypeScript específicos para cada integración
- Proporciona modo dropdown para acciones múltiples

## Implementación

```tsx
<IntegrationButton
  type="slack"
  action="notify"
  data={{ message: "Lead ganado", channel: "#ventas" }}
  onSuccess={() => refetch()}
/>
```

## Consecuencias

### Positivas
- **Código DRY**: Una sola implementación para todas las integraciones
- **UX Consistente**: Mismo comportamiento en toda la app
- **Type Safety**: Tipos específicos previenen errores
- **Fácil extensión**: Añadir nueva integración = añadir caso al switch

### Negativas
- Componente grande (~490 líneas)
- Requiere mantener tipos por integración
- Acoplamiento con useSubscriptionLimits

## Alternativas Consideradas
1. **Componentes separados por integración**: Rechazado por duplicación
2. **HOC wrapper**: Rechazado por complejidad
3. **Hook con render props**: Rechazado por API menos clara

## Notas
El componente está integrado en 9+ páginas incluyendo:
- LeadCard, PipelineLeadCard
- TaskList
- BusinessMetricsDashboard
- CRMPage, OKRsPage, FinancialPage
- DashboardHome, Gamification
