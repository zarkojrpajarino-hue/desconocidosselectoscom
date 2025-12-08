/**
 * Types for Herramientas (Tools) Content
 * 
 * Types for dynamic tool content like calculators, personas, journeys, etc.
 */

// ============================================================================
// BUYER PERSONA TYPES
// ============================================================================

export interface BuyerPersonaDemographics {
  age_range?: string;
  location?: string;
  income?: string;
}

export interface BuyerPersonaContent {
  id: string;
  name: string;
  role: string;
  demographics?: BuyerPersonaDemographics;
  goals: string[];
  pain_points: string[];
  buying_behaviors: string[];
  preferred_channels?: string[];
  objections?: string[];
}

// ============================================================================
// GROWTH MODEL TYPES
// ============================================================================

export interface GrowthMetricData {
  metric: string;
  current_value: number;
  target_value: number;
  growth_rate: number;
  timeframe: string;
}

export interface GrowthModelContent {
  id: string;
  name: string;
  description?: string;
  metrics: GrowthMetricData[];
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

export interface JourneyStageData {
  stage: string;
  description: string;
  touchpoints: JourneyTouchpoint[];
  pain_points?: string[];
  opportunities?: string[];
}

export interface CustomerJourneyContent {
  id: string;
  name: string;
  persona?: string;
  stages: JourneyStageData[];
}

// ============================================================================
// CALCULATOR TYPES
// ============================================================================

export interface CalculatorInput {
  label: string;
  value: number;
  unit?: string;
}

export interface CalculatorOutput {
  label: string;
  value: number;
  unit?: string;
}

export interface GrowthLeverData {
  lever: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  timeframe: string;
}

export interface RiskAssessmentData {
  risk: string;
  probability: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  mitigation: string;
}

export interface CalculatorContent {
  id: string;
  name: string;
  type: string;
  inputs?: CalculatorInput[];
  outputs?: CalculatorOutput[];
  growth_levers?: GrowthLeverData[];
  risk_assessment?: RiskAssessmentData[];
  assumptions?: string[];
}

// ============================================================================
// LEAD SCORING TYPES
// ============================================================================

export interface LeadScoringRange {
  min: number;
  max: number;
  label: string;
  color?: string;
}

export interface LeadScoringFactor {
  factor: string;
  weight: number;
  description?: string;
}

export interface LeadScoringCategory {
  category: string;
  factors: LeadScoringFactor[];
}

export interface LeadScoringContent {
  id: string;
  name: string;
  ranges: LeadScoringRange[];
  categories: LeadScoringCategory[];
}

// ============================================================================
// OKR TYPES
// ============================================================================

export interface OKRKeyResultData {
  id: string;
  title: string;
  target_value: number;
  current_value: number;
  progress: number;
  unit?: string;
}

export interface OKRObjectiveData {
  id: string;
  title: string;
  description?: string;
  progress: number;
  key_results: OKRKeyResultData[];
  quarter?: string;
  year?: number;
  owner_id?: string;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isBuyerPersonaContent(value: unknown): value is BuyerPersonaContent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'role' in value &&
    'goals' in value
  );
}

export function isGrowthModelContent(value: unknown): value is GrowthModelContent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'metrics' in value
  );
}

export function isCustomerJourneyContent(value: unknown): value is CustomerJourneyContent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'stages' in value
  );
}

export function isCalculatorContent(value: unknown): value is CalculatorContent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'type' in value
  );
}

export function isLeadScoringContent(value: unknown): value is LeadScoringContent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'ranges' in value &&
    'categories' in value
  );
}
