import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { industry, businessName, targetAudience, brandPersonality, countryCode } = await req.json();

    if (!industry || !businessName) {
      return new Response(
        JSON.stringify({ error: 'Se requiere industria y nombre del negocio' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key no configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `Genera un Brand Kit completo para un negocio con estas características:

NEGOCIO:
- Nombre: ${businessName}
- Industria: ${industry}
- Público objetivo: ${targetAudience || 'General'}
- Personalidad de marca: ${brandPersonality?.join(', ') || 'Profesional, Confiable'}
${countryCode ? `- País: ${countryCode}` : ''}

INSTRUCCIONES:
1. Elige colores que reflejen la industria y personalidad
2. Selecciona tipografías de Google Fonts que combinen bien
3. Define un tono de voz coherente con la marca
4. Proporciona una descripción del concepto de logo
5. Los colores deben estar en formato hexadecimal (#XXXXXX)

Responde SOLO con un objeto JSON válido con esta estructura exacta:
{
  "primary_color": "#HEXCODE",
  "secondary_color": "#HEXCODE", 
  "accent_color": "#HEXCODE",
  "neutral_light": "#HEXCODE",
  "neutral_dark": "#HEXCODE",
  "font_heading": "Nombre de fuente Google",
  "font_body": "Nombre de fuente Google",
  "tone_of_voice": "professional|casual|technical|friendly|luxury",
  "tone_description": "Descripción de cómo debe comunicarse la marca (2-3 oraciones)",
  "logo_concept": "Descripción del concepto de logo ideal (2-3 oraciones)",
  "brand_personality": ["adjetivo1", "adjetivo2", "adjetivo3"]
}`;

    console.log('Calling Lovable AI Gateway for brand kit generation...');

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
            content: 'Eres un experto en branding y diseño de identidad visual. Siempre respondes con JSON válido sin markdown ni explicaciones adicionales.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Límite de peticiones excedido. Intenta de nuevo más tarde.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA agotados. Añade fondos en Lovable.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || '';

    console.log('AI Response received:', content.substring(0, 200));

    // Parse JSON response
    let brandKit;
    try {
      // Clean response - remove markdown code blocks if present
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      brandKit = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw content:', content);
      
      // Return default brand kit on parse error
      brandKit = {
        primary_color: '#0066FF',
        secondary_color: '#00D4FF',
        accent_color: '#FF6B35',
        neutral_light: '#F7F9FC',
        neutral_dark: '#1A1F2E',
        font_heading: 'Montserrat',
        font_body: 'Open Sans',
        tone_of_voice: 'professional',
        tone_description: 'Comunicación clara, directa y profesional que inspira confianza.',
        logo_concept: 'Logo minimalista que transmite profesionalismo y modernidad.',
        brand_personality: ['profesional', 'confiable', 'moderno'],
      };
    }

    // Validate required fields
    const requiredFields = ['primary_color', 'secondary_color', 'accent_color', 'font_heading', 'font_body', 'tone_of_voice'];
    for (const field of requiredFields) {
      if (!brandKit[field]) {
        console.error(`Missing required field: ${field}`);
        return new Response(
          JSON.stringify({ error: `Campo requerido faltante: ${field}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Add industry and target audience
    brandKit.industry = industry;
    brandKit.target_audience = targetAudience;

    console.log('Brand kit generated successfully');

    return new Response(JSON.stringify(brandKit), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-brand-kit:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
