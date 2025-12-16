import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface PhaseObjective {
  name: string;
  metric: string;
  target: number;
  current: number;
  linked_kr_id?: string | null;
}

interface PhaseChecklistItem {
  task: string;
  completed: boolean;
  assigned_to?: string | null;
  linked_task_id?: string | null;
  category?: string;
}

interface PhasePlaybook {
  title: string;
  description: string;
  steps: string[];
  tips: string[];
  resources: string[];
}

interface GeneratedPhase {
  phase_number: number;
  phase_name: string;
  phase_description: string;
  methodology: 'lean_startup' | 'scaling_up' | 'hybrid';
  duration_weeks: number;
  objectives: PhaseObjective[];
  checklist: PhaseChecklistItem[];
  playbook: PhasePlaybook;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id, regenerate_phase } = await req.json();

    if (!organization_id) {
      return new Response(
        JSON.stringify({ error: "organization_id es requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Obtener datos de la organización
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", organization_id)
      .single();

    if (orgError || !org) {
      return new Response(
        JSON.stringify({ error: "Organización no encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1.5. Obtener OKRs existentes de la organización
    const { data: existingObjectives } = await supabase
      .from("objectives")
      .select(`
        id,
        title,
        description,
        quarter,
        year,
        status,
        key_results (
          id,
          title,
          description,
          metric_type,
          start_value,
          target_value,
          current_value,
          unit
        )
      `)
      .eq("organization_id", organization_id);

    const existingOKRs = existingObjectives || [];
    console.log(`Found ${existingOKRs.length} existing OKRs for organization`);

    // 2. Determinar si es startup o empresa consolidada
    const isStartup = org.business_stage === 'startup' || 
                      org.company_size === 'solo' || 
                      org.company_size === '2-5' ||
                      org.business_type === 'startup';

    // 3. Construir contexto específico para IA
    const context = buildContext(org, isStartup);
    const methodology = isStartup ? 'lean_startup' : 'scaling_up';

    // 4. Generar fases con Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Eres un consultor de negocios experto que usa metodología ${isStartup ? 'Lean Startup' : 'Scaling Up'}.
Genera 4 fases de negocio PERSONALIZADAS y REALISTAS.
RESPONDE SOLO EN JSON válido sin markdown.`
          },
          {
            role: "user",
            content: buildPrompt(context, isStartup, methodology, existingOKRs)
          }
        ]
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", errorText);
      return new Response(
        JSON.stringify({ error: "Error generando fases con IA", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content;
    
    if (!content) {
      return new Response(
        JSON.stringify({ error: "Respuesta vacía de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let phases: GeneratedPhase[];
    try {
      const parsed = JSON.parse(content);
      phases = parsed.phases || parsed;
    } catch (parseError) {
      console.error("Parse error:", parseError, "Content:", content);
      return new Response(
        JSON.stringify({ error: "Error parseando respuesta de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Si es regeneración de una fase específica, solo actualizar esa
    if (regenerate_phase) {
      const phaseToRegenerate = phases.find(p => p.phase_number === regenerate_phase);
      if (phaseToRegenerate) {
        const { error: updateError } = await supabase
          .from("business_phases")
          .update({
            phase_name: phaseToRegenerate.phase_name,
            phase_description: phaseToRegenerate.phase_description,
            objectives: phaseToRegenerate.objectives,
            checklist: phaseToRegenerate.checklist,
            playbook: phaseToRegenerate.playbook,
            duration_weeks: phaseToRegenerate.duration_weeks,
            regeneration_count: supabase.rpc('increment', { row_count: 1 }),
            last_regenerated_at: new Date().toISOString(),
          })
          .eq("organization_id", organization_id)
          .eq("phase_number", regenerate_phase);

        if (updateError) {
          console.error("Update error:", updateError);
        }

        return new Response(
          JSON.stringify({ success: true, phase: phaseToRegenerate }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 6. Eliminar fases existentes e insertar nuevas
    await supabase
      .from("business_phases")
      .delete()
      .eq("organization_id", organization_id);

    // Calcular fechas estimadas
    const today = new Date();
    let currentStartDate = today;

    const phasesToInsert = phases.map((phase, index) => {
      const estimatedStart = new Date(currentStartDate);
      const estimatedEnd = new Date(currentStartDate);
      estimatedEnd.setDate(estimatedEnd.getDate() + (phase.duration_weeks * 7));
      currentStartDate = estimatedEnd;

      return {
        organization_id,
        phase_number: phase.phase_number || index + 1,
        phase_name: phase.phase_name,
        phase_description: phase.phase_description,
        methodology,
        duration_weeks: phase.duration_weeks,
        estimated_start: estimatedStart.toISOString().split('T')[0],
        estimated_end: estimatedEnd.toISOString().split('T')[0],
        objectives: phase.objectives,
        checklist: phase.checklist,
        playbook: phase.playbook,
        status: index === 0 ? 'active' : 'pending',
        generated_by_ai: true,
        ai_context: context,
      };
    });

    const { data: insertedPhases, error: insertError } = await supabase
      .from("business_phases")
      .insert(phasesToInsert)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Error guardando fases", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Obtener admin de la organización para asignar tareas
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("organization_id", organization_id)
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();

    const adminUserId = adminRole?.user_id;

    if (adminUserId && insertedPhases) {
      // 8. Eliminar tareas existentes generadas por AI (con phase_id)
      await supabase
        .from("tasks")
        .delete()
        .eq("organization_id", organization_id)
        .not("phase_id", "is", null);

      // 9. Crear tareas reales desde el checklist de cada fase
      const tasksToInsert: any[] = [];
      
      for (const phase of insertedPhases) {
        const checklist = phase.checklist as any[];
        if (checklist && Array.isArray(checklist)) {
          checklist.forEach((item, index) => {
            tasksToInsert.push({
              organization_id,
              phase_id: phase.id,
              user_id: adminUserId,
              title: item.task,
              description: `Tarea de Fase ${phase.phase_number}: ${phase.phase_name}`,
              phase: phase.phase_number,
              area: item.category || 'general',
              task_category: item.category || 'operaciones',
              order_index: index,
              estimated_hours: 2, // Estimación por defecto
              is_personal: false,
              playbook: phase.playbook,
            });
          });
        }
      }

      if (tasksToInsert.length > 0) {
        const { error: tasksError } = await supabase
          .from("tasks")
          .insert(tasksToInsert);

        if (tasksError) {
          console.error("Tasks insert error:", tasksError);
          // No fallar completamente, las fases ya se crearon
        } else {
          console.log(`Created ${tasksToInsert.length} tasks from phase checklists`);
        }
      }

      // 10. Crear/vincular Key Results para los objetivos de cada fase
      const currentQuarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)}` as 'Q1' | 'Q2' | 'Q3' | 'Q4';
      const currentYear = new Date().getFullYear();

      // Buscar o crear un objetivo OKR principal para vincular los KRs
      let { data: mainObjective } = await supabase
        .from("objectives")
        .select("id")
        .eq("organization_id", organization_id)
        .eq("quarter", currentQuarter)
        .eq("year", currentYear)
        .limit(1)
        .maybeSingle();

      // Si no existe, crear uno
      if (!mainObjective) {
        const { data: newObj } = await supabase
          .from("objectives")
          .insert({
            organization_id,
            title: `Objetivos de Fases - ${currentQuarter} ${currentYear}`,
            description: "Objetivos generados automáticamente desde las fases de negocio",
            owner_id: adminUserId,
            quarter: currentQuarter,
            year: currentYear,
            status: "on_track",
            priority: "high",
            category: "growth"
          })
          .select()
          .single();
        mainObjective = newObj;
      }

      if (mainObjective) {
        // Para cada fase, crear KRs para objetivos sin linked_kr_id
        for (const phase of insertedPhases) {
          const objectives = phase.objectives as any[];
          const updatedObjectives: any[] = [];

          for (const obj of objectives || []) {
            if (!obj.linked_kr_id) {
              // Crear nuevo Key Result
              const { data: newKR } = await supabase
                .from("key_results")
                .insert({
                  objective_id: mainObjective.id,
                  title: obj.name,
                  description: `Fase ${phase.phase_number}: ${phase.phase_name}`,
                  metric_type: mapMetricType(obj.metric),
                  start_value: 0,
                  current_value: obj.current || 0,
                  target_value: obj.target,
                  unit: getUnitFromMetric(obj.metric),
                  weight: 1
                })
                .select()
                .single();

              if (newKR) {
                updatedObjectives.push({ ...obj, linked_kr_id: newKR.id });
                console.log(`Created KR: ${newKR.id} for objective: ${obj.name}`);
              } else {
                updatedObjectives.push(obj);
              }
            } else {
              updatedObjectives.push(obj);
            }
          }

          // Actualizar la fase con los linked_kr_id
          if (updatedObjectives.length > 0) {
            await supabase
              .from("business_phases")
              .update({ objectives: updatedObjectives })
              .eq("id", phase.id);
          }
        }
      }

      // 11. Crear alerta smart_alert para notificar al equipo
      await supabase.from("smart_alerts").insert({
        alert_type: 'phases_generated',
        severity: 'info',
        title: '🚀 Roadmap de Negocio Generado',
        message: `Se han creado ${insertedPhases.length} fases personalizadas con ${tasksToInsert.length} tareas para tu organización.`,
        source: 'business_phases',
        category: 'planning',
        target_user_id: adminUserId,
        actionable: true,
        metadata: { phases_count: insertedPhases.length, tasks_count: tasksToInsert.length }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        phases: insertedPhases, 
        methodology,
        tasks_created: adminUserId ? true : false
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: "Error interno del servidor", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildContext(org: any, isStartup: boolean): string {
  if (isStartup) {
    return `
TIPO: Startup / Empresa Nueva
INDUSTRIA: ${org.industry || 'No especificada'}
DESCRIPCIÓN: ${org.business_description || 'No especificada'}
ETAPA: ${org.startup_stage || org.business_type || 'Inicial'}
PRODUCTO/SERVICIO: ${JSON.stringify(org.products_services) || 'No especificado'}
CLIENTES ACTUALES: ${org.current_users_count || '0'}
OBJETIVO A CORTO PLAZO: ${org.short_term_goal || org.main_objectives || 'Validar producto'}
MAYOR DESAFÍO: ${org.biggest_challenge || 'Obtener primeros clientes'}
RECURSOS DISPONIBLES: ${JSON.stringify(org.available_resources) || 'Limitados'}
EQUIPO: ${JSON.stringify(org.team_structure) || 'Solo fundadores'}
PROPUESTA DE VALOR: ${org.value_proposition || 'No especificada'}
CLIENTES OBJETIVO: ${org.target_customers || 'No especificado'}
`.trim();
  }

  return `
TIPO: Empresa Consolidada
INDUSTRIA: ${org.industry || 'No especificada'}
DESCRIPCIÓN: ${org.business_description || 'No especificada'}
TAMAÑO: ${org.company_size || 'No especificado'}
INGRESOS ANUALES: ${org.annual_revenue_range || org.monthly_revenue_range || 'No especificado'}
PRODUCTO/SERVICIO: ${JSON.stringify(org.products_services) || 'No especificado'}
OBJETIVO 6-12 MESES: ${org.main_goal_6months || org.main_objectives || 'Crecer'}
MAYOR DESAFÍO: ${org.biggest_challenge || 'Escalar operaciones'}
ÁREAS A OPTIMIZAR: ${JSON.stringify(org.areas_to_optimize) || 'Ventas y operaciones'}
EQUIPO: ${JSON.stringify(org.team_structure) || 'No especificado'}
OBJETIVO FACTURACIÓN 12M: €${org.revenue_goal_12_months || 'No especificado'}
OBJETIVO CLIENTES 12M: ${org.customers_goal_12_months || 'No especificado'}
PROBLEMAS ACTUALES: ${org.current_problems || 'No especificados'}
`.trim();
}

function buildPrompt(context: string, isStartup: boolean, methodology: string, existingOKRs: any[]): string {
  const phaseGuidelines = isStartup ? `
FASES PARA STARTUP (Lean Startup):
- Fase 1: "Validación y MVP" (4-6 semanas) - Problem-Solution Fit
- Fase 2: "Primeros Clientes" (6-8 semanas) - Product-Market Fit
- Fase 3: "Tracción Inicial" (8-10 semanas) - Escala temprana
- Fase 4: "Escalado" (10-12 semanas) - Crecimiento sostenible

OBJETIVOS típicos para startup:
- Leads/usuarios registrados
- Entrevistas de validación
- Conversiones a pago
- MRR objetivo
- NPS/Satisfacción` : `
FASES PARA EMPRESA CONSOLIDADA (Scaling Up):
- Fase 1: "Optimización" (6-8 semanas) - Eficiencia operativa
- Fase 2: "Expansión Inicial" (8-10 semanas) - Nuevos mercados/productos
- Fase 3: "Crecimiento Acelerado" (10-12 semanas) - Escala agresiva
- Fase 4: "Consolidación" (8-12 semanas) - Sostenibilidad

OBJETIVOS típicos para empresa:
- Facturación mensual/trimestral
- Nuevos clientes
- Expansión geográfica
- Contrataciones
- Reducción de costos`;

  // Formatear OKRs existentes para el prompt
  let okrsContext = "";
  if (existingOKRs && existingOKRs.length > 0) {
    okrsContext = `
OKRs EXISTENTES EN LA ORGANIZACIÓN (DEBES vincular objectives a estos Key Results cuando sea relevante):
${existingOKRs.map(obj => {
  const krs = obj.key_results?.map((kr: any) => 
    `  - KR ID: "${kr.id}" | "${kr.title}" | Target: ${kr.target_value} ${kr.unit || ''}`
  ).join('\n') || '  (sin key results)';
  return `Objetivo: "${obj.title}" (${obj.status})
${krs}`;
}).join('\n\n')}

IMPORTANTE: Si un objetivo de fase coincide con un Key Result existente, usa su ID en "linked_kr_id".
`;
  }

  return `
CONTEXTO DEL NEGOCIO:
${context}
${okrsContext}
${phaseGuidelines}

GENERA exactamente 4 fases con la siguiente estructura JSON:

{
  "phases": [
    {
      "phase_number": 1,
      "phase_name": "Nombre descriptivo y motivador",
      "phase_description": "Descripción de 1-2 oraciones de qué se logra en esta fase",
      "methodology": "${methodology}",
      "duration_weeks": 6,
      "objectives": [
        {
          "name": "Objetivo específico con número",
          "metric": "leads|revenue|users|conversions|custom",
          "target": 100,
          "current": 0,
          "linked_kr_id": null
        }
      ],
      "checklist": [
        {
          "task": "Tarea específica y accionable",
          "completed": false,
          "category": "marketing|ventas|producto|operaciones|equipo"
        }
      ],
      "playbook": {
        "title": "Playbook de la Fase",
        "description": "Guía paso a paso",
        "steps": ["Paso 1...", "Paso 2..."],
        "tips": ["Consejo 1...", "Consejo 2..."],
        "resources": ["Recurso o herramienta recomendada"]
      }
    }
  ]
}

REGLAS:
1. Cada fase debe tener 3-5 objetivos MEDIBLES
2. Cada fase debe tener 8-12 tareas del checklist
3. Objetivos y tareas deben ser ESPECÍFICOS para este negocio
4. Duraciones realistas (4-12 semanas por fase)
5. Los playbooks deben tener 5-8 pasos concretos
6. NO uses métricas genéricas, personaliza según el contexto
7. Si hay OKRs existentes, vincula los objectives de fase usando "linked_kr_id" con el UUID del KR
8. Responde SOLO con el JSON, sin texto adicional
`;
}

// Helper functions for KR creation
function mapMetricType(metric: string): string {
  const typeMap: Record<string, string> = {
    'leads': 'number',
    'revenue': 'currency',
    'users': 'number',
    'conversions': 'percentage',
    'custom': 'number',
    'percentage': 'percentage',
    'money': 'currency',
    'count': 'number'
  };
  return typeMap[metric?.toLowerCase()] || 'number';
}

function getUnitFromMetric(metric: string): string {
  const unitMap: Record<string, string> = {
    'leads': 'leads',
    'revenue': '€',
    'users': 'usuarios',
    'conversions': '%',
    'percentage': '%',
    'money': '€',
    'custom': 'unidades',
    'count': 'unidades'
  };
  return unitMap[metric?.toLowerCase()] || 'unidades';
}
