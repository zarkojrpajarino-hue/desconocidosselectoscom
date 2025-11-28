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
    const { to_user_id, task_title, leader_name, feedback } = await req.json();
    
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

    const stars = '⭐'.repeat(feedback.rating || 5);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin-top: 20px; }
            .feedback-section { background: white; padding: 20px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #6366f1; }
            .feedback-label { font-weight: 600; color: #6366f1; margin-bottom: 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 600; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🎉 ¡Tu tarea fue validada!</h1>
            </div>
            
            <div class="content">
              <p>Hola <strong>${user.full_name}</strong>,</p>
              <p><strong>${leader_name}</strong> validó tu tarea: <strong>${task_title}</strong></p>
              
              <div class="feedback-section">
                <div class="feedback-label">¿Qué hizo bien?</div>
                <p>${feedback.whatWentWell || 'No especificado'}</p>
              </div>
              
              <div class="feedback-section">
                <div class="feedback-label">¿Qué puede mejorar?</div>
                <p>${feedback.whatToImprove || 'No especificado'}</p>
              </div>
              
              <div class="feedback-section">
                <div class="feedback-label">Cumplió tiempos:</div>
                <p>${feedback.metDeadlines === 'always' ? '✅ Siempre' : feedback.metDeadlines === 'almost_always' ? '👍 Casi siempre' : feedback.metDeadlines === 'sometimes' ? '⚠️ A veces' : feedback.metDeadlines === 'rarely' ? '⏰ Raramente' : '❌ No'}</p>
              </div>
              
              <div class="feedback-section">
                <div class="feedback-label">Valoración:</div>
                <p style="font-size: 24px; margin: 10px 0;">${stars}</p>
                <p><strong>${feedback.rating}/5</strong></p>
              </div>
              
              <p style="margin-top: 30px; font-size: 18px; font-weight: 600; color: #10b981;">
                ✅ Tu tarea está al 100% completada. ¡Excelente trabajo!
              </p>
              
              <a href="${Deno.env.get('SITE_URL') || 'https://desconocidosselectos.com'}/dashboard" class="button">
                Ver Dashboard
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
        subject: `✅ ${leader_name} validó tu tarea: ${task_title}`,
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
    console.error('Error in send-leader-validation-email:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
