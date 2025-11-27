import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'npm:resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SwapConfirmationRequest {
  userId: string;
  swapId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, swapId }: SwapConfirmationRequest = await req.json();

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

    // Get swap details
    const { data: swap } = await supabaseAdmin
      .from('task_swaps')
      .select('*')
      .eq('id', swapId)
      .single();

    if (!swap) throw new Error('Swap no encontrado');

    const emailResponse = await resend.emails.send({
      from: 'Nova Tasks <onboarding@resend.dev>',
      to: [user.email],
      subject: '🔄 Confirmación de Intercambio de Tarea',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .swap-box { background: #faf5ff; border: 2px solid #e9d5ff; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .task-comparison { display: flex; justify-content: space-between; gap: 20px; margin: 20px 0; }
            .task-item { flex: 1; padding: 15px; border-radius: 6px; }
            .old-task { background: #fee2e2; border-left: 4px solid #ef4444; }
            .new-task { background: #d1fae5; border-left: 4px solid #10b981; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔄 Intercambio de Tarea Confirmado</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${user.full_name}</strong>,</p>
              
              <p>Te confirmamos que tu intercambio de tarea ha sido procesado exitosamente:</p>
              
              <div class="swap-box">
                <h3 style="margin-top: 0;">Detalles del Intercambio</h3>
                <p><strong>Modo:</strong> ${swap.mode}</p>
                <p><strong>Semana:</strong> ${swap.week_number}</p>
                
                <div class="task-comparison">
                  <div class="task-item old-task">
                    <h4 style="margin-top: 0;">❌ Tarea anterior</h4>
                    <p><strong>${swap.old_title}</strong></p>
                  </div>
                  <div class="task-item new-task">
                    <h4 style="margin-top: 0;">✅ Nueva tarea</h4>
                    <p><strong>${swap.new_title}</strong></p>
                    ${swap.new_description ? `<p style="font-size: 14px; color: #6b7280;">${swap.new_description}</p>` : ''}
                  </div>
                </div>
              </div>

              <p>Tu nueva tarea ya está activa en tu lista de tareas. Recuerda completarla antes del deadline de esta semana.</p>
              
              <div style="text-align: center;">
                <a href="${Deno.env.get('VITE_SUPABASE_URL')}/dashboard" class="button">Ver mis tareas</a>
              </div>

              <p>¡Mucho éxito con tu nueva tarea!</p>
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

    console.log('Email de confirmación de swap enviado:', emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error enviando confirmación de swap:', error);
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
