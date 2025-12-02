/**
 * LÍMITES Y FEATURES POR PLAN DE SUSCRIPCIÓN
 * 
 * Estructura:
 * - free: Trial gratuito de 14 días
 * - starter: €129/mes
 * - professional: €249/mes
 * - enterprise: €499/mes
 * 
 * IMPORTANTE: -1 significa ilimitado
 */

export type PlanType = 'free' | 'trial' | 'starter' | 'professional' | 'enterprise';

export interface PlanLimits {
  // ORGANIZACIONES (MULTI-TENANCY)
  max_organizations_owned: number;  // Organizaciones que puede CREAR/SER OWNER (-1 = ilimitado)
  max_organizations_joined: number;  // Organizaciones a las que puede UNIRSE (-1 = ilimitado)
  
  // USUARIOS Y EQUIPO
  max_users: number;
  
  // CRM Y LEADS
  max_leads_per_month: number;
  pipeline_drag_drop: boolean;
  lead_scoring: 'manual' | 'automatic' | 'ml_predictions' | 'custom_rules';
  lead_interactions: boolean;
  lost_reasons_analysis: boolean;
  deal_velocity: boolean;
  pipeline_forecast: boolean;
  automation_engine: boolean | 'advanced';
  custom_pipelines: boolean;
  
  // TAREAS Y FASES
  available_phases: number[];  // [1] o [1,2] o [1,2,3,4] o 'custom'
  tasks_per_phase_per_user: number;  // Siempre 12 (no se limita)
  work_modes: Array<'conservador' | 'moderado' | 'agresivo'>;
  task_swaps: boolean | number;  // false, true, o -1 (ilimitado)
  task_validation: 'basic' | 'ai_feedback' | 'ai_questions' | 'custom_workflows';
  ai_task_suggestions: boolean;
  bulk_task_operations: boolean;
  
  // OKRS
  max_objectives: number;  // -1 = ilimitado
  okr_dependencies: boolean;
  okr_retrospective: boolean;
  okr_quarterly_view: boolean;
  okr_checkin_form: boolean;
  
  // KPIS
  max_kpis: number;  // -1 = ilimitado
  kpi_auto_update: boolean;
  kpi_benchmarking: boolean;
  kpi_targets: boolean;
  kpi_change_analysis: boolean;
  custom_kpis: boolean;
  
  // FINANZAS
  revenue_tracking: boolean;
  expense_tracking: boolean;
  cash_flow_forecast: boolean;
  financial_ratios: boolean;
  budget_tracking: boolean;
  product_profitability: boolean;
  financial_projections: boolean;
  financial_ai_insights: boolean;
  multi_currency: boolean;
  
  // IA
  max_ai_analysis_per_month: number;  // -1 = ilimitado
  max_ai_tools: number;  // Número de herramientas IA disponibles
  available_ai_tools: string[];
  ai_weekly_insights: boolean;
  ai_predictive_models: boolean;
  custom_ai_tools: boolean;
  
  // ALERTAS
  smart_alerts: boolean;
  email_notifications: boolean;
  custom_alert_rules: boolean;
  slack_integration: boolean;
  teams_integration: boolean;
  
  // GAMIFICACIÓN
  gamification_enabled: boolean;
  custom_badges: boolean;
  custom_point_rules: boolean;
  
  // INTEGRACIONES
  google_calendar: boolean | 'bidirectional';
  exportations: 'none' | 'csv_basic' | 'excel_advanced' | 'api_full';
  api_access: 'none' | 'read_only' | 'full';
  zapier: boolean;
  webhooks: boolean;
  custom_integrations: boolean;
  
  // REPORTES
  basic_reports: boolean;
  advanced_reports: boolean;
  custom_reports: boolean;
  white_label: boolean;
  
  // SOPORTE
  support: 'none' | 'email_48h' | 'email_24h' | 'dedicated_24_7';
  onboarding: 'self_service' | 'guided_30min' | 'premium_2h';
  account_manager: boolean;
  sla: string | null;
}

/**
 * DEFINICIÓN DE LÍMITES POR PLAN
 */
