import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Tool types to generate
const TOOL_TYPES = [
  'buyer_persona',
  'customer_journey',
  'growth_model',
  'lead_scoring',
  'sales_playbook',
  'sales_simulator',
  'communication_guide'
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { organizationId } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Generating all tools for organization:', organizationId)

    // Get organization data
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      throw new Error('Organization not found')
    }

    // Generate each tool in sequence (to avoid rate limiting)
    for (const toolType of TOOL_TYPES) {
      console.log(`Generating ${toolType}...`)
      
      try {
        const content = await generateToolContent(toolType, org, lovableApiKey)
        
        if (content) {
          // Save to database
          const { error: saveError } = await supabase
            .from('tool_contents')
            .upsert({
              organization_id: organizationId,
              tool_type: toolType,
              content: content,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'organization_id,tool_type'
            })

          if (saveError) {
            console.error(`Error saving ${toolType}:`, saveError)
          } else {
            console.log(`${toolType} saved successfully`)
          }
        }
      } catch (toolError) {
        console.error(`Error generating ${toolType}:`, toolError)
        // Continue with next tool
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Update organization status
    await supabase
      .from('organizations')
      .update({ ai_tools_generated: true })
      .eq('id', organizationId)

    console.log('All tools generated successfully')

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Error in generate-all-tools:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function generateToolContent(toolType: string, org: Record<string, unknown>, apiKey: string): Promise<Record<string, unknown> | null> {
  const prompt = buildPrompt(toolType, org)
  const systemPrompt = 'Eres un experto en estrategia empresarial y marketing. Respondes SOLO en formato JSON válido sin markdown ni explicaciones adicionales.'

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    })
  })

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('No content in response')
  }

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No valid JSON found in response')
  }

  return JSON.parse(jsonMatch[0])
}

