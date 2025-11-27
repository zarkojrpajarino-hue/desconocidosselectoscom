import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  collaboratorId: string;
  taskId: string;
  leaderId: string;
  completionId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { collaboratorId, taskId, leaderId, completionId }: NotificationRequest = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obtener información del colaborador
    const { data: collaborator } = await supabaseAdmin
      .from('users')
      .select('email, full_name')
      .eq('id', collaboratorId)
      .single();

    // Obtener información del líder
    const { data: leader } = await supabaseAdmin
      .from('users')
      .select('full_name')
      .eq('id', leaderId)
      .single();

    // Obtener información de la tarea
    const { data: task } = await supabaseAdmin
      .from('tasks')
      .select('title, description, area')
      .eq('id', taskId)
      .single();

    // Obtener el feedback
    const { data: completion } = await supabaseAdmin
      .from('task_completions')
      .select('collaborator_feedback')
      .eq('id', completionId)
      .single();

    if (!collaborator || !task || !completion) {
      throw new Error('Datos no encontrados');
    }

    const feedback = completion.collaborator_feedback as any;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .task-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .badge { display: inline-block; padding: 5px 10px; background: #667eea; color: white; border-radius: 5px; font-size: 12px; }
            .feedback-section { margin: 20px 0; background: white; padding: 20px; border-radius: 8px; }
            .stars { color: #fbbf24; font-size: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #666; margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>👏 Feedback de tu Líder</h1>
              <p>Tu líder ha evaluado tu trabajo</p>
            </div>
            <div class="content">
              <p>Hola <strong>${collaborator.full_name}</strong>,</p>
              <p><strong>${leader?.full_name || 'Tu líder'}</strong> ha completado el feedback sobre tu trabajo en la tarea:</p>
              
              <div class="task-info">
                <h2>${task.title}</h2>
                ${task.area ? `<span class="badge">${task.area}</span>` : ''}
                ${task.description ? `<p style="color: #666; margin-top: 10px;">${task.description}</p>` : ''}
              </div>

              <div class="feedback-section">
                <h3>⭐ Feedback del Líder</h3>
                <div class="stars">${'★'.repeat(feedback.stars)}${'☆'.repeat(5 - feedback.stars)}</div>
                
                <h4>Aspectos destacados de tu colaboración:</h4>
                <p>${feedback.q1}</p>
                
                <h4>Áreas de mejora:</h4>
                <p>${feedback.q2}</p>
                
                <h4>Sugerencias para tu desarrollo:</h4>
                <p>${feedback.q3}</p>
              </div>

              <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <strong>🎯 Tarea al 90%</strong>
                <p>El líder está completando los últimos detalles. ¡Pronto estará al 100%!</p>
              </div>

              <a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovableproject.com')}/dashboard" class="button">
                Ver Tarea en el Dashboard
              </a>

              <div class="footer">
                <p>Este es un correo automático del sistema de gestión de tareas.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: 'Sistema de Tareas <onboarding@resend.dev>',
      to: [collaborator.email],
      subject: `👏 Feedback recibido de ${leader?.full_name || 'tu líder'} en "${task.title}"`,
      html,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-leader-feedback-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
