import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userId, role, roleName, roleDescription } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Generating tasks for user:', userId, 'Role:', role, roleName)

    // Obtener organización del usuario
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('organization_id')
      .eq('user_id', userId)
      .single()

    if (!userRole) {
      throw new Error('Usuario no tiene organización asignada')
    }

    // Obtener datos de la organización
    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', userRole.organization_id)
      .single()

    if (!org) {
      throw new Error('Organización no encontrada')
    }

    // Construir prompt para IA
    const roleLabel = role === 'custom' ? roleName : getRoleLabel(role)
    const roleDesc = role === 'custom' ? roleDescription : getRoleDescription(role)

    const prompt = `Eres un experto en gestión empresarial y planificación estratégica.

CONTEXTO DE LA EMPRESA:
- Nombre: ${org.name}
- Industria: ${org.industry}
- Tamaño: ${org.company_size}
- Descripción: ${org.business_description}
- Objetivos principales: ${org.main_objectives}
- Problemas actuales: ${org.current_problems}

ROL DEL USUARIO:
- Puesto: ${roleLabel}
- Descripción del rol: ${roleDesc}

INSTRUCCIONES:
Genera EXACTAMENTE 12 tareas específicas y accionables para la Fase 1 (primeras 2 semanas) que este usuario debe ejecutar en su rol para contribuir a los objetivos de la empresa.

Las tareas deben ser:
1. Específicas y medibles
2. Adaptadas a este rol y empresa en particular
3. Ejecutables en las primeras 2 semanas
4. Variadas en esfuerzo (algunas rápidas, otras más complejas)
5. Priorizadas del 1 al 12 (más importantes primero)

FORMATO DE RESPUESTA (JSON estricto):
{
  "tasks": [
    {
      "title": "Título breve y claro (máx 60 caracteres)",
      "description": "Descripción detallada de qué hacer y cómo (2-3 frases)",
      "area": "${roleLabel}",
      "estimated_cost": 0
    }
  ]
}

Genera SOLO el JSON, sin texto adicional.`

    console.log('Calling Lovable AI...')

    // Llamar a Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Eres un experto en planificación empresarial. Respondes SOLO en formato JSON válido.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('AI API error:', aiResponse.status, errorText)
      throw new Error(`Error de IA: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    const content = aiData.choices[0].message.content

    console.log('AI response received')

    // Parsear respuesta
    let tasksData
    try {
      // Extraer JSON del contenido (por si viene con texto adicional)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No se encontró JSON en la respuesta')
      }
      tasksData = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      console.log('AI content:', content)
      throw new Error('Error al parsear respuesta de IA')
    }

    if (!tasksData.tasks || !Array.isArray(tasksData.tasks)) {
      throw new Error('Formato de respuesta inválido')
    }

    console.log(`Inserting ${tasksData.tasks.length} tasks...`)

    // Insertar tareas en la base de datos
    const tasksToInsert = tasksData.tasks.map((task: any, index: number) => ({
      user_id: userId,
      organization_id: userRole.organization_id,
      title: task.title,
      description: task.description,
      area: task.area || roleLabel,
      phase: 1,
      order_index: index,
      estimated_cost: task.estimated_cost || 0,
    }))

    const { data: insertedTasks, error: insertError } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting tasks:', insertError)
      throw insertError
    }

    console.log(`Successfully created ${insertedTasks.length} tasks`)

    return new Response(
      JSON.stringify({
        success: true,
        tasksCreated: insertedTasks.length,
        message: `Se generaron ${insertedTasks.length} tareas personalizadas para tu rol`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Administración',
    marketing: 'Marketing y Redes',
    ventas: 'Ventas y Leads',
    finanzas: 'Finanzas',
    operaciones: 'Operaciones',
    producto: 'Producto',
    rrhh: 'Recursos Humanos',
    legal: 'Legal',
    soporte: 'Soporte al Cliente'
  }
  return labels[role] || role
}

function getRoleDescription(role: string): string {
  const descriptions: Record<string, string> = {
    admin: 'Responsable de la gestión general de la empresa, estrategia, coordinación de equipos y toma de decisiones clave',
    marketing: 'Gestión de campañas, redes sociales, branding, contenido y estrategias de adquisición de clientes',
    ventas: 'Gestión de leads, pipeline de ventas, cierre de deals y relaciones con clientes potenciales',
    finanzas: 'Control financiero, presupuestos, contabilidad, análisis de rentabilidad y gestión de gastos',
    operaciones: 'Optimización de procesos, logística, cadena de suministro y eficiencia operativa',
    producto: 'Desarrollo de producto, roadmap, features, UX/UI y mejoras continuas',
    rrhh: 'Reclutamiento, onboarding, cultura empresarial, desarrollo de talento y gestión de equipo',
    legal: 'Contratos, compliance, protección de datos, propiedad intelectual y asesoría legal',
    soporte: 'Atención al cliente, resolución de incidencias, satisfacción del cliente y feedback'
  }
  return descriptions[role] || 'Rol personalizado en la organización'
}