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
            content: buildPrompt(context, isStartup, methodology)
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

    const { error: insertError } = await supabase
      .from("business_phases")
      .insert(phasesToInsert);

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Error guardando fases", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, phases: phasesToInsert, methodology }),
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

function buildPrompt(context: string, isStartup: boolean, methodology: string): string {
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

  return `
CONTEXTO DEL NEGOCIO:
${context}

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
          "current": 0
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
7. Responde SOLO con el JSON, sin texto adicional
`;
}
