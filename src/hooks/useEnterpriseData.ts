// ============================================
// HOOKS ENTERPRISE - DATOS REALES SUPABASE
// ============================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  DealVelocityMetrics, 
  LostReasonAnalysis,
  FinancialProjectionFromKPIs,
  CashFlowForecast as CashFlowForecastType,
  BudgetComparison,
  LeadScore,
  PipelineRevenueForcast,
  KPITarget
} from '@/types/kpi-advanced.types';
import {
  DealVelocityStage,
  StalledDeal,
  ForecastStage,
  LostReason,
  CachedForecast
} from '@/types/enterprise-rpc.types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const enterpriseDataKeys = {
  all: ['enterpriseData'] as const,
  dealVelocity: (organizationId: string | null) =>
    [...enterpriseDataKeys.all, 'dealVelocity', { organizationId }] as const,
  financialFromKPIs: (organizationId: string | null) =>
    [...enterpriseDataKeys.all, 'financialFromKPIs', { organizationId }] as const,
  leadScoring: (leadId: string | null) =>
    [...enterpriseDataKeys.all, 'leadScoring', { leadId }] as const,
  pipelineForecast: (organizationId: string | null) =>
    [...enterpriseDataKeys.all, 'pipelineForecast', { organizationId }] as const,
  cashFlowForecast: (organizationId: string | null, months: 6 | 12) =>
    [...enterpriseDataKeys.all, 'cashFlowForecast', { organizationId, months }] as const,
  lostReasons: (organizationId: string | null) =>
    [...enterpriseDataKeys.all, 'lostReasons', { organizationId }] as const,
  kpiTargets: (organizationId: string | null) =>
    [...enterpriseDataKeys.all, 'kpiTargets', { organizationId }] as const,
  budgetComparison: (organizationId: string | null) =>
    [...enterpriseDataKeys.all, 'budgetComparison', { organizationId }] as const,
};

// ============================================
// 1. HOOK: Deal Velocity
// ============================================

async function fetchDealVelocity(
  organizationId: string | null
): Promise<DealVelocityMetrics | null> {
  if (!organizationId) return null;

  // 1. Calcular velocidad por stage usando la función
  const { data: velocityData, error: velocityError } = await supabase
    .rpc('calculate_deal_velocity', { org_id: organizationId });

  if (velocityError) throw velocityError;

  // 2. Detectar deals estancados
  const { data: stalledData, error: stalledError } = await supabase
    .rpc('detect_stalled_deals', { org_id: organizationId });

  if (stalledError) throw stalledError;

  // 3. Calcular total sales cycle
  const totalCycleDays = (velocityData as DealVelocityStage[] | null)?.reduce((sum: number, stage) =>
    sum + (stage.average_days || 0), 0
  ) || 0;

  // 4. Identificar bottlenecks
  const targetDays: Record<string, number> = {
    discovery: 3,
    qualification: 7,
    proposal: 10,
    negotiation: 14,
    closing: 6,
  };

  const bottlenecks = (velocityData as DealVelocityStage[] | null)
    ?.filter((stage) => stage.average_days > (targetDays[stage.stage] || 7))
    .map((stage) => ({
      stage: stage.stage,
      average_days: stage.average_days,
      target_days: targetDays[stage.stage] || 7,
      excess_days: stage.average_days - (targetDays[stage.stage] || 7),
      impact: stage.average_days > (targetDays[stage.stage] || 7) * 1.5 ? 'high' as const : 'medium' as const,
    })) || [];

  // 5. Formatear datos
  const average_days_in_stage: Record<string, number> = {};
  interface VelocityRow { stage: string; average_days: number }
  (velocityData as VelocityRow[] | null)?.forEach((stage) => {
    average_days_in_stage[stage.stage] = stage.average_days;
  });

  interface StalledRow { lead_id: string; lead_name: string; stage: string; days_stalled: number; assigned_to?: string }
  const formattedStalledDeals = (stalledData as StalledRow[] | null)?.map((deal) => ({
    deal_id: deal.lead_id,
    deal_name: deal.lead_name || 'Sin nombre',
    current_stage: deal.stage,
    days_in_stage: deal.days_stalled,
    average_for_stage: deal.days_stalled,
    excess_days: deal.days_stalled,
    recommended_action: generateRecommendedActionFromDays(deal.days_stalled),
  })) || [];

  return {
    average_days_in_stage,
    total_sales_cycle_days: totalCycleDays,
    target_sales_cycle_days: 45,
    variance_days: totalCycleDays - 45,
    bottlenecks,
    stalled_deals: formattedStalledDeals,
  };
}

