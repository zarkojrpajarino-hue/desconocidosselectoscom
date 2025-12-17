import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const LOVABLE_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

interface GenerateRequest {
  taskId: string;
  resourceType: string;
  taskTitle: string;
  taskDescription: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskId, resourceType, taskTitle, taskDescription }: GenerateRequest = await req.json();
    
    console.log(`🤖 Generating AI resources type: ${resourceType} for task: ${taskId}`);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // 1. Get task and organization details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*, organizations!inner(id, name, business_type, value_proposition, country_code)')
      .eq('id', taskId)
      .single();
    
    if (taskError || !task) {
      console.error('Task not found:', taskError);
      return new Response(
        JSON.stringify({ error: 'Task not found' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const org = task.organizations;
    
    // 2. Generate prompt based on resource type
    const prompt = generatePrompt(resourceType, taskTitle, taskDescription, org);
    
    // 3. Call Lovable AI Gateway
    console.log('📡 Calling Lovable AI Gateway...');
    const aiResponse = await fetch(LOVABLE_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: getTemperatureForType(resourceType)
      })
    });
    
    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }
    
    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response (handle markdown code blocks)
    let resources;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      resources = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Raw content:', content);
      resources = { raw_response: content };
    }
    
    console.log('✅ AI resources generated successfully');
    
    // 4. Save to database
    const { error: saveError } = await supabase
      .from('ai_task_resources')
      .upsert({
        task_id: taskId,
        organization_id: task.organization_id,
        resource_type: resourceType,
        resources: resources,
        generated_at: new Date().toISOString()
      }, {
        onConflict: 'task_id'
      });
    
    if (saveError) {
      console.error('❌ Error saving resources:', saveError);
      throw saveError;
    }
    
    console.log('✅ Resources saved to database');
    
    return new Response(
      JSON.stringify({ success: true, resources }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('❌ Error in generate-task-ai-resources:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getTemperatureForType(resourceType: string): number {
  const temperatures: Record<string, number> = {
    'video_scripts': 0.8,
    'social_posts': 0.8,
    'influencer_list': 0.7,
    'ad_campaign': 0.3,
    'design_brief': 0.5,
    'outreach_templates': 0.7,
    'email_sequences': 0.6
  };
  return temperatures[resourceType] || 0.7;
}

function generatePrompt(resourceType: string, taskTitle: string, taskDescription: string, org: any): string {
  const baseContext = `
# CONTEXTO DE LA EMPRESA

**Nombre:** ${org?.name || 'Sin nombre'}
**Industria:** ${org?.business_type || 'No especificada'}
**Propuesta de Valor:** ${org?.value_proposition || 'No especificada'}

# TAREA

**Título:** ${taskTitle}
**Descripción:** ${taskDescription || 'Sin descripción adicional'}
`;

  switch (resourceType) {
    case 'video_scripts':
      return `${baseContext}

# TU MISIÓN

Genera 5 guiones de video cortos (15-60 segundos) optimizados para TikTok e Instagram Reels.

# ESTRUCTURA DE CADA GUION

- title: Título del video (8-12 palabras)
- duration_seconds: Duración recomendada
- platform: TikTok, Instagram Reels, o YouTube Shorts
- hook: Primera frase (3-5 segundos) - ENGANCHAR INMEDIATAMENTE
- body: Desarrollo del video
- cta: Call to action claro
- key_messages: Array de 2-3 mensajes clave
- visual_suggestions: Array de 3-4 sugerencias visuales
- music_style: Estilo de música recomendado
- hashtags: Array de 5-8 hashtags relevantes
- caption: Caption para el post (100-150 caracteres)

# OUTPUT JSON

{
  "video_scripts": [
    {
      "title": "...",
      "duration_seconds": 30,
      "platform": "...",
      "hook": "...",
      "body": "...",
      "cta": "...",
      "key_messages": ["..."],
      "visual_suggestions": ["..."],
      "music_style": "...",
      "hashtags": ["..."],
      "caption": "..."
    }
  ]
}

Responde SOLO con JSON válido, sin markdown ni explicaciones adicionales.`;

    case 'social_posts':
      return `${baseContext}

# TU MISIÓN

Genera 10 ideas de posts para redes sociales distribuidas entre plataformas y tipos de contenido.

# CONTENT PILLARS A CUBRIR

1. Educational (30%) - Educar a tu audiencia
2. Entertaining (30%) - Entretener y engagement
3. Promotional (20%) - Vender productos/servicios
4. Behind-the-scenes (20%) - Humanizar la marca

# ESTRUCTURA POR POST

- platform: Instagram, LinkedIn, Facebook, o Twitter
- post_type: Carousel, Single Image, Video, o Text
- caption: Texto completo del post (50-200 palabras)
- hashtags: Array de 5-10 hashtags
- content_pillar: Educational, Entertaining, Promotional, o Behind-the-scenes
- best_time_to_post: Día y hora recomendados
- visual_description: Descripción de qué mostrar visualmente

# OUTPUT JSON

{
  "social_post_ideas": [
    {
      "platform": "...",
      "post_type": "...",
      "caption": "...",
      "hashtags": ["..."],
      "content_pillar": "...",
      "best_time_to_post": "...",
      "visual_description": "..."
    }
  ]
}

Responde SOLO con JSON válido, sin markdown ni explicaciones adicionales.`;

    case 'ad_campaign':
      return `${baseContext}

# TU MISIÓN

Crea un plan de campaña de anuncios pagados COMPLETO y ACCIONABLE.

# INCLUYE

1. Plataformas recomendadas con % de presupuesto
2. Presupuesto total (mínimo y máximo en EUR)
3. Targeting preciso
4. 3-5 creativos de anuncio
5. KPIs a trackear
6. Resultados esperados

# OUTPUT JSON

{
  "recommended_platforms": [
    {
      "platform": "Meta Ads",
      "why": "...",
      "budget_allocation_percentage": 60
    }
  ],
  "total_budget_recommended": {
    "min": 500,
    "max": 2000,
    "currency": "EUR"
  },
  "targeting": {
    "demographics": "...",
    "interests": ["..."],
    "behaviors": ["..."],
    "locations": ["..."]
  },
  "ad_creatives": [
    {
      "format": "Single Image",
      "headline": "...",
      "description": "...",
      "cta": "..."
    }
  ],
  "kpis_to_track": ["CTR", "CPC", "ROAS"],
  "expected_results": "..."
}

Responde SOLO con JSON válido, sin markdown ni explicaciones adicionales.`;

    case 'design_brief':
      return `${baseContext}

# TU MISIÓN

Crea un brief de diseño completo y profesional.

# OUTPUT JSON

{
  "project_name": "...",
  "deliverables": ["Logo principal", "Variaciones", "Banner Instagram"],
  "brand_guidelines": {
    "primary_colors": ["#HEX1", "#HEX2"],
    "secondary_colors": ["#HEX"],
    "fonts": ["Font name (headers)", "Font name (body)"],
    "tone": "Descripción del tono de marca"
  },
  "dimensions_by_platform": [
    {
      "platform": "Instagram Feed",
      "width": 1080,
      "height": 1080
    }
  ],
  "inspiration_references": ["Referencia 1", "Referencia 2"],
  "key_message": "El mensaje principal a comunicar",
  "dos_and_donts": {
    "dos": ["Usar espacios en blanco", "..."],
    "donts": ["No saturar", "..."]
  }
}

Responde SOLO con JSON válido, sin markdown ni explicaciones adicionales.`;

    case 'outreach_templates':
      return `${baseContext}

# TU MISIÓN

Genera 8 templates de outreach (2 por canal: Email, LinkedIn, Cold Call, WhatsApp).

# OUTPUT JSON

{
  "outreach_templates": [
    {
      "channel": "Email",
      "scenario": "First contact",
      "subject_line": "...",
      "message_body": "...",
      "personalization_fields": ["[NOMBRE]", "[EMPRESA]"],
      "best_practices": ["Tip 1", "Tip 2"]
    }
  ]
}

Responde SOLO con JSON válido, sin markdown ni explicaciones adicionales.`;

    case 'email_sequences':
      return `${baseContext}

# TU MISIÓN

Crea 3 secuencias de email: Onboarding, Nurture, Re-engagement.

# OUTPUT JSON

{
  "email_sequences": [
    {
      "sequence_name": "Onboarding",
      "goal": "Dar la bienvenida y activar al usuario",
      "emails": [
        {
          "day": 0,
          "subject": "...",
          "body": "...",
          "cta": "..."
        }
      ],
      "expected_open_rate": "55-60%",
      "expected_click_rate": "20-25%"
    }
  ]
}

Responde SOLO con JSON válido, sin markdown ni explicaciones adicionales.`;

    case 'influencer_list':
      return `${baseContext}

# TU MISIÓN

Genera una lista de 10 perfiles de influencers ideales (5 micro + 5 macro) para colaboraciones.

Nota: Estos son perfiles FICTICIOS pero representativos de lo que deberías buscar.

# OUTPUT JSON

{
  "influencer_list": [
    {
      "username": "@ejemplo_usuario",
      "platform": "Instagram",
      "profile_url": "https://instagram.com/ejemplo",
      "followers": 45000,
      "engagement_rate": 4.2,
      "category": "Lifestyle",
      "audience_demographics": {
        "age_range": "25-34",
        "gender_split": "70% mujeres, 30% hombres",
        "top_countries": ["ES", "MX", "AR"]
      },
      "estimated_cost_per_post": {
        "min": 200,
        "max": 400,
        "currency": "EUR"
      },
      "why_recommended": "Perfil ideal porque...",
      "outreach_message_template": "Hola [NOMBRE], he visto tu contenido sobre..."
    }
  ]
}

Responde SOLO con JSON válido, sin markdown ni explicaciones adicionales.`;

    case 'task_resources':
      return `${baseContext}

# TU MISIÓN

Genera recursos ESPECÍFICOS y ÚTILES para completar esta tarea. Analiza el título y descripción de la tarea para determinar qué tipo de recursos serían más valiosos.

# ESTRUCTURA DE RESPUESTA

Genera recursos que ayuden a completar la tarea con éxito. Incluye:

1. **Guía paso a paso** - Pasos concretos para ejecutar la tarea
2. **Plantillas o ejemplos** - Templates relevantes que se puedan usar
3. **Tips profesionales** - Consejos de expertos para hacer el trabajo mejor
4. **Herramientas recomendadas** - Software o recursos útiles
5. **Checklist de calidad** - Lista de verificación para asegurar buenos resultados

# OUTPUT JSON

{
  "task_title": "${taskTitle}",
  "step_by_step_guide": [
    {
      "step_number": 1,
      "title": "...",
      "description": "...",
      "estimated_time_minutes": 30,
      "tips": ["..."]
    }
  ],
  "templates": [
    {
      "name": "...",
      "description": "...",
      "content": "...",
      "how_to_use": "..."
    }
  ],
  "professional_tips": [
    {
      "tip": "...",
      "why_it_works": "...",
      "example": "..."
    }
  ],
  "recommended_tools": [
    {
      "name": "...",
      "category": "...",
      "why_recommended": "...",
      "pricing": "..."
    }
  ],
  "quality_checklist": [
    {
      "item": "...",
      "description": "...",
      "priority": "high|medium|low"
    }
  ],
  "estimated_total_time_hours": 2,
  "difficulty_level": "fácil|medio|difícil",
  "expected_outcome": "..."
}

Responde SOLO con JSON válido, sin markdown ni explicaciones adicionales.`;

    default:
      return `${baseContext}

Genera recursos útiles para esta tarea en formato JSON estructurado.

Responde SOLO con JSON válido.`;
  }
}
