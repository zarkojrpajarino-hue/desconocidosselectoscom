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
    const { userId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar límite de generaciones en plan gratuito
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('organization_id')
      .eq('user_id', userId)
      .single();

    if (userRole) {
      const { data: org } = await supabase
        .from('organizations')
        .select('plan')
        .eq('id', userRole.organization_id)
        .single();

      // En plan gratuito o trial: máximo 2 OKRs por usuario (2 semanas)
      if (org && (org.plan === 'free' || org.plan === 'trial')) {
        const { count: existingOKRs } = await supabase
          .from('objectives')
          .select('*', { count: 'exact', head: true })
          .eq('owner_user_id', userId);

        if (existingOKRs && existingOKRs >= 2) {
          return new Response(
            JSON.stringify({ 
              error: 'Has alcanzado el límite de 2 OKRs semanales del plan gratuito. Actualiza a plan premium para generación ilimitada.'
            }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Obtener datos del usuario incluyendo objetivos estratégicos
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('full_name, role, email, strategic_objectives')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error('Usuario no encontrado');
    }

    // Obtener la semana actual del sistema
    const { data: systemConfig } = await supabase
      .from('system_config')
      .select('week_start')
      .single();

    if (!systemConfig) {
      throw new Error('Configuración del sistema no encontrada');
    }

    const currentWeekStart = new Date(systemConfig.week_start).toISOString().split('T')[0];

    // Obtener TODAS las tareas programadas para esta semana del usuario
    const { data: scheduledTasks } = await supabase
      .from('task_schedule')
      .select(`
        task_id,
        is_collaborative,
        tasks!inner (
          id,
          title,
          description,
          area,
          leader_id
        )
      `)
      .eq('user_id', userId)
      .eq('week_start', currentWeekStart);

    // Procesar tareas
    const userTasks = (scheduledTasks || [])
      .filter(st => st.tasks && typeof st.tasks === 'object' && !Array.isArray(st.tasks))
      .map(st => {
        const task = st.tasks as any;
        return {
          id: task.id,
          titulo: task.title,
          descripcion: task.description,
          area: task.area,
          tipo: st.is_collaborative ? 'colaborativa' : (task.leader_id === userId ? 'líder' : 'propia')
        };
      });

    // Obtener completions recientes
    const { data: completions } = await supabase
      .from('task_completions')
      .select('task_id, validated_by_leader, leader_evaluation')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(10);

    // Preparar contexto para la IA
    const context = {
      usuario: {
        nombre: user.full_name,
        rol: user.role,
        objetivos_estrategicos: user.strategic_objectives || 'No definidos'
      },
      semana_actual: currentWeekStart,
      tareas_de_la_semana: userTasks,
      total_tareas: userTasks.length,
      tareas_por_tipo: {
        propias: userTasks.filter(t => t.tipo === 'propia').length,
        colaborativas: userTasks.filter(t => t.tipo === 'colaborativa').length,
        como_lider: userTasks.filter(t => t.tipo === 'líder').length,
      },
      desempeno_reciente: {
        tareas_validadas: completions?.filter(c => c.validated_by_leader).length || 0,
        total_completadas: completions?.length || 0,
      }
    };

    const prompt = `Eres un experto en OKRs (Objectives and Key Results) y gestión por objetivos semanales.

Contexto del usuario y sus tareas de esta semana:
${JSON.stringify(context, null, 2)}

PRIORIDAD MÁXIMA: Los OKRs deben estar alineados con los objetivos estratégicos del rol del usuario.
Objetivos estratégicos: ${user.strategic_objectives || 'No definidos - usa tareas como referencia'}

Tu tarea es:
1. Generar 1 Objetivo (Objective) principal para esta semana que:
   - ESTÉ DIRECTAMENTE ALINEADO con los objetivos estratégicos del rol
   - Englobe el trabajo del usuario de esta semana
   - Contribuya al avance de los objetivos estratégicos
2. Generar entre 3 y 5 Key Results (KRs) PERSONALIZADOS que:
   - Estén relacionados tanto con las TAREAS ESPECÍFICAS de esta semana como con los objetivos estratégicos
   - Consideren su rol (${user.role}) y tipo de tareas (propias, colaborativas, líder)
   - Sean medibles y específicos
   - Sean alcanzables en UNA SEMANA
   - Reflejen cómo las tareas contribuyen a los objetivos estratégicos del rol

El Objetivo debe tener:
- title: Objetivo principal de la semana (máx 100 caracteres)
- description: Por qué este objetivo es importante esta semana (máx 300 caracteres)

Cada Key Result debe tener:
- title: Título claro y accionable relacionado con las tareas (máx 100 caracteres)
- description: Qué se medirá específicamente (máx 300 caracteres)
- metric_type: tipo de métrica ("número", "porcentaje", "cantidad", etc.)
- start_value: valor inicial (generalmente 0)
- target_value: valor objetivo realista para ESTA SEMANA (número)
- unit: unidad de medida ("tareas completadas", "%", "validaciones", "colaboraciones", etc.)

IMPORTANTE: 
- Los KRs deben ser REALISTAS para UNA SEMANA
- Deben reflejar las ${userTasks.length} tareas específicas que tiene esta semana
- Deben ser MEDIBLES objetivamente
- Deben mostrar cómo las tareas contribuyen a los objetivos estratégicos del rol
- Si no hay objetivos estratégicos definidos, genera OKRs generales basados solo en las tareas
- Evita metas genéricas, hazlas específicas a las tareas actuales y objetivos estratégicos`;

    console.log('Generating weekly OKRs with AI for user:', userId);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Eres un experto en OKRs semanales. Devuelve SOLO un JSON válido sin markdown ni explicaciones.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_weekly_okr",
            description: "Genera un Objetivo semanal con Key Results personalizados",
            parameters: {
              type: "object",
              properties: {
                objective: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" }
                  },
                  required: ["title", "description"]
                },
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
              required: ["objective", "key_results"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_weekly_okr" } }
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
      throw new Error('No se generaron OKRs');
    }

    const generated = JSON.parse(toolCall.function.arguments);
    
    // Insertar el Objetivo semanal
    const { data: newObjective, error: objInsertError } = await supabase
      .from('objectives')
      .insert({
        title: generated.objective.title,
        description: generated.objective.description,
        quarter: `Semana ${currentWeekStart}`,
        year: new Date().getFullYear(),
        phase: null,
        target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        owner_user_id: userId,
        created_by: userId,
        status: 'active'
      })
      .select()
      .single();

    if (objInsertError) {
      console.error('Error inserting objective:', objInsertError);
      throw objInsertError;
    }
    
    // Insertar los KRs
    const krsToInsert = generated.key_results.map((kr: any) => ({
      objective_id: newObjective.id,
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

    console.log(`Successfully generated weekly OKR with ${insertedKRs.length} Key Results`);

    return new Response(
      JSON.stringify({ 
        success: true,
        objective: newObjective,
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
