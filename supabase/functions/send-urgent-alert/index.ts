import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UrgentAlertRequest {
  userId: string;
  taskId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, taskId }: UrgentAlertRequest = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user details
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user) throw new Error('Usuario no encontrado');

    // Get system config
    const { data: config } = await supabaseAdmin
      .from('system_config')
      .select('*')
      .single();

    if (!config) throw new Error('Configuración no encontrada');

    const deadline = new Date(config.week_deadline);
    const now = new Date();
    const hoursRemaining = Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));

    let taskInfo = '';
    if (taskId) {
      const { data: task } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();
      
      if (task) {
        taskInfo = `<p style="background: #fee2e2; padding: 15px; border-radius: 6px; color: #991b1b;"><strong>Tarea urgente:</strong> ${task.title}</p>`;
      }
    }

    const emailResponse = await resend.emails.send({
      from: 'Nova Tasks <onboarding@resend.dev>',
      to: [user.email],
      subject: `🚨 URGENTE: ${hoursRemaining}h restantes para el deadline`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; }
            .countdown { font-size: 48px; font-weight: bold; color: #ef4444; text-align: center; margin: 30px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 ¡ALERTA URGENTE!</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${user.full_name}</strong>,</p>
              
              <div class="alert-box">
                <p style="margin: 0;"><strong>⚠️ El deadline de esta semana está muy cerca</strong></p>
              </div>

              <div class="countdown">
                ${hoursRemaining}h
              </div>
              <p style="text-align: center; color: #6b7280;">horas restantes</p>

              ${taskInfo}

              <p>Es crucial que completes tus tareas pendientes lo antes posible para cumplir con el deadline semanal.</p>

              <h3>Acciones recomendadas:</h3>
              <ul>
                <li>✅ Revisa tus tareas pendientes inmediatamente</li>
                <li>⚡ Prioriza las tareas más importantes</li>
                <li>💬 Comunícate con tu líder si necesitas ayuda</li>
                <li>🔄 Considera usar un swap si es necesario</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${Deno.env.get('VITE_SUPABASE_URL')}/dashboard" class="button">Ir a mis tareas AHORA</a>
              </div>

              <p><strong>El equipo de Nova Tasks</strong></p>
            </div>
            <div class="footer">
              <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('Email de alerta urgente enviado:', emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error enviando alerta urgente:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

Deno.serve(handler);
