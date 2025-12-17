import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id, phase_number } = await req.json();

    if (!organization_id) {
      return new Response(
        JSON.stringify({ error: "organization_id es requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Checking phase completion for org: ${organization_id}, phase: ${phase_number}`);

    // 1. Obtener la fase activa actual
    const { data: activePhase, error: phaseError } = await supabase
      .from("business_phases")
      .select("*")
      .eq("organization_id", organization_id)
      .eq("status", "active")
      .single();

    if (phaseError || !activePhase) {
      console.log("No active phase found");
      return new Response(
        JSON.stringify({ completed: false, message: "No hay fase activa" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const currentPhaseNumber = activePhase.phase_number;

    // 2. Obtener todos los usuarios de la organización
    const { data: orgUsers, error: usersError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("organization_id", organization_id);

    if (usersError || !orgUsers || orgUsers.length === 0) {
      return new Response(
        JSON.stringify({ completed: false, message: "No hay usuarios en la organización" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userIds = orgUsers.map(u => u.user_id);
    console.log(`Found ${userIds.length} users in organization`);

    // 3. Obtener todas las tareas de la fase actual para estos usuarios
    const { data: phaseTasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id, user_id")
      .eq("organization_id", organization_id)
      .eq("phase", currentPhaseNumber)
      .in("user_id", userIds);

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      return new Response(
        JSON.stringify({ error: "Error obteniendo tareas" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!phaseTasks || phaseTasks.length === 0) {
      return new Response(
        JSON.stringify({ completed: false, message: "No hay tareas para esta fase" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const taskIds = phaseTasks.map(t => t.id);
    console.log(`Found ${taskIds.length} tasks for phase ${currentPhaseNumber}`);

    // 4. Obtener completaciones de estas tareas
    const { data: completions, error: completionsError } = await supabase
      .from("task_completions")
      .select("task_id, user_id, completed_by_user, validated_by_leader")
      .in("task_id", taskIds)
      .eq("completed_by_user", true);

    if (completionsError) {
      console.error("Error fetching completions:", completionsError);
      return new Response(
        JSON.stringify({ error: "Error obteniendo completaciones" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Verificar que TODAS las tareas estén completadas
    const completedTaskIds = new Set(completions?.map(c => c.task_id) || []);
    const allTasksCompleted = taskIds.every(taskId => completedTaskIds.has(taskId));

    console.log(`Completed: ${completedTaskIds.size}/${taskIds.length}, All completed: ${allTasksCompleted}`);

    if (!allTasksCompleted) {
      // Calcular progreso
      const progress = Math.round((completedTaskIds.size / taskIds.length) * 100);
      
      return new Response(
        JSON.stringify({ 
          completed: false, 
          progress,
          completedTasks: completedTaskIds.size,
          totalTasks: taskIds.length,
          message: `Fase ${currentPhaseNumber} al ${progress}% completada`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. ¡TODOS completaron! Activar siguiente fase
    console.log(`Phase ${currentPhaseNumber} COMPLETED! Activating next phase...`);

    // Marcar fase actual como completada
    const { error: completeError } = await supabase
      .from("business_phases")
      .update({ 
        status: "completed",
        progress_percentage: 100,
        actual_end: new Date().toISOString()
      })
      .eq("id", activePhase.id);

    if (completeError) {
      console.error("Error completing phase:", completeError);
    }

    // Activar siguiente fase
    const nextPhaseNumber = currentPhaseNumber + 1;
    const { data: nextPhase, error: nextPhaseError } = await supabase
      .from("business_phases")
      .update({ 
        status: "active",
        actual_start: new Date().toISOString()
      })
      .eq("organization_id", organization_id)
      .eq("phase_number", nextPhaseNumber)
      .select()
      .single();

    if (nextPhaseError) {
      console.log(`No next phase found (phase ${nextPhaseNumber}). All phases completed!`);
      
      // Crear alerta de todas las fases completadas
      await supabase.from("smart_alerts").insert({
        organization_id,
        alert_type: "all_phases_completed",
        severity: "opportunity",
        title: "🎉 ¡Todas las Fases Completadas!",
        message: "Tu equipo ha completado todas las fases del roadmap estratégico. ¡Felicitaciones!",
        source: "phase_system",
        category: "celebration",
        actionable: true,
        action_label: "Ver Resumen",
        action_url: "/dashboard"
      });

      return new Response(
        JSON.stringify({ 
          completed: true, 
          allPhasesCompleted: true,
          message: "¡Todas las fases han sido completadas!"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Generar nuevas tareas para la siguiente fase
    console.log(`Generating tasks for phase ${nextPhaseNumber}...`);
    
    // Invocar regenerate-tasks-from-phases
    const regenerateResponse = await fetch(`${supabaseUrl}/functions/v1/regenerate-tasks-from-phases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ organization_id }),
    });

    if (!regenerateResponse.ok) {
      console.error("Error regenerating tasks:", await regenerateResponse.text());
    }

    // 8. Crear alerta de nueva fase
    await supabase.from("smart_alerts").insert({
      organization_id,
      alert_type: "phase_completed",
      severity: "opportunity",
      title: `🚀 ¡Fase ${currentPhaseNumber} Completada!`,
      message: `Tu equipo completó todas las tareas. Ahora inicia la Fase ${nextPhaseNumber}: ${nextPhase.phase_name}`,
      source: "phase_system",
      category: "celebration",
      actionable: true,
      action_label: "Ver Nueva Fase",
      action_url: "/dashboard"
    });

    return new Response(
      JSON.stringify({ 
        completed: true, 
        previousPhase: currentPhaseNumber,
        newPhase: nextPhaseNumber,
        newPhaseName: nextPhase.phase_name,
        message: `¡Fase ${currentPhaseNumber} completada! Iniciando Fase ${nextPhaseNumber}`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in check-phase-completion:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
