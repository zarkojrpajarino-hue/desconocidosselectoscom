import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phase } = await req.json();

    if (!phase || phase < 1 || phase > 4) {
      return new Response(
        JSON.stringify({ error: "Invalid phase. Must be between 1 and 4" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Generating tasks for phase ${phase}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get all users
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, username")
      .in("username", ["zarko", "fer", "miguel", "fernando", "angel", "manu", "casti", "diego", "carla"]);

    if (usersError) throw usersError;

    const userMap = users.reduce((acc: any, user: any) => {
      acc[user.username] = user.id;
      return acc;
    }, {});

    console.log("User map created", userMap);

    // IMPORTANTE: Borrar TODAS las tareas de TODAS las fases
    const { error: deleteError } = await supabaseAdmin
      .from("tasks")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteError) throw deleteError;

    console.log("All tasks deleted successfully");

    // Mapeo de usuarios a sus áreas
    const userAreas: Record<string, string> = {
      zarko: "direccion",
      angel: "redes",
      carla: "redes",
      miguel: "operaciones",
      fer: "leads",
      fernando: "ventas",
      manu: "analiticas",
      casti: "cumplimiento",
      diego: "innovacion",
    };

    // Líderes por área (para asignar colaboradores)
    const areaLeaders: Record<string, string[]> = {
      redes: ["angel", "carla"],
      operaciones: ["miguel"],
      leads: ["fer"],
      ventas: ["fernando"],
      analiticas: ["manu"],
      cumplimiento: ["casti"],
      innovacion: ["diego"],
      direccion: [],
    };

    // Función para obtener un líder del área (si existe)
    const getAreaLeader = (area: string, excludeUser: string): string | null => {
      const leaders = areaLeaders[area] || [];
      const availableLeaders = leaders.filter((leader) => leader !== excludeUser);
      if (availableLeaders.length === 0) return null;
      return userMap[availableLeaders[0]] || null;
    };

    // DEFINIR TAREAS BASE (12 diferentes para cada área)
    const taskTemplatesByArea: Record<string, any[]> = {
      direccion: [
        { title: "Coordinar reunión semanal equipo completo", description: "Organizar y liderar reunión semanal con todo el equipo", hasLeader: false },
        { title: "Revisar métricas clave semanales", description: "Analizar KPIs principales del negocio", hasLeader: false },
        { title: "Definir KPIs por área y persona", description: "Establecer métricas específicas por rol", hasLeader: false },
        { title: "Preparar pitch investors", description: "Presentación para potenciales inversores", hasLeader: false },
        { title: "Establecer roadmap trimestral", description: "Planificar objetivos Q1", hasLeader: true },
        { title: "Revisar presupuesto mensual", description: "Control de gastos e ingresos", hasLeader: true },
        { title: "Coordinar evento networking", description: "Organizar encuentro con clientes potenciales", hasLeader: true },
        { title: "Definir cultura empresarial", description: "Establecer valores y principios del equipo", hasLeader: true },
        { title: "Plan crisis management", description: "Preparar protocolo ante problemas críticos", hasLeader: false },
        { title: "Contratar nuevo talento", description: "Proceso de selección para rol clave", hasLeader: false },
        { title: "Revisar estructura organizativa", description: "Optimizar roles y responsabilidades", hasLeader: false },
        { title: "Legal & compliance check", description: "Revisar cumplimiento normativo", hasLeader: false },
      ],
      redes: [
        { title: "Crear 15 posts nuevos Instagram", description: "Contenido visual para feed principal", hasLeader: false },
        { title: "Programar stories diarias", description: "6-8 stories por día durante la semana", hasLeader: false },
        { title: "Colaborar en Google Ads", description: "Optimizar campañas con feedback", hasLeader: true },
        { title: "Lanzar Google Ads €300", description: "Campaña búsqueda con presupuesto asignado", hasLeader: true },
        { title: "Analizar métricas sociales", description: "Revisión engagement y alcance semanal", hasLeader: false },
        { title: "Diseñar reels virales", description: "3-5 reels con alta probabilidad viral", hasLeader: false },
        { title: "Crecer 200 seguidores orgánicos", description: "Estrategia engagement + hashtags", hasLeader: false },
        { title: "Testear Meta Ads €100", description: "Prueba audiencia lookalike", hasLeader: true },
        { title: "Influencer outreach", description: "Contactar 10 micro-influencers", hasLeader: false },
        { title: "Optimizar biografías sociales", description: "CTAs + links en bio", hasLeader: false },
        { title: "Calendario contenido mensual", description: "Planificar posts siguientes 30 días", hasLeader: false },
        { title: "Email marketing campaña", description: "Newsletter semanal + segmentación", hasLeader: true },
      ],
      operaciones: [
        { title: "Optimizar proceso fulfillment", description: "Reducir tiempo preparación cestas", hasLeader: false },
        { title: "Validar proveedores nuevos", description: "3 suppliers alternativos productos clave", hasLeader: false },
        { title: "Implementar CRM", description: "Setup + capacitación equipo", hasLeader: true },
        { title: "Coordinar logística con ventas", description: "Sincronizar entregas semanales", hasLeader: true },
        { title: "Reducir costos 10%", description: "Negociación proveedores + optimización", hasLeader: false },
        { title: "Crear checklist calidad", description: "Protocolo verificación antes envío", hasLeader: false },
        { title: "Automatizar inventario", description: "Sistema alertas stock mínimo", hasLeader: true },
        { title: "Medir tiempos proceso", description: "Benchmark cada etapa fulfillment", hasLeader: false },
        { title: "Plan escalabilidad", description: "Preparar operaciones para 2x volumen", hasLeader: false },
        { title: "Capacitación equipo", description: "Training procedimientos estándar", hasLeader: false },
        { title: "Reportar incidencias", description: "Dashboard problemas + resoluciones", hasLeader: false },
        { title: "Mejorar packaging", description: "Diseño + materiales eco-friendly", hasLeader: true },
      ],
      leads: [
        { title: "Captar 50 leads cualificados", description: "Landing + formularios optimizados", hasLeader: false },
        { title: "Configurar email automation", description: "Secuencias nurturing + follow-ups", hasLeader: false },
        { title: "Optimizar landing pages", description: "A/B testing + mejoras conversión", hasLeader: false },
        { title: "Crear lead magnet", description: "Recurso descargable + captura emails", hasLeader: false },
        { title: "Colaborar en CRM leads", description: "Alimentar base datos + scoring", hasLeader: true },
        { title: "Analizar fuente leads", description: "Attribution + ROI por canal", hasLeader: false },
        { title: "Testear formularios", description: "Reducir fricción + aumentar conversión", hasLeader: false },
        { title: "Implementar chatbot", description: "Respuestas automáticas + calificación", hasLeader: true },
        { title: "Retargeting campaña", description: "Pixel + audiencias visitantes web", hasLeader: true },
        { title: "Webinar captación", description: "Evento online + registro leads", hasLeader: false },
        { title: "SEO local optimization", description: "Google My Business + reviews", hasLeader: false },
        { title: "Reactivar leads fríos", description: "Campaña reengagement base antigua", hasLeader: false },
      ],
      ventas: [
        { title: "Cerrar 8 cestas B2C", description: "Ventas directas consumidor final", hasLeader: false },
        { title: "Captar 5 clientes B2B", description: "Empresas para compras recurrentes", hasLeader: false },
        { title: "Seguimiento pipeline", description: "Actualizar CRM + próximos pasos", hasLeader: false },
        { title: "Negociar contratos grandes", description: "Acuerdos corporativos > €500", hasLeader: true },
        { title: "Upselling clientes actuales", description: "Cross-sell productos complementarios", hasLeader: false },
        { title: "Preparar propuestas comerciales", description: "Decks personalizados prospects clave", hasLeader: false },
        { title: "Coordinar con operaciones", description: "Alinear ventas + capacidad entrega", hasLeader: true },
        { title: "Llamadas prospección", description: "20 cold calls empresas objetivo", hasLeader: false },
        { title: "Crear scripts venta", description: "Guiones llamadas + objeciones comunes", hasLeader: false },
        { title: "Mejorar cierre conversión", description: "Training técnicas cierre efectivas", hasLeader: false },
        { title: "Análisis competencia", description: "Benchmark pricing + propuestas valor", hasLeader: false },
        { title: "Programar demos producto", description: "Presentaciones personalizadas clientes", hasLeader: true },
      ],
      analiticas: [
        { title: "Dashboard métricas clave", description: "Visualización KPIs en tiempo real", hasLeader: false },
        { title: "Reporte semanal rendimiento", description: "Análisis resultados + tendencias", hasLeader: false },
        { title: "Configurar Google Analytics", description: "Eventos + conversiones tracking", hasLeader: false },
        { title: "Análisis embudo ventas", description: "Identificar cuellos botella conversión", hasLeader: false },
        { title: "Predecir demanda mensual", description: "Forecasting basado histórico", hasLeader: true },
        { title: "Segmentación clientes", description: "Clusters comportamiento + valor", hasLeader: false },
        { title: "ROI por canal marketing", description: "Attribution + rentabilidad campañas", hasLeader: false },
        { title: "Colaborar en estrategia data", description: "Definir métricas críticas negocio", hasLeader: true },
        { title: "Automatizar reportes", description: "Scripts + dashboards auto-refresh", hasLeader: true },
        { title: "A/B testing análisis", description: "Resultados experimentos + significancia", hasLeader: false },
        { title: "Lifetime value cálculo", description: "LTV por segmento cliente", hasLeader: false },
        { title: "Alertas métricas críticas", description: "Notificaciones anomalías + drops", hasLeader: false },
      ],
      cumplimiento: [
        { title: "Auditoría legal mensual", description: "Revisión contratos + documentación", hasLeader: false },
        { title: "Actualizar políticas empresa", description: "Términos servicio + privacidad", hasLeader: false },
        { title: "Verificar cumplimiento GDPR", description: "Data protection + consentimientos", hasLeader: false },
        { title: "Revisar contratos proveedores", description: "Términos + SLAs actualizados", hasLeader: true },
        { title: "Certificaciones necesarias", description: "ISO + certificados sanitarios", hasLeader: false },
        { title: "Plan contingencia legal", description: "Protocolo ante demandas + reclamaciones", hasLeader: false },
        { title: "Capacitación equipo normativas", description: "Training compliance + ética", hasLeader: true },
        { title: "Auditoría financiera", description: "Revisión cuentas + transparencia", hasLeader: true },
        { title: "Gestión riesgos legales", description: "Identificar + mitigar exposiciones", hasLeader: false },
        { title: "Protección propiedad intelectual", description: "Marcas + patentes registro", hasLeader: false },
        { title: "Contratos laborales", description: "Actualizar + revisar acuerdos equipo", hasLeader: false },
        { title: "Documentación regulatoria", description: "Mantener archivos compliance", hasLeader: false },
      ],
      innovacion: [
        { title: "Testear 3 nuevos canales", description: "Experimentar plataformas ventas alternativas", hasLeader: false },
        { title: "Prototipar producto nuevo", description: "MVP cesta temática innovadora", hasLeader: false },
        { title: "Experimentar productos innovadores", description: "5 items únicos mercado", hasLeader: false },
        { title: "Colaborar en I+D", description: "Brainstorm ideas + validación feasibility", hasLeader: true },
        { title: "Analizar tendencias mercado", description: "Research competencia + consumer insights", hasLeader: false },
        { title: "Implementar mejora proceso", description: "Optimización basada feedback equipo", hasLeader: true },
        { title: "Validar hipótesis negocio", description: "Experimentos rápidos + learning", hasLeader: false },
        { title: "Desarrollar partnerships estratégicos", description: "Alianzas marcas complementarias", hasLeader: true },
        { title: "Crear roadmap innovación", description: "Pipeline ideas próximos trimestres", hasLeader: false },
        { title: "Tech stack evaluation", description: "Herramientas + plataformas nuevas", hasLeader: false },
        { title: "Customer discovery interviews", description: "10 entrevistas profundas usuarios", hasLeader: false },
        { title: "Benchmarking internacional", description: "Casos éxito mercados similares", hasLeader: false },
      ],
    };

    // GENERAR TAREAS PARA TODOS LOS USUARIOS
    const tasks: any[] = [];
    let orderIndex = 0;

    for (const username of Object.keys(userAreas)) {
      const userId = userMap[username];
      const area = userAreas[username];
      const templates = taskTemplatesByArea[area] || [];

      for (const template of templates) {
        const leaderId = template.hasLeader ? getAreaLeader(area, username) : null;

        tasks.push({
          user_id: userId,
          phase: phase,
          title: template.title,
          description: template.description || "",
          leader_id: leaderId,
          area: area,
          order_index: orderIndex++,
        });
      }
    }

    console.log(`Inserting ${tasks.length} tasks for phase ${phase}`);

    // Insertar todas las tareas
    const { error: insertError } = await supabaseAdmin.from("tasks").insert(tasks);

    if (insertError) throw insertError;

    console.log(`Successfully generated ${tasks.length} tasks for phase ${phase}`);

    return new Response(
      JSON.stringify({
        success: true,
        phase: phase,
        tasksGenerated: tasks.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error generating phase tasks:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
