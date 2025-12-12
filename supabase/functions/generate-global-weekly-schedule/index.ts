import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = SupabaseClient<any, any, any>;

interface GlobalScheduleRequest {
  userId: string;
  weekStart: string;
  forceRegenerate?: boolean;
}

interface TaskRecord {
  id: string;
  title: string;
  is_personal: boolean;
  organization_id: string | null;
  estimated_duration?: number;
}

interface AvailabilityRecord {
  work_mode: string;
  [key: string]: string | boolean | number | null;
}

interface GlobalAgendaSettings {
  linked_organization_ids: string[];
  show_personal_tasks: boolean;
  show_org_tasks: boolean;
}

interface TimeSlot {
  start: string;
  end: string;
}

interface ScheduleSlot {
  task_id: string;
  user_id: string;
  organization_id: string | null;
  week_start: string;
  scheduled_date: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  is_collaborative: boolean;
  collaborator_user_id: null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { userId, weekStart, forceRegenerate = false }: GlobalScheduleRequest = await req.json();

    console.log('[Global Schedule] Starting generation', { userId, weekStart });

    // 1. Obtener configuración global
    const { data: existingSettings, error: settingsError } = await supabase
      .from('user_global_agenda_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      throw settingsError;
    }

    let settings: GlobalAgendaSettings | null = existingSettings;

    if (!settings) {
      console.log('[Global Schedule] Initializing settings...');
      const { error: initError } = await supabase
        .rpc('initialize_global_agenda_settings', { p_user_id: userId });
      
      if (initError) throw initError;
      
      const { data: newSettings } = await supabase
        .from('user_global_agenda_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      settings = newSettings;
    }

    if (!settings) {
      throw new Error('Failed to initialize global agenda settings');
    }

    console.log('[Global Schedule] Settings loaded', {
      linkedOrgs: settings.linked_organization_ids?.length || 0,
      showPersonal: settings.show_personal_tasks,
    });

    // 2. Obtener disponibilidad
    const { data: availability, error: availError } = await supabase
      .from('user_weekly_availability')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .single();

    if (availError || !availability) {
      return new Response(
        JSON.stringify({ error: 'No availability set for this week', requiresSetup: true, weekStart }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // 3. Obtener tareas elegibles
    const linkedOrgIds = settings.linked_organization_ids || [];
    
    let tasksQuery = supabase
      .from('tasks')
      .select('id, title, is_personal, organization_id, estimated_duration')
      .eq('user_id', userId);

    if (settings.show_personal_tasks && linkedOrgIds.length > 0) {
      tasksQuery = tasksQuery.or(`is_personal.eq.true,organization_id.in.(${linkedOrgIds.join(',')})`);
    } else if (settings.show_personal_tasks) {
      tasksQuery = tasksQuery.eq('is_personal', true);
    } else if (linkedOrgIds.length > 0) {
      tasksQuery = tasksQuery.in('organization_id', linkedOrgIds);
    } else {
      return new Response(
        JSON.stringify({ success: true, message: 'No organizations or personal tasks to schedule', slotsGenerated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const { data: tasks, error: tasksError } = await tasksQuery;
    if (tasksError) throw tasksError;

    console.log('[Global Schedule] Tasks loaded', {
      total: tasks?.length || 0,
      personal: tasks?.filter((t: TaskRecord) => t.is_personal).length || 0,
    });

    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No pending tasks to schedule', slotsGenerated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 4. Borrar slots existentes si forceRegenerate
    if (forceRegenerate) {
      await supabase
        .from('task_schedule')
        .delete()
        .eq('user_id', userId)
        .eq('week_start', weekStart);
    }

    // 5. Generar slots
    const slots = await generateCombinedSlots(tasks, availability, userId, weekStart, supabase as SupabaseAny);

    // 6. Insertar slots
    if (slots.length > 0) {
      const { error: insertError } = await supabase.from('task_schedule').insert(slots);
      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        slotsGenerated: slots.length,
        weekStart,
        tasksProcessed: tasks.length,
        personalTasks: tasks.filter((t: TaskRecord) => t.is_personal).length,
        organizationalTasks: tasks.filter((t: TaskRecord) => !t.is_personal).length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('[Global Schedule] Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function generateCombinedSlots(
  tasks: TaskRecord[],
  availability: AvailabilityRecord,
  userId: string,
  weekStart: string,
  supabase: SupabaseAny
): Promise<ScheduleSlot[]> {
  const slots: ScheduleSlot[] = [];
  const daysOfWeek = ['wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'monday', 'tuesday'];

  for (const task of tasks) {
    const duration = task.estimated_duration || 60;
    let slotFound = false;

    for (let dayOffset = 0; dayOffset < 7 && !slotFound; dayOffset++) {
      const dayName = daysOfWeek[dayOffset];
      const isAvailable = availability[`${dayName}_available`];
      if (!isAvailable) continue;

      const dayStart = availability[`${dayName}_start`] as string;
      const dayEnd = availability[`${dayName}_end`] as string;
      if (!dayStart || !dayEnd) continue;

      const date = new Date(weekStart);
      date.setDate(date.getDate() + dayOffset);
      const scheduledDate = date.toISOString().split('T')[0];

      const slot = await findAvailableSlot(scheduledDate, dayStart, dayEnd, duration, slots, userId, supabase);

      if (slot) {
        slots.push({
          task_id: task.id,
          user_id: userId,
          organization_id: task.organization_id,
          week_start: weekStart,
          scheduled_date: scheduledDate,
          scheduled_start: slot.start,
          scheduled_end: slot.end,
          status: 'pending',
          is_collaborative: false,
          collaborator_user_id: null,
        });
        slotFound = true;
      }
    }
  }

  return slots;
}

async function findAvailableSlot(
  scheduledDate: string,
  dayStart: string,
  dayEnd: string,
  duration: number,
  existingSlots: ScheduleSlot[],
  userId: string,
  supabase: SupabaseAny
): Promise<TimeSlot | null> {
  const [startHour, startMin] = dayStart.split(':').map(Number);
  const [endHour, endMin] = dayEnd.split(':').map(Number);

  const dayStartMinutes = startHour * 60 + startMin;
  const dayEndMinutes = endHour * 60 + endMin;

  const { data: dbSlots } = await supabase
    .from('task_schedule')
    .select('scheduled_start, scheduled_end')
    .eq('user_id', userId)
    .eq('scheduled_date', scheduledDate);

  const allOccupiedSlots = [
    ...(dbSlots || []),
    ...existingSlots.filter(s => s.scheduled_date === scheduledDate),
  ];

  const occupiedRanges = allOccupiedSlots.map(s => {
    const [sH, sM] = s.scheduled_start.split(':').map(Number);
    const [eH, eM] = s.scheduled_end.split(':').map(Number);
    return { start: sH * 60 + sM, end: eH * 60 + eM };
  }).sort((a, b) => a.start - b.start);

  let currentTime = dayStartMinutes;

  for (const occupied of occupiedRanges) {
    if (currentTime + duration <= occupied.start) {
      return formatSlot(currentTime, currentTime + duration);
    }
    currentTime = Math.max(currentTime, occupied.end);
  }

  if (currentTime + duration <= dayEndMinutes) {
    return formatSlot(currentTime, currentTime + duration);
  }

  return null;
}

function formatSlot(startMinutes: number, endMinutes: number): TimeSlot {
  const format = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };
  return { start: format(startMinutes), end: format(endMinutes) };
}
