import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all admins
    const { data: admins } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('role', 'admin');

    if (!admins || admins.length === 0) {
      return new Response(JSON.stringify({ message: 'No hay administradores' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get all users
    const { data: allUsers } = await supabaseAdmin
      .from('users')
      .select('*');

    // Get all tasks with completions
    const { data: allTasks } = await supabaseAdmin
      .from('tasks')
      .select(`
        *,
        task_completions(*),
        users!tasks_user_id_fkey(full_name)
      `);

    // Calculate statistics
    const totalUsers = allUsers?.length || 0;
    const totalTasks = allTasks?.length || 0;
    const completedTasks = allTasks?.filter(task => 
      task.task_completions && task.task_completions.some((comp: any) => comp.completed_by_user)
    ).length || 0;
    const overallCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Group by user
    const userStats = allUsers?.map(user => {
      const userTasks = allTasks?.filter(task => task.user_id === user.id) || [];
      const userCompletedTasks = userTasks.filter(task => 
        task.task_completions && task.task_completions.some((comp: any) => comp.completed_by_user)
      ).length;
      const userCompletionRate = userTasks.length > 0 
        ? Math.round((userCompletedTasks / userTasks.length) * 100) 
        : 0;

      return {
        name: user.full_name,
        completed: userCompletedTasks,
        total: userTasks.length,
        rate: userCompletionRate
      };
    }).sort((a, b) => b.rate - a.rate) || [];

    const userStatsHTML = userStats.map(stat => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${stat.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${stat.completed}/${stat.total}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; background: ${stat.rate >= 80 ? '#d1fae5' : stat.rate >= 50 ? '#fef3c7' : '#fee2e2'}; color: ${stat.rate >= 80 ? '#065f46' : stat.rate >= 50 ? '#92400e' : '#991b1b'}; font-weight: bold;">
            ${stat.rate}%
          </span>
        </td>
      </tr>
    `).join('');

    // Send email to each admin
    for (const admin of admins) {
      await resend.emails.send({
        from: 'Nova Tasks <onboarding@resend.dev>',
        to: [admin.email],
        subject: `📊 Reporte Administrativo - ${overallCompletionRate}% completado general`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 700px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
              .stats { display: flex; justify-content: space-around; margin: 30px 0; }
              .stat-box { text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px; flex: 1; margin: 0 10px; }
              .stat-number { font-size: 32px; font-weight: bold; color: #6366f1; }
              .stat-label { color: #6b7280; font-size: 14px; margin-top: 5px; }
              .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th { background: #f9fafb; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
              .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📊 Reporte Administrativo</h1>
                <p style="margin: 0; opacity: 0.9;">Resumen del desempeño del equipo</p>
              </div>
              <div class="content">
                <p>Hola <strong>${admin.full_name}</strong>,</p>
                
                <p>Aquí está el reporte actualizado del desempeño del equipo:</p>
                
                <div class="stats">
                  <div class="stat-box">
                    <div class="stat-number">${totalUsers}</div>
                    <div class="stat-label">Usuarios Activos</div>
                  </div>
                  <div class="stat-box">
                    <div class="stat-number">${completedTasks}/${totalTasks}</div>
                    <div class="stat-label">Tareas Completadas</div>
                  </div>
                  <div class="stat-box">
                    <div class="stat-number">${overallCompletionRate}%</div>
                    <div class="stat-label">Tasa General</div>
                  </div>
                </div>

                <h3>Desempeño por Usuario</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th style="text-align: center;">Tareas</th>
                      <th style="text-align: center;">Completado</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${userStatsHTML}
                  </tbody>
                </table>

                ${overallCompletionRate >= 80 ? 
                  '<p style="background: #d1fae5; padding: 15px; border-radius: 6px; color: #065f46;"><strong>🎉 Excelente desempeño general!</strong> El equipo está cumpliendo con sus objetivos.</p>' :
                  overallCompletionRate >= 50 ?
                  '<p style="background: #fef3c7; padding: 15px; border-radius: 6px; color: #92400e;"><strong>⚠️ Desempeño moderado.</strong> Algunos miembros del equipo podrían necesitar apoyo.</p>' :
                  '<p style="background: #fee2e2; padding: 15px; border-radius: 6px; color: #991b1b;"><strong>🚨 Atención requerida.</strong> El equipo necesita seguimiento cercano.</p>'
                }
                
                <div style="text-align: center;">
                  <a href="${Deno.env.get('VITE_SUPABASE_URL')}/admin" class="button">Ver Panel Admin</a>
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
    }

    console.log(`Reporte administrativo enviado a ${admins.length} admin(s)`);

    return new Response(JSON.stringify({ message: `Enviado a ${admins.length} administrador(es)` }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error enviando reporte administrativo:', error);
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
