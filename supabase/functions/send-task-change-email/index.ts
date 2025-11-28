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
    const { to_user_id, old_title, new_title, new_description, leader_name } = await req.json();
    
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
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin-top: 20px; }
            .task-box { background: white; padding: 20px; border-radius: 6px; margin: 15px 0; }
            .task-box.old { border-left: 4px solid #ef4444; }
            .task-box.new { border-left: 4px solid #10b981; }
            .label { font-weight: 600; color: #6b7280; margin-bottom: 8px; font-size: 12px; text-transform: uppercase; }
            .button { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 600; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🔄 Tu tarea fue actualizada</h1>
            </div>
            
            <div class="content">
              <p>Hola <strong>${user.full_name}</strong>,</p>
              <p><strong>${leader_name}</strong> actualizó tu tarea asignada.</p>
              
              <div class="task-box old">
                <div class="label">❌ Tarea Anterior</div>
                <p style="font-size: 16px; font-weight: 600; margin: 0;">${old_title}</p>
              </div>
              
              <div class="task-box new">
                <div class="label">✅ Nueva Tarea</div>
                <p style="font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">${new_title}</p>
                ${new_description ? `
                  <div class="label">Descripción:</div>
                  <p style="margin: 0;">${new_description}</p>
                ` : ''}
              </div>
              
              <p style="margin-top: 30px; background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
                ⚠️ <strong>Acción requerida:</strong> Revisa los nuevos objetivos y ajusta tu plan de trabajo.
              </p>
              
              <a href="${Deno.env.get('SITE_URL') || 'https://desconocidosselectos.com'}/dashboard" class="button">
                Ver Tarea Actualizada
              </a>
            </div>
            
            <div class="footer">
              <p>Equipo de Desconocidos Selectos</p>
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
        subject: `🔄 Actualización de tarea: ${new_title}`,
        html: emailHtml
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Resend API error:', data);
      throw new Error(data.message || 'Failed to send email');
    }

    console.log('Email sent successfully:', data);

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in send-task-change-email:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
