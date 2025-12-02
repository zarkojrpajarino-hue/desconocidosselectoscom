// ============================================
// EDGE FUNCTION: ANÁLISIS IA V2.0 CON LOVABLE AI
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalysisRequest {
  organization_id: string;
  user_id: string;
  data_period?: {
    start_date: string;
    end_date: string;
  };
}

// ============================================
// PROMPT ESTRUCTURADO PARA LOVABLE AI (GEMINI)
// ============================================

const STRUCTURED_ANALYSIS_PROMPT = `
Eres un consultor empresarial experto y analista de datos con 20 años de experiencia. Tu trabajo es analizar una empresa de manera EXHAUSTIVA, HONESTA y ACCIONABLE.

**DATOS DE LA EMPRESA:**
{COMPANY_DATA}

**TU TAREA:**
Analiza estos datos y proporciona un análisis completo en formato JSON válido. Debes ser:
- ✅ SINCERO: Di las verdades duras, no suavices nada
- ✅ ESPECÍFICO: Usa números reales de los datos proporcionados
- ✅ ACCIONABLE: Cada insight debe tener una acción concreta
- ✅ PREDICTIVO: Usa los datos históricos para proyectar el futuro

**ESTRUCTURA JSON REQUERIDA:**

Responde SOLO con el JSON válido, sin texto adicional, sin markdown. La estructura debe ser:

{
  "executive_dashboard": {
    "overall_score": <número 0-100>,
    "health_status": "<excellent|good|warning|critical>",
    "summary": "<2-3 frases resumiendo el estado general>",
    "key_metrics": {
      "revenue_trend": <% cambio>,
      "efficiency_score": <0-100>,
      "team_performance": <0-100>,
      "customer_satisfaction": <0-100>
    },
    "comparison_last_period": {
      "revenue_change": <% cambio>,
      "profit_change": <% cambio>,
      "team_productivity_change": <% cambio>,
      "customer_growth": <% cambio>
    }
  },
  
  "financial_health": {
    "score": <0-100>,
    "status": "<healthy|warning|critical>",
    "metrics": {
      "monthly_revenue": <número>,
      "monthly_expenses": <número>,
      "profit_margin": <% número>,
      "burn_rate": <número>,
      "runway_months": <número>,
      "cash_balance": <número>,
      "revenue_per_employee": <número>,
      "operating_efficiency": <% número>
    },
    "trends": {
      "revenue_growth": <% último mes>,
      "expense_growth": <% último mes>,
      "margin_trend": "<improving|stable|declining>",
      "cash_flow_trend": "<improving|stable|declining>"
    },
    "insights": ["<insight específico con números>"],
    "recommendations": ["<recomendación accionable específica>"],
    "warning_signs": ["<señal de alarma específica si existe>"],
    "charts": {
      "revenue_vs_expenses": [{"month": "Ene 2025", "revenue": 1000, "expenses": 800, "margin": 200}],
      "margin_evolution": [{"month": "Ene 2025", "margin": 20}],
      "burn_rate_projection": [{"month": "Ene 2025", "burn_rate": 800}],
      "cash_runway": [{"month": "Ene 2025", "cash": 50000}]
    }
  },

  "growth_analysis": {
    "current_stage": "<startup|growth|scale|mature>",
    "growth_rate": "<fast|moderate|slow|negative>",
    "growth_score": <0-100>,
    "metrics": {
      "customer_acquisition": <número/mes>,
      "retention_rate": <% número>,
      "expansion_revenue": <número>,
      "market_penetration": <% número>,
      "monthly_growth_rate": <% número>,
      "customer_lifetime_value": <número>,
      "customer_acquisition_cost": <número>
    },
    "bottlenecks": [{
      "area": "<área>",
      "severity": "<critical|high|medium|low>",
      "description": "<descripción>",
      "impact": "<impacto con números>",
      "solution": "<solución>",
      "estimated_resolution_time": "<tiempo>"
    }],
    "opportunities": [{
      "title": "<título>",
      "description": "<descripción>",
      "potential_impact": "<high|medium|low>",
      "effort_required": "<high|medium|low>",
      "timeline": "<timeline>",
      "expected_roi": "<ROI>",
      "dependencies": []
    }],
    "competitive_advantages": [],
    "market_threats": [],
    "charts": {
      "customer_growth": [{"month": "Ene", "customers": 100, "new": 20, "churned": 5}],
      "revenue_by_product": [{"product": "Producto A", "revenue": 5000, "percentage": 50}],
      "market_share_evolution": [{"month": "Ene", "market_share": 15}],
      "churn_analysis": [{"month": "Ene", "churn_rate": 5}]
    }
  },

  "team_performance": {
    "overall_score": <0-100>,
    "productivity_trend": "<increasing|stable|decreasing>",
    "team_metrics": {
      "total_members": <número>,
      "active_members": <número>,
      "avg_tasks_per_member": <número>,
      "completion_rate": <% número>,
      "collaboration_score": <0-100>,
      "innovation_score": <0-100>,
      "retention_rate": <% número>
    },
    "individual_performance": [{
      "user_id": "<id>",
      "user_name": "<nombre>",
      "role": "<rol>",
      "performance_score": <0-100>,
      "strengths": ["<fortaleza>"],
      "areas_to_improve": ["<área>"],
      "task_completion_rate": <% número>,
      "impact_rating": "<high|medium|low>",
      "burnout_risk": "<high|medium|low>",
      "personalized_advice": "<consejo personalizado>",
      "recent_achievements": [],
      "collaboration_score": <0-100>
    }],
    "bottlenecks": [],
    "star_performers": [],
    "at_risk_members": [],
    "team_health_indicators": {
      "workload_balance": <0-100>,
      "communication_quality": <0-100>,
      "goal_alignment": <0-100>,
      "morale": <0-100>
    },
    "charts": {
      "productivity_by_member": [{"name": "Nombre", "score": 85, "tasks": 12}],
      "task_distribution": [{"name": "Nombre", "tasks": 10, "completed": 8, "pending": 2}],
      "completion_rates": [{"week": "Sem 1", "rate": 80}],
      "team_velocity": [{"week": "Sem 1", "velocity": 15}]
    }
  },

  "strategic_priorities": {
    "high_impact_low_effort": [{
      "id": "<uuid>",
      "title": "<título>",
      "description": "<descripción>",
      "impact": "high",
      "effort": "low",
      "timeline": "<timeline>",
      "expected_outcome": "<outcome>",
      "priority_score": <1-100>
    }],
    "high_impact_high_effort": [],
    "low_impact_low_effort": [],
    "low_impact_high_effort": [],
    "recommended_focus": [],
    "initiatives_to_stop": []
  },

  "strategic_questions": {
    "focus_questions": [{
      "id": "<uuid>",
      "question": "<pregunta>",
      "category": "<strategy|product|market|operations>",
      "why_important": "<explicación>",
      "current_situation": "<situación con datos>",
      "suggested_approach": "<enfoque paso a paso>",
      "deadline": "<urgent|this_week|this_month|this_quarter>",
      "consequences_if_ignored": "<consecuencias>"
    }],
    "money_questions": [],
    "team_questions": [],
    "market_questions": [],
    "product_questions": []
  },

  "future_roadmap": {
    "next_30_days": [{
      "id": "<uuid>",
      "title": "<título>",
      "priority": "<critical|high|medium|low>",
      "description": "<descripción>",
      "estimated_impact": "<impacto>",
      "action_items": [],
      "dependencies": []
    }],
    "next_90_days": [],
    "next_year": [],
    "scaling_plan": {
      "current_capacity": "<capacidad>",
      "target_capacity": "<objetivo>",
      "bottlenecks_for_scale": [],
      "required_investments": [{
        "area": "<área>",
        "amount": "<cantidad>",
        "expected_return": "<retorno>",
        "timeline": "<timeline>",
        "roi_percentage": <número>,
        "risk_level": "<high|medium|low>"
      }],
      "hiring_plan": [{
        "role": "<rol>",
        "when": "<cuándo>",
        "why": "<por qué>",
        "priority": "<critical|high|medium|low>",
        "estimated_cost": "<coste>",
        "expected_impact": "<impacto>"
      }],
      "infrastructure_needs": [],
      "timeline_to_scale": "<timeline>"
    }
  },

  "projections": {
    "next_month": {
      "period": "Próximo mes",
      "revenue": <número>,
      "expenses": <número>,
      "net_profit": <número>,
      "team_size": <número>,
      "customers": <número>,
      "confidence": <0-100>
    },
    "next_quarter": {
      "period": "Próximo trimestre",
      "revenue": <número>,
      "expenses": <número>,
      "net_profit": <número>,
      "team_size": <número>,
      "customers": <número>,
      "confidence": <0-100>
    },
    "next_year": {
      "period": "Próximo año",
      "revenue": <número>,
      "expenses": <número>,
      "net_profit": <número>,
      "team_size": <número>,
      "customers": <número>,
      "confidence": <0-100>
    },
    "scenarios": [
      {
        "name": "Conservador",
        "description": "<descripción>",
        "assumptions": [],
        "projected_revenue": <número>,
        "projected_expenses": <número>,
        "projected_team_size": <número>,
        "projected_customers": <número>,
        "probability": <0-100>,
        "risk_factors": []
      },
      {
        "name": "Realista",
        "description": "<descripción>",
        "assumptions": [],
        "projected_revenue": <número>,
        "projected_expenses": <número>,
        "projected_team_size": <número>,
        "projected_customers": <número>,
        "probability": <0-100>,
        "risk_factors": []
      },
      {
        "name": "Optimista",
        "description": "<descripción>",
        "assumptions": [],
        "projected_revenue": <número>,
        "projected_expenses": <número>,
        "projected_team_size": <número>,
        "projected_customers": <número>,
        "probability": <0-100>,
        "risk_factors": []
      }
    ],
    "key_assumptions": [],
    "risk_factors": [],
    "charts": {
      "revenue_projection": [{"month": "Ene", "conservative": 1000, "realistic": 1200, "optimistic": 1500}],
      "team_growth_projection": [{"month": "Ene", "team_size": 10}],
      "cash_runway_projection": [{"month": "Ene", "cash": 50000}],
      "customer_projection": [{"month": "Ene", "customers": 100}]
    }
  },

  "critical_alerts": [{
    "id": "<uuid>",
    "severity": "<critical|high|medium|low>",
    "category": "<financial|team|operations|market>",
    "title": "<título>",
    "description": "<descripción>",
    "impact": "<impacto>",
    "recommended_action": "<acción>",
    "deadline": "<fecha ISO>",
    "auto_resolve": false
  }],

  "honest_feedback": {
    "overall_assessment": "<evaluación general honesta de 3-4 frases>",
    "what_is_working": ["<cosa que funciona>"],
    "what_is_not_working": ["<cosa que NO funciona>"],
    "hard_truths": ["<verdad dura>"],
    "tough_decisions": [{
      "decision": "<decisión>",
      "why_necessary": "<por qué>",
      "consequences_if_not_done": "<consecuencias>",
      "consequences_if_done": "<consecuencias>",
      "recommendation": "<recomendación>",
      "difficulty": "<hard|very_hard|extremely_hard>",
      "estimated_timeline": "<timeline>",
      "success_probability": <0-100>
    }],
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
      "revenue_growth": 15,
      "profit_margin": 20,
      "cac": 500,
      "ltv": 2000,
      "churn_rate": 5,
      "team_productivity": 75
    },
    "your_position": {
      "revenue_growth": <número calculado>,
      "profit_margin": <número calculado>,
      "cac": <número calculado>,
      "ltv": <número calculado>,
      "churn_rate": <número calculado>,
      "team_productivity": <número calculado>
    },
    "percentile_rank": <0-100>,
    "gaps": [{
      "metric": "<métrica>",
      "gap": "<diferencia>",
      "improvement_needed": "<mejora>",
      "priority": "<critical|high|medium|low>"
    }],
    "peer_comparison": "<comparación>"
  },

  "confidence_score": <0-100>,
  "data_sources": ["tasks", "users", "objectives", "leads", "business_metrics", "financial_data"],
  "data_quality_score": <0-100>,
  "next_analysis_recommended": "<fecha ISO>",
  "version": "2.0"
}

**INSTRUCCIONES CRÍTICAS:**
1. NO uses texto fuera del JSON
2. NO uses markdown ni bloques de código
3. USA SOLO números reales de los datos proporcionados
4. SÉ específico y concreto en todas las recomendaciones
5. GENERA todos los campos requeridos de la estructura
6. USA fechas en formato ISO 8601
7. GENERA UUIDs únicos para cada item con id

**RESPONDE SOLO CON EL JSON VÁLIDO, NADA MÁS.**
`;