export function useDealVelocity(organizationId: string | null) {
  const {
    data = null,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: enterpriseDataKeys.dealVelocity(organizationId),
    queryFn: () => fetchDealVelocity(organizationId),
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes - business metrics change moderately
    onError: (error: Error) => {
      console.error('Error fetching deal velocity:', error);
    },
  });

  return { data, loading, error: error as Error | null, refetch };
}

function generateRecommendedActionFromDays(days: number): string {
  if (days > 15) {
    return `URGENTE: Contactar HOY. Deal estancado ${days} días más de lo normal.`;
  } else if (days > 7) {
    return `Programar reunión esta semana. Posibles objeciones sin resolver.`;
  }
  return `Hacer follow-up. Deal necesita atención.`;
}

// ============================================
// 2. HOOK: Financial From KPIs
// ============================================

async function fetchFinancialFromKPIs(
  organizationId: string | null
): Promise<FinancialProjectionFromKPIs | null> {
  if (!organizationId) return null;

  // 1. Obtener últimos KPIs de business_metrics
  const { data: kpiData } = await supabase
    .from('business_metrics')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 2. Obtener revenue del mes actual
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: revenueData } = await supabase
    .from('revenue_entries')
    .select('amount')
    .eq('organization_id', organizationId)
    .gte('date', startOfMonth.toISOString().split('T')[0]);

  const totalRevenue = revenueData?.reduce((sum, r) => sum + Number(r.amount || 0), 0) || 0;

  // 3. Obtener gastos del mes actual
  const { data: expenseData } = await supabase
    .from('expense_entries')
    .select('amount')
    .eq('organization_id', organizationId)
    .gte('date', startOfMonth.toISOString().split('T')[0]);

  const totalExpenses = expenseData?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;

  // 4. Obtener marketing spend del mes
  const { data: marketingData } = await supabase
    .from('marketing_spend')
    .select('amount, leads_generated')
    .eq('organization_id', organizationId)
    .gte('date', startOfMonth.toISOString().split('T')[0]);

  const totalMarketing = marketingData?.reduce((sum, m) => sum + Number(m.amount || 0), 0) || 0;
  const totalLeadsFromMarketing = marketingData?.reduce((sum, m) => sum + (m.leads_generated || 0), 0) || 0;

  // 5. Obtener cash balance más reciente
  const { data: cashData } = await supabase
    .from('cash_balance')
    .select('balance')
    .eq('organization_id', organizationId)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const cashBalance = Number(cashData?.balance || 0);

  // 6. Calcular métricas
  const leads = kpiData?.leads_generated || totalLeadsFromMarketing || 0;
  const conversionRate = kpiData?.conversion_rate ? Number(kpiData.conversion_rate) / 100 : 0.03;
  const avgTicket = kpiData?.avg_ticket ? Number(kpiData.avg_ticket) : (totalRevenue / Math.max(leads * conversionRate, 1));

  // Revenue from pipeline
  const revenueFromPipeline = leads * conversionRate * avgTicket;
  const newCustomers = Math.round(leads * conversionRate);

  // CAC real
  const calculatedCAC = newCustomers > 0 ? totalMarketing / newCustomers : 0;

  // LTV estimation (asumiendo 12 meses de retención promedio)
  const ltv = avgTicket * 12 * 0.8; // 80% retention
  const ltvCacRatio = calculatedCAC > 0 ? ltv / calculatedCAC : 0;

  // Burn rate y runway
  const burnRate = totalExpenses + totalMarketing;
  const runway = burnRate > 0 ? cashBalance / burnRate : 999;

  // Generar alertas
  const alerts: FinancialProjectionFromKPIs['alerts'] = [];

  if (calculatedCAC > 100) {
    alerts.push({
      severity: 'warning',
      message: `CAC alto (€${calculatedCAC.toFixed(0)}). Target: €100`,
      recommendation: 'Optimizar canales de marketing de bajo rendimiento.',
    });
  }
  if (runway < 12 && runway > 0) {
    alerts.push({
      severity: 'critical',
      message: `Runway crítico: ${runway.toFixed(1)} meses`,
      recommendation: 'URGENTE: Reducir burn rate o buscar funding.',
    });
  }
  if (ltvCacRatio < 3 && ltvCacRatio > 0) {
    alerts.push({
      severity: 'warning',
      message: `LTV/CAC bajo (${ltvCacRatio.toFixed(1)}x). Mínimo recomendado: 3x`,
      recommendation: 'Mejorar retención o reducir costos de adquisición.',
    });
  }

  // Calcular gross margin
  const grossMargin = totalRevenue > 0 ? (totalRevenue - totalExpenses) / totalRevenue : 0;

  return {
    period: new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
    projected_revenue: totalRevenue + revenueFromPipeline,
    projected_expenses: totalExpenses + totalMarketing,
    projected_profit: (totalRevenue + revenueFromPipeline) - (totalExpenses + totalMarketing),
    confidence: 75,
    breakdown: {
      revenue_from_pipeline: revenueFromPipeline,
      revenue_from_recurring: totalRevenue * 0.3, // Estimación
      revenue_from_new_customers: newCustomers * avgTicket,
    },
    metrics: {
      calculated_cac: calculatedCAC,
      expected_cac: 100,
      ltv: ltv,
      ltv_cac_ratio: ltvCacRatio,
      gross_margin: grossMargin,
      burn_rate: burnRate,
      runway_months: runway,
    },
    alerts,
  };
}

