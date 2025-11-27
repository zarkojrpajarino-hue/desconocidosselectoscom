import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReminderRequest {
  userId: string;
  taskId: string;
  completionId: string;
  isLeader: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, taskId, isLeader }: ReminderRequest = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obtener información del usuario
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    // Obtener información de la tarea
    const { data: task } = await supabaseAdmin
      .from('tasks')
      .select('title, description, area')
      .eq('id', taskId)
      .single();

    if (!user || !task) {
      throw new Error('Datos no encontrados');
    }

    const percentage = isLeader ? '90%' : '40%';
    const role = isLeader ? 'líder' : 'colaborador';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .task-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .badge { display: inline-block; padding: 5px 10px; background: #f59e0b; color: white; border-radius: 5px; font-size: 12px; }
            .alert { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .button { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #666; margin-top: 20px; font-size: 12px; }
            .progress { background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden; margin: 20px 0; }
            .progress-bar { background: #f59e0b; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Recordatorio de Insights</h1>
              <p>Tu tarea está pendiente de completar</p>
            </div>
            <div class="content">
              <p>Hola <strong>${user.full_name}</strong>,</p>
              <p>Te recordamos que tienes una tarea pendiente de completar los insights:</p>
              
              <div class="task-info">
                <h2>${task.title}</h2>
                ${task.area ? `<span class="badge">${task.area}</span>` : ''}
                ${task.description ? `<p style="color: #666; margin-top: 10px;">${task.description}</p>` : ''}
              </div>

              <div class="progress">
                <div class="progress-bar" style="width: ${percentage}">
                  ${percentage}
                </div>
              </div>

              <div class="alert">
                <strong>📝 Acción requerida</strong>
                <p>Como <strong>${role}</strong>, necesitas completar los 2 campos de insights para que la tarea avance al 100%.</p>
                <ul>
                  <li>¿Qué aprendiste de esta tarea?</li>
                  <li>¿Cómo contribuiste al objetivo?</li>
                </ul>
              </div>

              <p><strong>Sin los insights, la tarea no puede marcarse como completada.</strong></p>

              <a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovableproject.com')}/dashboard" class="button">
                Completar Insights Ahora
              </a>

              <div class="footer">
                <p>Este es un recordatorio automático del sistema de gestión de tareas.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: 'Sistema de Tareas <onboarding@resend.dev>',
      to: [user.email],
      subject: `⚠️ Recordatorio: Completa los insights de "${task.title}"`,
      html,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    console.log('Reminder email sent successfully:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-insights-reminder:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
