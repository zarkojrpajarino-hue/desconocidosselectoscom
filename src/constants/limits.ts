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

export const PLAN_LIMITS = {
  free: {
    maxUsers: 10,
    maxLeads: 100,
    maxOKRs: 5,
    aiAnalysesPerMonth: 1,
    trialDays: 14,
  },
  starter: {
    maxUsers: 10,
    maxLeads: 2000,
    maxOKRs: 10,
    aiAnalysesPerMonth: 20,
  },
  professional: {
    maxUsers: 25,
    maxLeads: Infinity,
    maxOKRs: Infinity,
    aiAnalysesPerMonth: 100,
  },
  enterprise: {
    maxUsers: Infinity,
    maxLeads: Infinity,
    maxOKRs: Infinity,
    aiAnalysesPerMonth: Infinity,
  },
} as const;
