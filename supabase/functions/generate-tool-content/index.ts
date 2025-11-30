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
    const { toolType } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Obtener el token del usuario para verificar autenticación
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Usuario no autenticado')
    }

    console.log('Generating tool content for user:', user.id, 'Tool:', toolType)

    // Verificar que el usuario es admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role, organization_id')
      .eq('user_id', user.id)
      .single()

    if (!userRole || userRole.role !== 'admin') {
      throw new Error('Solo los administradores pueden generar contenido de herramientas')
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

    // Construir prompt según tipo de herramienta
    let prompt = ''
    let systemPrompt = 'Eres un experto en estrategia empresarial y marketing. Respondes SOLO en formato JSON válido.'

    if (toolType === 'buyer_persona') {
      prompt = `Genera un Buyer Persona detallado para esta empresa:

CONTEXTO DE LA EMPRESA:
- Nombre: ${org.name}
- Industria: ${org.industry}
- Tamaño: ${org.company_size}
- Descripción: ${org.business_description}
- Clientes objetivo: ${org.target_customers}
- Propuesta de valor: ${org.value_proposition}
- Productos/Servicios: ${JSON.stringify(org.products_services)}

Genera SOLO el JSON con este formato exacto:
{
  "name": "Nombre del persona",
  "age": "Rango de edad",
  "occupation": "Ocupación/Cargo",
  "industry": "Industria donde trabaja",
  "goals": ["Objetivo 1", "Objetivo 2", "Objetivo 3"],
  "challenges": ["Desafío 1", "Desafío 2", "Desafío 3"],
  "values": ["Valor 1", "Valor 2", "Valor 3"],
  "channels": ["Canal 1", "Canal 2", "Canal 3"],
  "quote": "Una cita representativa del persona"
}`

    } else if (toolType === 'customer_journey') {
      prompt = `Genera un Customer Journey detallado para esta empresa:

CONTEXTO DE LA EMPRESA:
- Nombre: ${org.name}
- Industria: ${org.industry}
- Proceso de ventas: ${org.sales_process}
- Duración del ciclo: ${org.sales_cycle_days} días
- Fuentes de leads: ${JSON.stringify(org.lead_sources)}

Genera SOLO el JSON con este formato exacto:
{
  "stages": [
    {
      "name": "Awareness",
      "description": "Descripción de esta etapa",
      "touchpoints": ["Punto de contacto 1", "Punto de contacto 2"],
      "emotions": ["Emoción 1", "Emoción 2"],
      "opportunities": ["Oportunidad 1", "Oportunidad 2"]
    },
    {
      "name": "Consideration",
      "description": "Descripción de esta etapa",
      "touchpoints": ["Punto de contacto 1", "Punto de contacto 2"],
      "emotions": ["Emoción 1", "Emoción 2"],
      "opportunities": ["Oportunidad 1", "Oportunidad 2"]
    },
    {
      "name": "Decision",
      "description": "Descripción de esta etapa",
      "touchpoints": ["Punto de contacto 1", "Punto de contacto 2"],
      "emotions": ["Emoción 1", "Emoción 2"],
      "opportunities": ["Oportunidad 1", "Oportunidad 2"]
    },
    {
      "name": "Retention",
      "description": "Descripción de esta etapa",
      "touchpoints": ["Punto de contacto 1", "Punto de contacto 2"],
      "emotions": ["Emoción 1", "Emoción 2"],
      "opportunities": ["Oportunidad 1", "Oportunidad 2"]
    }
  ]
}`

    } else if (toolType === 'growth_model') {
      prompt = `Genera un Growth Model (modelo AARRR Pirate Metrics) para esta empresa:

CONTEXTO DE LA EMPRESA:
- Nombre: ${org.name}
- Industria: ${org.industry}
- Objetivos principales: ${org.main_objectives}
- KPIs a medir: ${JSON.stringify(org.kpis_to_measure)}

Genera SOLO el JSON con este formato exacto:
{
  "metrics": [
    {
      "stage": "Acquisition",
      "kpis": ["KPI 1", "KPI 2", "KPI 3"],
      "channels": ["Canal 1", "Canal 2"],
      "tactics": ["Táctica 1", "Táctica 2"]
    },
    {
      "stage": "Activation",
      "kpis": ["KPI 1", "KPI 2"],
      "channels": ["Canal 1", "Canal 2"],
      "tactics": ["Táctica 1", "Táctica 2"]
    },
    {
      "stage": "Retention",
      "kpis": ["KPI 1", "KPI 2"],
      "channels": ["Canal 1", "Canal 2"],
      "tactics": ["Táctica 1", "Táctica 2"]
    },
    {
      "stage": "Revenue",
      "kpis": ["KPI 1", "KPI 2"],
      "channels": ["Canal 1", "Canal 2"],
      "tactics": ["Táctica 1", "Táctica 2"]
    },
    {
      "stage": "Referral",
      "kpis": ["KPI 1", "KPI 2"],
      "channels": ["Canal 1", "Canal 2"],
      "tactics": ["Táctica 1", "Táctica 2"]
    }
  ]
}`

    } else if (toolType === 'lead_scoring') {
      prompt = `Genera un modelo de Lead Scoring para esta empresa:

CONTEXTO DE LA EMPRESA:
- Nombre: ${org.name}
- Industria: ${org.industry}
- Clientes objetivo: ${org.target_customers}
- Proceso de ventas: ${org.sales_process}

Genera SOLO el JSON con este formato exacto:
{
  "criteria": [
    {
      "category": "Perfil Demográfico",
      "factors": [
        {"name": "Factor 1", "points": 10, "description": "Descripción"},
        {"name": "Factor 2", "points": 5, "description": "Descripción"}
      ]
    },
    {
      "category": "Comportamiento",
      "factors": [
        {"name": "Factor 1", "points": 15, "description": "Descripción"},
        {"name": "Factor 2", "points": 10, "description": "Descripción"}
      ]
    },
    {
      "category": "Engagement",
      "factors": [
        {"name": "Factor 1", "points": 20, "description": "Descripción"},
        {"name": "Factor 2", "points": 15, "description": "Descripción"}
      ]
    }
  ],
  "scoring_ranges": [
    {"min": 0, "max": 30, "grade": "C", "label": "Cold Lead"},
    {"min": 31, "max": 60, "grade": "B", "label": "Warm Lead"},
    {"min": 61, "max": 100, "grade": "A", "label": "Hot Lead"}
  ]
}`
    }

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
          { role: 'system', content: systemPrompt },
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
    let toolContent
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No se encontró JSON en la respuesta')
      }
      toolContent = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      console.log('AI content:', content)
      throw new Error('Error al parsear respuesta de IA')
    }

    console.log('Saving tool content to database...')

    // Guardar o actualizar en la base de datos
    const { data: existingContent } = await supabase
      .from('tool_contents')
      .select('id')
      .eq('organization_id', userRole.organization_id)
      .eq('tool_type', toolType)
      .single()

    let result
    if (existingContent) {
      // Actualizar contenido existente
      const { data, error } = await supabase
        .from('tool_contents')
        .update({
          content: toolContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingContent.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Insertar nuevo contenido
      const { data, error } = await supabase
        .from('tool_contents')
        .insert({
          organization_id: userRole.organization_id,
          tool_type: toolType,
          content: toolContent,
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    console.log('Tool content saved successfully')

    return new Response(
      JSON.stringify({
        success: true,
        content: result,
        message: 'Contenido generado exitosamente'
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
