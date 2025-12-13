// supabase/functions/send-urgent-alert/index.ts
/**
 * Send Urgent Alert - CORREGIDO
 * Usa templates reutilizables con branding OPTIMUS-K
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@4.0.0';
import { urgentAlertEmail, emailConfig } from '../_shared/email-templates.ts';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UrgentAlertRequest {
  userId: string;
  alertTitle: string;
  alertMessage: string;
  severity?: 'high' | 'medium' | 'low';
  actionUrl?: string;
  actionLabel?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      userId,
      alertTitle,
      alertMessage,
      severity = 'medium',
      actionUrl,
      actionLabel
    }: UrgentAlertRequest = await req.json();

    // Authorization check
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedCronSecret = Deno.env.get('CRON_SECRET');
    const isScheduledJob = cronSecret && expectedCronSecret && cronSecret === expectedCronSecret;
    
    if (!isScheduledJob) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    }

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

    // Check user preferences for alerts
    const { data: prefs } = await supabaseAdmin
      .from('user_notification_preferences')
      .select('email_enabled')
      .eq('user_id', userId)
      .single();

    if (prefs && !prefs.email_enabled) {
      console.log('User has disabled email notifications');
      return new Response(
        JSON.stringify({ message: 'User has disabled email notifications' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Generate unsubscribe token
    const unsubscribeToken = btoa(`${user.id}:alerts`);

    // Generate email HTML
    const html = urgentAlertEmail({
      userName: user.full_name || user.email,
      alertTitle,
      alertMessage,
      severity,
      actionUrl,
      actionLabel,
      unsubscribeToken
    });

    // Email subject based on severity
    const subjectPrefix = {
      high: '🚨 URGENTE',
      medium: '⚠️ IMPORTANTE',
      low: 'ℹ️ AVISO'
    };

    // Send email
    const emailResponse = await resend.emails.send({
      from: emailConfig.fromEmail,
      to: [user.email],
      subject: `${subjectPrefix[severity]}: ${alertTitle}`,
      html,
      headers: {
        'List-Unsubscribe': `<${emailConfig.appUrl}/unsubscribe?token=${unsubscribeToken}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        ...(severity === 'high' && { 'X-Priority': '1' }),
      },
      tags: [
        { name: 'category', value: 'alert' },
        { name: 'severity', value: severity },
        { name: 'user_id', value: user.id },
      ],
    });

    console.log('Alert email enviado:', emailResponse);

    // Log email
    try {
      const emailId = (emailResponse as { id?: string }).id || null;
      await supabaseAdmin
        .from('email_logs')
        .insert({
          user_id: user.id,
          email_type: 'alert',
          email_id: emailId,
          sent_at: new Date().toISOString(),
          status: 'sent',
          metadata: { severity, alertTitle }
        });
    } catch (logError) {
      console.error('Error logging email:', logError);
    }

    // Also create in-app notification
    try {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'system',
          title: alertTitle,
          message: alertMessage,
          read: false
        });
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error enviando alert:', errorMessage);
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
