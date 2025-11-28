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

    // Obtener todos los usuarios con sus tareas
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        *,
        user_weekly_data(task_limit, week_deadline)
      `);

    if (usersError) throw usersError;

    let totalEmailsSent = 0;

    for (const user of users) {
      const weeklyData = user.user_weekly_data?.[0];
      if (!weeklyData) continue;

      const deadline = new Date(weeklyData.week_deadline);
      const now = new Date();
      const hoursRemaining = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));

      // Solo enviar si quedan menos de 24 horas
      if (hoursRemaining >= 24) continue;

      const taskLimit = weeklyData.task_limit;

      // Obtener tareas completadas validadas
      const { data: completions } = await supabase
        .from('task_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('validated_by_leader', true);

      const completedCount = completions?.length || 0;
      const pendingCount = taskLimit - completedCount;
      const percentage = Math.round((pendingCount / taskLimit) * 100);

      // Solo enviar si más del 50% está pendiente (cambio de 30% a 50%)
      if (percentage <= 50) continue;

      // Obtener primeras 3 tareas pendientes
      const { data: allTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('order_index');

      const completedTaskIds = completions?.map(c => c.task_id) || [];
      const pendingTasks = allTasks?.filter(t => !completedTaskIds.includes(t.id)) || [];
      const topPending = pendingTasks.slice(0, 3);

      const tasksList = topPending.map(task => `
        <li style="margin: 10px 0; padding: 10px; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
          <strong>${task.title}</strong>
          ${task.description ? `<br><span style="color: #6b7280; font-size: 14px;">${task.description}</span>` : ''}
        </li>
      `).join('');

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
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
      color: white; 
      padding: 40px 30px; 
      text-align: center; 
    }
    .content { padding: 40px 30px; }
    .countdown-box {
      background: #fee2e2;
      border: 3px solid #ef4444;
      border-radius: 8px;
      padding: 30px;
      margin: 20px 0;
      text-align: center;
    }
    .countdown-number {
      font-size: 72px;
      font-weight: bold;
      color: #dc2626;
      line-height: 1;
    }
    .warning-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .actions-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .action-item {
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .action-item:last-child {
      border-bottom: none;
    }
    .button { 
      display: inline-block; 
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
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
      <div style="font-size: 64px;">🚨</div>
      <h1>¡ALERTA URGENTE!</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${user.full_name}</strong>,</p>
      
      <div class="warning-box">
        <strong>⚠️ Quedan menos de 24 horas y tienes ${pendingCount} tareas pendientes (${percentage}%)</strong>
      </div>

      <div class="countdown-box">
        <div class="countdown-number">${hoursRemaining}h</div>
        <div style="color: #6b7280; font-size: 18px; margin-top: 10px;">horas restantes</div>
      </div>

      <h3 style="color: #dc2626;">📋 Primeras tareas pendientes:</h3>
      <ul style="list-style: none; padding: 0;">
        ${tasksList}
      </ul>

      <div class="actions-box">
        <h3 style="margin-top: 0;">💡 Acciones recomendadas</h3>
        <div class="action-item">✓ Prioriza las 3 tareas más importantes</div>
        <div class="action-item">💬 Comunícate con tu líder si necesitas apoyo</div>
        <div class="action-item">🔄 Considera usar un cambio de tarea si es necesario</div>
        <div class="action-item">⏰ Dedica las próximas horas a completar</div>
      </div>

      <div style="text-align: center;">
        <a href="https://desconocidosselectos.com/login?redirect=/dashboard" class="button">Completar Tareas AHORA 🚀</a>
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
        to: user.email,
        subject: `🚨 URGENTE - Quedan ${hoursRemaining} horas y tienes ${pendingCount} tareas pendientes`,
        html: htmlContent
      });

      console.log(`Urgent alert email sent to ${user.email}`);
      totalEmailsSent++;
    }

    return new Response(
      JSON.stringify({ success: true, sent: totalEmailsSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-urgent-alert:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
