# OPTIMUS-K

**Plataforma integral para gestión y crecimiento de startups**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-purple.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud-green.svg)](https://supabase.com/)
[![Tests](https://img.shields.io/badge/Tests-130+-brightgreen.svg)](./tests)
[![E2E](https://img.shields.io/badge/E2E-5_specs-blue.svg)](./e2e)

---

## 🚀 Características

### CRM & Ventas
- **Pipeline Visual**: Gestión de leads con drag & drop
- **Lead Scoring**: Puntuación automática de leads
- **Integraciones**: HubSpot, Slack, Calendar

### OKRs & Objetivos
- **OKRs Semanales**: Generación con IA personalizada
- **Key Results**: Tracking de métricas con progreso visual
- **Alertas**: Notificaciones de objetivos en riesgo

### Finanzas
- **Dashboard Financiero**: Ingresos, gastos, márgenes
- **Cash Flow**: Proyecciones y runway
- **ROI Marketing**: Análisis por canal

### Integraciones Enterprise
- **Slack**: Notificaciones en tiempo real
- **HubSpot**: Sincronización bidireccional de contactos
- **Google Calendar**: Sincronización de tareas
- **Asana/Trello**: Sincronización de proyectos
- **Zapier**: 5000+ conexiones de apps
- **API REST**: Webhooks y API Keys

### IA & Analytics
- **10+ Herramientas IA**: Buyer personas, growth models, etc.
- **Análisis Competitivo**: Inteligencia de mercado
- **Gamificación**: Badges, puntos y rankings

---

## 📁 Estructura del Proyecto

```
src/
├── components/           # Componentes React reutilizables
│   ├── ui/              # Componentes shadcn/ui base
│   ├── enterprise/      # Componentes enterprise (métricas avanzadas)
│   ├── layout/          # Layout components (AppLayout, Sidebar)
│   ├── mobile/          # Componentes móviles (BottomNav, PWA)
│   └── tasks/           # Componentes de tareas
├── pages/               # Páginas de rutas
├── hooks/               # Custom React hooks
│   └── integrations/    # Hooks de integraciones (API, Slack, etc.)
├── types/               # Definiciones TypeScript
├── contexts/            # React Context providers
├── lib/                 # Utilidades y helpers
├── constants/           # Constantes de la aplicación
└── integrations/        # Configuración Supabase

supabase/
├── functions/           # Edge Functions (40+ funciones)
└── migrations/          # Migraciones de base de datos

tests/
├── components/          # Tests de componentes
├── hooks/               # Tests de hooks
├── lib/                 # Tests de utilidades
└── utils/               # Tests de helpers

e2e/
├── auth.spec.ts         # Tests de autenticación
├── crm.spec.ts          # Tests de CRM
├── checkout.spec.ts     # Tests de checkout/pricing
├── tasks.spec.ts        # Tests de tareas
└── onboarding.spec.ts   # Tests de onboarding
```

---

## 🛠️ Tech Stack

| Categoría | Tecnología |
|-----------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **UI** | Tailwind CSS, shadcn/ui, Lucide Icons |
| **Backend** | Supabase (Auth, Database, Edge Functions) |
| **State** | TanStack Query, React Context |
| **Testing** | Vitest, Testing Library, Playwright |
| **Payments** | Stripe |
| **Monitoring** | Sentry |

---

## 🚀 Quick Start

```bash
# Clonar repositorio
git clone <repo-url>
cd optimus-k

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build
```

---

## 📊 Testing

### Resumen de Tests

| Tipo | Archivos | Tests | Coverage |
|------|----------|-------|----------|
| **Unit Tests** | 14 | ~130 | 18-22% |
| **E2E Tests** | 5 | ~35 | Flujos críticos |
| **Total** | 19 | ~165 | - |

### Ejecutar Tests

```bash
# Ejecutar unit tests
npm test

# Tests con UI interactiva
npm run test:ui

# Coverage report
npm run test:coverage

# Ejecutar E2E tests
npx playwright test

# E2E con UI
npx playwright test --ui

# E2E en modo headed (ver navegador)
npx playwright test --headed
```

### Estructura de Tests

#### Unit Tests (`tests/`)

| Carpeta | Archivos | Descripción |
|---------|----------|-------------|
| `hooks/` | 7 | useLeads, useTasks, useFinancialData, useAuth, etc. |
| `components/` | 4 | LeadCard, PipelineBoard, IntegrationButton, etc. |
| `lib/` | 2 | logger, typeGuards |
| `utils/` | 1 | errorHandler |

#### E2E Tests (`e2e/`)

| Archivo | Tests | Flujo |
|---------|-------|-------|
| `auth.spec.ts` | 12 | Signup, login, protected routes |
| `crm.spec.ts` | 10 | CRM hub, leads, pipeline |
| `checkout.spec.ts` | 9 | Pricing, plans, integrations |
| `tasks.spec.ts` | 10 | Dashboard, agenda, task completion |
| `onboarding.spec.ts` | 9 | Business selection, steps, navigation |

### Configuración E2E

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```

---

## 🏗️ Arquitectura

### Integraciones

Las integraciones se manejan a través del componente `IntegrationButton`:

```tsx
import { IntegrationButton } from '@/components/IntegrationButton';

<IntegrationButton
  type="slack"
  action="notify"
  data={{ message: "¡Nuevo lead ganado!" }}
  onSuccess={() => console.log('Enviado')}
/>
```

### Límites de Suscripción

El acceso a features se controla via `useSubscriptionLimits`:

```tsx
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';

const { limits, hasFeature } = useSubscriptionLimits();

if (hasFeature('integrations_slack')) {
  // Mostrar integración Slack
}
```

### State Management

| Tipo | Herramienta |
|------|-------------|
| **Global** | React Context (Auth, Demo Mode) |
| **Server State** | TanStack Query |
| **Local** | useState, useReducer |

### Error Handling

```tsx
import { handleError, withErrorHandling } from '@/utils/errorHandler';

// Con wrapper
const result = await withErrorHandling(
  () => fetchData(),
  'Error al cargar datos'
);

// Manual
try {
  await riskyOperation();
} catch (error) {
  handleError(error, 'Operación fallida');
}
```

### Logging

```tsx
import { logger } from '@/lib/logger';

// Solo muestra en desarrollo
logger.log('Debug info');
logger.error('Error crítico', error);
logger.warn('Advertencia');
```

---

## 🔐 Seguridad

- **RLS Policies**: Todas las tablas tienen Row Level Security
- **JWT Auth**: Autenticación via Supabase Auth
- **CORS**: Configuración correcta en Edge Functions
- **Rate Limiting**: Límites en endpoints de IA
- **Token Encryption**: OAuth tokens encriptados con AES-256

---

## 📝 Planes de Suscripción

| Plan | Usuarios | Leads/mes | Features |
|------|----------|-----------|----------|
| **Free** | 10 | 2,000 | Básico |
| **Starter** (€129) | 15 | 5,000 | + IA básica |
| **Professional** (€249) | 25 | Ilimitado | + Integraciones |
| **Enterprise** (€499) | Ilimitado | Ilimitado | + Todo |

---

## 📈 CI/CD

El proyecto incluye GitHub Actions para CI:

```yaml
# .github/workflows/ci.yml
- TypeScript checks
- Build verification
- Unit tests
- Security audit
- Edge function validation
```

---

## 🔗 Links

- **Lovable Project**: https://lovable.dev/projects/7601fa16-c666-4f01-b370-6cee93c40cc0
- **Documentación**: [docs.lovable.dev](https://docs.lovable.dev/)

---

## 📄 Licencia

MIT License
