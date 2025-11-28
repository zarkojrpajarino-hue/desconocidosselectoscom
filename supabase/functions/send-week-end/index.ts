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

    // Obtener todos los usuarios con su configuración semanal
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        *,
        user_weekly_data(mode, task_limit)
      `);

    if (usersError) throw usersError;

    // Enviar email a cada usuario
    for (const user of users) {
      const weeklyData = user.user_weekly_data?.[0];
      if (!weeklyData) continue;

      const taskLimit = weeklyData.task_limit;

      // Obtener completadas validadas
      const { data: completions, error: completionsError } = await supabase
        .from('task_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('validated_by_leader', true);

      if (completionsError) throw completionsError;

      const completedCount = completions?.length || 0;
      const pendingCount = taskLimit - completedCount;
      const percentage = Math.round((completedCount / taskLimit) * 100);

      let feedback = "";
      let gradientColors = "";
      
      if (percentage >= 80) {
        feedback = `🎉 ¡Excelente trabajo! Has completado el ${percentage}% de tus tareas. ¡Sigue así!`;
        gradientColors = "#10b981 0%, #059669 100%";
      } else if (percentage >= 50) {
        feedback = `👍 Buen desempeño. Completaste ${percentage}% de tus tareas.`;
        gradientColors = "#3b82f6 0%, #2563eb 100%";
      } else {
        feedback = `💪 La próxima semana será mejor. Completaste ${percentage}%.`;
        gradientColors = "#f59e0b 0%, #d97706 100%";
      }

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
      background: linear-gradient(135deg, ${gradientColors}); 
      color: white; 
      padding: 40px 30px; 
      text-align: center; 
    }
    .content { padding: 40px 30px; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .stat-card {
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    .stat-number {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
      margin: 10px 0;
    }
    .stat-label {
      font-size: 14px;
      color: #6b7280;
    }
    .progress-bar {
      background: #e5e7eb;
      height: 30px;
      border-radius: 15px;
      overflow: hidden;
      margin: 20px 0;
      position: relative;
    }
    .progress-fill {
      background: linear-gradient(90deg, #667eea, #764ba2);
      height: 100%;
      width: ${percentage}%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      transition: width 1s ease;
    }
    .feedback-box {
      background: #f0f9ff;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .button { 
      display: inline-block; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
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
      <div style="font-size: 64px;">🏁</div>
      <h1>Semana Terminada</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${user.full_name}</strong>,</p>
      
      <p>La semana ha llegado a su fin. Aquí está tu resumen de desempeño:</p>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">✅ Completadas</div>
          <div class="stat-number">${completedCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">⏳ Pendientes</div>
          <div class="stat-number">${pendingCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">📊 Progreso</div>
          <div class="stat-number">${percentage}%</div>
        </div>
      </div>

      <div class="progress-bar">
        <div class="progress-fill">${percentage}%</div>
      </div>

      <div class="feedback-box">
        <strong>${feedback}</strong>
      </div>

      <p style="text-align: center; color: #6b7280;">
        ⏰ Próxima semana comienza en 3 horas
      </p>
      
      <div style="text-align: center;">
        <a href="https://desconocidosselectos.com/login?redirect=/dashboard" class="button">Ver Resumen Completo 📊</a>
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
        subject: `🏁 Semana terminada - Completaste ${completedCount}/${taskLimit} tareas (${percentage}%)`,
        html: htmlContent
      });

      console.log(`Week end email sent to ${user.email}`);
    }

    return new Response(
      JSON.stringify({ success: true, sent: users.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-week-end:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
