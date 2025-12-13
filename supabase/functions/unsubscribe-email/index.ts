// supabase/functions/unsubscribe-email/index.ts
/**
 * Unsubscribe Handler
 * Maneja darse de baja de emails - GDPR compliant
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const APP_NAME = 'OPTIMUS-K';
const APP_URL = Deno.env.get('APP_URL') || 'https://optimusk.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateData {
  weekly_summary?: boolean;
  daily_digest?: boolean;
  weekly_digest?: boolean;
  monthly_report?: boolean;
  milestone_reached?: boolean;
  task_overdue?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const emailType = url.searchParams.get('type') || 'all';

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Decode token (format: base64(userId:emailType))
    let userId: string;
    try {
      const decoded = atob(token);
      const [id] = decoded.split(':');
      userId = id;
    } catch {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Usuario no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Handle different unsubscribe types
    let updateData: UpdateData = {};

    switch (emailType) {
      case 'welcome':
        // Can't unsubscribe from welcome emails (transactional)
        return new Response(
          JSON.stringify({ 
            message: 'Los emails de bienvenida son transaccionales y no se pueden desactivar' 
          }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );

      case 'weekly-summary':
        updateData = { weekly_summary: false };
        break;

      case 'alerts':
        updateData = { task_overdue: false };
        break;

      case 'all':
        updateData = {
          weekly_summary: false,
          daily_digest: false,
          weekly_digest: false,
          monthly_report: false,
          milestone_reached: false
        };
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Tipo de email no válido' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
    }

    // Update preferences
    const { error } = await supabaseAdmin
      .from('user_notification_preferences')
      .update(updateData)
      .eq('user_id', userId);

    if (error) throw error;

    // Log unsubscribe
    await supabaseAdmin
      .from('email_unsubscribes')
      .insert({
        user_id: userId,
        email_type: emailType,
        unsubscribed_at: new Date().toISOString()
      })
      .catch(err => console.error('Error logging unsubscribe:', err));

    console.log(`User ${userId} unsubscribed from ${emailType}`);

    // Return HTML page confirming unsubscribe
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Suscripción Cancelada - ${APP_NAME}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 48px;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      color: #333;
      margin: 0 0 16px 0;
      font-size: 28px;
    }
    p {
      color: #666;
      line-height: 1.6;
      margin: 16px 0;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 24px;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 32px;
      text-decoration: none;
      border-radius: 8px;
      margin-top: 24px;
      font-weight: 600;
    }
    .button:hover {
      background: #764ba2;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">✅</div>
    <h1>Suscripción Cancelada</h1>
    <p>Hola <strong>${user.full_name || user.email}</strong>,</p>
    <p>
      ${emailType === 'all' 
        ? 'Has sido dado de baja de todos los emails de marketing y resúmenes.' 
        : `Has sido dado de baja de emails de tipo: <strong>${emailType}</strong>.`}
    </p>
    <p>
      Seguirás recibiendo emails transaccionales importantes como confirmaciones 
      y notificaciones de seguridad.
    </p>
    <p style="font-size: 14px; color: #999; margin-top: 32px;">
      Puedes actualizar tus preferencias en cualquier momento desde tu panel de control.
    </p>
    <a href="${APP_URL}/settings/notifications" class="button">
      Ir a Configuración
    </a>
  </div>
</body>
</html>
    `;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        ...corsHeaders,
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error en unsubscribe:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

Deno.serve(handler);
