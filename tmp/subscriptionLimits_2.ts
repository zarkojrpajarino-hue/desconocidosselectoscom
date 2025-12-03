// src/constants/subscriptionLimits.ts

/**
 * SUBSCRIPTION LIMITS
 * Define los límites y features disponibles para cada plan
 * Incluye soporte para business_type: 'existing' y 'startup'
 */

export interface PlanLimits {
  // Límites existentes para negocios
  max_ai_tools: number;
  available_ai_tools: string[];
  max_objectives: number;
  max_kpis: number;
  available_phases: number;
  
  // Nuevos: Soporte para startups
  startup_onboarding: boolean;
  startup_ai_tools: string[];
  startup_max_hypotheses: number;
  startup_pre_launch_metrics: boolean;
}

export const SUBSCRIPTION_LIMITS: Record<string, PlanLimits> = {
  free: {
    // Límites para negocios existentes
    max_ai_tools: 3,
    available_ai_tools: ['buyer_persona', 'growth_model', 'lead_scoring'],
    max_objectives: 5,
    max_kpis: 10,
    available_phases: 2,
    
    // Límites para startups
    startup_onboarding: true,
    startup_ai_tools: ['lean_canvas', 'validation_board'],
    startup_max_hypotheses: 3,
    startup_pre_launch_metrics: true,
  },

  starter: {
    // Límites para negocios existentes
    max_ai_tools: 8,
    available_ai_tools: [
      'buyer_persona',
      'growth_model',
      'lead_scoring',
      'competitive_analysis',
      'customer_journey',
      'swot_analysis',
      'market_sizing',
      'pricing_strategy'
    ],
    max_objectives: 15,
    max_kpis: 30,
    available_phases: 4,
    
    // Límites para startups
    startup_onboarding: true,
    startup_ai_tools: [
      'lean_canvas',
      'validation_board',
      'mvp_roadmap',
      'customer_interview_guide'
    ],
    startup_max_hypotheses: 10,
    startup_pre_launch_metrics: true,
  },

  professional: {
    // Límites para negocios existentes
    max_ai_tools: -1, // Ilimitado
    available_ai_tools: [], // Todas incluidas
    max_objectives: 50,
    max_kpis: 100,
    available_phases: 4,
    
    // Límites para startups
    startup_onboarding: true,
    startup_ai_tools: [], // Todas incluidas
    startup_max_hypotheses: -1, // Ilimitado
    startup_pre_launch_metrics: true,
  },

  enterprise: {
    // Límites para negocios existentes
    max_ai_tools: -1, // Ilimitado
    available_ai_tools: [], // Todas incluidas
    max_objectives: -1, // Ilimitado
    max_kpis: -1, // Ilimitado
    available_phases: 4,
    
    // Límites para startups
    startup_onboarding: true,
    startup_ai_tools: [], // Todas incluidas
    startup_max_hypotheses: -1, // Ilimitado
    startup_pre_launch_metrics: true,
  },
};

// Hook para obtener límites del plan actual
export const usePlanLimits = (plan: string): PlanLimits => {
  return SUBSCRIPTION_LIMITS[plan] || SUBSCRIPTION_LIMITS.free;
};

// Función helper para verificar acceso a startup onboarding
export const hasStartupAccess = (plan: string): boolean => {
  const limits = SUBSCRIPTION_LIMITS[plan] || SUBSCRIPTION_LIMITS.free;
  return limits.startup_onboarding;
};

// Función helper para verificar si un AI tool está disponible
export const hasAIToolAccess = (plan: string, toolName: string, businessType: 'existing' | 'startup'): boolean => {
  const limits = SUBSCRIPTION_LIMITS[plan] || SUBSCRIPTION_LIMITS.free;
  
  if (businessType === 'startup') {
    // Si startup_ai_tools está vacío, todas están disponibles
    if (limits.startup_ai_tools.length === 0) return true;
    // Si no, verificar si el tool está en la lista
    return limits.startup_ai_tools.includes(toolName);
  } else {
    // Negocio existente
    if (limits.available_ai_tools.length === 0) return true;
    return limits.available_ai_tools.includes(toolName);
  }
};

// Función helper para verificar si puede crear más hipótesis
export const canCreateHypothesis = (plan: string, currentCount: number): boolean => {
  const limits = SUBSCRIPTION_LIMITS[plan] || SUBSCRIPTION_LIMITS.free;
  
  // -1 significa ilimitado
  if (limits.startup_max_hypotheses === -1) return true;
  
  return currentCount < limits.startup_max_hypotheses;
};
