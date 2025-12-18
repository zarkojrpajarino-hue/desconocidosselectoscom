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
    const { organizationId, phaseNumber } = await req.json();
    
    if (!organizationId || !phaseNumber) {
      throw new Error('organizationId y phaseNumber son requeridos');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[generate-organizational-okrs] Generando OKRs para org ${organizationId}, fase ${phaseNumber}`);

    // 1. Obtener datos de la organización
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      throw new Error('Organización no encontrada');
    }

    // 2. Obtener la fase actual
    const { data: phase, error: phaseError } = await supabase
      .from('business_phases')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('phase_number', phaseNumber)
      .single();

    if (phaseError || !phase) {
      throw new Error(`Fase ${phaseNumber} no encontrada`);
    }

    // 3. Obtener miembros del equipo
    const { data: teamMembers } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        role,
        users!inner (
          id,
          full_name,
          role,
          email
        )
      `)
      .eq('organization_id', organizationId);

    const teamSize = teamMembers?.length || 1;
    const isIndividual = teamSize === 1;

    console.log(`[generate-organizational-okrs] Equipo: ${teamSize} miembro(s), Individual: ${isIndividual}`);

    // 4. Obtener TODAS las tareas de esta fase
    const { data: phaseTasks } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        area,
        status,
        priority,
        user_id,
        task_completions (
          completed_by_user,
          validated_by_leader
        )
      `)
      .eq('organization_id', organizationId)
      .eq('phase', phaseNumber);

    const totalTasks = phaseTasks?.length || 0;
    const completedTasks = phaseTasks?.filter(t => 
      t.task_completions?.some((tc: { completed_by_user: boolean }) => tc.completed_by_user)
    ).length || 0;

    // Agrupar tareas por área
    const tasksByArea: Record<string, number> = {};
    phaseTasks?.forEach(task => {
      const area = task.area || 'general';
      tasksByArea[area] = (tasksByArea[area] || 0) + 1;
    });

    // 5. Obtener productos/servicios
    const productsServices = org.products_services || [];

    // 6. Preparar contexto para la IA
    const context = {
      organizacion: {
        nombre: org.name,
        industria: org.industry,
        modelo_negocio: org.business_model,
        metodologia: org.methodology || 'lean_startup',
        ventaja_competitiva: org.competitive_advantage,
        propuesta_valor: org.value_proposition,
        mercado_objetivo: org.geographic_market,
        objetivos_negocio: org.business_goals,
        retos_actuales: org.current_challenges
      },
      fase_actual: {
        numero: phase.phase_number,
        nombre: phase.phase_name,
        descripcion: phase.phase_description,
        objetivos_fase: phase.objectives,
        duracion_semanas: phase.duration_weeks,
        progreso_actual: phase.progress_percentage || 0
      },
      equipo: {
        tamano: teamSize,
        es_individual: isIndividual,
        roles: teamMembers?.map(tm => {
          const user = tm.users as { full_name?: string; role?: string } | null;
          return {
            nombre: user?.full_name || 'Usuario',
            rol: user?.role || tm.role
          };
        }) || []
      },
      tareas: {
        total: totalTasks,
        completadas: completedTasks,
        progreso_porcentaje: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        distribucion_por_area: tasksByArea
      },
      productos_servicios: productsServices.slice(0, 5)
    };

    // 7. Generar OKRs con IA
    const prompt = `Eres un experto en OKRs (Objectives and Key Results) organizacionales y estrategia empresarial.

CONTEXTO DE LA ORGANIZACIÓN Y FASE ACTUAL:
${JSON.stringify(context, null, 2)}

Tu tarea es generar 4 OBJETIVOS ORGANIZACIONALES DE FASE que:
1. Sean específicos para la fase "${phase.phase_name}" (Fase ${phaseNumber})
2. Estén alineados con las tareas y progreso actual del ${isIndividual ? 'emprendedor individual' : 'equipo'}
3. Sean DISTINTOS de los OKRs semanales personales (estos son estratégicos de organización)
4. Reflejen metas realistas para la duración de la fase (${phase.duration_weeks || 4} semanas)

