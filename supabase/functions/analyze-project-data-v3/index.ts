import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withRateLimit, rateLimitResponse } from "../_shared/rateLimiter.ts";
import { createLogger, extractRequestInfo } from "../_shared/structuredLogger.ts";
import { handleError, createErrorResponse } from "../_shared/errorHandler.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FUNCTION_NAME = 'analyze-project-data-v3';

serve(async (req) => {
  const logger = createLogger(FUNCTION_NAME);
  const requestId = logger.getRequestId();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      organizationId, 
      includeCompetitors = true,
      additionalData = {}
    } = await req.json();
    
    // Extract additional data from pre-analysis modal
    const { answers = {}, updatedMetrics = {}, context = {} } = additionalData;
    
    logger.setContext({ organizationId });
    logger.info('analysis_started', { 
      includeCompetitors,
      hasAdditionalData: Object.keys(additionalData).length > 0,
      answersCount: Object.keys(answers).length,
      hasUpdatedMetrics: Object.keys(updatedMetrics).length > 0,
      ...extractRequestInfo(req)
    });

    if (!organizationId) {
      logger.warn('missing_organization_id');
      return createErrorResponse('organizationId is required', 400, corsHeaders);
    }

    // Rate limiting: 5 requests per minute per organization
    const rateLimit = withRateLimit(organizationId, FUNCTION_NAME, {
      maxRequests: 5,
      windowMs: 60000
    });
    
    if (!rateLimit.allowed) {
      logger.warn('rate_limit_exceeded', { remaining: rateLimit.remaining });
      return rateLimitResponse(rateLimit, corsHeaders);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    logger.info('fetching_organization_data');

    // ============================================
    // RECOPILAR TODOS LOS DATOS DE LA ORGANIZACIÓN
    // ============================================

    // Fetch organization data
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      logger.error('organization_not_found', orgError);
      return createErrorResponse('Organization not found', 404, corsHeaders);
    }

    // Fetch financial data - last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: revenueData } = await supabase
      .from('revenue_entries')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('date', sixMonthsAgo.toISOString())
      .order('date', { ascending: true });

    const { data: expenseData } = await supabase
      .from('expense_entries')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('date', sixMonthsAgo.toISOString())
      .order('date', { ascending: true });

    // Fetch team data with profiles
    const { data: teamMembers } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        role,
        created_at,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .eq('organization_id', organizationId);

    // Fetch task completions for team performance
    const { data: taskCompletions } = await supabase
      .from('task_completions')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', sixMonthsAgo.toISOString());

    // Fetch leads/CRM data
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(500);

    // Fetch OKRs
    const { data: objectives } = await supabase
      .from('objectives')
      .select(`
        *,
        key_results (*)
      `)
      .eq('organization_id', organizationId);

    // Fetch business metrics
    const { data: businessMetrics } = await supabase
      .from('business_metrics')
      .select('*')
      .eq('organization_id', organizationId)
      .order('metric_date', { ascending: false })
      .limit(90);

    // Fetch competitors
    const { data: competitors } = await supabase
      .from('competitors')
      .select('*')
      .eq('organization_id', organizationId);

    // Fetch buyer personas
    const { data: buyerPersonas } = await supabase
      .from('buyer_personas')
      .select('*')
      .eq('organization_id', organizationId);

    // Fetch country data for market analysis
    let countryData = null;
    if (organization.country_code) {
      const { data: country } = await supabase
        .from('country_data')
        .select('*')
        .eq('country_code', organization.country_code)
        .single();
      countryData = country;
    }

    // Fetch cash balance
    const { data: cashBalance } = await supabase
      .from('cash_balance')
      .select('*')
      .eq('organization_id', organizationId)
      .order('date', { ascending: false })
      .limit(1);

    // Fetch products/services from organization
    const productsServices = organization.products_services || [];

    logger.info('data_collected', {
      revenueEntries: revenueData?.length || 0,
      expenseEntries: expenseData?.length || 0,
      teamMembers: teamMembers?.length || 0,
      leads: leads?.length || 0,
      objectives: objectives?.length || 0,
      competitors: competitors?.length || 0
    });

    // ============================================
    // CALCULAR MÉTRICAS DETALLADAS
    // ============================================

    const metrics = calculateDetailedMetrics({
      organization,
      revenueData: revenueData || [],
      expenseData: expenseData || [],
      teamMembers: teamMembers || [],
      taskCompletions: taskCompletions || [],
      leads: leads || [],
      objectives: objectives || [],
      businessMetrics: businessMetrics || [],
      cashBalance: cashBalance?.[0] || null,
      productsServices
    });

    // Build comprehensive AI prompt
    const prompt = buildComprehensivePrompt({
      organization,
      metrics,
      competitors: competitors || [],
      buyerPersonas: buyerPersonas || [],
      countryData,
      additionalData: { answers, updatedMetrics, context },
      includeCompetitors
    });

    logger.info('calling_ai_gateway', { promptLength: prompt.length });

    // Call Lovable AI Gateway with extended tokens
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Eres un consultor empresarial de élite con 20+ años de experiencia. Tu análisis debe ser:
- EXTREMADAMENTE DETALLADO y profesional
- Basado en datos reales proporcionados
- Con insights accionables y específicos
- En español, sin markdown, solo JSON válido
- Personalizado para la industria y contexto del negocio

IMPORTANTE: Genera datos numéricos realistas basados en los datos proporcionados. NO uses valores 0 a menos que sea verdaderamente cero. Siempre proporciona porcentajes, scores y métricas calculadas.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 8000
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logger.error('ai_gateway_error', new Error(errorText), { status: aiResponse.status });
      
      if (aiResponse.status === 429) {
        return createErrorResponse('Rate limits exceeded, please try again later.', 429, corsHeaders);
      }
      if (aiResponse.status === 402) {
        return createErrorResponse('Payment required, please add funds to your Lovable AI workspace.', 402, corsHeaders);
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const aiContent = aiResult.choices?.[0]?.message?.content || '';

    logger.info('ai_response_received', { contentLength: aiContent.length });

    // Parse AI response
    let analysisData;
    try {
      const cleanedContent = aiContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      analysisData = JSON.parse(cleanedContent);
    } catch (parseError) {
      logger.error('ai_response_parse_error', parseError, { rawContentPreview: aiContent.slice(0, 500) });
      analysisData = generateComprehensiveFallback(organization, metrics, competitors || [], countryData);
    }

    // Enrich analysis with calculated data
    const enrichedAnalysis = enrichAnalysisData(analysisData, metrics, organization);

    // Store analysis result in database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('ai_analysis_results')
      .insert({
        organization_id: organizationId,
        analysis_data: enrichedAnalysis,
        generated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (saveError) {
      logger.error('save_analysis_error', saveError);
    }

    // Update organization's last analysis timestamp
    await supabase
      .from('organizations')
      .update({
        last_ai_analysis_at: new Date().toISOString(),
        ai_analysis_count: (organization.ai_analysis_count || 0) + 1
      })
      .eq('id', organizationId);

    logger.info('analysis_completed', { savedId: savedAnalysis?.id });

    return new Response(
      JSON.stringify({
        success: true,
        analysis: enrichedAnalysis,
        savedId: savedAnalysis?.id,
        requestId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    logger.error('analysis_failed', error);
    
    await handleError(error, {
      functionName: FUNCTION_NAME,
      requestId,
      endpoint: '/analyze-project-data-v3',
      method: req.method,
    });

    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500,
      corsHeaders
    );
  }
});

// ============================================
// FUNCIONES DE CÁLCULO
// ============================================

interface OrganizationData {
  organization: Record<string, unknown>;
  revenueData: Record<string, unknown>[];
  expenseData: Record<string, unknown>[];
  teamMembers: Record<string, unknown>[];
  taskCompletions: Record<string, unknown>[];
  leads: Record<string, unknown>[];
  objectives: Record<string, unknown>[];
  businessMetrics: Record<string, unknown>[];
  cashBalance: Record<string, unknown> | null;
  productsServices: Record<string, unknown>[];
}

interface CalculatedMetrics {
  financial: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    avgMonthlyRevenue: number;
    avgMonthlyExpenses: number;
    revenueGrowth: number;
    expenseGrowth: number;
    cashOnHand: number;
    burnRate: number;
    runwayMonths: number;
    revenueByMonth: { month: string; revenue: number; expenses: number }[];
  };
  team: {
    totalMembers: number;
    activeMembers: number;
    avgTasksPerMember: number;
    completionRate: number;
    memberPerformance: { name: string; role: string; tasksCompleted: number; score: number }[];
  };
  crm: {
    totalLeads: number;
    wonLeads: number;
    lostLeads: number;
    conversionRate: number;
    avgDealSize: number;
    pipelineValue: number;
    leadsByStage: Record<string, number>;
    leadsBySource: Record<string, number>;
  };
  okrs: {
    totalObjectives: number;
    completedObjectives: number;
    avgProgress: number;
    keyResultsCompletion: number;
  };
  products: {
    totalProducts: number;
    avgMargin: number;
    productPerformance: { name: string; revenue: number; margin: number }[];
  };
}

function calculateDetailedMetrics(data: OrganizationData): CalculatedMetrics {
  const { revenueData, expenseData, teamMembers, taskCompletions, leads, objectives, productsServices } = data;

  // Financial calculations
  const totalRevenue = revenueData.reduce((sum, r) => sum + ((r as { amount?: number }).amount || 0), 0);
  const totalExpenses = expenseData.reduce((sum, e) => sum + ((e as { amount?: number }).amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Calculate monthly breakdown
  const revenueByMonth: { month: string; revenue: number; expenses: number }[] = [];
  const monthlyRevenue: Record<string, number> = {};
  const monthlyExpenses: Record<string, number> = {};

  revenueData.forEach((r) => {
    const date = new Date((r as { date?: string }).date || '');
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + ((r as { amount?: number }).amount || 0);
  });

  expenseData.forEach((e) => {
    const date = new Date((e as { date?: string }).date || '');
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyExpenses[monthKey] = (monthlyExpenses[monthKey] || 0) + ((e as { amount?: number }).amount || 0);
  });

  const allMonths = [...new Set([...Object.keys(monthlyRevenue), ...Object.keys(monthlyExpenses)])].sort();
  allMonths.forEach(month => {
    revenueByMonth.push({
      month,
      revenue: monthlyRevenue[month] || 0,
      expenses: monthlyExpenses[month] || 0
    });
  });

  const monthCount = Math.max(revenueByMonth.length, 1);
  const avgMonthlyRevenue = totalRevenue / monthCount;
  const avgMonthlyExpenses = totalExpenses / monthCount;

  // Revenue growth (compare last 2 months)
  let revenueGrowth = 0;
  if (revenueByMonth.length >= 2) {
    const lastMonth = revenueByMonth[revenueByMonth.length - 1].revenue;
    const prevMonth = revenueByMonth[revenueByMonth.length - 2].revenue;
    revenueGrowth = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0;
  }

  // Cash and runway
  const cashOnHand = (data.cashBalance as { balance?: number })?.balance || 0;
  const burnRate = avgMonthlyExpenses - avgMonthlyRevenue;
  const runwayMonths = burnRate > 0 && cashOnHand > 0 ? Math.floor(cashOnHand / burnRate) : burnRate <= 0 ? 24 : 0;

  // Team calculations
  const totalMembers = teamMembers.length;
  const tasksByUser: Record<string, number> = {};
  taskCompletions.forEach((tc) => {
    const userId = (tc as { user_id?: string }).user_id || '';
    tasksByUser[userId] = (tasksByUser[userId] || 0) + 1;
  });

  const memberPerformance = teamMembers.map((tm) => {
    const userId = (tm as { user_id?: string }).user_id || '';
    const profile = (tm as { profiles?: { full_name?: string } }).profiles;
    const tasksCompleted = tasksByUser[userId] || 0;
    return {
      name: profile?.full_name || 'Usuario',
      role: (tm as { role?: string }).role || 'Miembro',
      tasksCompleted,
      score: Math.min(100, tasksCompleted * 5 + 50)
    };
  });

  const totalTasks = taskCompletions.length;
  const completedTasks = taskCompletions.filter((tc) => (tc as { completed_by_user?: boolean }).completed_by_user).length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // CRM calculations
  const totalLeads = leads.length;
  const wonLeads = leads.filter((l) => 
    (l as { stage?: string }).stage === 'won' || 
    (l as { pipeline_stage?: string }).pipeline_stage === 'closed_won' ||
    (l as { pipeline_stage?: string }).pipeline_stage === 'ganado'
  ).length;
  const lostLeads = leads.filter((l) => 
    (l as { stage?: string }).stage === 'lost' ||
    (l as { pipeline_stage?: string }).pipeline_stage === 'perdido'
  ).length;
  const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

  const pipelineValue = leads.reduce((sum, l) => sum + ((l as { estimated_value?: number }).estimated_value || 0), 0);
  const avgDealSize = wonLeads > 0 ? pipelineValue / wonLeads : 0;

  const leadsByStage: Record<string, number> = {};
  const leadsBySource: Record<string, number> = {};
  leads.forEach((l) => {
    const stage = (l as { pipeline_stage?: string }).pipeline_stage || (l as { stage?: string }).stage || 'unknown';
    const source = (l as { source?: string }).source || 'Directo';
    leadsByStage[stage] = (leadsByStage[stage] || 0) + 1;
    leadsBySource[source] = (leadsBySource[source] || 0) + 1;
  });

  // OKR calculations
  const totalObjectives = objectives.length;
  const completedObjectives = objectives.filter((o) => (o as { status?: string }).status === 'completed').length;
  let totalProgress = 0;
  let krCount = 0;
  objectives.forEach((o) => {
    const krs = (o as { key_results?: { current?: number; target?: number }[] }).key_results || [];
    krs.forEach((kr) => {
      const progress = kr.target && kr.target > 0 ? (kr.current || 0) / kr.target * 100 : 0;
      totalProgress += Math.min(progress, 100);
      krCount++;
    });
  });
  const avgProgress = krCount > 0 ? totalProgress / krCount : 0;

  // Products calculations
  const productPerformance = productsServices.map((p) => ({
    name: (p as { name?: string }).name || 'Producto',
    revenue: ((p as { price?: number }).price || 0) * ((p as { unitsSoldPerMonth?: number }).unitsSoldPerMonth || 0),
    margin: (p as { price?: number }).price && (p as { cost?: number }).cost 
      ? (((p as { price: number }).price - (p as { cost: number }).cost) / (p as { price: number }).price) * 100 
      : 0
  }));

  const avgMargin = productPerformance.length > 0 
    ? productPerformance.reduce((sum, p) => sum + p.margin, 0) / productPerformance.length 
    : 0;

  return {
    financial: {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      avgMonthlyRevenue,
      avgMonthlyExpenses,
      revenueGrowth,
      expenseGrowth: 0,
      cashOnHand,
      burnRate: Math.max(0, burnRate),
      runwayMonths,
      revenueByMonth
    },
    team: {
      totalMembers,
      activeMembers: totalMembers,
      avgTasksPerMember: totalMembers > 0 ? totalTasks / totalMembers : 0,
      completionRate,
      memberPerformance
    },
    crm: {
      totalLeads,
      wonLeads,
      lostLeads,
      conversionRate,
      avgDealSize,
      pipelineValue,
      leadsByStage,
      leadsBySource
    },
    okrs: {
      totalObjectives,
      completedObjectives,
      avgProgress,
      keyResultsCompletion: avgProgress
    },
    products: {
      totalProducts: productsServices.length,
      avgMargin,
      productPerformance
    }
  };
}

function buildComprehensivePrompt(input: {
  organization: Record<string, unknown>;
  metrics: CalculatedMetrics;
  competitors: Record<string, unknown>[];
  buyerPersonas: Record<string, unknown>[];
  countryData: Record<string, unknown> | null;
  additionalData: {
    answers: Record<string, unknown>;
    updatedMetrics: Record<string, unknown>;
    context: Record<string, unknown>;
  };
  includeCompetitors: boolean;
}): string {
  const { organization, metrics, competitors, buyerPersonas, countryData, additionalData } = input;

  const orgName = (organization as { name?: string }).name || 'Empresa';
  const industry = (organization as { industry?: string }).industry || 'General';
  const companySize = (organization as { company_size?: string }).company_size || 'Pequeña';
  const businessDescription = (organization as { business_description?: string }).business_description || '';
  const foundedYear = (organization as { founded_year?: number }).founded_year;
  const businessModel = (organization as { business_model?: string }).business_model || 'B2B';
  const competitiveAdvantage = (organization as { competitive_advantage?: string }).competitive_advantage || '';

  let competitorSection = '';
  if (competitors.length > 0) {
    competitorSection = `
COMPETENCIA IDENTIFICADA (${competitors.length} competidores):
${competitors.map((c, i) => `
${i + 1}. ${(c as { name?: string }).name}
   - Descripción: ${(c as { description?: string }).description || 'N/A'}
   - Sitio web: ${(c as { website?: string }).website || 'N/A'}
   - Posición: ${(c as { market_position?: string }).market_position || 'N/A'}
   - Fortalezas: ${((c as { strengths?: string[] }).strengths || []).join(', ') || 'No especificadas'}
   - Debilidades: ${((c as { weaknesses?: string[] }).weaknesses || []).join(', ') || 'No especificadas'}
   - Pricing: ${JSON.stringify((c as { pricing_info?: unknown }).pricing_info) || 'N/A'}
`).join('')}`;
  }

  let marketSection = '';
  if (countryData) {
    marketSection = `
DATOS DEL MERCADO (${(countryData as { country_name?: string }).country_name}):
- Población: ${((countryData as { population?: number }).population || 0).toLocaleString()}
- PIB per cápita: €${((countryData as { gdp_per_capita?: number }).gdp_per_capita || 0).toLocaleString()}
- Penetración Internet: ${(countryData as { internet_penetration?: number }).internet_penetration}%
- Penetración eCommerce: ${(countryData as { ecommerce_penetration?: number }).ecommerce_penetration}%
- Tasa de Desempleo: ${(countryData as { unemployment_rate?: number }).unemployment_rate}%
- IVA: ${(countryData as { vat_rate?: number }).vat_rate}%
- Impuesto Sociedades: ${(countryData as { corporate_tax_rate?: number }).corporate_tax_rate}%
- Plataformas sociales top: ${JSON.stringify((countryData as { top_social_platforms?: unknown }).top_social_platforms)}
- Plataformas eCommerce top: ${JSON.stringify((countryData as { top_ecommerce_platforms?: unknown }).top_ecommerce_platforms)}
`;
  }

  let personasSection = '';
  if (buyerPersonas.length > 0) {
    personasSection = `
BUYER PERSONAS DEFINIDAS:
${buyerPersonas.map((p) => `
- ${(p as { name?: string }).name}: ${(p as { occupation?: string }).occupation}, ${(p as { age?: number }).age} años
  Objetivos: ${((p as { goals?: string[] }).goals || []).join(', ')}
  Pain Points: ${((p as { pain_points?: string[] }).pain_points || []).join(', ')}
  Canales preferidos: ${((p as { preferred_channels?: string[] }).preferred_channels || []).join(', ')}
`).join('')}`;
  }

  let additionalDataSection = '';
  const { answers = {}, updatedMetrics = {}, context = {} } = additionalData;
  
  if (Object.keys(answers).length > 0 || Object.keys(updatedMetrics).length > 0 || Object.keys(context).length > 0) {
    const answersPart = Object.keys(answers).length > 0 
      ? `RESPUESTAS DEL USUARIO:\n${Object.entries(answers).map(([key, value]) => `- ${key}: ${value}`).join('\n')}\n` 
      : '';
    
    const metricsPart = Object.keys(updatedMetrics).length > 0
      ? `MÉTRICAS ACTUALIZADAS:\n${Object.entries(updatedMetrics).map(([key, value]) => `- ${key}: ${value}`).join('\n')}\n`
      : '';
    
    const contextPart = Object.keys(context).length > 0
      ? `CONTEXTO ADICIONAL:\n- Urgencia: ${(context as { urgency?: string }).urgency || 'medium'}\n- Áreas de enfoque: ${((context as { focusAreas?: string[] }).focusAreas || []).join(', ')}\n- Preguntas específicas: ${((context as { specificQuestions?: string[] }).specificQuestions || []).join(', ')}\n`
      : '';
    
    additionalDataSection = `
INFORMACIÓN ADICIONAL PROPORCIONADA POR EL USUARIO:
${answersPart}${metricsPart}${contextPart}`;
  }

  return `Genera un análisis empresarial COMPLETO y PROFESIONAL para:

===== PERFIL DE LA EMPRESA =====
Nombre: ${orgName}
Industria: ${industry}
Tamaño: ${companySize}
Modelo de Negocio: ${businessModel}
Año Fundación: ${foundedYear || 'No especificado'}
Descripción: ${businessDescription}
Ventaja Competitiva: ${competitiveAdvantage}

===== MÉTRICAS FINANCIERAS (Últimos 6 meses) =====
- Ingresos Totales: €${metrics.financial.totalRevenue.toLocaleString()}
- Gastos Totales: €${metrics.financial.totalExpenses.toLocaleString()}
- Beneficio Neto: €${metrics.financial.netProfit.toLocaleString()}
- Margen de Beneficio: ${metrics.financial.profitMargin.toFixed(1)}%
- Ingresos Mensuales Promedio: €${metrics.financial.avgMonthlyRevenue.toLocaleString()}
- Gastos Mensuales Promedio: €${metrics.financial.avgMonthlyExpenses.toLocaleString()}
- Crecimiento de Ingresos (mes a mes): ${metrics.financial.revenueGrowth.toFixed(1)}%
- Cash disponible: €${metrics.financial.cashOnHand.toLocaleString()}
- Burn Rate: €${metrics.financial.burnRate.toLocaleString()}/mes
- Runway: ${metrics.financial.runwayMonths} meses
- Evolución mensual: ${JSON.stringify(metrics.financial.revenueByMonth)}

===== MÉTRICAS DEL EQUIPO =====
- Total Miembros: ${metrics.team.totalMembers}
- Tareas por Miembro (promedio): ${metrics.team.avgTasksPerMember.toFixed(1)}
- Tasa de Completado: ${metrics.team.completionRate.toFixed(1)}%
- Rendimiento Individual: ${JSON.stringify(metrics.team.memberPerformance)}

===== MÉTRICAS CRM =====
- Total Leads: ${metrics.crm.totalLeads}
- Leads Ganados: ${metrics.crm.wonLeads}
- Leads Perdidos: ${metrics.crm.lostLeads}
- Tasa de Conversión: ${metrics.crm.conversionRate.toFixed(1)}%
- Ticket Promedio: €${metrics.crm.avgDealSize.toLocaleString()}
- Valor Pipeline: €${metrics.crm.pipelineValue.toLocaleString()}
- Distribución por Etapa: ${JSON.stringify(metrics.crm.leadsByStage)}
- Fuentes de Leads: ${JSON.stringify(metrics.crm.leadsBySource)}

===== OKRs =====
- Total Objetivos: ${metrics.okrs.totalObjectives}
- Objetivos Completados: ${metrics.okrs.completedObjectives}
- Progreso Promedio: ${metrics.okrs.avgProgress.toFixed(1)}%

===== PRODUCTOS/SERVICIOS =====
- Total: ${metrics.products.totalProducts}
- Margen Promedio: ${metrics.products.avgMargin.toFixed(1)}%
- Rendimiento: ${JSON.stringify(metrics.products.productPerformance)}
${competitorSection}
${marketSection}
${personasSection}
${additionalDataSection}

===== INSTRUCCIONES PARA EL JSON =====
Responde ÚNICAMENTE con JSON válido. Sin markdown. Sin explicaciones.

La estructura EXACTA debe ser:
{
  "executive_dashboard": {
    "overall_score": [número 0-100 basado en datos reales],
    "health_status": "excellent|good|warning|critical",
    "summary": "[resumen ejecutivo de 2-3 oraciones sobre el estado del negocio]",
    "key_metrics": {
      "revenue_trend": [porcentaje de cambio basado en datos],
      "efficiency_score": [0-100 basado en márgenes y productividad],
      "team_performance": [0-100 basado en completado de tareas],
      "customer_satisfaction": [0-100 estimado por conversión]
    },
    "comparison_last_period": {
      "revenue_change": [porcentaje],
      "profit_change": [porcentaje],
      "team_productivity_change": [porcentaje],
      "customer_growth": [porcentaje]
    }
  },
  "financial_health": {
    "score": [0-100],
    "status": "excellent|good|warning|critical",
    "metrics": {
      "monthly_revenue": ${metrics.financial.avgMonthlyRevenue},
      "monthly_expenses": ${metrics.financial.avgMonthlyExpenses},
      "profit_margin": ${metrics.financial.profitMargin.toFixed(1)},
      "burn_rate": ${metrics.financial.burnRate},
      "runway_months": ${metrics.financial.runwayMonths},
      "cash_balance": ${metrics.financial.cashOnHand},
      "revenue_per_employee": [calcular],
      "operating_efficiency": [0-100]
    },
    "trends": {
      "revenue_growth": ${metrics.financial.revenueGrowth.toFixed(1)},
      "expense_growth": [calcular],
      "margin_trend": "improving|stable|declining",
      "cash_flow_trend": "improving|stable|declining"
    },
    "insights": ["insight 1 específico basado en datos", "insight 2", "insight 3"],
    "recommendations": ["recomendación 1 accionable", "recomendación 2", "recomendación 3"],
    "warning_signs": ["señal de alerta si existe"],
    "charts": {
      "revenue_vs_expenses": [array de {month, revenue, expenses}],
      "margin_evolution": [array de {month, margin}],
      "burn_rate_projection": [array de {month, burn_rate}],
      "cash_runway": [array de {month, cash}]
    }
  },
  "growth_analysis": {
    "current_stage": "startup|growth|scale|mature",
    "growth_rate": "fast|moderate|slow|negative",
    "growth_score": [0-100],
    "metrics": {
      "customer_acquisition": [número mensual],
      "retention_rate": [0-100],
      "expansion_revenue": [0-100],
      "market_penetration": [0-100],
      "monthly_growth_rate": [porcentaje],
      "customer_lifetime_value": [euros],
      "customer_acquisition_cost": [euros]
    },
    "bottlenecks": [{"area": "", "severity": "critical|high|medium|low", "description": "", "impact": "", "solution": "", "estimated_resolution_time": ""}],
    "opportunities": [{"title": "", "description": "", "potential_impact": "high|medium|low", "effort_required": "high|medium|low", "timeline": "", "expected_roi": "", "dependencies": []}],
    "competitive_advantages": ["ventaja 1", "ventaja 2"],
    "market_threats": ["amenaza 1", "amenaza 2"],
    "charts": {
      "customer_growth": [array de {month, customers}],
      "revenue_by_product": [array de {name, revenue}],
      "market_share_evolution": [array de {month, share}],
      "churn_analysis": [array de {month, churn_rate}]
    }
  },
  "team_performance": {
    "overall_score": [0-100],
    "productivity_trend": "improving|stable|declining",
    "team_metrics": {
      "total_members": ${metrics.team.totalMembers},
      "active_members": ${metrics.team.activeMembers},
      "avg_tasks_per_member": ${metrics.team.avgTasksPerMember.toFixed(1)},
      "completion_rate": ${metrics.team.completionRate.toFixed(1)},
      "collaboration_score": [0-100],
      "innovation_score": [0-100],
      "retention_rate": [0-100]
    },
    "individual_performance": [
      {
        "user_id": "",
        "user_name": "[nombre real del equipo]",
        "role": "[rol]",
        "performance_score": [0-100],
        "strengths": ["fortaleza 1", "fortaleza 2"],
        "areas_to_improve": ["área 1"],
        "task_completion_rate": [0-100],
        "impact_rating": "high|medium|low",
        "burnout_risk": "high|medium|low",
        "personalized_advice": "[consejo específico]",
        "recent_achievements": ["logro 1"],
        "collaboration_score": [0-100]
      }
    ],
    "bottlenecks": ["cuello de botella 1"],
    "star_performers": ["nombre del mejor performer"],
    "at_risk_members": ["miembro en riesgo si existe"],
    "team_health_indicators": {
      "workload_balance": [0-100],
      "communication_quality": [0-100],
      "goal_alignment": [0-100],
      "morale": [0-100]
    },
    "charts": {
      "productivity_by_member": [array de {name, productivity}],
      "task_distribution": [array de {name, tasks}],
      "completion_rates": [array de {month, rate}],
      "team_velocity": [array de {week, velocity}]
    }
  },
  "strategic_priorities": {
    "high_impact_low_effort": [{"id": "", "title": "", "description": "", "impact": "high", "effort": "low", "timeline": "", "expected_outcome": "", "priority_score": 90}],
    "high_impact_high_effort": [{"id": "", "title": "", "description": "", "impact": "high", "effort": "high", "timeline": "", "expected_outcome": "", "priority_score": 80}],
    "low_impact_low_effort": [{"id": "", "title": "", "description": "", "impact": "low", "effort": "low", "timeline": "", "expected_outcome": "", "priority_score": 50}],
    "low_impact_high_effort": [{"id": "", "title": "", "description": "", "impact": "low", "effort": "high", "timeline": "", "expected_outcome": "", "priority_score": 30}],
    "recommended_focus": ["enfoque 1", "enfoque 2", "enfoque 3"],
    "initiatives_to_stop": ["iniciativa a dejar"]
  },
  "strategic_questions": {
    "focus_questions": [{"id": "", "question": "¿Pregunta importante?", "category": "strategy", "why_important": "", "current_situation": "", "suggested_approach": "", "deadline": "this_week|this_month|this_quarter", "consequences_if_ignored": ""}],
    "money_questions": [],
    "team_questions": [],
    "market_questions": [],
    "product_questions": []
  },
  "future_roadmap": {
    "next_30_days": [{"id": "", "title": "", "priority": "critical|high|medium|low", "description": "", "estimated_impact": "", "action_items": [], "dependencies": []}],
    "next_90_days": [],
    "next_year": [],
    "scaling_plan": {
      "current_capacity": "",
      "target_capacity": "",
      "bottlenecks_for_scale": [],
      "required_investments": [{"area": "", "amount": "€X", "expected_return": "", "timeline": "", "roi_percentage": 0, "risk_level": "high|medium|low"}],
      "hiring_plan": [{"role": "", "when": "", "why": "", "priority": "high|medium|low", "estimated_cost": "€X/mes", "expected_impact": ""}],
      "infrastructure_needs": [],
      "timeline_to_scale": ""
    }
  },
  "projections": {
    "next_month": {"period": "Próximo Mes", "revenue": 0, "expenses": 0, "net_profit": 0, "team_size": 0, "customers": 0, "confidence": 80},
    "next_quarter": {"period": "Próximo Trimestre", "revenue": 0, "expenses": 0, "net_profit": 0, "team_size": 0, "customers": 0, "confidence": 70},
    "next_year": {"period": "Próximo Año", "revenue": 0, "expenses": 0, "net_profit": 0, "team_size": 0, "customers": 0, "confidence": 50},
    "scenarios": [
      {"name": "Optimista", "description": "", "assumptions": [], "projected_revenue": 0, "projected_expenses": 0, "projected_team_size": 0, "projected_customers": 0, "probability": 25, "risk_factors": []},
      {"name": "Realista", "description": "", "assumptions": [], "projected_revenue": 0, "projected_expenses": 0, "projected_team_size": 0, "projected_customers": 0, "probability": 50, "risk_factors": []},
      {"name": "Pesimista", "description": "", "assumptions": [], "projected_revenue": 0, "projected_expenses": 0, "projected_team_size": 0, "projected_customers": 0, "probability": 25, "risk_factors": []}
    ],
    "key_assumptions": [],
    "risk_factors": [],
    "charts": {
      "revenue_projection": [],
      "team_growth_projection": [],
      "cash_runway_projection": [],
      "customer_projection": []
    }
  },
  "critical_alerts": [
    {"id": "", "severity": "critical|high|medium|low", "category": "financial|team|operations|market|strategy|product", "title": "", "description": "", "impact": "", "recommended_action": "", "deadline": "2024-01-15", "auto_resolve": false}
  ],
  "honest_feedback": {
    "overall_assessment": "[Evaluación honesta y directa del estado del negocio]",
    "what_is_working": ["lo que funciona 1", "lo que funciona 2"],
    "what_is_not_working": ["lo que no funciona 1"],
    "hard_truths": ["verdad difícil 1", "verdad difícil 2"],
    "tough_decisions": [{"decision": "", "why_necessary": "", "consequences_if_not_done": "", "consequences_if_done": "", "recommendation": "", "difficulty": "hard|very_hard|extremely_hard", "estimated_timeline": "", "success_probability": 70}],
    "competitive_position": {
      "strengths": [],
      "weaknesses": [],
      "threats": [],
      "opportunities": []
    },
    "existential_risks": [],
    "blind_spots": []
  },
  "benchmarking": {
    "industry_avg": {
      "revenue_growth": [promedio industria],
      "profit_margin": [promedio industria],
      "cac": [promedio industria],
      "ltv": [promedio industria],
      "churn_rate": [promedio industria],
      "team_productivity": [promedio industria]
    },
    "your_position": {
      "revenue_growth": ${metrics.financial.revenueGrowth.toFixed(1)},
      "profit_margin": ${metrics.financial.profitMargin.toFixed(1)},
      "cac": [tu CAC],
      "ltv": [tu LTV],
      "churn_rate": [tu churn],
      "team_productivity": ${metrics.team.completionRate.toFixed(1)}
    },
    "percentile_rank": [0-100 donde estás vs industria],
    "gaps": [{"metric": "", "gap": "", "improvement_needed": "", "priority": "critical|high|medium|low"}],
    "peer_comparison": "[Comparación con empresas similares]"
  },
  "market_study": {
    "market_size": "[tamaño del mercado en euros]",
    "market_growth_rate": "[% crecimiento anual]",
    "market_maturity": "emerging|growing|mature|declining",
    "competitive_intensity": "high|medium|low",
    "key_trends": ["tendencia 1", "tendencia 2", "tendencia 3"],
    "regulatory_factors": ["factor 1"],
    "entry_barriers": "high|medium|low",
    "positioning_recommendation": "[recomendación de posicionamiento]",
    "target_segments": [{"name": "", "size": "", "growth_potential": "high|medium|low", "fit_score": 0, "strategy": ""}],
    "competitive_matrix": [{"competitor": "", "market_share": 0, "strengths": [], "weaknesses": [], "threat_level": "high|medium|low"}],
    "swot_analysis": {
      "strengths": [],
      "weaknesses": [],
      "opportunities": [],
      "threats": []
    },
    "market_entry_strategy": "[estrategia recomendada]",
    "pricing_analysis": {
      "current_position": "premium|mid-market|budget",
      "recommended_position": "premium|mid-market|budget",
      "price_elasticity": "high|medium|low",
      "pricing_recommendations": []
    }
  }
}

IMPORTANTE: 
- Todos los números deben ser realistas basados en los datos proporcionados
- Los arrays de charts deben tener al menos 6 elementos con datos coherentes
- Las recomendaciones deben ser específicas y accionables
- El análisis debe ser crítico pero constructivo`;
}

function enrichAnalysisData(
  analysisData: Record<string, unknown>, 
  metrics: CalculatedMetrics, 
  organization: Record<string, unknown>
): Record<string, unknown> {
  // Ensure chart data exists and has proper format
  const enriched = { ...analysisData };

  // Add metadata
  enriched.id = crypto.randomUUID();
  enriched.organization_id = (organization as { id?: string }).id;
  enriched.generated_at = new Date().toISOString();
  enriched.data_period = {
    start_date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date().toISOString()
  };
  enriched.version = '3.0';
  enriched.data_sources = ['revenue_entries', 'expense_entries', 'leads', 'objectives', 'task_completions', 'competitors'];
  enriched.data_quality_score = calculateDataQualityScore(metrics);
  enriched.confidence_score = Math.min(95, 50 + metrics.financial.revenueByMonth.length * 5);
  enriched.next_analysis_recommended = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Ensure financial charts have data
  if (!enriched.financial_health || typeof enriched.financial_health !== 'object') {
    enriched.financial_health = {};
  }
  const financialHealth = enriched.financial_health as Record<string, unknown>;
  
  if (!financialHealth.charts || typeof financialHealth.charts !== 'object') {
    financialHealth.charts = {};
  }
  const charts = financialHealth.charts as Record<string, unknown>;
  
  // Add real revenue vs expenses data
  if (!charts.revenue_vs_expenses || !Array.isArray(charts.revenue_vs_expenses) || (charts.revenue_vs_expenses as unknown[]).length === 0) {
    charts.revenue_vs_expenses = metrics.financial.revenueByMonth.map(m => ({
      month: m.month,
      revenue: m.revenue,
      expenses: m.expenses
    }));
  }

  return enriched;
}

function calculateDataQualityScore(metrics: CalculatedMetrics): number {
  let score = 0;
  
  // Financial data quality (40 points)
  if (metrics.financial.revenueByMonth.length >= 6) score += 20;
  else if (metrics.financial.revenueByMonth.length >= 3) score += 10;
  if (metrics.financial.totalRevenue > 0) score += 10;
  if (metrics.financial.cashOnHand > 0) score += 10;

  // Team data quality (20 points)
  if (metrics.team.totalMembers > 0) score += 10;
  if (metrics.team.completionRate > 0) score += 10;

  // CRM data quality (20 points)
  if (metrics.crm.totalLeads >= 10) score += 10;
  else if (metrics.crm.totalLeads > 0) score += 5;
  if (metrics.crm.conversionRate > 0) score += 10;

  // Products data quality (10 points)
  if (metrics.products.totalProducts > 0) score += 10;

  // OKRs data quality (10 points)
  if (metrics.okrs.totalObjectives > 0) score += 10;

  return Math.min(100, score);
}

function generateComprehensiveFallback(
  organization: Record<string, unknown>,
  metrics: CalculatedMetrics,
  competitors: Record<string, unknown>[],
  countryData: Record<string, unknown> | null
): Record<string, unknown> {
  const orgName = (organization as { name?: string }).name || 'Tu Empresa';
  const industry = (organization as { industry?: string }).industry || 'General';

  const overallScore = Math.min(100, Math.max(20, 
    (metrics.financial.profitMargin > 20 ? 30 : metrics.financial.profitMargin > 0 ? 20 : 10) +
    (metrics.team.completionRate > 70 ? 25 : metrics.team.completionRate > 40 ? 15 : 10) +
    (metrics.crm.conversionRate > 20 ? 25 : metrics.crm.conversionRate > 10 ? 15 : 10) +
    (metrics.okrs.avgProgress > 50 ? 20 : metrics.okrs.avgProgress > 25 ? 10 : 5)
  ));

  return {
    executive_dashboard: {
      overall_score: overallScore,
      health_status: overallScore >= 70 ? 'good' : overallScore >= 40 ? 'warning' : 'critical',
      summary: `${orgName} muestra un desempeño ${overallScore >= 70 ? 'sólido' : overallScore >= 40 ? 'moderado con áreas de mejora' : 'que requiere atención urgente'}. Con ingresos de €${metrics.financial.totalRevenue.toLocaleString()} y un margen del ${metrics.financial.profitMargin.toFixed(1)}%, ${overallScore >= 50 ? 'hay una base para el crecimiento' : 'se necesitan ajustes estratégicos'}.`,
      key_metrics: {
        revenue_trend: metrics.financial.revenueGrowth,
        efficiency_score: Math.min(100, metrics.financial.profitMargin * 2 + 30),
        team_performance: metrics.team.completionRate,
        customer_satisfaction: Math.min(100, metrics.crm.conversionRate * 3 + 40)
      },
      comparison_last_period: {
        revenue_change: metrics.financial.revenueGrowth,
        profit_change: metrics.financial.revenueGrowth * 0.8,
        team_productivity_change: 5,
        customer_growth: metrics.crm.conversionRate > 15 ? 10 : 0
      }
    },
    financial_health: {
      score: Math.min(100, metrics.financial.profitMargin * 2 + 40),
      status: metrics.financial.profitMargin > 20 ? 'good' : metrics.financial.profitMargin > 0 ? 'warning' : 'critical',
      metrics: {
        monthly_revenue: metrics.financial.avgMonthlyRevenue,
        monthly_expenses: metrics.financial.avgMonthlyExpenses,
        profit_margin: metrics.financial.profitMargin,
        burn_rate: metrics.financial.burnRate,
        runway_months: metrics.financial.runwayMonths,
        cash_balance: metrics.financial.cashOnHand,
        revenue_per_employee: metrics.team.totalMembers > 0 ? metrics.financial.avgMonthlyRevenue / metrics.team.totalMembers : 0,
        operating_efficiency: Math.min(100, metrics.financial.profitMargin + 50)
      },
      trends: {
        revenue_growth: metrics.financial.revenueGrowth,
        expense_growth: 5,
        margin_trend: metrics.financial.revenueGrowth > 0 ? 'improving' : 'stable',
        cash_flow_trend: metrics.financial.netProfit > 0 ? 'improving' : 'declining'
      },
      insights: [
        `Ingresos totales de €${metrics.financial.totalRevenue.toLocaleString()} en los últimos 6 meses`,
        `Margen de beneficio del ${metrics.financial.profitMargin.toFixed(1)}%`,
        metrics.financial.runwayMonths > 12 ? 'Runway financiero saludable' : 'Considerar optimización de costos'
      ],
      recommendations: [
        metrics.financial.profitMargin < 20 ? 'Revisar estructura de costos para mejorar márgenes' : 'Mantener eficiencia operativa actual',
        'Diversificar fuentes de ingresos',
        'Establecer reserva de emergencia de 3 meses'
      ],
      warning_signs: metrics.financial.profitMargin < 10 ? ['Márgenes por debajo del promedio de la industria'] : [],
      charts: {
        revenue_vs_expenses: metrics.financial.revenueByMonth,
        margin_evolution: metrics.financial.revenueByMonth.map(m => ({
          month: m.month,
          margin: m.revenue > 0 ? ((m.revenue - m.expenses) / m.revenue * 100) : 0
        })),
        burn_rate_projection: [],
        cash_runway: []
      }
    },
    growth_analysis: {
      current_stage: metrics.team.totalMembers <= 5 ? 'startup' : metrics.team.totalMembers <= 20 ? 'growth' : 'scale',
      growth_rate: metrics.financial.revenueGrowth > 20 ? 'fast' : metrics.financial.revenueGrowth > 5 ? 'moderate' : 'slow',
      growth_score: Math.min(100, 40 + metrics.financial.revenueGrowth + metrics.crm.conversionRate),
      metrics: {
        customer_acquisition: Math.round(metrics.crm.wonLeads / 6),
        retention_rate: 75,
        expansion_revenue: 10,
        market_penetration: 5,
        monthly_growth_rate: metrics.financial.revenueGrowth / 6,
        customer_lifetime_value: metrics.crm.avgDealSize * 12,
        customer_acquisition_cost: metrics.crm.avgDealSize * 0.3
      },
      bottlenecks: [
        {
          area: 'Ventas',
          severity: metrics.crm.conversionRate < 15 ? 'high' : 'medium',
          description: 'Tasa de conversión por debajo del potencial',
          impact: 'Pérdida de oportunidades de venta',
          solution: 'Optimizar proceso de ventas y seguimiento',
          estimated_resolution_time: '2-3 meses'
        }
      ],
      opportunities: [
        {
          title: 'Expansión de mercado',
          description: `Oportunidad de crecimiento en el sector ${industry}`,
          potential_impact: 'high',
          effort_required: 'medium',
          timeline: '6 meses',
          expected_roi: '150%',
          dependencies: ['Recursos de marketing', 'Capacidad operativa']
        }
      ],
      competitive_advantages: competitors.length > 0 
        ? ['Conocimiento del mercado local', 'Relación con clientes existentes']
        : ['Agilidad como empresa pequeña', 'Capacidad de personalización'],
      market_threats: ['Competencia establecida', 'Cambios regulatorios'],
      charts: {
        customer_growth: [],
        revenue_by_product: metrics.products.productPerformance.map(p => ({ name: p.name, revenue: p.revenue })),
        market_share_evolution: [],
        churn_analysis: []
      }
    },
    team_performance: {
      overall_score: metrics.team.completionRate,
      productivity_trend: 'stable',
      team_metrics: {
        total_members: metrics.team.totalMembers,
        active_members: metrics.team.activeMembers,
        avg_tasks_per_member: metrics.team.avgTasksPerMember,
        completion_rate: metrics.team.completionRate,
        collaboration_score: 70,
        innovation_score: 60,
        retention_rate: 85
      },
      individual_performance: metrics.team.memberPerformance.map(m => ({
        user_id: '',
        user_name: m.name,
        role: m.role,
        performance_score: m.score,
        strengths: ['Compromiso', 'Puntualidad'],
        areas_to_improve: ['Comunicación proactiva'],
        task_completion_rate: m.score,
        impact_rating: m.score >= 70 ? 'high' : 'medium',
        burnout_risk: 'low',
        personalized_advice: `Continuar con el buen trabajo y buscar oportunidades de desarrollo en ${m.role}`,
        recent_achievements: [`${m.tasksCompleted} tareas completadas`],
        collaboration_score: 75
      })),
      bottlenecks: [],
      star_performers: metrics.team.memberPerformance.filter(m => m.score >= 80).map(m => m.name),
      at_risk_members: [],
      team_health_indicators: {
        workload_balance: 70,
        communication_quality: 75,
        goal_alignment: 80,
        morale: 75
      },
      charts: {
        productivity_by_member: metrics.team.memberPerformance.map(m => ({ name: m.name, productivity: m.score })),
        task_distribution: metrics.team.memberPerformance.map(m => ({ name: m.name, tasks: m.tasksCompleted })),
        completion_rates: [],
        team_velocity: []
      }
    },
    strategic_priorities: {
      high_impact_low_effort: [
        {
          id: '1',
          title: 'Optimizar proceso de seguimiento de leads',
          description: 'Implementar sistema de follow-up automatizado',
          impact: 'high',
          effort: 'low',
          timeline: '2 semanas',
          expected_outcome: 'Incremento del 20% en conversiones',
          priority_score: 90
        }
      ],
      high_impact_high_effort: [
        {
          id: '2',
          title: 'Expansión de capacidad operativa',
          description: 'Contratar y formar nuevo personal',
          impact: 'high',
          effort: 'high',
          timeline: '3 meses',
          expected_outcome: 'Duplicar capacidad de servicio',
          priority_score: 75
        }
      ],
      low_impact_low_effort: [],
      low_impact_high_effort: [],
      recommended_focus: [
        'Mejorar conversión de leads',
        'Optimizar márgenes operativos',
        'Desarrollar equipo existente'
      ],
      initiatives_to_stop: ['Actividades que no generan ROI medible']
    },
    strategic_questions: {
      focus_questions: [
        {
          id: '1',
          question: '¿Cuál es tu principal diferenciador frente a la competencia?',
          category: 'strategy',
          why_important: 'Define tu posicionamiento de mercado',
          current_situation: 'Necesita clarificación',
          suggested_approach: 'Análisis de propuesta de valor única',
          deadline: 'this_month',
          consequences_if_ignored: 'Pérdida de diferenciación'
        }
      ],
      money_questions: [],
      team_questions: [],
      market_questions: [],
      product_questions: []
    },
    future_roadmap: {
      next_30_days: [
        {
          id: '1',
          title: 'Revisar y optimizar proceso de ventas',
          priority: 'high',
          description: 'Analizar el funnel actual y eliminar fricción',
          estimated_impact: '+15% conversión',
          action_items: ['Mapear proceso actual', 'Identificar cuellos de botella', 'Implementar mejoras'],
          dependencies: []
        }
      ],
      next_90_days: [
        {
          id: '2',
          title: 'Lanzar campaña de adquisición',
          priority: 'high',
          description: 'Expandir base de clientes',
          estimated_impact: '+30% leads',
          action_items: ['Definir audiencia', 'Crear contenido', 'Activar canales'],
          dependencies: ['Presupuesto de marketing']
        }
      ],
      next_year: [],
      scaling_plan: {
        current_capacity: `${metrics.team.totalMembers} personas, €${metrics.financial.avgMonthlyRevenue.toLocaleString()}/mes`,
        target_capacity: `${Math.ceil(metrics.team.totalMembers * 1.5)} personas, €${Math.round(metrics.financial.avgMonthlyRevenue * 2).toLocaleString()}/mes`,
        bottlenecks_for_scale: ['Capacidad del equipo', 'Procesos manuales'],
        required_investments: [],
        hiring_plan: [],
        infrastructure_needs: ['Automatización de procesos', 'CRM avanzado'],
        timeline_to_scale: '12-18 meses'
      }
    },
    projections: {
      next_month: {
        period: 'Próximo Mes',
        revenue: Math.round(metrics.financial.avgMonthlyRevenue * 1.05),
        expenses: Math.round(metrics.financial.avgMonthlyExpenses * 1.02),
        net_profit: Math.round((metrics.financial.avgMonthlyRevenue * 1.05) - (metrics.financial.avgMonthlyExpenses * 1.02)),
        team_size: metrics.team.totalMembers,
        customers: metrics.crm.wonLeads + 2,
        confidence: 80
      },
      next_quarter: {
        period: 'Próximo Trimestre',
        revenue: Math.round(metrics.financial.avgMonthlyRevenue * 3.2),
        expenses: Math.round(metrics.financial.avgMonthlyExpenses * 3.1),
        net_profit: Math.round((metrics.financial.avgMonthlyRevenue * 3.2) - (metrics.financial.avgMonthlyExpenses * 3.1)),
        team_size: metrics.team.totalMembers,
        customers: metrics.crm.wonLeads + 8,
        confidence: 70
      },
      next_year: {
        period: 'Próximo Año',
        revenue: Math.round(metrics.financial.avgMonthlyRevenue * 14),
        expenses: Math.round(metrics.financial.avgMonthlyExpenses * 13),
        net_profit: Math.round((metrics.financial.avgMonthlyRevenue * 14) - (metrics.financial.avgMonthlyExpenses * 13)),
        team_size: Math.ceil(metrics.team.totalMembers * 1.3),
        customers: metrics.crm.wonLeads + 40,
        confidence: 50
      },
      scenarios: [],
      key_assumptions: ['Crecimiento constante', 'Sin cambios mayores en el mercado'],
      risk_factors: ['Competencia intensificada', 'Cambios económicos'],
      charts: {
        revenue_projection: [],
        team_growth_projection: [],
        cash_runway_projection: [],
        customer_projection: []
      }
    },
    critical_alerts: metrics.financial.runwayMonths < 6 ? [
      {
        id: '1',
        severity: 'high',
        category: 'financial',
        title: 'Runway limitado',
        description: `Solo ${metrics.financial.runwayMonths} meses de runway disponible`,
        impact: 'Riesgo de liquidez',
        recommended_action: 'Buscar financiación o reducir costos',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        auto_resolve: false
      }
    ] : [],
    honest_feedback: {
      overall_assessment: `${orgName} está en una posición ${overallScore >= 60 ? 'favorable' : 'que requiere ajustes'} con oportunidades claras de mejora en ${metrics.financial.profitMargin < 15 ? 'rentabilidad' : metrics.crm.conversionRate < 15 ? 'conversión de ventas' : 'escalabilidad'}.`,
      what_is_working: [
        metrics.team.completionRate > 60 ? 'Ejecución del equipo' : null,
        metrics.financial.netProfit > 0 ? 'Modelo de negocio rentable' : null,
        metrics.crm.totalLeads > 20 ? 'Generación de leads' : null
      ].filter(Boolean) as string[],
      what_is_not_working: [
        metrics.crm.conversionRate < 15 ? 'Tasa de conversión de leads' : null,
        metrics.financial.profitMargin < 10 ? 'Márgenes de beneficio' : null
      ].filter(Boolean) as string[],
      hard_truths: [
        'El crecimiento sostenible requiere inversión en procesos',
        'Sin datos históricos suficientes, las proyecciones tienen alto margen de error'
      ],
      tough_decisions: [],
      competitive_position: {
        strengths: ['Agilidad', 'Conocimiento del cliente'],
        weaknesses: ['Recursos limitados', 'Marca en desarrollo'],
        threats: ['Competidores con más recursos'],
        opportunities: ['Nichos desatendidos', 'Tendencias digitales']
      },
      existential_risks: metrics.financial.runwayMonths < 3 ? ['Falta de liquidez'] : [],
      blind_spots: ['Dependencia de pocos clientes', 'Falta de diversificación']
    },
    benchmarking: {
      industry_avg: {
        revenue_growth: 15,
        profit_margin: 18,
        cac: 500,
        ltv: 5000,
        churn_rate: 5,
        team_productivity: 75
      },
      your_position: {
        revenue_growth: metrics.financial.revenueGrowth,
        profit_margin: metrics.financial.profitMargin,
        cac: metrics.crm.avgDealSize * 0.3,
        ltv: metrics.crm.avgDealSize * 12,
        churn_rate: 8,
        team_productivity: metrics.team.completionRate
      },
      percentile_rank: Math.min(100, Math.max(10, overallScore - 10)),
      gaps: [
        {
          metric: 'Margen de beneficio',
          gap: `${(18 - metrics.financial.profitMargin).toFixed(1)}%`,
          improvement_needed: 'Optimizar costos operativos',
          priority: metrics.financial.profitMargin < 10 ? 'critical' : 'medium'
        }
      ],
      peer_comparison: `En comparación con empresas similares en ${industry}, ${orgName} está ${overallScore >= 60 ? 'por encima' : 'por debajo'} del promedio.`
    },
    market_study: {
      market_size: countryData ? `€${(((countryData as { gdp_per_capita?: number }).gdp_per_capita || 30000) * 0.001).toFixed(0)}M` : 'No disponible',
      market_growth_rate: '8%',
      market_maturity: 'growing',
      competitive_intensity: competitors.length > 3 ? 'high' : 'medium',
      key_trends: [
        'Digitalización acelerada',
        'Mayor demanda de personalización',
        'Sostenibilidad como factor de compra'
      ],
      regulatory_factors: countryData ? [`Regulación de ${(countryData as { data_privacy_law?: string }).data_privacy_law || 'protección de datos'}`] : [],
      entry_barriers: 'medium',
      positioning_recommendation: `Posicionamiento como solución especializada en ${industry} con enfoque en calidad y servicio personalizado`,
      target_segments: [],
      competitive_matrix: competitors.map(c => ({
        competitor: (c as { name?: string }).name || 'Competidor',
        market_share: 10,
        strengths: (c as { strengths?: string[] }).strengths || [],
        weaknesses: (c as { weaknesses?: string[] }).weaknesses || [],
        threat_level: 'medium' as const
      })),
      swot_analysis: {
        strengths: ['Agilidad operativa', 'Conocimiento del cliente local'],
        weaknesses: ['Recursos limitados', 'Marca en desarrollo'],
        opportunities: ['Crecimiento del mercado', 'Tendencias digitales'],
        threats: ['Competencia establecida', 'Presión de precios']
      },
      market_entry_strategy: 'Diferenciación por calidad de servicio y especialización',
      pricing_analysis: {
        current_position: 'mid-market',
        recommended_position: 'mid-market',
        price_elasticity: 'medium',
        pricing_recommendations: ['Considerar modelo de valor añadido', 'Explorar pricing por resultados']
      }
    }
  };
}