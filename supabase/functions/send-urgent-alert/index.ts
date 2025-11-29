import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log("🔍 Buscando alertas urgentes pendientes de envío...");

    // Obtener alertas urgentes que requieren email y no han sido enviadas
    const { data: alerts, error: alertsError } = await supabase
      .from('smart_alerts')
      .select(`
        *,
        users!smart_alerts_target_user_id_fkey(email, full_name)
      `)
      .eq('severity', 'urgent')
      .eq('email_sent', true)
      .is('email_sent_at', null)
      .eq('dismissed', false);

    if (alertsError) {
      console.error("Error fetching alerts:", alertsError);
      throw alertsError;
    }

    if (!alerts || alerts.length === 0) {
      console.log("✅ No hay alertas urgentes pendientes de envío");
      return new Response(
        JSON.stringify({ success: true, sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📧 Enviando ${alerts.length} emails urgentes...`);

    let totalEmailsSent = 0;

    for (const alert of alerts) {
      try {
        const user = alert.users;
        if (!user || !user.email) {
          console.warn(`No email for alert ${alert.id}`);
          continue;
        }

        const context = alert.context || {};
        const hoursRemaining = Math.round(context.hours_remaining || 0);
        const pendingCount = context.pending_count || 0;
        const percentage = Math.round(context.percentage_pending || 0);

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
      <h1>${alert.title}</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${user.full_name}</strong>,</p>
      
      <div class="warning-box">
        <strong>${alert.message}</strong>
      </div>

      ${hoursRemaining > 0 ? `
      <div class="countdown-box">
        <div class="countdown-number">${hoursRemaining}h</div>
        <div style="color: #6b7280; font-size: 18px; margin-top: 10px;">horas restantes</div>
      </div>
      ` : ''}

      ${pendingCount > 0 ? `
      <p style="font-size: 18px; text-align: center; color: #dc2626;">
        <strong>${pendingCount} tareas pendientes (${percentage}%)</strong>
      </p>
      ` : ''}

      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0;">💡 Acciones recomendadas</h3>
        <div style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">✓ Prioriza las tareas más importantes</div>
        <div style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">💬 Comunícate con tu líder si necesitas apoyo</div>
        <div style="padding: 10px 0;">⏰ Dedica las próximas horas a completar</div>
      </div>

      <div style="text-align: center;">
        <a href="https://desconocidosselectos.com/login?redirect=/dashboard" class="button">
          ${alert.action_label || 'Ver Dashboard'} 🚀
        </a>
      </div>
    </div>
    <div class="footer">
      <p>Este es un correo automático del sistema de alertas inteligentes</p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 10px;">
        Desconocidos Selectos © 2024
      </p>
    </div>
  </div>
</body>
</html>
        `;

        await resend.emails.send({
          from: 'Alertas DS <alertas@desconocidosselectos.com>',
          to: user.email,
          subject: `🚨 ${alert.title}`,
          html: htmlContent
        });

        // Marcar como enviado
        await supabase
          .from('smart_alerts')
          .update({ email_sent_at: new Date().toISOString() })
          .eq('id', alert.id);

        console.log(`✅ Email enviado a ${user.email}`);
        totalEmailsSent++;
      } catch (emailError) {
        console.error(`Error sending email for alert ${alert.id}:`, emailError);
        // Continuar con las demás alertas
      }
    }

    console.log(`✅ Total de emails enviados: ${totalEmailsSent}`);

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
