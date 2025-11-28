import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to_user_id, task_title, hours_remaining } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: user } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', to_user_id)
      .single();

    if (!user?.email) {
      throw new Error('No email found for user');
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin-top: 20px; }
            .urgent-box { background: #fef2f2; border: 3px solid #dc2626; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .countdown { font-size: 48px; font-weight: 700; color: #dc2626; margin: 15px 0; }
            .button { display: inline-block; padding: 16px 32px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 700; font-size: 16px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 32px;">🚨🚨 URGENTE - DEADLINE INMINENTE</h1>
            </div>
            
            <div class="content">
              <p>Hola <strong>${user.full_name}</strong>,</p>
              
              <div class="urgent-box">
                <p style="font-size: 20px; font-weight: 600; margin: 0 0 10px 0; color: #dc2626;">
                  ⏰ TIEMPO RESTANTE
                </p>
                <div class="countdown">${hours_remaining}h</div>
                <p style="font-size: 18px; font-weight: 600; margin: 15px 0 0 0;">
                  Tu tarea está incompleta:
                </p>
                <p style="font-size: 20px; font-weight: 700; color: #dc2626; margin: 10px 0;">
                  "${task_title}"
                </p>
              </div>
              
              <div style="background: #fff; border-left: 4px solid #dc2626; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; font-weight: 600; font-size: 16px;">
                  🚨 Acción CRÍTICA requerida:
                </p>
                <ul style="margin: 15px 0; padding-left: 20px;">
                  <li>Prioriza esta tarea INMEDIATAMENTE</li>
                  <li>Completa feedback y medición de impacto</li>
                  <li>Solicita ayuda si es necesario</li>
                </ul>
              </div>
              
              <p style="text-align: center; margin-top: 30px; font-size: 18px; font-weight: 600; color: #dc2626;">
                ⚠️ El deadline NO será extendido
              </p>
              
              <div style="text-align: center;">
                <a href="${Deno.env.get('SITE_URL') || 'https://desconocidosselectos.com'}/dashboard" class="button">
                  COMPLETAR AHORA
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p>Equipo de Desconocidos Selectos</p>
              <p style="font-size: 12px; color: #dc2626;">Este es un recordatorio automático crítico</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Equipo DS <notificaciones@desconocidosselectos.com>',
        to: user.email,
        subject: `🚨🚨 URGENTE - ${hours_remaining}h restantes: ${task_title}`,
        html: emailHtml
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Resend API error:', data);
      throw new Error(data.message || 'Failed to send email');
    }

    console.log('Urgent email sent successfully:', data);

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in send-urgent-email:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
