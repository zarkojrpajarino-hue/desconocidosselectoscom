/**
 * Tipos para las páginas de herramientas/
 * Elimina los tipos 'any' de LeadScoring.tsx, CustomerJourney.tsx, GrowthModel.tsx, BuyerPersona.tsx
 */

// ============================================
// LEAD SCORING
// ============================================

export interface LeadScoringRange {
  id: string;
  min: number;
  max: number;
  label: string;
  color: string;
  description: string;
  recommended_action: string;
}

export interface LeadScoringFactor {
  id: string;
  name: string;
  description: string;
  weight: number;
  max_points: number;
  scoring_criteria: {
    value: string;
    points: number;
  }[];
}

export interface LeadScoringCategory {
  id: string;
  name: string;
  description: string;
  weight: number;
  factors: LeadScoringFactor[];
}

export interface LeadScoringContent {
  title: string;
  description: string;
  max_score: number;
  scoring_ranges: LeadScoringRange[];
  criteria: LeadScoringCategory[];
  methodology: string;
  update_frequency: string;
}

// ============================================
// CUSTOMER JOURNEY
// ============================================

export interface CustomerJourneyTouchpoint {
  id: string;
  name: string;
  channel: string;
  description: string;
  importance: 'critical' | 'important' | 'supporting';
}

export interface CustomerJourneyPainPoint {
  id: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  solution?: string;
}

export interface CustomerJourneyStage {
  id: string;
  name: string;
  description: string;
  duration_estimate: string;
  customer_goals: string[];
  customer_emotions: string[];
  touchpoints: CustomerJourneyTouchpoint[];
  pain_points: CustomerJourneyPainPoint[];
  opportunities: string[];
  kpis: string[];
}

export interface CustomerJourneyContent {
  title: string;
  description: string;
  persona: string;
  total_journey_time: string;
  stages: CustomerJourneyStage[];
  key_insights: string[];
  improvement_priorities: string[];
}

// ============================================
// GROWTH MODEL
// ============================================

export interface GrowthModelMetric {
  id: string;
  name: string;
  current_value: number;
  target_value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  impact_on_growth: 'high' | 'medium' | 'low';
  improvement_actions: string[];
}

export interface GrowthModelLever {
  id: string;
  name: string;
  description: string;
  category: 'acquisition' | 'activation' | 'retention' | 'revenue' | 'referral';
  current_performance: number;
  potential_improvement: number;
  effort_required: 'high' | 'medium' | 'low';
  priority: number;
}

export interface GrowthModelContent {
  title: string;
  description: string;
  model_type: string;
  north_star_metric: {
    name: string;
    value: number;
    target: number;
    unit: string;
  };
  metrics: GrowthModelMetric[];
  growth_levers: GrowthModelLever[];
  constraints: string[];
  assumptions: string[];
}

// ============================================
// BUYER PERSONA
// ============================================

export interface BuyerPersonaDemographics {
  age_range: string;
  gender: string;
  location: string;
  education: string;
  income_range: string;
  job_titles: string[];
  industries: string[];
  company_size: string;
}

export interface BuyerPersonaPsychographics {
  personality_traits: string[];
  values: string[];
  interests: string[];
  lifestyle: string;
  communication_preferences: string[];
}

export interface BuyerPersonaBehavior {
  buying_patterns: string[];
  decision_making_process: string;
  information_sources: string[];
  preferred_channels: string[];
  price_sensitivity: 'high' | 'medium' | 'low';
  brand_loyalty: 'high' | 'medium' | 'low';
}

export interface BuyerPersonaContent {
  title: string;
  name: string;
  tagline: string;
  avatar_description: string;
  demographics: BuyerPersonaDemographics;
  psychographics: BuyerPersonaPsychographics;
  behavior: BuyerPersonaBehavior;
  goals: string[];
  challenges: string[];
  pain_points: string[];
  objections: string[];
  motivations: string[];
  quotes: string[];
  day_in_life: string;
  how_we_help: string[];
  messaging_guidelines: string[];
}