function buildPrompt(toolType: string, org: Record<string, unknown>): string {
  const baseContext = `
CONTEXTO DE LA EMPRESA:
- Nombre: ${org.name}
- Industria: ${org.industry || 'No especificada'}
- Tamaño: ${org.company_size || 'No especificado'}
- Descripción: ${org.business_description || 'No especificada'}
- Clientes objetivo: ${org.target_customers || 'No especificados'}
- Propuesta de valor: ${org.value_proposition || 'No especificada'}
- Productos/Servicios: ${JSON.stringify(org.products_services || [])}
- Proceso de ventas: ${org.sales_process || 'No especificado'}
- Ciclo de ventas: ${org.sales_cycle_days || 30} días
`

  const prompts: Record<string, string> = {
    buyer_persona: `Genera un Buyer Persona detallado y personalizado para esta empresa específica:
${baseContext}

IMPORTANTE: Genera contenido 100% personalizado basado en la industria, productos y clientes de esta empresa.

Genera SOLO el JSON con este formato exacto:
{
  "name": "Nombre realista del persona (ej: 'María García' o 'Carlos Director')",
  "age": "Rango de edad específico (ej: '35-45 años')",
  "occupation": "Cargo específico relevante para esta empresa",
  "industry": "Industria donde trabaja este persona",
  "goals": ["Objetivo profesional 1 relevante", "Objetivo profesional 2", "Objetivo personal relacionado"],
  "challenges": ["Desafío 1 que tu producto resuelve", "Desafío 2 específico", "Desafío 3 del día a día"],
  "values": ["Valor 1 importante para este persona", "Valor 2", "Valor 3"],
  "channels": ["Canal digital favorito", "Red social principal", "Medio de comunicación preferido"],
  "quote": "Una frase que este persona diría sobre su trabajo o necesidades"
}`,

    customer_journey: `Genera un Customer Journey detallado y personalizado para esta empresa:
${baseContext}

IMPORTANTE: Personaliza cada etapa con touchpoints y oportunidades específicas para esta industria y tipo de cliente.

Genera SOLO el JSON con este formato exacto:
{
  "stages": [
    {"name": "Awareness", "description": "Cómo el cliente descubre tu solución", "touchpoints": ["Touchpoint 1 específico", "Touchpoint 2"], "emotions": ["Emoción típica"], "opportunities": ["Oportunidad de mejora 1", "Oportunidad 2"]},
    {"name": "Consideration", "description": "Proceso de evaluación del cliente", "touchpoints": ["Touchpoint 1", "Touchpoint 2"], "emotions": ["Emoción típica"], "opportunities": ["Oportunidad 1", "Oportunidad 2"]},
    {"name": "Decision", "description": "Momento de la decisión de compra", "touchpoints": ["Touchpoint 1", "Touchpoint 2"], "emotions": ["Emoción típica"], "opportunities": ["Oportunidad 1", "Oportunidad 2"]},
    {"name": "Retention", "description": "Experiencia post-compra", "touchpoints": ["Touchpoint 1", "Touchpoint 2"], "emotions": ["Emoción típica"], "opportunities": ["Oportunidad 1", "Oportunidad 2"]},
    {"name": "Advocacy", "description": "Conversión en promotor", "touchpoints": ["Touchpoint 1", "Touchpoint 2"], "emotions": ["Emoción típica"], "opportunities": ["Oportunidad 1", "Oportunidad 2"]}
  ]
}`,

    growth_model: `Genera un Growth Model (AARRR Pirate Metrics) personalizado para esta empresa:
${baseContext}

IMPORTANTE: Los KPIs, canales y tácticas deben ser específicos para esta industria y modelo de negocio.

Genera SOLO el JSON con este formato exacto:
{
  "metrics": [
    {"stage": "Acquisition", "kpis": ["KPI específico 1", "KPI específico 2", "KPI 3"], "channels": ["Canal 1 relevante", "Canal 2"], "tactics": ["Táctica 1 específica", "Táctica 2", "Táctica 3"]},
    {"stage": "Activation", "kpis": ["KPI de activación 1", "KPI 2"], "channels": ["Canal 1", "Canal 2"], "tactics": ["Táctica 1", "Táctica 2"]},
    {"stage": "Retention", "kpis": ["KPI de retención 1", "KPI 2"], "channels": ["Canal 1", "Canal 2"], "tactics": ["Táctica 1", "Táctica 2"]},
    {"stage": "Revenue", "kpis": ["KPI de ingresos 1", "KPI 2"], "channels": ["Canal 1", "Canal 2"], "tactics": ["Táctica 1", "Táctica 2"]},
    {"stage": "Referral", "kpis": ["KPI de referidos 1", "KPI 2"], "channels": ["Canal 1", "Canal 2"], "tactics": ["Táctica 1", "Táctica 2"]}
  ]
}`,

    lead_scoring: `Genera un modelo de Lead Scoring personalizado para esta empresa:
${baseContext}

IMPORTANTE: Los factores de puntuación deben ser específicos para el tipo de cliente y proceso de venta de esta empresa.

Genera SOLO el JSON con este formato exacto:
{
  "criteria": [
    {"category": "Datos Demográficos", "factors": [{"name": "Factor relevante 1", "points": 15, "description": "Por qué este factor indica un buen lead"}, {"name": "Factor 2", "points": 10, "description": "Descripción"}, {"name": "Factor 3", "points": 20, "description": "Descripción"}]},
    {"category": "Comportamiento Digital", "factors": [{"name": "Acción web 1", "points": 15, "description": "Descripción"}, {"name": "Acción 2", "points": 10, "description": "Descripción"}, {"name": "Acción 3", "points": 25, "description": "Descripción"}]},
    {"category": "Engagement de Ventas", "factors": [{"name": "Interacción 1", "points": 20, "description": "Descripción"}, {"name": "Interacción 2", "points": 15, "description": "Descripción"}, {"name": "Interacción 3", "points": 10, "description": "Descripción"}]},
    {"category": "Factores Negativos", "factors": [{"name": "Factor negativo 1", "points": -15, "description": "Descripción"}, {"name": "Factor negativo 2", "points": -10, "description": "Descripción"}]}
  ],
  "scoring_ranges": [
    {"min": 0, "max": 40, "grade": "C", "label": "Cold Lead - Nutrir con contenido"},
    {"min": 41, "max": 70, "grade": "B", "label": "Warm Lead - Seguimiento activo"},
    {"min": 71, "max": 100, "grade": "A", "label": "Hot Lead - Contactar inmediatamente"}
  ]
}`,

    sales_playbook: `Genera un Sales Playbook completo y personalizado para esta empresa:
${baseContext}

IMPORTANTE: Los speeches y frases deben usar el lenguaje y tono apropiado para esta industria y tipo de cliente.

Genera SOLO el JSON con este formato exacto:
{
  "intro": {
    "big_message": "Mensaje principal de ventas que captura la propuesta de valor",
    "key_points": ["Punto clave 1 de la propuesta", "Beneficio principal 2", "Diferenciador 3", "Resultado esperado 4", "Garantía o promesa 5"]
  },
  "scenarios": [
    {
      "name": "Cliente Tipo 1 (basado en tu buyer persona)",
      "icon": "👤",
      "tone": "Tono de comunicación apropiado",
      "channels": {
        "email": "Speech personalizado para email frío...",
        "whatsapp": "Speech para WhatsApp profesional...",
        "phone": "Guión para llamada telefónica...",
        "linkedin": "Mensaje para LinkedIn...",
        "presencial": "Pitch para reunión presencial..."
      },
      "key_phrases": ["Frase poderosa 1", "Frase de cierre 2", "Frase para objeciones 3"],
      "objections": [{"question": "Objeción común 1", "response": "Respuesta efectiva 1"}, {"question": "Objeción 2", "response": "Respuesta 2"}],
      "closing_steps": ["Paso de cierre 1", "Paso 2", "Paso final"]
    }
  ],
  "tips": [{"title": "Tip estratégico 1", "description": "Descripción detallada del tip"}, {"title": "Tip 2", "description": "Descripción"}],
  "final_message": "Mensaje motivacional final para el equipo de ventas"
}`,

    sales_simulator: `Genera un Simulador de Ventas interactivo y personalizado para esta empresa:
${baseContext}

IMPORTANTE: Los escenarios deben reflejar situaciones reales que el equipo de ventas de esta empresa enfrenta.

Genera SOLO el JSON con este formato exacto:
{
  "quick_tips": [
    {"category": "Apertura", "tip": "Consejo específico para abrir conversaciones con clientes de esta industria"},
    {"category": "Descubrimiento", "tip": "Consejo para hacer preguntas efectivas"},
    {"category": "Objeciones", "tip": "Consejo para manejar objeciones comunes"},
    {"category": "Cierre", "tip": "Consejo para cerrar ventas efectivamente"},
    {"category": "Seguimiento", "tip": "Consejo para el seguimiento post-reunión"}
  ],
  "scenarios": [
    {
      "title": "Escenario 1: Cliente Tipo Principal",
      "difficulty": "Medio",
      "client_profile": {
        "name": "Nombre realista del cliente",
        "role": "Cargo del cliente",
        "company_type": "Tipo de empresa",
        "personality": "Tipo de personalidad (Analítico, Expresivo, etc.)",
        "budget_level": "Alto/Medio/Bajo"
      },
      "conversation_flow": [
        {
          "stage": "Apertura",
          "client_says": "Mensaje inicial del cliente expresando su situación o pregunta",
          "options": [
            {"response": "Respuesta excelente que demuestra empatía y profesionalismo", "score": 10, "feedback": "Feedback positivo explicando por qué es buena respuesta"},
            {"response": "Respuesta aceptable pero mejorable", "score": 5, "feedback": "Feedback explicando qué podría mejorar"},
            {"response": "Respuesta inadecuada", "score": 2, "feedback": "Feedback explicando por qué no es efectiva"}
          ]
        },
        {
          "stage": "Descubrimiento",
          "client_says": "El cliente comparte más información sobre su necesidad",
          "options": [
            {"response": "Respuesta que profundiza en las necesidades", "score": 10, "feedback": "Feedback positivo"},
            {"response": "Respuesta que salta a la venta muy rápido", "score": 4, "feedback": "Feedback de mejora"},
            {"response": "Respuesta que cambia de tema", "score": 1, "feedback": "Feedback negativo"}
          ]
        },
        {
          "stage": "Presentación de Valor",
          "client_says": "El cliente pregunta sobre tu solución",
          "options": [
            {"response": "Respuesta que conecta beneficios con necesidades expresadas", "score": 10, "feedback": "Feedback positivo"},
            {"response": "Respuesta genérica sobre el producto", "score": 5, "feedback": "Feedback de mejora"},
            {"response": "Respuesta que solo habla de características", "score": 3, "feedback": "Feedback negativo"}
          ]
        },
        {
          "stage": "Cierre",
          "client_says": "El cliente muestra interés pero duda",
          "options": [
            {"response": "Respuesta que aborda la duda y propone siguiente paso", "score": 10, "feedback": "Feedback positivo"},
            {"response": "Respuesta que presiona demasiado", "score": 4, "feedback": "Feedback de mejora"},
            {"response": "Respuesta que no pide ningún compromiso", "score": 2, "feedback": "Feedback negativo"}
          ]
        }
      ],
      "ideal_outcome": "Descripción del resultado ideal de este escenario",
      "learning_points": ["Aprendizaje clave 1", "Aprendizaje 2", "Aprendizaje 3"]
    }
  ]
}`,

    communication_guide: `Genera una Guía de Comunicación completa y personalizada para esta empresa:
${baseContext}

IMPORTANTE: El tono, vocabulario y mensajes deben reflejar la identidad de marca de esta empresa.

Genera SOLO el JSON con este formato exacto:
{
  "brand_voice": {
    "tone": "Descripción detallada del tono de comunicación ideal para esta marca",
    "personality_traits": ["Rasgo de personalidad 1", "Rasgo 2", "Rasgo 3", "Rasgo 4"],
    "dos": ["Hacer: comportamiento 1", "Hacer: comportamiento 2", "Hacer: comportamiento 3"],
    "donts": ["No hacer: comportamiento 1", "No hacer: comportamiento 2", "No hacer: comportamiento 3"]
  },
  "key_messages": {
    "tagline": "Eslogan o frase principal de la marca",
    "elevator_pitch": "Pitch de 30 segundos explicando qué hace la empresa y por qué importa",
    "value_propositions": ["Propuesta de valor 1", "Propuesta de valor 2", "Propuesta de valor 3"]
  },
  "vocabulary": {
    "preferred_terms": [
      {"use": "Término preferido", "instead_of": "Término a evitar", "reason": "Razón del cambio"},
      {"use": "Otro término", "instead_of": "Término viejo", "reason": "Razón"}
    ],
    "power_words": ["Palabra poderosa 1", "Palabra 2", "Palabra 3", "Palabra 4", "Palabra 5"]
  },
  "templates": {
    "email_subject_lines": ["Asunto efectivo 1", "Asunto 2", "Asunto 3"],
    "social_media_hooks": ["Hook para redes 1", "Hook 2", "Hook 3"],
    "call_to_actions": ["CTA 1", "CTA 2", "CTA 3"]
  },
  "scenarios": [
    {"situation": "Situación de comunicación 1", "recommended_approach": "Enfoque recomendado", "sample_script": "Ejemplo de guión o mensaje"},
    {"situation": "Situación 2", "recommended_approach": "Enfoque", "sample_script": "Ejemplo"}
  ]
}`
  }

  return prompts[toolType] || ''
}
