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

interface ValidationRequest {
  taskId: string;
  userId: string;
  completionId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskId, userId, completionId }: ValidationRequest = await req.json();
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener información de la tarea y usuarios
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`
        *,
        user:users!user_id(full_name, email),
        leader:users!leader_id(full_name)
      `)
      .eq('id', taskId)
      .single();

    if (taskError) throw taskError;

    // Obtener la evaluación del líder
    const { data: completion, error: completionError } = await supabase
      .from('task_completions')
      .select('leader_evaluation')
      .eq('id', completionId)
      .single();

    if (completionError) throw completionError;

    const evaluation = completion.leader_evaluation as any;
    const rating = evaluation?.rating || 5;
    const stars = '⭐'.repeat(rating);

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
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
      color: white; 
      padding: 40px 30px; 
      text-align: center; 
    }
    .content { padding: 40px 30px; }
    .task-box {
      background: #f0f9ff;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .task-title {
      font-size: 20px;
      font-weight: bold;
      color: #1e40af;
    }
    .rating-box {
      background: #fef3c7;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .stars {
      font-size: 36px;
      margin: 10px 0;
    }
    .feedback-box {
      background: #f9fafb;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .success-banner {
      background: #d1fae5;
      border: 2px solid #10b981;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
      color: #065f46;
      font-weight: bold;
      margin: 20px 0;
    }
    .button { 
      display: inline-block; 
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
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
      <div style="font-size: 64px;">⭐</div>
      <h1>¡Tarea Validada!</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${task.user.full_name}</strong>,</p>
      
      <p>Tu líder <strong>${task.leader?.full_name}</strong> ha revisado y validado tu tarea:</p>
      
      <div class="task-box">
        <div class="task-title">${task.title}</div>
      </div>

      <div class="rating-box">
        <div style="color: #6b7280; font-size: 14px;">Calificación</div>
        <div class="stars">${stars}</div>
        <div style="color: #6b7280; font-size: 14px;">${rating} de 5 estrellas</div>
      </div>

      ${evaluation?.feedback ? `
      <div class="feedback-box">
        <strong>💬 Feedback de ${task.leader?.full_name}</strong>
        <p>${evaluation.feedback}</p>
      </div>
      ` : ''}

      <div class="success-banner">
        ✅ Tarea marcada como completada al 100%
      </div>

      <p style="text-align: center;">¡Excelente trabajo! Sigue así.</p>
      
      <div style="text-align: center;">
        <a href="https://7601fa16-c666-4f01-b370-6cee93c40cc0.lovableproject.com/dashboard" class="button">Ver Mis Tareas 📋</a>
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
      to: task.user.email,
      subject: `⭐ ${task.leader?.full_name} validó tu tarea '${task.title}'`,
      html: htmlContent
    });

    console.log(`Leader validation email sent to ${task.user.email}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-leader-validation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
