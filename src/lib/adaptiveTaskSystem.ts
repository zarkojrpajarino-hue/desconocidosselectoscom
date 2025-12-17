/**
 * Sistema Profesional de Tareas Adaptativas - Versión 10/10
 * Basado en Lean Startup + Scaling Up + McKinsey
 */

// ============================================
// MATRIZ DE COMPLEJIDAD POR FASE
// ============================================

export const PHASE_COMPLEXITY = {
  lean_startup: {
    phase_1_build: 45,    // Construir MVP
    phase_2_measure: 35,  // Medir
    phase_3_learn: 40,    // Validar
    phase_4_scale: 55     // Escalar
  },
  scaling_up: {
    phase_1_people: 50,    // Equipo y Cultura
    phase_2_strategy: 42,  // Estrategia Clara
    phase_3_execution: 60, // Ejecución Excelente
    phase_4_cash: 45       // Cash Flow
  }
} as const;

// ============================================
// MULTIPLICADORES DE CONTEXTO
// ============================================

// 1. Madurez de empresa
export const MATURITY_MULTIPLIER: Record<string, number> = {
  idea: 0.5,              // Solo idea, scope muy reducido (ajustado de 0.6)
  mvp_development: 0.8,   // Construyendo MVP
  validating: 1.0,        // Validando mercado
  early_traction: 1.2,    // Tracción temprana
  growth: 1.4,            // Crecimiento activo
  consolidated: 1.3,      // Empresa consolidada
  mature: 1.5             // Empresa madura, complejidad organizacional
};

// 2. Tamaño de equipo (no lineal)
export function getTeamMultiplier(teamSize: number): number {
  if (teamSize === 1) return 1.3;    // Solo founder, más carga individual
  if (teamSize <= 3) return 1.0;     // Equipo ideal pequeño
  if (teamSize <= 10) return 0.9;    // Eficiente con especialización
  if (teamSize <= 30) return 0.85;   // Requiere coordinación
  if (teamSize <= 100) return 0.8;   // Más procesos, menos tareas/persona (ajustado de 0.9)
  return 0.8;                        // Grande, muchos procesos (ajustado de 1.0)
}

// 3. Industria
export const INDUSTRY_MULTIPLIER: Record<string, number> = {
  saas: 1.0,
  technology: 1.0,
  ecommerce: 1.1,
  fintech: 1.3,
  healthtech: 1.4,
  marketplace: 1.2,
  consulting: 0.9,
  agency: 0.95,
  retail: 1.1,
  manufacturing: 1.3,
  education: 1.0,
  food_beverage: 1.05,
  real_estate: 1.1,
  logistics: 1.2,
  generic: 1.0
};

// 4. Recursos / Funding
export const RESOURCES_MULTIPLIER: Record<string, number> = {
  bootstrapped: 0.8,      // Sin financiación externa
  pre_seed: 0.9,          // Pre-seed
  seed: 1.0,              // Seed
  series_a: 1.1,          // Serie A
  funded: 1.2,            // Financiado en general
  corporate: 1.3          // Corporativo con recursos
};

// 5. Disponibilidad del equipo
export const AVAILABILITY_MULTIPLIER: Record<string, number> = {
  part_time: 0.6,         // Menos de 20h/semana
  full_time: 1.0,         // 40h/semana estándar
  overtime: 1.2           // Más de 40h/semana
};

// 6. Modos de trabajo (multiplican resultado final)
export const WORK_MODE_MULTIPLIER: Record<string, number> = {
  conservative: 0.75,     // Conservador - menos tareas
  moderate: 1.0,          // Moderado - balance
  aggressive: 1.35        // Agresivo - más tareas
};

// ============================================
// FUNCIÓN PRINCIPAL DE CÁLCULO
// ============================================

export interface AdaptiveTaskInput {
  methodology: 'lean_startup' | 'scaling_up';
  phaseNumber: 1 | 2 | 3 | 4;
  businessMaturity: string;
  teamSize: number;
  industry: string;
  fundingStage: string;
  teamAvailability: string;
  workMode: 'conservative' | 'moderate' | 'aggressive';
}

export interface AdaptiveTaskResult {
  totalTasks: number;
  tasksPerPerson: number;
  complexity: number;
  breakdown: {
    baseComplexity: number;
    maturityMult: number;
    teamMult: number;
    industryMult: number;
    resourcesMult: number;
    availabilityMult: number;
    workModeMult: number;
    finalComplexity: number;
  };
}

function getPhaseKey(methodology: string, phaseNumber: number): string {
  const slugs: Record<string, string[]> = {
    lean_startup: ['build', 'measure', 'learn', 'scale'],
    scaling_up: ['people', 'strategy', 'execution', 'cash']
  };
  const slug = slugs[methodology]?.[phaseNumber - 1] || 'build';
  return `phase_${phaseNumber}_${slug}`;
}