export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  // 🆓 FREE/TRIAL (14 días = 2 semanas = 2 fases)
  free: {
    // ORGANIZACIONES
    max_organizations_owned: 1,  // Solo puede crear/ser owner de 1 organización
    max_organizations_joined: 3,  // Puede unirse a 3 organizaciones adicionales
    
    // USUARIOS
    max_users: 3,
    
    // CRM
    max_leads_per_month: 50,
    pipeline_drag_drop: false,
    lead_scoring: 'manual',
    lead_interactions: true,
    lost_reasons_analysis: false,
    deal_velocity: false,
    pipeline_forecast: false,
    automation_engine: false,
    custom_pipelines: false,
    
    // TAREAS
    available_phases: [1, 2],  // Fases 1 y 2 (2 semanas de trial)
    tasks_per_phase_per_user: 12,  // Siempre genera 12
    work_modes: ['conservador', 'moderado', 'agresivo'],  // TODOS disponibles
    task_swaps: false,
    task_validation: 'basic',
    ai_task_suggestions: false,
    bulk_task_operations: false,
    
    // OKRS
    max_objectives: 3,
    okr_dependencies: false,
    okr_retrospective: false,
    okr_quarterly_view: false,
    okr_checkin_form: false,
    
    // KPIS
    max_kpis: 5,
    kpi_auto_update: false,
    kpi_benchmarking: false,
    kpi_targets: false,
    kpi_change_analysis: false,
    custom_kpis: false,
    
    // FINANZAS
    revenue_tracking: true,
    expense_tracking: true,
    cash_flow_forecast: false,
    financial_ratios: false,
    budget_tracking: false,
    product_profitability: false,
    financial_projections: false,
    financial_ai_insights: false,
    multi_currency: false,
    
    // IA
    max_ai_analysis_per_month: 2,  // 2 análisis total en el trial
    max_ai_tools: 2,
    available_ai_tools: ['buyer_persona', 'lead_scoring'],
    ai_weekly_insights: false,
    ai_predictive_models: false,
    custom_ai_tools: false,
    
    // ALERTAS
    smart_alerts: true,
    email_notifications: false,
    custom_alert_rules: false,
    slack_integration: false,
    teams_integration: false,
    
    // GAMIFICACIÓN
    gamification_enabled: true,
    custom_badges: false,
    custom_point_rules: false,
    
    // INTEGRACIONES
    google_calendar: false,
    exportations: 'none',
    api_access: 'none',
    zapier: false,
    webhooks: false,
    custom_integrations: false,
    
    // REPORTES
    basic_reports: true,
    advanced_reports: false,
    custom_reports: false,
    white_label: false,
    
    // SOPORTE
    support: 'none',
    onboarding: 'self_service',
    account_manager: false,
    sla: null,
  },

  // 💼 STARTER - €129/mes
  trial: {
    // Mismo que free (trial es un alias de free)
    ...({} as PlanLimits),  // Se copiará de free
  },

  starter: {
    // ORGANIZACIONES
    max_organizations_owned: 1,  // Solo 1 organización propia
    max_organizations_joined: 5,  // Puede unirse a 5 organizaciones
    
    // USUARIOS
    max_users: 10,
    
    // CRM
    max_leads_per_month: 1000,
    pipeline_drag_drop: true,
    lead_scoring: 'automatic',
    lead_interactions: true,
    lost_reasons_analysis: true,
    deal_velocity: false,
    pipeline_forecast: false,
    automation_engine: false,
    custom_pipelines: false,
    
    // TAREAS
    available_phases: [1, 2],  // Fases 1-2
    tasks_per_phase_per_user: 12,
    work_modes: ['conservador', 'moderado', 'agresivo'],
    task_swaps: true,
    task_validation: 'ai_feedback',
    ai_task_suggestions: false,
    bulk_task_operations: false,
    
    // OKRS
    max_objectives: 10,
    okr_dependencies: false,
    okr_retrospective: false,
    okr_quarterly_view: false,
    okr_checkin_form: false,
    
    // KPIS
    max_kpis: 15,
    kpi_auto_update: false,
    kpi_benchmarking: false,
    kpi_targets: true,
    kpi_change_analysis: false,
    custom_kpis: false,
    
    // FINANZAS
    revenue_tracking: true,
    expense_tracking: true,
    cash_flow_forecast: true,
    financial_ratios: true,
    budget_tracking: true,
    product_profitability: true,
    financial_projections: false,
    financial_ai_insights: false,
    multi_currency: false,
    
    // IA
    max_ai_analysis_per_month: 4,  // 1 por semana
    max_ai_tools: 4,
    available_ai_tools: [
      'buyer_persona',
      'lead_scoring',
      'growth_model',
      'customer_journey'
    ],
    ai_weekly_insights: false,
    ai_predictive_models: false,
    custom_ai_tools: false,
    
    // ALERTAS
    smart_alerts: true,
    email_notifications: true,
    custom_alert_rules: false,
    slack_integration: false,
    teams_integration: false,
    
    // GAMIFICACIÓN
    gamification_enabled: true,
    custom_badges: false,
    custom_point_rules: false,
    
    // INTEGRACIONES
    google_calendar: false,
    exportations: 'csv_basic',
    api_access: 'none',
    zapier: false,
    webhooks: false,
    custom_integrations: false,
    
    // REPORTES
    basic_reports: true,
    advanced_reports: false,
    custom_reports: false,
    white_label: false,
    
    // SOPORTE
    support: 'email_48h',
    onboarding: 'self_service',
    account_manager: false,
    sla: null,
  },

  // ⚡ PROFESSIONAL - €249/mes (MÁS POPULAR)
  professional: {
    // ORGANIZACIONES
    max_organizations_owned: 3,  // Hasta 3 organizaciones propias
    max_organizations_joined: 10,  // Puede unirse a 10 organizaciones
    
    // USUARIOS
    max_users: 25,
    
    // CRM
    max_leads_per_month: 5000,
    pipeline_drag_drop: true,
    lead_scoring: 'ml_predictions',
    lead_interactions: true,
    lost_reasons_analysis: true,
    deal_velocity: true,
    pipeline_forecast: true,
    automation_engine: true,
    custom_pipelines: false,
    
    // TAREAS
    available_phases: [1, 2, 3, 4],  // TODAS las fases
    tasks_per_phase_per_user: 12,
    work_modes: ['conservador', 'moderado', 'agresivo'],
    task_swaps: true,
    task_validation: 'ai_questions',
    ai_task_suggestions: true,
    bulk_task_operations: false,
    
    // OKRS
    max_objectives: -1,  // Ilimitado
    okr_dependencies: true,
    okr_retrospective: true,
    okr_quarterly_view: true,
    okr_checkin_form: false,
    
    // KPIS
    max_kpis: -1,  // Ilimitado (todos los 20+)
    kpi_auto_update: true,
    kpi_benchmarking: true,
    kpi_targets: true,
    kpi_change_analysis: true,
    custom_kpis: false,
    
    // FINANZAS
    revenue_tracking: true,
    expense_tracking: true,
    cash_flow_forecast: true,
    financial_ratios: true,
    budget_tracking: true,
    product_profitability: true,
    financial_projections: true,
    financial_ai_insights: false,
    multi_currency: false,
    
    // IA
    max_ai_analysis_per_month: 8,  // 2 por semana
    max_ai_tools: 8,  // TODAS
    available_ai_tools: [
      'buyer_persona',
      'lead_scoring',
      'growth_model',
      'customer_journey',
      'sales_playbook',
      'sales_simulator',
      'communication_guide',
      'opportunity_calculator'
    ],
    ai_weekly_insights: true,
    ai_predictive_models: false,
    custom_ai_tools: false,
    
    // ALERTAS
    smart_alerts: true,
    email_notifications: true,
    custom_alert_rules: true,
    slack_integration: true,
    teams_integration: false,
    
    // GAMIFICACIÓN
    gamification_enabled: true,
    custom_badges: true,
    custom_point_rules: false,
    
    // INTEGRACIONES
    google_calendar: true,
    exportations: 'excel_advanced',
    api_access: 'read_only',
    zapier: true,
    webhooks: false,
    custom_integrations: false,
    
    // REPORTES
    basic_reports: true,
    advanced_reports: true,
    custom_reports: true,
    white_label: false,
    
    // SOPORTE
    support: 'email_24h',
    onboarding: 'guided_30min',
    account_manager: false,
    sla: null,
  },

  // 🚀 ENTERPRISE - €499/mes
  enterprise: {
    // ORGANIZACIONES
    max_organizations_owned: -1,  // Ilimitado
    max_organizations_joined: -1,  // Ilimitado
    
    // USUARIOS
    max_users: -1,  // Ilimitado
    
    // CRM
    max_leads_per_month: -1,  // Ilimitado
    pipeline_drag_drop: true,
    lead_scoring: 'custom_rules',
    lead_interactions: true,
    lost_reasons_analysis: true,
    deal_velocity: true,
    pipeline_forecast: true,
    automation_engine: 'advanced',
    custom_pipelines: true,
    
    // TAREAS
    available_phases: [1, 2, 3, 4],  // Todas + custom
    tasks_per_phase_per_user: 12,
    work_modes: ['conservador', 'moderado', 'agresivo'],
    task_swaps: -1,  // Ilimitado
    task_validation: 'custom_workflows',
    ai_task_suggestions: true,
    bulk_task_operations: true,
    
    // OKRS
    max_objectives: -1,
    okr_dependencies: true,
    okr_retrospective: true,
    okr_quarterly_view: true,
    okr_checkin_form: true,
    
    // KPIS
    max_kpis: -1,
    kpi_auto_update: true,
    kpi_benchmarking: true,
    kpi_targets: true,
    kpi_change_analysis: true,
    custom_kpis: true,
    
    // FINANZAS
    revenue_tracking: true,
    expense_tracking: true,
    cash_flow_forecast: true,
    financial_ratios: true,
    budget_tracking: true,
    product_profitability: true,
    financial_projections: true,
    financial_ai_insights: true,
    multi_currency: true,
    
    // IA
    max_ai_analysis_per_month: -1,  // Ilimitado
    max_ai_tools: -1,
    available_ai_tools: [],  // Todas + custom
    ai_weekly_insights: true,
    ai_predictive_models: true,
    custom_ai_tools: true,
    
    // ALERTAS
    smart_alerts: true,
    email_notifications: true,
    custom_alert_rules: true,
    slack_integration: true,
    teams_integration: true,
    
    // GAMIFICACIÓN
    gamification_enabled: true,
    custom_badges: true,
    custom_point_rules: true,
    
    // INTEGRACIONES
    google_calendar: 'bidirectional',
    exportations: 'api_full',
    api_access: 'full',
    zapier: true,
    webhooks: true,
    custom_integrations: true,
    
    // REPORTES
    basic_reports: true,
    advanced_reports: true,
    custom_reports: true,
    white_label: true,
    
    // SOPORTE
    support: 'dedicated_24_7',
    onboarding: 'premium_2h',
    account_manager: true,
    sla: '99.9%',
  },
};

