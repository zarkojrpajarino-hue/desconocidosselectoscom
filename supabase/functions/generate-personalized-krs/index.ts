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
    const { userId, autoGenerate = false } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener la semana actual del sistema PRIMERO
    const { data: systemConfig } = await supabase
      .from('system_config')
      .select('week_start')
      .single();

    if (!systemConfig) {
      throw new Error('Configuración del sistema no encontrada');
    }

    const currentWeekStart = new Date(systemConfig.week_start).toISOString().split('T')[0];

    // ============================================
    // NUEVO: Verificar OKRs pendientes de semanas anteriores
    // ============================================
    const { data: pendingOKRs } = await supabase
      .from('objectives')
      .select(`
        id,
        title,
        description,
        status,
        week_start,
        key_results (
          id,
          title,
          current_value,
          target_value,
          status
        )
      `)
      .eq('owner_user_id', userId)
      .neq('status', 'completed')
      .lt('week_start', currentWeekStart)
      .is('phase', null); // Solo OKRs semanales, no organizacionales

    // Si hay OKRs pendientes de semanas anteriores
    if (pendingOKRs && pendingOKRs.length > 0 && !autoGenerate) {
      // Contar Key Results incompletos
      const incompleteKRs = pendingOKRs.flatMap(okr => 
        // deno-lint-ignore no-explicit-any
        (okr.key_results as any[] || []).filter((kr: any) => 
          kr.status !== 'completed' && kr.current_value < kr.target_value
        )
      );

      if (incompleteKRs.length > 0) {
        // Arrastrar los OKRs pendientes a la semana actual
        const okrIds = pendingOKRs.map(okr => okr.id);
        
        await supabase
          .from('objectives')
          .update({ week_start: currentWeekStart })
          .in('id', okrIds);

        console.log(`Arrastrados ${pendingOKRs.length} OKRs pendientes con ${incompleteKRs.length} KRs incompletos a la semana actual`);

        return new Response(
          JSON.stringify({ 
            success: true,
            message: `Tienes ${pendingOKRs.length} OKRs con ${incompleteKRs.length} Key Results pendientes que se han arrastrado a esta semana. Completa tus OKRs actuales antes de generar nuevos.`,
            pendingOKRs: pendingOKRs.length,
            pendingKRs: incompleteKRs.length,
            carried_over: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verificar si ya tiene OKRs para esta semana
    const { data: existingWeekOKRs } = await supabase
      .from('objectives')
      .select('id')
      .eq('owner_user_id', userId)
      .eq('week_start', currentWeekStart)
      .is('phase', null);

    if (existingWeekOKRs && existingWeekOKRs.length > 0 && !autoGenerate) {
      return new Response(
        JSON.stringify({ 
          error: 'Ya tienes OKRs generados para esta semana. Completa los existentes primero.',
          existingOKRs: existingWeekOKRs.length
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
          .eq('owner_user_id', userId)
          .is('phase', null);

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
        // deno-lint-ignore no-explicit-any
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
1. Generar 1 Objetivo (Objective) principal para esta semana
2. Generar entre 3 y 5 Key Results (KRs) PERSONALIZADOS
3. Generar un PLAYBOOK profesional con pasos y tips para lograr el objetivo

El Objetivo debe tener:
- title: Objetivo principal de la semana (máx 100 caracteres)
- description: Por qué este objetivo es importante esta semana (máx 300 caracteres)

Cada Key Result debe tener:
- title: Título claro y accionable (máx 100 caracteres)
- description: Qué se medirá específicamente (máx 300 caracteres)
- metric_type: tipo de métrica
- start_value: valor inicial (generalmente 0)
- target_value: valor objetivo realista para ESTA SEMANA
- unit: unidad de medida

El Playbook debe tener:
- title: Título del playbook (ej: "Playbook: Maximizar Productividad Semanal")
- description: Resumen del enfoque estratégico (1-2 oraciones)
- steps: Array de 5-7 pasos concretos y accionables para lograr el objetivo
- tips: Array de 3-5 consejos profesionales específicos para el rol del usuario
- resources: Array de 2-3 recursos o herramientas recomendadas
- daily_focus: Array de 5 strings con el enfoque para cada día laboral (lunes a viernes)

IMPORTANTE: 
- Los KRs deben ser REALISTAS para UNA SEMANA
- El playbook debe ser PROFESIONAL y ESPECÍFICO al contexto del usuario
- Incluye pasos concretos basados en las tareas reales de la semana
- Los tips deben ser aplicables inmediatamente`;

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
          { role: 'system', content: 'Eres un experto en OKRs semanales y coaching profesional. Devuelve SOLO un JSON válido sin markdown ni explicaciones.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_weekly_okr",
            description: "Genera un Objetivo semanal con Key Results y Playbook personalizados",
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
                },
                playbook: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    steps: { 
                      type: "array", 
                      items: { type: "string" }
                    },
                    tips: { 
                      type: "array", 
                      items: { type: "string" }
                    },
                    resources: {
                      type: "array",
                      items: { type: "string" }
                    },
                    daily_focus: {
                      type: "array",
                      items: { type: "string" }
                    }
                  },
                  required: ["title", "description", "steps", "tips"]
                }
              },
              required: ["objective", "key_results", "playbook"]
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
    
    // Insertar el Objetivo semanal CON PLAYBOOK
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
        status: 'active',
        organization_id: userRole?.organization_id,
        playbook: generated.playbook || null
      })
      .select()
      .single();

    if (objInsertError) {
      console.error('Error inserting objective:', objInsertError);
      throw objInsertError;
    }
    
    // Insertar los KRs
    const krsToInsert = generated.key_results.map((kr: Record<string, unknown>) => ({
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

    console.log(`Successfully generated weekly OKR with ${insertedKRs.length} Key Results and Playbook`);

    return new Response(
      JSON.stringify({ 
        success: true,
        objective: newObjective,
        key_results: insertedKRs,
        playbook: generated.playbook,
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
