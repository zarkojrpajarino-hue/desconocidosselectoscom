import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

    // 1. Obtener datos de la organización (incluyendo team_structure)
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("team_structure")
      .eq("id", organization_id)
      .single();

    if (orgError) {
      console.error("Error fetching organization:", orgError);
    }

    const teamStructure: Array<{name: string, role: string, responsibilities: string}> = 
      Array.isArray(org?.team_structure) ? org.team_structure : [];

    // 2. Obtener TODOS los usuarios de la organización
    const { data: orgUsers } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("organization_id", organization_id);

    const userIds = orgUsers?.map(u => u.user_id) || [];

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
        // Verificar si ya existe
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
      .select("id, phase_number, phase_name, checklist, playbook")
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

    // 8. Crear tareas para CADA usuario según su rol funcional
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

    for (const phase of phases) {
      console.log(`Processing phase ${phase.phase_number}: ${phase.phase_name}`);

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

      // Para CADA usuario, crear sus tareas personalizadas
      for (const userId of usersToAssign) {
        const userFunctionalRole = userRoleMap.get(userId) || 'general';
        
        // Filtrar tareas según el rol del usuario
        const userTasks = checklist.filter(item => {
          const taskRole = item.functional_role?.toLowerCase() || item.category?.toLowerCase() || 'general';
          
          // CEO/general recibe todas las tareas
          if (userFunctionalRole === 'ceo' || userFunctionalRole === 'general') {
            return true;
          }
          
          // Otros usuarios reciben tareas de su área o generales
          return taskRole === userFunctionalRole || 
                 taskRole === 'general' || 
                 taskRole === 'equipo' ||
                 (userFunctionalRole === 'marketing' && taskRole === 'marketing') ||
                 (userFunctionalRole === 'ventas' && (taskRole === 'ventas' || taskRole === 'sales')) ||
                 (userFunctionalRole === 'operaciones' && taskRole === 'operaciones') ||
                 (userFunctionalRole === 'producto' && (taskRole === 'producto' || taskRole === 'product'));
        });

          // ASEGURAR EXACTAMENTE 12 TAREAS por usuario
          const TARGET_TASKS = 12;
          let tasksForUser = userTasks.slice(0, TARGET_TASKS);
          
          // Si no hay suficientes tareas específicas, agregar del pool general hasta llegar a 12
          if (tasksForUser.length < TARGET_TASKS) {
            const remaining = checklist.filter(item => !tasksForUser.includes(item));
            tasksForUser.push(...remaining.slice(0, TARGET_TASKS - tasksForUser.length));
          }
          
          // Si aún faltan tareas (checklist muy corto), duplicar con variaciones
          while (tasksForUser.length < TARGET_TASKS && checklist.length > 0) {
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

        console.log(`Prepared ${tasksForUser.length} tasks for user ${userId} (role: ${userFunctionalRole})`);
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

    // 10. Crear alerta de notificación
    if (totalCreated > 0) {
      await supabase.from("smart_alerts").insert({
        alert_type: 'tasks_regenerated',
        severity: 'info',
        title: '✅ Tareas Regeneradas',
        message: `Se han creado ${totalCreated} tareas para ${usersToAssign.length} usuario(s) desde las ${phases.length} fases.`,
        source: 'business_phases',
        category: 'planning',
        target_user_id: usersToAssign[0],
        actionable: true,
        metadata: { 
          phases_count: phases.length, 
          tasks_created: totalCreated,
          users_count: usersToAssign.length,
          tasks_per_user: Math.floor(totalCreated / usersToAssign.length)
        }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        tasks_created: totalCreated,
        phases_processed: phases.length,
        users_processed: usersToAssign.length,
        tasks_per_user: Math.floor(totalCreated / usersToAssign.length),
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
