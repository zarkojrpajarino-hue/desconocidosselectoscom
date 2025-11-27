import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WelcomeEmailRequest {
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId }: WelcomeEmailRequest = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error('Usuario no encontrado');
    }

    const emailResponse = await resend.emails.send({
      from: 'Nova Tasks <onboarding@resend.dev>',
      to: [user.email],
      subject: '¡Bienvenido a Nova Tasks! 🚀',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
            ul { padding-left: 20px; }
            li { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Bienvenido a Nova Tasks, ${user.full_name}! 🎉</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${user.full_name}</strong>,</p>
              
              <p>Estamos emocionados de tenerte en nuestro sistema de gestión de tareas. Nova Tasks te ayudará a organizar tu trabajo de manera eficiente y colaborativa.</p>
              
              <h3>¿Qué puedes hacer?</h3>
              <ul>
                <li>📋 <strong>Gestionar tus tareas:</strong> Visualiza y completa tus tareas asignadas</li>
                <li>🔄 <strong>Intercambiar tareas:</strong> Adapta tu carga de trabajo según tu modo</li>
                <li>📊 <strong>Ver tu progreso:</strong> Sigue tus estadísticas y rendimiento</li>
                <li>⏰ <strong>Cumplir deadlines:</strong> Recibe notificaciones oportunas</li>
                <li>✅ <strong>Evaluaciones:</strong> Recibe feedback de tus líderes de área</li>
              </ul>

              <p><strong>Tu rol:</strong> ${user.role === 'admin' ? 'Administrador' : 'Miembro del equipo'}</p>
              
              <div style="text-align: center;">
                <a href="${Deno.env.get('VITE_SUPABASE_URL')}/login" class="button">Acceder al Dashboard</a>
              </div>

              <p>Si tienes alguna pregunta, no dudes en contactar con tu equipo.</p>
              
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

    console.log('Email de bienvenida enviado:', emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error enviando email de bienvenida:', error);
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
