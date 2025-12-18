import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============================================
// SISTEMA ADAPTATIVO DE TAREAS - VERSIÓN 10/10
// Basado en Lean Startup + Scaling Up
// ============================================

const PHASE_COMPLEXITY = {
  lean_startup: {
    phase_1_build: 45,
    phase_2_measure: 35,
    phase_3_learn: 40,
    phase_4_scale: 55
  },
  scaling_up: {
    phase_1_people: 50,
    phase_2_strategy: 42,
    phase_3_execution: 60,
    phase_4_cash: 45
  }
};

const MATURITY_MULTIPLIER: Record<string, number> = {
  idea: 0.5,
  mvp_development: 0.8,
  validating: 1.0,
  early_traction: 1.2,
  growth: 1.4,
  consolidated: 1.3,
  mature: 1.5,
  building: 0.8,
  traction: 1.2,
  scaling: 1.4,
  established: 1.3
};

function getTeamMultiplier(teamSize: number): number {
  if (teamSize === 1) return 1.3;
  if (teamSize <= 3) return 1.0;
  if (teamSize <= 10) return 0.9;
  if (teamSize <= 30) return 0.85;
  if (teamSize <= 100) return 0.8;
  return 0.8;
}

const INDUSTRY_MULTIPLIER: Record<string, number> = {
  saas: 1.0,
  technology: 1.0,
  ecommerce: 1.1,
  fintech: 1.3,
  healthtech: 1.4,
  marketplace: 1.2,
  consulting: 0.9,
  agency: 0.95,
  retail: 1.1,
  manufacturing: 1.3,
  education: 1.0,
  food_beverage: 1.05,
  real_estate: 1.1,
  logistics: 1.2,
  generic: 1.0
};

const RESOURCES_MULTIPLIER: Record<string, number> = {
  bootstrapped: 0.8,
  pre_seed: 0.9,
  seed: 1.0,
  series_a: 1.1,
  funded: 1.2,
  corporate: 1.3,
  self_funded: 0.8
};

const AVAILABILITY_MULTIPLIER: Record<string, number> = {
  part_time: 0.6,
  full_time: 1.0,
  overtime: 1.2
};

// Work modes eliminados - la IA genera todas las tareas necesarias para la fase

interface AdaptiveTaskResult {
  totalTasks: number;
  tasksPerPerson: number;
  breakdown: {
    baseComplexity: number;
    maturityMult: number;
    teamMult: number;
    industryMult: number;
    resourcesMult: number;
    availabilityMult: number;
    finalComplexity: number;
  };
}

function getPhaseKey(methodology: string, phaseNumber: number): string {
  const slugs: Record<string, string[]> = {
    lean_startup: ['build', 'measure', 'learn', 'scale'],
    scaling_up: ['people', 'strategy', 'execution', 'cash']
  };
  const slug = slugs[methodology]?.[phaseNumber - 1] || 'build';
  return `phase_${phaseNumber}_${slug}`;
}

