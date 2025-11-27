import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EvaluationNotificationRequest {
  userId: string;
  taskId: string;
  completionId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, taskId, completionId }: EvaluationNotificationRequest = await req.json();

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

    // Get task details
    const { data: task } = await supabaseAdmin
      .from('tasks')
      .select('*, users!tasks_leader_id_fkey(full_name)')
      .eq('id', taskId)
      .single();

    if (!task) throw new Error('Tarea no encontrada');

    // Get completion with evaluation
    const { data: completion } = await supabaseAdmin
      .from('task_completions')
      .select('*')
      .eq('id', completionId)
      .single();

    if (!completion) throw new Error('Evaluación no encontrada');

    const evaluation = completion.leader_evaluation as any;
    const isValidated = completion.validated_by_leader;
    const leaderName = task.users?.full_name || 'Tu líder';

    const statusColor = isValidated ? '#10b981' : '#f59e0b';
    const statusBg = isValidated ? '#d1fae5' : '#fef3c7';
    const statusText = isValidated ? '✅ VALIDADA' : '⏳ PENDIENTE DE VALIDACIÓN';

    const emailResponse = await resend.emails.send({
      from: 'Nova Tasks <onboarding@resend.dev>',
      to: [user.email],
      subject: `📝 ${isValidated ? 'Evaluación Recibida' : 'Tarea en Revisión'} - ${task.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; background: ${statusBg}; color: ${statusColor}; }
            .task-box { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .evaluation-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📝 Notificación de Evaluación</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${user.full_name}</strong>,</p>
              
              <p>${leaderName} ha ${isValidated ? 'evaluado' : 'recibido'} tu tarea:</p>
              
              <div class="task-box">
                <h3 style="margin-top: 0;">${task.title}</h3>
                ${task.description ? `<p style="color: #6b7280;">${task.description}</p>` : ''}
                <p><strong>Área:</strong> ${task.area || 'N/A'}</p>
                <p><strong>Fase:</strong> ${task.phase}</p>
              </div>

              <div style="text-align: center; margin: 20px 0;">
                <span class="status-badge">${statusText}</span>
              </div>

              ${evaluation && isValidated ? `
                <div class="evaluation-box">
                  <h3 style="margin-top: 0;">Evaluación del Líder</h3>
                  ${evaluation.rating ? `<p><strong>Calificación:</strong> ${'⭐'.repeat(evaluation.rating)} (${evaluation.rating}/5)</p>` : ''}
                  ${evaluation.comments ? `<p><strong>Comentarios:</strong> ${evaluation.comments}</p>` : ''}
                  ${evaluation.suggestions ? `<p><strong>Sugerencias:</strong> ${evaluation.suggestions}</p>` : ''}
                </div>
              ` : `
                <p style="background: #fef3c7; padding: 15px; border-radius: 6px; color: #92400e;">
                  ⏳ Tu tarea está en revisión. Recibirás otra notificación cuando ${leaderName} complete la evaluación.
                </p>
              `}
              
              <div style="text-align: center;">
                <a href="${Deno.env.get('VITE_SUPABASE_URL')}/login?redirect=/dashboard" class="button">Ver Dashboard</a>
              </div>

              <p>${isValidated ? '¡Sigue con el excelente trabajo!' : 'Gracias por tu paciencia.'}</p>
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

    console.log('Email de notificación de evaluación enviado:', emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error enviando notificación de evaluación:', error);
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
