# 🛣️ Guía de Uso de Constantes de Rutas

**Archivo:** `src/constants/routes.ts`

## 🎯 Objetivo

Eliminar magic strings en navegación y proporcionar:
- ✅ Type safety completo
- ✅ Autocomplete en el IDE
- ✅ Refactoring fácil y seguro
- ✅ Punto único de definición

---

## 📖 Uso Básico

### Importar las constantes

```typescript
import { ROUTES } from '@/constants/routes';
// o desde el barrel export
import { ROUTES } from '@/constants';
```

### Navegación simple

```typescript
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants';

function MyComponent() {
  const navigate = useNavigate();

  const goToHome = () => {
    navigate(ROUTES.HOME);
  };

  const goToDashboard = () => {
    navigate(ROUTES.DASHBOARD.HOME);
  };

  const goToOKRs = () => {
    navigate(ROUTES.OKRS.ROOT);
  };
}
```

### Navegación con parámetros

```typescript
import { ROUTES } from '@/constants';

function UserLeadsButton({ userId }: { userId: string }) {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate(ROUTES.CRM.USER_LEADS(userId))}>
      Ver leads del usuario
    </button>
  );
}
```

### En componentes Link

```typescript
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants';

function Navigation() {
  return (
    <nav>
      <Link to={ROUTES.DASHBOARD.HOME}>Dashboard</Link>
      <Link to={ROUTES.CRM.HUB}>CRM Hub</Link>
      <Link to={ROUTES.OKRS.ROOT}>OKRs</Link>
    </nav>
  );
}
```

---

## 🗺️ Estructura de Rutas

### Rutas de primer nivel

```typescript
ROUTES.HOME               // '/home'
ROUTES.LOGIN              // '/login'
ROUTES.PROFILE            // '/profile'
ROUTES.AI_ANALYSIS        // '/ai-analysis'
```

### Rutas anidadas (objetos)

```typescript
ROUTES.DASHBOARD.ROOT           // '/dashboard'
ROUTES.DASHBOARD.HOME           // '/dashboard/home'
ROUTES.DASHBOARD.AGENDA         // '/dashboard/agenda'
ROUTES.DASHBOARD.NOTIFICATIONS  // '/dashboard/notifications'

ROUTES.CRM.ROOT       // '/crm'
ROUTES.CRM.HUB        // '/crm/hub'
ROUTES.CRM.PIPELINE   // '/crm/pipeline'

ROUTES.OKRS.ROOT                   // '/okrs'
ROUTES.OKRS.HISTORY                // '/okrs/history'
ROUTES.OKRS.ORGANIZATION           // '/okrs/organization'
ROUTES.OKRS.ORGANIZATION_HISTORY   // '/okrs/organization/history'
```

### Rutas con parámetros (funciones)

```typescript
// Usuario específico en CRM
ROUTES.CRM.USER_LEADS('user-123')
// Retorna: '/crm/user/user-123'

// Historial de OKRs de usuario
ROUTES.OKRS.HISTORY_USER('user-456')
// Retorna: '/okrs/history/user-456'

// Análisis de escalabilidad específico
ROUTES.SCALABILITY.ANALYSIS('analysis-789')
// Retorna: '/scalability/analysis-789'

// Join por token
ROUTES.JOIN_BY_TOKEN('invite-abc123')
// Retorna: '/join/invite-abc123'
```

---

## 🔧 Rutas Relativas

Para usar dentro de componentes `<Route>` anidados:

```typescript
import { RELATIVE_ROUTES } from '@/constants/routes';

// En App.tsx o routing config
<Route path="/dashboard" element={<DashboardLayout />}>
  <Route path={RELATIVE_ROUTES.DASHBOARD.HOME} element={<DashboardHome />} />
  <Route path={RELATIVE_ROUTES.DASHBOARD.AGENDA} element={<Agenda />} />
  <Route path={RELATIVE_ROUTES.DASHBOARD.GAMIFICATION} element={<Gamification />} />
</Route>
```

---

## ✨ Casos de Uso Comunes

### 1. Redirección después de login

```typescript
import { ROUTES } from '@/constants';

const handleLogin = async () => {
  await login(credentials);
  navigate(ROUTES.HOME);
};
```

### 2. Navegación condicional

```typescript
import { ROUTES } from '@/constants';

const navigateBasedOnRole = (role: string) => {
  if (role === 'admin') {
    navigate(ROUTES.ADMIN.ROOT);
  } else {
    navigate(ROUTES.DASHBOARD.HOME);
  }
};
```

### 3. Breadcrumbs

```typescript
import { ROUTES } from '@/constants';

const breadcrumbs = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD.ROOT },
  { label: 'CRM', path: ROUTES.CRM.ROOT },
  { label: 'Pipeline', path: ROUTES.CRM.PIPELINE },
];
```

### 4. Botones de navegación

```typescript
import { ROUTES } from '@/constants';

<Button onClick={() => navigate(ROUTES.SELECT_PLAN)}>
  Seleccionar Plan
</Button>

<Button onClick={() => navigate(ROUTES.PRICING_ANCHOR)}>
  Ver Precios
</Button>
```

### 5. Modal de upgrade

