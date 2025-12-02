// ============================================
// TIPOS COMPLETOS PARA ANÁLISIS IA V2.0
// ============================================

export type HealthStatus = 'excellent' | 'good' | 'warning' | 'critical';
export type TrendDirection = 'improving' | 'stable' | 'declining';
export type GrowthStage = 'startup' | 'growth' | 'scale' | 'mature';
export type GrowthRate = 'fast' | 'moderate' | 'slow' | 'negative';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type ImpactLevel = 'high' | 'medium' | 'low';
export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';
export type Category = 'financial' | 'team' | 'operations' | 'market' | 'strategy' | 'product';
export type Deadline = 'urgent' | 'this_week' | 'this_month' | 'this_quarter';
export type Difficulty = 'hard' | 'very_hard' | 'extremely_hard';

// ============================================
// INTERFACES DE DATOS
// ============================================

export interface ChartDataPoint {
  month: string;
  [key: string]: number | string;
}

export interface Metric {
  value: number | string;
  trend?: number; // % cambio
  benchmark?: number;
  status?: HealthStatus;
}

export interface Priority {
  id: string;
  title: string;
  description: string;
  impact: ImpactLevel;
  effort: ImpactLevel;
  timeline: string;
  expected_outcome: string;
  priority_score: number; // 1-100
}

export interface Question {
  id: string;
  question: string;
  category: Category;
  why_important: string;
  current_situation: string;
  suggested_approach: string;
  deadline: Deadline;
  consequences_if_ignored: string;
}

export interface Decision {
  id: string;
  title: string;
  priority: PriorityLevel;
  description: string;
  estimated_impact: string;
  action_items: string[];
  deadline?: Date;
  dependencies?: string[];
}

export interface Investment {
  area: string;
  amount: string;
  expected_return: string;
  timeline: string;
  roi_percentage: number;
  risk_level: ImpactLevel;
}

export interface HiringPlan {
  role: string;
  when: string;
  why: string;
  priority: PriorityLevel;
  estimated_cost: string;
  expected_impact: string;
}

export interface Projection {
  period: string;
  revenue: number;
  expenses: number;
  net_profit: number;
  team_size: number;
  customers: number;
  confidence: number; // 0-100
}

export interface Scenario {
  name: string;
  description: string;
  assumptions: string[];
  projected_revenue: number;
  projected_expenses: number;
  projected_team_size: number;
  projected_customers: number;
  probability: number; // 0-100
  risk_factors: string[];
}

export interface Alert {
  id: string;
  severity: Severity;
  category: Category;
  title: string;
  description: string;
  impact: string;
  recommended_action: string;
  deadline: Date;
  auto_resolve: boolean;
  resolved?: boolean;
}

export interface ToughDecision {
  decision: string;
  why_necessary: string;
  consequences_if_not_done: string;
  consequences_if_done: string;
  recommendation: string;
  difficulty: Difficulty;
  estimated_timeline: string;
  success_probability: number; // 0-100
}

export interface Bottleneck {
  area: string;
  severity: Severity;
  description: string;
  impact: string;
  solution: string;
  estimated_resolution_time: string;
}

export interface Opportunity {
  title: string;
  description: string;
  potential_impact: ImpactLevel;
  effort_required: ImpactLevel;
  timeline: string;
  expected_roi: string;
  dependencies: string[];
}

export interface IndividualPerformance {
  user_id: string;
  user_name: string;
  role: string;
  performance_score: number; // 0-100
  strengths: string[];
  areas_to_improve: string[];
  task_completion_rate: number; // 0-100
  impact_rating: ImpactLevel;
  burnout_risk: ImpactLevel;
  personalized_advice: string;
  recent_achievements: string[];
  collaboration_score: number; // 0-100
}

// ============================================
// ESTRUCTURA PRINCIPAL DEL ANÁLISIS
// ============================================

export interface ExecutiveDashboard {
  overall_score: number; // 0-100
  health_status: HealthStatus;
  summary: string;
  key_metrics: {
    revenue_trend: number; // % cambio
    efficiency_score: number; // 0-100
    team_performance: number; // 0-100
    customer_satisfaction: number; // 0-100
  };
  comparison_last_period: {
    revenue_change: number;
    profit_change: number;
    team_productivity_change: number;
    customer_growth: number;
  };
}

export interface FinancialHealth {
  score: number; // 0-100
  status: HealthStatus;
  metrics: {
    monthly_revenue: number;
    monthly_expenses: number;
    profit_margin: number; // %
    burn_rate: number;
    runway_months: number;
    cash_balance: number;
    revenue_per_employee: number;
    operating_efficiency: number; // %
  };
  trends: {
    revenue_growth: number; // % último mes
    expense_growth: number; // % último mes
    margin_trend: TrendDirection;
    cash_flow_trend: TrendDirection;
  };
  insights: string[];
  recommendations: string[];
  warning_signs: string[];
  charts: {
    revenue_vs_expenses: ChartDataPoint[];
    margin_evolution: ChartDataPoint[];
    burn_rate_projection: ChartDataPoint[];
    cash_runway: ChartDataPoint[];
  };
}

