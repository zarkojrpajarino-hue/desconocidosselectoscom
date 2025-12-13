/**
 * @fileoverview Edge function para generar herramientas empresariales personalizadas
 * Solo disponible para plan Enterprise, límite de 5 herramientas por organización
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_ENTERPRISE_TOOLS = 5;

// Catálogo de prompts para cada herramienta
const TOOL_PROMPTS: Record<string, { systemPrompt: string; userPrompt: (org: Record<string, unknown>) => string }> = {
  swot_analysis: {
    systemPrompt: "Eres un consultor estratégico experto. Genera análisis SWOT detallados y accionables. Responde SOLO en JSON.",
    userPrompt: (org) => `Genera un análisis SWOT completo para esta empresa:
- Nombre: ${org.name}
- Industria: ${org.industry}
- Tamaño: ${org.company_size}
- Descripción: ${org.business_description}
- Propuesta de valor: ${org.value_proposition}

JSON exacto:
{
  "strengths": [{"title": "Fortaleza 1", "description": "Detalle", "impact": "alto/medio/bajo"}],
  "weaknesses": [{"title": "Debilidad 1", "description": "Detalle", "mitigation": "Cómo mitigar"}],
  "opportunities": [{"title": "Oportunidad 1", "description": "Detalle", "timeline": "corto/medio/largo plazo"}],
  "threats": [{"title": "Amenaza 1", "description": "Detalle", "contingency": "Plan de contingencia"}],
  "summary": "Resumen ejecutivo",
  "priorityActions": ["Acción 1", "Acción 2", "Acción 3"]
}`
  },
  porter_five_forces: {
    systemPrompt: "Eres experto en estrategia competitiva. Genera análisis de las 5 Fuerzas de Porter. Responde SOLO en JSON.",
    userPrompt: (org) => `Analiza las 5 Fuerzas de Porter para:
- Empresa: ${org.name}
- Industria: ${org.industry}
- Competidores: ${JSON.stringify(org.top_competitors || [])}

JSON exacto:
{
  "threatOfNewEntrants": {"level": "alto/medio/bajo", "factors": ["Factor 1"], "recommendations": ["Rec 1"]},
  "bargainingPowerSuppliers": {"level": "alto/medio/bajo", "factors": ["Factor 1"], "recommendations": ["Rec 1"]},
  "bargainingPowerBuyers": {"level": "alto/medio/bajo", "factors": ["Factor 1"], "recommendations": ["Rec 1"]},
  "threatOfSubstitutes": {"level": "alto/medio/bajo", "factors": ["Factor 1"], "recommendations": ["Rec 1"]},
  "competitiveRivalry": {"level": "alto/medio/bajo", "factors": ["Factor 1"], "recommendations": ["Rec 1"]},
  "overallAssessment": "Evaluación general",
  "strategicImplications": ["Implicación 1", "Implicación 2"]
}`
  },
  business_model_canvas: {
    systemPrompt: "Eres experto en modelos de negocio. Genera Business Model Canvas completos. Responde SOLO en JSON.",
    userPrompt: (org) => `Genera un Business Model Canvas para:
- Empresa: ${org.name}
- Descripción: ${org.business_description}
- Productos: ${JSON.stringify(org.products_services || [])}
- Clientes objetivo: ${org.target_customers}

JSON exacto:
{
  "keyPartners": ["Socio 1", "Socio 2"],
  "keyActivities": ["Actividad 1", "Actividad 2"],
  "keyResources": ["Recurso 1", "Recurso 2"],
  "valuePropositions": ["Propuesta 1", "Propuesta 2"],
  "customerRelationships": ["Relación 1", "Relación 2"],
  "channels": ["Canal 1", "Canal 2"],
  "customerSegments": ["Segmento 1", "Segmento 2"],
  "costStructure": ["Costo 1", "Costo 2"],
  "revenueStreams": ["Ingreso 1", "Ingreso 2"],
  "summary": "Resumen del modelo"
}`
  },
  lean_canvas: {
    systemPrompt: "Eres experto en startups y metodologías lean. Genera Lean Canvas accionables. Responde SOLO en JSON.",
    userPrompt: (org) => `Genera un Lean Canvas para:
- Empresa: ${org.name}
- Problema: ${org.business_description}
- Solución: ${org.value_proposition}

JSON exacto:
{
  "problem": ["Problema 1", "Problema 2", "Problema 3"],
  "existingAlternatives": ["Alternativa 1", "Alternativa 2"],
  "solution": ["Solución 1", "Solución 2", "Solución 3"],
  "keyMetrics": ["Métrica 1", "Métrica 2", "Métrica 3"],
  "uniqueValueProposition": "Propuesta única",
  "highLevelConcept": "Concepto de alto nivel (X para Y)",
  "unfairAdvantage": "Ventaja competitiva difícil de copiar",
  "channels": ["Canal 1", "Canal 2"],
  "customerSegments": ["Segmento 1", "Segmento 2"],
  "earlyAdopters": "Descripción de early adopters",
  "costStructure": ["Costo 1", "Costo 2"],
  "revenueStreams": ["Ingreso 1", "Ingreso 2"]
}`
  },
  value_proposition_canvas: {
    systemPrompt: "Eres experto en diseño de propuesta de valor. Genera Value Proposition Canvas detallados. Responde SOLO en JSON.",
    userPrompt: (org) => `Genera un Value Proposition Canvas para:
- Empresa: ${org.name}
- Clientes: ${org.target_customers}
- Productos: ${JSON.stringify(org.products_services || [])}

JSON exacto:
{
  "customerProfile": {
    "jobs": ["Trabajo 1", "Trabajo 2", "Trabajo 3"],
    "pains": ["Dolor 1", "Dolor 2", "Dolor 3"],
    "gains": ["Ganancia 1", "Ganancia 2", "Ganancia 3"]
  },
  "valueMap": {
    "productsServices": ["Producto 1", "Producto 2"],
    "painRelievers": ["Aliviador 1", "Aliviador 2"],
    "gainCreators": ["Creador 1", "Creador 2"]
  },
  "fit": "Descripción del fit entre cliente y propuesta",
  "recommendations": ["Recomendación 1", "Recomendación 2"]
}`
  },
  competitor_matrix: {
    systemPrompt: "Eres experto en análisis competitivo. Genera matrices de competidores detalladas. Responde SOLO en JSON.",
    userPrompt: (org) => `Genera una matriz competitiva para:
- Empresa: ${org.name}
- Industria: ${org.industry}
- Competidores conocidos: ${JSON.stringify(org.top_competitors || [])}

JSON exacto:
{
  "competitors": [
    {
      "name": "Competidor 1",
      "marketShare": "estimación %",
      "strengths": ["F1", "F2"],
      "weaknesses": ["D1", "D2"],
      "pricing": "bajo/medio/alto",
      "targetMarket": "Descripción",
      "differentiators": ["Dif1", "Dif2"]
    }
  ],
  "yourPosition": {
    "strengths": ["F1", "F2"],
    "weaknesses": ["D1", "D2"],
    "differentiators": ["Dif1", "Dif2"]
  },
  "competitiveAdvantages": ["Ventaja 1", "Ventaja 2"],
  "strategicRecommendations": ["Rec 1", "Rec 2"]
}`
  },
  ansoff_matrix: {
    systemPrompt: "Eres experto en estrategias de crecimiento. Genera matrices de Ansoff accionables. Responde SOLO en JSON.",
    userPrompt: (org) => `Genera una matriz de Ansoff para:
- Empresa: ${org.name}
- Productos actuales: ${JSON.stringify(org.products_services || [])}
- Mercado actual: ${org.target_customers}

JSON exacto:
{
  "marketPenetration": {
    "strategies": ["Estrategia 1", "Estrategia 2"],
    "actions": ["Acción 1", "Acción 2"],
    "risk": "bajo",
    "expectedROI": "descripción"
  },
  "marketDevelopment": {
    "newMarkets": ["Mercado 1", "Mercado 2"],
    "strategies": ["Estrategia 1"],
    "risk": "medio",
    "expectedROI": "descripción"
  },
  "productDevelopment": {
    "newProducts": ["Producto 1", "Producto 2"],
    "strategies": ["Estrategia 1"],
    "risk": "medio",
    "expectedROI": "descripción"
  },
  "diversification": {
    "opportunities": ["Oportunidad 1"],
    "strategies": ["Estrategia 1"],
    "risk": "alto",
    "expectedROI": "descripción"
  },
  "recommendedPriority": "Cuadrante recomendado",
  "90dayPlan": ["Paso 1", "Paso 2", "Paso 3"]
}`
  },
  bcg_matrix: {
    systemPrompt: "Eres experto en gestión de portfolio. Genera matrices BCG para productos/servicios. Responde SOLO en JSON.",
    userPrompt: (org) => `Genera una matriz BCG para:
- Empresa: ${org.name}
- Productos/Servicios: ${JSON.stringify(org.products_services || [])}

JSON exacto:
{
  "stars": [{"name": "Producto", "marketGrowth": "alto", "marketShare": "alto", "recommendation": "Invertir"}],
  "questionMarks": [{"name": "Producto", "marketGrowth": "alto", "marketShare": "bajo", "recommendation": "Evaluar"}],
  "cashCows": [{"name": "Producto", "marketGrowth": "bajo", "marketShare": "alto", "recommendation": "Mantener"}],
  "dogs": [{"name": "Producto", "marketGrowth": "bajo", "marketShare": "bajo", "recommendation": "Desinvertir"}],
  "portfolioBalance": "Evaluación del balance",
  "strategicRecommendations": ["Rec 1", "Rec 2", "Rec 3"]
}`
  },
  pestel_analysis: {
    systemPrompt: "Eres experto en análisis macroeconómico. Genera análisis PESTEL completos. Responde SOLO en JSON.",
    userPrompt: (org) => `Genera un análisis PESTEL para:
- Empresa: ${org.name}
- Industria: ${org.industry}
- País/Región: ${org.geographic_market || "España"}

JSON exacto:
{
  "political": [{"factor": "Factor 1", "impact": "positivo/negativo", "description": "Detalle"}],
  "economic": [{"factor": "Factor 1", "impact": "positivo/negativo", "description": "Detalle"}],
  "social": [{"factor": "Factor 1", "impact": "positivo/negativo", "description": "Detalle"}],
  "technological": [{"factor": "Factor 1", "impact": "positivo/negativo", "description": "Detalle"}],
  "environmental": [{"factor": "Factor 1", "impact": "positivo/negativo", "description": "Detalle"}],
  "legal": [{"factor": "Factor 1", "impact": "positivo/negativo", "description": "Detalle"}],
  "overallOutlook": "Perspectiva general",
  "keyRisks": ["Riesgo 1", "Riesgo 2"],
  "keyOpportunities": ["Oportunidad 1", "Oportunidad 2"]
}`
  },
  okr_template_advanced: {
    systemPrompt: "Eres experto en metodología OKR. Genera templates OKR avanzados y accionables. Responde SOLO en JSON.",
    userPrompt: (org) => `Genera templates OKR avanzados para:
- Empresa: ${org.name}
- Objetivos principales: ${org.main_objectives}
- KPIs actuales: ${JSON.stringify(org.kpis_to_measure || [])}

JSON exacto:
{
  "quarterlyOKRs": [
    {
      "objective": "Objetivo 1",
      "keyResults": [
        {"kr": "KR 1", "metric": "métrica", "baseline": 0, "target": 100, "owner": "rol"}
      ],
      "initiatives": ["Iniciativa 1", "Iniciativa 2"],
      "dependencies": ["Dependencia 1"]
    }
  ],
  "annualOKRs": [
    {
      "objective": "Objetivo anual",
      "keyResults": [{"kr": "KR", "metric": "métrica", "target": 100}]
    }
  ],
  "alignmentMatrix": "Cómo se alinean los OKRs",
  "reviewCadence": "Semanal/Quincenal/Mensual",
  "successCriteria": ["Criterio 1", "Criterio 2"]
}`
  },
  stakeholder_map: {
    systemPrompt: "Eres experto en gestión de stakeholders. Genera mapas de stakeholders detallados. Responde SOLO en JSON.",
    userPrompt: (org) => `Genera un mapa de stakeholders para:
- Empresa: ${org.name}
- Industria: ${org.industry}
- Tamaño del equipo: ${org.company_size}

JSON exacto:
{
  "internal": [
    {"name": "Stakeholder", "role": "Rol", "influence": "alta/media/baja", "interest": "alta/media/baja", "strategy": "Mantener informado/Gestionar de cerca"}
  ],
  "external": [
    {"name": "Stakeholder", "type": "cliente/proveedor/regulador", "influence": "alta/media/baja", "interest": "alta/media/baja", "strategy": "Estrategia"}
  ],
  "keyRelationships": ["Relación crítica 1", "Relación crítica 2"],
  "communicationPlan": [
    {"stakeholder": "Nombre", "frequency": "frecuencia", "channel": "canal", "content": "tipo de contenido"}
  ],
  "riskAssessment": "Evaluación de riesgos de stakeholders"
}`
  },
  risk_assessment_matrix: {
    systemPrompt: "Eres experto en gestión de riesgos empresariales. Genera matrices de riesgo completas. Responde SOLO en JSON.",
    userPrompt: (org) => `Genera una matriz de evaluación de riesgos para:
- Empresa: ${org.name}
- Industria: ${org.industry}
- Descripción: ${org.business_description}

JSON exacto:
{
  "risks": [
    {
      "id": "R1",
      "category": "operacional/financiero/estratégico/cumplimiento",
      "description": "Descripción del riesgo",
      "probability": "alta/media/baja",
      "impact": "alto/medio/bajo",
      "riskScore": "crítico/alto/medio/bajo",
      "mitigation": "Estrategia de mitigación",
      "owner": "Responsable",
      "status": "activo/monitoreado/mitigado"
    }
  ],
  "riskAppetite": "Descripción del apetito de riesgo",
  "topRisks": ["Riesgo crítico 1", "Riesgo crítico 2"],
  "mitigationPriorities": ["Prioridad 1", "Prioridad 2"],
  "monitoringFrequency": "Semanal/Mensual/Trimestral",
  "escalationProcess": "Proceso de escalación"
}`
  }
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { toolType } = await req.json();
    
    if (!toolType || !TOOL_PROMPTS[toolType]) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid tool type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's organization
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .single();

    if (!userRole) {
      return new Response(
        JSON.stringify({ success: false, error: "No organization found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify Enterprise plan
    const { data: org } = await supabase
      .from("organizations")
      .select("*, subscription_plan")
      .eq("id", userRole.organization_id)
      .single();

    if (!org || org.subscription_plan !== "enterprise") {
      return new Response(
        JSON.stringify({ success: false, error: "Enterprise plan required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check tool limit
    const enterpriseToolIds = Object.keys(TOOL_PROMPTS);
    const { data: existingTools, error: countError } = await supabase
      .from("tool_contents")
      .select("tool_type")
      .eq("organization_id", userRole.organization_id)
      .in("tool_type", enterpriseToolIds);

    if (countError) {
      console.error("Error checking tool count:", countError);
    }

    const currentCount = existingTools?.length || 0;
    if (currentCount >= MAX_ENTERPRISE_TOOLS) {
      return new Response(
        JSON.stringify({ success: false, error: "Tool limit reached (5 max)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if tool already exists
    const toolExists = existingTools?.some(t => t.tool_type === toolType);
    if (toolExists) {
      return new Response(
        JSON.stringify({ success: false, error: "Tool already generated" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate tool with AI
    console.log(`[generate-enterprise-tool] Generating ${toolType} for org ${org.name}`);
    
    const toolConfig = TOOL_PROMPTS[toolType];
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: toolConfig.systemPrompt },
          { role: "user", content: toolConfig.userPrompt(org) }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      return new Response(
        JSON.stringify({ success: false, error: "AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsedContent = JSON.parse(jsonMatch[0]);

    // Save to database
    const { error: insertError } = await supabase
      .from("tool_contents")
      .insert({
        organization_id: userRole.organization_id,
        tool_type: toolType,
        content: parsedContent,
        created_by: user.id
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to save tool" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[generate-enterprise-tool] ✅ ${toolType} generated successfully`);

    return new Response(
      JSON.stringify({ success: true, toolType, content: parsedContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-enterprise-tool:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
