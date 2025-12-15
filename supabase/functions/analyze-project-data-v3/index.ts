import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withRateLimit, rateLimitResponse } from "../_shared/rateLimiter.ts";
import { createLogger, extractRequestInfo } from "../_shared/structuredLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const logger = createLogger('analyze-project-data-v3');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId, includeCompetitors = false } = await req.json();
    
    // Set logger context
    logger.setContext({ organizationId });
    logger.info('analysis_started', { 
      includeCompetitors,
      ...extractRequestInfo(req)
    });

    if (!organizationId) {
      logger.warn('missing_organization_id');
      return new Response(
        JSON.stringify({ error: 'organizationId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: 5 requests per minute per organization
    const rateLimit = withRateLimit(organizationId, 'analyze-project-data-v3', {
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

    // Fetch organization data
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      logger.error('organization_not_found', orgError);
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch financial data
    const { data: revenueData } = await supabase
      .from('revenue_entries')
      .select('*')
      .eq('organization_id', organizationId)
      .order('date', { ascending: false })
      .limit(100);

    const { data: expenseData } = await supabase
      .from('expense_entries')
      .select('*')
      .eq('organization_id', organizationId)
      .order('date', { ascending: false })
      .limit(100);

    // Fetch team data
    const { data: teamMembers } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        role,
        users:user_id (
          full_name,
          email
        )
      `)
      .eq('organization_id', organizationId);

    // Fetch leads/CRM data
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(100);

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
      .limit(30);

    // Fetch competitors if requested
    let competitors = null;
    if (includeCompetitors) {
      const { data: competitorData } = await supabase
        .from('competitors')
        .select('*')
        .eq('organization_id', organizationId);
      competitors = competitorData;
    }

    // Build AI prompt
    const prompt = buildAnalysisPrompt({
      organization,
      revenueData: revenueData || [],
      expenseData: expenseData || [],
      teamMembers: teamMembers || [],
      leads: leads || [],
      objectives: objectives || [],
      businessMetrics: businessMetrics || [],
      competitors: competitors || [],
      includeCompetitors
    });

    logger.info('calling_ai_gateway');

    // Call Lovable AI Gateway
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
            content: 'Eres un analista de negocios experto. Proporciona análisis en español. Responde SOLO con JSON válido, sin markdown, sin explicaciones adicionales.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logger.error('ai_gateway_error', new Error(errorText), { status: aiResponse.status });
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const aiContent = aiResult.choices?.[0]?.message?.content || '';

    logger.info('ai_response_received', { contentLength: aiContent.length });

    // Parse AI response
    let analysisData;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = aiContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      analysisData = JSON.parse(cleanedContent);
    } catch (parseError) {
      logger.error('ai_response_parse_error', parseError, { rawContentPreview: aiContent.slice(0, 200) });
      // Return a structured fallback
      analysisData = generateFallbackAnalysis(organization, revenueData || [], expenseData || [], leads || [], competitors || []);
    }

    // Store analysis result in database using the existing analysis_data column
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('ai_analysis_results')
      .insert({
        organization_id: organizationId,
        analysis_data: analysisData,
        generated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (saveError) {
      logger.error('save_analysis_error', saveError);
      // Still return the analysis even if save fails
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
        analysis: analysisData,
        savedId: savedAnalysis?.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    logger.error('analysis_failed', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

interface AnalysisInput {
  organization: any;
  revenueData: any[];
  expenseData: any[];
  teamMembers: any[];
  leads: any[];
  objectives: any[];
  businessMetrics: any[];
  competitors: any[];
  includeCompetitors: boolean;
}

function buildAnalysisPrompt(input: AnalysisInput): string {
  const {
    organization,
    revenueData,
    expenseData,
    teamMembers,
    leads,
    objectives,
    businessMetrics,
    competitors,
    includeCompetitors
  } = input;

  // Calculate key metrics
  const totalRevenue = revenueData.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalExpenses = expenseData.reduce((sum, e) => sum + (e.amount || 0), 0);
  const margin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(1) : 0;
  
  const wonLeads = leads.filter(l => l.stage === 'won' || l.pipeline_stage === 'closed_won').length;
  const totalLeads = leads.length;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;

  let competitorSection = '';
  if (includeCompetitors && competitors.length > 0) {
    competitorSection = `
COMPETIDORES REGISTRADOS:
${competitors.map(c => `- ${c.name}: ${c.description || 'Sin descripción'}
  Fortalezas: ${c.strengths?.join(', ') || 'No especificadas'}
  Debilidades: ${c.weaknesses?.join(', ') || 'No especificadas'}
  Posición: ${c.market_position || 'Desconocida'}`).join('\n')}

Incluye en tu análisis una sección "competitive_analysis" con:
- positioning: posicionamiento recomendado
- threats: amenazas identificadas
- opportunities: oportunidades vs competencia
- differentiation: estrategias de diferenciación`;
  }

  return `Analiza los siguientes datos empresariales y genera un análisis estratégico completo.

EMPRESA: ${organization.name}
INDUSTRIA: ${organization.industry}
TAMAÑO: ${organization.company_size}
DESCRIPCIÓN: ${organization.business_description}

MÉTRICAS FINANCIERAS:
- Ingresos totales: €${totalRevenue.toLocaleString()}
- Gastos totales: €${totalExpenses.toLocaleString()}
- Margen: ${margin}%
- Transacciones de ingresos: ${revenueData.length}
- Transacciones de gastos: ${expenseData.length}

MÉTRICAS CRM:
- Total leads: ${totalLeads}
- Leads ganados: ${wonLeads}
- Tasa de conversión: ${conversionRate}%
- Pipeline value: €${leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0).toLocaleString()}

EQUIPO:
- Miembros: ${teamMembers.length}
- Roles: ${teamMembers.map(t => t.role).join(', ')}

OKRs ACTIVOS: ${objectives.length}
${competitorSection}

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:

{
  "executive_summary": {
    "overall_health": "good|warning|critical",
    "key_insight": "insight principal en una oración",
    "immediate_action": "acción más urgente"
  },
  "financial_health": {
    "status": "healthy|warning|critical",
    "score": 75,
    "metrics": {
      "revenue_trend": "growing|stable|declining",
      "margin_status": "healthy|tight|negative",
      "burn_rate": "sustainable|concerning|critical"
    },
    "insights": ["insight 1", "insight 2"],
    "recommendations": ["recomendación 1", "recomendación 2"]
  },
  "team_performance": {
    "overall_score": 80,
    "highlights": ["logro 1", "logro 2"],
    "areas_of_improvement": ["área 1", "área 2"],
    "recommendations": ["recomendación 1"]
  },
  "honest_feedback": {
    "tough_truths": ["verdad difícil 1", "verdad difícil 2"],
    "hidden_opportunities": ["oportunidad 1", "oportunidad 2"],
    "risk_factors": ["riesgo 1", "riesgo 2"]
  },
  "action_items": [
    {
      "priority": "high|medium|low",
      "title": "título de la acción",
      "description": "descripción detallada",
      "impact": "impacto esperado",
      "timeframe": "esta semana|este mes|este trimestre"
    }
  ],
  "growth_projections": {
    "scenario_optimistic": { "revenue_growth": 25, "description": "descripción" },
    "scenario_realistic": { "revenue_growth": 15, "description": "descripción" },
    "scenario_conservative": { "revenue_growth": 5, "description": "descripción" }
  }${includeCompetitors && competitors.length > 0 ? `,
  "competitive_analysis": {
    "positioning": "recomendación de posicionamiento",
    "threats": ["amenaza 1", "amenaza 2"],
    "opportunities": ["oportunidad 1", "oportunidad 2"],
    "differentiation": ["estrategia 1", "estrategia 2"]
  }` : ''}
}`;
}

function generateFallbackAnalysis(
  organization: any,
  revenueData: any[],
  expenseData: any[],
  leads: any[],
  competitors: any[] | null
): any {
  const totalRevenue = revenueData.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalExpenses = expenseData.reduce((sum, e) => sum + (e.amount || 0), 0);
  const margin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100) : 0;

  const baseAnalysis: any = {
    executive_summary: {
      overall_health: margin > 20 ? 'good' : margin > 0 ? 'warning' : 'critical',
      key_insight: `${organization.name} tiene un margen del ${margin.toFixed(1)}%`,
      immediate_action: margin < 20 ? 'Revisar estructura de costos' : 'Mantener crecimiento actual'
    },
    financial_health: {
      status: margin > 20 ? 'healthy' : margin > 0 ? 'warning' : 'critical',
      score: Math.min(100, Math.max(0, margin * 2 + 50)),
      metrics: {
        revenue_trend: revenueData.length > 5 ? 'stable' : 'needs_data',
        margin_status: margin > 20 ? 'healthy' : margin > 0 ? 'tight' : 'negative',
        burn_rate: 'sustainable'
      },
      insights: [
        `Ingresos totales: €${totalRevenue.toLocaleString()}`,
        `Gastos totales: €${totalExpenses.toLocaleString()}`
      ],
      recommendations: [
        'Registrar más datos financieros para mejor análisis',
        'Establecer metas de margen mensual'
      ]
    },
    team_performance: {
      overall_score: 70,
      highlights: ['Equipo en funcionamiento'],
      areas_of_improvement: ['Necesita más datos de rendimiento'],
      recommendations: ['Implementar seguimiento de tareas']
    },
    honest_feedback: {
      tough_truths: ['Se necesitan más datos para un análisis profundo'],
      hidden_opportunities: ['Potencial de crecimiento en pipeline'],
      risk_factors: ['Falta de datos históricos']
    },
    action_items: [
      {
        priority: 'high',
        title: 'Completar datos financieros',
        description: 'Registrar ingresos y gastos de los últimos 3 meses',
        impact: 'Mejor visibilidad financiera',
        timeframe: 'esta semana'
      }
    ],
    growth_projections: {
      scenario_optimistic: { revenue_growth: 25, description: 'Con mejoras en conversión' },
      scenario_realistic: { revenue_growth: 15, description: 'Manteniendo tendencias actuales' },
      scenario_conservative: { revenue_growth: 5, description: 'Crecimiento mínimo' }
    }
  };

  if (competitors && competitors.length > 0) {
    baseAnalysis.competitive_analysis = {
      positioning: 'Definir propuesta de valor única',
      threats: competitors.map(c => `Competencia de ${c.name}`).slice(0, 2),
      opportunities: ['Diferenciación por servicio', 'Nicho de mercado'],
      differentiation: ['Mejorar experiencia del cliente', 'Especialización']
    };
  }

  return baseAnalysis;
}