function calculateAdaptiveTasks(input: {
  methodology: 'lean_startup' | 'scaling_up';
  phaseNumber: number;
  businessMaturity: string;
  teamSize: number;
  industry: string;
  fundingStage: string;
  teamAvailability: string;
}): AdaptiveTaskResult {
  // 1. Base de complejidad de la fase
  const phaseKey = getPhaseKey(input.methodology, input.phaseNumber);
  const methodologyPhases = PHASE_COMPLEXITY[input.methodology] as Record<string, number>;
  const baseComplexity = methodologyPhases[phaseKey] || 45;

  // 2. Obtener multiplicadores
  const maturityMult = MATURITY_MULTIPLIER[input.businessMaturity?.toLowerCase()] || 1.0;
  const teamMult = getTeamMultiplier(input.teamSize);
  const industryMult = INDUSTRY_MULTIPLIER[input.industry?.toLowerCase()] || 1.0;
  const resourcesMult = RESOURCES_MULTIPLIER[input.fundingStage?.toLowerCase()] || 1.0;
  const availabilityMult = AVAILABILITY_MULTIPLIER[input.teamAvailability?.toLowerCase()] || 1.0;

  // 3. Calcular complejidad ajustada
  let complexity = baseComplexity;
  complexity *= maturityMult;
  complexity *= teamMult;
  complexity *= industryMult;
  complexity *= resourcesMult;
  complexity *= availabilityMult;

  const finalComplexity = complexity;

  // 4. Convertir a tareas (4 puntos = 1 tarea) - Sin multiplicador de modo
  let totalTasks = complexity / 4;

  // 5. GUARDRAILS - límites saludables
  const minTasks = Math.max(4, Math.ceil(input.teamSize * 1.5));
  const maxTasks = Math.min(25, input.teamSize * 8);
  totalTasks = Math.max(minTasks, Math.min(maxTasks, totalTasks));
  totalTasks = Math.round(totalTasks);

  // 6. Tareas por persona (mínimo 1, máximo 12)
  let tasksPerPerson = totalTasks / input.teamSize;
  tasksPerPerson = Math.max(1, Math.min(12, tasksPerPerson));
  tasksPerPerson = Math.round(tasksPerPerson * 10) / 10;

  return {
    totalTasks,
    tasksPerPerson,
    breakdown: {
      baseComplexity,
      maturityMult,
      teamMult,
      industryMult,
      resourcesMult,
      availabilityMult,
      finalComplexity
    }
  };
}

