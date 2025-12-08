/**
 * Types for Herramientas (Tools) Content
 * 
 * Types for dynamic tool content like calculators, personas, journeys, etc.
 */

// ============================================================================
// BUYER PERSONA TYPES
// ============================================================================

export interface BuyerPersona {
  id: string;
  name: string;
  role: string;
  demographics?: {
    age_range?: string;
    location?: string;
    income?: string;
  };
  goals: string[];
  pain_points: string[];
  buying_behaviors: string[];
  preferred_channels?: string[];
  objections?: string[];
}

// ============================================================================
// GROWTH MODEL TYPES
// ============================================================================

export interface GrowthMetric {
  metric: string;
  current_value: number;
  target_value: number;
  growth_rate: number;
  timeframe: string;
}

export interface GrowthModel {
  id: string;
  name: string;
  description?: string;
  metrics: GrowthMetric[];
  strategies?: string[];
  kpis?: string[];
}

// ============================================================================
// CUSTOMER JOURNEY TYPES
// ============================================================================

export interface JourneyTouchpoint {
  touchpoint: string;
  description: string;
  emotions?: string[];
  actions?: string[];
}

export interface JourneyStage {
  stage: string;
  description: string;
  touchpoints: JourneyTouchpoint[];
  pain_points?: string[];
  opportunities?: string[];
}

export interface CustomerJourney {
  id: string;
  name: string;
  persona?: string;
  stages: JourneyStage[];
}

// ============================================================================
// CALCULATOR TYPES
// ============================================================================

export interface GrowthLever {
  lever: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  timeframe: string;
}

export interface RiskAssessment {
  risk: string;
  probability: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  mitigation: string;
}

export interface Calculator {
  id: string;
  name: string;
  type: string;
  inputs?: Array<{ label: string; value: number; unit?: string }>;
  outputs?: Array<{ label: string; value: number; unit?: string }>;
  growth_levers?: GrowthLever[];
  risk_assessment?: RiskAssessment[];
  assumptions?: string[];
}

// ============================================================================
// SIMULADOR FLOW TYPES (additional to practicar.types.ts)
// ============================================================================

export interface SimulatorFlow {
  id: string;
  stage_name: string;
  customer_statement: string;
  options: Array<{
    text: string;
    score: number;
    feedback: string;
  }>;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isBuyerPersona(value: unknown): value is BuyerPersona {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'role' in value &&
    'goals' in value
  );
}

export function isGrowthModel(value: unknown): value is GrowthModel {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'metrics' in value
  );
}

export function isCustomerJourney(value: unknown): value is CustomerJourney {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'stages' in value
  );
}

export function isCalculator(value: unknown): value is Calculator {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'type' in value
  );
}
