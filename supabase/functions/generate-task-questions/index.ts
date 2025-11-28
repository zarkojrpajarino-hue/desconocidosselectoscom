import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskTitle, taskDescription, taskArea } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `Genera 3 preguntas específicas y relevantes para medir el impacto de esta tarea:

Título: ${taskTitle}
Descripción: ${taskDescription || 'No especificada'}
Área: ${taskArea || 'General'}

Las preguntas deben:
1. Ser específicas y medibles
2. Solicitar datos cuantitativos cuando sea posible
3. Ser relevantes al tipo de tarea

Responde SOLO con un JSON array con este formato exacto (sin markdown, sin explicaciones):
[
  {
    "id": "q1",
    "question": "texto de la pregunta",
    "type": "text",
    "placeholder": "ejemplo de respuesta..."
  },
  {
    "id": "q2",
    "question": "texto de la pregunta",
    "type": "number",
    "placeholder": "0",
    "unit": "€"
  },
  {
    "id": "q3",
    "question": "texto de la pregunta",
    "type": "multiselect",
    "options": ["Opción 1", "Opción 2", "Opción 3"]
  }
]

Types disponibles: text, number, percentage, currency, multiselect
Units disponibles (opcional): €, %, unidades, horas, días`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Eres un experto en diseño de preguntas para medir impacto empresarial. Respondes SOLO con JSON válido, sin markdown ni texto adicional.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Limpiar markdown si existe
    const cleanedContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    let questions;
    try {
      questions = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Error parsing AI response:', cleanedContent);
      throw new Error('Invalid JSON response from AI');
    }

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-task-questions:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        fallback: true
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
