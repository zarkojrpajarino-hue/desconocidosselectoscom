/**
 * Tipos para las páginas de practicar/
 * Elimina los tipos 'any' de Simulador.tsx, Playbook.tsx, Guia.tsx
 */

// ============================================
// SIMULADOR
// ============================================

export interface SimuladorOption {
  id: string;
  text: string;
  score: number;
  feedback?: string;
  next_stage?: string;
}

export interface SimuladorStage {
  id: string;
  title: string;
  description: string;
  context?: string;
  options: SimuladorOption[];
  tips?: string[];
}

export interface SimuladorScenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  estimated_time_minutes: number;
  flow: SimuladorStage[];
  max_score: number;
  passing_score: number;
}

export interface SimuladorContent {
  title: string;
  description: string;
  quick_tips: SimuladorTip[];
  scenarios: SimuladorScenario[];
}

export interface SimuladorTip {
  id: string;
  text: string;
  icon?: string;
}

export interface SimuladorProgress {
  scenario_id: string;
  current_stage_index: number;
  current_score: number;
  selections: { stage_id: string; option_id: string; score: number }[];
  completed: boolean;
}

// ============================================
// PLAYBOOK
// ============================================

export interface PlaybookStage {
  id: string;
  name: string;
  description: string;
  objectives: string[];
  key_activities: string[];
  success_criteria: string[];
  tools?: string[];
  duration_estimate?: string;
}

export interface PlaybookCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  questions: string[];
  scoring_guide?: string;
}

export interface PlaybookQualificationFramework {
  name: string;
  description: string;
  criteria: PlaybookCriterion[];
  scoring_threshold: number;
}

export interface PlaybookObjection {
  id: string;
  objection: string;
  category: string;
  frequency: 'common' | 'occasional' | 'rare';
  response: string;
  follow_up_questions?: string[];
  prevention_tips?: string[];
}

export interface PlaybookClosingTechnique {
  id: string;
  name: string;
  description: string;
  when_to_use: string;
  example_script: string;
  success_rate?: string;
}

export interface PlaybookKPI {
  id: string;
  name: string;
  description: string;
  formula?: string;
  target: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  importance: 'critical' | 'important' | 'nice_to_have';
}

export interface PlaybookContent {
  title: string;
  description: string;
  version: string;
  last_updated: string;
  sales_process: PlaybookStage[];
  qualification_framework: PlaybookQualificationFramework;
  objection_handling: PlaybookObjection[];
  closing_techniques: PlaybookClosingTechnique[];
  kpis: PlaybookKPI[];
}

// ============================================
// GUIA
// ============================================

export interface GuiaPreferredTerm {
  id: string;
  term: string;
  instead_of: string;
  reason: string;
  example?: string;
}

export interface GuiaVocabulary {
  preferred_terms: GuiaPreferredTerm[];
  power_words: string[];
  words_to_avoid: string[];
}

export interface GuiaObjectionTemplate {
  id: string;
  objection_type: string;
  template: string;
  variations: string[];
  tone: string;
}

export interface GuiaTemplates {
  opening_lines: string[];
  closing_lines: string[];
  follow_up_templates: string[];
  objection_handling: GuiaObjectionTemplate[];
}

export interface GuiaScenario {
  id: string;
  title: string;
  description: string;
  context: string;
  recommended_approach: string;
  example_dialogue: string[];
  common_mistakes: string[];
  success_indicators: string[];
}

export interface GuiaContent {
  title: string;
  description: string;
  introduction: string;
  core_principles: string[];
  vocabulary: GuiaVocabulary;
  templates: GuiaTemplates;
  scenarios: GuiaScenario[];
  quick_reference: Record<string, string[]>;
}

// ============================================
// CALCULADORA (bonus - también tiene any)
// ============================================

export interface CalculadoraGrowthLever {
  id: string;
  name: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  timeline: string;
  estimated_growth_percentage: number;
  prerequisites?: string[];
}

export interface CalculadoraRiskAssessment {
  id: string;
  risk: string;
  category: string;
  probability: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  mitigation: string;
  contingency?: string;
}

export interface CalculadoraContent {
  title: string;
  description: string;
  current_metrics: {
    revenue: number;
    customers: number;
    growth_rate: number;
    churn_rate: number;
  };
  projections: {
    month_3: number;
    month_6: number;
    month_12: number;
  };
  growth_levers: CalculadoraGrowthLever[];
  risk_assessment: CalculadoraRiskAssessment[];
  recommendations: string[];
}
