import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Contraseñas específicas para cada usuario
    const passwords: Record<string, string> = {
      zarko: 'Zk8mP2xL!',
      angel: 'Ag7nW4qR!',
      carla: 'Cr5tY9sM!',
      miguel: 'Mg3vB6pN!',
      fer: 'Fr9hK2wJ!',
      fernando: 'Fn4dL7xQ!',
      manu: 'Mn8pT5yR!',
      casti: 'Cs6wM3nV!',
      diego: 'Dg2kH9xB!',
    };

    const users = [
      { username: 'zarko', email: 'zarko@experienciaselecta.com', full_name: 'Zarko', role: 'admin' },
      { username: 'angel', email: 'angel@experienciaselecta.com', full_name: 'Ángel', role: 'member' },
      { username: 'carla', email: 'carla@experienciaselecta.com', full_name: 'Carla', role: 'member' },
      { username: 'miguel', email: 'miguel@experienciaselecta.com', full_name: 'Miguel', role: 'member' },
      { username: 'fer', email: 'fer@experienciaselecta.com', full_name: 'Fer', role: 'member' },
      { username: 'fernando', email: 'fernando@experienciaselecta.com', full_name: 'Fernando', role: 'member' },
      { username: 'manu', email: 'manu@experienciaselecta.com', full_name: 'Manu', role: 'member' },
      { username: 'casti', email: 'casti@experienciaselecta.com', full_name: 'Casti', role: 'member' },
      { username: 'diego', email: 'diego@experienciaselecta.com', full_name: 'Diego', role: 'member' },
    ];

    // First, clear existing users
    await supabaseAdmin.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const results = [];

    for (const user of users) {
      // Create auth user with specific password
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: passwords[user.username],
        email_confirm: true,
      });

      if (authError) {
        results.push({ user: user.username, error: authError.message });
        continue;
      }

      // Insert into users table with auth user ID
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        });

      if (insertError) {
        results.push({ user: user.username, error: insertError.message });
      } else {
        results.push({ user: user.username, success: true, password: passwords[user.username] });
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});