export function useFinancialFromKPIs(organizationId: string | null) {
  const {
    data = null,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: enterpriseDataKeys.financialFromKPIs(organizationId),
    queryFn: () => fetchFinancialFromKPIs(organizationId),
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes - financial projections change moderately
    onError: (error: Error) => {
      console.error('Error fetching financial projections:', error);
    },
  });

  return { data, loading, error: error as Error | null };
}

// ============================================
// 3. HOOK: Lead Scoring
// ============================================

async function fetchLeadScore(leadId: string | null): Promise<LeadScore | null> {
  if (!leadId) return null;

  // 1. Verificar si ya existe score calculado
  const { data: existingScore } = await supabase
    .from('lead_scores')
    .select('*')
    .eq('lead_id', leadId)
    .maybeSingle();

  if (existingScore) {
    return {
      lead_id: existingScore.lead_id,
      total_score: existingScore.total_score || 0,
      breakdown: {
        source: existingScore.source_score || 0,
        engagement: existingScore.engagement_score || 0,
        fit_icp: existingScore.fit_score || 0,
        urgency: existingScore.urgency_score || 0,
        behavior: existingScore.behavior_score || 0,
      },
      classification: (existingScore.classification as 'hot' | 'warm' | 'cold') || 'cold',
      probability_to_close: existingScore.probability_to_close || 0,
      next_best_action: existingScore.next_best_action || '',
    };
  }

  // 2. Calcular nuevo score usando la función
  const { data: scoreValue, error: scoreError } = await supabase
    .rpc('calculate_lead_score_enterprise', { p_lead_id: leadId });

  if (scoreError) throw scoreError;

  // 3. Obtener detalles del lead
  const { data: leadData, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (leadError) throw leadError;

  // 4. Calcular breakdown
  const breakdown = {
    source: getSourceScore(leadData.source),
    engagement: 15,
    fit_icp: getFitScore(leadData.estimated_value),
    urgency: getUrgencyScore(leadData.pipeline_stage),
    behavior: 15,
  };

  const totalScore = scoreValue || Object.values(breakdown).reduce((a, b) => a + b, 0);
  const classification = totalScore >= 80 ? 'hot' : totalScore >= 50 ? 'warm' : 'cold';
  const probabilityToClose = Math.round(totalScore * 0.8);

  return {
    lead_id: leadId,
    total_score: totalScore,
    breakdown,
    classification,
    probability_to_close: probabilityToClose,
    next_best_action: getNextBestAction(classification, leadData.pipeline_stage),
  };
}

export function useLeadScoring(leadId: string | null) {
  const {
    data = null,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: enterpriseDataKeys.leadScoring(leadId),
    queryFn: () => fetchLeadScore(leadId),
    enabled: !!leadId,
    staleTime: 5 * 60 * 1000, // 5 minutes - lead scores are relatively stable
    onError: (error: Error) => {
      console.error('Error fetching lead score:', error);
    },
  });

  return { data, loading, error: error as Error | null };
}

