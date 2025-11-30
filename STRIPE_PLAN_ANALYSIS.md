# 📊 ANÁLISIS COMPLETO DE PLANES STRIPE - Optimus K

## 🎯 **¿QUÉ ES ADMIN ONBOARDINGS?**

**Ruta:** `/admin/onboardings`  
**Archivo:** `src/pages/AdminOnboardings.tsx`

### Función:
Es una **página exclusiva para administradores** que muestra todos los formularios de onboarding que clientes potenciales han completado desde la landing page pública.

### ¿Qué muestra?
- Lista de empresas que completaron el onboarding
- Datos de contacto (nombre, email, teléfono)
- Descripción del negocio y objetivos
- **Mega-prompt generado con IA** (contexto completo de la empresa)
- Estado: Pending, Processing, Completed
- Botón para copiar el mega-prompt al portapapeles

### Flujo:
```
Cliente Potencial → Completa Onboarding → Submission guardada en BD 
→ Admin ve en /admin/onboardings → Admin copia mega-prompt 
→ Admin puede crear workspace personalizado
```

---

## 💳 **DIFERENCIAS REALES ENTRE PLANES**

### 📋 **Comparativa Detallada:**

| Feature | Free (Trial) | Starter (€129) | Professional (€249) | Enterprise (€499) |
|---------|-------------|----------------|---------------------|-------------------|
| **Usuarios** | 10 | 10 | 25 | Ilimitados |
| **Leads CRM** | ❌ No especificado | 2,000/mes | Ilimitados | Ilimitados |
| **Generaciones IA** | ❌ No especificado | 20/mes | 100/mes | Ilimitadas |
| **Tareas personalizadas** | ❌ No especificado | 50 | Ilimitadas | Ilimitadas |
| **OKRs trimestrales** | ❌ No especificado | 10 | Ilimitados | Ilimitados |
| **Análisis IA** | 1/semana | ❌ No especificado | ❌ No especificado | Ilimitado |
| **CRM** | Básico | Completo | Avanzado | Avanzado+ |
| **Automatizaciones** | ❌ | ❌ | ✅ | ✅ |
| **Integraciones** | ❌ | ❌ | Zapier, Email | Custom APIs |
| **Reportes** | Básicos | Básicos | Avanzados | Personalizados |
| **Soporte** | Email (72h) | Email (48h) | Prioritario (24h) | 24/7 + Manager |
| **White-label** | ❌ | ❌ | ❌ | ✅ |
| **Onboarding** | Self-service | Self-service | Self-service | 2h personalizado |

---

## ⚠️ **ESTADO ACTUAL DE IMPLEMENTACIÓN**

### ✅ **LO QUE ESTÁ IMPLEMENTADO:**

1. **Límite de usuarios (10 usuarios)** ✅
   ```typescript
   // src/pages/SelectRole.tsx línea 55
   const { data: countData } = await supabase.rpc('count_organization_users')
   if (countData >= 10) { /* bloquear */ }
   ```

2. **Análisis IA limitado (1/semana en free)** ✅
   ```sql
   -- Función: can_use_ai_analysis()
   -- En plan free: máximo 1 análisis por semana
   ```

3. **Sistema de planes en BD** ✅
   ```sql
   organizations.plan = 'free' | 'trial' | 'starter' | 'professional' | 'enterprise'
   organizations.trial_ends_at
   organizations.subscription_status
   ```

### ❌ **LO QUE NO ESTÁ IMPLEMENTADO:**

1. **Límite de leads por plan** ❌
   - Starter: 2,000 leads/mes → NO validado
   - Professional/Enterprise: ilimitado

2. **Límite de generaciones IA por plan** ❌
   - Starter: 20/mes → NO validado
   - Professional: 100/mes → NO validado
   - Enterprise: ilimitado

3. **Límite de tareas personalizadas** ❌
   - Starter: 50 tareas → NO validado
   - Professional/Enterprise: ilimitadas

4. **Límite de OKRs por plan** ❌
   - Starter: 10 OKRs/trimestre → NO validado
   - Professional/Enterprise: ilimitados

5. **Límite de usuarios por plan** ⚠️ **PARCIALMENTE**
   - Free/Trial: 10 usuarios ✅ (IMPLEMENTADO)
   - Starter: 10 usuarios → Usa el mismo límite free
   - Professional: 25 usuarios ❌ (NO diferenciado)
   - Enterprise: ilimitados ❌ (NO diferenciado)

