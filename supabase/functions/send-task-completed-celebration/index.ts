import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CelebrationRequest {
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
    const { collaboratorId, taskId, leaderId, completionId }: CelebrationRequest = await req.json();

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

    // Obtener toda la información del completion
    const { data: completion } = await supabaseAdmin
      .from('task_completions')
      .select('*')
      .eq('id', completionId)
      .single();

    if (!collaborator || !task || !completion) {
      throw new Error('Datos no encontrados');
    }

    const feedback = completion.collaborator_feedback as any;
    const evaluation = completion.leader_evaluation as any;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .task-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .badge { display: inline-block; padding: 5px 10px; background: #10b981; color: white; border-radius: 5px; font-size: 12px; }
            .celebration { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .stars { color: #fbbf24; font-size: 24px; }
            .feedback-box { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #10b981; }
            .progress-complete { background: #10b981; color: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 20px; font-weight: bold; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #666; margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 ¡Tarea Completada!</h1>
              <p>Has alcanzado el 100%</p>
            </div>
            <div class="content">
              <p>¡Felicidades <strong>${collaborator.full_name}</strong>!</p>
              
              <div class="celebration">
                <h2 style="margin: 0; color: #059669;">🏆 ¡Excelente Trabajo! 🏆</h2>
                <p style="font-size: 18px; margin: 10px 0;">Tu tarea ha sido completada al 100%</p>
              </div>

              <div class="task-info">
                <h2>${task.title}</h2>
                ${task.area ? `<span class="badge">${task.area}</span>` : ''}
                ${task.description ? `<p style="color: #666; margin-top: 10px;">${task.description}</p>` : ''}
              </div>

              <div class="progress-complete">
                ✓ 100% COMPLETADA
              </div>

              <h3>📊 Resumen del Proceso</h3>
              <div class="feedback-box">
                <p><strong>1️⃣ Feedback al Líder (40%)</strong></p>
                <p>Completaste tu evaluación del liderazgo</p>
                ${evaluation ? `<div class="stars">${'★'.repeat(evaluation.stars)}${'☆'.repeat(5 - evaluation.stars)}</div>` : ''}
              </div>

              <div class="feedback-box">
                <p><strong>2️⃣ Tus Insights (50%)</strong></p>
                <p>Compartiste tus aprendizajes y contribuciones</p>
              </div>

              <div class="feedback-box">
                <p><strong>3️⃣ Feedback del Líder (90%)</strong></p>
                <p>${leader?.full_name || 'Tu líder'} evaluó tu trabajo</p>
                ${feedback ? `<div class="stars">${'★'.repeat(feedback.stars)}${'☆'.repeat(5 - feedback.stars)}</div>` : ''}
              </div>

              <div class="feedback-box">
                <p><strong>4️⃣ Validación Final (100%)</strong></p>
                <p>El líder completó todos los insights finales</p>
              </div>

              ${feedback ? `
                <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #0369a1; margin-top: 0;">💬 Comentarios de tu Líder</h3>
                  <p><strong>Aspectos destacados:</strong></p>
                  <p>${feedback.q1}</p>
                  <p><strong>Áreas de mejora:</strong></p>
                  <p>${feedback.q2}</p>
                  <p><strong>Sugerencias de desarrollo:</strong></p>
                  <p>${feedback.q3}</p>
                </div>
              ` : ''}

              <a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovableproject.com')}/dashboard" class="button">
                Ver Todas tus Tareas
              </a>

              <div class="footer">
                <p>¡Sigue así! Cada tarea completada te acerca más a tus objetivos.</p>
                <p style="color: #10b981; font-weight: bold; margin-top: 10px;">🌟 ¡Eres increíble! 🌟</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: 'Sistema de Tareas <onboarding@resend.dev>',
      to: [collaborator.email],
      subject: `🎉 ¡Felicidades! Completaste "${task.title}" al 100%`,
      html,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    console.log('Celebration email sent successfully:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-task-completed-celebration:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
