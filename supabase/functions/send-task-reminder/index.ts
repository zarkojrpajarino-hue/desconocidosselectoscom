import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'npm:resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaskReminderRequest {
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId }: TaskReminderRequest = await req.json();

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

    // Get pending tasks
    const { data: tasks } = await supabaseAdmin
      .from('tasks')
      .select(`
        *,
        task_completions(*)
      `)
      .eq('user_id', userId);

    const pendingTasks = tasks?.filter(task => 
      !task.task_completions || task.task_completions.length === 0 || 
      !task.task_completions.some((comp: any) => comp.completed_by_user)
    ) || [];

    if (pendingTasks.length === 0) {
      return new Response(JSON.stringify({ message: 'No hay tareas pendientes' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const tasksList = pendingTasks.map(task => 
      `<li><strong>${task.title}</strong> - Fase ${task.phase}${task.area ? ` (${task.area})` : ''}</li>`
    ).join('');

    const emailResponse = await resend.emails.send({
      from: 'Nova Tasks <onboarding@resend.dev>',
      to: [user.email],
      subject: `📋 Recordatorio: Tienes ${pendingTasks.length} tarea${pendingTasks.length > 1 ? 's' : ''} pendiente${pendingTasks.length > 1 ? 's' : ''}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .tasks-list { background: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0; }
            ul { padding-left: 20px; }
            li { margin: 10px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Recordatorio de Tareas</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${user.full_name}</strong>,</p>
              
              <p>Este es un recordatorio amistoso de que tienes <strong>${pendingTasks.length} tarea${pendingTasks.length > 1 ? 's' : ''} pendiente${pendingTasks.length > 1 ? 's' : ''}</strong> por completar:</p>
              
              <div class="tasks-list">
                <h3>Tareas pendientes:</h3>
                <ul>
                  ${tasksList}
                </ul>
              </div>

              <p>No olvides completarlas antes del deadline de esta semana para mantener tu progreso al día.</p>
              
              <div style="text-align: center;">
                <a href="${Deno.env.get('VITE_SUPABASE_URL')}/dashboard" class="button">Ver mis tareas</a>
              </div>

              <p>¡Mucho éxito!</p>
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

    console.log('Email de recordatorio enviado:', emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error enviando email de recordatorio:', error);
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
