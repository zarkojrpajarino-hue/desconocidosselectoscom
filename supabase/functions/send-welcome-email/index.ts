// supabase/functions/send-welcome-email/index.ts
/**
 * Send Welcome Email - CORREGIDO
 * Usa templates reutilizables con branding OPTIMUS-K
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@4.0.0';
import { validateInput, WelcomeEmailSchema, validationErrorResponse, ValidationError } from '../_shared/validation.ts';
import { welcomeEmail, emailConfig } from '../_shared/email-templates.ts';

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
        // Check if user is admin
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
      console.error('Unauthorized: Missing valid CRON_SECRET or admin authentication');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
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
      throw new Error('Usuario no encontrado');
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

    console.log('Email de bienvenida enviado:', emailResponse);

    // Log email sent event
    await supabaseAdmin
      .from('email_logs')
      .insert({
        user_id: user.id,
        email_type: 'welcome',
        email_id: emailResponse.id,
        sent_at: new Date().toISOString(),
        status: 'sent'
      })
      .catch(err => console.error('Error logging email:', err));

    return new Response(JSON.stringify(emailResponse), {
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
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error enviando email de bienvenida:', errorMessage);
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
