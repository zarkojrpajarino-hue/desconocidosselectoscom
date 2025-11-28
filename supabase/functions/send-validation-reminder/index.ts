import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener todos los líderes únicos de tareas
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('leader_id')
      .not('leader_id', 'is', null);

    if (tasksError) throw tasksError;

    const leaderIds = [...new Set(tasks.map(t => t.leader_id))];

    let totalEmailsSent = 0;

    // Para cada líder, verificar si tiene tareas pendientes de validar
    for (const leaderId of leaderIds) {
      const { data: pendingTasks, error: pendingError } = await supabase
        .from('tasks')
        .select(`
          *,
          user:users!user_id(full_name),
          task_completions!inner(id, user_insights, completed_at)
        `)
        .eq('leader_id', leaderId)
        .eq('task_completions.validated_by_leader', false)
        .not('task_completions.user_insights', 'is', null);

      if (pendingError) throw pendingError;

      if (pendingTasks && pendingTasks.length > 0) {
        // Obtener info del líder
        const { data: leader, error: leaderError } = await supabase
          .from('users')
          .select('*')
          .eq('id', leaderId)
          .single();

        if (leaderError) throw leaderError;

        // Crear lista de primeras 4 tareas
        const tasksList = pendingTasks.slice(0, 4).map(task => {
          const completedDate = new Date(task.task_completions[0].completed_at);
          const hoursAgo = Math.floor((Date.now() - completedDate.getTime()) / (1000 * 60 * 60));
          
          return `
            <div style="border-bottom: 1px solid #e5e7eb; padding: 15px 0;">
              <div style="font-weight: bold; color: #1e40af;">${task.title}</div>
              <div style="color: #6b7280; font-size: 14px; margin-top: 5px;">
                👤 ${task.user.full_name} • 📁 ${task.area}
              </div>
              <div style="color: #9ca3af; font-size: 12px; margin-top: 5px;">
                ⏰ Completada hace ${hoursAgo} horas
              </div>
            </div>
          `;
        }).join('');

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0;
      padding: 0;
      background: #f5f5f5;
    }
    .container { 
      max-width: 600px; 
      margin: 20px auto; 
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .header { 
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); 
      color: white; 
      padding: 40px 30px; 
      text-align: center; 
    }
    .content { padding: 40px 30px; }
    .counter-box {
      background: #f0f9ff;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      padding: 30px;
      margin: 20px 0;
      text-align: center;
    }
    .counter-number {
      font-size: 48px;
      font-weight: bold;
      color: #1e40af;
    }
    .tasks-list {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .reminder-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .steps-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .step {
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .step:last-child {
      border-bottom: none;
    }
    .button { 
      display: inline-block; 
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); 
      color: white; 
      padding: 16px 40px; 
      text-decoration: none; 
      border-radius: 8px; 
      font-weight: bold;
      font-size: 16px;
      margin: 20px 0;
    }
    .footer { 
      text-align: center; 
      color: #6b7280; 
      font-size: 14px; 
      padding: 30px;
      background: #f9fafb;
    }
    h1 { margin: 0; font-size: 28px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 64px;">👥</div>
      <h1>Tareas Esperan Validación</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${leader.full_name}</strong>,</p>
      
      <p>Como líder, tienes tareas de colaboración esperando tu revisión:</p>
      
      <div class="counter-box">
        <div class="counter-number">${pendingTasks.length}</div>
        <div style="color: #6b7280; margin-top: 10px;">tareas pendientes de validar</div>
      </div>

      <div class="tasks-list">
        <h3 style="margin-top: 0;">📋 Tareas esperando tu feedback</h3>
        ${tasksList}
        ${pendingTasks.length > 4 ? `<div style="text-align: center; color: #6b7280; margin-top: 15px;">... y ${pendingTasks.length - 4} más</div>` : ''}
      </div>

      <div class="reminder-box">
        <strong>💡 Tu feedback ayuda al equipo a mejorar</strong>
      </div>

      <div class="steps-box">
        <h3 style="margin-top: 0;">¿Qué hacer al validar?</h3>
        <div class="step">✓ Revisa el trabajo completado</div>
        <div class="step">⭐ Asigna un rating de 1-5 estrellas</div>
        <div class="step">💬 Da feedback específico y constructivo</div>
        <div class="step">✅ Marca la tarea como validada</div>
      </div>
      
      <div style="text-align: center;">
        <a href="https://desconocidosselectos.com/login?redirect=/admin" class="button">Validar Tareas Ahora 🚀</a>
      </div>
    </div>
    <div class="footer">
      <p>Este es un correo automático del sistema de gestión de tareas</p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 10px;">
        Experiencia Selecta © 2024
      </p>
    </div>
  </div>
</body>
</html>
        `;

        await resend.emails.send({
          from: 'Desconocidos Selectos <tareas@desconocidosselectos.com>',
          to: leader.email,
          subject: `👥 Tienes ${pendingTasks.length} tareas esperando tu validación`,
          html: htmlContent
        });

        console.log(`Validation reminder sent to leader ${leader.email}`);
        totalEmailsSent++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: totalEmailsSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-validation-reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