function getSourceScore(source: string | null): number {
  const scores: Record<string, number> = {
    referral: 20,
    organic: 15,
    paid: 10,
  };
  return scores[source || ''] || 5;
}

function getFitScore(value?: number | null): number {
  if (!value) return 5;
  if (value > 10000) return 20;
  if (value > 5000) return 15;
  if (value > 2000) return 10;
  return 5;
}

function getUrgencyScore(stage: string | null): number {
  const scores: Record<string, number> = {
    closing: 15,
    negotiation: 12,
    proposal: 8,
  };
  return scores[stage || ''] || 5;
}

function getNextBestAction(classification: string, stage: string | null): string {
  if (classification === 'hot') {
    return 'Llamar HOY - Alta probabilidad de cierre';
  }
  if (classification === 'warm' && stage === 'proposal') {
    return 'Enviar follow-up email con case studies';
  }
  return 'Nutrir con contenido relevante';
}

// ============================================
// 4. HOOK: Pipeline Forecast
// ============================================

async function fetchPipelineForecast(organizationId: string | null): Promise<PipelineRevenueForcast | null> {
  if (!organizationId) return null;

  // Usar la vista enterprise_pipeline_forecast
  const { data: forecastData, error: forecastError } = await supabase
    .from('enterprise_pipeline_forecast')
    .select('*')
    .eq('organization_id', organizationId);

  if (forecastError) throw forecastError;

  const totalExpected = forecastData?.reduce((sum, stage) =>
    sum + Number(stage.expected_revenue || 0), 0
  ) || 0;

  // Calcular 3 escenarios
  const conservativeRevenue = totalExpected * 0.7;
  const realisticRevenue = totalExpected;
  const optimisticRevenue = totalExpected * 1.3;

  // Breakdown por etapa
  interface ForecastRow { stage: string; deal_count: number; avg_deal_size: number; total_value: number; expected_revenue: number }
  const breakdownByStage = (forecastData as ForecastRow[] | null)?.map((stage) => ({
    stage: stage.stage,
    deal_count: stage.deal_count || 0,
    avg_deal_size: stage.avg_deal_size || (stage.total_value / Math.max(stage.deal_count, 1)),
    total_value: stage.total_value || 0,
    probability: getProbabilityForStage(stage.stage),
    expected_revenue: stage.expected_revenue || 0,
  })) || [];

  // Obtener target de revenue
  const { data: targetData } = await supabase
    .from('kpi_targets')
    .select('target_value')
    .eq('organization_id', organizationId)
    .eq('kpi_metric', 'revenue')
    .maybeSingle();

  const targetRevenue = Number(targetData?.target_value || 40000);

  return {
    period: 'Próximos 30 días',
    conservative_scenario: {
      revenue: conservativeRevenue,
      probability: 70,
      confidence: 85,
    },
    realistic_scenario: {
      revenue: realisticRevenue,
      probability: 50,
      confidence: 75,
    },
    optimistic_scenario: {
      revenue: optimisticRevenue,
      probability: 30,
      confidence: 60,
    },
    breakdown_by_stage: breakdownByStage,
    target_revenue: targetRevenue,
    variance: realisticRevenue - targetRevenue,
  };
}

