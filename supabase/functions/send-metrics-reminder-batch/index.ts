import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting metrics reminder batch process...');

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('role', 'collaborator'); // Solo colaboradores, no admins

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    console.log(`Found ${users?.length || 0} users to check`);

    const notifications = [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const user of users || []) {
      // Check if user has updated metrics in the last 7 days
      const { data: recentMetrics, error: metricsError } = await supabase
        .from('business_metrics')
        .select('updated_at')
        .eq('user_id', user.id)
        .gte('updated_at', sevenDaysAgo.toISOString())
        .limit(1);

      if (metricsError) {
        console.error(`Error checking metrics for user ${user.id}:`, metricsError);
        continue;
      }

      // If no recent updates, send notification
      if (!recentMetrics || recentMetrics.length === 0) {
        console.log(`User ${user.full_name} needs metrics reminder`);
        
        notifications.push({
          user_id: user.id,
          type: 'metrics_reminder',
          message: '📊 Recuerda actualizar tus métricas de negocio (KPI\'s) para obtener análisis más precisos de la IA',
          read: false
        });
      }
    }

    // Insert notifications in batch
    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) {
        console.error('Error inserting notifications:', insertError);
        throw insertError;
      }

      console.log(`Sent ${notifications.length} metrics reminders`);
    } else {
      console.log('No reminders needed - all users are up to date!');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        remindersSent: notifications.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in metrics reminder batch:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
