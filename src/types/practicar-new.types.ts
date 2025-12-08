/**
 * Types for Practicar (Practice) Modules
 * 
 * Types for sales training, playbooks, guides, and simulators
 */

// ============================================================================
// GUIA (GUIDE) TYPES
// ============================================================================

export interface GuiaTerm {
  term: string;
  usage: string;
}

export interface GuiaObjectionHandling {
  objection: string;
  response: string;
}

export interface GuiaScenario {
  title: string;
  content: string;
  context?: string;
}

export interface GuiaVocabulary {
  preferred_terms: GuiaTerm[];
  avoid_terms?: string[];
}

export interface GuiaTemplates {
  objection_handling: GuiaObjectionHandling[];
  email_templates?: string[];
  call_scripts?: string[];
}

export interface GuiaContent {
  id: string;
  title: string;
  description?: string;
  brand_voice?: string;
  vocabulary: GuiaVocabulary;
  templates: GuiaTemplates;
  scenarios: GuiaScenario[];
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// PLAYBOOK TYPES
// ============================================================================

export interface PlaybookSalesStage {
  stage: string;
  description: string;
  key_actions: string[];
  duration?: string;
  success_criteria?: string[];
}

export interface PlaybookPersona {
  name: string;
  role: string;
  goals: string[];
  pain_points: string[];
  objections?: string[];
}

export interface PlaybookQualificationCriterion {
  criterion: string;
  weight: number;
  questions?: string[];
}

export interface PlaybookQualificationFramework {
  name: string;
  criteria: PlaybookQualificationCriterion[];
  scoring?: {
    min: number;
    max: number;
  };
}

export interface PlaybookObjectionHandling {
  objection: string;
  category: string;
  response: string;
  follow_up?: string;
}

export interface PlaybookClosingTechnique {
  name: string;
  description: string;
  when_to_use: string;
  example?: string;
}

export interface PlaybookKPI {
  name: string;
  target: number | string;
  measurement: string;
  frequency?: string;
}

export interface PlaybookContent {
  id: string;
  title: string;
  description?: string;
  sales_process: PlaybookSalesStage[];
  buyer_personas?: PlaybookPersona[];
  qualification_framework: PlaybookQualificationFramework;
  objection_handling: PlaybookObjectionHandling[];
  closing_techniques: PlaybookClosingTechnique[];
  kpis: PlaybookKPI[];
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// SIMULADOR (SIMULATOR) TYPES
// ============================================================================

export interface SimuladorQuickTip {
  tip: string;
  category?: string;
}

export interface SimuladorOption {
  text: string;
  score: number;
  feedback: string;
  next_stage?: string;
}

export interface SimuladorStage {
  id: string;
  stage_name: string;
  description: string;
  customer_statement: string;
  options: SimuladorOption[];
  hints?: string[];
}

export interface SimuladorScenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  stages: SimuladorStage[];
}

export interface SimuladorContent {
  id: string;
  title: string;
  description?: string;
  quick_tips: SimuladorQuickTip[];
  scenarios: SimuladorScenario[];
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// SIMULATION STATE TYPES
// ============================================================================

export interface SimulationState {
  currentScenarioIndex: number;
  currentStageIndex: number;
  score: number;
  selectedOptions: Array<{
    stageId: string;
    optionIndex: number;
    score: number;
  }>;
  isComplete: boolean;
}

export interface SimulationResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isGuiaContent(data: unknown): data is GuiaContent {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'vocabulary' in data &&
    'templates' in data &&
    'scenarios' in data
  );
}

export function isPlaybookContent(data: unknown): data is PlaybookContent {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'sales_process' in data &&
    'qualification_framework' in data
  );
}

export function isSimuladorContent(data: unknown): data is SimuladorContent {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'quick_tips' in data &&
    'scenarios' in data
  );
}
