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

    // Detectar si es usuario Discovery (idea en validación)
    const isDiscovery = org.business_stage === 'discovery'
    let discoveryProfile = null
    let selectedIdea = null

    if (isDiscovery) {
      // Obtener perfil de Discovery con la idea seleccionada
      const { data: profile } = await supabase
        .from('discovery_profiles')
        .select('*, curated_ideas(*)')
        .eq('organization_id', userRole.organization_id)
        .single()
      
      if (profile) {
        discoveryProfile = profile
        selectedIdea = profile.curated_ideas
      }
    }

    // Construir contexto según tipo de usuario
    const getBusinessContext = () => {
      if (isDiscovery && selectedIdea) {
        return `
CONTEXTO DE IDEA EN VALIDACIÓN:
- Idea de negocio: ${selectedIdea.name}
- Categoría: ${selectedIdea.category}
- Descripción: ${selectedIdea.description}
- Público objetivo: ${selectedIdea.target_audience}
- Problema que resuelve: ${selectedIdea.problem_solved}
- Modelo de ingresos: ${selectedIdea.revenue_model}
- Perfil del fundador:
  - Habilidades: ${discoveryProfile?.skills?.join(', ') || 'No especificadas'}
  - Industrias con experiencia: ${discoveryProfile?.industries?.join(', ') || 'No especificadas'}
  - Motivaciones: ${discoveryProfile?.motivations?.join(', ') || 'No especificadas'}
  - Horas semanales disponibles: ${discoveryProfile?.hours_weekly || 'No especificado'}
  - Capital inicial: ${discoveryProfile?.initial_capital || 'No especificado'}
  - Tolerancia al riesgo: ${discoveryProfile?.risk_tolerance || 'No especificada'}/5

IMPORTANTE: Esta es una IDEA EN FASE DE VALIDACIÓN, no un negocio establecido. 
El contenido debe enfocarse en VALIDAR la idea y conseguir los primeros clientes, no en escalar un negocio existente.
`
      }
      return `
CONTEXTO DE LA EMPRESA:
- Nombre: ${org.name}
- Industria: ${org.industry}
- Tamaño: ${org.company_size}
- Descripción: ${org.business_description}
- Clientes objetivo: ${org.target_customers}
- Propuesta de valor: ${org.value_proposition}
- Productos/Servicios: ${JSON.stringify(org.products_services)}
`
    }

    // Construir prompt según tipo de herramienta
    let prompt = ''
    let systemPrompt = isDiscovery 
      ? 'Eres un experto en validación de ideas de negocio y Customer Development. Ayudas a emprendedores a validar sus ideas antes de invertir. Respondes SOLO en formato JSON válido.'
      : 'Eres un experto en estrategia empresarial y marketing. Respondes SOLO en formato JSON válido.'

    if (toolType === 'buyer_persona') {
      if (isDiscovery && selectedIdea) {
        prompt = `Genera un BUYER PERSONA HIPOTÉTICO para validar esta idea de negocio:

${getBusinessContext()}

IMPORTANTE: Este es un persona HIPOTÉTICO para ayudar a validar la idea. 
Incluye preguntas de validación que el emprendedor debería hacer en entrevistas.

Genera SOLO el JSON con este formato exacto:
{
  "name": "Nombre del persona hipotético",
  "age": "Rango de edad estimado",
  "occupation": "Ocupación/Cargo probable",
  "industry": "Industria donde trabaja",
  "goals": ["Objetivo que tendría este persona", "Objetivo 2", "Objetivo 3"],
  "challenges": ["Dolor/Problema que la idea resuelve", "Desafío 2", "Desafío 3"],
  "values": ["Valor 1", "Valor 2", "Valor 3"],
  "channels": ["Dónde encontrar a este persona", "Canal 2", "Canal 3"],
  "quote": "Una frase que diría este persona sobre su problema",
  "validation_questions": [
    "Pregunta para validar si tiene este problema",
    "Pregunta para validar willingness-to-pay",
    "Pregunta para entender su proceso de compra actual"
  ],
  "interview_tips": [
    "Tip 1 para la entrevista de validación",
    "Tip 2 para obtener insights honestos"
  ]
}`
      } else {
        prompt = `Genera un Buyer Persona detallado para esta empresa:
${getBusinessContext()}

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
      }

    } else if (toolType === 'customer_journey') {
      if (isDiscovery && selectedIdea) {
        prompt = `Genera un JOURNEY DE VALIDACIÓN para esta idea de negocio:

${getBusinessContext()}

IMPORTANTE: Este NO es un customer journey tradicional. Es el camino que seguirá el emprendedor para VALIDAR su idea y conseguir los PRIMEROS CLIENTES.

Genera SOLO el JSON con este formato exacto:
{
  "stages": [
    {
      "name": "Descubrimiento del Problema",
      "description": "Validar que el problema existe y es importante para el mercado objetivo",
      "touchpoints": ["Entrevistas de validación", "Encuestas online", "Observación directa"],
      "emotions": ["Incertidumbre inicial", "Curiosidad"],
      "opportunities": ["Encontrar early adopters", "Refinar la propuesta de valor"],
      "validation_tasks": ["Entrevistar 10 potenciales clientes", "Identificar 3 pain points recurrentes"],
      "success_criteria": "Al menos 7/10 entrevistados confirman el problema"
    },
    {
      "name": "Validación de Solución",
      "description": "Confirmar que tu solución propuesta realmente resuelve el problema",
      "touchpoints": ["Landing page", "Prototipo básico", "Demo del concepto"],
      "emotions": ["Emoción por el feedback", "Ajustes necesarios"],
      "opportunities": ["Conseguir primeros interesados", "Pre-ventas"],
      "validation_tasks": ["Crear landing page", "Conseguir 50 signups", "Validar willingness-to-pay"],
      "success_criteria": "Al menos 20% de visitantes dejan su email"
    },
    {
      "name": "Primeras Ventas",
      "description": "Conseguir los primeros clientes pagando antes de construir el producto completo",
      "touchpoints": ["Propuesta directa", "Oferta de lanzamiento", "Venta 1 a 1"],
      "emotions": ["Nerviosismo", "Emoción por la primera venta"],
      "opportunities": ["Aprender del proceso de venta", "Refinar el pricing"],
      "validation_tasks": ["Cerrar 3-5 primeros clientes", "Documentar el proceso de venta"],
      "success_criteria": "Al menos 3 clientes pagando"
    },
    {
      "name": "Iteración y Escala",
      "description": "Mejorar el producto basado en feedback real y preparar para escalar",
      "touchpoints": ["Feedback de clientes", "Mejoras del producto", "Referidos"],
      "emotions": ["Confianza creciente", "Claridad del camino"],
      "opportunities": ["Testimonios", "Casos de éxito", "Proceso replicable"],
      "validation_tasks": ["Recoger testimonios", "Crear proceso de ventas repetible"],
      "success_criteria": "Tasa de retención >70% y al menos 1 referido por cliente"
    }
  ],
  "validation_tips": [
    "No construyas nada hasta validar la demanda",
    "Cobra desde el día 1, aunque sea poco",
    "El rechazo es información valiosa"
  ]
}`
      } else {
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
      }

    } else if (toolType === 'growth_model') {
      if (isDiscovery && selectedIdea) {
        prompt = `Genera un MODELO DE TRACCIÓN INICIAL para validar esta idea de negocio:

${getBusinessContext()}

IMPORTANTE: Este NO es un modelo de crecimiento tradicional. Es un modelo de VALIDACIÓN para una idea que aún no tiene clientes.

Genera SOLO el JSON con este formato exacto:
{
  "metrics": [
    {
      "stage": "Validación del Problema",
      "kpis": ["Entrevistas realizadas", "% que confirma el problema", "Willingness-to-pay expresado"],
      "channels": ["LinkedIn outreach", "Comunidades de nicho", "Red personal"],
      "tactics": ["Publicar contenido sobre el problema", "Ofrecer entrevistas de 15 min", "Pedir referidos"]
    },
    {
      "stage": "Primeros Interesados",
      "kpis": ["Signups en landing", "Tasa de conversión landing", "Lista de espera"],
      "channels": ["Landing page", "Email marketing", "Contenido orgánico"],
      "tactics": ["Crear landing con propuesta de valor clara", "Ofrecer acceso early-bird", "Capturar emails"]
    },
    {
      "stage": "Primeras Ventas",
      "kpis": ["Clientes pagando", "Revenue primeros 90 días", "Precio promedio aceptado"],
      "channels": ["Venta directa 1-a-1", "Email a lista", "Referidos"],
      "tactics": ["Ofrecer descuento de lanzamiento", "Llamadas de venta personalizadas", "Propuesta de valor clara"]
    },
    {
      "stage": "Retención Inicial",
      "kpis": ["NPS de primeros clientes", "Tasa de uso", "Feedback recibido"],
      "channels": ["Onboarding personal", "Seguimiento directo", "Encuestas"],
      "tactics": ["Llamadas de seguimiento semanales", "Iterar según feedback", "Documentar casos de uso"]
    },
    {
      "stage": "Primeros Referidos",
      "kpis": ["Referidos por cliente", "Tasa de conversión referidos", "Testimonios conseguidos"],
      "channels": ["Programa de referidos", "Casos de éxito", "Contenido de clientes"],
      "tactics": ["Pedir testimonios activamente", "Ofrecer incentivo por referido", "Crear caso de éxito público"]
    }
  ],
  "validation_milestones": [
    {"milestone": "Problema validado", "criteria": "10+ entrevistas confirman el problema"},
    {"milestone": "Solución validada", "criteria": "50+ signups o 5 pre-ventas"},
    {"milestone": "Product-Market Fit inicial", "criteria": "5 clientes pagando + 40% NPS promotores"}
  ]
}`
      } else {
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
      }

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
      if (isDiscovery && selectedIdea) {
        prompt = `Genera un PLAYBOOK DE PRIMERAS VENTAS para un emprendedor que está validando esta idea de negocio:

${getBusinessContext()}

IMPORTANTE: Este NO es un playbook de ventas corporativo. Es una GUÍA PARA CONSEGUIR LOS PRIMEROS 5-10 CLIENTES como emprendedor individual validando una idea.

Genera SOLO el JSON con este formato exacto:
{
  "methodology": {
    "name": "Customer Development Sales",
    "description": "Metodología enfocada en aprender del cliente mientras vendes. Cada conversación es una oportunidad de validar hipótesis y mejorar tu oferta.",
    "key_principles": [
      "Escucha más de lo que hablas - 70/30",
      "Cada 'no' es información valiosa",
      "Vende antes de construir - valida con compromisos reales",
      "El precio es una hipótesis más que validar"
    ]
  },
  "sales_process": [
    {
      "stage": "Identificar Early Adopters",
      "objective": "Encontrar personas que ya están buscando activamente una solución",
      "average_duration": "1 semana",
      "activities": ["Buscar en comunidades del nicho", "Contactar red personal", "Publicar en LinkedIn/Twitter"],
      "tools": ["LinkedIn", "Twitter", "Comunidades online", "WhatsApp"],
      "exit_criteria": "5 conversaciones agendadas con personas con el problema",
      "tips_for_founders": ["No vendas aún - solo valida que tienen el problema", "Pregunta cómo lo resuelven actualmente"]
    },
    {
      "stage": "Entrevista de Descubrimiento",
      "objective": "Validar el problema y entender el contexto del cliente",
      "average_duration": "20-30 min por entrevista",
      "activities": ["Hacer preguntas abiertas", "Entender su situación actual", "Identificar urgencia"],
      "tools": ["Guía de preguntas", "Notion/Google Docs para notas"],
      "exit_criteria": "Cliente confirma que el problema es importante y urgente",
      "tips_for_founders": ["No menciones tu solución hasta entender bien el problema", "Pregunta: ¿Qué pasaría si no resuelves esto?"]
    },
    {
      "stage": "Propuesta de Valor",
      "objective": "Presentar tu solución como respuesta a lo que el cliente te contó",
      "average_duration": "15-20 min",
      "activities": ["Resumir el problema que mencionaron", "Presentar cómo tu solución lo resuelve", "Mostrar ejemplo o mockup"],
      "tools": ["Presentación simple", "Landing page", "Prototipo básico"],
      "exit_criteria": "Cliente muestra interés genuino en probarlo",
      "tips_for_founders": ["Conecta tu solución directamente con lo que dijeron", "Usa sus palabras exactas"]
    },
    {
      "stage": "Cierre Inicial",
      "objective": "Conseguir un compromiso real (pago o pre-pago)",
      "average_duration": "1 conversación",
      "activities": ["Presentar oferta de lanzamiento", "Manejar objeciones", "Pedir el compromiso"],
      "tools": ["Stripe/PayPal", "Factura simple", "Contrato básico"],
      "exit_criteria": "Cliente paga o se compromete a pagar",
      "tips_for_founders": ["Un 'sí' sin pago no es validación real", "Ofrece descuento de early-adopter a cambio de feedback"]
    }
  ],
  "qualification_framework": {
    "name": "PAIN (Problem, Alternatives, Investment, Need)",
    "criteria": [
      {
        "letter": "P",
        "meaning": "Problem - ¿Tienen el problema?",
        "questions": ["¿Cómo manejas [problema] actualmente?", "¿Qué tan frustrante es esto para ti?"],
        "red_flags": ["No reconoce el problema", "No le afecta realmente"]
      },
      {
        "letter": "A",
        "meaning": "Alternatives - ¿Qué alternativas tienen?",
        "questions": ["¿Has probado otras soluciones?", "¿Por qué no funcionaron?"],
        "red_flags": ["Muy satisfecho con solución actual", "No ha buscado alternativas"]
      },
      {
        "letter": "I",
        "meaning": "Investment - ¿Están dispuestos a invertir?",
        "questions": ["¿Cuánto inviertes actualmente en resolver esto?", "¿Qué valor tendría resolverlo?"],
        "red_flags": ["No paga por nada similar", "Espera solución gratuita"]
      },
      {
        "letter": "N",
        "meaning": "Need - ¿Lo necesitan ahora?",
        "questions": ["¿Qué pasa si no lo resuelves este mes?", "¿Hay algún deadline?"],
        "red_flags": ["Sin urgencia", "Puede esperar indefinidamente"]
      }
    ]
  },
  "objection_handling": [
    {
      "objection": "No tengo presupuesto",
      "type": "Precio",
      "response_framework": "Explorar prioridades → Mostrar ROI → Flexibilizar",
      "example_response": "Entiendo. ¿Cuánto te está costando actualmente no resolver esto? A veces el costo de no actuar es mayor que la inversión.",
      "follow_up_question": "¿Qué necesitarías ver para justificar esta inversión?"
    },
    {
      "objection": "Necesito pensarlo",
      "type": "Tiempo",
      "response_framework": "Validar → Identificar bloqueador → Facilitar decisión",
      "example_response": "Por supuesto. Para ayudarte a decidir, ¿qué información adicional necesitas? ¿O hay algo que te preocupa que no hemos discutido?",
      "follow_up_question": "¿Puedo enviarte algo que te ayude a evaluar esto mejor?"
    },
    {
      "objection": "No sé si funcionará para mi caso",
      "type": "Confianza",
      "response_framework": "Validar duda → Ofrecer prueba → Reducir riesgo",
      "example_response": "Es una preocupación válida. ¿Qué te parece si empezamos con un piloto pequeño? Así puedes validar los resultados antes de comprometerte más.",
      "follow_up_question": "¿Qué resultado necesitarías ver en 2 semanas para seguir adelante?"
    }
  ],
  "closing_techniques": [
    {
      "name": "Cierre de Early Adopter",
      "when_to_use": "Con primeros clientes dispuestos a probar algo nuevo",
      "example": "Por ser de los primeros, te ofrezco 50% de descuento a cambio de tu feedback detallado. ¿Te interesa ser parte de este grupo fundador?"
    },
    {
      "name": "Cierre de Compromiso Mínimo",
      "when_to_use": "Cuando hay dudas pero interés genuino",
      "example": "¿Qué te parece si empezamos con [versión mínima/piloto] por [precio reducido] y si te funciona, escalamos?"
    },
    {
      "name": "Cierre de Escasez Real",
      "when_to_use": "Cuando genuinamente tienes capacidad limitada",
      "example": "Ahora mismo solo puedo atender a 5 clientes porque quiero dar atención personalizada. ¿Quieres ser uno de ellos?"
    }
  ],
  "kpis": [
    {"name": "Conversaciones/Semana", "target": "10-15", "frequency": "Semanal"},
    {"name": "Tasa Entrevista→Interés", "target": "50%", "frequency": "Semanal"},
    {"name": "Tasa Interés→Cliente", "target": "20%", "frequency": "Semanal"},
    {"name": "Clientes Primer Mes", "target": "3-5", "frequency": "Mensual"},
    {"name": "Feedback Recibido", "target": "1 por cliente", "frequency": "Semanal"}
  ],
  "founder_tips": [
    "Tu objetivo no es solo vender, es APRENDER si tu idea tiene mercado",
    "Cada 'no' te da información valiosa - pregunta siempre por qué",
    "Un cliente que paga €50 vale más que 1000 que dicen 'me interesa'",
    "Graba las llamadas (con permiso) - escucharlas te hará mejor vendedor"
  ]
}`
      } else {
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
  "methodology": {
    "name": "Nombre de la metodología de ventas (SPIN, Challenger, Sandler, etc.)",
    "description": "Descripción de por qué esta metodología es ideal para esta empresa",
    "key_principles": ["Principio 1", "Principio 2", "Principio 3", "Principio 4"]
  },
  "sales_process": [
    {
      "stage": "Prospección",
      "objective": "Identificar y contactar clientes potenciales cualificados",
      "average_duration": "2-5 días",
      "activities": ["Investigar empresas objetivo", "Identificar decisores", "Preparar propuesta de valor"],
      "tools": ["LinkedIn Sales Navigator", "CRM", "Email"],
      "exit_criteria": "Cliente acepta reunión de descubrimiento",
      "conversion_rate_target": "30%"
    },
    {
      "stage": "Descubrimiento",
      "objective": "Entender las necesidades y pain points del cliente",
      "average_duration": "1-2 reuniones",
      "activities": ["Hacer preguntas de diagnóstico", "Identificar stakeholders", "Documentar requisitos"],
      "tools": ["Guía de preguntas", "CRM"],
      "exit_criteria": "Necesidades claramente identificadas y documentadas",
      "conversion_rate_target": "60%"
    },
    {
      "stage": "Presentación",
      "objective": "Demostrar cómo nuestra solución resuelve sus problemas",
      "average_duration": "1 reunión",
      "activities": ["Presentar solución personalizada", "Demostrar ROI", "Resolver objeciones"],
      "tools": ["Presentación", "Demo", "Casos de éxito"],
      "exit_criteria": "Cliente solicita propuesta formal",
      "conversion_rate_target": "70%"
    },
    {
      "stage": "Negociación",
      "objective": "Acordar términos y cerrar la venta",
      "average_duration": "1-2 semanas",
      "activities": ["Preparar propuesta", "Negociar términos", "Obtener aprobaciones"],
      "tools": ["Propuesta", "Contrato"],
      "exit_criteria": "Contrato firmado",
      "conversion_rate_target": "50%"
    }
  ],
  "qualification_framework": {
    "name": "BANT (Budget, Authority, Need, Timeline)",
    "criteria": [
      {
        "letter": "B",
        "meaning": "Budget - Presupuesto",
        "questions": ["¿Tienen presupuesto asignado?", "¿Cuál es su rango de inversión?"],
        "red_flags": ["Sin presupuesto definido", "Proceso de aprobación muy largo"]
      },
      {
        "letter": "A",
        "meaning": "Authority - Autoridad",
        "questions": ["¿Quién toma la decisión final?", "¿Quiénes participan en la decisión?"],
        "red_flags": ["Contacto sin poder de decisión", "Demasiados stakeholders"]
      },
      {
        "letter": "N",
        "meaning": "Need - Necesidad",
        "questions": ["¿Cuál es su mayor desafío?", "¿Qué pasa si no resuelven esto?"],
        "red_flags": ["Necesidad no urgente", "Ya tienen solución funcionando"]
      },
      {
        "letter": "T",
        "meaning": "Timeline - Tiempo",
        "questions": ["¿Para cuándo necesitan implementar?", "¿Qué urgencia tiene?"],
        "red_flags": ["Sin fecha definida", "Proceso de decisión muy largo"]
      }
    ]
  },
  "objection_handling": [
    {
      "objection": "Es muy caro",
      "type": "Precio",
      "response_framework": "Reconocer → Explorar → Reencuadrar valor",
      "example_response": "Entiendo la preocupación por el precio. Permíteme preguntarte: ¿cuánto te está costando actualmente no resolver este problema?",
      "follow_up_question": "¿Qué valor tendría para ti resolver esto en los próximos 3 meses?"
    },
    {
      "objection": "Necesito pensarlo",
      "type": "Tiempo",
      "response_framework": "Validar → Identificar → Facilitar",
      "example_response": "Por supuesto, es una decisión importante. ¿Qué información adicional necesitarías para tomar la decisión?",
      "follow_up_question": "¿Hay algo específico que te gustaría revisar antes?"
    },
    {
      "objection": "Ya tenemos un proveedor",
      "type": "Competencia",
      "response_framework": "Respetar → Diferenciar → Proponer",
      "example_response": "Genial que ya tengan solución. ¿Estarían abiertos a ver cómo podríamos complementar o mejorar lo que ya tienen?",
      "follow_up_question": "¿Qué mejorarían de su solución actual si pudieran?"
    }
  ],
  "closing_techniques": [
    {
      "name": "Cierre Asumido",
      "when_to_use": "Cuando el cliente muestra señales claras de compra",
      "example": "Perfecto, entonces empezamos la implementación la próxima semana. ¿El lunes o martes te viene mejor?"
    },
    {
      "name": "Cierre por Urgencia",
      "when_to_use": "Cuando hay incentivo por tiempo limitado",
      "example": "Esta promoción está disponible hasta el viernes. ¿Te gustaría asegurar estos términos hoy?"
    },
    {
      "name": "Cierre por Resumen",
      "when_to_use": "Para reafirmar el valor antes de pedir la decisión",
      "example": "Entonces tenemos: solución A, beneficio B, ahorro C. ¿Hay algo más que necesites para avanzar?"
    }
  ],
  "kpis": [
    {"name": "Tasa de Conversión", "target": "25%", "frequency": "Mensual"},
    {"name": "Tiempo de Ciclo", "target": "30 días", "frequency": "Mensual"},
    {"name": "Ticket Promedio", "target": "€5,000", "frequency": "Mensual"},
    {"name": "Reuniones/Semana", "target": "10", "frequency": "Semanal"},
    {"name": "Propuestas Enviadas", "target": "8/mes", "frequency": "Mensual"}
  ]
}`
      }

    } else if (toolType === 'sales_simulator') {
      if (isDiscovery && selectedIdea) {
        prompt = `Genera un SIMULADOR DE PRIMERAS VENTAS para un emprendedor validando esta idea de negocio:

${getBusinessContext()}

IMPORTANTE: Los escenarios deben reflejar las situaciones REALES que enfrentará un emprendedor vendiendo su idea por primera vez:
- Conversaciones con early adopters
- Llamadas de validación que se convierten en ventas
- Manejo del "no tengo presupuesto"
- Cerrar la primera venta sin tener producto completo

Genera SOLO el JSON con este formato exacto:
{
  "quick_tips": [
    {"category": "Mindset", "tip": "Tu objetivo es APRENDER mientras vendes. Cada conversación te acerca al product-market fit."},
    {"category": "Apertura", "tip": "No vendas inmediatamente. Empieza validando que tienen el problema que crees resolver."},
    {"category": "Descubrimiento", "tip": "Las mejores preguntas empiezan con '¿Cuéntame sobre...' - deja que hablen el 70% del tiempo."},
    {"category": "Objeciones", "tip": "Un 'no' con explicación vale oro. Pregunta siempre: '¿Qué tendría que cambiar para que te interesara?'"},
    {"category": "Cierre", "tip": "Ofrece ser early adopter con descuento a cambio de feedback - ambos ganan."}
  ],
  "scenarios": [
    {
      "title": "Escenario 1: Tu Primera Llamada de Validación-Venta",
      "difficulty": "Fácil",
      "client_profile": {
        "name": "Laura Martínez",
        "role": "Tu contacto ideal en el nicho",
        "company_type": "Empresa/Persona con el problema que resuelves",
        "personality": "Curioso pero ocupado",
        "budget_level": "Tiene capacidad de pago si ve valor"
      },
      "conversation_flow": [
        {
          "stage": "Apertura - Validación",
          "client_says": "Hola, me dijiste que querías hablar sobre [el problema]. Tengo 15 minutos. ¿De qué va esto?",
          "options": [
            {"response": "Gracias por tu tiempo, Laura. Estoy desarrollando algo para ayudar con [problema específico]. Pero primero me encantaría entender: ¿cómo manejas [el problema] actualmente?", "score": 10, "feedback": "Excelente apertura. Validas primero en lugar de vender. Esto genera confianza y te da información valiosa."},
            {"response": "Tengo una solución increíble para [problema]. Déjame contarte las características...", "score": 3, "feedback": "Saltaste a vender sin validar. No sabes si realmente tiene el problema o cómo lo percibe."},
            {"response": "Bueno, es que estoy empezando un negocio y necesito clientes...", "score": 1, "feedback": "Nunca hagas que la conversación sea sobre ti. El cliente no le importa que necesites clientes."}
          ]
        },
        {
          "stage": "Descubrimiento - Dolor",
          "client_says": "Pues la verdad es que [problema] me quita bastante tiempo. Hemos probado [solución actual] pero no es ideal.",
          "options": [
            {"response": "Interesante. ¿Cuánto tiempo dirías que pierdes con esto cada semana? Y cuando dices que no es ideal, ¿qué es lo que más te frustra?", "score": 10, "feedback": "Perfecto. Profundizas en el dolor específico y cuantificas el impacto. Esto te ayuda a posicionar tu solución."},
            {"response": "Sí, muchas empresas tienen ese problema. Mi solución lo resuelve completamente.", "score": 4, "feedback": "Perdiste la oportunidad de entender mejor el dolor. Cuanto más específico sea el problema, mejor puedes conectar tu solución."},
            {"response": "¿Cuánto estarías dispuesto a pagar por resolverlo?", "score": 2, "feedback": "Muy pronto para hablar de precio. Primero necesitas que el cliente sienta que entiendes su problema profundamente."}
          ]
        },
        {
          "stage": "Presentación de Solución",
          "client_says": "Pierdo fácilmente 5 horas a la semana. Lo más frustrante es que [dolor específico]. ¿Y tú qué propones?",
          "options": [
            {"response": "Basándome en lo que me cuentas - especialmente lo de [dolor específico] - he estado trabajando en algo que podría ayudarte. [Explica tu solución conectándola con lo que dijo]. ¿Te resuena esto?", "score": 10, "feedback": "Excelente. Conectas tu solución directamente con lo que el cliente expresó. Usas sus palabras. Y pides feedback."},
            {"response": "Mi solución tiene estas características: A, B, C, D, E... [lista larga de features]", "score": 4, "feedback": "Demasiadas características abruman. Enfócate en los 1-2 beneficios que resuelven su dolor específico."},
            {"response": "Es una plataforma revolucionaria que usa IA para...", "score": 3, "feedback": "Evita buzzwords. Al cliente le importa si resuelve SU problema, no qué tecnología usas."}
          ]
        },
        {
          "stage": "Cierre - Primera Venta",
          "client_says": "Suena interesante. ¿Y cuánto costaría esto?",
          "options": [
            {"response": "Antes de hablar de precio, déjame preguntarte: si esto te ahorrara esas 5 horas semanales, ¿qué valor tendría para ti? Así puedo ver qué opción tiene más sentido para tu caso.", "score": 10, "feedback": "Genial. Primero estableces el valor antes del precio. Y personalizas la oferta según su percepción de valor."},
            {"response": "Cuesta €X al mes. ¿Te interesa?", "score": 5, "feedback": "Funciona, pero pierdes la oportunidad de anclar el valor antes del precio."},
            {"response": "Todavía no tengo precio definido. ¿Cuánto pagarías tú?", "score": 3, "feedback": "Aunque validar willingness-to-pay es importante, esta pregunta directa puede ser incómoda y dar un precio bajo."}
          ]
        }
      ],
      "ideal_outcome": "Laura entiende el valor, ve cómo resuelve su problema específico, y acepta ser early adopter con descuento a cambio de feedback detallado.",
      "learning_points": [
        "Siempre valida el problema antes de presentar la solución",
        "Usa las palabras exactas del cliente para describir tu solución",
        "Establece el valor antes de mencionar el precio",
        "Ofrecer ser early adopter crea compromiso mutuo"
      ]
    },
    {
      "title": "Escenario 2: Manejando 'No Tengo Presupuesto'",
      "difficulty": "Medio",
      "client_profile": {
        "name": "Carlos Ruiz",
        "role": "Emprendedor/Pequeña empresa",
        "company_type": "Startup o negocio en crecimiento",
        "personality": "Interesado pero cauteloso con dinero",
        "budget_level": "Limitado pero puede invertir si ve ROI claro"
      },
      "conversation_flow": [
        {
          "stage": "Objeción Inicial",
          "client_says": "Me interesa mucho lo que propones, pero la verdad es que ahora no tengo presupuesto para esto.",
          "options": [
            {"response": "Entiendo perfectamente, Carlos. Muchos emprendedores están en la misma situación. Déjame preguntarte: ¿cuánto te está costando actualmente NO resolver este problema? A veces el costo de no actuar es mayor que la inversión.", "score": 10, "feedback": "Excelente. Reencuadras el 'gasto' como 'inversión' mostrando el costo de la inacción."},
            {"response": "¿Y si te hago un descuento del 50%?", "score": 4, "feedback": "Descuento prematuro sin entender el bloqueador real. Puede que el problema no sea el precio sino la prioridad."},
            {"response": "Bueno, cuando tengas presupuesto me avisas.", "score": 2, "feedback": "Rendirse muy fácil. 'No tengo presupuesto' muchas veces significa 'no veo suficiente valor aún'."}
          ]
        },
        {
          "stage": "Explorar el Bloqueador Real",
          "client_says": "Pues la verdad pierdo como 10 horas al mes en esto, pero hay otras prioridades...",
          "options": [
            {"response": "10 horas al mes... si tu hora vale €50, eso son €500 mensuales. Mi solución cuesta menos de la mitad. ¿Qué te parecería probarlo un mes y medir si realmente te ahorra ese tiempo?", "score": 10, "feedback": "Perfecto. Cuantificas el valor y reduces el riesgo ofreciendo un periodo de prueba medible."},
            {"response": "¿Cuáles son esas otras prioridades? Quizás puedo ayudarte con eso también.", "score": 6, "feedback": "Buena intención pero te desvías del problema original. Mejor cerrar este antes de expandir."},
            {"response": "Entiendo. Cuando sea prioridad, hablamos.", "score": 2, "feedback": "Te rindes sin intentar reencuadrar el valor o reducir el riesgo."}
          ]
        },
        {
          "stage": "Propuesta de Bajo Riesgo",
          "client_says": "Tiene sentido cuando lo pones así. Pero ¿y si no funciona para mi caso?",
          "options": [
            {"response": "Totalmente válida la preocupación. ¿Qué te parece esto?: empezamos con un piloto de 2 semanas. Si no ves resultados, no pagas. Así no hay riesgo para ti y yo demuestro que funciona. ¿Te parece justo?", "score": 10, "feedback": "Excelente. Eliminas todo el riesgo del cliente. Si confías en tu solución, esta oferta demuestra esa confianza."},
            {"response": "Funciona, te lo garantizo. Otros clientes están muy contentos.", "score": 4, "feedback": "Las garantías verbales no reducen el riesgo percibido. Ofrece algo tangible."},
            {"response": "Bueno, podemos empezar con algo más pequeño por menos dinero.", "score": 5, "feedback": "Mejor que rendirse, pero bajar el precio sin quitar riesgo no aborda la objeción real."}
          ]
        },
        {
          "stage": "Cierre Final",
          "client_says": "OK, eso suena razonable. ¿Cómo empezamos?",
          "options": [
            {"response": "Perfecto. Necesito 3 cosas: tu email para enviarte el acceso, una llamada de 30 min para hacer el setup juntos, y que me cuentes qué resultado específico quieres ver en 2 semanas. ¿Te viene bien empezar mañana?", "score": 10, "feedback": "Excelente cierre. Eres específico, creas urgencia positiva, y defines expectativas claras."},
            {"response": "Genial, te mando un email con toda la info.", "score": 5, "feedback": "Funciona pero pierdes momentum. Mejor definir el siguiente paso concreto ahora."},
            {"response": "Cuando quieras, tú me dices.", "score": 2, "feedback": "Sin urgencia ni siguiente paso claro, esta venta puede enfriarse."}
          ]
        }
      ],
      "ideal_outcome": "Carlos acepta el piloto sin riesgo, define métricas de éxito claras, y programa el inicio para esta semana.",
      "learning_points": [
        "'No tengo presupuesto' suele significar 'no veo suficiente valor'",
        "Cuantificar el costo de la inacción reencuadra la conversación",
        "Ofertas de bajo riesgo (piloto, garantía) eliminan barreras",
        "Siempre define el siguiente paso concreto antes de colgar"
      ]
    }
  ]
}`
      } else {
        prompt = `Genera un Simulador de Ventas interactivo y personalizado para esta empresa:

CONTEXTO DE LA EMPRESA:
- Nombre: ${org.name}
- Industria: ${org.industry}
- Descripción: ${org.business_description}
- Productos/Servicios: ${JSON.stringify(org.products_services)}
- Proceso de ventas: ${org.sales_process}

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
}`
      }

    } else if (toolType === 'communication_guide') {
      if (isDiscovery && selectedIdea) {
        prompt = `Genera una GUÍA DE COMUNICACIÓN PARA EMPRENDEDOR que está validando esta idea de negocio:

${getBusinessContext()}

IMPORTANTE: Esta guía es para un emprendedor SOLO que está haciendo sus primeras ventas. No es para una empresa con equipo de marketing.

Genera SOLO el JSON con este formato exacto:
{
  "brand_voice": {
    "personality": ["Auténtico", "Cercano", "Experto", "Accesible"],
    "tone": "Como un amigo experto que genuinamente quiere ayudar - no como un vendedor corporativo",
    "do": [
      "Hablar como persona, no como empresa",
      "Compartir tu historia de por qué empezaste esto",
      "Admitir que estás empezando pero comprometido",
      "Usar lenguaje conversacional y directo"
    ],
    "dont": [
      "Usar 'nosotros' cuando eres solo tú",
      "Pretender ser más grande de lo que eres",
      "Usar jerga corporativa vacía",
      "Prometer cosas que no puedes garantizar aún"
    ]
  },
  "key_messages": {
    "elevator_pitch": "Ayudo a [tipo de cliente] a resolver [problema específico] de forma [diferenciador]. Estoy en fase inicial pero ya he [logro concreto o validación].",
    "value_proposition": "Te ayudo a [beneficio principal] sin [dolor que eliminas], para que puedas [resultado deseado].",
    "tagline": "Una frase simple que capture la esencia de lo que haces",
    "founder_story": "Por qué empecé esto y qué me motiva a resolverlo"
  },
  "vocabulary": {
    "preferred_terms": [
      {"instead_of": "Empresa", "use": "Proyecto/Solución", "reason": "Más honesto en etapa inicial"},
      {"instead_of": "Clientes", "use": "Personas que he ayudado", "reason": "Más personal y auténtico"},
      {"instead_of": "Garantizado", "use": "Mi compromiso es", "reason": "Más realista y creíble"},
      {"instead_of": "El mejor", "use": "Lo que me diferencia", "reason": "Evita claims que no puedes probar"}
    ],
    "power_words": ["Personalizado", "Directo", "Sin intermediarios", "Comprometido", "Flexible", "Enfocado"],
    "words_to_avoid": ["Líder del mercado", "Revolucionario", "Disruptivo", "Único", "Garantizado"]
  },
  "templates": {
    "linkedin_outreach": "Hola [nombre], vi que [contexto específico]. Estoy desarrollando algo que ayuda con [problema] y me encantaría conocer tu perspectiva. ¿Tienes 15 min esta semana para una llamada rápida? No es pitch de venta, genuinamente quiero entender si esto resuelve un problema real.",
    "email_intro": "Asunto: [Beneficio] para [su situación]\\n\\nHola [nombre],\\n\\nSoy [tu nombre]. Estoy desarrollando [solución] porque [tu historia/motivación].\\n\\n[Propuesta de valor en 1 línea]\\n\\n¿Te interesaría explorar si esto te sirve?\\n\\nSaludos",
    "follow_up": "Hola [nombre], sé que estás ocupado/a. Solo quería saber si tuviste chance de pensar en lo que hablamos. Si no es el momento, lo entiendo perfectamente - pero si hay algo que pueda hacer para ayudarte con [problema], aquí estoy.",
    "testimonial_request": "Hola [nombre], ha sido genial trabajar contigo en [proyecto]. ¿Te importaría compartir en 2-3 líneas cómo te ha ayudado? Estoy empezando y tu feedback es súper valioso para mí."
  },
  "scenarios": [
    {
      "situation": "Primer contacto en frío",
      "approach": "Sé directo sobre quién eres y qué buscas. La honestidad de ser emprendedor en etapa inicial puede ser un diferenciador.",
      "example_script": "Hola [nombre], soy [tu nombre] y estoy desarrollando [solución]. Vi que [contexto] y me pareció que podrías tener experiencia con [problema]. ¿Tienes 10 minutos para contarme cómo lo manejas actualmente?"
    },
    {
      "situation": "Después de una buena conversación",
      "approach": "Aprovecha el momentum. Propón siguiente paso concreto antes de que se enfríe.",
      "example_script": "Me encantó esta conversación. Basándome en lo que me contaste, creo que podría ayudarte con [beneficio específico]. ¿Te parece si te preparo una propuesta personalizada para [fecha cercana]?"
    }
  ]
}`
      } else {
        prompt = `Genera una Guía de Comunicación completa para esta empresa:

CONTEXTO DE LA EMPRESA:
- Nombre: ${org.name}
- Industria: ${org.industry}
- Descripción: ${org.business_description}
- Propuesta de valor: ${org.value_proposition}
- Clientes objetivo: ${org.target_customers}

Genera SOLO el JSON con este formato exacto:
{
  "brand_voice": {
    "personality": ["Profesional", "Cercano", "Innovador", "Confiable"],
    "tone": "Amigable pero profesional, directo pero empático",
    "do": ["Usar lenguaje claro", "Mostrar empatía", "Destacar beneficios", "Usar ejemplos"],
    "dont": ["Usar jerga innecesaria", "Ser condescendiente", "Hacer falsas promesas", "Ignorar preocupaciones"]
  },
  "key_messages": {
    "elevator_pitch": "Pitch de 30 segundos",
    "value_proposition": "Ayudamos a [cliente] a [objetivo] mediante [solución]",
    "tagline": "Frase memorable",
    "differentiators": ["Diferenciador 1", "Diferenciador 2", "Diferenciador 3"]
  },
  "vocabulary": {
    "preferred_terms": [{"instead_of": "Comprar", "use": "Invertir en", "reason": "Transmite valor"}],
    "power_words": ["Transformar", "Potenciar", "Optimizar"],
    "words_to_avoid": ["Quizás", "Intentar"]
  },
  "templates": {
    "email_intro": "Template de email introductorio",
    "follow_up": "Template de seguimiento",
    "objection_handling": [{"objection": "Es caro", "response": "Respuesta apropiada"}]
  },
  "scenarios": [{"situation": "Situación", "approach": "Enfoque", "example_script": "Script ejemplo"}]
}`
      }

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

    console.log('Calling Lovable AI with tool calling...')

    // Definir schemas de herramientas según el tipo
    const toolSchemas: Record<string, { name: string; description: string; parameters: Record<string, unknown> }> = {
      buyer_persona: {
        name: 'generate_buyer_persona',
        description: 'Genera un buyer persona detallado',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nombre del persona' },
            age: { type: 'string', description: 'Rango de edad' },
            occupation: { type: 'string', description: 'Ocupación o cargo' },
            industry: { type: 'string', description: 'Industria donde trabaja' },
            goals: { type: 'array', items: { type: 'string' }, description: '3-5 objetivos principales' },
            challenges: { type: 'array', items: { type: 'string' }, description: '3-5 desafíos principales' },
            values: { type: 'array', items: { type: 'string' }, description: '3-5 valores' },
            channels: { type: 'array', items: { type: 'string' }, description: '3-5 canales preferidos' },
            quote: { type: 'string', description: 'Cita representativa' }
          },
          required: ['name', 'age', 'occupation', 'industry', 'goals', 'challenges', 'values', 'channels', 'quote'],
          additionalProperties: false
        }
      },
      customer_journey: {
        name: 'generate_customer_journey',
        description: 'Genera un customer journey completo',
        parameters: {
          type: 'object',
          properties: {
            stages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  touchpoints: { type: 'array', items: { type: 'string' } },
                  emotions: { type: 'string' },
                  painPoints: { type: 'array', items: { type: 'string' } },
                  opportunities: { type: 'array', items: { type: 'string' } }
                },
                required: ['name', 'touchpoints', 'emotions', 'painPoints', 'opportunities']
              }
            }
          },
          required: ['stages'],
          additionalProperties: false
        }
      },
      value_proposition: {
        name: 'generate_value_proposition',
        description: 'Genera una propuesta de valor',
        parameters: {
          type: 'object',
          properties: {
            headline: { type: 'string' },
            subheadline: { type: 'string' },
            benefits: { type: 'array', items: { type: 'string' } },
            features: { type: 'array', items: { type: 'string' } },
            socialProof: { type: 'string' },
            cta: { type: 'string' }
          },
          required: ['headline', 'subheadline', 'benefits', 'features', 'socialProof', 'cta'],
          additionalProperties: false
        }
      },
      sales_simulator: {
        name: 'generate_sales_simulator',
        description: 'Genera un simulador de ventas interactivo con escenarios conversacionales',
        parameters: {
          type: 'object',
          properties: {
            quick_tips: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  tip: { type: 'string' }
                },
                required: ['category', 'tip']
              }
            },
            scenarios: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  difficulty: { type: 'string' },
                  client_profile: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      role: { type: 'string' },
                      company_type: { type: 'string' },
                      personality: { type: 'string' },
                      budget_level: { type: 'string' }
                    },
                    required: ['name', 'role', 'personality']
                  },
                  conversation_flow: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        stage: { type: 'string' },
                        client_says: { type: 'string' },
                        options: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              response: { type: 'string' },
                              score: { type: 'number' },
                              feedback: { type: 'string' }
                            },
                            required: ['response', 'score', 'feedback']
                          }
                        }
                      },
                      required: ['stage', 'client_says', 'options']
                    }
                  },
                  ideal_outcome: { type: 'string' },
                  learning_points: { type: 'array', items: { type: 'string' } }
                },
                required: ['title', 'difficulty', 'client_profile', 'conversation_flow', 'ideal_outcome', 'learning_points']
              }
            }
          },
          required: ['quick_tips', 'scenarios'],
          additionalProperties: false
        }
      },
      content_calendar: {
        name: 'generate_content_calendar',
        description: 'Genera un calendario de contenido',
        parameters: {
          type: 'object',
          properties: {
            weeks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  weekNumber: { type: 'number' },
                  theme: { type: 'string' },
                  posts: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        day: { type: 'string' },
                        platform: { type: 'string' },
                        type: { type: 'string' },
                        topic: { type: 'string' },
                        hook: { type: 'string' }
                      },
                      required: ['day', 'platform', 'type', 'topic', 'hook']
                    }
                  }
                },
                required: ['weekNumber', 'theme', 'posts']
              }
            }
          },
          required: ['weeks'],
          additionalProperties: false
        }
      },
      email_templates: {
        name: 'generate_email_templates',
        description: 'Genera plantillas de email',
        parameters: {
          type: 'object',
          properties: {
            templates: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  subject: { type: 'string' },
                  body: { type: 'string' },
                  cta: { type: 'string' }
                },
                required: ['name', 'type', 'subject', 'body', 'cta']
              }
            }
          },
          required: ['templates'],
          additionalProperties: false
        }
      },
      competitor_analysis: {
        name: 'generate_competitor_analysis',
        description: 'Genera análisis de competidores',
        parameters: {
          type: 'object',
          properties: {
            marketOverview: { type: 'string' },
            competitors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  strengths: { type: 'array', items: { type: 'string' } },
                  weaknesses: { type: 'array', items: { type: 'string' } },
                  marketShare: { type: 'string' },
                  pricingStrategy: { type: 'string' }
                },
                required: ['name', 'strengths', 'weaknesses', 'marketShare', 'pricingStrategy']
              }
            },
            opportunities: { type: 'array', items: { type: 'string' } },
            threats: { type: 'array', items: { type: 'string' } }
          },
          required: ['marketOverview', 'competitors', 'opportunities', 'threats'],
          additionalProperties: false
        }
      },
      pricing_strategy: {
        name: 'generate_pricing_strategy',
        description: 'Genera estrategia de precios',
        parameters: {
          type: 'object',
          properties: {
            recommendedModel: { type: 'string' },
            rationale: { type: 'string' },
            tiers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  price: { type: 'string' },
                  features: { type: 'array', items: { type: 'string' } },
                  targetCustomer: { type: 'string' }
                },
                required: ['name', 'price', 'features', 'targetCustomer']
              }
            },
            discountStrategy: { type: 'string' },
            upsellOpportunities: { type: 'array', items: { type: 'string' } }
          },
          required: ['recommendedModel', 'rationale', 'tiers', 'discountStrategy', 'upsellOpportunities'],
          additionalProperties: false
        }
      },
      elevator_pitch: {
        name: 'generate_elevator_pitch',
        description: 'Genera elevator pitches',
        parameters: {
          type: 'object',
          properties: {
            pitches: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  duration: { type: 'string' },
                  audience: { type: 'string' },
                  script: { type: 'string' },
                  keyPoints: { type: 'array', items: { type: 'string' } }
                },
                required: ['duration', 'audience', 'script', 'keyPoints']
              }
            }
          },
          required: ['pitches'],
          additionalProperties: false
        }
      },
      objection_handler: {
        name: 'generate_objection_handler',
        description: 'Genera manejo de objeciones',
        parameters: {
          type: 'object',
          properties: {
            objections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  objection: { type: 'string' },
                  category: { type: 'string' },
                  response: { type: 'string' },
                  followUp: { type: 'string' }
                },
                required: ['objection', 'category', 'response', 'followUp']
              }
            }
          },
          required: ['objections'],
          additionalProperties: false
        }
      },
      sales_playbook: {
        name: 'generate_sales_playbook',
        description: 'Genera un playbook de ventas completo con metodología y proceso',
        parameters: {
          type: 'object',
          properties: {
            methodology: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                key_principles: { type: 'array', items: { type: 'string' } }
              },
              required: ['name', 'description', 'key_principles']
            },
            sales_process: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  stage: { type: 'string' },
                  objective: { type: 'string' },
                  average_duration: { type: 'string' },
                  activities: { type: 'array', items: { type: 'string' } },
                  tools: { type: 'array', items: { type: 'string' } },
                  exit_criteria: { type: 'string' },
                  conversion_rate_target: { type: 'string' }
                },
                required: ['stage', 'objective', 'average_duration', 'activities', 'tools', 'exit_criteria', 'conversion_rate_target']
              }
            },
            qualification_framework: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                criteria: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      letter: { type: 'string' },
                      meaning: { type: 'string' },
                      questions: { type: 'array', items: { type: 'string' } },
                      red_flags: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['letter', 'meaning', 'questions', 'red_flags']
                  }
                }
              },
              required: ['name', 'criteria']
            },
            objection_handling: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  objection: { type: 'string' },
                  type: { type: 'string' },
                  response_framework: { type: 'string' },
                  example_response: { type: 'string' },
                  follow_up_question: { type: 'string' }
                },
                required: ['objection', 'type', 'response_framework', 'example_response']
              }
            },
            closing_techniques: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  when_to_use: { type: 'string' },
                  example: { type: 'string' }
                },
                required: ['name', 'when_to_use', 'example']
              }
            },
            kpis: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  target: { type: 'string' },
                  frequency: { type: 'string' }
                },
                required: ['name', 'target', 'frequency']
              }
            }
          },
          required: ['methodology', 'sales_process', 'qualification_framework', 'objection_handling', 'closing_techniques', 'kpis'],
          additionalProperties: false
        }
      },
      communication_guide: {
        name: 'generate_communication_guide',
        description: 'Genera una guía de comunicación de marca completa',
        parameters: {
          type: 'object',
          properties: {
            brand_voice: {
              type: 'object',
              properties: {
                personality: { type: 'array', items: { type: 'string' } },
                tone: { type: 'string' },
                do: { type: 'array', items: { type: 'string' } },
                dont: { type: 'array', items: { type: 'string' } }
              },
              required: ['personality', 'tone', 'do', 'dont']
            },
            key_messages: {
              type: 'object',
              properties: {
                elevator_pitch: { type: 'string' },
                value_proposition: { type: 'string' },
                tagline: { type: 'string' },
                differentiators: { type: 'array', items: { type: 'string' } }
              },
              required: ['elevator_pitch', 'value_proposition', 'tagline', 'differentiators']
            },
            vocabulary: {
              type: 'object',
              properties: {
                preferred_terms: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      instead_of: { type: 'string' },
                      use: { type: 'string' },
                      reason: { type: 'string' }
                    },
                    required: ['instead_of', 'use']
                  }
                },
                power_words: { type: 'array', items: { type: 'string' } },
                words_to_avoid: { type: 'array', items: { type: 'string' } }
              },
              required: ['preferred_terms', 'power_words', 'words_to_avoid']
            },
            templates: {
              type: 'object',
              properties: {
                email_intro: { type: 'string' },
                follow_up: { type: 'string' },
                objection_handling: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      objection: { type: 'string' },
                      response: { type: 'string' }
                    },
                    required: ['objection', 'response']
                  }
                }
              },
              required: ['email_intro', 'follow_up', 'objection_handling']
            },
            scenarios: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  situation: { type: 'string' },
                  approach: { type: 'string' },
                  example_script: { type: 'string' }
                },
                required: ['situation', 'approach', 'example_script']
              }
            }
          },
          required: ['brand_voice', 'key_messages', 'vocabulary', 'templates', 'scenarios'],
          additionalProperties: false
        }
      }
    }

    const toolSchema = toolSchemas[toolType]
    if (!toolSchema) {
      throw new Error(`Schema no definido para: ${toolType}`)
    }

    // Llamar a la IA con tool calling
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
        tools: [{
          type: 'function',
          function: toolSchema
        }],
        tool_choice: { type: 'function', function: { name: toolSchema.name } }
      }),
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('AI API error:', aiResponse.status, errorText)
      throw new Error(`Error de IA: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    console.log('AI response received')

    // Extraer el contenido del tool call
    let toolContent: Record<string, unknown>
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0]
    
    if (toolCall && toolCall.function?.arguments) {
      try {
        toolContent = JSON.parse(toolCall.function.arguments)
        console.log('Tool content parsed successfully')
      } catch (parseError) {
        console.error('Error parsing tool arguments:', parseError)
        throw new Error('Error al parsear argumentos de herramienta')
      }
    } else {
      // Fallback: intentar parsear del contenido
      const content = aiData.choices[0]?.message?.content || ''
      console.log('No tool call found, trying content parse. Content length:', content.length)
      
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No se encontró JSON en la respuesta')
      }
      toolContent = JSON.parse(jsonMatch[0])
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