export function usePipelineForecast(organizationId: string | null) {
  const {
    data = null,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: enterpriseDataKeys.pipelineForecast(organizationId),
    queryFn: () => fetchPipelineForecast(organizationId),
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes - pipeline changes moderately
    onError: (error: Error) => {
      console.error('Error fetching pipeline forecast:', error);
    },
  });

  return { data, loading, error: error as Error | null };
}

function getProbabilityForStage(stage: string): number {
  const probabilities: Record<string, number> = {
    discovery: 0.10,
    qualification: 0.20,
    proposal: 0.50,
    negotiation: 0.70,
    closing: 0.85,
  };
  return probabilities[stage] || 0.05;
}

// ============================================
// 5. HOOK: Cash Flow Forecast
// ============================================

interface CashFlowForecastResult {
  forecast: CashFlowForecastType[];
  isUsingDemoData: boolean;
}

async function fetchCashFlowForecast(
  organizationId: string | null,
  months: 6 | 12
): Promise<CashFlowForecastResult> {
  if (!organizationId) return { forecast: [], isUsingDemoData: false };

  // Buscar forecast existente en cache
  const { data: cachedForecast, error: cacheError } = await supabase
    .from('cash_flow_forecast')
    .select('*')
    .eq('organization_id', organizationId)
    .order('month', { ascending: true })
    .limit(months);

  if (!cacheError && cachedForecast && cachedForecast.length > 0) {
    const formattedData: CashFlowForecastType[] = cachedForecast.map((cf) => ({
      month: cf.month || '',
      opening_balance: Number(cf.opening_balance || 0),
      projected_inflows: Number(cf.projected_inflows || 0),
      projected_outflows: Number(cf.projected_outflows || 0),
      net_cash_flow: Number(cf.net_cash_flow || 0),
      closing_balance: Number(cf.closing_balance || 0),
      inflows_breakdown: {
        sales_revenue: 0,
        recurring_revenue: 0,
        other_income: 0,
        ...((cf.inflows_breakdown as Record<string, number>) || {}),
      },
      outflows_breakdown: {
        salaries: 0,
        marketing: 0,
        operations: 0,
        infrastructure: 0,
        other: 0,
        ...((cf.outflows_breakdown as Record<string, number>) || {}),
      },
    }));
    return { forecast: formattedData, isUsingDemoData: false };
  }

  // Generar proyección basada en datos históricos
  const { data: revenueData } = await supabase
    .from('revenue_entries')
    .select('amount')
    .eq('organization_id', organizationId)
    .order('date', { ascending: false })
    .limit(30);

  const { data: expenseData } = await supabase
    .from('expense_entries')
    .select('amount')
    .eq('organization_id', organizationId)
    .order('date', { ascending: false })
    .limit(30);

  const { data: cashData } = await supabase
    .from('cash_balance')
    .select('balance')
    .eq('organization_id', organizationId)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const hasRealRevenue = revenueData && revenueData.length > 0;
  const hasRealExpenses = expenseData && expenseData.length > 0;
  const hasRealCash = !!cashData?.balance;

  // Indicar si estamos usando datos demo
  const isUsingDemoData = !hasRealRevenue && !hasRealExpenses && !hasRealCash;

  const avgMonthlyRevenue = hasRealRevenue
    ? revenueData.reduce((sum, r) => sum + Number(r.amount || 0), 0) / Math.max(revenueData.length / 30, 1)
    : 45000;

  const avgMonthlyExpenses = hasRealExpenses
    ? expenseData.reduce((sum, e) => sum + Number(e.amount || 0), 0) / Math.max(expenseData.length / 30, 1)
    : 35000;

  let openingBalance = Number(cashData?.balance || 150000);
  const forecast: CashFlowForecastType[] = [];

  for (let i = 0; i < months; i++) {
    const month = new Date();
    month.setMonth(month.getMonth() + i);
    const monthName = month.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });

    const projectedInflows = avgMonthlyRevenue * (1 + (i * 0.05));
    const projectedOutflows = avgMonthlyExpenses * (1 + (i * 0.02));
    const netCashFlow = projectedInflows - projectedOutflows;
    const closingBalance = openingBalance + netCashFlow;

    forecast.push({
      month: monthName,
      opening_balance: openingBalance,
      projected_inflows: projectedInflows,
      projected_outflows: projectedOutflows,
      net_cash_flow: netCashFlow,
      closing_balance: closingBalance,
      inflows_breakdown: {
        sales_revenue: projectedInflows * 0.85,
        recurring_revenue: projectedInflows * 0.13,
        other_income: projectedInflows * 0.02,
      },
      outflows_breakdown: {
        salaries: projectedOutflows * 0.52,
        marketing: projectedOutflows * 0.22,
        operations: projectedOutflows * 0.13,
        infrastructure: projectedOutflows * 0.08,
        other: projectedOutflows * 0.05,
      },
    });

    openingBalance = closingBalance;
  }

  return { forecast, isUsingDemoData };
}

