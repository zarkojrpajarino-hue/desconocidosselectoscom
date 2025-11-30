import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId } = await req.json();
    
    if (!organizationId) {
      throw new Error('organizationId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[generate-workspace] Starting generation for org: ${organizationId}`);

    // 1. Fetch organization data
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      throw new Error(`Organization not found: ${organizationId}`);
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
    console.log('[generate-workspace] Calling Lovable AI...');
    
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
      console.error('[generate-workspace] AI Error:', aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices[0].message.content;
    
    console.log('[generate-workspace] AI Response received, parsing...');

    // 5. Parse AI Response
    const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const generated = JSON.parse(jsonMatch[0]);

    // 6. NO insertamos tareas aquí - se generarán cuando cada usuario seleccione su rol
    console.log('[generate-workspace] Skipping task generation - tasks will be created per user role');

    // 7. Insert OKRs
    console.log(`[generate-workspace] Inserting ${generated.okrs?.length || 0} OKRs...`);
    
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
          console.error('[generate-workspace] Objective error:', objError);
          continue;
        }

        // Insert Key Results
        if (okr.key_results && okr.key_results.length > 0) {
          const krsToInsert = okr.key_results.map((kr: any) => ({
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

    // 8. Insert Pipeline Stages
    console.log(`[generate-workspace] Inserting ${generated.pipeline_stages?.length || 0} pipeline stages...`);
    
    if (generated.pipeline_stages && generated.pipeline_stages.length > 0) {
      const stagesToInsert = generated.pipeline_stages.map((stage: any) => ({
        organization_id: organizationId,
        name: stage.name,
        description: stage.description,
        order_index: stage.order_index,
      }));

      await supabase.from('pipeline_stages').insert(stagesToInsert);
    }

    // 9. Generate Tools Content (Buyer Persona, Customer Journey, Growth Model, Lead Scoring)
    console.log('[generate-workspace] Generating tools content...');
    
    const toolTypes = ['buyer_persona', 'customer_journey', 'growth_model', 'lead_scoring'];
    const toolsGenerated = [];
    
    for (const toolType of toolTypes) {
      try {
        console.log(`[generate-workspace] Generating ${toolType}...`);
        
        let toolPrompt = '';
        let toolSystemPrompt = 'Eres un experto en estrategia empresarial y marketing. Respondes SOLO en formato JSON válido.';

        if (toolType === 'buyer_persona') {
          toolPrompt = `Genera un Buyer Persona detallado para esta empresa:

CONTEXTO DE LA EMPRESA:
- Nombre: ${org.name}
- Industria: ${org.industry}
- Tamaño: ${org.company_size}
- Descripción: ${org.business_description}
- Clientes objetivo: ${org.target_customers}
- Propuesta de valor: ${org.value_proposition}
- Productos/Servicios: ${JSON.stringify(org.products_services)}

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

        } else if (toolType === 'customer_journey') {
          toolPrompt = `Genera un Customer Journey detallado para esta empresa:

CONTEXTO DE LA EMPRESA:
- Nombre: ${org.name}
- Industria: ${org.industry}
- Proceso de ventas: ${org.sales_process}
- Duración del ciclo: ${org.sales_cycle_days} días
- Fuentes de leads: ${JSON.stringify(org.lead_sources)}

Genera SOLO el JSON con este formato exacto:
{
  "stages": [
    {
      "name": "Awareness",
      "description": "Descripción de esta etapa",
      "touchpoints": ["Punto de contacto 1", "Punto de contacto 2"],
      "emotions": ["Emoción 1", "Emoción 2"],
      "opportunities": ["Oportunidad 1", "Oportunidad 2"]
    },
    {
      "name": "Consideration",
      "description": "Descripción de esta etapa",
      "touchpoints": ["Punto de contacto 1", "Punto de contacto 2"],
      "emotions": ["Emoción 1", "Emoción 2"],
      "opportunities": ["Oportunidad 1", "Oportunidad 2"]
    },
    {
      "name": "Decision",
      "description": "Descripción de esta etapa",
      "touchpoints": ["Punto de contacto 1", "Punto de contacto 2"],
      "emotions": ["Emoción 1", "Emoción 2"],
      "opportunities": ["Oportunidad 1", "Oportunidad 2"]
    },
    {
      "name": "Retention",
      "description": "Descripción de esta etapa",
      "touchpoints": ["Punto de contacto 1", "Punto de contacto 2"],
      "emotions": ["Emoción 1", "Emoción 2"],
      "opportunities": ["Oportunidad 1", "Oportunidad 2"]
    }
  ]
}`;

        } else if (toolType === 'growth_model') {
          toolPrompt = `Genera un Growth Model (modelo AARRR Pirate Metrics) para esta empresa:

CONTEXTO DE LA EMPRESA:
- Nombre: ${org.name}
- Industria: ${org.industry}
- Objetivos principales: ${org.main_objectives}
- KPIs a medir: ${JSON.stringify(org.kpis_to_measure)}

Genera SOLO el JSON con este formato exacto:
{
  "metrics": [
    {
      "stage": "Acquisition",
      "kpis": ["KPI 1", "KPI 2", "KPI 3"],
      "channels": ["Canal 1", "Canal 2"],
      "tactics": ["Táctica 1", "Táctica 2"]
    },
    {
      "stage": "Activation",
      "kpis": ["KPI 1", "KPI 2"],
      "channels": ["Canal 1", "Canal 2"],
      "tactics": ["Táctica 1", "Táctica 2"]
    },
    {
      "stage": "Retention",
      "kpis": ["KPI 1", "KPI 2"],
      "channels": ["Canal 1", "Canal 2"],
      "tactics": ["Táctica 1", "Táctica 2"]
    },
    {
      "stage": "Revenue",
      "kpis": ["KPI 1", "KPI 2"],
      "channels": ["Canal 1", "Canal 2"],
      "tactics": ["Táctica 1", "Táctica 2"]
    },
    {
      "stage": "Referral",
      "kpis": ["KPI 1", "KPI 2"],
      "channels": ["Canal 1", "Canal 2"],
      "tactics": ["Táctica 1", "Táctica 2"]
    }
  ]
}`;

        } else if (toolType === 'lead_scoring') {
          toolPrompt = `Genera un modelo de Lead Scoring para esta empresa:

CONTEXTO DE LA EMPRESA:
- Nombre: ${org.name}
- Industria: ${org.industry}
- Clientes objetivo: ${org.target_customers}
- Proceso de ventas: ${org.sales_process}

Genera SOLO el JSON con este formato exacto:
{
  "criteria": [
    {
      "category": "Perfil Demográfico",
      "factors": [
        {"name": "Factor 1", "points": 10, "description": "Descripción"},
        {"name": "Factor 2", "points": 5, "description": "Descripción"}
      ]
    },
    {
      "category": "Comportamiento",
      "factors": [
        {"name": "Factor 1", "points": 15, "description": "Descripción"},
        {"name": "Factor 2", "points": 10, "description": "Descripción"}
      ]
    },
    {
      "category": "Engagement",
      "factors": [
        {"name": "Factor 1", "points": 20, "description": "Descripción"},
        {"name": "Factor 2", "points": 15, "description": "Descripción"}
      ]
    }
  ],
  "scoring_ranges": [
    {"min": 0, "max": 30, "grade": "C", "label": "Cold Lead"},
    {"min": 31, "max": 60, "grade": "B", "label": "Warm Lead"},
    {"min": 61, "max": 100, "grade": "A", "label": "Hot Lead"}
  ]
}`;
        }

        // Call Lovable AI for this tool
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
          
          // Parse JSON
          const jsonMatch = toolContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsedContent = JSON.parse(jsonMatch[0]);
            
            // Insert into database
            await supabase.from('tool_contents').insert({
              organization_id: organizationId,
              tool_type: toolType,
              content: parsedContent
            });
            
            toolsGenerated.push(toolType);
            console.log(`[generate-workspace] ✅ ${toolType} generated`);
          }
        }
      } catch (toolError) {
        console.error(`[generate-workspace] ⚠️ Error generating ${toolType}:`, toolError);
        // Continue with other tools even if one fails
      }
    }

    console.log(`[generate-workspace] Tools generated: ${toolsGenerated.join(', ')}`);

    // 10. Update organization status
    await supabase
      .from('organizations')
      .update({ 
        ai_generation_status: 'completed',
        ai_generation_completed_at: new Date().toISOString()
      })
      .eq('id', organizationId);

    console.log('[generate-workspace] ✅ Generation completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Workspace generated successfully',
        stats: {
          okrs: generated.okrs?.length || 0,
          pipeline_stages: generated.pipeline_stages?.length || 0,
          tools: toolsGenerated.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[generate-workspace] ❌ Error:', error);

    // Update organization with error
    const { organizationId } = await req.json().catch(() => ({}));
    if (organizationId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from('organizations')
        .update({ 
          ai_generation_status: 'failed',
          ai_generation_error: error.message
        })
        .eq('id', organizationId);
    }

    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