// Copiar límites de free a trial
PLAN_LIMITS.trial = { ...PLAN_LIMITS.free };

/**
 * NOMBRES AMIGABLES DE PLANES
 */
export const PLAN_NAMES: Record<PlanType, string> = {
  free: 'Gratuito',
  trial: 'Trial (14 días)',
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

/**
 * PRECIOS DE PLANES (en euros)
 */
export const PLAN_PRICES: Record<PlanType, number> = {
  free: 0,
  trial: 0,
  starter: 129,
  professional: 249,
  enterprise: 499,
};

/**
 * Utilidad para verificar si un plan tiene una feature
 */
export function hasPlanFeature(plan: PlanType, feature: keyof PlanLimits): boolean {
  const limits = PLAN_LIMITS[plan];
  const value = limits[feature];
  
  // Si es boolean, retornar directamente
  if (typeof value === 'boolean') return value;
  
  // Si es número, verificar si es > 0 o -1 (ilimitado)
  if (typeof value === 'number') return value !== 0;
  
  // Si es string, verificar si no es 'none'
  if (typeof value === 'string') return value !== 'none';
  
  // Si es array, verificar si tiene elementos
  if (Array.isArray(value)) return value.length > 0;
  
  return false;
}

/**
 * Utilidad para verificar si un límite está alcanzado
 */
export function isLimitReached(plan: PlanType, limitKey: keyof PlanLimits, currentValue: number): boolean {
  const limits = PLAN_LIMITS[plan];
  const limit = limits[limitKey];
  
  // Si el límite es -1, es ilimitado
  if (typeof limit === 'number' && limit === -1) return false;
  
  // Si el límite es un número, comparar
  if (typeof limit === 'number') return currentValue >= limit;
  
  return false;
}

/**
 * Obtener el siguiente plan recomendado
 */
export function getRecommendedUpgrade(currentPlan: PlanType): PlanType | null {
  const upgradeChain: Record<PlanType, PlanType | null> = {
    free: 'starter',
    trial: 'starter',
    starter: 'professional',
    professional: 'enterprise',
    enterprise: null,
  };
  
  return upgradeChain[currentPlan];
}