6. **Features avanzadas** ❌
   - Automatizaciones (Professional) → NO implementado
   - Integraciones Zapier/Email → NO implementado
   - White-label (Enterprise) → NO implementado
   - Custom API (Enterprise) → NO implementado

---

## 🔧 **LO QUE HAY QUE IMPLEMENTAR**

### **PRIORIDAD CRÍTICA:**

#### 1. **Sistema de Quotas por Plan**
Crear tabla para trackear límites:

```sql
CREATE TABLE plan_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  month DATE NOT NULL,
  
  -- Límites trackeados
  leads_created INTEGER DEFAULT 0,
  ai_generations INTEGER DEFAULT 0,
  tasks_created INTEGER DEFAULT 0,
  okrs_created INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, month)
);
```

#### 2. **Función de Validación de Límites**
```sql
CREATE FUNCTION check_plan_limit(
  org_id UUID,
  limit_type TEXT, -- 'users', 'leads', 'ai_gen', etc.
  increment INTEGER DEFAULT 1
) RETURNS JSONB
```

#### 3. **Middleware de Verificación**
En cada acción crítica verificar:
```typescript
// Antes de crear lead
const canCreate = await checkPlanLimit('leads')
if (!canCreate.allowed) {
  toast.error(`Límite alcanzado: ${canCreate.message}`)
  // Ofrecer upgrade
}
```

#### 4. **Límites por Plan:**

```typescript
const PLAN_LIMITS = {
  free: {
    users: 10,
    leads: 500,
    ai_gen: 5,
    tasks: 20,
    okrs: 3
  },
  starter: {
    users: 10,
    leads: 2000,
    ai_gen: 20,
    tasks: 50,
    okrs: 10
  },
  professional: {
    users: 25,
    leads: -1, // ilimitado
    ai_gen: 100,
    tasks: -1,
    okrs: -1
  },
  enterprise: {
    users: -1, // ilimitado
    leads: -1,
    ai_gen: -1,
    tasks: -1,
    okrs: -1
  }
}
```

---

## 🚨 **RECOMENDACIÓN URGENTE**

**Problema actual:** Los planes se diferencian solo en precio, pero **NO hay restricciones técnicas implementadas**. Todos los planes tienen acceso a TODO.

### **Opciones:**

#### **Opción A: Implementar Límites Reales** ⭐ (Recomendado)
- Crear sistema de quotas completo
- Validar en cada acción (crear lead, generar con IA, etc.)
- Mostrar uso actual vs límite en UI
- Ofrecer upgrade cuando se alcanza límite
- **Tiempo:** ~4-6 horas de desarrollo

#### **Opción B: Simplificar Planes**
- Reducir a 2 planes: Free (trial) y Pro (€199/mes)
- Free: Límites básicos implementados (10 usuarios, 1 análisis IA/semana)
- Pro: Todo ilimitado
- Más fácil de mantener
- **Tiempo:** ~30 minutos ajustar textos

#### **Opción C: Honor System** (NO recomendado)
- Dejar como está sin límites técnicos
- Confiar en que usuarios no abusen
- **Riesgo:** Clientes pueden pagar Starter y usar como Enterprise

---

## 📝 **RESUMEN EJECUTIVO**

### Lo que tienes AHORA:
✅ Infraestructura Stripe completa (webhooks, checkout, BD)  
✅ UI de pricing hermosa y funcional  
✅ Sistema de trial de 14 días que expira automáticamente  
✅ Límite de 10 usuarios implementado  
✅ Límite de 1 análisis IA/semana en free  

### Lo que FALTA:
❌ Límites de leads por mes  
❌ Límites de generaciones IA por mes  
❌ Límites de tareas y OKRs  
❌ Diferenciación de usuarios (10 vs 25 vs ilimitado)  
❌ Features exclusivas (automatizaciones, white-label, API)  

### Mi recomendación:
**Lanza con Opción B (2 planes simplificados)** para MVP, luego implementa Opción A cuando tengas tracción.

---

¿Quieres que implemente la **Opción A (sistema completo de quotas)** o prefieres **Opción B (simplificar a 2 planes)**?
