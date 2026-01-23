# 📁 FASE 2 - PLAN DE REORGANIZACIÓN DE COMPONENTES

**Fecha:** 2026-01-24
**Status:** 🔄 EN PROGRESO

---

## 🎯 OBJETIVO

Reorganizar 351 componentes caóticos en una estructura lógica por features.

---

## 📊 ESTADO ACTUAL

```
src/components/
├── [70+ componentes sueltos en raíz]  ❌ PROBLEMA
├── /agenda (11 componentes)           ✅ Bien organizado
├── /ai-analysis (8 componentes)       ✅ Bien organizado
├── /analytics                         ✅ Bien organizado
├── /auth                              ✅ Bien organizado
├── /bi                                ✅ Bien organizado
├── /billing                           ✅ Bien organizado
├── /branding                          ✅ Bien organizado
├── /dashboard                         ✅ Bien organizado
├── /enterprise                        ✅ Bien organizado
├── /financial                         ✅ Bien organizado
├── /gdpr                              ✅ Bien organizado
├── /guide                             ✅ Bien organizado
├── /integrations                      ✅ Bien organizado
├── /layout                            ✅ Bien organizado
├── /marketing                         ✅ Bien organizado
├── /mobile                            ✅ Bien organizado
├── /nps                               ✅ Bien organizado
├── /okrs                              ✅ Bien organizado
├── /onboarding                        ✅ Bien organizado
├── /phases                            ✅ Bien organizado
├── /plan                              ✅ Bien organizado
├── /settings                          ✅ Bien organizado
├── /tasks                             ✅ Bien organizado
└── /ui                                ✅ Bien organizado
```

**Problema:** 70+ componentes en raíz sin organizar

---

## 🔍 COMPONENTES EN RAÍZ QUE NECESITAN ORGANIZACIÓN

### Grupo 1: CRM (mover a /crm)
- CreateLeadModal.tsx
- LeadCard.tsx
- LeadDetailModal.tsx
- Pipeline.tsx → Ya existe en pages/crm/Pipeline.tsx (¿duplicado?)
- PipelineBoard.tsx

### Grupo 2: Tasks (mover a /tasks)
- CollaborationTaskList.tsx
- TaskList.tsx
- TaskCard.tsx (si existe)
- TaskImpactMeasurementModal.tsx
- TaskRelatedLeadsModal.tsx (si existe)

### Grupo 3: Dashboard (mover a /dashboard)
- BusinessMetricsDashboard.tsx
- DashboardCard.tsx (si existe)
- DashboardNotifications.tsx → Ya existe en pages/dashboard/
- GamificationDashboard.tsx
- TeamProgress.tsx

### Grupo 4: OKRs (mover a /okrs)
- OKRsDashboard.tsx
- OKRCard.tsx (si existe)

### Grupo 5: Financial (mover a /financial)
- FinancialDashboard.tsx
- FinancialHealthSection.tsx → ¡DUPLICADO! Ver ai-analysis/sections/
- TransactionCard.tsx (si existe)

### Grupo 6: AI Analysis (mover a /ai-analysis)
- AIAnalysisDashboard.tsx → ¡DUPLICADO! Ya existe en /ai-analysis/
- FinancialHealthSection.tsx → ¡DUPLICADO!

### Grupo 7: Shared/Common (mover a /shared o /common)
- AlertCard.tsx
- BackButton.tsx
- ConfettiEffect.tsx
- CountdownTimer.tsx
- ErrorBoundary.tsx
- ExportButton.tsx
- GoogleCalendarConnect.tsx
- LoadingSkeleton.tsx (si existe)

### Grupo 8: Organization (mover a /organization o /settings)
- OrganizationUsers.tsx
- UserOrganizations.tsx
- UserProfile.tsx

### Grupo 9: Features específicas
- NotificationBell.tsx → /notifications
- NotificationCenter.tsx → /notifications
- SmartAlerts.tsx → /alerts
- PhaseSelector.tsx → /phases
- RescheduleModal.tsx → /agenda
- WeeklyAgenda.tsx → /agenda
- ProductsManager.tsx → /products
- MetricsLeaderboard.tsx → /analytics
- BadgeUnlockAnimation.tsx → /gamification
- AvailabilityBlockScreen.tsx → /agenda
- AvailabilityQuestionnaire.tsx → /agenda

---

## 🚨 DUPLICADOS CONFIRMADOS

### 1. AIAnalysisDashboard.tsx
- **Ubicación 1:** `src/components/AIAnalysisDashboard.tsx` (raíz)
- **Ubicación 2:** `src/components/ai-analysis/AIAnalysisDashboard.tsx`
- **Acción:** Verificar cuál se usa, eliminar el otro

### 2. FinancialHealthSection.tsx
- **Ubicación 1:** `src/components/FinancialHealthSection.tsx` (raíz)
- **Ubicación 2:** `src/components/ai-analysis/FinancialHealthSection.tsx`
- **Acción:** Verificar cuál se usa, eliminar el otro

### 3. Posibles duplicados en pages/dashboard vs components/dashboard
- DashboardNotifications existe en ambos lugares

