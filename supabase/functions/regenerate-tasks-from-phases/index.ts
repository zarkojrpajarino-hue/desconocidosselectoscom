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

    // 1. Obtener admin de la organización
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("organization_id", organization_id)
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();

    if (!adminRole?.user_id) {
      return new Response(
        JSON.stringify({ error: "No se encontró admin para la organización" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminUserId = adminRole.user_id;
    console.log(`Admin found: ${adminUserId}`);

    // 2. Obtener fases existentes
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

    // 3. Eliminar tareas existentes generadas por AI (con phase_id)
    const { error: deleteError, count: deletedCount } = await supabase
      .from("tasks")
      .delete()
      .eq("organization_id", organization_id)
      .not("phase_id", "is", null);

    if (deleteError) {
      console.error("Error deleting existing tasks:", deleteError);
    } else {
      console.log(`Deleted ${deletedCount || 0} existing AI-generated tasks`);
    }

    // 4. Crear tareas desde el checklist de cada fase
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

      // Handle checklist - puede ser un string JSON o un array o un objeto JSONB
      let checklist: Array<{ task?: string; title?: string; name?: string; description?: string; category?: string; area?: string }> = [];
      
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

      if (checklist && checklist.length > 0) {
        for (let index = 0; index < checklist.length; index++) {
          const item = checklist[index];
          
          // Handle different item structures
          const taskTitle = item.task || item.title || item.name || `Tarea ${index + 1}`;
          const category = item.category || item.area || 'general';
          
          tasksToInsert.push({
            organization_id,
            phase_id: phase.id,
            user_id: adminUserId,
            title: taskTitle,
            description: item.description || `Tarea de ${category}`,
            phase: phase.phase_number,
            area: category,
            order_index: index,
            task_category: category,
            estimated_hours: 2,
            is_personal: false,
            playbook: (phase.playbook as Record<string, unknown>) || {},
          });
        }
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

    // 5. Insertar tareas en lotes para evitar timeouts
    const BATCH_SIZE = 20;
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

    // 6. Crear alerta para notificar
    if (totalCreated > 0) {
      await supabase.from("smart_alerts").insert({
        alert_type: 'tasks_regenerated',
        severity: 'info',
        title: '✅ Tareas Regeneradas',
        message: `Se han creado ${totalCreated} tareas desde las ${phases.length} fases de negocio.`,
        source: 'business_phases',
        category: 'planning',
        target_user_id: adminUserId,
        actionable: true,
        metadata: { phases_count: phases.length, tasks_created: totalCreated }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        tasks_created: totalCreated,
        phases_processed: phases.length,
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
