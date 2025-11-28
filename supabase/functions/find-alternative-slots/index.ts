import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlternativeSlot {
  date: string;
  start: string;
  end: string;
  is_available: boolean;
  conflict_reason?: string;
  day_name: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const {
      user_id,
      collaborator_user_id,
      week_start,
      duration_hours,
      exclude_schedule_id,
    } = await req.json();

    console.log('🔍 Finding alternative slots...');
    console.log('User:', user_id);
    console.log('Collaborator:', collaborator_user_id);
    console.log('Week:', week_start);
    console.log('Duration:', duration_hours);

    // 1. Obtener disponibilidad del usuario
    const { data: userAvail } = await supabase
      .from('user_weekly_availability')
      .select('*')
      .eq('user_id', user_id)
      .eq('week_start', week_start)
      .single();

    if (!userAvail) {
      throw new Error('User availability not found');
    }

    // 2. Obtener disponibilidad del colaborador (si existe)
    let collaboratorAvail = null;
    if (collaborator_user_id) {
      const { data } = await supabase
        .from('user_weekly_availability')
        .select('*')
        .eq('user_id', collaborator_user_id)
        .eq('week_start', week_start)
        .single();
      
      collaboratorAvail = data;
    }

    // 3. Obtener schedules existentes de ambos usuarios
    const userIds = collaborator_user_id ? [user_id, collaborator_user_id] : [user_id];
    
    const { data: existingSchedules } = await supabase
      .from('task_schedule')
      .select('*')
      .in('user_id', userIds)
      .eq('week_start', week_start);

    // Filtrar el schedule que estamos reprogramando
    const blockedSlots = existingSchedules?.filter(s => s.id !== exclude_schedule_id) || [];

    // 4. Generar slots candidatos
    const alternatives: AlternativeSlot[] = [];
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const weekStartDate = new Date(week_start);

    for (let i = 0; i < 7; i++) {
      const dayKey = days[i];
      const currentDate = new Date(weekStartDate);
      currentDate.setDate(weekStartDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      // Verificar si el usuario está disponible ese día
      const userDayAvail = userAvail[`${dayKey}_available`];
      if (!userDayAvail) continue;

      const userStart = parseTime(userAvail[`${dayKey}_start`]);
      const userEnd = parseTime(userAvail[`${dayKey}_end`]);

      // Si hay colaborador, verificar su disponibilidad
      let collaboratorStart = userStart;
      let collaboratorEnd = userEnd;
      
      if (collaboratorAvail) {
        const collabDayAvail = collaboratorAvail[`${dayKey}_available`];
        if (!collabDayAvail) continue; // Colaborador no disponible ese día

        collaboratorStart = parseTime(collaboratorAvail[`${dayKey}_start`]);
        collaboratorEnd = parseTime(collaboratorAvail[`${dayKey}_end`]);
      }

      // Encontrar overlap de disponibilidad
      const overlapStart = Math.max(userStart, collaboratorStart);
      const overlapEnd = Math.min(userEnd, collaboratorEnd);

      if (overlapEnd - overlapStart < duration_hours * 60) continue; // No hay suficiente overlap

      // Generar slots de 30 minutos dentro del overlap
      for (let startMinutes = overlapStart; startMinutes <= overlapEnd - duration_hours * 60; startMinutes += 30) {
        const slotStart = minutesToTime(startMinutes);
        const slotEnd = minutesToTime(startMinutes + duration_hours * 60);

        // Verificar conflictos con schedules existentes
        const hasConflict = blockedSlots.some(s => {
          if (s.scheduled_date !== dateStr) return false;
          return timesOverlap(slotStart, slotEnd, s.scheduled_start, s.scheduled_end);
        });

        let conflictReason = undefined;
        if (hasConflict) {
          // Determinar quién tiene el conflicto
          const userConflict = blockedSlots.find(s => 
            s.user_id === user_id && 
            s.scheduled_date === dateStr &&
            timesOverlap(slotStart, slotEnd, s.scheduled_start, s.scheduled_end)
          );

          const collaboratorConflict = blockedSlots.find(s => 
            s.user_id === collaborator_user_id && 
            s.scheduled_date === dateStr &&
            timesOverlap(slotStart, slotEnd, s.scheduled_start, s.scheduled_end)
          );

          if (userConflict && collaboratorConflict) {
            conflictReason = 'Ambos ocupados';
          } else if (userConflict) {
            conflictReason = 'Tienes otra tarea';
          } else if (collaboratorConflict) {
            conflictReason = 'Colaborador ocupado';
          }
        }

        alternatives.push({
          date: dateStr,
          start: slotStart,
          end: slotEnd,
          is_available: !hasConflict,
          conflict_reason: conflictReason,
          day_name: dayNames[i],
        });

        // Limitar a 10 slots por día para no saturar
        if (alternatives.filter(a => a.date === dateStr).length >= 10) break;
      }
    }

    // 5. Ordenar: primero disponibles, luego por fecha/hora
    alternatives.sort((a, b) => {
      if (a.is_available !== b.is_available) {
        return a.is_available ? -1 : 1;
      }
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.start.localeCompare(b.start);
    });

    // 6. Retornar top 5 disponibles + 2 no disponibles para contexto
    const availableSlots = alternatives.filter(a => a.is_available).slice(0, 5);
    const unavailableSlots = alternatives.filter(a => !a.is_available).slice(0, 2);

    const result = [...availableSlots, ...unavailableSlots];

    console.log(`✅ Found ${result.length} alternative slots`);

    return new Response(
      JSON.stringify({ alternatives: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error finding alternatives:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

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
