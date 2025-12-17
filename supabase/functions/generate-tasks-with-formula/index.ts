import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============================================
// SISTEMA ADAPTATIVO DE TAREAS V2.0
// Fórmula: TAREAS_USUARIO = BASE × FACTOR_ROL × FACTOR_EQUIPO × FACTOR_FASE × FACTOR_HORAS
// ============================================

// FACTOR_ROL: Multiplicador y categorías según el rol funcional
const ROLE_CONFIG: Record<string, { multiplier: number; categories: string[]; hoursMultiplier: number }> = {
  ceo: { multiplier: 1.2, categories: ['estrategia', 'direccion', 'liderazgo', 'finanzas', 'vision'], hoursMultiplier: 1.0 },
  cto: { multiplier: 1.3, categories: ['tecnologia', 'producto', 'arquitectura', 'infraestructura', 'desarrollo'], hoursMultiplier: 1.1 },
  coo: { multiplier: 1.2, categories: ['operaciones', 'procesos', 'eficiencia', 'logistica', 'calidad'], hoursMultiplier: 1.0 },
  cmo: { multiplier: 1.1, categories: ['marketing', 'branding', 'comunicacion', 'contenido', 'publicidad'], hoursMultiplier: 0.9 },
  cfo: { multiplier: 1.1, categories: ['finanzas', 'contabilidad', 'presupuesto', 'inversiones'], hoursMultiplier: 1.0 },
  marketing: { multiplier: 1.0, categories: ['marketing', 'redes_sociales', 'contenido', 'seo', 'publicidad', 'leads'], hoursMultiplier: 0.9 },
  ventas: { multiplier: 1.0, categories: ['ventas', 'comercial', 'pipeline', 'clientes', 'negociacion'], hoursMultiplier: 1.0 },
  operaciones: { multiplier: 1.1, categories: ['operaciones', 'logistica', 'procesos', 'calidad', 'inventario'], hoursMultiplier: 1.1 },
  producto: { multiplier: 1.2, categories: ['producto', 'desarrollo', 'ux', 'features', 'roadmap', 'testing'], hoursMultiplier: 1.2 },
  finanzas: { multiplier: 0.9, categories: ['finanzas', 'contabilidad', 'reporting', 'presupuesto'], hoursMultiplier: 0.9 },
  rrhh: { multiplier: 0.8, categories: ['rrhh', 'cultura', 'contratacion', 'formacion'], hoursMultiplier: 0.8 },
  legal: { multiplier: 0.7, categories: ['legal', 'cumplimiento', 'contratos', 'normativas'], hoursMultiplier: 0.7 },
  general: { multiplier: 1.0, categories: ['general', 'equipo', 'colaboracion'], hoursMultiplier: 1.0 }
};

// FACTOR_EQUIPO: Basado en tamaño del equipo
function getTeamFactor(teamSize: number): number {
  if (teamSize === 1) return 1.3;
  if (teamSize <= 3) return 1.0;
  if (teamSize <= 5) return 0.95;
  if (teamSize <= 10) return 0.9;
  if (teamSize <= 20) return 0.85;
  if (teamSize <= 50) return 0.8;
  return 0.75;
}

// FACTOR_FASE: Complejidad por fase y metodología
const PHASE_FACTOR: Record<string, Record<number, number>> = {
  lean_startup: { 1: 1.0, 2: 0.9, 3: 1.0, 4: 1.2 },
  scaling_up: { 1: 1.1, 2: 1.0, 3: 1.2, 4: 1.0 }
};

// FACTOR_HORAS: Basado en horas disponibles semanales
function getHoursFactor(hoursPerWeek: number): number {
  if (hoursPerWeek >= 40) return 1.2;
  if (hoursPerWeek >= 30) return 1.0;
  if (hoursPerWeek >= 20) return 0.8;
  if (hoursPerWeek >= 10) return 0.6;
  return 0.4;
}

const BASE_TASKS_PER_WEEK = 4;

interface TaskCalculation {
  tasksPerWeek: number;
  totalTasks: number;
  breakdown: {
    base: number;
    roleFactor: number;
    teamFactor: number;
    phaseFactor: number;
    hoursFactor: number;
    formula: string;
  };
}

