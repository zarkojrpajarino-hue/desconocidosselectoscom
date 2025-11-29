import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { objectiveId, userId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener datos del usuario
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('full_name, role, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error('Usuario no encontrado');
    }

    // Obtener el objetivo
    const { data: objective, error: objError } = await supabase
      .from('objectives')
      .select('*')
      .eq('id', objectiveId)
      .single();

    if (objError || !objective) {
      throw new Error('Objetivo no encontrado');
    }

    // Obtener tareas del usuario en la fase del objetivo
    const { data: tasks } = await supabase
      .from('tasks')
      .select('title, description, area')
      .eq('user_id', userId)
      .eq('phase', objective.phase);

    // Obtener completions para entender el desempeño
    const { data: completions } = await supabase
      .from('task_completions')
      .select('task_id, validated_by_leader, leader_evaluation')
      .eq('user_id', userId)
      .limit(10);

    // Preparar contexto para la IA
    const context = {
      usuario: {
        nombre: user.full_name,
        rol: user.role,
      },
      objetivo: {
        titulo: objective.title,
        descripcion: objective.description,
        fase: objective.phase,
        quarter: objective.quarter,
        year: objective.year,
      },
      tareas_actuales: tasks?.map(t => ({
        titulo: t.title,
        area: t.area,
        descripcion: t.description
      })) || [],
      desempeno_reciente: {
        tareas_validadas: completions?.filter(c => c.validated_by_leader).length || 0,
        total_completadas: completions?.length || 0,
      }
    };

    const prompt = `Eres un experto en OKRs (Objectives and Key Results) y gestión por objetivos.

Contexto del usuario y su trabajo:
${JSON.stringify(context, null, 2)}

Tu tarea es generar entre 3 y 5 Key Results (KRs) PERSONALIZADOS para este usuario que:
1. Estén directamente relacionados con su rol (${user.role})
2. Se alineen con el objetivo principal: "${objective.title}"
3. Sean medibles y específicos
4. Consideren las tareas actuales que está realizando
5. Sean desafiantes pero alcanzables en el trimestre ${objective.quarter} ${objective.year}

Cada Key Result debe tener:
- title: Título claro y accionable (máx 100 caracteres)
- description: Descripción detallada de qué se medirá y por qué es importante (máx 300 caracteres)
- metric_type: tipo de métrica ("número", "porcentaje", "cantidad", etc.)
- start_value: valor inicial (número)
- target_value: valor objetivo realista para este trimestre (número)
- unit: unidad de medida ("tareas", "%", "clientes", "proyectos", etc.)

IMPORTANTE: 
- Los KRs deben ser REALISTAS para un trimestre
- Deben reflejar el trabajo ACTUAL del usuario
- Deben ser MEDIBLES objetivamente
- Evita metas genéricas, hazlas específicas al contexto`;

    console.log('Generating KRs with AI for user:', userId);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Eres un experto en OKRs. Devuelve SOLO un JSON válido sin markdown ni explicaciones.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_key_results",
            description: "Genera Key Results personalizados para el usuario",
            parameters: {
              type: "object",
              properties: {
                key_results: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      metric_type: { type: "string" },
                      start_value: { type: "number" },
                      target_value: { type: "number" },
                      unit: { type: "string" }
                    },
                    required: ["title", "description", "metric_type", "start_value", "target_value", "unit"]
                  }
                }
              },
              required: ["key_results"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_key_results" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Límite de uso de IA alcanzado. Intenta de nuevo en unos minutos.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA agotados. Contacta al administrador.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(aiData, null, 2));

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No se generaron Key Results');
    }

    const generatedKRs = JSON.parse(toolCall.function.arguments);
    
    // Insertar los KRs en la base de datos
    const krsToInsert = generatedKRs.key_results.map((kr: any) => ({
      objective_id: objectiveId,
      title: kr.title,
      description: kr.description,
      metric_type: kr.metric_type,
      start_value: kr.start_value,
      target_value: kr.target_value,
      current_value: kr.start_value,
      unit: kr.unit,
      weight: 1.0,
      status: 'on_track'
    }));

    const { data: insertedKRs, error: insertError } = await supabase
      .from('key_results')
      .insert(krsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting KRs:', insertError);
      throw insertError;
    }

    console.log(`Successfully generated ${insertedKRs.length} Key Results`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        key_results: insertedKRs,
        count: insertedKRs.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-personalized-krs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error generando Key Results';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
