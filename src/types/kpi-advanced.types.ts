// ============================================
// TIPOS TYPESCRIPT - SISTEMA ENTERPRISE
// ============================================

// ============================================
// KPIs
// ============================================

export interface KPIMetric {
  name: string;
  value: number;
  previous_value?: number;
  change_percentage?: number;
  target?: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface KPITarget {
  id: string;
  organization_id: string;
  kpi_metric: string;
  target_value: number;
  current_value?: number;
  target_date: string;
  period_type: 'monthly' | 'quarterly' | 'yearly';
  progress_percentage?: number;
  on_track: boolean;
}

// ============================================
// FINANZAS
// ============================================

export interface FinancialProjectionFromKPIs {
  period: string;
  projected_revenue: number;
  projected_expenses: number;
  projected_profit: number;
  confidence: number;
  
  breakdown: {
    revenue_from_pipeline: number;
    revenue_from_recurring: number;
    revenue_from_new_customers: number;
  };
  
  metrics: {
    calculated_cac: number;
    expected_cac: number;
    ltv: number;
    ltv_cac_ratio: number;
    gross_margin: number;
    burn_rate: number;
    runway_months: number;
  };
  
  alerts: Array<{
    severity: 'info' | 'warning' | 'critical';
    message: string;
    recommendation: string;
  }>;
}

export interface CashFlowForecast {
  month: string;
  opening_balance: number;
  projected_inflows: number;
  projected_outflows: number;
  net_cash_flow: number;
  closing_balance: number;
  
  inflows_breakdown: {
    sales_revenue: number;
    recurring_revenue: number;
    other_income: number;
  };
  
  outflows_breakdown: {
    salaries: number;
    marketing: number;
    operations: number;
    infrastructure: number;
    other: number;
  };
}

export interface BudgetComparison {
  category: string;
  budgeted_amount: number;
  actual_amount: number;
  variance_amount: number;
  variance_percentage: number;
  status: 'on_budget' | 'over_budget' | 'under_budget';
  monthly_breakdown?: Array<{
    month: string;
    budgeted: number;
    actual: number;
    variance: number;
  }>;
}

export interface FinancialRatio {
  name: string;
  value: number;
  benchmark: number;
  interpretation: string;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  formula: string;
  explanation: string;
}

export interface ProductProfitabilityData {
  product_name: string;
  revenue: number;
  direct_costs: number;
  gross_margin: number;
  gross_margin_percentage: number;
  allocated_overhead: number;
  net_margin: number;
  net_margin_percentage: number;
  contribution_to_total_revenue: number;
  status: 'highly_profitable' | 'profitable' | 'break_even' | 'loss_making';
  recommendation: string;
}

// ============================================
// CRM
// ============================================

export interface LeadScore {
  lead_id: string;
  total_score: number;
  breakdown: {
    source: number;
    engagement: number;
    fit_icp: number;
    urgency: number;
    behavior: number;
  };
  classification: 'hot' | 'warm' | 'cold';
  probability_to_close: number;
  next_best_action: string;
}

export interface PipelineRevenueForcast {
  period: string;
  conservative_scenario: {
    revenue: number;
    probability: number;
    confidence: number;
  };
  realistic_scenario: {
    revenue: number;
    probability: number;
    confidence: number;
  };
  optimistic_scenario: {
    revenue: number;
    probability: number;
    confidence: number;
  };
  breakdown_by_stage: Array<{
    stage: string;
    deal_count: number;
    avg_deal_size: number;
    total_value: number;
    probability: number;
    expected_revenue: number;
  }>;
  target_revenue: number;
  variance: number;
}

export interface DealVelocityMetrics {
  average_days_in_stage: Record<string, number>;
  total_sales_cycle_days: number;
  target_sales_cycle_days: number;
  variance_days: number;
  
  bottlenecks: Array<{
    stage: string;
    average_days: number;
    target_days: number;
    excess_days: number;
    impact: 'high' | 'medium' | 'low';
  }>;
  
  stalled_deals: Array<{
    deal_id: string;
    deal_name: string;
    current_stage: string;
    days_in_stage: number;
    average_for_stage: number;
    excess_days: number;
    recommended_action: string;
  }>;
}

export interface LostReasonAnalysis {
  period: string;
  total_lost_deals: number;
  total_lost_value: number;
  
  reasons: Array<{
    reason: string;
    count: number;
    percentage: number;
    total_value: number;
    average_deal_size: number;
  }>;
  
  trends: Array<{
    reason: string;
    previous_percentage: number;
    current_percentage: number;
    change: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
  
  insights: Array<{
    priority: 'high' | 'medium' | 'low';
    finding: string;
    recommendation: string;
  }>;
}

// ============================================
// OKRs
// ============================================

export interface OKRObjective {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  owner_id: string;
  level: 'company' | 'team' | 'individual';
  quarter: string;
  score: number;
  status: 'on_track' | 'at_risk' | 'behind';
  key_results: OKRKeyResult[];
  dependencies?: string[];
}

export interface OKRKeyResult {
  id: string;
  objective_id: string;
  title: string;
  start_value: number;
  target_value: number;
  current_value: number;
  unit: string;
  score: number;
  confidence_level: 'low' | 'medium' | 'high';
  linked_kpi?: string;
  auto_update: boolean;
}

export interface OKRCheckIn {
  id: string;
  key_result_id: string;
  user_id: string;
  week_number: number;
  score_update: number;
  accomplishments: string;
  blockers: string;
  next_steps: string;
  confidence_level: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface OKRRetrospective {
  quarter: string;
  average_score: number;
  completed_count: number;
  total_count: number;
  what_worked: string[];
  what_didnt_work: string[];
  learnings: string[];
  actions_for_next_quarter: string[];
}

export interface OKRDependency {
  from_objective_id: string;
  to_objective_id: string;
  dependency_type: 'blocks' | 'enables' | 'informs';
  status: 'active' | 'resolved' | 'at_risk';
}

export interface KPIChangeAnalysis {
  kpi_metric: string;
  old_value: number;
  new_value: number;
  change_percentage: number;
  contributing_factors: Array<{
    factor: string;
    impact_percentage: number;
  }>;
  recommendations: string[];
}

export interface KPIBenchmark {
  industry: string;
  kpi_metric: string;
  your_value: number;
  average_value: number;
  top_25_percentile: number;
  top_10_percentile: number;
  percentile_rank: number;
}