function parseTeamSize(teamSize: string | number | undefined): number {
  if (typeof teamSize === 'number') return teamSize;
  if (!teamSize) return 1;
  
  const sizeMap: Record<string, number> = {
    '1': 1, 'solo': 1,
    '2-5': 3, '1-5': 3, 'small': 5,
    '6-10': 8, 'medium': 15,
    '11-20': 15, '21-30': 25,
    '21-50': 35, '31-50': 40,
    '51-100': 75, 'large': 100,
    '100+': 150
  };
  
  return sizeMap[teamSize.toLowerCase()] || parseInt(teamSize) || 5;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id } = await req.json();

    if (!organization_id) {
      return new Response(
        JSON.stringify({ error: "organization_id es requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Regenerating tasks for organization: ${organization_id}`);

    // 1. Obtener datos COMPLETOS de la organización
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("team_structure, is_startup, industry, team_size, business_stage, funding_stage")
      .eq("id", organization_id)
      .single();

    if (orgError) {
      console.error("Error fetching organization:", orgError);
    }

    const teamStructure: Array<{name: string, role: string, responsibilities: string}> = 
      Array.isArray(org?.team_structure) ? org.team_structure : [];

    // Determinar metodología
    const methodology: 'lean_startup' | 'scaling_up' = org?.is_startup !== false ? 'lean_startup' : 'scaling_up';
    
    // Parsear tamaño de equipo
    const teamSize = parseTeamSize(org?.team_size);

    console.log(`Organization context: methodology=${methodology}, teamSize=${teamSize}, industry=${org?.industry}, maturity=${org?.business_stage}`);

    // 2. Obtener TODOS los usuarios de la organización
    const { data: orgUsers } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("organization_id", organization_id);

    const userIds = orgUsers?.map(u => u.user_id) || [];
    const actualTeamSize = Math.max(userIds.length, teamSize);

    // 3. Obtener info de usuarios para hacer match con team_structure
    const { data: usersInfo } = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("id", userIds);

    // 4. Crear mapa de usuario a rol funcional
    const userRoleMap = new Map<string, string>();
    
    if (usersInfo && usersInfo.length > 0) {
      for (const user of usersInfo) {
        const teamMember = teamStructure.find(t => 
          t.name?.toLowerCase() === user.full_name?.toLowerCase() ||
          t.name?.toLowerCase().includes(user.full_name?.toLowerCase() || '') ||
          user.full_name?.toLowerCase().includes(t.name?.toLowerCase() || '')
        );
        
        if (teamMember) {
          const role = teamMember.role?.toLowerCase() || '';
          if (role.includes('ceo') || role.includes('director') || role.includes('fundador') || role.includes('founder')) {
            userRoleMap.set(user.id, 'ceo');
          } else if (role.includes('marketing') || role.includes('growth')) {
            userRoleMap.set(user.id, 'marketing');
          } else if (role.includes('venta') || role.includes('sales') || role.includes('comercial')) {
            userRoleMap.set(user.id, 'ventas');
          } else if (role.includes('operacion') || role.includes('operations')) {
            userRoleMap.set(user.id, 'operaciones');
          } else if (role.includes('product') || role.includes('desarrollo') || role.includes('dev') || role.includes('tech')) {
            userRoleMap.set(user.id, 'producto');
          } else {
            userRoleMap.set(user.id, 'general');
          }
        } else {
          userRoleMap.set(user.id, 'general');
        }
      }
    }

    // 5. Si no hay usuarios en la tabla users, crearlos desde auth.users
    let usersToAssign = userIds.filter(id => usersInfo?.some(u => u.id === id));
    
    if (usersToAssign.length === 0 && userIds.length > 0) {
      console.log("Users not found in users table, creating them...");
      
      for (const userId of userIds) {
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("id", userId)
          .maybeSingle();
        
        if (existingUser) {
          usersToAssign.push(userId);
          userRoleMap.set(userId, 'ceo');
          continue;
        }
        
        const { data: authUser } = await supabase.auth.admin.getUserById(userId);
        
        if (authUser?.user) {
          const { error: createUserError } = await supabase
            .from("users")
            .insert({
              id: userId,
              email: authUser.user.email,
              full_name: authUser.user.user_metadata?.full_name || authUser.user.email?.split('@')[0] || 'Usuario',
              role: 'member'
            });
          
          if (!createUserError) {
            usersToAssign.push(userId);
            userRoleMap.set(userId, 'ceo');
            console.log(`Created user ${userId}`);
          } else {
            console.error(`Error creating user ${userId}:`, createUserError);
          }
        }
      }
    }

    if (usersToAssign.length === 0) {
      return new Response(
        JSON.stringify({ error: "No se encontraron usuarios para asignar tareas" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${usersToAssign.length} users, team_structure has ${teamStructure.length} members`);

    // 6. Obtener fases existentes
    const { data: phases, error: phasesError } = await supabase
      .from("business_phases")
      .select("id, phase_number, phase_name, checklist, playbook, duration_weeks")
      .eq("organization_id", organization_id)
      .order("phase_number");

    if (phasesError || !phases || phases.length === 0) {
      console.error("Error fetching phases:", phasesError);
      return new Response(
        JSON.stringify({ error: "No se encontraron fases para la organización" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${phases.length} phases`);

    // 7. Eliminar tareas existentes generadas por AI (con phase_id)
    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("organization_id", organization_id)
      .not("phase_id", "is", null);

    if (deleteError) {
      console.error("Error deleting existing tasks:", deleteError);
    }

    // 8. SISTEMA ADAPTATIVO: Calcular tareas para CADA FASE
    const tasksToInsert: Array<{
      organization_id: string;
      phase_id: string;
      user_id: string;
      title: string;
      description: string;
      phase: number;
      area: string;
      order_index: number;
      task_category: string;
      estimated_hours: number;
      is_personal: boolean;
      playbook: Record<string, unknown>;
    }> = [];

    // Obtener preferencias de modo de trabajo del primer usuario (admin)
    const { data: userWeeklyData } = await supabase
      .from("user_weekly_data")
      .select("mode")
      .eq("user_id", usersToAssign[0])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const workMode = userWeeklyData?.mode || 'moderado';

    for (const phase of phases) {
      console.log(`Processing phase ${phase.phase_number}: ${phase.phase_name}`);

      // CALCULAR TAREAS ADAPTATIVAS PARA ESTA FASE
      const adaptiveResult = calculateAdaptiveTasks({
        methodology,
        phaseNumber: phase.phase_number,
        businessMaturity: org?.business_stage || 'validating',
        teamSize: actualTeamSize,
        industry: org?.industry || 'generic',
        fundingStage: org?.funding_stage || 'bootstrapped',
        teamAvailability: 'full_time'
      });

      console.log(`Adaptive calculation for phase ${phase.phase_number}:`, {
        totalTasks: adaptiveResult.totalTasks,
        tasksPerPerson: adaptiveResult.tasksPerPerson,
        breakdown: adaptiveResult.breakdown
      });

      // Handle checklist parsing
      let checklist: Array<{ task?: string; title?: string; name?: string; description?: string; category?: string; area?: string; functional_role?: string }> = [];
      
      if (!phase.checklist) {
        console.log(`Checklist is null/undefined for phase ${phase.phase_number}`);
        continue;
      }
      
      if (typeof phase.checklist === 'string') {
        try {
          checklist = JSON.parse(phase.checklist);
        } catch (e) {
          console.error(`Error parsing checklist for phase ${phase.phase_number}:`, e);
          continue;
        }
      } else if (Array.isArray(phase.checklist)) {
        checklist = phase.checklist;
      } else if (typeof phase.checklist === 'object') {
        checklist = Object.values(phase.checklist);
      } else {
        console.log(`Checklist has unexpected type for phase ${phase.phase_number}`);
        continue;
      }

      console.log(`Phase ${phase.phase_number} has ${checklist.length} checklist items`);

      // TARGET de tareas por persona basado en cálculo adaptativo
      const TARGET_TASKS_PER_PERSON = Math.round(adaptiveResult.tasksPerPerson);

      // Para CADA usuario, crear sus tareas personalizadas
      for (const userId of usersToAssign) {
        const userFunctionalRole = userRoleMap.get(userId) || 'general';
        
        // Filtrar tareas según el rol del usuario
        const userTasks = checklist.filter(item => {
          const taskRole = item.functional_role?.toLowerCase() || item.category?.toLowerCase() || 'general';
          
          if (userFunctionalRole === 'ceo' || userFunctionalRole === 'general') {
            return true;
          }
          
          return taskRole === userFunctionalRole || 
                 taskRole === 'general' || 
                 taskRole === 'equipo' ||
                 (userFunctionalRole === 'marketing' && taskRole === 'marketing') ||
                 (userFunctionalRole === 'ventas' && (taskRole === 'ventas' || taskRole === 'sales')) ||
                 (userFunctionalRole === 'operaciones' && taskRole === 'operaciones') ||
                 (userFunctionalRole === 'producto' && (taskRole === 'producto' || taskRole === 'product'));
        });

        // USAR TARGET ADAPTATIVO en lugar de 12 fijo
        let tasksForUser = userTasks.slice(0, TARGET_TASKS_PER_PERSON);
        
        // Si no hay suficientes tareas específicas, agregar del pool general
        if (tasksForUser.length < TARGET_TASKS_PER_PERSON) {
          const remaining = checklist.filter(item => !tasksForUser.includes(item));
          tasksForUser.push(...remaining.slice(0, TARGET_TASKS_PER_PERSON - tasksForUser.length));
        }
        
        // Si aún faltan tareas (checklist muy corto), duplicar con variaciones
        while (tasksForUser.length < TARGET_TASKS_PER_PERSON && checklist.length > 0) {
          const baseTask = checklist[tasksForUser.length % checklist.length];
          tasksForUser.push({
            ...baseTask,
            task: `${baseTask.task || baseTask.title || 'Tarea'} (avanzado ${tasksForUser.length + 1})`,
            functional_role: baseTask.functional_role || userFunctionalRole || 'general'
          });
        }

        tasksForUser.forEach((item, index) => {
          const taskTitle = item.task || item.title || item.name || `Tarea ${index + 1}`;
          const category = item.category || item.area || 'general';
          
          tasksToInsert.push({
            organization_id,
            phase_id: phase.id,
            user_id: userId,
            title: taskTitle,
            description: item.description || `Tarea de Fase ${phase.phase_number}: ${phase.phase_name}`,
            phase: phase.phase_number,
            area: category,
            order_index: index,
            task_category: category,
            estimated_hours: 2,
            is_personal: false,
            playbook: (phase.playbook as Record<string, unknown>) || {},
          });
        });

        console.log(`Prepared ${tasksForUser.length} tasks for user ${userId} (role: ${userFunctionalRole}, target: ${TARGET_TASKS_PER_PERSON})`);
      }
    }
    
    console.log(`Total tasks to insert: ${tasksToInsert.length}`);

    if (tasksToInsert.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No hay tareas para crear - los checklists están vacíos",
          tasks_created: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 9. Insertar tareas en lotes
    const BATCH_SIZE = 50;
    let totalCreated = 0;
    const errors: string[] = [];

    for (let i = 0; i < tasksToInsert.length; i += BATCH_SIZE) {
      const batch = tasksToInsert.slice(i, i + BATCH_SIZE);
      
      const { data: insertedTasks, error: tasksError } = await supabase
        .from("tasks")
        .insert(batch)
        .select('id');

      if (tasksError) {
        console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} insert error:`, tasksError);
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${tasksError.message}`);
      } else {
        const count = insertedTasks?.length || 0;
        totalCreated += count;
        console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: Created ${count} tasks`);
      }
    }

    console.log(`Total tasks created: ${totalCreated}`);

    // 10. Crear alerta de notificación con info del sistema adaptativo
    if (totalCreated > 0) {
      const tasksPerUser = Math.round(totalCreated / usersToAssign.length);
      await supabase.from("smart_alerts").insert({
        alert_type: 'tasks_regenerated',
        severity: 'info',
        title: '✅ Tareas Regeneradas (Sistema Adaptativo)',
        message: `Se han creado ${totalCreated} tareas para ${usersToAssign.length} usuario(s). ${tasksPerUser} tareas/persona basado en: ${methodology === 'lean_startup' ? 'Lean Startup' : 'Scaling Up'}, equipo de ${actualTeamSize}, modo ${workMode}.`,
        source: 'business_phases',
        category: 'planning',
        target_user_id: usersToAssign[0],
        actionable: true,
        metadata: { 
          phases_count: phases.length, 
          tasks_created: totalCreated,
          users_count: usersToAssign.length,
          tasks_per_user: tasksPerUser,
          methodology,
          team_size: actualTeamSize,
          work_mode: workMode,
          adaptive_system: 'v10'
        }
      });

      // 11. AUTO-GENERATE WEEKLY OKRs for each user
      console.log(`Auto-generating weekly OKRs for ${usersToAssign.length} users...`);
      const okrsGenerated: string[] = [];
      const okrErrors: string[] = [];

      for (const userId of usersToAssign) {
        try {
          // Call generate-personalized-krs for each user
          const okrResponse = await fetch(
            `${supabaseUrl}/functions/v1/generate-personalized-krs`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({ userId, autoGenerate: true }),
            }
          );

          if (okrResponse.ok) {
            okrsGenerated.push(userId);
            console.log(`Weekly OKRs generated for user ${userId}`);
          } else {
            const errorText = await okrResponse.text();
            okrErrors.push(`User ${userId}: ${errorText}`);
            console.error(`Failed to generate OKRs for user ${userId}:`, errorText);
          }
        } catch (okrErr) {
          okrErrors.push(`User ${userId}: ${okrErr instanceof Error ? okrErr.message : 'Unknown error'}`);
          console.error(`Error generating OKRs for user ${userId}:`, okrErr);
        }
      }

      console.log(`Weekly OKRs generated for ${okrsGenerated.length}/${usersToAssign.length} users`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        tasks_created: totalCreated,
        phases_processed: phases.length,
        users_processed: usersToAssign.length,
        tasks_per_user: Math.round(totalCreated / usersToAssign.length),
        adaptive_system: {
          methodology,
          team_size: actualTeamSize,
          work_mode: workMode,
          version: 'v10'
        },
        okrs_auto_generated: true,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Fatal error in regenerate-tasks-from-phases:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Error interno del servidor" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
