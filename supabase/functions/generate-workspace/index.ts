import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { handleError, createErrorResponse } from "../_shared/errorHandler.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FUNCTION_NAME = 'generate-workspace';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();

  try {
    const { organizationId } = await req.json();
    
    if (!organizationId) {
      return createErrorResponse('organizationId is required', 400, corsHeaders);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[${FUNCTION_NAME}] Starting generation for org: ${organizationId} (requestId: ${requestId})`);

    // 1. Fetch organization data
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      return createErrorResponse(`Organization not found: ${organizationId}`, 404, corsHeaders);
    }

    // 2. Update status to 'generating'
    await supabase
      .from('organizations')
      .update({ ai_generation_status: 'generating' })
      .eq('id', organizationId);

    // 3. Build AI Prompt
    const prompt = `
Eres un experto en consultoría empresarial y gestión. Genera un sistema de gestión personalizado para esta empresa:

**EMPRESA:**
- Nombre: ${org.name}
- Industria: ${org.industry}
- Tamaño: ${org.company_size}
- Descripción: ${org.business_description}

**CLIENTES OBJETIVO:**
${org.target_customers}

**PROPUESTA DE VALOR:**
${org.value_proposition}

**PROCESO COMERCIAL:**
${org.sales_process}

**PRODUCTOS/SERVICIOS:**
${JSON.stringify(org.products_services, null, 2)}

**OBJETIVOS:**
${org.main_objectives}

**PROBLEMAS ACTUALES:**
${org.current_problems}

**KPIs A MEDIR:**
${JSON.stringify(org.kpis_to_measure, null, 2)}

---

**GENERA:**

1. **10 OBJETIVOS (OKRs)** con 4 Key Results cada uno, alineados a sus objetivos principales.
   Formato: { objective: string, description: string, key_results: [{ title: string, target_value: number, metric_type: string, unit: string }] }

2. **6 ETAPAS DE PIPELINE CRM** basadas en su proceso comercial.
   Formato: { name: string, description: string, order_index: number }

NOTA: NO generes tareas aquí. Las tareas se generarán automáticamente cuando cada usuario se una y seleccione su rol (12 tareas personalizadas por rol).

Responde SOLO con JSON válido, sin texto adicional:
{
  "okrs": [...],
  "pipeline_stages": [...]
}
`;

    // 4. Call Lovable AI
    console.log(`[${FUNCTION_NAME}] Calling Lovable AI...`);
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Eres un experto generando sistemas de gestión empresarial. Respondes SOLO con JSON válido.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`[${FUNCTION_NAME}] AI Error:`, aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices[0].message.content;
    
    console.log(`[${FUNCTION_NAME}] AI Response received, parsing...`);

    // 5. Parse AI Response
    const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const generated = JSON.parse(jsonMatch[0]);

    // 6. Insert OKRs
    console.log(`[${FUNCTION_NAME}] Inserting ${generated.okrs?.length || 0} OKRs...`);
    
    if (generated.okrs && generated.okrs.length > 0) {
      for (const okr of generated.okrs) {
        const { data: objective, error: objError } = await supabase
          .from('objectives')
          .insert({
            organization_id: organizationId,
            title: okr.objective,
            description: okr.description,
            quarter: 'Q1',
            year: new Date().getFullYear(),
            status: 'active',
          })
          .select()
          .single();

        if (objError) {
          console.error(`[${FUNCTION_NAME}] Objective error:`, objError);
          continue;
        }

        // Insert Key Results
        if (okr.key_results && okr.key_results.length > 0) {
          const krsToInsert = okr.key_results.map((kr: { title: string; target_value: number; metric_type?: string; unit?: string }) => ({
            objective_id: objective.id,
            title: kr.title,
            target_value: kr.target_value,
            current_value: 0,
            start_value: 0,
            metric_type: kr.metric_type || 'number',
            unit: kr.unit || '',
            status: 'on_track',
          }));

          await supabase.from('key_results').insert(krsToInsert);
        }
      }
    }

    // 7. Insert Pipeline Stages
    console.log(`[${FUNCTION_NAME}] Inserting ${generated.pipeline_stages?.length || 0} pipeline stages...`);
    
    if (generated.pipeline_stages && generated.pipeline_stages.length > 0) {
      const stagesToInsert = generated.pipeline_stages.map((stage: { name: string; description: string; order_index: number }) => ({
        organization_id: organizationId,
        name: stage.name,
        description: stage.description,
        order_index: stage.order_index,
      }));

      await supabase.from('pipeline_stages').insert(stagesToInsert);
    }

    // 8. Generate Tools Content
    console.log(`[${FUNCTION_NAME}] Generating tools content...`);
    
    const toolTypes = ['buyer_persona', 'customer_journey', 'growth_model', 'lead_scoring'];
    const toolsGenerated = [];
    
    for (const toolType of toolTypes) {
      try {
        console.log(`[${FUNCTION_NAME}] Generating ${toolType}...`);
        
        const toolPrompt = getToolPrompt(toolType, org);
        const toolSystemPrompt = 'Eres un experto en estrategia empresarial y marketing. Respondes SOLO en formato JSON válido.';

        const toolAiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: toolSystemPrompt },
              { role: 'user', content: toolPrompt }
            ],
            temperature: 0.7,
          }),
        });

        if (toolAiResponse.ok) {
          const toolAiData = await toolAiResponse.json();
          const toolContent = toolAiData.choices[0].message.content;
          
          const toolJsonMatch = toolContent.match(/\{[\s\S]*\}/);
          if (toolJsonMatch) {
            const parsedContent = JSON.parse(toolJsonMatch[0]);
            
            await supabase.from('tool_contents').insert({
              organization_id: organizationId,
              tool_type: toolType,
              content: parsedContent
            });
            
            toolsGenerated.push(toolType);
            console.log(`[${FUNCTION_NAME}] ✅ ${toolType} generated`);
          }
        }
      } catch (toolError) {
        console.error(`[${FUNCTION_NAME}] ⚠️ Error generating ${toolType}:`, toolError);
      }
    }

    console.log(`[${FUNCTION_NAME}] Tools generated: ${toolsGenerated.join(', ')}`);

    // 9. Update organization status
    await supabase
      .from('organizations')
      .update({ 
        ai_generation_status: 'completed',
        ai_generation_completed_at: new Date().toISOString()
      })
      .eq('id', organizationId);

    console.log(`[${FUNCTION_NAME}] ✅ Generation completed successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Workspace generated successfully',
        stats: {
          okrs: generated.okrs?.length || 0,
          pipeline_stages: generated.pipeline_stages?.length || 0,
          tools: toolsGenerated.length
        },
        requestId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[${FUNCTION_NAME}] ❌ Error:`, error);

    // Update organization with error
    try {
      const { organizationId } = await req.json().catch(() => ({}));
      if (organizationId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        await supabase
          .from('organizations')
          .update({ 
            ai_generation_status: 'failed',
            ai_generation_error: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', organizationId);
      }
    } catch {
      // Ignore error handling failures
    }

    await handleError(error, {
      functionName: FUNCTION_NAME,
      requestId,
      endpoint: '/generate-workspace',
      method: req.method,
    });

    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500,
      corsHeaders
    );
  }
});

function getToolPrompt(toolType: string, org: Record<string, unknown>): string {
  const baseContext = `
CONTEXTO DE LA EMPRESA:
- Nombre: ${org.name}
- Industria: ${org.industry}
- Tamaño: ${org.company_size}
- Descripción: ${org.business_description}
- Clientes objetivo: ${org.target_customers}
- Propuesta de valor: ${org.value_proposition}
- Productos/Servicios: ${JSON.stringify(org.products_services)}
`;

  switch (toolType) {
    case 'buyer_persona':
      return `Genera un Buyer Persona detallado para esta empresa:
${baseContext}
Genera SOLO el JSON con este formato exacto:
{
  "name": "Nombre del persona",
  "age": "Rango de edad",
  "occupation": "Ocupación/Cargo",
  "industry": "Industria donde trabaja",
  "goals": ["Objetivo 1", "Objetivo 2", "Objetivo 3"],
  "challenges": ["Desafío 1", "Desafío 2", "Desafío 3"],
  "values": ["Valor 1", "Valor 2", "Valor 3"],
  "channels": ["Canal 1", "Canal 2", "Canal 3"],
  "quote": "Una cita representativa del persona"
}`;

    case 'customer_journey':
      return `Genera un Customer Journey detallado para esta empresa:
${baseContext}
- Proceso de ventas: ${org.sales_process}
- Duración del ciclo: ${org.sales_cycle_days} días
Genera SOLO el JSON con este formato exacto:
{
  "stages": [
    {"name": "Awareness", "description": "Descripción", "touchpoints": [], "emotions": [], "opportunities": []},
    {"name": "Consideration", "description": "Descripción", "touchpoints": [], "emotions": [], "opportunities": []},
    {"name": "Decision", "description": "Descripción", "touchpoints": [], "emotions": [], "opportunities": []},
    {"name": "Retention", "description": "Descripción", "touchpoints": [], "emotions": [], "opportunities": []}
  ]
}`;

    case 'growth_model':
      return `Genera un Growth Model (AARRR Pirate Metrics) para esta empresa:
${baseContext}
- Objetivos principales: ${org.main_objectives}
Genera SOLO el JSON con este formato exacto:
{
  "metrics": [
    {"stage": "Acquisition", "kpis": [], "channels": [], "tactics": []},
    {"stage": "Activation", "kpis": [], "channels": [], "tactics": []},
    {"stage": "Retention", "kpis": [], "channels": [], "tactics": []},
    {"stage": "Revenue", "kpis": [], "channels": [], "tactics": []},
    {"stage": "Referral", "kpis": [], "channels": [], "tactics": []}
  ]
}`;

    case 'lead_scoring':
      return `Genera un modelo de Lead Scoring para esta empresa:
${baseContext}
Genera SOLO el JSON con este formato exacto:
{
  "criteria": [
    {"category": "Perfil Demográfico", "factors": [{"name": "Factor", "points": 10, "description": "Desc"}]},
    {"category": "Comportamiento", "factors": [{"name": "Factor", "points": 15, "description": "Desc"}]},
    {"category": "Engagement", "factors": [{"name": "Factor", "points": 20, "description": "Desc"}]}
  ],
  "scoring_ranges": [
    {"min": 0, "max": 30, "grade": "C", "label": "Cold Lead"},
    {"min": 31, "max": 60, "grade": "B", "label": "Warm Lead"},
    {"min": 61, "max": 100, "grade": "A", "label": "Hot Lead"}
  ]
}`;

    default:
      return '';
  }
}
