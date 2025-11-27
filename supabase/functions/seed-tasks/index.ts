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

    // Get system config to know current phase
    const { data: systemConfig } = await supabaseAdmin
      .from('system_config')
      .select('current_phase')
      .single();
    
    const currentPhase = systemConfig?.current_phase || 1;

    // Get all users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, username')
      .in('username', ['zarko', 'fer', 'miguel', 'fernando', 'angel', 'manu', 'casti', 'diego', 'carla']);

    if (usersError) throw usersError;

    const userMap = users.reduce((acc: any, user: any) => {
      acc[user.username] = user.id;
      return acc;
    }, {});

    // Clear existing tasks for all users for current phase
    await supabaseAdmin.from('tasks').delete().eq('phase', currentPhase);

    const tasks = [
      {
        title: 'Coordinar reunión semanal equipo completo',
        description: 'Organizar y liderar reunión semanal con todo el equipo',
        area: 'direccion',
        leader_id: null,
        order_index: 1,
      },
      {
        title: 'Revisar métricas clave semanales',
        description: 'Analizar KPIs principales del negocio',
        area: 'direccion',
        leader_id: null,
        order_index: 2,
      },
      {
        title: 'Optimizar web para conversión',
        description: 'Mejorar tasa de conversión de la landing page',
        area: 'leads',
        leader_id: userMap.fer,
        order_index: 3,
      },
      {
        title: 'Validar proceso completo orden a entrega',
        description: 'Asegurar proceso end-to-end funciona correctamente',
        area: 'operaciones',
        leader_id: userMap.miguel,
        order_index: 4,
      },
      {
        title: 'Definir KPIs por área y persona',
        description: 'Establecer métricas específicas por rol',
        area: 'direccion',
        leader_id: null,
        order_index: 5,
      },
      {
        title: 'Captar primeros 5 clientes B2B',
        description: 'Conseguir primeros clientes corporativos',
        area: 'ventas',
        leader_id: userMap.fernando,
        order_index: 6,
      },
      {
        title: 'Lanzar campaña Google Ads €300/mes',
        description: 'Activar primera campaña paid en Google',
        area: 'redes',
        leader_id: userMap.angel,
        order_index: 7,
      },
      {
        title: 'Establecer margen mínimo 34% por cesta',
        description: 'Optimizar costos para lograr margen objetivo',
        area: 'operaciones',
        leader_id: userMap.miguel,
        order_index: 8,
      },
      {
        title: 'Crear dashboard tiempo real Looker',
        description: 'Dashboard con métricas en vivo',
        area: 'analiticas',
        leader_id: userMap.manu,
        order_index: 9,
      },
      {
        title: 'Documentar procesos clave',
        description: 'SOPs de procesos principales',
        area: 'cumplimiento',
        leader_id: userMap.casti,
        order_index: 10,
      },
      {
        title: 'Testar 3 ideas nuevas producto/canal',
        description: 'Validar rápidamente nuevas ideas',
        area: 'innovacion',
        leader_id: userMap.diego,
        order_index: 11,
      },
      {
        title: 'Preparar pitch investors',
        description: 'Presentación para potenciales inversores',
        area: 'direccion',
        leader_id: null,
        order_index: 12,
      },
    ];

    // Insert tasks for ALL users with current phase
    const allTasksToInsert = [];
    
    for (const user of users) {
      const userTasks = tasks.map((task) => ({
        ...task,
        user_id: user.id,
        phase: currentPhase,
      }));
      allTasksToInsert.push(...userTasks);
    }

    const { error: insertError } = await supabaseAdmin
      .from('tasks')
      .insert(allTasksToInsert);

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: allTasksToInsert.length, 
        users: users.length,
        phase: currentPhase 
      }),
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
