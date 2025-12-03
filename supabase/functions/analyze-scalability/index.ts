import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const LOVABLE_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  organizationId: string;
  questionnaireData?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId, questionnaireData }: AnalysisRequest = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    console.log('🔍 Iniciando análisis de escalabilidad para org:', organizationId);
    
    // 1. Recopilar datos existentes
    const existingData = await gatherExistingData(supabase, organizationId);
    
    const fullDataset = {
      questionnaire: questionnaireData || {},
      existing: existingData
    };
    
    console.log('📊 Datos recopilados:', {
      team_size: existingData.team.size,
      total_tasks: existingData.tasks.total,
    });
    
    // 2. Analizar con IA (Lovable Gateway)
    const analysis = await analyzeWithAI(fullDataset, existingData.organization);
    
    console.log('🤖 Análisis IA completado:', {
      overall_score: analysis.overall_score,
      bottlenecks: analysis.bottlenecks?.length || 0,
    });
    
    // 3. Guardar en BD
    const { data: analysisRecord, error: analysisError } = await supabase
      .from('scalability_analyses')
      .insert({
        organization_id: organizationId,
        overall_score: analysis.overall_score,
        people_score: analysis.people_score,
        process_score: analysis.process_score,
        product_score: analysis.product_score,
        financial_score: analysis.financial_score,
        score_reasoning: analysis.score_reasoning,
        data_snapshot: fullDataset
      })
      .select()
      .single();
    
    if (analysisError) {
      console.error('❌ Error saving analysis:', analysisError);
      throw analysisError;
    }
    
    // 4. Guardar bottlenecks
    if (analysis.bottlenecks?.length) {
      await supabase
        .from('scalability_bottlenecks')
        .insert(
          analysis.bottlenecks.map((b: Record<string, unknown>) => ({
            analysis_id: analysisRecord.id,
            type: b.type,
            severity: b.severity,
            title: b.title,
            description: b.description,
            impact_description: b.impact_description,
            recommendation_title: b.recommendation_title,
            recommendation_description: b.recommendation_description,
            estimated_impact: b.estimated_impact,
            implementation_effort: b.implementation_effort,
            priority_score: b.priority_score,
            tools_recommended: b.tools_recommended || [],
            estimated_cost_range: b.estimated_cost_range
          }))
        );
    }
    
    // 5. Guardar dependencies
    if (analysis.dependencies?.length) {
      await supabase
        .from('scalability_dependencies')
        .insert(
          analysis.dependencies.map((d: Record<string, unknown>) => ({
            analysis_id: analysisRecord.id,
            person_name: d.person_name,
            dependent_tasks: d.dependent_tasks || [],
            dependent_processes: d.dependent_processes || [],
            risk_level: d.risk_level,
            risk_description: d.risk_description,
            mitigation_recommendations: d.mitigation_recommendations || []
          }))
        );
    }
    
    // 6. Guardar automation opportunities
    if (analysis.automation_opportunities?.length) {
      await supabase
        .from('automation_opportunities')
        .insert(
          analysis.automation_opportunities.map((a: Record<string, unknown>) => ({
            analysis_id: analysisRecord.id,
            process_name: a.process_name,
            current_time_hours_month: a.current_time_hours_month,
            automated_time_hours_month: a.automated_time_hours_month,
            time_saved_hours_month: a.time_saved_hours_month,
            tools_recommended: a.tools_recommended || [],
            implementation_steps: a.implementation_steps || [],
            estimated_cost: a.estimated_cost,
            roi_months: a.roi_months,
            priority: a.priority
          }))
        );
    }
    
    console.log('✅ Análisis guardado con ID:', analysisRecord.id);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        analysis_id: analysisRecord.id,
        overall_score: analysis.overall_score
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('❌ Error en analyze-scalability:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function gatherExistingData(supabase: any, organizationId: string) {
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single();
  
  const { data: users } = await supabase
    .from('user_roles')
    .select('*, users(*)')
    .eq('organization_id', organizationId);
  
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('organization_id', organizationId);
  
  const taskStats = calculateTaskStats(tasks || []);
  
  return {
    organization: org || {},
    team: {
      size: users?.length || 0,
      roles: users?.map((u: Record<string, unknown>) => ({ 
        role: u.role, 
        name: (u.users as Record<string, unknown>)?.full_name 
      })) || [],
    },
    tasks: taskStats
  };
}