function calculateTasks(input: {
  role: string;
  teamSize: number;
  methodology: string;
  phaseNumber: number;
  hoursPerWeek: number;
  phaseDurationWeeks: number;
}): TaskCalculation {
  const roleConfig = ROLE_CONFIG[input.role] || ROLE_CONFIG.general;
  const roleFactor = roleConfig.multiplier * roleConfig.hoursMultiplier;
  const teamFactor = getTeamFactor(input.teamSize);
  const phaseFactor = PHASE_FACTOR[input.methodology]?.[input.phaseNumber] || 1.0;
  const hoursFactor = getHoursFactor(input.hoursPerWeek);

  let tasksPerWeek = BASE_TASKS_PER_WEEK * roleFactor * teamFactor * phaseFactor * hoursFactor;
  tasksPerWeek = Math.max(3, Math.min(20, Math.round(tasksPerWeek)));
  
  const totalTasks = tasksPerWeek * input.phaseDurationWeeks;

  return {
    tasksPerWeek,
    totalTasks,
    breakdown: {
      base: BASE_TASKS_PER_WEEK,
      roleFactor,
      teamFactor,
      phaseFactor,
      hoursFactor,
      formula: `${BASE_TASKS_PER_WEEK} × ${roleFactor.toFixed(2)} × ${teamFactor.toFixed(2)} × ${phaseFactor.toFixed(2)} × ${hoursFactor.toFixed(2)} = ${tasksPerWeek}`
    }
  };
}

function detectRole(teamMember: { role?: string } | null): string {
  if (!teamMember?.role) return 'general';
  const role = teamMember.role.toLowerCase();
  
  if (role.includes('ceo') || role.includes('director') || role.includes('fundador') || role.includes('founder') || role.includes('owner')) return 'ceo';
  if (role.includes('cto') || role.includes('tech') || role.includes('desarrollo') || role.includes('developer')) return 'cto';
  if (role.includes('coo') || role.includes('operation') || role.includes('logistica')) return 'operaciones';
  if (role.includes('cmo') || role.includes('marketing') || role.includes('growth') || role.includes('redes')) return 'marketing';
  if (role.includes('cfo') || role.includes('finanz') || role.includes('contab')) return 'finanzas';
  if (role.includes('venta') || role.includes('sales') || role.includes('comercial')) return 'ventas';
  if (role.includes('product') || role.includes('ux') || role.includes('diseño')) return 'producto';
  if (role.includes('rrhh') || role.includes('hr') || role.includes('people')) return 'rrhh';
  if (role.includes('legal') || role.includes('compliance')) return 'legal';
  
  return 'general';
}

