// supabase/functions/send-welcome-email/index.ts
/**
 * Send Welcome Email - with Error Handler
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@4.0.0';
import { validateInput, WelcomeEmailSchema, validationErrorResponse, ValidationError } from '../_shared/validation.ts';
import { welcomeEmail, emailConfig } from '../_shared/email-templates.ts';
import { handleError, createErrorResponse } from '../_shared/errorHandler.ts';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FUNCTION_NAME = 'send-welcome-email';

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();

  try {
    // Validate CRON_SECRET for automated triggers
    const cronSecret = Deno.env.get('CRON_SECRET');
    const authHeader = req.headers.get('Authorization');
    
    // Check if it's a cron/internal call with secret
    const providedSecret = req.headers.get('x-cron-secret');
    const isCronCall = providedSecret && cronSecret && providedSecret === cronSecret;
    
    // Check if it's an authenticated admin call
    let isAdminCall = false;
    if (authHeader && !isCronCall) {
      const supabaseAuth = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: { headers: { Authorization: authHeader } }
        }
      );
      
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
      if (!authError && user) {
        const { data: roleData } = await supabaseAuth
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();
        
        isAdminCall = !!roleData;
      }
    }
    
    if (!isCronCall && !isAdminCall) {
      console.error(`[${FUNCTION_NAME}] Unauthorized: Missing valid CRON_SECRET or admin authentication (requestId: ${requestId})`);
      return createErrorResponse('Unauthorized', 401, corsHeaders);
    }

    // Validate input using schema
    const rawBody = await req.json();
    const { userId } = validateInput(WelcomeEmailSchema, rawBody);

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
      return createErrorResponse('Usuario no encontrado', 404, corsHeaders);
    }

    // Generate unsubscribe token
    const unsubscribeToken = btoa(`${user.id}:welcome`);

    // Generate email HTML using template
    const html = welcomeEmail({
      userName: user.full_name || user.email,
      userRole: user.role || 'member',
      dashboardUrl: `${emailConfig.appUrl}/dashboard`,
      unsubscribeToken: unsubscribeToken
    });

    // Send email with Resend
    const emailResponse = await resend.emails.send({
      from: emailConfig.fromEmail,
      to: [user.email],
      subject: `¡Bienvenido a ${emailConfig.appName}! 🚀`,
      html: html,
      headers: {
        'List-Unsubscribe': `<${emailConfig.appUrl}/unsubscribe?token=${unsubscribeToken}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      tags: [
        { name: 'category', value: 'welcome' },
        { name: 'user_id', value: user.id },
      ],
    });

    console.log(`[${FUNCTION_NAME}] ✅ Email de bienvenida enviado (requestId: ${requestId}):`, emailResponse);

    // Log email sent event
    try {
      const emailId = (emailResponse as { id?: string }).id || null;
      await supabaseAdmin
        .from('email_logs')
        .insert({
          user_id: user.id,
          email_type: 'welcome',
          email_id: emailId,
          sent_at: new Date().toISOString(),
          status: 'sent'
        });
    } catch (logError) {
      console.error(`[${FUNCTION_NAME}] Error logging email:`, logError);
    }

    return new Response(JSON.stringify({ ...emailResponse, requestId }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    // Handle validation errors
    if (error instanceof ValidationError) {
      return validationErrorResponse(error, corsHeaders);
    }
    
    await handleError(error, {
      functionName: FUNCTION_NAME,
      requestId,
      endpoint: '/send-welcome-email',
      method: req.method,
    });

    return createErrorResponse(
      error instanceof Error ? error.message : 'Unknown error',
      500,
      corsHeaders
    );
  }
};

Deno.serve(handler);