// ============================================
// FETCH COMPANY DATA
// ============================================

async function fetchCompanyData(supabase: any, organization_id: string, data_period?: any) {
  const endDate = data_period?.end_date || new Date().toISOString();
  const startDate = data_period?.start_date || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  console.log(`📊 Fetching data from ${startDate} to ${endDate}`);

  // Fetch all relevant data in parallel
  const [
    organization,
    users,
    tasks,
    taskCompletions,
    objectives,
    keyResults,
    leads,
    businessMetrics,
    revenueEntries,
    expenseEntries,
    financialMetrics,
    okrUpdates
  ] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', organization_id).single(),
    supabase.from('users').select('*').eq('organization_id', organization_id),
    supabase.from('tasks').select('*').eq('organization_id', organization_id),
    supabase.from('task_completions').select('*').eq('organization_id', organization_id).gte('completed_at', startDate).lte('completed_at', endDate),
    supabase.from('objectives').select('*').eq('organization_id', organization_id),
    supabase.from('key_results').select('*'),
    supabase.from('leads').select('*').eq('organization_id', organization_id),
    supabase.from('business_metrics').select('*').eq('organization_id', organization_id).gte('metric_date', startDate).lte('metric_date', endDate).order('metric_date', { ascending: false }),
    supabase.from('revenue_entries').select('*').eq('organization_id', organization_id).gte('date', startDate).lte('date', endDate),
    supabase.from('expense_entries').select('*').eq('organization_id', organization_id).gte('date', startDate).lte('date', endDate),
    supabase.from('financial_metrics').select('*').eq('organization_id', organization_id).order('month', { ascending: false }).limit(6),
    supabase.from('okr_updates').select('*').gte('created_at', startDate).lte('created_at', endDate)
  ]);

  console.log(`✅ Data fetched: ${users.data?.length || 0} users, ${tasks.data?.length || 0} tasks, ${leads.data?.length || 0} leads`);

  return {
    organization: organization.data,
    users: users.data || [],
    tasks: tasks.data || [],
    taskCompletions: taskCompletions.data || [],
    objectives: objectives.data || [],
    keyResults: keyResults.data || [],
    leads: leads.data || [],
    businessMetrics: businessMetrics.data || [],
    revenueEntries: revenueEntries.data || [],
    expenseEntries: expenseEntries.data || [],
    financialMetrics: financialMetrics.data || [],
    okrUpdates: okrUpdates.data || [],
    data_period: { start_date: startDate, end_date: endDate }
  };
}

