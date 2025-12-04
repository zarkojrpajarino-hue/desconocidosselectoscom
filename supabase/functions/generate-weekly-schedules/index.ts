import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface UserAvailability {
  user_id: string;
  full_name: string;
  username: string;
  mode: string;
  task_limit: number;
  availability: {
    monday: { available: boolean; start: string; end: string };
    tuesday: { available: boolean; start: string; end: string };
    wednesday: { available: boolean; start: string; end: string };
    thursday: { available: boolean; start: string; end: string };
    friday: { available: boolean; start: string; end: string };
    saturday: { available: boolean; start: string; end: string };
    sunday: { available: boolean; start: string; end: string };
  };
  preferred_hours_per_day: number;
  preferred_time_of_day: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  area: string;
  user_id: string;
  leader_id: string | null;
  phase: number;
}

interface ScheduledTask {
  task_id: string;
  user_id: string;
  scheduled_date: string;
  scheduled_start: string;
  scheduled_end: string;
  is_collaborative: boolean;
  collaborator_user_id?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate CRON_SECRET for automated triggers
    const cronSecret = Deno.env.get('CRON_SECRET');
    const providedSecret = req.headers.get('x-cron-secret');
    
    if (!providedSecret || providedSecret !== cronSecret) {
      console.error('Unauthorized: Missing or invalid CRON_SECRET');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log('🚀 Iniciando generación de agendas semanales...');

    // 1. Calcular próximo miércoles (week_start) - fecha de inicio de la semana
    const today = new Date();
    const dayOfWeek = today.getDay();
    const currentTime = today.getHours() * 100 + today.getMinutes();
    
    let daysUntilWednesday = (3 - dayOfWeek + 7) % 7;
    
    if (dayOfWeek === 3) {
      if (currentTime < 1330) {
        daysUntilWednesday = 0;
      } else {
        daysUntilWednesday = 7;
      }
    } else if (dayOfWeek > 3) {
      daysUntilWednesday = 7 - dayOfWeek + 3;
    }
    
    const nextWednesday = new Date(today);
    nextWednesday.setDate(today.getDate() + daysUntilWednesday);
    nextWednesday.setHours(0, 0, 0, 0);
    
    const weekStart = nextWednesday.toISOString().split('T')[0];
    console.log(`📅 Generando agenda para la semana del ${weekStart}`);

    // 2. 🔒 VERIFICACIÓN CRÍTICA: Comprobar que estamos en el período correcto de generación
    // La generación SOLO debe ocurrir el Lunes 13:01 (o puede ser invocada manualmente después)
    const isMonday = dayOfWeek === 1;
    const isAfterDeadline = currentTime >= 1301;
    const isBeforeWednesday = dayOfWeek < 3 || (dayOfWeek === 3 && currentTime < 1330);
    
    const canGenerate = isMonday && isAfterDeadline && isBeforeWednesday;
    
    console.log(`⏰ Verificación de período:`, {
      isMonday,
      currentTime,
      isAfterDeadline,
      isBeforeWednesday,
      canGenerate
    });

    // Si no estamos en el período correcto, informar
    if (!canGenerate && !req.url.includes('force=true')) {
      console.log('⏸️ Fuera del período de generación automática');
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'La generación automática solo ocurre el Lunes 13:01',
          current_period: dayOfWeek === 1 && currentTime >= 1330 ? 'reviewing' : 'filling',
          next_generation: 'Próximo Lunes 13:01'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. 🔒 VERIFICACIÓN CRÍTICA: Comprobar si TODOS completaron disponibilidad
    const { data: weekConfig, error: weekError } = await supabase
      .from('week_config')
      .select('*')
      .eq('week_start', weekStart)
      .maybeSingle();

    if (weekError) {
      console.error('❌ Error al verificar week_config:', weekError);
      throw weekError;
    }

    // Si no todos han completado, NO GENERAR y notificar
    if (!weekConfig || !weekConfig.all_users_ready) {
      console.log('⏸️ NO todos los usuarios completaron disponibilidad');
      console.log(`📊 Estado: ${weekConfig?.ready_count || 0}/${weekConfig?.total_users || 0} usuarios listos`);
      console.log(`👥 Pendientes: ${weekConfig?.users_pending?.join(', ') || 'Desconocido'}`);

      // Enviar notificaciones a usuarios que SÍ completaron
      const { data: completedUsers } = await supabase
        .from('user_weekly_availability')
        .select('user_id')
        .eq('week_start', weekStart);

      if (completedUsers && completedUsers.length > 0) {
        const pendingNames = weekConfig?.users_pending?.join(', ') || 'algunos usuarios';
        
        for (const record of completedUsers) {
          await supabase.from('smart_alerts').insert({
            alert_type: 'availability_pending',
            severity: 'important',
            title: '⏳ Esperando Disponibilidad del Equipo',
            message: `La agenda se generará cuando ${pendingNames} rellene su disponibilidad. ¡Recuérdale que el plazo es Lunes 13:30!`,
            source: 'scheduling',
            category: 'availability',
            target_user_id: record.user_id,
            actionable: false
          });
        }

        console.log(`📧 Alertas enviadas a ${completedUsers.length} usuarios`);
      }

      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Esperando a que todos los usuarios completen disponibilidad antes del Lunes 13:30',
          pending: weekConfig?.users_pending || [],
          ready: weekConfig?.ready_count || 0,
          total: weekConfig?.total_users || 0,
          deadline: 'Lunes 13:30'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ TODOS los usuarios completaron disponibilidad, procediendo con generación...');

    // 4. Obtener todos los usuarios con su disponibilidad
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, username');

    if (usersError) throw usersError;

    const userAvailabilities: UserAvailability[] = [];

    for (const user of users) {
      // Obtener disponibilidad horaria
      const { data: availability } = await supabase
        .from('user_weekly_availability')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .not('submitted_at', 'is', null)
        .single();

      // Obtener modo de trabajo y límite de tareas
      const { data: weeklyData } = await supabase
        .from('user_weekly_data')
        .select('mode, task_limit')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .single();

      if (availability && weeklyData) {
        userAvailabilities.push({
          user_id: user.id,
          full_name: user.full_name,
          username: user.username,
          mode: weeklyData.mode,
          task_limit: weeklyData.task_limit,
          availability: {
            monday: {
              available: availability.monday_available || false,
              start: availability.monday_start || '',
              end: availability.monday_end || '',
            },
            tuesday: {
              available: availability.tuesday_available || false,
              start: availability.tuesday_start || '',
              end: availability.tuesday_end || '',
            },
            wednesday: {
              available: availability.wednesday_available || false,
              start: availability.wednesday_start || '',
              end: availability.wednesday_end || '',
            },
            thursday: {
              available: availability.thursday_available || false,
              start: availability.thursday_start || '',
              end: availability.thursday_end || '',
            },
            friday: {
              available: availability.friday_available || false,
              start: availability.friday_start || '',
              end: availability.friday_end || '',
            },
            saturday: {
              available: availability.saturday_available || false,
              start: availability.saturday_start || '',
              end: availability.saturday_end || '',
            },
            sunday: {
              available: availability.sunday_available || false,
              start: availability.sunday_start || '',
              end: availability.sunday_end || '',
            },
          },
          preferred_hours_per_day: availability.preferred_hours_per_day || 4,
          preferred_time_of_day: availability.preferred_time_of_day || 'flexible',
        });
      }
    }

    if (userAvailabilities.length === 0) {
      console.log('⚠️ No hay usuarios con disponibilidad completa');
      return new Response(
        JSON.stringify({ message: 'No users have submitted availability yet' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`👥 ${userAvailabilities.length} usuarios con disponibilidad completa`);

    // 5. Obtener fase actual del sistema
    const { data: systemConfig } = await supabase
      .from('system_config')
      .select('current_phase')
      .single();

    const currentPhase = systemConfig?.current_phase || 1;

    // 6. Obtener todas las tareas pendientes para la fase actual
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('phase', currentPhase)
      .order('order_index');

    if (tasksError) throw tasksError;

    console.log(`📋 ${tasks.length} tareas disponibles en Fase ${currentPhase}`);

    // 7. Construir prompt para Lovable AI
    const prompt = buildAIPrompt(userAvailabilities, tasks, weekStart, currentPhase);

    // 8. Llamar a Lovable AI Gateway con tool calling
    console.log('🤖 Llamando a Lovable AI Gateway...');
    
    const aiPayload = {
      model: 'google/gemini-2.5-pro',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'generate_weekly_schedules',
            description: 'Genera las agendas coordinadas semanales para el equipo',
            parameters: {
              type: 'object',
              properties: {
                scheduled_tasks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      task_id: { type: 'string', description: 'UUID de la tarea' },
                      user_id: { type: 'string', description: 'UUID del usuario' },
                      scheduled_date: { type: 'string', description: 'Fecha en formato YYYY-MM-DD' },
                      scheduled_start: { type: 'string', description: 'Hora de inicio HH:MM' },
                      scheduled_end: { type: 'string', description: 'Hora de fin HH:MM' },
                      is_collaborative: { type: 'boolean', description: 'Si es tarea colaborativa' },
                      collaborator_user_id: { type: 'string', description: 'UUID del colaborador (opcional)' },
                    },
                    required: ['task_id', 'user_id', 'scheduled_date', 'scheduled_start', 'scheduled_end', 'is_collaborative'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['scheduled_tasks'],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: 'function', function: { name: 'generate_weekly_schedules' } },
    };

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aiPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit excedido. Intenta nuevamente en unos minutos.');
      }
      if (response.status === 402) {
        throw new Error('Créditos insuficientes en Lovable AI. Agrega más créditos en Settings → Workspace → Usage.');
      }
      
      throw new Error(`Lovable AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('✅ Respuesta recibida de Lovable AI');

    // 9. Parsear respuesta con tool calling
    let scheduledTasks: ScheduledTask[];
    try {
      const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall || toolCall.function.name !== 'generate_weekly_schedules') {
        throw new Error('No se recibió tool call válido de la IA');
      }

      const parsedArgs = JSON.parse(toolCall.function.arguments);
      scheduledTasks = parsedArgs.scheduled_tasks || [];
    } catch (parseError) {
      console.error('Error parseando respuesta de Lovable AI:', parseError);
      console.error('Respuesta completa:', JSON.stringify(aiResponse, null, 2));
      throw new Error('No se pudo parsear la respuesta de Lovable AI');
    }

    console.log(`✅ Lovable AI generó ${scheduledTasks.length} tareas programadas`);

    // 10. Insertar tareas programadas en task_schedule
    if (scheduledTasks.length > 0) {
      // Primero borrar schedules existentes para esta semana
      await supabase
        .from('task_schedule')
        .delete()
        .eq('week_start', weekStart);

      const taskScheduleInserts = scheduledTasks.map((st) => ({
        task_id: st.task_id,
        user_id: st.user_id,
        scheduled_date: st.scheduled_date,
        scheduled_start: st.scheduled_start,
        scheduled_end: st.scheduled_end,
        status: 'pending',
        week_start: weekStart,
        is_collaborative: st.is_collaborative || false,
        collaborator_user_id: st.collaborator_user_id || null,
      }));

      const { error: insertError } = await supabase
        .from('task_schedule')
        .insert(taskScheduleInserts);

      if (insertError) {
        console.error('Error insertando tareas:', insertError);
        throw insertError;
      }

      console.log(`💾 Guardadas ${scheduledTasks.length} tareas en la base de datos`);
    }

    // 11. Enviar alertas a usuarios
    for (const user of userAvailabilities) {
      const userTasks = scheduledTasks.filter((st) => st.user_id === user.user_id);
      
      await supabase.from('smart_alerts').insert({
        alert_type: 'agenda_generated',
        severity: 'info',
        title: '📅 Agenda Semanal Lista',
        message: `Tu agenda está lista con ${userTasks.length} tareas. Puedes revisarla y sugerir cambios hasta el Miércoles 13:29.`,
        source: 'scheduling',
        category: 'agenda',
        target_user_id: user.user_id,
        actionable: true,
        action_label: 'Ver Agenda',
        action_url: '/dashboard'
      });
    }

    console.log('🎉 Agendas generadas y guardadas correctamente');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Agendas coordinadas generadas exitosamente',
        week_start: weekStart,
        users_processed: userAvailabilities.length,
        tasks_scheduled: scheduledTasks.length,
        review_period: 'Hasta Miércoles 13:29',
        activation: 'Miércoles 13:30'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error en generate-weekly-schedules:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Error desconocido',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function buildAIPrompt(
  userAvailabilities: UserAvailability[],
  tasks: Task[],
  weekStart: string,
  currentPhase: number
): string {
  return `Eres un asistente de IA especializado en la generación de agendas coordinadas para un equipo de trabajo.

**CONTEXTO:**
- Fase actual del negocio: ${currentPhase}
- Semana que comienza: ${weekStart} (Miércoles 13:30)
- Total de usuarios: ${userAvailabilities.length}
- Total de tareas disponibles: ${tasks.length}

**CICLO DE TRABAJO:**
- Lunes 13:01: Generación automática de agendas
- Lunes 13:30 - Miércoles 13:29: Período de revisión y ajustes
- Miércoles 13:30: Activación de agenda y comienzo de semana

**DISPONIBILIDAD DE USUARIOS:**
${JSON.stringify(userAvailabilities, null, 2)}

**TAREAS DISPONIBLES:**
${JSON.stringify(tasks, null, 2)}

**REGLAS CRÍTICAS:**

1. **Límite de tareas por usuario:**
   - Respetar el task_limit de cada usuario según su modo
   - Conservador: máximo 5 tareas
   - Moderado: máximo 8 tareas
   - Agresivo: máximo 12 tareas

2. **Respetar disponibilidad horaria:**
   - Solo programar en días/horarios marcados como disponibles
   - Considerar preferencias de horario (morning/afternoon/evening/flexible)
   - Respetar horas preferidas por día (preferred_hours_per_day)

3. **Distribución inteligente:**
   - Distribuir tareas equitativamente entre usuarios
   - Considerar el área de cada tarea y expertise del usuario
   - Evitar sobrecargar a un usuario mientras otro tiene pocas tareas

4. **Tareas colaborativas:**
   - Si una tarea tiene leader_id, es colaborativa
   - Coordinar horarios entre ejecutor (user_id) y líder (leader_id)
   - Asegurar que ambos estén disponibles al mismo tiempo
   - Crear DOS entradas en scheduled_tasks: una para cada participante

5. **Espaciado de tareas:**
   - Dejar al menos 1 hora entre tareas del mismo usuario
   - No programar más de 2-3 tareas en el mismo día por usuario
   - Distribuir uniformemente a lo largo de la semana

6. **Duración estimada:**
   - Tareas simples: 1-2 horas
   - Tareas normales: 2-3 horas
   - Tareas complejas: 3-4 horas
   - Ajustar según descripción y área de la tarea

7. **Priorización:**
   - Primero programar tareas colaborativas (requieren coordinación)
   - Luego tareas individuales
   - Considerar order_index si está disponible

8. **Coordinación por orden de disponibilidad:**
   - Los usuarios que rellenaron primero su disponibilidad tienen prioridad
   - Sus horarios preferidos deben respetarse más
   - Adaptar horarios de usuarios que rellenaron después

**IMPORTANTE:**
- Todos los UUIDs (task_id, user_id, collaborator_user_id) deben ser válidos
- Todas las fechas deben estar dentro de la semana especificada (${weekStart})
- Todos los horarios deben respetar exactamente la disponibilidad del usuario
- Para tareas colaborativas, crear entrada para AMBOS usuarios con el mismo horario
- La fecha debe estar en formato YYYY-MM-DD
- Las horas en formato HH:MM (ej: "09:00", "14:30")

Genera las agendas coordinadas ahora usando la función generate_weekly_schedules.`;
}
