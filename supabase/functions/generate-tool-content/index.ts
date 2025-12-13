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

    } else if (toolType === 'sales_playbook') {
      prompt = `Genera un Sales Playbook completo para esta empresa:

CONTEXTO DE LA EMPRESA:
- Nombre: ${org.name}
- Industria: ${org.industry}
- Descripción: ${org.business_description}
- Productos/Servicios: ${JSON.stringify(org.products_services)}
- Clientes objetivo: ${org.target_customers}
- Propuesta de valor: ${org.value_proposition}
- Proceso de ventas: ${org.sales_process}

Genera SOLO el JSON con este formato exacto:
{
  "intro": {
    "big_message": "NO VENDEMOS PRODUCTOS - VENDEMOS EXPERIENCIAS",
    "key_points": [
      "Punto clave 1 sobre cómo vender",
      "Punto clave 2 sobre cómo vender",
      "Punto clave 3 sobre cómo vender",
      "Punto clave 4 sobre cómo vender",
      "Punto clave 5 sobre cómo vender"
    ]
  },
  "scenarios": [
    {
      "name": "Cliente Individual",
      "icon": "👤",
      "tone": "Personal, cercano, enfocado en beneficios individuales",
      "channels": {
        "instagram": "Speech de ejemplo para Instagram DM...",
        "whatsapp": "Speech de ejemplo para WhatsApp...",
        "email": "Speech de ejemplo para Email...",
        "phone": "Speech de ejemplo para llamada telefónica...",
        "presencial": "Speech de ejemplo para venta presencial..."
      },
      "key_phrases": [
        "Frase clave 1",
        "Frase clave 2",
        "Frase clave 3",
        "Frase clave 4",
        "Frase clave 5",
        "Frase clave 6"
      ],
      "objections": [
        {"question": "Objeción común 1", "response": "Respuesta efectiva 1"},
        {"question": "Objeción común 2", "response": "Respuesta efectiva 2"},
        {"question": "Objeción común 3", "response": "Respuesta efectiva 3"}
      ],
      "closing_steps": [
        "Paso 1 para cerrar la venta",
        "Paso 2 para cerrar la venta",
        "Paso 3 para cerrar la venta",
        "Paso 4 para cerrar la venta"
      ]
    },
    {
      "name": "Familia",
      "icon": "👨‍👩‍👧‍👦",
      "tone": "Cálido, tradicional, enfocado en compartir momentos",
      "channels": {
        "instagram": "Speech de ejemplo para familias en Instagram...",
        "whatsapp": "Speech de ejemplo para familias en WhatsApp...",
        "email": "Speech de ejemplo para familias por Email...",
        "phone": "Speech de ejemplo para familias por teléfono...",
        "presencial": "Speech de ejemplo para familias presencial..."
      },
      "key_phrases": ["Frase 1", "Frase 2", "Frase 3", "Frase 4", "Frase 5", "Frase 6"],
      "objections": [
        {"question": "Objeción 1", "response": "Respuesta 1"},
        {"question": "Objeción 2", "response": "Respuesta 2"}
      ],
      "closing_steps": ["Paso 1", "Paso 2", "Paso 3", "Paso 4"]
    },
    {
      "name": "Grupo de Amigos",
      "icon": "🎉",
      "tone": "Divertido, alternativo, diferente",
      "channels": {
        "instagram": "Speech para grupos en Instagram...",
        "whatsapp": "Speech para grupos en WhatsApp...",
        "email": "Speech para grupos por Email...",
        "phone": "Speech para grupos por teléfono...",
        "presencial": "Speech para grupos presencial..."
      },
      "key_phrases": ["Frase 1", "Frase 2", "Frase 3", "Frase 4", "Frase 5", "Frase 6"],
      "objections": [
        {"question": "Objeción 1", "response": "Respuesta 1"},
        {"question": "Objeción 2", "response": "Respuesta 2"}
      ],
      "closing_steps": ["Paso 1", "Paso 2", "Paso 3", "Paso 4"]
    },
    {
      "name": "Empresa B2B",
      "icon": "💼",
      "tone": "Profesional, ROI, beneficios corporativos",
      "channels": {
        "instagram": "Speech B2B para Instagram...",
        "whatsapp": "Speech B2B para WhatsApp...",
        "email": "Speech B2B profesional por Email...",
        "phone": "Speech B2B para llamadas...",
        "presencial": "Speech B2B para reuniones presenciales..."
      },
      "key_phrases": ["Frase B2B 1", "Frase B2B 2", "Frase B2B 3", "Frase B2B 4", "Frase B2B 5", "Frase B2B 6"],
      "objections": [
        {"question": "Objeción B2B 1", "response": "Respuesta B2B 1"},
        {"question": "Objeción B2B 2", "response": "Respuesta B2B 2"},
        {"question": "Objeción B2B 3", "response": "Respuesta B2B 3"}
      ],
      "closing_steps": ["Paso B2B 1", "Paso B2B 2", "Paso B2B 3", "Paso B2B 4", "Paso B2B 5"]
    }
  ],
  "tips": [
    {"title": "Tip 1 título", "description": "Descripción del tip 1"},
    {"title": "Tip 2 título", "description": "Descripción del tip 2"},
    {"title": "Tip 3 título", "description": "Descripción del tip 3"},
    {"title": "Tip 4 título", "description": "Descripción del tip 4"},
    {"title": "Tip 5 título", "description": "Descripción del tip 5"},
    {"title": "Tip 6 título", "description": "Descripción del tip 6"}
  ],
  "final_message": "Mensaje motivacional final para el equipo de ventas"
}`

    } else if (toolType === 'sales_simulator') {
      prompt = `Genera un Simulador de Ventas interactivo para esta empresa:

CONTEXTO DE LA EMPRESA:
- Nombre: ${org.name}
- Industria: ${org.industry}
- Descripción: ${org.business_description}
- Productos/Servicios: ${JSON.stringify(org.products_services)}
- Proceso de ventas: ${org.sales_process}

Genera SOLO el JSON con este formato exacto:
{
  "client_types": [
    {"id": "individual", "name": "Cliente Individual", "icon": "👤"},
    {"id": "familia", "name": "Familia", "icon": "👨‍👩‍👧‍👦"},
    {"id": "amigos", "name": "Grupo de Amigos", "icon": "🎉"},
    {"id": "desconocido", "name": "Desconocido (Icebreaker)", "icon": "🎭"},
    {"id": "empresa_cercana", "name": "Empresa Cercana", "icon": "🏢"},
    {"id": "empresa_b2b", "name": "Empresa B2B Real", "icon": "💼"}
  ],
  "channels": [
    {"id": "instagram", "name": "Instagram DM", "icon": "📸"},
    {"id": "whatsapp", "name": "WhatsApp", "icon": "💬"},
    {"id": "email", "name": "Email", "icon": "📧"},
    {"id": "phone", "name": "Llamada Telefónica", "icon": "📞"},
    {"id": "presencial", "name": "Presencial", "icon": "🤝"}
  ],
  "scenarios": {
    "individual": {
      "initial_speech": "Speech inicial para cliente individual...",
      "conversation": [
        {
          "client_message": "Mensaje del cliente preguntando...",
          "response_options": ["Respuesta opción A", "Respuesta opción B", "Respuesta opción C"],
          "tips": ["Tip 1 para esta etapa", "Tip 2 para esta etapa", "Tip 3 para esta etapa"]
        },
        {
          "client_message": "Segunda pregunta o objeción del cliente...",
          "response_options": ["Respuesta A", "Respuesta B", "Respuesta C"],
          "tips": ["Tip 1", "Tip 2", "Tip 3"]
        },
        {
          "client_message": "Pregunta de cierre del cliente...",
          "response_options": ["Cierre opción A", "Cierre opción B", "Cierre opción C"],
          "tips": ["Tip cierre 1", "Tip cierre 2", "Tip cierre 3"]
        }
      ]
    },
    "familia": {
      "initial_speech": "Speech inicial para familias...",
      "conversation": [
        {"client_message": "Pregunta familia 1", "response_options": ["A", "B", "C"], "tips": ["Tip 1", "Tip 2", "Tip 3"]},
        {"client_message": "Pregunta familia 2", "response_options": ["A", "B", "C"], "tips": ["Tip 1", "Tip 2", "Tip 3"]},
        {"client_message": "Pregunta familia 3", "response_options": ["A", "B", "C"], "tips": ["Tip 1", "Tip 2", "Tip 3"]}
      ]
    },
    "amigos": {
      "initial_speech": "Speech inicial para grupos de amigos...",
      "conversation": [
        {"client_message": "Pregunta amigos 1", "response_options": ["A", "B", "C"], "tips": ["Tip 1", "Tip 2", "Tip 3"]},
        {"client_message": "Pregunta amigos 2", "response_options": ["A", "B", "C"], "tips": ["Tip 1", "Tip 2", "Tip 3"]},
        {"client_message": "Pregunta amigos 3", "response_options": ["A", "B", "C"], "tips": ["Tip 1", "Tip 2", "Tip 3"]}
      ]
    },
    "desconocido": {
      "initial_speech": "Speech icebreaker para desconocidos...",
      "conversation": [
        {"client_message": "Pregunta icebreaker 1", "response_options": ["A", "B", "C"], "tips": ["Tip 1", "Tip 2", "Tip 3"]},
        {"client_message": "Pregunta icebreaker 2", "response_options": ["A", "B", "C"], "tips": ["Tip 1", "Tip 2", "Tip 3"]},
        {"client_message": "Pregunta icebreaker 3", "response_options": ["A", "B", "C"], "tips": ["Tip 1", "Tip 2", "Tip 3"]}
      ]
    },
    "empresa_cercana": {
      "initial_speech": "Speech para empresa cercana/conocida...",
      "conversation": [
        {"client_message": "Pregunta empresa cercana 1", "response_options": ["A", "B", "C"], "tips": ["Tip 1", "Tip 2", "Tip 3"]},
        {"client_message": "Pregunta empresa cercana 2", "response_options": ["A", "B", "C"], "tips": ["Tip 1", "Tip 2", "Tip 3"]},
        {"client_message": "Pregunta empresa cercana 3", "response_options": ["A", "B", "C"], "tips": ["Tip 1", "Tip 2", "Tip 3"]}
      ]
    },
    "empresa_b2b": {
      "initial_speech": "Speech profesional B2B...",
      "conversation": [
        {"client_message": "Pregunta B2B 1", "response_options": ["A", "B", "C"], "tips": ["Tip 1", "Tip 2", "Tip 3"]},
        {"client_message": "Pregunta B2B 2", "response_options": ["A", "B", "C"], "tips": ["Tip 1", "Tip 2", "Tip 3"]},
        {"client_message": "Pregunta B2B 3", "response_options": ["A", "B", "C"], "tips": ["Tip 1", "Tip 2", "Tip 3"]}
      ]
    }
  },
  "completion_message": "¡Felicidades! Has completado la simulación de ventas."
}`

    } else if (toolType === 'communication_guide') {
      prompt = `Genera una Guía de Comunicación completa para esta empresa:

CONTEXTO DE LA EMPRESA:
- Nombre: ${org.name}
- Industria: ${org.industry}
- Descripción: ${org.business_description}
- Propuesta de valor: ${org.value_proposition}
- Clientes objetivo: ${org.target_customers}

Genera SOLO el JSON con este formato exacto:
{
  "elevator_pitches": {
    "short": "Pitch de 30 segundos: explicación corta y directa de qué hace la empresa y por qué es diferente...",
    "long": "Pitch de 2 minutos: versión expandida que plantea el problema, presenta la solución, beneficios clave y propuesta de valor..."
  },
  "keywords": [
    "EXPERIENCIA",
    "TRANSFORMACIÓN",
    "CONEXIÓN REAL",
    "MEMORABLE",
    "AUTÉNTICO",
    "PROPÓSITO",
    "RECUERDOS",
    "LIBERTAD",
    "PRESENCIA REAL",
    "DIFERENTE",
    "SIN FILTROS",
    "DESCUBRIR",
    "ESPACIO SEGURO",
    "ROMPER MONOTONÍA",
    "ACTO DE REBELDÍA"
  ],
  "instagram_posts": [
    {
      "type": "Problema",
      "content": "Contenido del post sobre el problema que resuelve la empresa... 8-10 líneas con emojis y hashtags"
    },
    {
      "type": "Productos/Industria",
      "content": "Contenido del post enfocado en los productos/servicios y apoyo local..."
    },
    {
      "type": "Invitación",
      "content": "Contenido del post con propuesta radical, desafío, call to action..."
    },
    {
      "type": "Manifiesto",
      "content": "Contenido del post como manifiesto de marca, valores, movimiento..."
    }
  ],
  "conversation_examples": [
    {
      "scenario": "¿Qué es esto?",
      "messages": [
        {"role": "client", "text": "¿Qué es exactamente lo que hacéis?"},
        {"role": "vendor", "text": "Respuesta del vendedor explicando..."},
        {"role": "client", "text": "Pero eso ya existe, ¿no?"},
        {"role": "vendor", "text": "Respuesta manejando la objeción..."}
      ]
    },
    {
      "scenario": "DM Instagram",
      "messages": [
        {"role": "client", "text": "Hola, he visto vuestro perfil. ¿Cómo funciona?"},
        {"role": "vendor", "text": "Respuesta casual pero efectiva..."}
      ]
    }
  ],
  "communication_tips": [
    "Nunca empieces con 'vendemos X'",
    "Usa storytelling para conectar emocionalmente",
    "Contrasta con alternativas tradicionales",
    "Enfatiza lo local/nacional si aplica",
    "Sé visual: usa ejemplos y analogías",
    "Habla de emociones antes que de características",
    "Invita, no vendas",
    "Usa testimonios y casos de éxito",
    "Menciona el propósito detrás del producto",
    "Cierra con la transformación que ofreces"
  ]
}`

    } else if (toolType === 'opportunity_calculator') {
      prompt = `Genera una Calculadora de Oportunidad de Negocio para esta empresa:

CONTEXTO DE LA EMPRESA:
- Nombre: ${org.name}
- Industria: ${org.industry}
- Productos/Servicios: ${JSON.stringify(org.products_services)}

Genera SOLO el JSON con este formato exacto:
{
  "commission_percentage": 70,
  "products": [
    {"name": "Producto 1", "price": 100, "cost": 30, "margin": 70, "earn": 49, "badge": "premium"},
    {"name": "Producto 2", "price": 80, "cost": 25, "margin": 55, "earn": 38.5, "badge": "standard"},
    {"name": "Producto 3", "price": 60, "cost": 20, "margin": 40, "earn": 28, "badge": "basic"},
    {"name": "Producto 4", "price": 120, "cost": 40, "margin": 80, "earn": 56, "badge": "premium"},
    {"name": "Producto 5", "price": 90, "cost": 30, "margin": 60, "earn": 42, "badge": "standard"},
    {"name": "Producto 6", "price": 50, "cost": 15, "margin": 35, "earn": 24.5, "badge": "basic"},
    {"name": "Producto 7", "price": 150, "cost": 50, "margin": 100, "earn": 70, "badge": "premium"},
    {"name": "Producto 8", "price": 70, "cost": 22, "margin": 48, "earn": 33.6, "badge": "standard"}
  ],
  "team_scenarios": [
    {
      "name": "Vendedor Conservador",
      "icon": "🐢",
      "role": "Ventas a tiempo parcial",
      "scenario_type": "Conservador",
      "weekly_sales": {
        "b2c": [{"product": "Producto 1", "qty": 2}, {"product": "Producto 2", "qty": 3}],
        "b2b": [{"product": "Producto 4", "qty": 1}]
      },
      "weekly_earnings": 200,
      "monthly_earnings": 800,
      "eleven_weeks_earnings": 2200
    },
    {
      "name": "Vendedor Moderado",
      "icon": "🦊",
      "role": "Ventas regulares",
      "scenario_type": "Moderado",
      "weekly_sales": {
        "b2c": [{"product": "Producto 1", "qty": 4}, {"product": "Producto 3", "qty": 5}],
        "b2b": [{"product": "Producto 7", "qty": 2}]
      },
      "weekly_earnings": 450,
      "monthly_earnings": 1800,
      "eleven_weeks_earnings": 4950
    },
    {
      "name": "Vendedor Agresivo",
      "icon": "🦁",
      "role": "Ventas a tiempo completo",
      "scenario_type": "Agresivo",
      "weekly_sales": {
        "b2c": [{"product": "Producto 1", "qty": 8}, {"product": "Producto 2", "qty": 6}],
        "b2b": [{"product": "Producto 4", "qty": 5}, {"product": "Producto 7", "qty": 3}]
      },
      "weekly_earnings": 950,
      "monthly_earnings": 3800,
      "eleven_weeks_earnings": 10450
    },
    {
      "name": "Super Vendedor",
      "icon": "🚀",
      "role": "Top performer",
      "scenario_type": "Máximo",
      "weekly_sales": {
        "b2c": [{"product": "Producto 1", "qty": 15}, {"product": "Producto 4", "qty": 10}],
        "b2b": [{"product": "Producto 7", "qty": 8}]
      },
      "weekly_earnings": 1800,
      "monthly_earnings": 7200,
      "eleven_weeks_earnings": 19800
    }
  ],
  "intro_message": "Mensaje introductorio explicando la oportunidad de negocio...",
  "highlight_message": "Mensaje destacado sobre el porcentaje de comisión..."
}`
    } else if (toolType === 'brand_kit') {
      prompt = `Genera un Brand Kit completo para esta empresa:

CONTEXTO DE LA EMPRESA:
- Nombre: ${org.name}
- Industria: ${org.industry}
- Descripción: ${org.business_description}
- Clientes objetivo: ${org.target_customers}
- Propuesta de valor: ${org.value_proposition}

Genera SOLO el JSON con este formato exacto:
{
  "colors": {
    "primary": "#3B82F6",
    "secondary": "#10B981",
    "accent": "#8B5CF6",
    "neutral_light": "#F8FAFC",
    "neutral_dark": "#1E293B",
    "psychology": {
      "primary_meaning": "Significado psicológico del color primario...",
      "secondary_meaning": "Significado psicológico del color secundario...",
      "accent_meaning": "Significado psicológico del color accent..."
    }
  },
  "typography": {
    "font_heading": "Inter",
    "font_heading_url": "https://fonts.google.com/specimen/Inter",
    "font_body": "Open Sans",
    "font_body_url": "https://fonts.google.com/specimen/Open+Sans",
    "usage_guide": "Descripción de cuándo usar cada tipografía..."
  },
  "tone_of_voice": {
    "primary_tone": "Profesional y cercano",
    "characteristics": ["Característica 1", "Característica 2", "Característica 3"],
    "do_list": ["Hacer 1", "Hacer 2", "Hacer 3"],
    "dont_list": ["No hacer 1", "No hacer 2", "No hacer 3"],
    "example_phrases": ["Frase ejemplo 1", "Frase ejemplo 2", "Frase ejemplo 3"]
  },
  "visual_elements": {
    "logo_concept": "Descripción del concepto de logo recomendado...",
    "icon_style": "Estilo de iconografía recomendado...",
    "image_style": "Estilo de imágenes recomendado...",
    "patterns": "Patrones o texturas recomendados..."
  },
  "applications": {
    "social_media": "Guía de aplicación en redes sociales...",
    "website": "Guía de aplicación en web...",
    "print": "Guía de aplicación en impresos...",
    "presentations": "Guía de aplicación en presentaciones..."
  }
}`

    } else if (toolType === 'web_generator') {
      prompt = `Genera el contenido para una Landing Page profesional para esta empresa:

CONTEXTO DE LA EMPRESA:
- Nombre: ${org.name}
- Industria: ${org.industry}
- Descripción: ${org.business_description}
- Clientes objetivo: ${org.target_customers}
- Propuesta de valor: ${org.value_proposition}
- Productos/Servicios: ${JSON.stringify(org.products_services)}
- Diferenciadores: ${org.competitive_advantage || 'No especificado'}

Genera SOLO el JSON con este formato exacto:
{
  "meta": {
    "title": "Título SEO de la página (max 60 caracteres)",
    "description": "Meta descripción SEO (max 160 caracteres)"
  },
  "design": {
    "primary_color": "#3B82F6",
    "secondary_color": "#10B981",
    "accent_color": "#8B5CF6",
    "font_heading": "Inter",
    "font_body": "Open Sans"
  },
  "hero": {
    "headline": "Titular principal impactante que capture la propuesta de valor",
    "subheadline": "Subtítulo que explique brevemente qué hace la empresa y para quién",
    "cta_text": "Texto del botón principal",
    "cta_url": "#contact"
  },
  "features": {
    "title": "Título de la sección de características",
    "items": [
      {"icon": "🚀", "title": "Feature 1", "description": "Descripción de la característica 1"},
      {"icon": "⚡", "title": "Feature 2", "description": "Descripción de la característica 2"},
      {"icon": "🎯", "title": "Feature 3", "description": "Descripción de la característica 3"}
    ]
  },
  "benefits": {
    "title": "Título de la sección de beneficios",
    "items": [
      {"title": "Beneficio 1", "description": "Descripción del beneficio 1"},
      {"title": "Beneficio 2", "description": "Descripción del beneficio 2"},
      {"title": "Beneficio 3", "description": "Descripción del beneficio 3"},
      {"title": "Beneficio 4", "description": "Descripción del beneficio 4"}
    ]
  },
  "testimonials": {
    "title": "Lo que dicen nuestros clientes",
    "items": [
      {"quote": "Testimonio 1 del cliente...", "author": "Nombre Cliente 1", "role": "CEO, Empresa 1"},
      {"quote": "Testimonio 2 del cliente...", "author": "Nombre Cliente 2", "role": "Director, Empresa 2"},
      {"quote": "Testimonio 3 del cliente...", "author": "Nombre Cliente 3", "role": "Manager, Empresa 3"}
    ]
  },
  "cta": {
    "headline": "Titular de cierre con call to action",
    "subheadline": "Subtítulo que motive a tomar acción",
    "button_text": "Texto del botón",
    "button_url": "#contact"
  },
  "footer": {
    "tagline": "Tagline o eslogan de la empresa"
  }
}`

    }

    if (!prompt) {
      throw new Error(`Tipo de herramienta no soportado: ${toolType}`)
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