```typescript
import { ROUTES } from '@/constants';

const UpgradePrompt = () => {
  const navigate = useNavigate();

  return (
    <Dialog>
      <DialogContent>
        <h2>Actualiza tu plan</h2>
        <Button onClick={() => navigate(ROUTES.PRICING)}>
          Ver planes
        </Button>
      </DialogContent>
    </Dialog>
  );
};
```

---

## 🎨 TypeScript Benefits

### Autocomplete

Al escribir `ROUTES.`, tu IDE mostrará todas las rutas disponibles con autocomplete.

### Type Safety

```typescript
// ✅ Correcto
navigate(ROUTES.DASHBOARD.HOME);

// ❌ Error de TypeScript
navigate(ROUTES.DASHBOARD.HOMEE); // Typo detectado

// ✅ Correcto con parámetros
navigate(ROUTES.CRM.USER_LEADS('123'));

// ❌ Error si faltan parámetros
navigate(ROUTES.CRM.USER_LEADS()); // TypeScript error
```

### Refactoring Seguro

Si cambias una ruta, TypeScript te mostrará todos los lugares donde se usa:

```typescript
// Cambiar de '/dashboard/home' a '/dashboard/overview'
// TypeScript encontrará TODOS los usos y te ayudará a actualizarlos
```

---

## 📋 Lista Completa de Rutas

### Auth & Onboarding
- `ROUTES.LOGIN`
- `ROUTES.SIGNUP`
- `ROUTES.FORGOT_PASSWORD`
- `ROUTES.RESET_PASSWORD`
- `ROUTES.VERIFY_EMAIL`
- `ROUTES.ONBOARDING`
- `ROUTES.ONBOARDING_DISCOVERY`
- `ROUTES.ONBOARDING_STARTUP`
- `ROUTES.ONBOARDING_SUCCESS`

### Dashboard
- `ROUTES.DASHBOARD.ROOT`
- `ROUTES.DASHBOARD.HOME`
- `ROUTES.DASHBOARD.AGENDA`
- `ROUTES.DASHBOARD.GAMIFICATION`
- `ROUTES.DASHBOARD.NOTIFICATIONS`

### CRM
- `ROUTES.CRM.ROOT`
- `ROUTES.CRM.HUB`
- `ROUTES.CRM.PIPELINE`
- `ROUTES.CRM.USER_LEADS(userId)`

### OKRs
- `ROUTES.OKRS.ROOT`
- `ROUTES.OKRS.HISTORY`
- `ROUTES.OKRS.HISTORY_USER(userId)`
- `ROUTES.OKRS.ORGANIZATION`
- `ROUTES.OKRS.ORGANIZATION_HISTORY`

### Financial
- `ROUTES.FINANCIAL.ROOT`
- `ROUTES.FINANCIAL.TRANSACTIONS`
- `ROUTES.FINANCIAL.TRANSACTIONS_USER(userId)`

### Tools (Herramientas)
- `ROUTES.HERRAMIENTAS.ROOT`
- `ROUTES.HERRAMIENTAS.HUB`
- `ROUTES.HERRAMIENTAS.BUYER_PERSONA`
- `ROUTES.HERRAMIENTAS.CUSTOMER_JOURNEY`
- `ROUTES.HERRAMIENTAS.GROWTH_MODEL`
- `ROUTES.HERRAMIENTAS.LEAD_SCORING`

### Practice (Practicar)
- `ROUTES.PRACTICAR.ROOT`
- `ROUTES.PRACTICAR.GUIA`
- `ROUTES.PRACTICAR.PLAYBOOK`
- `ROUTES.PRACTICAR.SIMULADOR`

### Settings & Profile
- `ROUTES.PROFILE`
- `ROUTES.SETTINGS.API_KEYS`
- `ROUTES.SETTINGS.INTEGRATIONS`
- `ROUTES.SETTINGS.BILLING`

### Admin
- `ROUTES.ADMIN.ROOT`
- `ROUTES.ADMIN.ONBOARDINGS`

### Other
- `ROUTES.AI_ANALYSIS`
- `ROUTES.ALERTS`
- `ROUTES.GAMIFICATION`
- `ROUTES.METRICS`
- `ROUTES.BI`
- `ROUTES.SELECT_PLAN`
- `ROUTES.PRICING`

---

## 🚀 Migración desde Magic Strings

### Antes (❌)

```typescript
// Difícil de mantener, propenso a errores
navigate('/dashboard/home');
navigate('/crm/user/' + userId); // String concatenation
<Link to="/okrs/history">History</Link>
```

### Después (✅)

```typescript
// Type-safe, autocomplete, refactoring fácil
navigate(ROUTES.DASHBOARD.HOME);
navigate(ROUTES.CRM.USER_LEADS(userId)); // Type-safe parameters
<Link to={ROUTES.OKRS.HISTORY}>History</Link>
```

---

## 💡 Tips

1. **Siempre importa ROUTES** - No uses strings hardcodeados
2. **Usa funciones para rutas con parámetros** - Más type-safe que concatenación
3. **Agrupa rutas relacionadas** - Usa objetos anidados (ej: `ROUTES.DASHBOARD.*`)
4. **Documenta rutas nuevas** - Actualiza este archivo cuando agregues rutas

---

**Creado:** 2026-01-24
**Autor:** Claude Sonnet 4.5
**Archivo:** `src/constants/routes.ts`
