import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserAvailability {
  user_id: string;
  username: string;
  full_name: string;
  availability: Record<string, { available: boolean; start: string; end: string }>;
  preferred_hours_per_day: number;
  preferred_time_of_day: string;
}

interface Task {
  id: string;
  title: string;
  user_id: string;
  leader_id: string | null;
  estimated_hours: number;
}

interface TimeSlot {
  date: string;
  start: string;
  end: string;
  duration_hours: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('🚀 Starting weekly schedule generation...');

    // 1. Calcular próximo miércoles (week_start)
    const today = new Date();
    const dayOfWeek = today.getDay();
    let daysUntilWednesday = (3 - dayOfWeek + 7) % 7;
    
    if (dayOfWeek === 3 && today.getHours() >= 13 && today.getMinutes() >= 30) {
      daysUntilWednesday = 7;
    }
    
    const nextWednesday = new Date(today);
    nextWednesday.setDate(today.getDate() + daysUntilWednesday);
    nextWednesday.setHours(0, 0, 0, 0);
    
    const weekStart = nextWednesday.toISOString().split('T')[0];
    console.log(`📅 Generating schedules for week starting: ${weekStart}`);

    // 2. Obtener todas las disponibilidades de usuarios
    const { data: availabilities, error: availError } = await supabase
      .from('user_weekly_availability')
      .select('*, users(id, username, full_name)')
      .eq('week_start', weekStart)
      .not('submitted_at', 'is', null);

    if (availError) throw availError;

    if (!availabilities || availabilities.length === 0) {
      console.log('⚠️ No users have submitted availability yet');
      return new Response(
        JSON.stringify({ message: 'No users have submitted availability yet' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`👥 Found ${availabilities.length} users with availability`);

    // 3. Obtener phase actual para saber qué tareas generar
    const { data: systemConfig } = await supabase
      .from('system_config')
      .select('current_phase')
      .single();

    const currentPhase = systemConfig?.current_phase || 1;

    // 4. Obtener tareas de cada usuario para esta fase
    const userIds = availabilities.map((a: any) => a.user_id);
    
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .in('user_id', userIds)
      .eq('phase', currentPhase);

    if (tasksError) throw tasksError;

    console.log(`📋 Found ${tasks?.length || 0} tasks to schedule`);

    // 5. Agrupar tareas por usuario
    const tasksByUser: Record<string, Task[]> = {};
    tasks?.forEach((task: any) => {
      if (!tasksByUser[task.user_id]) {
        tasksByUser[task.user_id] = [];
      }
      tasksByUser[task.user_id].push({
        ...task,
        estimated_hours: 2, // Por defecto 2 horas por tarea
      });
    });

    // 6. Procesar disponibilidad de cada usuario
    const userAvailabilityMap: Record<string, UserAvailability> = {};
    
    availabilities.forEach((avail: any) => {
      const days: Record<string, { available: boolean; start: string; end: string }> = {};
      
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
        days[day] = {
          available: avail[`${day}_available`] || false,
          start: avail[`${day}_start`] || '09:00',
          end: avail[`${day}_end`] || '18:00',
        };
      });

      userAvailabilityMap[avail.user_id] = {
        user_id: avail.user_id,
        username: avail.users.username,
        full_name: avail.users.full_name,
        availability: days,
        preferred_hours_per_day: avail.preferred_hours_per_day || 4,
        preferred_time_of_day: avail.preferred_time_of_day || 'flexible',
      };
    });

    // 7. Generar schedules
    const schedules: any[] = [];

    // Primero: Procesar tareas colaborativas
    const collaborativeTasks = tasks?.filter((t: any) => t.leader_id !== null) || [];
    
    for (const task of collaborativeTasks) {
      const executorAvail = userAvailabilityMap[task.user_id];
      const leaderAvail = userAvailabilityMap[task.leader_id];

      if (!executorAvail || !leaderAvail) continue;

      // Buscar slot compatible para ambos
      const compatibleSlot = findCompatibleSlot(
        executorAvail,
        leaderAvail,
        task.estimated_hours,
        weekStart,
        schedules
      );

      if (compatibleSlot) {
        // Guardar para ambos usuarios
        schedules.push({
          task_id: task.id,
          user_id: task.user_id,
          week_start: weekStart,
          scheduled_date: compatibleSlot.date,
          scheduled_start: compatibleSlot.start,
          scheduled_end: compatibleSlot.end,
          status: 'pending',
          is_collaborative: true,
          collaborator_user_id: task.leader_id,
        });

        schedules.push({
          task_id: task.id,
          user_id: task.leader_id,
          week_start: weekStart,
          scheduled_date: compatibleSlot.date,
          scheduled_start: compatibleSlot.start,
          scheduled_end: compatibleSlot.end,
          status: 'pending',
          is_collaborative: true,
          collaborator_user_id: task.user_id,
        });

        console.log(`✅ Scheduled collaborative task: ${task.title} for ${compatibleSlot.date} ${compatibleSlot.start}`);
      }
    }

    // Segundo: Procesar tareas individuales
    const individualTasks = tasks?.filter((t: any) => t.leader_id === null) || [];
    
    for (const task of individualTasks) {
      const userAvail = userAvailabilityMap[task.user_id];
      if (!userAvail) continue;

      const slot = findBestSlot(userAvail, task.estimated_hours, weekStart, schedules);

      if (slot) {
        schedules.push({
          task_id: task.id,
          user_id: task.user_id,
          week_start: weekStart,
          scheduled_date: slot.date,
          scheduled_start: slot.start,
          scheduled_end: slot.end,
          status: 'pending',
          is_collaborative: false,
          collaborator_user_id: null,
        });

        console.log(`✅ Scheduled individual task: ${task.title} for ${slot.date} ${slot.start}`);
      }
    }

    // 8. Guardar todos los schedules en BD
    if (schedules.length > 0) {
      // Primero borrar schedules existentes para esta semana
      await supabase
        .from('task_schedule')
        .delete()
        .eq('week_start', weekStart);

      // Insertar nuevos schedules
      const { error: insertError } = await supabase
        .from('task_schedule')
        .insert(schedules);

      if (insertError) throw insertError;

      console.log(`💾 Saved ${schedules.length} schedules to database`);
    }

    // 9. Enviar notificaciones a usuarios
    for (const userId of userIds) {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'agenda_ready',
        message: `Tu agenda para la semana del ${new Date(weekStart).toLocaleDateString('es-ES')} ha sido generada. Revísala y acepta las tareas programadas.`,
      });
    }

    console.log('✅ Schedule generation completed successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        week_start: weekStart,
        users_processed: availabilities.length,
        schedules_created: schedules.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error generating schedules:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function findCompatibleSlot(
  user1: UserAvailability,
  user2: UserAvailability,
  hours: number,
  weekStart: string,
  existingSchedules: any[]
): TimeSlot | null {
  const days = ['wednesday', 'thursday', 'friday', 'monday', 'tuesday', 'saturday', 'sunday'];
  const weekStartDate = new Date(weekStart);

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(weekStartDate.getDate() + i);
    const dayName = days[i];

    const user1Day = user1.availability[dayName];
    const user2Day = user2.availability[dayName];

    // Ambos deben estar disponibles ese día
    if (!user1Day?.available || !user2Day?.available) continue;

    // Encontrar overlap de horarios
    const start1 = parseTime(user1Day.start);
    const end1 = parseTime(user1Day.end);
    const start2 = parseTime(user2Day.start);
    const end2 = parseTime(user2Day.end);

    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);

    if (overlapEnd - overlapStart >= hours * 60) {
      // Hay suficiente overlap
      const slotStart = minutesToTime(overlapStart);
      const slotEnd = minutesToTime(overlapStart + hours * 60);
      const dateStr = currentDate.toISOString().split('T')[0];

      // Verificar que no haya conflicto con schedules existentes
      const hasConflict = existingSchedules.some(s => 
        s.scheduled_date === dateStr &&
        (s.user_id === user1.user_id || s.user_id === user2.user_id) &&
        timesOverlap(slotStart, slotEnd, s.scheduled_start, s.scheduled_end)
      );

      if (!hasConflict) {
        return {
          date: dateStr,
          start: slotStart,
          end: slotEnd,
          duration_hours: hours,
        };
      }
    }
  }

  return null;
}