---

## 📋 PLAN DE ACCIÓN

### Fase 2A: Identificar y Eliminar Duplicados (URGENTE)

**Prioridad:** 🔴 CRÍTICA

1. Buscar imports de componentes duplicados
2. Identificar cuál versión se usa
3. Actualizar imports si es necesario
4. Eliminar versión no usada

**Comando para buscar imports:**
```bash
# Para AIAnalysisDashboard
grep -r "import.*AIAnalysisDashboard" src/

# Para FinancialHealthSection
grep -r "import.*FinancialHealthSection" src/
```

### Fase 2B: Crear Estructura de Carpetas

**Prioridad:** 🟡 ALTA

```
src/components/
├── /shared              # Componentes reutilizables generales
│   ├── AlertCard.tsx
│   ├── BackButton.tsx
│   ├── ConfettiEffect.tsx
│   ├── CountdownTimer.tsx
│   ├── ErrorBoundary.tsx
│   └── ExportButton.tsx
├── /crm                 # Ya existe, agregar más
│   ├── CreateLeadModal.tsx
│   ├── LeadCard.tsx
│   ├── LeadDetailModal.tsx
│   └── PipelineBoard.tsx
├── /notifications       # Nueva carpeta
│   ├── NotificationBell.tsx
│   └── NotificationCenter.tsx
└── /organization        # Nueva carpeta
    ├── OrganizationUsers.tsx
    ├── UserOrganizations.tsx
    └── UserProfile.tsx
```

### Fase 2C: Mover Componentes

**Prioridad:** 🟡 MEDIA

**Orden de movimiento:**
1. Componentes shared (no dependencies)
2. Componentes de CRM
3. Componentes de Tasks
4. Componentes de Dashboard
5. Resto de componentes

**Script de movimiento:**
```bash
# Ejemplo para mover CreateLeadModal
mkdir -p src/components/crm
git mv src/components/CreateLeadModal.tsx src/components/crm/
# Actualizar imports en todos los archivos que lo usen
```

### Fase 2D: Actualizar Imports

**Prioridad:** 🔴 CRÍTICA

Para cada archivo movido:
1. Buscar todos los imports del componente
2. Actualizar las rutas
3. Verificar que el build pase

**Comando:**
```bash
# Buscar todos los imports de un componente
grep -r "from.*CreateLeadModal" src/

# Reemplazar imports (ejemplo)
# De: import { CreateLeadModal } from "@/components/CreateLeadModal"
# A:  import { CreateLeadModal } from "@/components/crm/CreateLeadModal"
```

### Fase 2E: Crear Index Files

**Prioridad:** 🟢 BAJA

Crear archivos index.ts en cada carpeta para exports limpios:

```typescript
// src/components/crm/index.ts
export { CreateLeadModal } from './CreateLeadModal';
export { LeadCard } from './LeadCard';
export { LeadDetailModal } from './LeadDetailModal';
export { PipelineBoard } from './PipelineBoard';

// Permite imports más limpios:
// import { CreateLeadModal, LeadCard } from '@/components/crm';
```

---

## 🎯 RESULTADOS ESPERADOS

### Antes
```
src/components/
├── [351 archivos mezclados]
└── imports confusos
```

### Después
```
src/components/
├── /shared (componentes reutilizables)
├── /crm (todo lo relacionado a CRM)
├── /tasks (todo lo relacionado a tareas)
├── /dashboard (todo lo relacionado a dashboard)
├── /notifications (notificaciones)
├── /organization (gestión de org)
└── [Carpetas existentes bien organizadas]

// Imports claros:
import { CreateLeadModal } from '@/components/crm';
import { AlertCard } from '@/components/shared';
```

---

## ⚠️ RIESGOS Y MITIGACIONES

### Riesgo 1: Romper imports existentes
**Mitigación:**
- Mover 1 componente a la vez
- Actualizar imports inmediatamente
- Ejecutar build después de cada movimiento

### Riesgo 2: Imports circulares
**Mitigación:**
- Mantener componentes shared sin dependencies complejas
- Usar barrel exports (index.ts) cuidadosamente

### Riesgo 3: Merge conflicts si hay cambios paralelos
**Mitigación:**
- Hacer esto en una rama separada
- Hacer PR pequeños y frecuentes

---

## 📊 PROGRESO

- [ ] Fase 2A: Identificar y eliminar duplicados
- [ ] Fase 2B: Crear estructura de carpetas
- [ ] Fase 2C: Mover componentes (en progreso)
- [ ] Fase 2D: Actualizar imports
- [ ] Fase 2E: Crear index files
- [ ] Verificación final: Build pasa
- [ ] Commit y push

---

## 🚀 SIGUIENTE PASO

**ACCIÓN INMEDIATA:** Ejecutar búsqueda de duplicados

```bash
# Buscar imports de AIAnalysisDashboard
grep -r "import.*AIAnalysisDashboard" src/

# Buscar imports de FinancialHealthSection
grep -r "import.*FinancialHealthSection" src/
```

---

**Autor:** Claude Sonnet 4.5
**Última actualización:** 2026-01-24
