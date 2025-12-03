import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { onboardingId } = await req.json()

    if (!onboardingId) {
      throw new Error('onboardingId is required')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Fetch onboarding data
    const { data: onboarding, error: fetchError } = await supabaseClient
      .from('startup_onboardings')
      .select('*')
      .eq('id', onboardingId)
      .single()

    if (fetchError || !onboarding) {
      throw new Error('Onboarding not found')
    }

    const orgId = onboarding.organization_id

    // 2. Update organization business_type
    await supabaseClient
      .from('organizations')
      .update({ business_type: 'startup' })
      .eq('id', orgId)

    // 3. Generate validation tasks using Lovable AI Gateway
    const tasks = await generateStartupTasks(onboarding)
    await insertTasks(supabaseClient, orgId, onboarding.created_by, tasks)

    // 4. Create initial validation metrics
    await createValidationMetrics(supabaseClient, orgId, onboarding)

    // 5. Create financial projections
    await createProjections(supabaseClient, orgId, onboarding)

    console.log('Startup workspace generated successfully for org:', orgId)

    return new Response(
      JSON.stringify({ success: true, message: 'Startup workspace generated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

async function generateStartupTasks(onboarding: Record<string, unknown>) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  
  if (!LOVABLE_API_KEY) {
    console.log('LOVABLE_API_KEY not found, using default tasks')
    return getDefaultTasks()
  }

  const hypothesesText = Array.isArray(onboarding.critical_hypotheses) 
    ? onboarding.critical_hypotheses.map((h: { hypothesis: string; validationMethod: string }, i: number) => 
        `${i + 1}. ${h.hypothesis} (Validar con: ${h.validationMethod})`
      ).join('\n')
    : 'No definidas';

  const prompt = `Eres un experto en metodología Lean Startup. Genera 12 tareas de validación para esta startup:

STARTUP:
- Nombre: ${onboarding.business_name}
- Problema: ${onboarding.problem_statement}
- Solución: ${onboarding.solution_description}
- Cliente ideal: ${onboarding.ideal_customer_profile}
- MVP: ${onboarding.mvp_description}
- Estrategia de lanzamiento: ${onboarding.launch_strategy}

HIPÓTESIS CRÍTICAS A VALIDAR:
${hypothesesText}

FASE ACTUAL: Pre-MVP / Validación

Genera 12 tareas ordenadas cronológicamente que:
1. Empiecen por validación del problema (entrevistas, encuestas)
2. Sigan con validación de la solución (mockups, landing page)
3. Incluyan construcción de MVP mínimo
4. Terminen con primeras ventas/signups

IMPORTANTE:
- Deben ser accionables y específicas
- Con métricas claras de éxito
- Estimar tiempo realista en horas

Responde SOLO con JSON válido en este formato:
[
  {
    "title": "Realizar 20 entrevistas con clientes potenciales",
    "description": "Entrevistar a 20 personas del ICP para validar que el problema existe.",
    "area": "validacion",
    "estimated_time_hours": 10,
    "is_collaborative": false
  }
]`

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
          { role: 'system', content: 'Eres un experto en startups y metodología Lean. Responde siempre en JSON válido.' },
          { role: 'user', content: prompt }
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI Gateway error:', response.status, errorText)
      return getDefaultTasks()
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    // Clean markdown if wrapped
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    try {
      return JSON.parse(cleanContent)
    } catch {
      console.error('Failed to parse AI response, using defaults')
      return getDefaultTasks()
    }
  } catch (error) {
    console.error('Error calling AI Gateway:', error)
    return getDefaultTasks()
  }
}

function getDefaultTasks() {
  return [
    { title: 'Realizar 20 entrevistas de customer discovery', description: 'Entrevistar a potenciales clientes para validar el problema', area: 'validacion', estimated_time_hours: 10, is_collaborative: false },
    { title: 'Crear landing page de validación', description: 'Diseñar y publicar landing page para captar emails de interesados', area: 'marketing', estimated_time_hours: 4, is_collaborative: false },
    { title: 'Definir métricas clave del MVP', description: 'Establecer los KPIs que medirán el éxito del MVP', area: 'estrategia', estimated_time_hours: 2, is_collaborative: false },
    { title: 'Diseñar mockups del MVP', description: 'Crear wireframes y mockups de las pantallas principales', area: 'producto', estimated_time_hours: 6, is_collaborative: false },
    { title: 'Validar mockups con 10 usuarios', description: 'Mostrar mockups a usuarios potenciales y recoger feedback', area: 'validacion', estimated_time_hours: 5, is_collaborative: false },
    { title: 'Desarrollar MVP funcional', description: 'Construir la primera versión funcional del producto', area: 'desarrollo', estimated_time_hours: 40, is_collaborative: false },
    { title: 'Configurar analytics básico', description: 'Implementar tracking de eventos clave en el MVP', area: 'desarrollo', estimated_time_hours: 3, is_collaborative: false },
    { title: 'Lanzar beta privada', description: 'Invitar a los primeros 10-20 usuarios beta', area: 'lanzamiento', estimated_time_hours: 2, is_collaborative: false },
    { title: 'Recoger feedback de usuarios beta', description: 'Entrevistar usuarios beta y documentar mejoras', area: 'validacion', estimated_time_hours: 8, is_collaborative: false },
    { title: 'Iterar MVP con feedback', description: 'Implementar las mejoras más críticas basadas en feedback', area: 'desarrollo', estimated_time_hours: 20, is_collaborative: false },
    { title: 'Preparar lanzamiento público', description: 'Crear materiales de marketing y preparar Product Hunt', area: 'marketing', estimated_time_hours: 8, is_collaborative: false },
    { title: 'Conseguir primeros 10 clientes de pago', description: 'Convertir usuarios beta en clientes que paguen', area: 'ventas', estimated_time_hours: 15, is_collaborative: false },
  ]
}

async function insertTasks(supabaseClient: AnySupabaseClient, orgId: string, userId: string, tasks: Array<{ title: string; description: string; area: string; estimated_time_hours: number; is_collaborative: boolean }>) {
  const tasksToInsert = tasks.map((task, index) => ({
    organization_id: orgId,
    user_id: userId,
    phase: 1,
    title: task.title,
    description: task.description,
    area: task.area || 'validacion',
    estimated_time_hours: task.estimated_time_hours || 2,
    is_collaborative: task.is_collaborative || false,
    order_index: index + 1,
  }))

  const { error } = await supabaseClient.from('tasks').insert(tasksToInsert)

  if (error) {
    console.error('Error inserting tasks:', error)
  }
}

async function createValidationMetrics(supabaseClient: AnySupabaseClient, orgId: string, onboarding: Record<string, unknown>) {
  const prelaunchMetrics = Array.isArray(onboarding.prelaunch_metrics) ? onboarding.prelaunch_metrics : []
  const postlaunchKPIs = Array.isArray(onboarding.postlaunch_kpis) ? onboarding.postlaunch_kpis : []

  const metricsToInsert = [
    ...prelaunchMetrics.map((metric: string) => ({
      organization_id: orgId,
      metric_name: metric,
      metric_type: 'prelaunch',
      current_value: 0,
      target_value: 100,
      unit: 'count',
    })),
    ...postlaunchKPIs.map((kpi: string) => ({
      organization_id: orgId,
      metric_name: kpi,
      metric_type: 'postlaunch',
      current_value: 0,
      target_value: 1000,
      unit: 'count',
    }))
  ]

  if (metricsToInsert.length > 0) {
    await supabaseClient.from('startup_validation_metrics').insert(metricsToInsert)
  }
}

async function createProjections(supabaseClient: AnySupabaseClient, orgId: string, onboarding: Record<string, unknown>) {
  const costStructure = Array.isArray(onboarding.cost_structure) ? onboarding.cost_structure : []
  const monthlyBurnRate = costStructure.reduce((sum: number, cost: { estimatedMonthlyCost?: number }) => 
    sum + (cost.estimatedMonthlyCost || 0), 0)

  const baseProjection = {
    organization_id: orgId,
    onboarding_id: onboarding.id as string,
    type: 'baseline',
    initial_capital: (onboarding.current_capital as number) || 0,
    monthly_burn_rate: monthlyBurnRate,
    runway_months: (onboarding.runway_goal_months as number) || 12,
    month_1_signups: 50,
    month_3_signups: 200,
    month_6_signups: 500,
    month_12_signups: 2000,
    month_1_revenue: 0,
    month_3_revenue: ((onboarding.pricing_middle_tier as number) || 50) * 20,
    month_6_revenue: ((onboarding.pricing_middle_tier as number) || 50) * 50,
    month_12_revenue: ((onboarding.pricing_middle_tier as number) || 50) * 200,
  }

  await supabaseClient.from('startup_projections').insert(baseProjection)
}
