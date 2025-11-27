import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeeklySummaryRequest {
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId }: WeeklySummaryRequest = await req.json();

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

    // Get user weekly data
    const { data: weeklyData } = await supabaseAdmin
      .from('user_weekly_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get all tasks
    const { data: tasks } = await supabaseAdmin
      .from('tasks')
      .select(`
        *,
        task_completions(*)
      `)
      .eq('user_id', userId);

    const completedTasks = tasks?.filter(task => 
      task.task_completions && task.task_completions.some((comp: any) => comp.completed_by_user)
    ) || [];

    const pendingTasks = tasks?.filter(task => 
      !task.task_completions || task.task_completions.length === 0 || 
      !task.task_completions.some((comp: any) => comp.completed_by_user)
    ) || [];

    const completionRate = tasks && tasks.length > 0 
      ? Math.round((completedTasks.length / tasks.length) * 100) 
      : 0;

    const emailResponse = await resend.emails.send({
      from: 'Nova Tasks <onboarding@resend.dev>',
      to: [user.email],
      subject: `📊 Resumen Semanal - ${completionRate}% completado`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .stats { display: flex; justify-content: space-around; margin: 30px 0; }
            .stat-box { text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px; flex: 1; margin: 0 10px; }
            .stat-number { font-size: 32px; font-weight: bold; color: #10b981; }
            .stat-label { color: #6b7280; font-size: 14px; margin-top: 5px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .progress-bar { width: 100%; height: 30px; background: #e5e7eb; border-radius: 15px; overflow: hidden; margin: 20px 0; }
            .progress-fill { height: 100%; background: linear-gradient(90deg, #10b981 0%, #059669 100%); transition: width 0.3s; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Tu Resumen Semanal</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${user.full_name}</strong>,</p>
              
              <p>Aquí está el resumen de tu desempeño esta semana:</p>
              
              <div class="stats">
                <div class="stat-box">
                  <div class="stat-number">${completedTasks.length}</div>
                  <div class="stat-label">Tareas Completadas</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${pendingTasks.length}</div>
                  <div class="stat-label">Tareas Pendientes</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${completionRate}%</div>
                  <div class="stat-label">Tasa de Completado</div>
                </div>
              </div>

              <h3>Progreso de la Semana</h3>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${completionRate}%;"></div>
              </div>

              <p><strong>Modo de trabajo:</strong> ${weeklyData?.mode || 'Standard'}</p>
              <p><strong>Límite de tareas:</strong> ${weeklyData?.task_limit || tasks?.length || 0}</p>

              ${completionRate === 100 ? 
                '<p style="background: #d1fae5; padding: 15px; border-radius: 6px; color: #065f46;"><strong>🎉 ¡Excelente trabajo!</strong> Has completado todas tus tareas esta semana.</p>' :
                pendingTasks.length > 0 ?
                `<p style="background: #fef3c7; padding: 15px; border-radius: 6px; color: #92400e;">⏰ <strong>Recuerda:</strong> Aún tienes ${pendingTasks.length} tarea${pendingTasks.length > 1 ? 's' : ''} pendiente${pendingTasks.length > 1 ? 's' : ''} por completar.</p>` :
                ''
              }
              
              <div style="text-align: center;">
                <a href="${Deno.env.get('VITE_SUPABASE_URL')}/login?redirect=/dashboard" class="button">Ver Dashboard</a>
              </div>

              <p>¡Sigue así!</p>
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

    console.log('Email de resumen semanal enviado:', emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error enviando resumen semanal:', error);
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
