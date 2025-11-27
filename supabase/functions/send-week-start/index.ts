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
    // Verificar que RESEND_API_KEY existe
    const resendKey = Deno.env.get("RESEND_API_KEY");
    console.log("✅ RESEND_API_KEY configurada:", resendKey ? "Sí (oculta)" : "❌ NO ENCONTRADA");
    
    if (!resendKey) {
      throw new Error("RESEND_API_KEY no está configurada en las variables de entorno");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener todos los usuarios con su configuración semanal
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        *,
        user_weekly_data(mode, task_limit, week_deadline)
      `);

    if (usersError) throw usersError;

    const consejos = [
      "💡 Prioriza las 3 tareas más importantes cada día",
      "🎯 Establece bloques de tiempo dedicados para cada tarea",
      "🚀 Comienza con la tarea más difícil cuando tengas más energía",
      "⏰ Revisa tu progreso cada 48 horas",
      "🤝 Comunícate con tu líder si necesitas apoyo"
    ];

    const consejoSemanal = consejos[Math.floor(Math.random() * consejos.length)];

    console.log(`📧 Iniciando envío de emails a ${users.length} usuarios...`);
    
    let sentCount = 0;
    let errorCount = 0;

    // Helper function to delay between emails (avoid rate limits)
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Enviar email a cada usuario
    for (const user of users) {
      const weeklyData = user.user_weekly_data?.[0];
      
      // Si no tiene datos semanales, usar valores por defecto
      const taskLimit = weeklyData?.task_limit || 5;
      const mode = weeklyData?.mode || 'moderado';
      const deadline = weeklyData?.week_deadline 
        ? new Date(weeklyData.week_deadline)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 días desde ahora
      
      if (!weeklyData) {
        console.log(`⚠️ Usuario ${user.email} no tiene datos semanales, usando valores por defecto`);
      }

      const modeLabels: Record<string, string> = {
        'conservador': '🐢 Conservador',
        'moderado': '🚶 Moderado',
        'agresivo': '🚀 Agresivo'
      };

      // Helper function to delay between emails (avoid rate limits)
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 40px 30px; 
      text-align: center; 
    }
    .content { padding: 40px 30px; }
    .stats-box {
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .stat-row:last-child {
      border-bottom: none;
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
    .tip-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 64px;">🚀</div>
      <h1>¡Nueva semana comenzó!</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${user.full_name}</strong>,</p>
      
      <p>El nuevo ciclo semanal acaba de comenzar. Es momento de enfocarte en tus objetivos.</p>
      
      <div class="stats-box">
        <h3 style="margin-top: 0;">📊 Tu semana en números</h3>
        <div class="stat-row">
          <span><strong>Tareas asignadas:</strong></span>
          <span style="font-size: 24px; font-weight: bold; color: #667eea;">${taskLimit}</span>
        </div>
        <div class="stat-row">
          <span><strong>Modo de trabajo:</strong></span>
          <span>${modeLabels[mode] || mode}</span>
        </div>
        <div class="stat-row">
          <span><strong>Deadline:</strong></span>
          <span>${deadline.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${deadline.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <div class="tip-box">
        <strong>💡 Consejo de la semana:</strong><br>
        ${consejoSemanal}
      </div>

      <p><strong>Tienes 7 días para completar tus objetivos. ¡Vamos por ello!</strong></p>
      
      <div style="text-align: center;">
        <a href="https://7601fa16-c666-4f01-b370-6cee93c40cc0.lovableproject.com/login?redirect=/dashboard" class="button">Ver Mis Tareas 🎯</a>
      </div>
    </div>
    <div class="footer">
      <p>Este es un correo automático del sistema de gestión de tareas</p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 10px;">
        Desconocidos Selectos © 2024
      </p>
    </div>
  </div>
</body>
</html>
      `;

      console.log(`📤 Enviando email a: ${user.email} (${user.full_name})`);
      console.log(`   - Tareas: ${taskLimit}`);
      console.log(`   - Modo: ${mode}`);
      
      try {
        const response = await resend.emails.send({
          from: 'Desconocidos Selectos <tareas@desconocidosselectos.com>',
          to: user.email,
          subject: `🚀 Nueva semana comenzó - Tus ${taskLimit} tareas te esperan`,
          html: htmlContent
        });

        console.log(`✅ Email enviado exitosamente a ${user.email}`);
        console.log(`   Resend Response:`, JSON.stringify(response));
        sentCount++;
      } catch (emailError: any) {
        console.error(`❌ Error enviando email a ${user.email}:`, emailError);
        console.error(`   Error details:`, emailError.message || emailError);
        errorCount++;
      }

      // Delay de 700ms entre emails para evitar rate limits
      if (users.indexOf(user) < users.length - 1) {
        await delay(700);
      }
    }

    console.log(`\n📊 Resumen de envío:`);
    console.log(`   ✅ Enviados: ${sentCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log(`   📋 Total usuarios procesados: ${users.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        errors: errorCount,
        total: users.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-week-start:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