// Tareas plantilla por rol
const ROLE_TEMPLATES: Record<string, Array<{ title: string; description: string; category: string }>> = {
  ceo: [
    { title: 'Reunión estratégica semanal', description: 'Revisar objetivos y KPIs del equipo', category: 'direccion' },
    { title: 'Definir prioridades del sprint', description: 'Establecer las 3 prioridades principales', category: 'estrategia' },
    { title: 'One-on-one con líderes', description: 'Reuniones individuales con cada área', category: 'liderazgo' },
    { title: 'Revisión de métricas clave', description: 'Analizar dashboard de KPIs', category: 'finanzas' },
    { title: 'Planificación trimestral', description: 'Definir roadmap próximo trimestre', category: 'vision' },
    { title: 'Networking estratégico', description: 'Conectar con inversores o partners', category: 'estrategia' },
  ],
  marketing: [
    { title: 'Crear contenido redes sociales', description: 'Preparar posts para la semana', category: 'redes_sociales' },
    { title: 'Optimizar campañas publicitarias', description: 'Revisar y ajustar ads activos', category: 'publicidad' },
    { title: 'Analizar métricas de marketing', description: 'Dashboard de engagement y conversión', category: 'marketing' },
    { title: 'Email marketing semanal', description: 'Newsletter y segmentación', category: 'contenido' },
    { title: 'Estrategia SEO', description: 'Optimizar posicionamiento orgánico', category: 'seo' },
    { title: 'Planificar calendario contenido', description: 'Organizar publicaciones mensuales', category: 'contenido' },
  ],
  ventas: [
    { title: 'Prospección de nuevos clientes', description: 'Contactar 10 leads cualificados', category: 'ventas' },
    { title: 'Seguimiento pipeline', description: 'Actualizar CRM con status de deals', category: 'pipeline' },
    { title: 'Preparar propuestas comerciales', description: 'Decks personalizados para prospects', category: 'comercial' },
    { title: 'Cerrar negociaciones pendientes', description: 'Follow-up con deals avanzados', category: 'negociacion' },
    { title: 'Análisis de competencia', description: 'Benchmark de precios y propuestas', category: 'ventas' },
    { title: 'Capacitación técnicas de venta', description: 'Mejorar skills de cierre', category: 'ventas' },
  ],
  operaciones: [
    { title: 'Optimizar procesos', description: 'Identificar cuellos de botella', category: 'procesos' },
    { title: 'Control de calidad', description: 'Verificar estándares de entrega', category: 'calidad' },
    { title: 'Gestión de inventario', description: 'Revisar niveles de stock', category: 'inventario' },
    { title: 'Coordinación con proveedores', description: 'Seguimiento de pedidos', category: 'logistica' },
    { title: 'Mejora continua', description: 'Implementar optimización identificada', category: 'operaciones' },
    { title: 'Documentar procedimientos', description: 'Actualizar SOPs del área', category: 'procesos' },
  ],
  producto: [
    { title: 'Sprint planning', description: 'Definir tareas técnicas del sprint', category: 'desarrollo' },
    { title: 'Revisión de features', description: 'Testing y QA de funcionalidades', category: 'testing' },
    { title: 'User research', description: 'Entrevistas y feedback de usuarios', category: 'ux' },
    { title: 'Actualizar roadmap', description: 'Priorizar backlog de producto', category: 'roadmap' },
    { title: 'Documentación técnica', description: 'Actualizar specs', category: 'producto' },
    { title: 'Análisis de métricas producto', description: 'Revisar uso de features', category: 'producto' },
  ],
  general: [
    { title: 'Reunión de equipo', description: 'Sync semanal con el equipo', category: 'equipo' },
    { title: 'Revisar objetivos semanales', description: 'Planificar prioridades', category: 'general' },
    { title: 'Colaboración cross-funcional', description: 'Apoyar otras áreas', category: 'colaboracion' },
    { title: 'Formación y aprendizaje', description: 'Dedicar tiempo a mejora continua', category: 'general' },
    { title: 'Documentar aprendizajes', description: 'Registrar insights', category: 'equipo' },
    { title: 'Feedback con manager', description: 'One-on-one semanal', category: 'general' },
  ],
};

async function generateAITasks(
  apiKey: string,
  role: string,
  phaseName: string,
  industry: string,
  count: number
): Promise<Array<{ title: string; description: string; category: string; estimatedHours: number }>> {
  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.general;
  
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'Genera tareas empresariales. Responde SOLO con JSON válido.' },
          { role: 'user', content: `Genera ${count} tareas para ${role.toUpperCase()} en fase "${phaseName}" de empresa ${industry}. Categorías: ${roleConfig.categories.join(', ')}. JSON: {"tasks":[{"title":"","description":"","category":"","estimatedHours":2}]}` }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) return generateFallbackTasks(role, count);
    
    const data = await response.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    return parsed.tasks || generateFallbackTasks(role, count);
  } catch {
    return generateFallbackTasks(role, count);
  }
}

function generateFallbackTasks(role: string, count: number): Array<{ title: string; description: string; category: string; estimatedHours: number }> {
  const templates = ROLE_TEMPLATES[role] || ROLE_TEMPLATES.general;
  const tasks: Array<{ title: string; description: string; category: string; estimatedHours: number }> = [];
  
  for (let i = 0; i < count; i++) {
    const template = templates[i % templates.length];
    tasks.push({
      ...template,
      title: i >= templates.length ? `${template.title} (${Math.floor(i / templates.length) + 1})` : template.title,
      estimatedHours: 2
    });
  }
  
  return tasks;
}

