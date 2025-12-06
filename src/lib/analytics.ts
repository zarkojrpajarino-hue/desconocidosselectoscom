/**
 * @fileoverview Analytics - Sistema de tracking de eventos
 * 
 * Proporciona tracking de analytics usando PostHog para métricas de producto.
 * Solo se activa en producción para evitar datos de desarrollo.
 * 
 * @module lib/analytics
 * 
 * @example
 * ```tsx
 * import { analytics } from '@/lib/analytics';
 * 
 * // Track evento
 * analytics.track('lead_created', { value: 5000, source: 'manual' });
 * 
 * // Identificar usuario
 * analytics.identify(userId, { plan: 'professional', role: 'admin' });
 * ```
 */

import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const isProduction = import.meta.env.PROD;

/**
 * Inicializa PostHog analytics
 * Solo se activa en producción con VITE_POSTHOG_KEY configurado
 */
export function initAnalytics() {
  if (isProduction && POSTHOG_KEY) {
    posthog.init(POSTHOG_KEY, {
      api_host: 'https://app.posthog.com',
      capture_pageview: false, // Manual pageviews
      autocapture: false, // Manual events solo
      persistence: 'localStorage',
      disable_session_recording: true, // Privacy first
    });
  }
}

/**
 * API de analytics para tracking de eventos
 */
export const analytics = {
  /**
   * Track page view
   * @param pageName - Nombre de la página
   */
  page: (pageName: string) => {
    if (isProduction && POSTHOG_KEY) {
      posthog.capture('$pageview', { page: pageName });
    }
  },

  /**
   * Track evento personalizado
   * @param event - Nombre del evento
   * @param properties - Propiedades adicionales
   */
  track: (event: string, properties?: Record<string, string | number | boolean>) => {
    if (isProduction && POSTHOG_KEY) {
      posthog.capture(event, properties);
    }
  },

  /**
   * Identificar usuario
   * @param userId - ID único del usuario
   * @param traits - Características del usuario
   */
  identify: (userId: string, traits?: Record<string, string | number | boolean>) => {
    if (isProduction && POSTHOG_KEY) {
      posthog.identify(userId, traits);
    }
  },

  /**
   * Reset usuario (logout)
   */
  reset: () => {
    if (isProduction && POSTHOG_KEY) {
      posthog.reset();
    }
  },

  /**
   * Añadir propiedades al usuario actual
   * @param properties - Propiedades a añadir
   */
  setUserProperties: (properties: Record<string, string | number | boolean>) => {
    if (isProduction && POSTHOG_KEY) {
      posthog.people.set(properties);
    }
  },
};

// Eventos predefinidos para consistencia
export const ANALYTICS_EVENTS = {
  // Auth
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  
  // CRM
  LEAD_CREATED: 'lead_created',
  LEAD_UPDATED: 'lead_updated',
  LEAD_STAGE_CHANGED: 'lead_stage_changed',
  LEAD_WON: 'lead_won',
  LEAD_LOST: 'lead_lost',
  
  // OKRs
  OKR_CREATED: 'okr_created',
  OKR_PROGRESS_UPDATED: 'okr_progress_updated',
  OKR_COMPLETED: 'okr_completed',
  
  // Tasks
  TASK_COMPLETED: 'task_completed',
  TASK_SWAPPED: 'task_swapped',
  
  // Integrations
  INTEGRATION_CONNECTED: 'integration_connected',
  INTEGRATION_USED: 'integration_used',
  
  // AI
  AI_TOOL_USED: 'ai_tool_used',
  AI_ANALYSIS_GENERATED: 'ai_analysis_generated',
  
  // Subscription
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_DOWNGRADED: 'subscription_downgraded',
  TRIAL_STARTED: 'trial_started',
  
  // Export
  DATA_EXPORTED: 'data_exported',
} as const;

export type AnalyticsEvent = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];
