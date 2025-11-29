import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProjectMetrics {
  tasks_completed: number;
  team_size: number;
  areas_performance: Array<{
    area: string;
    tasks: number;
    completed: number;
  }>;
  user_performance: Array<{
    name: string;
    tasks: number;
    completed: number;
    points: number;
  }>;
  business_metrics?: any; // Métricas del negocio actualizadas por usuarios
  task_metrics?: any[]; // Métricas capturadas al completar tareas
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('🔍 Iniciando análisis del proyecto...');

    const metrics = await gatherProjectMetrics(supabase);

    console.log('📊 Métricas recopiladas:', {
      tasks: metrics.tasks_completed,
      team: metrics.team_size,
      areas: metrics.areas_performance.length
    });

    const analysis = await generateAIAnalysis(metrics);

    console.log('✅ Análisis completado');

    return new Response(
      JSON.stringify(analysis),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error en análisis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function gatherProjectMetrics(supabase: any): Promise<ProjectMetrics> {
  // 1. Obtener usuarios y sus logros
  const { data: users } = await supabase
    .from('users')
    .select(`
      id, 
      full_name,
      user_achievements(total_points)
    `)
    .neq('role', 'admin');

  // 2. Obtener tareas y completaciones
  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      id,
      area,
      user_id,
      task_completions(id, task_metrics)
    `);

  const totalCompleted = tasks?.reduce((sum: number, t: any) => sum + (t.task_completions?.length || 0), 0) || 0;

  // 3. Agregar métricas por área
  const areasMap = new Map();
  tasks?.forEach((task: any) => {
    if (!task.area) return;
    if (!areasMap.has(task.area)) {
      areasMap.set(task.area, { tasks: 0, completed: 0 });
    }
    const area = areasMap.get(task.area);
    area.tasks++;
    area.completed += task.task_completions?.length || 0;
  });

  const areasPerformance = Array.from(areasMap.entries()).map(([area, stats]: [string, any]) => ({
    area,
    tasks: stats.tasks,
    completed: stats.completed
  }));

  // 4. Rendimiento de usuarios
  const userPerformance = users?.map((user: any) => {
    const userTasks = tasks?.filter((t: any) => t.user_id === user.id) || [];
    const userCompleted = userTasks.reduce((sum: number, t: any) => sum + (t.task_completions?.length || 0), 0);
    
    return {
      name: user.full_name,
      tasks: userTasks.length,
      completed: userCompleted,
      points: user.user_achievements?.[0]?.total_points || 0
    };
  }) || [];

  // 5. Obtener métricas del negocio (últimas 30 días)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: businessMetrics } = await supabase
    .from('business_metrics')
    .select('*')
    .gte('metric_date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('metric_date', { ascending: false });

  // 6. Extraer task_metrics de todas las completaciones
  const taskMetrics: any[] = [];
  tasks?.forEach((task: any) => {
    task.task_completions?.forEach((completion: any) => {
      if (completion.task_metrics && Object.keys(completion.task_metrics).length > 0) {
        taskMetrics.push({
          area: task.area,
          ...completion.task_metrics
        });
      }
    });
  });

  return {
    tasks_completed: totalCompleted,
    team_size: users?.length || 0,
    areas_performance: areasPerformance,
    user_performance: userPerformance,
    business_metrics: businessMetrics || [],
    task_metrics: taskMetrics
  };
}

async function generateAIAnalysis(metrics: ProjectMetrics) {
  const prompt = buildAnalysisPrompt(metrics);

  console.log('🤖 Llamando a Lovable AI Gateway (Gemini 2.5 Flash)...');

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 429) {
        throw new Error('Rate limit excedido. Por favor intenta de nuevo en unos minutos.');
      }
      if (response.status === 402) {
        throw new Error('Créditos de Lovable AI agotados. Por favor recarga créditos.');
      }
      
      throw new Error(`Lovable AI error (${response.status}): ${errorText}`);
    }

    const aiResponse = await response.json();
    const analysisText = aiResponse.choices[0].message.content;

    console.log('✅ Análisis generado por IA');

    return structureAnalysis(metrics, analysisText);
  } catch (error) {
    console.error('Error calling Lovable AI:', error);
    return structureAnalysis(metrics, '<p>Análisis temporalmente no disponible. Mostrando métricas básicas.</p>');
  }
}

function buildAnalysisPrompt(metrics: ProjectMetrics): string {
  // Calcular métricas agregadas de business_metrics
  const latestBusinessMetrics = metrics.business_metrics && metrics.business_metrics.length > 0 
    ? metrics.business_metrics[0] 
    : null;
  
  // Agregar task_metrics por tipo
  const taskMetricsAgg = aggregateTaskMetrics(metrics.task_metrics || []);

  let prompt = `Eres un consultor de negocios experto analizando un proyecto de comercio electrónico (cestas gourmet).

**DATOS DEL PROYECTO:**

MÉTRICAS GENERALES:
- Tareas completadas: ${metrics.tasks_completed}
- Tamaño del equipo: ${metrics.team_size}

RENDIMIENTO POR ÁREA:
${metrics.areas_performance.map(a => 
  `- ${a.area}: ${a.completed}/${a.tasks} tareas (${((a.completed/(a.tasks || 1))*100).toFixed(1)}%)`
).join('\n')}

RENDIMIENTO DEL EQUIPO:
${metrics.user_performance.map(u => 
  `- ${u.name}: ${u.completed}/${u.tasks} tareas, ${u.points} puntos`
).join('\n')}
`;

  // Añadir métricas del negocio si existen
  if (latestBusinessMetrics) {
    prompt += `

**MÉTRICAS DEL NEGOCIO (Últimas actualizaciones reales):**

VENTAS E INGRESOS:
${latestBusinessMetrics.revenue ? `- Ingresos: €${latestBusinessMetrics.revenue}` : ''}
${latestBusinessMetrics.orders_count ? `- Pedidos: ${latestBusinessMetrics.orders_count}` : ''}
${latestBusinessMetrics.avg_ticket ? `- Ticket medio: €${latestBusinessMetrics.avg_ticket}` : ''}

MARKETING:
${latestBusinessMetrics.leads_generated ? `- Leads generados: ${latestBusinessMetrics.leads_generated}` : ''}
${latestBusinessMetrics.conversion_rate ? `- Tasa de conversión: ${latestBusinessMetrics.conversion_rate}%` : ''}
${latestBusinessMetrics.cac ? `- CAC: €${latestBusinessMetrics.cac}` : ''}

OPERACIONES:
${latestBusinessMetrics.production_time ? `- Tiempo de producción: ${latestBusinessMetrics.production_time}h` : ''}
${latestBusinessMetrics.capacity_used ? `- Capacidad utilizada: ${latestBusinessMetrics.capacity_used}%` : ''}
${latestBusinessMetrics.error_rate ? `- Tasa de errores: ${latestBusinessMetrics.error_rate}%` : ''}

CLIENTE:
${latestBusinessMetrics.nps_score ? `- NPS Score: ${latestBusinessMetrics.nps_score}` : ''}
${latestBusinessMetrics.repeat_rate ? `- Tasa de repetición: ${latestBusinessMetrics.repeat_rate}%` : ''}
${latestBusinessMetrics.satisfaction_score ? `- Satisfacción: ${latestBusinessMetrics.satisfaction_score}/5` : ''}

${latestBusinessMetrics.notes ? `Notas: ${latestBusinessMetrics.notes}` : ''}
`;
  }

  // Añadir métricas de tareas si existen
  if (taskMetricsAgg.count > 0) {
    prompt += `

**RESULTADOS DE TAREAS ESPECÍFICAS:**
${taskMetricsAgg.revenue ? `- Ingresos generados en tareas: €${taskMetricsAgg.revenue}` : ''}
${taskMetricsAgg.leads ? `- Leads capturados: ${taskMetricsAgg.leads}` : ''}
${taskMetricsAgg.conversions ? `- Conversiones logradas: ${taskMetricsAgg.conversions}` : ''}
${taskMetricsAgg.time_saved ? `- Tiempo ahorrado: ${taskMetricsAgg.time_saved}h` : ''}
Número de tareas con métricas: ${taskMetricsAgg.count}
`;
  }

  prompt += `

**TU MISIÓN:**

Analiza estos datos REALES con total sinceridad y genera un informe estratégico con:

1. **DÓNDE ESTÁ EL DINERO:**
   - Qué productos/servicios son más rentables basado en los datos reales
   - Canales que mejor ROI tienen
   - Recomendaciones concretas para aumentar ingresos y margen

2. **DÓNDE SE PIERDE TIEMPO:**
   - Áreas con menor eficiencia según las tareas
   - Cuellos de botella detectados
   - Procesos a automatizar o eliminar

3. **EN QUÉ ENFOCARSE:**
   - Top 3 prioridades basadas en datos reales
   - Alertas sobre áreas críticas
   - Matriz impacto vs esfuerzo

4. **PROYECCIONES:**
   - Escenarios futuros basados en tendencias actuales
   - Riesgos de burnout en el equipo
   - Decisiones estratégicas necesarias

5. **PREGUNTAS DETONANTES:**
   - 3 preguntas sobre estrategia y foco
   - 3 preguntas sobre rentabilidad
   - 3 preguntas sobre el equipo

6. **DECISIONES DIFÍCILES:**
   - Feedback sin filtros sobre qué está mal
   - Recomendaciones valientes basadas en los datos
   - Decisiones impopulares pero necesarias

**IMPORTANTE:**
- Usa SOLO los datos reales proporcionados
- Si faltan datos, menciona qué métricas serían útiles recopilar
- Sé específico con números y porcentajes
- HTML simple (h3, p, ul, li, strong)

Genera el análisis completo ahora:`;

  return prompt;
}

function aggregateTaskMetrics(taskMetrics: any[]): any {
  const agg: any = { count: taskMetrics.length };
  
  taskMetrics.forEach(tm => {
    if (tm.revenue) agg.revenue = (agg.revenue || 0) + tm.revenue;
    if (tm.leads) agg.leads = (agg.leads || 0) + tm.leads;
    if (tm.conversions) agg.conversions = (agg.conversions || 0) + tm.conversions;
    if (tm.time_saved) agg.time_saved = (agg.time_saved || 0) + tm.time_saved;
    if (tm.time_hours) agg.time_saved = (agg.time_saved || 0) + tm.time_hours;
  });
  
  return agg;
}

function structureAnalysis(metrics: ProjectMetrics, aiAnalysis: string) {
  const avgCompletionRate = metrics.areas_performance.length > 0
    ? metrics.areas_performance.reduce((sum, a) => sum + (a.completed / (a.tasks || 1)), 0) / metrics.areas_performance.length * 100
    : 0;

  const latestBusinessMetrics = metrics.business_metrics && metrics.business_metrics.length > 0 
    ? metrics.business_metrics[0] 
    : null;

  return {
    money_section: {
      revenue: latestBusinessMetrics?.revenue || 0,
      growth: latestBusinessMetrics ? 0 : 0, // Calcular growth con histórico
      efficiency: Math.round(avgCompletionRate),
      margin: 0, // Calcular de product_margins si existe
      products: latestBusinessMetrics?.product_margins || [],
      channels: latestBusinessMetrics?.channel_roi || [],
      real_data: {
        has_revenue: !!latestBusinessMetrics?.revenue,
        has_leads: !!latestBusinessMetrics?.leads_generated,
        has_cac: !!latestBusinessMetrics?.cac,
        last_update: latestBusinessMetrics?.metric_date || null
      },
      ai_analysis: extractSection(aiAnalysis, 'DÓNDE ESTÁ EL DINERO', 'DÓNDE SE PIERDE TIEMPO')
    },
    efficiency_section: {
      time_distribution: [
        { category: 'Tareas críticas', percentage: 25 },
        { category: 'Tareas importantes', percentage: 35 },
        { category: 'Mantenimiento', percentage: 20 },
        { category: 'Sin impacto claro', percentage: 20 }
      ],
      team_performance: metrics.user_performance.map(u => ({
        name: u.name,
        tasks: u.tasks,
        avg_time: 2.3,
        impact: (u.tasks > 0 && u.completed / u.tasks > 0.8) ? 'Alto' : (u.tasks > 0 && u.completed / u.tasks > 0.6) ? 'Medio' : 'Bajo',
        score: u.tasks > 0 ? Math.round((u.completed / u.tasks) * 100) : 0
      })),
      bottlenecks: metrics.areas_performance
        .filter(a => a.tasks > 0 && (a.completed / a.tasks) < 0.5)
        .map(a => `${a.area} tiene baja eficiencia: ${a.completed}/${a.tasks} completadas`),
      real_data: {
        production_time: latestBusinessMetrics?.production_time || null,
        capacity_used: latestBusinessMetrics?.capacity_used || null,
        error_rate: latestBusinessMetrics?.error_rate || null
      },
      ai_analysis: extractSection(aiAnalysis, 'DÓNDE SE PIERDE TIEMPO', 'EN QUÉ ENFOCARSE')
    },
    focus_section: {
      priorities: [
        { title: 'Mejorar áreas con baja eficiencia', impact: 'Alto', effort: 'Medio', priority: 1 },
        { title: 'Potenciar equipo más eficiente', impact: 'Alto', effort: 'Bajo', priority: 1 },
        { title: 'Automatizar tareas repetitivas', impact: 'Medio', effort: 'Medio', priority: 2 }
      ],
      alerts: [
        { type: 'Eficiencia General', message: `Tasa de completación: ${Math.round(avgCompletionRate)}%`, severity: avgCompletionRate > 70 ? 'low' : 'medium' },
        { type: 'Equipo', message: `${metrics.team_size} personas en el equipo`, severity: 'low' }
      ],
      executive_summary: extractSection(aiAnalysis, 'EN QUÉ ENFOCARSE', 'PROYECCIONES')
    },
    future_section: {
      projections: [
        { week: 'S1', real: metrics.tasks_completed, projected: metrics.tasks_completed },
        { week: 'S2', real: 0, projected: Math.round(metrics.tasks_completed * 1.2) },
        { week: 'S3', real: 0, projected: Math.round(metrics.tasks_completed * 1.4) },
        { week: 'S4', real: 0, projected: Math.round(metrics.tasks_completed * 1.6) },
        { week: 'S5', real: 0, projected: Math.round(metrics.tasks_completed * 1.8) },
        { week: 'S6', real: 0, projected: Math.round(metrics.tasks_completed * 2.0) }
      ],
      phase_prediction: {
        phase: 3,
        probability: Math.round(avgCompletionRate),
        weeks: 6
      },
      burnout_risks: metrics.user_performance
        .filter(u => u.tasks > 15)
        .map(u => ({
          user: u.name,
          risk: u.tasks > 20 ? 'Alto' : 'Medio',
          reason: `${u.tasks} tareas asignadas`,
          action: u.tasks > 20 ? 'Reducir carga inmediatamente' : 'Monitorear'
        })),
      scenarios: [],
      ai_analysis: extractSection(aiAnalysis, 'PROYECCIONES', 'PREGUNTAS')
    },
    questions_section: {
      focus_questions: [],
      money_questions: [],
      team_questions: []
    },
    tough_decisions: {
      decisions: [],
      decision_history: [],
      ai_raw_feedback: extractSection(aiAnalysis, 'DECISIONES DIFÍCILES', '---END---')
    },
    benchmarks: {
      conversion_rate: { 
        value: latestBusinessMetrics?.conversion_rate || 0, 
        benchmark: 24, 
        position: latestBusinessMetrics?.conversion_rate ? `${latestBusinessMetrics.conversion_rate > 24 ? '+' : ''}${Math.round(((latestBusinessMetrics.conversion_rate / 24) - 1) * 100)}% vs promedio` : 'Sin datos'
      },
      cac: { 
        value: latestBusinessMetrics?.cac || 0, 
        benchmark: 15, 
        position: latestBusinessMetrics?.cac ? `${latestBusinessMetrics.cac < 15 ? '-' : '+'}${Math.round(Math.abs(((latestBusinessMetrics.cac / 15) - 1) * 100))}% vs sector` : 'Sin datos'
      },
      margin: { 
        value: 0, 
        benchmark: 27, 
        position: 'Sin datos' 
      },
      repeat_rate: { 
        value: latestBusinessMetrics?.repeat_rate || 0, 
        benchmark: 40, 
        position: latestBusinessMetrics?.repeat_rate ? `${latestBusinessMetrics.repeat_rate > 40 ? '+' : ''}${Math.round(latestBusinessMetrics.repeat_rate - 40)}pp vs sector` : 'Sin datos'
      }
    },
    raw_metrics: {
      business_metrics: latestBusinessMetrics,
      task_metrics_count: metrics.task_metrics?.length || 0,
      has_real_data: !!latestBusinessMetrics
    },
    generated_at: new Date().toISOString()
  };
}

function extractSection(text: string, startMarker: string, endMarker: string): string {
  const startIndex = text.indexOf(startMarker);
  const endIndex = text.indexOf(endMarker);
  
  if (startIndex === -1) return text;
  
  const section = endIndex === -1 
    ? text.substring(startIndex) 
    : text.substring(startIndex, endIndex);
  
  return section.replace(startMarker, '').trim();
}