function parseTeamSize(teamSize: string | number | undefined): number {
  if (typeof teamSize === 'number') return teamSize;
  if (!teamSize) return 1;
  const sizeMap: Record<string, number> = { '1': 1, '1-5': 3, '6-10': 8, '11-20': 15, '21-50': 35, '51-100': 75, '100+': 150 };
  return sizeMap[teamSize.toLowerCase()] || parseInt(teamSize) || 1;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id, use_ai = true } = await req.json();

    if (!organization_id) {
      return new Response(JSON.stringify({ error: "organization_id requerido" }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    console.log(`[FORMULA-V2] Starting for org: ${organization_id}`);

    // Get organization data
    const { data: org } = await supabase
      .from("organizations")
      .select("team_structure, is_startup, industry, team_size, hours_per_week")
      .eq("id", organization_id)
      .single();

    const teamStructure: Array<{ name: string; role: string }> = Array.isArray(org?.team_structure) ? org.team_structure : [];
    const methodology = org?.is_startup !== false ? 'lean_startup' : 'scaling_up';
    const teamSize = parseTeamSize(org?.team_size);
    const hoursPerWeek = org?.hours_per_week || 40;
    const industry = org?.industry || 'generic';

    // Get users
    const { data: orgUsers } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("organization_id", organization_id);

    const userIds = orgUsers?.map(u => u.user_id) || [];
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ error: "No hay usuarios" }), 
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: usersInfo } = await supabase.from("users").select("id, full_name").in("id", userIds);

    // Map users to roles
    const userRoleMap = new Map<string, string>();
    for (const userId of userIds) {
      const user = usersInfo?.find(u => u.id === userId);
      const member = teamStructure.find(t => 
        t.name?.toLowerCase().includes(user?.full_name?.toLowerCase() || '') ||
        user?.full_name?.toLowerCase().includes(t.name?.toLowerCase() || '')
      );
      userRoleMap.set(userId, detectRole(member || null));
    }

    // Get phases
    const { data: phases } = await supabase
      .from("business_phases")
      .select("id, phase_number, phase_name, duration_weeks")
      .eq("organization_id", organization_id)
      .order("phase_number");

    if (!phases?.length) {
      return new Response(JSON.stringify({ error: "No hay fases" }), 
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Delete existing AI tasks
    await supabase.from("tasks").delete().eq("organization_id", organization_id).not("phase_id", "is", null);

    // Generate tasks
    const tasksToInsert: Array<{
      organization_id: string;
      phase_id: string;
      user_id: string;
      title: string;
      description: string;
      phase: number;
      area: string;
      order_index: number;
      estimated_hours: number;
      is_personal: boolean;
    }> = [];

    const results: Array<{ userId: string; role: string; phase: number; tasks: number; formula: string }> = [];

    for (const phase of phases) {
      const duration = phase.duration_weeks || 4;
      
      for (const userId of userIds) {
        const role = userRoleMap.get(userId) || 'general';
        
        const calc = calculateTasks({
          role,
          teamSize,
          methodology,
          phaseNumber: phase.phase_number,
          hoursPerWeek,
          phaseDurationWeeks: duration
        });

        console.log(`[FORMULA-V2] User ${userId} (${role}): ${calc.breakdown.formula}`);

        const tasks = (use_ai && apiKey) 
          ? await generateAITasks(apiKey, role, phase.phase_name, industry, calc.totalTasks)
          : generateFallbackTasks(role, calc.totalTasks);

        tasks.forEach((task, idx) => {
          tasksToInsert.push({
            organization_id,
            phase_id: phase.id,
            user_id: userId,
            title: task.title,
            description: task.description,
            phase: phase.phase_number,
            area: task.category,
            order_index: idx,
            estimated_hours: task.estimatedHours || 2,
            is_personal: false,
          });
        });

        results.push({ userId, role, phase: phase.phase_number, tasks: tasks.length, formula: calc.breakdown.formula });
      }
    }

    // Insert in batches
    const BATCH = 100;
    let inserted = 0;
    for (let i = 0; i < tasksToInsert.length; i += BATCH) {
      const { error } = await supabase.from("tasks").insert(tasksToInsert.slice(i, i + BATCH));
      if (!error) inserted += Math.min(BATCH, tasksToInsert.length - i);
    }

    console.log(`[FORMULA-V2] Inserted ${inserted} tasks`);

    return new Response(JSON.stringify({
      success: true,
      totalTasks: inserted,
      users: userIds.length,
      phases: phases.length,
      formula: "TAREAS = BASE × FACTOR_ROL × FACTOR_EQUIPO × FACTOR_FASE × FACTOR_HORAS",
      results
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: unknown) {
    console.error("[FORMULA-V2] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
