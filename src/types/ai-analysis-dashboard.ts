/**
 * Tipos para AIAnalysisDashboard.tsx y componentes relacionados
 * Elimina los 8 tipos 'any' de este archivo
 */

import type { ReactNode } from 'react';

// ============================================
// MAIN ANALYSIS STRUCTURE
// ============================================

export interface AIAnalysisResult {
  id: string;
  organization_id: string;
  created_at: string;
  analysis_type: 'full' | 'quick' | 'competitive';
  overall_score: number;
  financial_health: FinancialHealthAnalysis;
  growth_analysis: GrowthAnalysis;
  team_performance: TeamPerformanceAnalysis;
  strategy: StrategyAnalysis;
  future_projections: FutureProjections;
  honest_feedback: HonestFeedback;
  critical_alerts: CriticalAlert[];
  benchmarking?: BenchmarkingAnalysis;
  competitive_analysis?: CompetitiveAnalysis;
}

// ============================================
// FINANCIAL HEALTH
// ============================================

export interface FinancialHealthAnalysis {
  score: number;
  status: 'healthy' | 'warning' | 'critical';
  revenue_trend: TrendData;
  expense_trend: TrendData;
  profit_margin: number;
  burn_rate?: number;
  runway_months?: number;
  key_metrics: FinancialMetric[];
  insights: string[];
  recommendations: string[];
  charts?: {
    revenue_vs_expenses: ChartDataPoint[];
    cash_flow: ChartDataPoint[];
    profit_trend: ChartDataPoint[];
  };
}

export interface FinancialMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change_percentage: number;
  status: 'good' | 'warning' | 'bad';
}

export interface TrendData {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  period: string;
}

// ============================================
// GROWTH ANALYSIS
// ============================================

export interface GrowthAnalysis {
  score: number;
  current_growth_rate: number;
  projected_growth_rate: number;
  growth_drivers: GrowthDriver[];
  growth_blockers: GrowthBlocker[];
  opportunities: string[];
  market_position: string;
  insights: string[];
  recommendations: string[];
}

export interface GrowthDriver {
  name: string;
  impact: 'high' | 'medium' | 'low';
  contribution_percentage: number;
  description: string;
}

export interface GrowthBlocker {
  name: string;
  severity: 'critical' | 'moderate' | 'minor';
  description: string;
  suggested_action: string;
}

// ============================================
// TEAM PERFORMANCE
// ============================================

export interface TeamPerformanceAnalysis {
  score: number;
  overall_productivity: number;
  task_completion_rate: number;
  collaboration_score: number;
  members: TeamMemberPerformance[];
  feedback: string[];
  insights: string[];
  recommendations: string[];
  charts?: {
    productivity_by_member: ProductivityChartData[];
    task_distribution: ChartDataPoint[];
    completion_trend: ChartDataPoint[];
  };
}

export interface TeamMemberPerformance {
  user_id: string;
  name: string;
  role: string;
  tasks_completed: number;
  tasks_total: number;
  completion_rate: number;
  average_task_time: number;
  collaboration_score: number;
  strengths: string[];
  areas_for_improvement: string[];
}

export interface ProductivityChartData {
  name: string;
  productivity: number;
  tasks: number;
  fill?: string;
}

// ============================================
// STRATEGY
// ============================================

export interface StrategyAnalysis {
  priorities: StrategyPriority[];
  strategic_questions: string[];
  recommended_focus_areas: string[];
  risks: StrategyRisk[];
}

export interface StrategyPriority {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeline: string;
  expected_impact: string;
  resources_needed: string[];
}

export interface StrategyRisk {
  name: string;
  probability: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  mitigation: string;
}

// ============================================
// FUTURE PROJECTIONS
// ============================================

export interface FutureProjections {
  roadmap: RoadmapItem[];
  revenue_projections: ProjectionData;
  customer_projections: ProjectionData;
  growth_scenarios: GrowthScenario[];
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  quarter: string;
  category: string;
  status: 'planned' | 'in_progress' | 'completed';
  dependencies?: string[];
}

export interface ProjectionData {
  month_3: number;
  month_6: number;
  month_12: number;
  confidence: number;
  assumptions: string[];
}

export interface GrowthScenario {
  name: 'optimistic' | 'realistic' | 'pessimistic';
  probability: number;
  revenue_12m: number;
  customers_12m: number;
  key_assumptions: string[];
}

// ============================================
// HONEST FEEDBACK
// ============================================

export interface HonestFeedback {
  overall_assessment: string;
  strengths: FeedbackItem[];
  weaknesses: FeedbackItem[];
  blind_spots: string[];
  uncomfortable_truths: string[];
  what_competitors_do_better: string[];
  biggest_risk: string;
  one_thing_to_change: string;
}

export interface FeedbackItem {
  area: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  evidence?: string;
}

// ============================================
// CRITICAL ALERTS
// ============================================

export interface CriticalAlert {
  id: string;
  type: 'financial' | 'operational' | 'strategic' | 'team';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  recommended_action: string;
  deadline?: string;
  metric_affected?: string;
  current_value?: number;
  threshold_value?: number;
}

// ============================================
// BENCHMARKING
// ============================================

export interface BenchmarkingAnalysis {
  industry: string;
  company_size_bracket: string;
  metrics: BenchmarkMetric[];
  overall_percentile: number;
  areas_above_average: string[];
  areas_below_average: string[];
}

export interface BenchmarkMetric {
  name: string;
  your_value: number;
  industry_average: number;
  top_quartile: number;
  percentile: number;
  unit: string;
}

// ============================================
// COMPETITIVE ANALYSIS
// ============================================

export interface CompetitiveAnalysis {
  market_position: string;
  competitors: CompetitorProfile[];
  competitive_advantages: string[];
  competitive_disadvantages: string[];
  market_share_estimate: number;
  threat_level: 'high' | 'medium' | 'low';
  opportunities: string[];
}

export interface CompetitorProfile {
  name: string;
  strengths: string[];
  weaknesses: string[];
  market_share_estimate?: number;
  pricing_comparison: 'higher' | 'similar' | 'lower';
  threat_level: 'high' | 'medium' | 'low';
}

// ============================================
// CHART DATA
// ============================================

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface FinancialHealthSectionProps {
  data: FinancialHealthAnalysis;
}

export interface GrowthAnalysisSectionProps {
  data: GrowthAnalysis;
}

export interface TeamPerformanceSectionProps {
  data: TeamPerformanceAnalysis;
}

export interface StrategySectionProps {
  priorities: StrategyPriority[];
  questions: string[];
}

export interface FutureSectionProps {
  roadmap: RoadmapItem[];
  projections: FutureProjections;
}

export interface HonestFeedbackSectionProps {
  data: HonestFeedback;
}

export interface CriticalAlertsSectionProps {
  alerts: CriticalAlert[];
}

export interface BenchmarkingSectionProps {
  data: BenchmarkingAnalysis;
}

export interface TeamMetricCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  color: string;
}