// ============================================
// FORMAT DATA FOR PROMPT
// ============================================

function formatCompanyDataForPrompt(data: any): string {
  const totalRevenue = data.revenueEntries.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
  const totalExpenses = data.expenseEntries.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
  const completedTasks = data.taskCompletions.filter((tc: any) => tc.validated_by_leader).length;

  return `
**ORGANIZACIÓN:**
- Nombre: ${data.organization?.name || 'No disponible'}
- Plan: ${data.organization?.plan || 'trial'}
- Industria: ${data.organization?.industry || 'No especificada'}
- Tamaño: ${data.organization?.company_size || 'No especificado'}
- Miembros del equipo: ${data.users.length}
- Periodo de análisis: ${new Date(data.data_period.start_date).toLocaleDateString()} a ${new Date(data.data_period.end_date).toLocaleDateString()}

**USUARIOS DEL EQUIPO (${data.users.length} miembros):**
${data.users.map((u: any) => `
- ${u.full_name} (${u.role})
  - Email: ${u.email}
  - Tareas completadas: ${data.taskCompletions.filter((tc: any) => tc.user_id === u.id && tc.validated_by_leader).length}
`).join('')}

**TAREAS (${data.tasks.length} total, ${completedTasks} completadas y validadas):**
- Completadas y validadas: ${completedTasks}
- Tasa de completitud: ${data.tasks.length > 0 ? ((completedTasks / data.tasks.length) * 100).toFixed(1) : 0}%

Distribución por área:
${Object.entries(
  data.tasks.reduce((acc: any, task: any) => {
    const area = task.area || 'Sin área';
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {})
).map(([area, count]) => `- ${area}: ${count} tareas`).join('\n')}

**OBJETIVOS Y KEY RESULTS:**
- Total objetivos: ${data.objectives.length}
- Total KRs: ${data.keyResults.length}
- Actualizaciones de OKRs: ${data.okrUpdates.length}

${data.objectives.map((obj: any) => {
  const krs = data.keyResults.filter((kr: any) => kr.objective_id === obj.id);
  return `
- ${obj.title}
  - KRs vinculados: ${krs.length}
  - Estado: ${obj.status}
`;
}).join('')}

**LEADS Y CRM (${data.leads.length} leads):**
- Por etapa:
${Object.entries(
  data.leads.reduce((acc: any, lead: any) => {
    acc[lead.stage || 'lead'] = (acc[lead.stage || 'lead'] || 0) + 1;
    return acc;
  }, {})
).map(([stage, count]) => `  - ${stage}: ${count}`).join('\n')}
- Valor total estimado: €${data.leads.reduce((sum: number, lead: any) => sum + (lead.estimated_value || 0), 0).toLocaleString()}
- Leads ganados: ${data.leads.filter((l: any) => l.stage === 'won').length}
- Leads perdidos: ${data.leads.filter((l: any) => l.stage === 'lost').length}
- Tasa de conversión: ${data.leads.length > 0 ? ((data.leads.filter((l: any) => l.stage === 'won').length / data.leads.length) * 100).toFixed(1) : 0}%

**MÉTRICAS DE NEGOCIO (KPI's - ${data.businessMetrics.length} registros):**
${data.businessMetrics.length > 0 ? `
Últimas métricas (${new Date(data.businessMetrics[0]?.metric_date).toLocaleDateString()}):
- Revenue: €${data.businessMetrics[0]?.revenue?.toLocaleString() || 0}
- Pedidos: ${data.businessMetrics[0]?.orders_count || 0}
- Leads generados: ${data.businessMetrics[0]?.leads_generated || 0}
- Tasa de conversión: ${data.businessMetrics[0]?.conversion_rate || 0}%
- CAC: €${data.businessMetrics[0]?.cac || 0}
- Satisfacción: ${data.businessMetrics[0]?.satisfaction_score || 0}/10
- NPS: ${data.businessMetrics[0]?.nps_score || 0}

Tendencia histórica:
${data.businessMetrics.slice(0, 6).map((m: any, i: number) => `
${i + 1}. ${new Date(m.metric_date).toLocaleDateString()}:
   Revenue: €${m.revenue?.toLocaleString() || 0}, Pedidos: ${m.orders_count || 0}, Leads: ${m.leads_generated || 0}
`).join('')}
` : 'No hay métricas de negocio registradas en este periodo'}

**FINANZAS:**
Periodo analizado (${new Date(data.data_period.start_date).toLocaleDateString()} - ${new Date(data.data_period.end_date).toLocaleDateString()}):
- Ingresos totales: €${totalRevenue.toLocaleString()}
- Gastos totales: €${totalExpenses.toLocaleString()}
- Balance neto: €${(totalRevenue - totalExpenses).toLocaleString()}
- Margen: ${totalRevenue > 0 ? (((totalRevenue - totalExpenses) / totalRevenue) * 100).toFixed(1) : 0}%

Distribución de ingresos por categoría:
${Object.entries(
  data.revenueEntries.reduce((acc: any, r: any) => {
    const cat = r.product_category || 'otros';
    acc[cat] = (acc[cat] || 0) + (r.amount || 0);
    return acc;
  }, {})
).map(([cat, amount]) => `- ${cat}: €${(amount as number).toLocaleString()}`).join('\n')}

Distribución de gastos por categoría:
${Object.entries(
  data.expenseEntries.reduce((acc: any, e: any) => {
    const cat = e.category || 'otros';
    acc[cat] = (acc[cat] || 0) + (e.amount || 0);
    return acc;
  }, {})
).map(([cat, amount]) => `- ${cat}: €${(amount as number).toLocaleString()}`).join('\n')}

${data.financialMetrics.length > 0 ? `
Métricas financieras actuales:
- Margen bruto: ${data.financialMetrics[0]?.gross_margin || 0}%
- Margen neto: ${data.financialMetrics[0]?.net_margin || 0}%
- Burn rate: €${data.financialMetrics[0]?.burn_rate?.toLocaleString() || 0}
- Runway: ${data.financialMetrics[0]?.runway_months || 0} meses
- Clientes: ${data.financialMetrics[0]?.customer_count || 0}
- Nuevos clientes: ${data.financialMetrics[0]?.new_customers || 0}
` : ''}

**DÍAS ANALIZADOS:** ${Math.ceil((new Date(data.data_period.end_date).getTime() - new Date(data.data_period.start_date).getTime()) / (1000 * 60 * 60 * 24))} días
`;
}

