import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskTitle, taskDescription } = await req.json();

    if (!taskTitle) {
      return new Response(
        JSON.stringify({ error: 'taskTitle is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Lovable AI Gateway to generate personalized requirements
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!apiKey) {
      // Return default requirements if no API key
      return new Response(
        JSON.stringify({
          requirements: [
            { id: '1', question: `¿Has completado "${taskTitle}" correctamente?`, type: 'checkbox' },
            { id: '2', question: '¿Qué resultado o entregable has conseguido?', type: 'text' },
            { id: '3', question: '¿Has documentado el proceso?', type: 'checkbox' },
          ]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `Eres un experto en gestión de tareas y verificación de calidad. 
Genera 3-4 preguntas de verificación personalizadas para confirmar que una tarea se ha completado correctamente.

TAREA: ${taskTitle}
${taskDescription ? `DESCRIPCIÓN: ${taskDescription}` : ''}

Genera preguntas específicas para esta tarea que permitan verificar:
1. Que la tarea se ha realizado completamente
2. Que hay un resultado tangible o evidencia
3. Que se han seguido las mejores prácticas

Responde SOLO con un JSON válido con este formato exacto:
{
  "requirements": [
    { "id": "1", "question": "pregunta específica", "type": "checkbox" },
    { "id": "2", "question": "pregunta sobre resultado", "type": "text" },
    { "id": "3", "question": "otra pregunta relevante", "type": "checkbox" }
  ]
}

Tipos disponibles: "checkbox" (para sí/no), "text" (para respuesta detallada), "evidence" (para descripción de entregable)`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'Eres un asistente que genera requisitos de verificación de tareas. Responde SOLO con JSON válido.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    const parsed = JSON.parse(content);

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating requirements:', error);
    
    // Return default requirements on error
    return new Response(
      JSON.stringify({
        requirements: [
          { id: '1', question: 'He completado todos los pasos de esta tarea', type: 'checkbox' },
          { id: '2', question: '¿Qué resultado has obtenido?', type: 'text' },
          { id: '3', question: 'He verificado la calidad del trabajo realizado', type: 'checkbox' },
        ]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
