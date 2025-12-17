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

    // 7. Obtener TODOS los usuarios de la organización para generar tareas personalizadas
    const { data: orgUsers } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("organization_id", organization_id);

    // 7.1 Obtener team_structure para mapear usuarios a roles funcionales
    const teamStructure: Array<{name: string, role: string, responsibilities: string}> = 
      Array.isArray(org.team_structure) ? org.team_structure : [];

    // 7.2 Obtener info de usuarios para hacer match con team_structure
    const userIds = orgUsers?.map(u => u.user_id) || [];
    const { data: usersInfo } = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("id", userIds);

    // 7.3 Crear mapa de usuario a rol funcional (usando los 10 roles de PREDEFINED_ROLES)
    // Roles disponibles: admin, marketing, ventas, finanzas, operaciones, producto, rrhh, legal, soporte, custom
    const userRoleMap = new Map<string, string>();
    
    // También necesitamos un mapa inverso: rol -> usuario (el "experto" de cada área para tareas colaborativas)
    const roleToUserMap = new Map<string, string>(); // rol -> userId del experto
    
    if (usersInfo) {
      for (const user of usersInfo) {
        // Buscar match en team_structure por nombre
        const teamMember = teamStructure.find(t => 
          t.name?.toLowerCase() === user.full_name?.toLowerCase() ||
          t.name?.toLowerCase().includes(user.full_name?.toLowerCase() || '') ||
          user.full_name?.toLowerCase().includes(t.name?.toLowerCase() || '')
        );
        
        let assignedRole = 'general';
        
        if (teamMember) {
          // Normalizar el rol funcional a uno de los 10 roles
          const role = teamMember.role?.toLowerCase() || '';
          if (role.includes('ceo') || role.includes('director') || role.includes('fundador') || role.includes('founder') || role.includes('admin')) {
            assignedRole = 'admin';
          } else if (role.includes('marketing') || role.includes('growth') || role.includes('redes') || role.includes('social')) {
            assignedRole = 'marketing';
          } else if (role.includes('venta') || role.includes('sales') || role.includes('comercial')) {
            assignedRole = 'ventas';
          } else if (role.includes('finanza') || role.includes('finance') || role.includes('contab') || role.includes('accounting')) {
            assignedRole = 'finanzas';
          } else if (role.includes('operacion') || role.includes('operations') || role.includes('logist')) {
            assignedRole = 'operaciones';
          } else if (role.includes('product') || role.includes('desarrollo') || role.includes('dev') || role.includes('tech') || role.includes('ux')) {
            assignedRole = 'producto';
          } else if (role.includes('rrhh') || role.includes('recurso') || role.includes('talento') || role.includes('hr') || role.includes('people')) {
            assignedRole = 'rrhh';
          } else if (role.includes('legal') || role.includes('jurídic') || role.includes('compliance')) {
            assignedRole = 'legal';
          } else if (role.includes('soporte') || role.includes('support') || role.includes('cliente') || role.includes('customer')) {
            assignedRole = 'soporte';
          } else {
            assignedRole = 'custom';
          }
        }
        
        userRoleMap.set(user.id, assignedRole);
        
        // El primer usuario con cada rol se convierte en el "experto" de esa área
        if (!roleToUserMap.has(assignedRole)) {
          roleToUserMap.set(assignedRole, user.id);
        }
      }
    }
    
    console.log(`Role mapping created: ${userRoleMap.size} users mapped, ${roleToUserMap.size} role experts identified`);

    // Si no hay usuarios, usar el admin como fallback
    let usersToAssign = userIds;
    if (usersToAssign.length === 0) {
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("organization_id", organization_id)
        .eq("role", "admin")
        .limit(1)
        .maybeSingle();
      
      if (adminRole?.user_id) {
        usersToAssign = [adminRole.user_id];
        userRoleMap.set(adminRole.user_id, 'ceo'); // Admin = CEO por defecto
      }
    }

    console.log(`Found ${usersToAssign.length} users to assign tasks, team_structure has ${teamStructure.length} members`);

    if (usersToAssign.length > 0 && insertedPhases) {
      // 8. Eliminar tareas existentes generadas por AI (con phase_id)
      const { error: deleteError } = await supabase
        .from("tasks")
        .delete()
        .eq("organization_id", organization_id)
        .not("phase_id", "is", null);
      
      if (deleteError) {
        console.error("Error deleting existing tasks:", deleteError);
      }

      // 8.1 Obtener preferencias de trabajo de cada usuario
      const { data: userPreferences } = await supabase
        .from("user_global_agenda_settings")
        .select("user_id, has_team, collaborative_percentage")
        .in("user_id", usersToAssign);

      // Crear mapa de preferencias
      const userPrefsMap = new Map<string, { has_team: boolean, collaborative_percentage: number }>();
      userPreferences?.forEach(pref => {
        userPrefsMap.set(pref.user_id, {
          has_team: pref.has_team ?? false,
          collaborative_percentage: pref.collaborative_percentage ?? 0
        });
      });

      console.log(`Loaded work preferences for ${userPrefsMap.size} users`);

      // 9. Crear tareas para CADA usuario según su rol funcional
      const tasksToInsert: any[] = [];
      
      for (const phase of insertedPhases) {
        console.log(`Processing phase ${phase.phase_number}: ${phase.phase_name}`);
        
        // Handle checklist - puede ser un string JSON o un array
        let checklist: any[] = [];
        if (typeof phase.checklist === 'string') {
          try {
            checklist = JSON.parse(phase.checklist);
          } catch (e) {
            console.error(`Error parsing checklist for phase ${phase.phase_number}:`, e);
            continue;
          }
        } else if (Array.isArray(phase.checklist)) {
          checklist = phase.checklist;
        } else {
          console.log(`Checklist is not an array for phase ${phase.phase_number}:`, typeof phase.checklist);
          continue;
        }
        
        console.log(`Phase ${phase.phase_number} has ${checklist.length} checklist items`);
        
        // Para CADA usuario, crear sus 12 tareas personalizadas según sus preferencias
        for (const userId of usersToAssign) {
          const userFunctionalRole = userRoleMap.get(userId) || 'general';
          
          // Obtener preferencias del usuario (default: individual si no tiene configuración)
          const userPrefs = userPrefsMap.get(userId) || { has_team: false, collaborative_percentage: 0 };
          
          // Filtrar tareas que corresponden al rol del usuario o son generales
          const userTasks = checklist.filter(item => {
            const taskRole = item.functional_role?.toLowerCase() || item.category?.toLowerCase() || 'general';
            
            // Si el usuario es admin/general, recibe tareas de cualquier rol
            if (userFunctionalRole === 'admin' || userFunctionalRole === 'general') {
              return true;
            }
            
            // Otros usuarios ven tareas de su área o generales
            return taskRole === userFunctionalRole || 
                   taskRole === 'general' || 
                   taskRole === 'equipo' ||
                   taskRole.includes(userFunctionalRole);
          });

          // ASEGURAR EXACTAMENTE 12 TAREAS por usuario
          const TARGET_TASKS = 12;
          let tasksForUser = userTasks.slice(0, TARGET_TASKS);
          
          // Si no hay suficientes tareas específicas, agregar del pool general hasta llegar a 12
          if (tasksForUser.length < TARGET_TASKS) {
            const remaining = checklist.filter(item => !tasksForUser.includes(item));
            // Shuffle remaining para variedad
            const shuffled = remaining.sort(() => Math.random() - 0.5);
            tasksForUser.push(...shuffled.slice(0, TARGET_TASKS - tasksForUser.length));
          }

          // Si aún faltan tareas (checklist muy corto), duplicar con variaciones
          while (tasksForUser.length < TARGET_TASKS && checklist.length > 0) {
            const baseTask = checklist[tasksForUser.length % checklist.length];
            tasksForUser.push({
              ...baseTask,
              task: `${baseTask.task || baseTask.title} (avanzado)`,
              functional_role: baseTask.functional_role || 'general'
            });
          }

          // USAR PREFERENCIAS DEL USUARIO para distribuir colaborativas/individuales
          let collaborativePercentage = 0;
          
          if (userPrefs.has_team) {
            // Usuario tiene equipo: usar su porcentaje configurado
            collaborativePercentage = userPrefs.collaborative_percentage / 100;
          } else {
            // Usuario individual/autónomo: 0% colaborativas, 100% individuales
            collaborativePercentage = 0;
          }
          
          const collaborativeCount = Math.round(tasksForUser.length * collaborativePercentage);
          
          console.log(`User ${userId}: has_team=${userPrefs.has_team}, collab=${collaborativePercentage * 100}%, creating ${collaborativeCount} collaborative + ${tasksForUser.length - collaborativeCount} individual tasks`);

          tasksForUser.forEach((item, index) => {
            const taskTitle = item.task || item.title || `Tarea ${index + 1}`;
            const taskCategory = item.functional_role?.toLowerCase() || item.category?.toLowerCase() || 'general';
            
            // Determinar si esta tarea es colaborativa o individual según preferencias
            const isCollaborative = userPrefs.has_team && index < collaborativeCount;
            
            // Para tareas colaborativas, encontrar el experto del área (líder)
            let leaderId = null;
            if (isCollaborative) {
              // El líder es el experto del área de la tarea
              let leaderRole = taskCategory;
              if (taskCategory === 'sales') leaderRole = 'ventas';
              if (taskCategory === 'product') leaderRole = 'producto';
              if (taskCategory === 'support') leaderRole = 'soporte';
              if (taskCategory === 'hr') leaderRole = 'rrhh';
              if (taskCategory === 'finance') leaderRole = 'finanzas';
              
              // Buscar el experto de esa área
              const expertId = roleToUserMap.get(leaderRole);
              
              // Si hay un experto Y no es el mismo usuario, asignarlo como líder
              if (expertId && expertId !== userId) {
                leaderId = expertId;
              } else {
                // Si el usuario ES el experto del área, buscar otro experto o un admin
                leaderId = roleToUserMap.get('admin') || usersToAssign.find(id => id !== userId) || null;
              }
            }
            // Para tareas individuales, leader_id queda null - el usuario trabaja solo

            tasksToInsert.push({
              organization_id,
              phase_id: phase.id,
              user_id: userId,
              leader_id: leaderId, // null para individuales, expertId para colaborativas
              title: taskTitle,
              description: isCollaborative 
                ? `Tarea colaborativa de Fase ${phase.phase_number}: ${phase.phase_name}. Trabaja con tu líder de ${taskCategory} para completarla.`
                : `Tarea individual de Fase ${phase.phase_number}: ${phase.phase_name}. Tarea de tu especialidad.`,
              phase: phase.phase_number,
              area: taskCategory,
              task_category: taskCategory || 'operaciones',
              order_index: index,
              estimated_hours: isCollaborative ? 3 : 2, // Colaborativas requieren más tiempo
              is_personal: !isCollaborative, // Individual = personal
              playbook: phase.playbook || {},
            });
          });
          
          const individualCount = tasksForUser.length - collaborativeCount;
          console.log(`Created ${tasksForUser.length} tasks for user ${userId} (role: ${userFunctionalRole}): ${collaborativeCount} collaborative, ${individualCount} individual`);
        }
      }

      console.log(`Total tasks to insert: ${tasksToInsert.length}`);

      if (tasksToInsert.length > 0) {
        // Insertar en batches para evitar timeouts
        const BATCH_SIZE = 50;
        let totalInserted = 0;
        
        for (let i = 0; i < tasksToInsert.length; i += BATCH_SIZE) {
          const batch = tasksToInsert.slice(i, i + BATCH_SIZE);
          const { data: insertedTasks, error: tasksError } = await supabase
            .from("tasks")
            .insert(batch)
            .select('id');

          if (tasksError) {
            console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} insert error:`, tasksError);
          } else {
            totalInserted += insertedTasks?.length || 0;
          }
        }
        
        console.log(`Successfully created ${totalInserted} tasks from phase checklists`);
      } else {
        console.log("No tasks to insert - checklists may be empty");
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
            owner_id: usersToAssign[0],
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
        target_user_id: usersToAssign[0],
        actionable: true,
        metadata: { phases_count: insertedPhases.length, tasks_count: tasksToInsert.length }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        phases: insertedPhases, 
        methodology,
        tasks_created: usersToAssign.length > 0
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
          "category": "marketing|ventas|producto|operaciones|equipo",
          "functional_role": "ceo|marketing|ventas|operaciones|producto|general"
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

REGLAS CRÍTICAS:
1. Cada fase debe tener 3-5 objetivos MEDIBLES
2. Cada fase debe tener EXACTAMENTE 12 tareas del checklist (ni más, ni menos)
3. Las 12 tareas deben tener functional_role variado para cubrir diferentes áreas:
   - admin (dirección, estrategia)
   - marketing (campañas, contenido, redes)
   - ventas (leads, pipeline, cierre)
   - finanzas (control, presupuestos)
   - operaciones (procesos, eficiencia)
   - producto (desarrollo, UX)
   - rrhh (equipo, cultura)
   - soporte (cliente, incidencias)
   - general (tareas transversales)
4. Objetivos y tareas deben ser ESPECÍFICOS para este negocio
5. Duraciones realistas (4-12 semanas por fase)
6. Los playbooks deben tener 5-8 pasos concretos
7. NO uses métricas genéricas, personaliza según el contexto
8. Si hay OKRs existentes, vincula los objectives usando "linked_kr_id"
9. Responde SOLO con el JSON, sin texto adicional
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