export function useCashFlowForecast(organizationId: string | null, months: 6 | 12 = 6) {
  const {
    data = { forecast: [], isUsingDemoData: false },
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: enterpriseDataKeys.cashFlowForecast(organizationId, months),
    queryFn: () => fetchCashFlowForecast(organizationId, months),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes - cash flow projections are relatively stable
    onError: (error: Error) => {
      console.error('Error fetching cash flow forecast:', error);
    },
  });

  return {
    data: data.forecast,
    loading,
    error: error as Error | null,
    isUsingDemoData: data.isUsingDemoData,
  };
}

// ============================================
// 6. HOOK: Lost Reasons Analysis
// ============================================

async function fetchLostReasons(organizationId: string | null): Promise<LostReasonAnalysis | null> {
  if (!organizationId) return null;

  // Usar la vista enterprise_lost_reasons_summary
  const { data: reasonsData, error: reasonsError } = await supabase
    .from('enterprise_lost_reasons_summary')
    .select('*')
    .eq('organization_id', organizationId);

  if (reasonsError) throw reasonsError;

  const totalLostDeals = reasonsData?.reduce((sum, r) => sum + Number(r.count || 0), 0) || 0;
  const totalLostValue = reasonsData?.reduce((sum, r) => sum + Number(r.total_value || 0), 0) || 0;

  const formattedReasons = (reasonsData as LostReason[] | null)?.map((r) => ({
    reason: r.reason,
    count: r.count || 0,
    percentage: r.percentage || 0,
    total_value: r.total_value || 0,
    average_deal_size: r.total_value / Math.max(r.count, 1),
  })) || [];

  // Generar insights
  const insights: LostReasonAnalysis['insights'] = [];

  if (formattedReasons.length > 0) {
    const topReason = formattedReasons[0];
    if (topReason.percentage > 30) {
      insights.push({
        priority: 'high',
        finding: `${topReason.reason} representa el ${topReason.percentage}% de pérdidas`,
        recommendation: `Analizar y crear plan de acción específico para "${topReason.reason}"`,
      });
    }
  }

  return {
    period: 'Últimos 90 días',
    total_lost_deals: totalLostDeals,
    total_lost_value: totalLostValue,
    reasons: formattedReasons,
    trends: [],
    insights,
  };
}