${isIndividual ? `
ESCENARIO INDIVIDUAL (Autónomo/Emprendedor):
- Los objetivos deben ser alcanzables por UNA persona
- Enfócate en validación, aprendizaje y crecimiento personal del negocio
- Métricas más cualitativas y de validación
- Menos ambiciosos en números, más en aprendizaje
` : `
ESCENARIO EQUIPO (${teamSize} personas):
- Los objetivos pueden ser más ambiciosos
- Distribuye responsabilidades implícitamente
- Métricas cuantitativas más agresivas
- Considera colaboración y especialización
`}

Para CADA OBJETIVO genera:
- title: Título claro y motivador (máx 80 caracteres)
- description: Por qué este objetivo es importante para la fase (máx 200 caracteres)
- key_results: Array de 3 Key Results con:
  - title: Qué se va a lograr (máx 80 caracteres)
  - description: Cómo se medirá (máx 150 caracteres)
  - metric_type: "percentage" | "number" | "currency" | "boolean"
  - start_value: valor inicial (0 para nuevos)
  - target_value: valor objetivo realista para la fase
  - unit: unidad de medida (%, unidades, €, tareas, etc.)
  - weight: peso relativo (suma 100 entre los 3 KRs)

IMPORTANTE:
- Los OKRs deben ser REALISTAS para ${phase.duration_weeks || 4} semanas
- Alineados con la fase "${phase.phase_name}"
- ${isIndividual ? 'Adaptados a capacidad individual' : 'Aprovechando capacidad del equipo'}
- Enfocados en resultados medibles de ORGANIZACIÓN, no personales

Responde SOLO con un JSON válido con esta estructura:
{
  "objectives": [
    {
      "title": "...",
      "description": "...",
      "key_results": [...]
    }
  ]
}`;

    console.log('[generate-organizational-okrs] Llamando a Lovable AI Gateway...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Eres un experto en OKRs organizacionales. Responde SOLO con JSON válido, sin markdown.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[generate-organizational-okrs] AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    
    // Limpiar respuesta de markdown
    let cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let generatedOKRs;
    try {
      generatedOKRs = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('[generate-organizational-okrs] Parse error:', parseError, 'Content:', cleanContent);
      throw new Error('Error al parsear respuesta de IA');
    }

    console.log(`[generate-organizational-okrs] Generados ${generatedOKRs.objectives?.length || 0} objetivos`);

    // 8. Guardar OKRs en la base de datos
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + (phase.duration_weeks || 4) * 7);

    const createdObjectives = [];

    for (const obj of generatedOKRs.objectives || []) {
      // Crear objetivo organizacional (sin owner_user_id, con phase)
      const { data: newObjective, error: objError } = await supabase
        .from('objectives')
        .insert({
          organization_id: organizationId,
          title: obj.title,
          description: obj.description,
          quarter: `Fase ${phaseNumber}`,
          year: now.getFullYear(),
          status: 'active',
          target_date: targetDate.toISOString(),
          phase: phaseNumber,
          owner_user_id: null // Organizacional, no personal
        })
        .select()
        .single();

      if (objError) {
        console.error('[generate-organizational-okrs] Error creating objective:', objError);
        continue;
      }

      // Crear Key Results
      const keyResults = [];
      for (const kr of obj.key_results || []) {
        const { data: newKR, error: krError } = await supabase
          .from('key_results')
          .insert({
            objective_id: newObjective.id,
            title: kr.title,
            description: kr.description,
            metric_type: kr.metric_type || 'number',
            start_value: kr.start_value || 0,
            target_value: kr.target_value || 100,
            current_value: kr.start_value || 0,
            unit: kr.unit || 'unidades',
            weight: kr.weight || 33,
            status: 'on_track'
          })
          .select()
          .single();

        if (!krError && newKR) {
          keyResults.push(newKR);
        }
      }

      createdObjectives.push({
        ...newObjective,
        key_results: keyResults
      });
    }

    console.log(`[generate-organizational-okrs] Creados ${createdObjectives.length} objetivos con KRs`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Se generaron ${createdObjectives.length} OKRs organizacionales para la Fase ${phaseNumber}`,
        objectives: createdObjectives,
        context: {
          phase_name: phase.phase_name,
          team_size: teamSize,
          is_individual: isIndividual,
          total_tasks: totalTasks
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[generate-organizational-okrs] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Error desconocido',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
