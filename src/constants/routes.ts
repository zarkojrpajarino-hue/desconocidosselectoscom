/**
 * @fileoverview Centralized route constants for type-safe navigation
 *
 * Usage:
 * import { ROUTES } from '@/constants/routes';
 * navigate(ROUTES.DASHBOARD.HOME);
 */

/**
 * Main application routes
 */
export const ROUTES = {
  // Root & Landing
  ROOT: '/',
  HOME: '/home',
  LOGIN: '/login',
  SIGNUP: '/signup',

  // Auth & Password
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  AUTH_GOOGLE_CALLBACK: '/auth/google/callback',

  // Onboarding
  ONBOARDING: '/onboarding',
  ONBOARDING_DISCOVERY: '/onboarding/discovery',
  ONBOARDING_STARTUP: '/onboarding/startup',
  ONBOARDING_SUCCESS: '/onboarding/success',
  GENERATING_WORKSPACE: '/generating-workspace',

  // Organization
  SELECT_ORGANIZATION: '/select-organization',
  JOIN_BY_TOKEN: (token: string) => `/join/${token}` as const,

  // Dashboard
  DASHBOARD: {
    ROOT: '/dashboard',
    HOME: '/dashboard/home',
    AGENDA: '/dashboard/agenda',
    GAMIFICATION: '/dashboard/gamification',
    NOTIFICATIONS: '/dashboard/notifications',
    BRAND_KIT: '/dashboard/brand-kit',
    WEB_GENERATOR: '/dashboard/web-generator',
  },

  // CRM
  CRM: {
    ROOT: '/crm',
    HUB: '/crm/hub',
    PIPELINE: '/crm/pipeline',
    USER_LEADS: (userId: string) => `/crm/user/${userId}` as const,
  },

  // OKRs
  OKRS: {
    ROOT: '/okrs',
    HISTORY: '/okrs/history',
    HISTORY_USER: (userId: string) => `/okrs/history/${userId}` as const,
    ORGANIZATION: '/okrs/organization',
    ORGANIZATION_HISTORY: '/okrs/organization/history',
  },

  // Financial
  FINANCIAL: {
    ROOT: '/financial',
    TRANSACTIONS: '/financial/transactions',
    TRANSACTIONS_USER: (userId: string) => `/financial/transactions/user/${userId}` as const,
  },

  // Business Metrics
  BUSINESS_METRICS: {
    ROOT: '/business-metrics',
    USER: (userId: string) => `/business-metrics/user/${userId}` as const,
  },

  // Herramientas (Tools)
  HERRAMIENTAS: {
    ROOT: '/herramientas',
    HUB: '/herramientas-hub',
    BUYER_PERSONA: '/herramientas/buyer-persona',
    CUSTOMER_JOURNEY: '/herramientas/customer-journey',
    GROWTH_MODEL: '/herramientas/growth-model',
    LEAD_SCORING: '/herramientas/lead-scoring',
  },

  // Practicar (Practice)
  PRACTICAR: {
    ROOT: '/practicar',
    GUIA: '/practicar/guia',
    GUIA_INTERACTIVA: '/practicar/guia-interactiva',
    PLAYBOOK: '/practicar/playbook',
    SIMULADOR: '/practicar/simulador',
  },

  // AI & Analysis
  AI_ANALYSIS: '/ai-analysis',
  SCALABILITY: {
    ROOT: '/scalability',
    ANALYSIS: (analysisId: string) => `/scalability/${analysisId}` as const,
  },
  DISCOVERY_RESULTS: '/discovery-results',

  // BI & Integrations
  BI: '/bi',
  INTEGRACIONES: '/integraciones',
  INTEGRACIONES_DASHBOARD: '/integraciones-dashboard',

  // Other Features
  ALERTS: '/alerts',
  GAMIFICATION: '/gamification',
  METRICS: '/metrics',
  AGENDA_GLOBAL: '/agenda-global',

  // User & Settings
  PROFILE: '/profile',
  SETTINGS: {
    API_KEYS: '/settings/api-keys',
    INTEGRATIONS: '/settings/integrations',
    BILLING: '/settings/billing',
  },

  // Admin
  ADMIN: {
    ROOT: '/admin',
    ONBOARDINGS: '/admin/onboardings',
  },

  // Plan & Pricing
  SELECT_PLAN: '/select-plan',
  PRICING: '/pricing',
  PRICING_ANCHOR: '/#pricing',

  // Installation
  INSTALL: '/install',

  // Catch-all
  NOT_FOUND: '*',
} as const;

/**
 * Helper type to extract all route strings
 */
type ExtractRoutes<T> = T extends string
  ? T
  : T extends (...args: any[]) => infer R
  ? R
  : T extends object
  ? { [K in keyof T]: ExtractRoutes<T[K]> }[keyof T]
  : never;

export type RouteValue = ExtractRoutes<typeof ROUTES>;

/**
 * Check if a path matches a route
 */
export function isRoute(path: string, route: string | ((...args: any[]) => string)): boolean {
  if (typeof route === 'string') {
    return path === route;
  }
  // For parameterized routes, check pattern match
  return false; // Basic implementation, can be enhanced
}

/**
 * Relative routes (used within nested Route components)
 */
export const RELATIVE_ROUTES = {
  DASHBOARD: {
    HOME: 'home',
    AGENDA: 'agenda',
    GAMIFICATION: 'gamification',
    NOTIFICATIONS: 'notifications',
    BRAND_KIT: 'brand-kit',
    WEB_GENERATOR: 'web-generator',
  },
  HERRAMIENTAS: {
    BUYER_PERSONA: 'buyer-persona',
    CUSTOMER_JOURNEY: 'customer-journey',
    GROWTH_MODEL: 'growth-model',
    LEAD_SCORING: 'lead-scoring',
  },
  PRACTICAR: {
    GUIA: 'guia',
    GUIA_INTERACTIVA: 'guia-interactiva',
    PLAYBOOK: 'playbook',
    SIMULADOR: 'simulador',
  },
} as const;
