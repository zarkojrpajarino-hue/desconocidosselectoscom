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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get system config to know current phase
    const { data: systemConfig } = await supabaseAdmin.from("system_config").select("current_phase").single();

    const currentPhase = systemConfig?.current_phase || 1;

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

    // Clear existing tasks for all users for current phase
    await supabaseAdmin.from("tasks").delete().eq("phase", currentPhase);

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
      redes: ["angel", "carla"], // co-leaders independientes
      operaciones: ["miguel"],
      leads: ["fer"],
      ventas: ["fernando"],
      analiticas: ["manu"],
      cumplimiento: ["casti"],
      innovacion: ["diego"],
      direccion: [], // sin líder específico
    };

    // Función para obtener un líder del área (si existe)
    const getAreaLeader = (area: string, excludeUser: string): string | null => {
      const leaders = areaLeaders[area] || [];
      // Filtrar el usuario actual para no asignarse a sí mismo
      const availableLeaders = leaders.filter((leader) => leader !== excludeUser);
      if (availableLeaders.length === 0) return null;
      // Devolver el primer líder disponible (o aleatorio si prefieres)
      return userMap[availableLeaders[0]] || null;
    };

    // DEFINIR TAREAS BASE (12 diferentes para cada área)
    const taskTemplatesByArea: Record<string, any[]> = {
      direccion: [
        {
          title: "Coordinar reunión semanal equipo completo",
          description: "Organizar y liderar reunión semanal con todo el equipo",
          hasLeader: false,
        },
        {
          title: "Revisar métricas clave semanales",
          description: "Analizar KPIs principales del negocio",
          hasLeader: false,
        },
        {
          title: "Definir KPIs por área y persona",
          description: "Establecer métricas específicas por rol",
          hasLeader: false,
        },
        {
          title: "Preparar pitch investors",
          description: "Presentación para potenciales inversores",
          hasLeader: false,
        },
        { title: "Establecer roadmap trimestral", description: "Planificar objetivos Q1", hasLeader: true },
        { title: "Revisar presupuesto mensual", description: "Control de gastos e ingresos", hasLeader: true },
        {
          title: "Coordinar con stakeholders",
          description: "Reuniones con partes interesadas clave",
          hasLeader: false,
        },
        {
          title: "Optimizar estructura organizacional",
          description: "Revisar roles y responsabilidades",
          hasLeader: true,
        },
        { title: "Desarrollar cultura empresarial", description: "Iniciativas de team building", hasLeader: false },
        { title: "Análisis competencia directa", description: "Investigar movimientos del mercado", hasLeader: true },
        { title: "Planificar escalado del negocio", description: "Estrategia de crecimiento", hasLeader: false },
        { title: "Revisar políticas internas", description: "Actualizar handbook y procedimientos", hasLeader: true },
      ],
      redes: [
        {
          title: "Lanzar campaña Google Ads €300/mes",
          description: "Activar primera campaña paid en Google",
          hasLeader: false,
        },
        { title: "Crear contenido semanal Instagram", description: "5 posts + 10 stories", hasLeader: true },
        { title: "Optimizar perfil LinkedIn empresa", description: "Mejorar presencia profesional", hasLeader: false },
        { title: "Diseñar estrategia TikTok", description: "Plan de contenido viral", hasLeader: true },
        { title: "Analizar métricas redes sociales", description: "Report semanal engagement", hasLeader: true },
        { title: "Colaborar con 3 influencers", description: "Partnerships estratégicos", hasLeader: false },
        { title: "Crear email marketing campaign", description: "Newsletter quincenal", hasLeader: true },
        { title: "Optimizar SEO on-page", description: "Mejorar posicionamiento web", hasLeader: false },
        { title: "Producir video promocional", description: "Video 60 seg para RRSS", hasLeader: true },
        { title: "Gestionar comunidad online", description: "Responder comentarios y DMs", hasLeader: false },
        { title: "Implementar chatbot web", description: "Automatizar atención cliente", hasLeader: true },
        { title: "Crear guía de estilo visual", description: "Brand guidelines completas", hasLeader: false },
      ],
      operaciones: [
        {
          title: "Validar proceso completo orden a entrega",
          description: "Asegurar proceso end-to-end funciona correctamente",
          hasLeader: false,
        },
        {
          title: "Establecer margen mínimo 34% por cesta",
          description: "Optimizar costos para lograr margen objetivo",
          hasLeader: true,
        },
        { title: "Optimizar logística última milla", description: "Reducir tiempo de entrega", hasLeader: true },
        { title: "Implementar sistema inventario", description: "Control stock en tiempo real", hasLeader: false },
        { title: "Negociar con proveedores clave", description: "Mejores precios y condiciones", hasLeader: true },
        { title: "Crear SOPs operaciones diarias", description: "Documentar procedimientos", hasLeader: false },
        { title: "Optimizar empaquetado productos", description: "Reducir costos materiales", hasLeader: true },
        { title: "Gestionar devoluciones eficientemente", description: "Proceso claro y rápido", hasLeader: false },
        { title: "Implementar quality control", description: "Inspección pre-envío", hasLeader: true },
        { title: "Coordinar con almacén externo", description: "Logística 3PL", hasLeader: false },
        { title: "Automatizar etiquetado envíos", description: "Integrar sistema", hasLeader: true },
        { title: "Reducir tiempo preparación pedidos", description: "Optimizar picking", hasLeader: false },
      ],
      leads: [
        {
          title: "Optimizar web para conversión",
          description: "Mejorar tasa de conversión de la landing page",
          hasLeader: false,
        },
        { title: "Implementar A/B testing landing", description: "Probar 3 variantes diferentes", hasLeader: true },
        { title: "Crear lead magnet descargable", description: "eBook o guía gratuita", hasLeader: false },
        { title: "Optimizar formularios captación", description: "Reducir fricción", hasLeader: true },
        { title: "Implementar pop-ups estratégicos", description: "Exit intent y scroll", hasLeader: true },
        { title: "Crear secuencia email nurturing", description: "7 emails automatizados", hasLeader: false },
        { title: "Optimizar velocidad de carga web", description: "PageSpeed 90+", hasLeader: true },
        { title: "Implementar live chat proactivo", description: "Asistencia en tiempo real", hasLeader: false },
        { title: "Crear calculadora ROI interactiva", description: "Tool de conversión", hasLeader: true },
        { title: "Optimizar CTAs principales", description: "Copywriting persuasivo", hasLeader: false },
        { title: "Implementar remarketing pixel", description: "Tracking completo", hasLeader: true },
        { title: "Crear testimonios en video", description: "Social proof potente", hasLeader: false },
      ],
      ventas: [
        {
          title: "Captar primeros 5 clientes B2B",
          description: "Conseguir primeros clientes corporativos",
          hasLeader: false,
        },
        { title: "Crear propuesta comercial estándar", description: "Deck de ventas profesional", hasLeader: true },
        { title: "Implementar CRM para seguimiento", description: "Pipeline de ventas organizado", hasLeader: false },
        { title: "Realizar 20 cold calls semanales", description: "Prospección activa", hasLeader: true },
        { title: "Cerrar 3 demos con prospects", description: "Presentaciones producto", hasLeader: true },
        { title: "Crear secuencia follow-up", description: "Email automation post-demo", hasLeader: false },
        { title: "Negociar condiciones especiales corporativas", description: "Pricing B2B", hasLeader: true },
        { title: "Implementar programa referidos", description: "Incentivos clientes", hasLeader: false },
        { title: "Crear case studies clientes", description: "Success stories", hasLeader: true },
        { title: "Asistir a 2 eventos networking", description: "Generar leads presenciales", hasLeader: false },
        { title: "Optimizar proceso onboarding clientes", description: "Primera experiencia", hasLeader: true },
        { title: "Implementar upselling estratégico", description: "Aumentar ticket medio", hasLeader: false },
      ],
      analiticas: [
        {
          title: "Crear dashboard tiempo real Looker",
          description: "Dashboard con métricas en vivo",
          hasLeader: false,
        },
        { title: "Implementar tracking eventos GA4", description: "Analytics avanzado", hasLeader: true },
        { title: "Crear reportes automáticos semanales", description: "Email con KPIs clave", hasLeader: false },
        { title: "Analizar embudo de conversión", description: "Identificar drop-offs", hasLeader: true },
        { title: "Implementar cohort analysis", description: "Retención por cohortes", hasLeader: true },
        { title: "Crear predicción de ventas", description: "Modelo forecasting", hasLeader: false },
        { title: "Optimizar atribución marketing", description: "Multi-touch attribution", hasLeader: true },
        { title: "Implementar product analytics", description: "Mixpanel o Amplitude", hasLeader: false },
        { title: "Crear segmentación clientes", description: "RFM analysis", hasLeader: true },
        { title: "Analizar customer lifetime value", description: "CLV por segmento", hasLeader: false },
        { title: "Implementar alertas automáticas", description: "Anomalías en métricas", hasLeader: true },
        { title: "Crear visualizaciones ejecutivas", description: "Dashboards directivos", hasLeader: false },
      ],
      cumplimiento: [
        { title: "Documentar procesos clave", description: "SOPs de procesos principales", hasLeader: false },
        { title: "Implementar RGPD completo", description: "Compliance protección datos", hasLeader: true },
        { title: "Crear política de privacidad", description: "Legal y términos", hasLeader: false },
        { title: "Auditar seguridad sistemas", description: "Pentest y vulnerabilidades", hasLeader: true },
        { title: "Implementar backup automático", description: "Datos protegidos", hasLeader: true },
        { title: "Crear manual empleado", description: "Handbook completo", hasLeader: false },
        { title: "Implementar control accesos", description: "Permisos granulares", hasLeader: true },
        { title: "Revisar contratos proveedores", description: "Legal review", hasLeader: false },
        { title: "Crear política anti-fraude", description: "Prevención y detección", hasLeader: true },
        { title: "Implementar logs auditoría", description: "Tracking cambios", hasLeader: false },
        { title: "Certificar ISO 27001", description: "Seguridad información", hasLeader: true },
        { title: "Crear plan contingencia", description: "Disaster recovery", hasLeader: false },
      ],
      innovacion: [
        {
          title: "Testar 3 ideas nuevas producto/canal",
          description: "Validar rápidamente nuevas ideas",
          hasLeader: false,
        },
        { title: "Implementar programa beta testers", description: "Early adopters feedback", hasLeader: true },
        { title: "Crear MVP nueva funcionalidad", description: "Prototipo rápido", hasLeader: false },
        { title: "Analizar tendencias mercado emergentes", description: "Research innovación", hasLeader: true },
        { title: "Implementar design thinking workshop", description: "Sesión ideación equipo", hasLeader: true },
        { title: "Testar modelo suscripción", description: "Recurring revenue", hasLeader: false },
        { title: "Crear programa hackathon interno", description: "Ideas innovadoras", hasLeader: true },
        { title: "Implementar customer discovery", description: "20 entrevistas clientes", hasLeader: false },
        { title: "Testar marketplace modelo", description: "Platform economics", hasLeader: true },
        { title: "Crear laboratorio innovación", description: "Espacio experimentación", hasLeader: false },
        { title: "Implementar lean startup methodology", description: "Build-measure-learn", hasLeader: true },
        { title: "Explorar partnerships tecnológicos", description: "Colaboraciones estratégicas", hasLeader: false },
      ],
    };

    // Generar tareas únicas para cada usuario
    const allTasksToInsert = [];

    for (const user of users) {
      const username = user.username;
      const userArea = userAreas[username];
      const taskTemplates = taskTemplatesByArea[userArea] || [];

      // Crear 12 tareas únicas para este usuario
      const userTasks = taskTemplates.map((template, index) => {
        let leaderId = null;

        // Si la tarea debe tener líder, asignar uno del área
        if (template.hasLeader) {
          leaderId = getAreaLeader(userArea, username);
        }

        return {
          title: template.title,
          description: template.description,
          user_id: user.id,
          leader_id: leaderId,
          area: userArea,
          phase: currentPhase,
          order_index: index + 1,
        };
      });

      allTasksToInsert.push(...userTasks);
    }

    const { error: insertError } = await supabaseAdmin.from("tasks").insert(allTasksToInsert);

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        count: allTasksToInsert.length,
        users: users.length,
        phase: currentPhase,
        message: "Tareas únicas creadas para cada usuario según su área",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
