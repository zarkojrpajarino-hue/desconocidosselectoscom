import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // Get all users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id');

    if (usersError) throw usersError;

    const results = [];
    
    // Send reminder to each user
    for (const user of users || []) {
      try {
        const { error } = await supabaseAdmin.functions.invoke('send-task-reminder', {
          body: { userId: user.id }
        });
        
        if (error) {
          console.error(`Error sending reminder to ${user.id}:`, error);
          results.push({ userId: user.id, success: false, error: error.message });
        } else {
          results.push({ userId: user.id, success: true });
        }
      } catch (err) {
        console.error(`Failed to send reminder to ${user.id}:`, err);
        results.push({ userId: user.id, success: false, error: String(err) });
      }
    }

    console.log(`Sent ${results.filter(r => r.success).length}/${results.length} reminders`);

    return new Response(
      JSON.stringify({ 
        total: results.length, 
        successful: results.filter(r => r.success).length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in send-task-reminder-batch:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
};

Deno.serve(handler);
