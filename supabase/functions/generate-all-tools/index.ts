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
- Industria: ${org.industry}
- Tamaño: ${org.company_size}
- Descripción: ${org.business_description}
- Clientes objetivo: ${org.target_customers}
- Propuesta de valor: ${org.value_proposition}
- Productos/Servicios: ${JSON.stringify(org.products_services)}
- Proceso de ventas: ${org.sales_process}
- Ciclo de ventas: ${org.sales_cycle_days} días
`

  const prompts: Record<string, string> = {
    buyer_persona: `Genera un Buyer Persona detallado para esta empresa:
${baseContext}

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
}`,

    customer_journey: `Genera un Customer Journey detallado para esta empresa:
${baseContext}

Genera SOLO el JSON con este formato exacto:
{
  "stages": [
    {"name": "Awareness", "description": "Descripción", "touchpoints": ["Punto 1", "Punto 2"], "emotions": ["Emoción 1"], "opportunities": ["Oportunidad 1"]},
    {"name": "Consideration", "description": "Descripción", "touchpoints": ["Punto 1"], "emotions": ["Emoción 1"], "opportunities": ["Oportunidad 1"]},
    {"name": "Decision", "description": "Descripción", "touchpoints": ["Punto 1"], "emotions": ["Emoción 1"], "opportunities": ["Oportunidad 1"]},
    {"name": "Retention", "description": "Descripción", "touchpoints": ["Punto 1"], "emotions": ["Emoción 1"], "opportunities": ["Oportunidad 1"]}
  ]
}`,

    growth_model: `Genera un Growth Model (AARRR Pirate Metrics) para esta empresa:
${baseContext}

Genera SOLO el JSON con este formato exacto:
{
  "metrics": [
    {"stage": "Acquisition", "kpis": ["KPI 1", "KPI 2"], "channels": ["Canal 1"], "tactics": ["Táctica 1"]},
    {"stage": "Activation", "kpis": ["KPI 1"], "channels": ["Canal 1"], "tactics": ["Táctica 1"]},
    {"stage": "Retention", "kpis": ["KPI 1"], "channels": ["Canal 1"], "tactics": ["Táctica 1"]},
    {"stage": "Revenue", "kpis": ["KPI 1"], "channels": ["Canal 1"], "tactics": ["Táctica 1"]},
    {"stage": "Referral", "kpis": ["KPI 1"], "channels": ["Canal 1"], "tactics": ["Táctica 1"]}
  ]
}`,

    lead_scoring: `Genera un modelo de Lead Scoring para esta empresa:
${baseContext}

Genera SOLO el JSON con este formato exacto:
{
  "criteria": [
    {"category": "Perfil Demográfico", "factors": [{"name": "Factor 1", "points": 10, "description": "Descripción"}]},
    {"category": "Comportamiento", "factors": [{"name": "Factor 1", "points": 15, "description": "Descripción"}]},
    {"category": "Engagement", "factors": [{"name": "Factor 1", "points": 20, "description": "Descripción"}]}
  ],
  "scoring_ranges": [
    {"min": 0, "max": 30, "grade": "C", "label": "Cold Lead"},
    {"min": 31, "max": 60, "grade": "B", "label": "Warm Lead"},
    {"min": 61, "max": 100, "grade": "A", "label": "Hot Lead"}
  ]
}`,

    sales_playbook: `Genera un Sales Playbook completo para esta empresa:
${baseContext}

Genera SOLO el JSON con este formato exacto:
{
  "intro": {
    "big_message": "Mensaje principal de ventas",
    "key_points": ["Punto 1", "Punto 2", "Punto 3", "Punto 4", "Punto 5"]
  },
  "scenarios": [
    {
      "name": "Cliente Individual",
      "icon": "👤",
      "tone": "Personal, cercano",
      "channels": {
        "instagram": "Speech para Instagram...",
        "whatsapp": "Speech para WhatsApp...",
        "email": "Speech para Email...",
        "phone": "Speech para llamada...",
        "presencial": "Speech presencial..."
      },
      "key_phrases": ["Frase 1", "Frase 2"],
      "objections": [{"question": "Objeción 1", "response": "Respuesta 1"}],
      "closing_steps": ["Paso 1", "Paso 2"]
    }
  ],
  "tips": [{"title": "Tip 1", "description": "Descripción"}],
  "final_message": "Mensaje final motivacional"
}`,

    sales_simulator: `Genera un Simulador de Ventas interactivo para esta empresa:
${baseContext}

Genera SOLO el JSON con este formato exacto:
{
  "quick_tips": [
    {"title": "Tip 1", "content": "Contenido del tip"}
  ],
  "scenarios": [
    {
      "id": "individual",
      "name": "Cliente Individual",
      "icon": "👤",
      "description": "Descripción del escenario",
      "stages": [
        {
          "id": "intro",
          "title": "Introducción",
          "client_message": "Mensaje inicial del cliente...",
          "options": [
            {"id": "a", "text": "Opción A de respuesta", "feedback": "Feedback positivo", "points": 10, "isCorrect": true},
            {"id": "b", "text": "Opción B de respuesta", "feedback": "Feedback negativo", "points": 0, "isCorrect": false}
          ],
          "tips": ["Tip para esta etapa"]
        }
      ]
    }
  ]
}`,

    communication_guide: `Genera una Guía de Comunicación completa para esta empresa:
${baseContext}

Genera SOLO el JSON con este formato exacto:
{
  "brand_voice": {
    "tone": "Descripción del tono de comunicación",
    "personality_traits": ["Rasgo 1", "Rasgo 2", "Rasgo 3"],
    "dos": ["Hacer esto", "Hacer aquello"],
    "donts": ["No hacer esto", "No hacer aquello"]
  },
  "key_messages": {
    "tagline": "Eslogan principal",
    "elevator_pitch": "Pitch de 30 segundos",
    "value_propositions": ["Propuesta 1", "Propuesta 2"]
  },
  "vocabulary": {
    "preferred_terms": [{"use": "Término preferido", "instead_of": "Término a evitar", "reason": "Razón"}],
    "power_words": ["Palabra poderosa 1", "Palabra poderosa 2"]
  },
  "templates": {
    "email_subject_lines": ["Asunto 1", "Asunto 2"],
    "social_media_hooks": ["Hook 1", "Hook 2"],
    "call_to_actions": ["CTA 1", "CTA 2"]
  },
  "scenarios": [
    {
      "situation": "Situación específica",
      "recommended_approach": "Enfoque recomendado",
      "sample_script": "Guión de ejemplo"
    }
  ]
}`
  }

  return prompts[toolType] || ''
}
