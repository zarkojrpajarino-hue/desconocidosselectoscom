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

1. **50 TAREAS** distribuidas en 4 fases (Captar, Proponer, Cerrar, Entregar). Cada tarea debe ser específica al negocio.
   Formato: { title: string, description: string, phase: 1-4, area: string }

2. **10 OBJETIVOS (OKRs)** con 4 Key Results cada uno, alineados a sus objetivos principales.
   Formato: { objective: string, description: string, key_results: [{ title: string, target_value: number, metric_type: string, unit: string }] }

3. **6 ETAPAS DE PIPELINE CRM** basadas en su proceso comercial.
   Formato: { name: string, description: string, order_index: number }

Responde SOLO con JSON válido, sin texto adicional:
{
  "tasks": [...],
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

    // 6. Insert Tasks
    console.log(`[generate-workspace] Inserting ${generated.tasks?.length || 0} tasks...`);
    
    if (generated.tasks && generated.tasks.length > 0) {
      const tasksToInsert = generated.tasks.map((task: any) => ({
        organization_id: organizationId,
        user_id: null, // Will be assigned later
        title: task.title,
        description: task.description,
        phase: task.phase,
        area: task.area || 'general',
        order_index: 0,
      }));

      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(tasksToInsert);

      if (tasksError) {
        console.error('[generate-workspace] Tasks error:', tasksError);
        throw new Error(`Failed to insert tasks: ${tasksError.message}`);
      }
    }

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

    // 9. Update organization status
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
          tasks: generated.tasks?.length || 0,
          okrs: generated.okrs?.length || 0,
          pipeline_stages: generated.pipeline_stages?.length || 0
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
