// Constantes centralizadas para la aplicación

export const SWAP_LIMITS = {
  conservador: 5,
  moderado: 7,
  agresivo: 10
} as const;

export type WorkMode = keyof typeof SWAP_LIMITS;

export const QUERY_STALE_TIMES = {
  tasks: 5 * 60 * 1000,
  taskCompletions: 2 * 60 * 1000,
  userRoles: 5 * 60 * 1000,
  leads: 3 * 60 * 1000,
} as const;

export const NO_ORG_REQUIRED_ROUTES = [
  '/select-organization',
  '/onboarding',
  '/generating-workspace',
  '/profile',
  '/join',
  '/pricing',
  '/login',
  '/setup'
] as const;

// Re-exportar desde el nuevo sistema de suscripciones para compatibilidad
export { 
  PLAN_LIMITS,
  PLAN_NAMES,
  PLAN_PRICES,
  type PlanType,
  type PlanLimits,
  hasPlanFeature,
  isLimitReached,
  getRecommendedUpgrade 
} from './subscriptionLimits';
