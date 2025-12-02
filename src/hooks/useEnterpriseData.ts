// ============================================
// HOOKS ENTERPRISE - DATOS REALES SUPABASE
// ============================================

import { useEffect, useState, useCallback } from 'react';
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

// ============================================
// 1. HOOK: Deal Velocity
// ============================================

export function useDealVelocity(organizationId: string | null) {
  const [data, setData] = useState<DealVelocityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDealVelocity = useCallback(async () => {
    if (!organizationId) return;
    
    try {
      setLoading(true);

      // 1. Calcular velocidad por stage usando la función
      const { data: velocityData, error: velocityError } = await supabase
        .rpc('calculate_deal_velocity', { org_id: organizationId });

      if (velocityError) throw velocityError;

      // 2. Detectar deals estancados
      const { data: stalledData, error: stalledError } = await supabase
        .rpc('detect_stalled_deals', { org_id: organizationId });

      if (stalledError) throw stalledError;

      // 3. Calcular total sales cycle
      const totalCycleDays = velocityData?.reduce((sum: number, stage: any) => 
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

      const bottlenecks = velocityData
        ?.filter((stage: any) => stage.average_days > (targetDays[stage.stage] || 7))
        .map((stage: any) => ({
          stage: stage.stage,
          average_days: stage.average_days,
          target_days: targetDays[stage.stage] || 7,
          excess_days: stage.average_days - (targetDays[stage.stage] || 7),
          impact: stage.average_days > (targetDays[stage.stage] || 7) * 1.5 ? 'high' as const : 'medium' as const,
        })) || [];

      // 5. Formatear datos
      const average_days_in_stage: Record<string, number> = {};
      velocityData?.forEach((stage: any) => {
        average_days_in_stage[stage.stage] = stage.average_days;
      });

      const formattedStalledDeals = stalledData?.map((deal: any) => ({
        deal_id: deal.lead_id,
        deal_name: deal.deal_name || 'Sin nombre',
        current_stage: deal.current_stage,
        days_in_stage: deal.days_in_stage,
        average_for_stage: deal.average_for_stage,
        excess_days: deal.excess_days,
        recommended_action: generateRecommendedAction(deal),
      })) || [];

      setData({
        average_days_in_stage,
        total_sales_cycle_days: totalCycleDays,
        target_sales_cycle_days: 45,
        variance_days: totalCycleDays - 45,
        bottlenecks,
        stalled_deals: formattedStalledDeals,
      });
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching deal velocity:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchDealVelocity();
  }, [fetchDealVelocity]);

  return { data, loading, error, refetch: fetchDealVelocity };
}

function generateRecommendedAction(deal: any): string {
  if (deal.excess_days > 15) {
    return `URGENTE: Contactar HOY. Deal estancado ${deal.excess_days} días más de lo normal.`;
  } else if (deal.excess_days > 7) {
    return `Programar reunión esta semana. Posibles objeciones sin resolver.`;
  }
  return `Hacer follow-up. Deal necesita atención.`;
}

// ============================================
// 2. HOOK: Financial From KPIs
// ============================================

export function useFinancialFromKPIs(organizationId: string | null) {
  const [data, setData] = useState<FinancialProjectionFromKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchFinancialProjections() {
      if (!organizationId) return;
      
      try {
        setLoading(true);

        // 1. Obtener últimos KPIs de business_metrics
        const { data: kpiData, error: kpiError } = await supabase
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

        setData({
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
        });
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching financial projections:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFinancialProjections();
  }, [organizationId]);

  return { data, loading, error };
}

// ============================================
// 3. HOOK: Lead Scoring
// ============================================

export function useLeadScoring(leadId: string | null) {
  const [data, setData] = useState<LeadScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchLeadScore() {
      if (!leadId) return;
      
      try {
        setLoading(true);

        // 1. Verificar si ya existe score calculado
        const { data: existingScore } = await supabase
          .from('lead_scores')
          .select('*')
          .eq('lead_id', leadId)
          .maybeSingle();

        if (existingScore) {
          setData({
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
          });
          setLoading(false);
          return;
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

        const newScore: LeadScore = {
          lead_id: leadId,
          total_score: totalScore,
          breakdown,
          classification,
          probability_to_close: probabilityToClose,
          next_best_action: getNextBestAction(classification, leadData.pipeline_stage),
        };

        setData(newScore);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching lead score:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeadScore();
  }, [leadId]);

  return { data, loading, error };
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

export function usePipelineForecast(organizationId: string | null) {
  const [data, setData] = useState<PipelineRevenueForcast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchPipelineForecast() {
      if (!organizationId) return;
      
      try {
        setLoading(true);

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
        const breakdownByStage = forecastData?.map((stage: any) => ({
          stage: stage.stage,
          deal_count: Number(stage.deal_count || 0),
          avg_deal_size: Number(stage.avg_deal_size || 0),
          total_value: Number(stage.total_value || 0),
          probability: getProbabilityForStage(stage.stage),
          expected_revenue: Number(stage.expected_revenue || 0),
        })) || [];

        // Obtener target de revenue
        const { data: targetData } = await supabase
          .from('kpi_targets')
          .select('target_value')
          .eq('organization_id', organizationId)
          .eq('kpi_metric', 'revenue')
          .maybeSingle();

        const targetRevenue = Number(targetData?.target_value || 40000);

        setData({
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
        });
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching pipeline forecast:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPipelineForecast();
  }, [organizationId]);

  return { data, loading, error };
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

export function useCashFlowForecast(organizationId: string | null, months: 6 | 12 = 6) {
  const [data, setData] = useState<CashFlowForecastType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchCashFlowForecast() {
      if (!organizationId) return;
      
      try {
        setLoading(true);

        // Buscar forecast existente en cache
        const { data: cachedForecast, error: cacheError } = await supabase
          .from('cash_flow_forecast')
          .select('*')
          .eq('organization_id', organizationId)
          .order('month', { ascending: true })
          .limit(months);

        if (!cacheError && cachedForecast && cachedForecast.length > 0) {
          const formattedData = cachedForecast.map((cf: any) => ({
            month: cf.month,
            opening_balance: Number(cf.opening_balance || 0),
            projected_inflows: Number(cf.projected_inflows || 0),
            projected_outflows: Number(cf.projected_outflows || 0),
            net_cash_flow: Number(cf.net_cash_flow || 0),
            closing_balance: Number(cf.closing_balance || 0),
            inflows_breakdown: cf.inflows_breakdown || {},
            outflows_breakdown: cf.outflows_breakdown || {},
          }));
          setData(formattedData);
          setLoading(false);
          return;
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

        const avgMonthlyRevenue = revenueData && revenueData.length > 0
          ? revenueData.reduce((sum, r) => sum + Number(r.amount || 0), 0) / Math.max(revenueData.length / 30, 1)
          : 45000;

        const avgMonthlyExpenses = expenseData && expenseData.length > 0
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

        setData(forecast);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching cash flow forecast:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCashFlowForecast();
  }, [organizationId, months]);

  return { data, loading, error };
}

// ============================================
// 6. HOOK: Lost Reasons Analysis
// ============================================

export function useLostReasonsAnalysis(organizationId: string | null) {
  const [data, setData] = useState<LostReasonAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchLostReasons() {
      if (!organizationId) return;
      
      try {
        setLoading(true);

        // Usar la vista enterprise_lost_reasons_summary
        const { data: reasonsData, error: reasonsError } = await supabase
          .from('enterprise_lost_reasons_summary')
          .select('*')
          .eq('organization_id', organizationId);

        if (reasonsError) throw reasonsError;

        const totalLostDeals = reasonsData?.reduce((sum, r) => sum + Number(r.count || 0), 0) || 0;
        const totalLostValue = reasonsData?.reduce((sum, r) => sum + Number(r.total_value || 0), 0) || 0;

        const formattedReasons = reasonsData?.map((r: any) => ({
          reason: r.reason,
          count: Number(r.count || 0),
          percentage: Number(r.percentage || 0),
          total_value: Number(r.total_value || 0),
          average_deal_size: Number(r.avg_deal_size || 0),
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

        setData({
          period: 'Últimos 90 días',
          total_lost_deals: totalLostDeals,
          total_lost_value: totalLostValue,
          reasons: formattedReasons,
          trends: [],
          insights,
        });
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching lost reasons:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLostReasons();
  }, [organizationId]);

  return { data, loading, error };
}

// ============================================
// 7. HOOK: KPI Targets
// ============================================

export function useKPITargets(organizationId: string | null) {
  const [data, setData] = useState<KPITarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchKPITargets() {
      if (!organizationId) return;
      
      try {
        setLoading(true);

        const { data: targetsData, error: targetsError } = await supabase
          .from('kpi_targets')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false });

        if (targetsError) throw targetsError;

        const formattedTargets: KPITarget[] = targetsData?.map((t: any) => {
          const progress = t.current_value && t.target_value 
            ? (t.current_value / t.target_value) * 100 
            : 0;
          
          return {
            id: t.id,
            organization_id: t.organization_id,
            kpi_metric: t.kpi_metric,
            target_value: Number(t.target_value || 0),
            current_value: Number(t.current_value || 0),
            target_date: t.target_date,
            period_type: t.period_type || 'monthly',
            progress_percentage: progress,
            on_track: progress >= 80,
          };
        }) || [];

        setData(formattedTargets);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching KPI targets:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchKPITargets();
  }, [organizationId]);

  return { data, loading, error };
}

// ============================================
// 8. HOOK: Budget Comparison
// ============================================

export function useBudgetComparison(organizationId: string | null) {
  const [data, setData] = useState<BudgetComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchBudgetComparison() {
      if (!organizationId) return;
      
      try {
        setLoading(true);

        const { data: budgetData, error: budgetError } = await supabase
          .from('budget_items')
          .select('*')
          .eq('organization_id', organizationId)
          .order('category');

        if (budgetError) throw budgetError;

        const formattedBudget: BudgetComparison[] = budgetData?.map((b: any) => ({
          category: b.category,
          budgeted_amount: Number(b.budgeted_amount || 0),
          actual_amount: Number(b.actual_amount || 0),
          variance_amount: Number(b.variance_amount || 0),
          variance_percentage: Number(b.variance_percentage || 0),
          status: b.status || 'on_budget',
        })) || [];

        setData(formattedBudget);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching budget comparison:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBudgetComparison();
  }, [organizationId]);

  return { data, loading, error };
}
