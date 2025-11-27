import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaskAlternative {
  id: string;
  title: string;
  description: string;
  leader_id: string | null;
  area: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task } = await req.json();
    
    if (!task) {
      throw new Error('Task data is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      throw new Error('AI service not configured');
    }

    console.log('Generating alternatives for task:', task.title);

    const prompt = `Genera 5 alternativas para esta tarea manteniendo la esencia:

Tarea original: "${task.title}"
Descripción: "${task.description}"
Área: ${task.area}
${task.leader_id ? `Líder: ${task.leader_id}` : 'Sin líder (individual)'}

IMPORTANTE: 
- Las alternativas deben ser similares pero con diferente enfoque
- ${task.leader_id ? `MANTENER el mismo leader_id: "${task.leader_id}" en TODAS` : 'Sin leader_id (null)'}
- Mismo nivel de dificultad y tiempo estimado
- Mantener la misma área: "${task.area}"

Responde con un array JSON de exactamente 5 alternativas. Formato:
[
  {
    "id": "alt-1",
    "title": "título de la alternativa",
    "description": "descripción detallada",
    "leader_id": ${task.leader_id ? `"${task.leader_id}"` : 'null'},
    "area": "${task.area}"
  }
]`;

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
            role: 'system', 
            content: 'Eres un experto en gestión de tareas empresariales. Generas alternativas útiles y prácticas.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Por favor intenta de nuevo en unos momentos.' 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'AI credits agotados. Por favor contacta al administrador.' 
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI response received');

    // Extraer JSON del texto
    let alternatives: TaskAlternative[];
    try {
      // Intentar parsear directamente
      alternatives = JSON.parse(content);
    } catch {
      // Si falla, intentar extraer JSON de markdown
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        alternatives = JSON.parse(jsonMatch[0]);
      } else {
        console.error('Could not parse AI response:', content);
        throw new Error('Invalid AI response format');
      }
    }

    // Validar y formatear alternativas
    if (!Array.isArray(alternatives) || alternatives.length === 0) {
      throw new Error('No alternatives generated');
    }

    // Asegurar que todas tengan los campos necesarios
    const formattedAlternatives = alternatives.slice(0, 5).map((alt, index) => ({
      id: alt.id || `alt-${index + 1}`,
      title: alt.title || `Alternativa ${index + 1}`,
      description: alt.description || task.description,
      leader_id: task.leader_id,
      area: task.area
    }));

    console.log(`Generated ${formattedAlternatives.length} alternatives`);

    return new Response(
      JSON.stringify({ alternatives: formattedAlternatives }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-task-alternatives:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error generating alternatives';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateFallbackAlternatives(task: any): TaskAlternative[] {
  return [
    {
      id: 'alt-1',
      title: `Optimizar ${task.title}`,
      description: `Versión optimizada: ${task.description}`,
      leader_id: task.leader_id,
      area: task.area
    },
    {
      id: 'alt-2',
      title: `Mejorar estrategia de ${task.title}`,
      description: `Enfoque estratégico para: ${task.description}`,
      leader_id: task.leader_id,
      area: task.area
    },
    {
      id: 'alt-3',
      title: `Implementar ${task.title} progresivamente`,
      description: `Implementación gradual: ${task.description}`,
      leader_id: task.leader_id,
      area: task.area
    },
    {
      id: 'alt-4',
      title: `Analizar oportunidades en ${task.area}`,
      description: `Análisis detallado para: ${task.description}`,
      leader_id: task.leader_id,
      area: task.area
    },
    {
      id: 'alt-5',
      title: `Desarrollar ${task.title} con enfoque ágil`,
      description: `Metodología ágil para: ${task.description}`,
      leader_id: task.leader_id,
      area: task.area
    }
  ];
}