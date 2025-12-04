/**
 * Tipos para useEnterpriseData.ts
 * Elimina los 11 tipos 'any' de este archivo
 */

// ============================================
// DEAL VELOCITY & PIPELINE
// ============================================

export interface DealVelocityStage {
  stage: string;
  average_days: number;
  median_days?: number;
  deal_count: number;
}

export interface StalledDeal {
  id: string;
  name: string;
  company?: string;
  stage: string;
  days_in_stage: number;
  estimated_value?: number;
  assigned_to?: string;
  last_contact_date?: string;
  recommended_action: string;
}

export interface PipelineForecastStage {
  stage: string;
  count: number;
  total_value: number;
  weighted_value: number;
  average_probability: number;
}

export interface PipelineForecastData {
  id: string;
  organization_id: string;
  forecast_date: string;
  stages: PipelineForecastStage[];
  total_pipeline_value: number;
  weighted_pipeline_value: number;
  expected_close_30_days: number;
  expected_close_60_days: number;
  expected_close_90_days: number;
  created_at: string;
}

// ============================================
// LOST REASONS
// ============================================

export interface LostReasonData {
  reason: string;
  count: number;
  total_value: number;
  percentage?: number;
  average_deal_size?: number;
  common_stage?: string;
}

// ============================================
// KPI TARGETS
// ============================================

export interface KPITarget {
  id: string;
  organization_id: string;
  kpi_name: string;
  kpi_metric: string;
  target_value: number;
  current_value: number;
  unit: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  period_start: string;
  period_end: string;
  status: 'on_track' | 'at_risk' | 'behind' | 'achieved';
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface KPITargetFormData {
  kpi_name: string;
  kpi_metric: string;
  target_value: number;
  unit: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  period_start: string;
  period_end: string;
}

// ============================================
// BUDGET
// ============================================

export interface BudgetCategory {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variance_percentage: number;
}

export interface BudgetComparison {
  id: string;
  organization_id: string;
  period: string;
  categories: BudgetCategory[];
  total_budgeted: number;
  total_actual: number;
  total_variance: number;
  created_at: string;
}

// ============================================
// BENCHMARKS
// ============================================

export interface Benchmark {
  id: string;
  kpi_name: string;
  kpi_metric: string;
  your_value: number;
  industry_average: number;
  industry_top_quartile: number;
  percentile_rank: number;
  comparison: 'above' | 'below' | 'at';
  gap_to_average: number;
  gap_to_top: number;
}

// ============================================
// METRICS
// ============================================

export interface OrganizationMetrics {
  revenue?: number;
  expenses?: number;
  profit?: number;
  growth_rate?: number;
  customer_count?: number;
  churn_rate?: number;
  ltv?: number;
  cac?: number;
  mrr?: number;
  arr?: number;
  burn_rate?: number;
  runway_months?: number;
  nps_score?: number;
  conversion_rate?: number;
  [key: string]: number | undefined;
}

// ============================================
// LEADS
// ============================================

export interface LeadData {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  pipeline_stage: string;
  estimated_value?: number;
  probability?: number;
  days_in_current_stage?: number;
  assigned_to?: string;
  last_contact_date?: string;
  source?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// HELPERS
// ============================================

export function generateRecommendedAction(deal: StalledDeal): string {
  const daysStalled = deal.days_in_stage;
  const stage = deal.stage.toLowerCase();
  
  if (daysStalled > 30) {
    return 'Contacto urgente requerido - riesgo de pérdida alto';
  }
  
  if (stage.includes('propuesta') || stage.includes('proposal')) {
    return 'Seguimiento de propuesta - verificar objeciones';
  }
  
  if (stage.includes('negociación') || stage.includes('negotiation')) {
    return 'Acelerar cierre - ofrecer incentivo si es necesario';
  }
  
  if (stage.includes('calificación') || stage.includes('qualification')) {
    return 'Programar demo o reunión de descubrimiento';
  }
  
  if (daysStalled > 14) {
    return 'Enviar contenido de valor o caso de éxito relevante';
  }
  
  return 'Contactar para mantener engagement';
}

export function calculateVelocityBottlenecks(
  velocityData: DealVelocityStage[], 
  targetDays: Record<string, number>
): { stage: string; issue: string; daysOver: number }[] {
  return velocityData
    .filter(stage => stage.average_days > (targetDays[stage.stage] || 7))
    .map(stage => ({
      stage: stage.stage,
      issue: `Promedio ${stage.average_days.toFixed(1)} días vs objetivo ${targetDays[stage.stage] || 7} días`,
      daysOver: stage.average_days - (targetDays[stage.stage] || 7)
    }));
}