function findBestSlot(
  user: UserAvailability,
  hours: number,
  weekStart: string,
  existingSchedules: any[]
): TimeSlot | null {
  const days = ['wednesday', 'thursday', 'friday', 'monday', 'tuesday', 'saturday', 'sunday'];
  const weekStartDate = new Date(weekStart);

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(weekStartDate.getDate() + i);
    const dayName = days[i];

    const dayAvail = user.availability[dayName];
    if (!dayAvail?.available) continue;

    const start = parseTime(dayAvail.start);
    const end = parseTime(dayAvail.end);

    if (end - start >= hours * 60) {
      // Aplicar preferencia de horario
      let slotStart = start;

      if (user.preferred_time_of_day === 'morning') {
        slotStart = start; // Temprano
      } else if (user.preferred_time_of_day === 'afternoon') {
        slotStart = Math.max(start, parseTime('14:00'));
      } else if (user.preferred_time_of_day === 'evening') {
        slotStart = Math.max(start, parseTime('18:00'));
      }

      const slotEnd = slotStart + hours * 60;

      if (slotEnd <= end) {
        const slotStartStr = minutesToTime(slotStart);
        const slotEndStr = minutesToTime(slotEnd);
        const dateStr = currentDate.toISOString().split('T')[0];

        // Verificar que no haya conflicto
        const hasConflict = existingSchedules.some(s =>
          s.scheduled_date === dateStr &&
          s.user_id === user.user_id &&
          timesOverlap(slotStartStr, slotEndStr, s.scheduled_start, s.scheduled_end)
        );

        if (!hasConflict) {
          return {
            date: dateStr,
            start: slotStartStr,
            end: slotEndStr,
            duration_hours: hours,
          };
        }
      }
    }
  }

  return null;
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = parseTime(start1);
  const e1 = parseTime(end1);
  const s2 = parseTime(start2);
  const e2 = parseTime(end2);
  return s1 < e2 && e1 > s2;
}