export function calculateAdaptiveTasks(input: AdaptiveTaskInput): AdaptiveTaskResult {
  // 1. Base de complejidad de la fase
  const phaseKey = getPhaseKey(input.methodology, input.phaseNumber);
  const methodologyPhases = PHASE_COMPLEXITY[input.methodology];
  const baseComplexity = (methodologyPhases as Record<string, number>)[phaseKey] || 45;

  // 2. Obtener multiplicadores
  const maturityMult = MATURITY_MULTIPLIER[input.businessMaturity] || 1.0;
  const teamMult = getTeamMultiplier(input.teamSize);
  const industryMult = INDUSTRY_MULTIPLIER[input.industry] || 1.0;
  const resourcesMult = RESOURCES_MULTIPLIER[input.fundingStage] || 1.0;
  const availabilityMult = AVAILABILITY_MULTIPLIER[input.teamAvailability] || 1.0;
  const workModeMult = WORK_MODE_MULTIPLIER[input.workMode] || 1.0;

  // 3. Calcular complejidad ajustada
  let complexity = baseComplexity;
  complexity *= maturityMult;
  complexity *= teamMult;
  complexity *= industryMult;
  complexity *= resourcesMult;
  complexity *= availabilityMult;

  const finalComplexity = complexity;

  // 4. Convertir a tareas (4 puntos = 1 tarea, ajustado de 5)
  let totalTasks = complexity / 4;

  // 5. Aplicar modo de trabajo
  totalTasks *= workModeMult;

  // 6. GUARDRAILS - límites saludables
  const minTasks = Math.max(4, Math.ceil(input.teamSize * 1.5));
  const maxTasks = Math.min(25, input.teamSize * 8);
  totalTasks = Math.max(minTasks, Math.min(maxTasks, totalTasks));
  totalTasks = Math.round(totalTasks);

  // 7. Tareas por persona
  let tasksPerPerson = totalTasks / input.teamSize;
  // Límites por persona: mínimo 1, máximo 12
  tasksPerPerson = Math.max(1, Math.min(12, tasksPerPerson));
  tasksPerPerson = Math.round(tasksPerPerson * 10) / 10; // Redondear a 1 decimal

  return {
    totalTasks,
    tasksPerPerson,
    complexity: finalComplexity,
    breakdown: {
      baseComplexity,
      maturityMult,
      teamMult,
      industryMult,
      resourcesMult,
      availabilityMult,
      workModeMult,
      finalComplexity
    }
  };
}

// ============================================
// MAPEO DE VALORES DEL ONBOARDING
// ============================================

export function mapOnboardingToAdaptiveInput(orgData: {
  business_stage?: string;
  industry?: string;
  team_size?: string;
  funding_stage?: string;
  is_startup?: boolean;
}): Partial<AdaptiveTaskInput> {
  // Mapear business_stage a maturity
  const maturityMap: Record<string, string> = {
    'idea': 'idea',
    'building': 'mvp_development',
    'validating': 'validating',
    'traction': 'early_traction',
    'scaling': 'growth',
    'established': 'consolidated',
    'mature': 'mature',
    // Para empresas consolidadas
    'startup': 'early_traction',
    'growth': 'growth',
    'consolidated': 'consolidated'
  };

  // Mapear team_size a número
  const teamSizeMap: Record<string, number> = {
    '1': 1,
    '2-5': 3,
    '6-10': 8,
    '11-20': 15,
    '21-50': 35,
    '51-100': 75,
    '100+': 150,
    'solo': 1,
    'small': 5,
    'medium': 20,
    'large': 100
  };

  // Mapear industry
  const industryMap: Record<string, string> = {
    'technology': 'technology',
    'saas': 'saas',
    'ecommerce': 'ecommerce',
    'fintech': 'fintech',
    'healthtech': 'healthtech',
    'marketplace': 'marketplace',
    'consulting': 'consulting',
    'agency': 'agency',
    'retail': 'retail',
    'manufacturing': 'manufacturing',
    'education': 'education',
    'food': 'food_beverage',
    'real_estate': 'real_estate',
    'logistics': 'logistics'
  };

  // Mapear funding
  const fundingMap: Record<string, string> = {
    'bootstrapped': 'bootstrapped',
    'pre_seed': 'pre_seed',
    'seed': 'seed',
    'series_a': 'series_a',
    'series_b': 'funded',
    'funded': 'funded',
    'corporate': 'corporate',
    'self_funded': 'bootstrapped'
  };

  return {
    methodology: orgData.is_startup ? 'lean_startup' : 'scaling_up',
    businessMaturity: maturityMap[orgData.business_stage || ''] || 'validating',
    teamSize: teamSizeMap[orgData.team_size || ''] || 5,
    industry: industryMap[orgData.industry?.toLowerCase() || ''] || 'generic',
    fundingStage: fundingMap[orgData.funding_stage || ''] || 'bootstrapped'
  };
}

// ============================================
// FUNCIÓN PARA EXPLICAR EL CÁLCULO AL USUARIO
// ============================================

export function explainTaskCalculation(result: AdaptiveTaskResult, input: AdaptiveTaskInput): string {
  const { breakdown } = result;
  
  const lines = [
    `Base ${input.methodology === 'lean_startup' ? 'Lean Startup' : 'Scaling Up'} Fase ${input.phaseNumber}: ${breakdown.baseComplexity} puntos`,
    `× Madurez (${input.businessMaturity}): ${breakdown.maturityMult}`,
    `× Equipo (${input.teamSize} personas): ${breakdown.teamMult}`,
    `× Industria (${input.industry}): ${breakdown.industryMult}`,
    `× Recursos (${input.fundingStage}): ${breakdown.resourcesMult}`,
    `× Disponibilidad (${input.teamAvailability}): ${breakdown.availabilityMult}`,
    `= ${Math.round(breakdown.finalComplexity)} puntos`,
    `÷ 4 = ${Math.round(breakdown.finalComplexity / 4)} tareas base`,
    `× Modo ${input.workMode}: ${breakdown.workModeMult}`,
    `= ${result.totalTasks} tareas óptimas (${result.tasksPerPerson}/persona)`
  ];
  
  return lines.join('\n');
}