export interface GrowthAnalysis {
  current_stage: GrowthStage;
  growth_rate: GrowthRate;
  growth_score: number; // 0-100
  metrics: {
    customer_acquisition: number;
    retention_rate: number; // %
    expansion_revenue: number;
    market_penetration: number; // %
    monthly_growth_rate: number; // %
    customer_lifetime_value: number;
    customer_acquisition_cost: number;
  };
  bottlenecks: Bottleneck[];
  opportunities: Opportunity[];
  competitive_advantages: string[];
  market_threats: string[];
  charts: {
    customer_growth: ChartDataPoint[];
    revenue_by_product: ChartDataPoint[];
    market_share_evolution: ChartDataPoint[];
    churn_analysis: ChartDataPoint[];
  };
}

export interface TeamPerformance {
  overall_score: number; // 0-100
  productivity_trend: TrendDirection;
  team_metrics: {
    total_members: number;
    active_members: number;
    avg_tasks_per_member: number;
    completion_rate: number; // %
    collaboration_score: number; // 0-100
    innovation_score: number; // 0-100
    retention_rate: number; // %
  };
  individual_performance: IndividualPerformance[];
  bottlenecks: string[];
  star_performers: string[];
  at_risk_members: string[];
  team_health_indicators: {
    workload_balance: number; // 0-100
    communication_quality: number; // 0-100
    goal_alignment: number; // 0-100
    morale: number; // 0-100
  };
  charts: {
    productivity_by_member: ChartDataPoint[];
    task_distribution: ChartDataPoint[];
    completion_rates: ChartDataPoint[];
    team_velocity: ChartDataPoint[];
  };
}

export interface StrategicPriorities {
  high_impact_low_effort: Priority[]; // Quick Wins
  high_impact_high_effort: Priority[]; // Major Projects
  low_impact_low_effort: Priority[]; // Fill-ins
  low_impact_high_effort: Priority[]; // Time Wasters
  recommended_focus: string[];
  initiatives_to_stop: string[];
}

export interface StrategicQuestions {
  focus_questions: Question[];
  money_questions: Question[];
  team_questions: Question[];
  market_questions: Question[];
  product_questions: Question[];
}

export interface FutureRoadmap {
  next_30_days: Decision[];
  next_90_days: Decision[];
  next_year: Decision[];
  scaling_plan: {
    current_capacity: string;
    target_capacity: string;
    bottlenecks_for_scale: string[];
    required_investments: Investment[];
    hiring_plan: HiringPlan[];
    infrastructure_needs: string[];
    timeline_to_scale: string;
  };
}

export interface Projections {
  next_month: Projection;
  next_quarter: Projection;
  next_year: Projection;
  scenarios: Scenario[];
  key_assumptions: string[];
  risk_factors: string[];
  charts: {
    revenue_projection: ChartDataPoint[];
    team_growth_projection: ChartDataPoint[];
    cash_runway_projection: ChartDataPoint[];
    customer_projection: ChartDataPoint[];
  };
}

export interface HonestFeedback {
  overall_assessment: string;
  what_is_working: string[];
  what_is_not_working: string[];
  hard_truths: string[];
  tough_decisions: ToughDecision[];
  competitive_position: {
    strengths: string[];
    weaknesses: string[];
    threats: string[];
    opportunities: string[];
  };
  existential_risks: string[];
  blind_spots: string[];
}

export interface Benchmarking {
  industry_avg: {
    revenue_growth: number;
    profit_margin: number;
    cac: number;
    ltv: number;
    churn_rate: number;
    team_productivity: number;
  };
  your_position: {
    revenue_growth: number;
    profit_margin: number;
    cac: number;
    ltv: number;
    churn_rate: number;
    team_productivity: number;
  };
  percentile_rank: number; // 0-100 (Top X%)
  gaps: Array<{
    metric: string;
    gap: string;
    improvement_needed: string;
    priority: PriorityLevel;
  }>;
  peer_comparison: string;
}

// ============================================
// ESTRUCTURA COMPLETA DEL ANÁLISIS
// ============================================

export interface AIAnalysisResult {
  // Identificación
  id: string;
  organization_id: string;
  generated_at: string;
  data_period: {
    start_date: string;
    end_date: string;
  };
  
  // Datos principales
  executive_dashboard: ExecutiveDashboard;
  financial_health: FinancialHealth;
  growth_analysis: GrowthAnalysis;
  team_performance: TeamPerformance;
  strategic_priorities: StrategicPriorities;
  strategic_questions: StrategicQuestions;
  future_roadmap: FutureRoadmap;
  projections: Projections;
  critical_alerts: Alert[];
  honest_feedback: HonestFeedback;
  benchmarking: Benchmarking;
  
  // Metadata
  confidence_score: number; // 0-100
  data_sources: string[];
  data_quality_score: number; // 0-100
  next_analysis_recommended: string; // ISO date
  version: string; // "2.0"
}

// ============================================
// TIPOS PARA LA API Y ESTADO
// ============================================

export interface AnalysisState {
  data: AIAnalysisResult | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  history: AIAnalysisResult[]; // Análisis anteriores
}

export interface AnalysisFilters {
  period?: 'week' | 'month' | 'quarter' | 'year';
  category?: Category;
  severity?: Severity;
}

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'json';
  sections: string[];
  includeCharts: boolean;
  includeRawData: boolean;
}
