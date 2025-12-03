import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessData, countryCode, organizationId } = await req.json();

    if (!businessData || !countryCode) {
      throw new Error('businessData y countryCode son requeridos');
    }

    console.log('Generating buyer persona for country:', countryCode);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch country data
    const { data: countryData, error: countryError } = await supabase
      .from('country_data')
      .select('*')
      .eq('country_code', countryCode)
      .single();

    if (countryError || !countryData) {
      throw new Error(`País no encontrado: ${countryCode}`);
    }

    console.log('Country data loaded:', countryData.country_name);

    // Build contextualized prompt
    const prompt = `
Genera un buyer persona detallado y realista para un negocio con estas características:

**NEGOCIO:**
- Industria: ${businessData.industry || 'No especificada'}
- Producto/Servicio: ${businessData.product || 'No especificado'}
- Propuesta de valor: ${businessData.value_proposition || 'No especificada'}
${businessData.target_market ? `- Mercado objetivo: ${businessData.target_market}` : ''}

**CONTEXTO GEOGRÁFICO (${countryData.country_name}):**
- Población: ${countryData.population?.toLocaleString() || 'N/A'} habitantes
- Edad mediana: ${countryData.median_age || 'N/A'} años
- Penetración internet: ${countryData.internet_penetration || 'N/A'}%
- Penetración e-commerce: ${countryData.ecommerce_penetration || 'N/A'}%
- PIB per cápita: ${countryData.currency}${countryData.gdp_per_capita?.toLocaleString() || 'N/A'}
- Tasa de desempleo: ${countryData.unemployment_rate || 'N/A'}%
- Plataformas sociales populares: ${(countryData.top_social_platforms || []).join(', ')}
- Plataformas e-commerce populares: ${(countryData.top_ecommerce_platforms || []).join(', ')}

**INSTRUCCIONES:**
1. Crea un buyer persona que refleje la demografía real de ${countryData.country_name}
2. Considera los hábitos de compra locales y el poder adquisitivo
3. Incluye canales de comunicación relevantes para este mercado
4. Sé específico con rangos de ingresos en ${countryData.currency}
5. Usa nombres y referencias culturales apropiadas para ${countryData.country_name}

Responde ÚNICAMENTE con un objeto JSON válido siguiendo esta estructura exacta:
{
  "name": "Nombre realista del país",
  "age": 30,
  "location": "${countryData.country_name}, [ciudad específica]",
  "occupation": "Ocupación realista",
  "income_range": "${countryData.currency}X - ${countryData.currency}Y anual",
  "demographics": {
    "education": "Nivel educativo",
    "family_status": "Estado familiar",
    "housing": "Situación de vivienda"
  },
  "psychographics": {
    "values": ["valor1", "valor2", "valor3"],
    "interests": ["interés1", "interés2", "interés3"],
    "lifestyle": "Descripción del estilo de vida"
  },
  "pain_points": ["dolor1", "dolor2", "dolor3"],
  "goals": ["objetivo1", "objetivo2", "objetivo3"],
  "preferred_channels": ["canal1", "canal2", "canal3"],
  "buying_behavior": {
    "decision_factors": ["factor1", "factor2"],
    "buying_frequency": "frecuencia",
    "price_sensitivity": "alta/media/baja",
    "preferred_payment_methods": ["método1", "método2"]
  }
}
`.trim();

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no está configurada');
    }

    console.log('Calling Lovable AI Gateway...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'Eres un experto en marketing y análisis de clientes. Generas buyer personas precisos basados en datos demográficos reales. Siempre respondes SOLO con JSON válido, sin texto adicional.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Límite de solicitudes excedido. Intenta más tarde.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos agotados. Añade fondos a tu cuenta.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';

    console.log('AI response received, parsing JSON...');

    // Parse JSON from response
    let persona;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1]?.trim() || content.trim();
      persona = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError, content);
      throw new Error('La IA no devolvió un JSON válido');
    }

    // Save to database if organizationId provided
    if (organizationId) {
      console.log('Saving buyer persona to database...');
      
      const { error: insertError } = await supabase
        .from('buyer_personas')
        .insert({
          organization_id: organizationId,
          name: persona.name,
          age: persona.age,
          location: persona.location,
          occupation: persona.occupation,
          income_range: persona.income_range,
          demographics: persona.demographics,
          psychographics: persona.psychographics,
          pain_points: persona.pain_points,
          goals: persona.goals,
          preferred_channels: persona.preferred_channels,
          buying_behavior: persona.buying_behavior,
          country_code: countryCode,
        });

      if (insertError) {
        console.error('Error saving buyer persona:', insertError);
        // Don't fail the request, just log the error
      } else {
        console.log('Buyer persona saved successfully');
      }
    }

    return new Response(
      JSON.stringify({ persona, countryData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-buyer-persona:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