export function useLostReasonsAnalysis(organizationId: string | null) {
  const {
    data = null,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: enterpriseDataKeys.lostReasons(organizationId),
    queryFn: () => fetchLostReasons(organizationId),
    enabled: !!organizationId,
    staleTime: 3 * 60 * 1000, // 3 minutes - lost reasons analysis is relatively stable
    onError: (error: Error) => {
      console.error('Error fetching lost reasons:', error);
    },
  });

  return { data, loading, error: error as Error | null };
}

// ============================================
// 7. HOOK: KPI Targets
// ============================================

async function fetchKPITargets(organizationId: string | null): Promise<KPITarget[]> {
  if (!organizationId) return [];

  const { data: targetsData, error: targetsError } = await supabase
    .from('kpi_targets')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (targetsError) throw targetsError;

  interface RawKPITargetData {
    id: string;
    organization_id: string;
    kpi_metric: string;
    target_value: number | null;
    current_value: number | null;
    target_date: string;
    period_type: string;
  }

  const formattedTargets: KPITarget[] = ((targetsData || []) as unknown as RawKPITargetData[]).map((t) => {
    const currentVal = Number(t.current_value || 0);
    const targetVal = Number(t.target_value || 0);
    const progress = targetVal > 0 ? (currentVal / targetVal) * 100 : 0;

    return {
      id: t.id,
      organization_id: t.organization_id,
      kpi_metric: t.kpi_metric,
      target_value: targetVal,
      current_value: currentVal,
      target_date: t.target_date,
      period_type: (t.period_type === 'monthly' || t.period_type === 'quarterly' || t.period_type === 'yearly' ? t.period_type : 'monthly') as 'monthly' | 'quarterly' | 'yearly',
      progress_percentage: progress,
      on_track: progress >= 80,
    };
  });

  return formattedTargets;
}

export function useKPITargets(organizationId: string | null) {
  const {
    data = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: enterpriseDataKeys.kpiTargets(organizationId),
    queryFn: () => fetchKPITargets(organizationId),
    enabled: !!organizationId,
    staleTime: 3 * 60 * 1000, // 3 minutes - targets don't change frequently
    onError: (error: Error) => {
      console.error('Error fetching KPI targets:', error);
    },
  });

  return { data, loading, error: error as Error | null };
}

// ============================================
// 8. HOOK: Budget Comparison
// ============================================

async function fetchBudgetComparison(organizationId: string | null): Promise<BudgetComparison[]> {
  if (!organizationId) return [];

  const { data: budgetData, error: budgetError } = await supabase
    .from('budget_items')
    .select('*')
    .eq('organization_id', organizationId)
    .order('category');

  if (budgetError) throw budgetError;

  interface RawBudgetData {
    category: string;
    budgeted_amount: number | null;
    actual_amount: number | null;
    variance_amount: number | null;
    variance_percentage: number | null;
    status: string;
  }

  const formattedBudget: BudgetComparison[] = ((budgetData || []) as unknown as RawBudgetData[]).map((b) => ({
    category: b.category,
    budgeted_amount: Number(b.budgeted_amount || 0),
    actual_amount: Number(b.actual_amount || 0),
    variance_amount: Number(b.variance_amount || 0),
    variance_percentage: Number(b.variance_percentage || 0),
    status: (b.status === 'on_budget' || b.status === 'over_budget' || b.status === 'under_budget' ? b.status : 'on_budget') as 'on_budget' | 'over_budget' | 'under_budget',
  }));

  return formattedBudget;
}

export function useBudgetComparison(organizationId: string | null) {
  const {
    data = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: enterpriseDataKeys.budgetComparison(organizationId),
    queryFn: () => fetchBudgetComparison(organizationId),
    enabled: !!organizationId,
    staleTime: 3 * 60 * 1000, // 3 minutes - budget data is stable
    onError: (error: Error) => {
      console.error('Error fetching budget comparison:', error);
    },
  });

  return { data, loading, error: error as Error | null };
}