// ============================================
// CALL LOVABLE AI
// ============================================

async function callLovableAI(prompt: string): Promise<string> {
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  console.log("🤖 Calling Lovable AI Gateway (Gemini 2.5 Flash)...");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    if (response.status === 402) {
      throw new Error("Payment required. Please add credits to your Lovable AI workspace.");
    }
    const errorText = await response.text();
    console.error("Lovable AI error:", response.status, errorText);
    throw new Error(`Lovable AI error: ${response.status}`);
  }

  const data = await response.json();
  console.log("✅ AI response received");
  
  return data.choices[0].message.content;
}

// ============================================
// PARSE AND VALIDATE JSON
// ============================================

function parseAndValidateJSON(text: string): any {
  let cleaned = text.trim();
  
  // Remove markdown code blocks if present
  cleaned = cleaned.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  
  // Remove any text before first {
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace > 0) {
    cleaned = cleaned.substring(firstBrace);
  }
  
  // Remove any text after last }
  const lastBrace = cleaned.lastIndexOf('}');
  if (lastBrace > 0 && lastBrace < cleaned.length - 1) {
    cleaned = cleaned.substring(0, lastBrace + 1);
  }
  
  try {
    const parsed = JSON.parse(cleaned);
    
    // Basic validation
    if (!parsed.executive_dashboard) {
      throw new Error("Missing executive_dashboard section");
    }
    if (!parsed.financial_health) {
      throw new Error("Missing financial_health section");
    }
    if (!parsed.team_performance) {
      throw new Error("Missing team_performance section");
    }
    
    // Add metadata
    parsed.id = crypto.randomUUID();
    parsed.generated_at = new Date().toISOString();
    
    console.log("✅ JSON validated successfully");
    return parsed;
  } catch (error) {
    console.error("❌ JSON parsing error:", error);
    console.error("First 500 chars of text:", cleaned.substring(0, 500));
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================
// SAVE TO DATABASE
// ============================================

async function saveAnalysisToDatabase(supabase: any, organization_id: string, user_id: string, analysis: any): Promise<void> {
  console.log("💾 Saving analysis to database...");
  
  const { error } = await supabase.from('ai_analysis_results').insert({
    organization_id: organization_id,
    user_id: user_id,
    analysis_data: analysis,
    generated_at: analysis.generated_at,
  });

  if (error) {
    console.error("❌ Error saving analysis:", error);
    throw new Error(`Failed to save analysis: ${error.message}`);
  }
  
  console.log("✅ Analysis saved successfully");
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id, user_id, data_period }: AnalysisRequest = await req.json();

    if (!organization_id) {
      return new Response(
        JSON.stringify({ error: "organization_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🚀 Starting AI analysis for organization: ${organization_id}`);

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Step 1: Fetch company data
    console.log("[1/5] Fetching company data...");
    const companyData = await fetchCompanyData(supabase, organization_id, data_period);

    // Step 2: Format data for prompt
    console.log("[2/5] Formatting data for AI...");
    const formattedData = formatCompanyDataForPrompt(companyData);
    const fullPrompt = STRUCTURED_ANALYSIS_PROMPT.replace('{COMPANY_DATA}', formattedData);

    // Step 3: Call Lovable AI
    console.log("[3/5] Calling Lovable AI (Gemini 2.5 Flash)...");
    const aiResponse = await callLovableAI(fullPrompt);

    // Step 4: Parse and validate JSON
    console.log("[4/5] Parsing and validating response...");
    const analysis = parseAndValidateJSON(aiResponse);
    analysis.organization_id = organization_id;
    analysis.data_period = companyData.data_period;

    // Step 5: Save to database
    console.log("[5/5] Saving analysis to database...");
    await saveAnalysisToDatabase(supabase, organization_id, user_id, analysis);

    console.log(`✅ Analysis completed successfully: ${analysis.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        analysis_id: analysis.id,
        analysis: analysis,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("❌ Error in analysis:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});