function calculateTaskStats(tasks: Record<string, unknown>[]) {
  if (!tasks.length) return { total: 0, completed: 0, completion_rate: 0 };
  
  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  
  const tasksByUser: Record<string, number> = {};
  tasks.forEach(t => {
    const userId = t.user_id as string;
    if (userId) {
      tasksByUser[userId] = (tasksByUser[userId] || 0) + 1;
    }
  });
  
  const maxTasks = Math.max(...Object.values(tasksByUser), 0);
  const concentration = total > 0 ? (maxTasks / total) * 100 : 0;
  
  return {
    total,
    completed,
    completion_rate: total > 0 ? (completed / total) * 100 : 0,
    concentration_percentage: concentration,
  };
}

async function analyzeWithAI(fullDataset: Record<string, unknown>, orgData: Record<string, unknown>) {
  const prompt = `Eres un consultor experto en escalabilidad de negocios.

CONTEXTO DE LA ORGANIZACIÓN
Nombre: ${orgData.name || 'No especificado'}
Tipo: ${orgData.business_type || 'No especificado'}

DATOS RECOPILADOS
${JSON.stringify(fullDataset, null, 2)}

TU MISIÓN: Genera un análisis ACCIONABLE de escalabilidad.

Responde SOLO con JSON válido (sin markdown, sin backticks):

{
  "overall_score": 75,
  "people_score": 60,
  "process_score": 70,
  "product_score": 85,
  "financial_score": 80,
  "score_reasoning": "Explicación de 2-3 líneas",
  "bottlenecks": [
    {
      "type": "people",
      "severity": "critical",
      "title": "Título específico",
      "description": "Descripción detallada",
      "impact_description": "Impacto cuantificado",
      "recommendation_title": "Acción concreta",
      "recommendation_description": "Pasos específicos",
      "estimated_impact": "Ahorro específico",
      "implementation_effort": "1-2 semanas",
      "priority_score": 95,
      "tools_recommended": ["Tool1"],
      "estimated_cost_range": "€X-Y/mes"
    }
  ],
  "dependencies": [
    {
      "person_name": "Nombre o rol",
      "dependent_tasks": ["Tarea 1"],
      "dependent_processes": ["Proceso 1"],
      "risk_level": "critical",
      "risk_description": "Descripción del riesgo",
      "mitigation_recommendations": ["Recomendación 1"]
    }
  ],
  "automation_opportunities": [
    {
      "process_name": "Nombre del proceso",
      "current_time_hours_month": 20,
      "automated_time_hours_month": 2,
      "time_saved_hours_month": 18,
      "tools_recommended": ["Tool1"],
      "implementation_steps": ["Paso 1"],
      "estimated_cost": "€X/mes",
      "roi_months": 1,
      "priority": 9
    }
  ]
}

Sé ESPECÍFICO en todas las recomendaciones.`;
  
  console.log('📡 Llamando a Lovable AI Gateway...');
  
  const response = await fetch(LOVABLE_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LOVABLE_API_KEY}`
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }]
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Lovable AI error:', response.status, errorText);
    
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    if (response.status === 402) {
      throw new Error('AI credits exhausted. Please add credits.');
    }
    
    throw new Error(`AI Gateway error: ${response.status}`);
  }
  
  const aiData = await response.json();
  const content = aiData.choices?.[0]?.message?.content || '';
  
  // Parse JSON from response
  let analysis;
  try {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;
    analysis = JSON.parse(jsonString.trim());
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError);
    // Fallback analysis
    analysis = {
      overall_score: 50,
      people_score: 50,
      process_score: 50,
      product_score: 50,
      financial_score: 50,
      score_reasoning: 'Análisis generado con datos limitados. Completa más información para un análisis detallado.',
      bottlenecks: [],
      dependencies: [],
      automation_opportunities: []
    };
  }
  
  console.log('✅ Análisis IA parseado correctamente');
  return analysis;
}
