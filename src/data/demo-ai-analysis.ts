// ============================================
// DEMO DATA - AI ANALYSIS (PREMIUM QUALITY)
// src/data/demo-ai-analysis.ts
// ============================================

import { AIAnalysisResult } from '@/types/ai-analysis.types';

export const DEMO_AI_ANALYSIS: AIAnalysisResult = {
  id: 'demo-analysis-001',
  organization_id: 'demo-org',
  generated_at: new Date().toISOString(),
  data_period: {
    start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date().toISOString(),
  },

  // ============================================
  // EXECUTIVE DASHBOARD
  // ============================================
  executive_dashboard: {
    overall_score: 78,
    health_status: 'good',
    summary: 'Tu empresa muestra una trayectoria sólida con un crecimiento del 23% respecto al trimestre anterior. Las finanzas están saludables con 14 meses de runway. El equipo mantiene alta productividad (87%) aunque hay señales de sobrecarga en el área de desarrollo. Las principales oportunidades están en la expansión al mercado europeo y la automatización de procesos de ventas. Recomendamos priorizar la contratación de 2 desarrolladores senior y optimizar el CAC que está 15% por encima del benchmark.',
    key_metrics: {
      revenue_trend: 23.5,
      efficiency_score: 82,
      team_performance: 87,
      customer_satisfaction: 91,
    },
    comparison_last_period: {
      revenue_change: 18.3,
      profit_change: 12.7,
      team_productivity_change: 5.2,
      customer_growth: 28.4,
    },
  },

  // ============================================
  // FINANCIAL HEALTH
  // ============================================
  financial_health: {
    score: 85,
    status: 'good',
    metrics: {
      monthly_revenue: 127500,
      monthly_expenses: 89200,
      profit_margin: 30.0,
      burn_rate: 45600,
      runway_months: 14,
      cash_balance: 638400,
      revenue_per_employee: 12750,
      operating_efficiency: 76,
    },
    trends: {
      revenue_growth: 8.5,
      expense_growth: 3.2,
      margin_trend: 'improving',
      cash_flow_trend: 'stable',
    },
    insights: [
      'Los ingresos recurrentes (MRR) han crecido un 23% este trimestre, superando la meta del 18%',
      'El margen de beneficio ha mejorado 4 puntos porcentuales gracias a la optimización de costos operativos',
      'El CAC ha disminuido un 12% debido a las mejoras en el funnel de conversión',
      'El LTV:CAC ratio de 4.2:1 indica un modelo de negocio saludable y escalable',
    ],
    recommendations: [
      'Considerar reinversión del 40% de beneficios en marketing para acelerar crecimiento',
      'Negociar mejores términos con proveedores para reducir COGS un 8-10%',
      'Implementar modelo de pricing basado en valor para aumentar ARPU un 15%',
      'Explorar línea de crédito para tener colchón adicional de liquidez',
    ],
    warning_signs: [
      'Los gastos de personal crecen más rápido que los ingresos (requiere monitoreo)',
      'Concentración de ingresos: 35% proviene de los top 3 clientes',
    ],
    charts: {
      revenue_vs_expenses: [
        { month: 'Ene', ingresos: 98500, gastos: 78200 },
        { month: 'Feb', ingresos: 105200, gastos: 81400 },
        { month: 'Mar', ingresos: 112800, gastos: 84100 },
        { month: 'Abr', ingresos: 118400, gastos: 85900 },
        { month: 'May', ingresos: 121700, gastos: 87300 },
        { month: 'Jun', ingresos: 127500, gastos: 89200 },
      ],
      margin_evolution: [
        { month: 'Ene', margen: 20.6 },
        { month: 'Feb', margen: 22.6 },
        { month: 'Mar', margen: 25.4 },
        { month: 'Abr', margen: 27.4 },
        { month: 'May', margen: 28.2 },
        { month: 'Jun', margen: 30.0 },
      ],
      burn_rate_projection: [
        { month: 'Jul', burn: 44200 },
        { month: 'Ago', burn: 43800 },
        { month: 'Sep', burn: 42100 },
        { month: 'Oct', burn: 40500 },
        { month: 'Nov', burn: 38900 },
        { month: 'Dic', burn: 36200 },
      ],
      cash_runway: [
        { month: 'Actual', balance: 638400 },
        { month: '+3m', balance: 512800 },
        { month: '+6m', balance: 398600 },
        { month: '+9m', balance: 295400 },
        { month: '+12m', balance: 203200 },
      ],
    },
  },

  // ============================================
  // GROWTH ANALYSIS
  // ============================================
  growth_analysis: {
    current_stage: 'growth',
    growth_rate: 'fast',
    growth_score: 81,
    metrics: {
      customer_acquisition: 47,
      retention_rate: 94,
      expansion_revenue: 18500,
      market_penetration: 3.2,
      monthly_growth_rate: 7.8,
      customer_lifetime_value: 8400,
      customer_acquisition_cost: 2000,
    },
    bottlenecks: [
      {
        area: 'Ventas',
        severity: 'high',
        description: 'El ciclo de ventas promedio es de 45 días, 20% más largo que el benchmark del sector',
        impact: 'Retrasa el cierre de deals y aumenta el CAC en aproximadamente €400 por cliente',
        solution: 'Implementar herramientas de sales enablement y automatizar follow-ups',
        estimated_resolution_time: '2-3 meses',
      },
      {
        area: 'Producto',
        severity: 'medium',
        description: 'La tasa de activación de nuevos usuarios es del 62%, debajo del objetivo del 75%',
        impact: 'Pérdida potencial de 15-20% de nuevos clientes por fricción en onboarding',
        solution: 'Rediseñar el flujo de onboarding con tutoriales interactivos y personalización',
        estimated_resolution_time: '4-6 semanas',
      },
    ],
    opportunities: [
      {
        title: 'Expansión a mercado DACH',
        description: 'Alemania, Austria y Suiza representan un TAM de €2.4B con competencia limitada',
        potential_impact: 'high',
        effort_required: 'high',
        timeline: '6-12 meses',
        expected_roi: '280% en 18 meses',
        dependencies: ['Localización del producto', 'Equipo de ventas local', 'Compliance GDPR'],
      },
      {
        title: 'Programa de partners/revendedores',
        description: 'Canal indirecto puede aportar 30-40% de nuevos clientes con menor CAC',
        potential_impact: 'high',
        effort_required: 'medium',
        timeline: '3-6 meses',
        expected_roi: '150% en 12 meses',
        dependencies: ['Portal de partners', 'Programa de certificación', 'Estructura de comisiones'],
      },
      {
        title: 'Upselling tier Enterprise',
        description: '23% de clientes actuales son candidatos para upgrade a plan Enterprise',
        potential_impact: 'medium',
        effort_required: 'low',
        timeline: '1-2 meses',
        expected_roi: '420% inmediato',
        dependencies: ['Funcionalidades Enterprise diferenciadas', 'Equipo de Customer Success'],
      },
    ],
    competitive_advantages: [
      'Tiempo de implementación 60% menor que competidores principales',
      'Único proveedor con integración nativa con principales ERPs',
      'NPS de 72 vs promedio del sector de 45',
      'Equipo de soporte con tiempo de respuesta <2 horas',
    ],
    market_threats: [
      'Entrada de competidor bien financiado (€50M Series B) al mercado español',
      'Grandes players (SAP, Salesforce) desarrollando funcionalidades similares',
      'Posible consolidación del mercado en los próximos 18-24 meses',
    ],
    charts: {
      customer_growth: [
        { month: 'Ene', clientes: 156 },
        { month: 'Feb', clientes: 168 },
        { month: 'Mar', clientes: 184 },
        { month: 'Abr', clientes: 198 },
        { month: 'May', clientes: 215 },
        { month: 'Jun', clientes: 234 },
      ],
      revenue_by_product: [
        { month: 'Starter', valor: 32400 },
        { month: 'Professional', valor: 58900 },
        { month: 'Enterprise', valor: 36200 },
      ],
      market_share_evolution: [
        { month: 'Q1 2024', share: 2.1 },
        { month: 'Q2 2024', share: 2.8 },
        { month: 'Q3 2024', share: 3.2 },
      ],
      churn_analysis: [
        { month: 'Ene', churn: 2.1 },
        { month: 'Feb', churn: 1.8 },
        { month: 'Mar', churn: 1.5 },
        { month: 'Abr', churn: 1.9 },
        { month: 'May', churn: 1.4 },
        { month: 'Jun', churn: 1.2 },
      ],
    },
  },

  // ============================================
  // TEAM PERFORMANCE
  // ============================================
  team_performance: {
    overall_score: 87,
    productivity_trend: 'improving',
    team_metrics: {
      total_members: 10,
      active_members: 10,
      avg_tasks_per_member: 24,
      completion_rate: 89,
      collaboration_score: 82,
      innovation_score: 75,
      retention_rate: 95,
    },
    individual_performance: [
      {
        user_id: '1',
        user_name: 'María García',
        role: 'CTO',
        performance_score: 94,
        strengths: ['Liderazgo técnico', 'Visión estratégica', 'Mentoring'],
        areas_to_improve: ['Delegación de tareas operativas'],
        task_completion_rate: 96,
        impact_rating: 'high',
        burnout_risk: 'medium',
        personalized_advice: 'Considera delegar más tareas operativas para enfocarte en arquitectura y estrategia técnica a largo plazo.',
        recent_achievements: ['Migración a microservicios completada', 'Reducción 40% tiempo de deploy'],
        collaboration_score: 91,
      },
      {
        user_id: '2',
        user_name: 'Carlos López',
        role: 'Head of Sales',
        performance_score: 88,
        strengths: ['Cierre de deals', 'Negociación', 'Gestión de pipeline'],
        areas_to_improve: ['Documentación de procesos', 'Uso de CRM'],
        task_completion_rate: 85,
        impact_rating: 'high',
        burnout_risk: 'low',
        personalized_advice: 'Documenta tus mejores prácticas de ventas para escalar el equipo comercial.',
        recent_achievements: ['Deal Enterprise de €45K', 'Nuevo partner estratégico'],
        collaboration_score: 78,
      },
      {
        user_id: '3',
        user_name: 'Ana Martínez',
        role: 'Product Manager',
        performance_score: 91,
        strengths: ['User research', 'Priorización', 'Comunicación cross-funcional'],
        areas_to_improve: ['Análisis de datos cuantitativo'],
        task_completion_rate: 92,
        impact_rating: 'high',
        burnout_risk: 'low',
        personalized_advice: 'Excelente trabajo en el roadmap Q3. Considera profundizar en analytics para fortalecer decisiones con datos.',
        recent_achievements: ['Lanzamiento v2.0 exitoso', 'NPS mejorado 12 puntos'],
        collaboration_score: 95,
      },
    ],
    bottlenecks: [
      'Equipo de desarrollo sobrecargado con 1.3x capacidad',
      'Falta de documentación técnica ralentiza onboarding',
      'Dependencia crítica de un solo DevOps engineer',
    ],
    star_performers: ['María García', 'Ana Martínez'],
    at_risk_members: [],
    team_health_indicators: {
      workload_balance: 72,
      communication_quality: 88,
      goal_alignment: 91,
      morale: 85,
    },
    charts: {
      productivity_by_member: [
        { month: 'María G.', productividad: 94, tareas: 28 },
        { month: 'Carlos L.', productividad: 88, tareas: 22 },
        { month: 'Ana M.', productividad: 91, tareas: 26 },
        { month: 'Pedro S.', productividad: 82, tareas: 21 },
        { month: 'Laura R.', productividad: 86, tareas: 24 },
      ],
      task_distribution: [
        { month: 'Desarrollo', valor: 38 },
        { month: 'Ventas', valor: 22 },
        { month: 'Marketing', valor: 18 },
        { month: 'Operaciones', valor: 12 },
        { month: 'Soporte', valor: 10 },
      ],
      completion_rates: [
        { month: 'Sem 1', completado: 85 },
        { month: 'Sem 2', completado: 88 },
        { month: 'Sem 3', completado: 91 },
        { month: 'Sem 4', completado: 89 },
      ],
      team_velocity: [
        { month: 'Ene', velocity: 42 },
        { month: 'Feb', velocity: 45 },
        { month: 'Mar', velocity: 48 },
        { month: 'Abr', velocity: 52 },
        { month: 'May', velocity: 55 },
        { month: 'Jun', velocity: 58 },
      ],
    },
  },

  // ============================================
  // STRATEGIC PRIORITIES
  // ============================================
  strategic_priorities: {
    high_impact_low_effort: [
      {
        id: 'p1',
        title: 'Optimizar página de precios',
        description: 'A/B test en página de pricing para mejorar conversión',
        impact: 'high',
        effort: 'low',
        timeline: '2 semanas',
        expected_outcome: '+15% conversión en página de precios',
        priority_score: 95,
      },
      {
        id: 'p2',
        title: 'Implementar chatbot de soporte',
        description: 'Chatbot con IA para resolver 60% de consultas básicas',
        impact: 'high',
        effort: 'low',
        timeline: '3 semanas',
        expected_outcome: '-40% tickets de soporte nivel 1',
        priority_score: 88,
      },
    ],
    high_impact_high_effort: [
      {
        id: 'p3',
        title: 'Expansión internacional DACH',
        description: 'Entrada al mercado alemán con localización completa',
        impact: 'high',
        effort: 'high',
        timeline: '6-9 meses',
        expected_outcome: '+€500K ARR en 18 meses',
        priority_score: 82,
      },
      {
        id: 'p4',
        title: 'Plataforma de APIs públicas',
        description: 'Ecosystem de integraciones para partners',
        impact: 'high',
        effort: 'high',
        timeline: '4-6 meses',
        expected_outcome: '+30% retención, nuevo canal de revenue',
        priority_score: 78,
      },
    ],
    low_impact_low_effort: [
      {
        id: 'p5',
        title: 'Actualizar documentación',
        description: 'Refrescar docs de usuario con nuevas funcionalidades',
        impact: 'low',
        effort: 'low',
        timeline: '1 semana',
        expected_outcome: '-10% tickets de "cómo hacer X"',
        priority_score: 45,
      },
    ],
    low_impact_high_effort: [
      {
        id: 'p6',
        title: 'Rediseño completo UI',
        description: 'Nuevo sistema de diseño desde cero',
        impact: 'low',
        effort: 'high',
        timeline: '3-4 meses',
        expected_outcome: 'Mejora estética sin impacto en métricas clave',
        priority_score: 25,
      },
    ],
    recommended_focus: [
      'Priorizar Quick Wins: optimización de precios y chatbot de soporte',
      'Preparar terreno para expansión DACH mientras se ejecutan quick wins',
      'Posponer rediseño UI completo - no justifica el esfuerzo actualmente',
    ],
    initiatives_to_stop: [
      'Desarrollo de app móvil nativa (90% de usuarios son desktop)',
      'Integración con herramientas legacy con baja demanda',
    ],
  },

  // ============================================
  // STRATEGIC QUESTIONS
  // ============================================
  strategic_questions: {
    focus_questions: [
      {
        id: 'q1',
        question: '¿Deberíamos priorizar crecimiento o rentabilidad en los próximos 12 meses?',
        category: 'strategy',
        why_important: 'Con runway de 14 meses, la decisión afecta contrataciones, marketing y estrategia de pricing',
        current_situation: 'Actualmente en punto de equilibrio con ligero beneficio (30% margen)',
        suggested_approach: 'Recomiendo growth moderado: reinvertir 50% de beneficios en crecimiento manteniendo rentabilidad base',
        deadline: 'this_month',
        consequences_if_ignored: 'Sin dirección clara, decisiones tácticas desalineadas y oportunidad perdida de escalar',
      },
      {
        id: 'q2',
        question: '¿Cuál es el momento óptimo para levantar una ronda de financiación?',
        category: 'financial',
        why_important: 'El timing de fundraising afecta valoración, dilución y opciones estratégicas',
        current_situation: 'Métricas sólidas: €1.5M ARR, 23% growth MoM, 94% retention, 14 meses runway',
        suggested_approach: 'Esperar 2-3 trimestres más para alcanzar €2.5M ARR y mejorar posición negociadora',
        deadline: 'this_quarter',
        consequences_if_ignored: 'Riesgo de dilución excesiva si se levanta antes de alcanzar métricas óptimas',
      },
    ],
    money_questions: [
      {
        id: 'q3',
        question: '¿Cómo reducir el CAC manteniendo la calidad de leads?',
        category: 'financial',
        why_important: 'CAC actual de €2,000 es 15% mayor que benchmark del sector',
        current_situation: 'Mix de canales: 40% paid, 35% contenido, 25% referidos',
        suggested_approach: 'Aumentar inversión en content marketing y programa de referidos que tienen CAC 50% menor',
        deadline: 'this_quarter',
        consequences_if_ignored: 'Presión continua en márgenes y menor eficiencia de capital',
      },
    ],
    team_questions: [
      {
        id: 'q4',
        question: '¿Contratar generalistas o especialistas para la próxima fase?',
        category: 'team',
        why_important: 'Decisión crítica que afecta velocidad de ejecución y cultura',
        current_situation: 'Equipo actual de 10 personas, mayormente generalistas versátiles',
        suggested_approach: 'Próximas 3 contrataciones: 2 especialistas (DevOps Sr, Growth Marketer) + 1 generalista',
        deadline: 'this_month',
        consequences_if_ignored: 'Cuellos de botella en áreas críticas (infraestructura, growth)',
      },
    ],
    market_questions: [
      {
        id: 'q5',
        question: '¿Atacar nuevos verticales o profundizar en el actual?',
        category: 'market',
        why_important: 'Define la estrategia de producto y go-to-market para los próximos 18 meses',
        current_situation: '80% de clientes en vertical SaaS B2B, oportunidad en fintech y healthtech',
        suggested_approach: 'Profundizar en SaaS B2B (mayor expertise) + piloto selectivo en fintech',
        deadline: 'this_quarter',
        consequences_if_ignored: 'Dispersión de recursos o pérdida de oportunidades de nicho',
      },
    ],
    product_questions: [
      {
        id: 'q6',
        question: '¿Desarrollar app móvil o mejorar experiencia web?',
        category: 'product',
        why_important: 'Inversión significativa de recursos de desarrollo (3-6 meses)',
        current_situation: 'Solo 10% de uso en móvil, pero creciendo 5% mensual',
        suggested_approach: 'Priorizar PWA responsive sobre app nativa - menor inversión, cubre 90% de casos de uso',
        deadline: 'this_month',
        consequences_if_ignored: 'Desarrollo de feature que pocos usuarios utilizarán',
      },
    ],
  },

  // ============================================
  // FUTURE ROADMAP
  // ============================================
  future_roadmap: {
    next_30_days: [
      {
        id: 'd1',
        title: 'Lanzar A/B test de pricing',
        priority: 'critical',
        description: 'Test de 3 variantes de página de precios',
        estimated_impact: '+15% conversión',
        action_items: ['Diseñar variantes', 'Configurar analytics', 'Lanzar test'],
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'd2',
        title: 'Contratar DevOps Senior',
        priority: 'high',
        description: 'Eliminar cuello de botella en infraestructura',
        estimated_impact: '-60% tiempo de deploys, mayor estabilidad',
        action_items: ['Finalizar JD', 'Publicar en LinkedIn/StackOverflow', 'Entrevistar top 5'],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ],
    next_90_days: [
      {
        id: 'd3',
        title: 'Implementar programa de referidos',
        priority: 'high',
        description: 'Sistema automatizado de referral marketing',
        estimated_impact: '+20% nuevos clientes con 50% menor CAC',
        action_items: ['Diseñar incentivos', 'Desarrollar tracking', 'Lanzar beta'],
      },
      {
        id: 'd4',
        title: 'Preparar expansión DACH',
        priority: 'medium',
        description: 'Localización, compliance y estrategia de entrada',
        estimated_impact: 'Base para €500K ARR adicional',
        action_items: ['Contratar country manager', 'Localizar producto', 'Establecer entity legal'],
      },
    ],
    next_year: [
      {
        id: 'd5',
        title: 'Alcanzar €3M ARR',
        priority: 'critical',
        description: 'Objetivo de revenue para posición de Series A',
        estimated_impact: 'Valoración €25-30M para Serie A',
        action_items: ['Ejecutar playbook de crecimiento', 'Expandir equipo comercial', 'Entrar a 2 nuevos mercados'],
      },
    ],
    scaling_plan: {
      current_capacity: '250 clientes con equipo actual',
      target_capacity: '1,000 clientes en 12 meses',
      bottlenecks_for_scale: [
        'Onboarding manual no escala más allá de 50 nuevos clientes/mes',
        'Infraestructura actual soporta max 500 usuarios concurrentes',
        'Equipo de soporte saturado con ratio actual 1:50',
      ],
      required_investments: [
        {
          area: 'Infraestructura Cloud',
          amount: '€45,000',
          expected_return: 'Capacidad 5x actual',
          timeline: '3 meses',
          roi_percentage: 320,
          risk_level: 'low',
        },
        {
          area: 'Automatización de Onboarding',
          amount: '€30,000',
          expected_return: '80% reducción tiempo manual',
          timeline: '2 meses',
          roi_percentage: 450,
          risk_level: 'low',
        },
        {
          area: 'Expansión Equipo Comercial',
          amount: '€180,000/año',
          expected_return: '+€600K ARR',
          timeline: '12 meses',
          roi_percentage: 233,
          risk_level: 'medium',
        },
      ],
      hiring_plan: [
        {
          role: 'DevOps Senior',
          when: 'Inmediato',
          why: 'Eliminar cuello de botella en deploys e infraestructura',
          priority: 'critical',
          estimated_cost: '€65,000/año',
          expected_impact: '60% mejora en tiempo de deploy',
        },
        {
          role: 'Growth Marketing Manager',
          when: 'Q1 2025',
          why: 'Escalar canales de adquisición de manera eficiente',
          priority: 'high',
          estimated_cost: '€55,000/año',
          expected_impact: '-25% CAC',
        },
        {
          role: 'Senior Full-Stack Developer',
          when: 'Q1 2025',
          why: 'Aumentar velocity de desarrollo de producto',
          priority: 'high',
          estimated_cost: '€60,000/año',
          expected_impact: '+40% features shipped',
        },
        {
          role: 'Customer Success Manager',
          when: 'Q2 2025',
          why: 'Mejorar retención y upselling',
          priority: 'medium',
          estimated_cost: '€45,000/año',
          expected_impact: '+15% NRR',
        },
      ],
      infrastructure_needs: [
        'Migración a arquitectura multi-región para latencia <100ms global',
        'Sistema de observabilidad completo (APM, logging, alerting)',
        'CDN global para assets estáticos',
        'Database replication para disaster recovery',
      ],
      timeline_to_scale: '12-18 meses para alcanzar 1,000 clientes con infraestructura y equipo adecuados',
    },
  },

  // ============================================
  // PROJECTIONS
  // ============================================
  projections: {
    next_month: {
      period: 'Julio 2024',
      revenue: 138500,
      expenses: 92400,
      net_profit: 46100,
      team_size: 11,
      customers: 252,
      confidence: 92,
    },
    next_quarter: {
      period: 'Q3 2024',
      revenue: 465000,
      expenses: 295000,
      net_profit: 170000,
      team_size: 13,
      customers: 310,
      confidence: 85,
    },
    next_year: {
      period: '2025',
      revenue: 2400000,
      expenses: 1680000,
      net_profit: 720000,
      team_size: 22,
      customers: 650,
      confidence: 70,
    },
    scenarios: [
      {
        name: 'Optimista',
        description: 'Expansión DACH exitosa + fundraising Series A',
        assumptions: ['Crecimiento 35% MoM', 'Serie A €3M', 'Entrada exitosa a Alemania'],
        projected_revenue: 3200000,
        projected_expenses: 2100000,
        projected_team_size: 30,
        projected_customers: 850,
        probability: 25,
        risk_factors: ['Ejecución perfecta requerida', 'Mercado favorable'],
      },
      {
        name: 'Realista',
        description: 'Crecimiento orgánico sostenido sin financiación externa',
        assumptions: ['Crecimiento 20% MoM', 'Sin fundraising', 'Foco en mercado actual'],
        projected_revenue: 2400000,
        projected_expenses: 1680000,
        projected_team_size: 22,
        projected_customers: 650,
        probability: 55,
        risk_factors: ['Competencia creciente', 'Posible recession'],
      },
      {
        name: 'Pesimista',
        description: 'Desaceleración del mercado + pérdida de cliente clave',
        assumptions: ['Crecimiento 8% MoM', 'Churn aumenta a 3%', 'Pérdida top cliente'],
        projected_revenue: 1600000,
        projected_expenses: 1400000,
        projected_team_size: 15,
        projected_customers: 420,
        probability: 20,
        risk_factors: ['Recession económica', 'Competidor agresivo'],
      },
    ],
    key_assumptions: [
      'Retention rate se mantiene en 94%+',
      'CAC no aumenta más del 10%',
      'Mercado español sigue creciendo 15% anual',
      'No hay disrupciones regulatorias significativas',
    ],
    risk_factors: [
      'Dependencia de 3 clientes que representan 35% de ingresos',
      'Entrada de competidor bien financiado',
      'Posible recession económica en Europa',
      'Cambios regulatorios en protección de datos',
    ],
    charts: {
      revenue_projection: [
        { month: 'Jul', proyectado: 138500, optimista: 145000, pesimista: 130000 },
        { month: 'Ago', proyectado: 152000, optimista: 165000, pesimista: 138000 },
        { month: 'Sep', proyectado: 168000, optimista: 185000, pesimista: 148000 },
        { month: 'Oct', proyectado: 185000, optimista: 210000, pesimista: 158000 },
        { month: 'Nov', proyectado: 204000, optimista: 240000, pesimista: 168000 },
        { month: 'Dic', proyectado: 225000, optimista: 275000, pesimista: 180000 },
      ],
      team_growth_projection: [
        { month: 'Jul', team: 11 },
        { month: 'Sep', team: 13 },
        { month: 'Dic', team: 16 },
        { month: 'Mar 25', team: 19 },
        { month: 'Jun 25', team: 22 },
      ],
      cash_runway_projection: [
        { month: 'Actual', balance: 638400 },
        { month: 'Q3', balance: 720000 },
        { month: 'Q4', balance: 850000 },
        { month: 'Q1 25', balance: 980000 },
        { month: 'Q2 25', balance: 1150000 },
      ],
      customer_projection: [
        { month: 'Jul', clientes: 252 },
        { month: 'Ago', clientes: 275 },
        { month: 'Sep', clientes: 310 },
        { month: 'Oct', clientes: 345 },
        { month: 'Nov', clientes: 385 },
        { month: 'Dic', clientes: 430 },
      ],
    },
  },

  // ============================================
  // CRITICAL ALERTS
  // ============================================
  critical_alerts: [
    {
      id: 'a1',
      severity: 'high',
      category: 'financial',
      title: 'Concentración de ingresos elevada',
      description: '35% de los ingresos provienen de los top 3 clientes. Pérdida de cualquiera impactaría significativamente.',
      impact: 'Riesgo de pérdida de €45K MRR si uno de los top 3 churns',
      recommended_action: 'Diversificar base de clientes y establecer relaciones ejecutivas más profundas con cuentas clave',
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      auto_resolve: false,
    },
    {
      id: 'a2',
      severity: 'medium',
      category: 'team',
      title: 'Riesgo de burnout en equipo de desarrollo',
      description: 'Carga de trabajo 1.3x capacidad sostenible durante 3 meses consecutivos',
      impact: 'Posible rotación de personal clave y reducción de calidad de código',
      recommended_action: 'Contratar DevOps Sr inmediatamente y redistribuir carga de trabajo',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      auto_resolve: false,
    },
    {
      id: 'a3',
      severity: 'medium',
      category: 'operations',
      title: 'Single point of failure en infraestructura',
      description: 'Dependencia crítica de un solo DevOps engineer para toda la infraestructura',
      impact: 'Riesgo operativo alto si esta persona no está disponible',
      recommended_action: 'Documentar procesos críticos y cross-train a otro miembro del equipo',
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      auto_resolve: false,
    },
  ],

  // ============================================
  // HONEST FEEDBACK
  // ============================================
  honest_feedback: {
    overall_assessment: 'Tu empresa está en una posición sólida con fundamentos fuertes, pero hay áreas críticas que requieren atención inmediata para no comprometer el crecimiento futuro. El producto tiene product-market fit claro (evidenciado por NPS de 72 y retention de 94%), pero la ejecución comercial y la escalabilidad técnica necesitan mejoras. Tienes aproximadamente 6-9 meses para resolver los cuellos de botella antes de que limiten seriamente el crecimiento.',
    what_is_working: [
      'Producto con claro product-market fit y alta satisfacción de usuarios',
      'Equipo core comprometido y de alta calidad',
      'Unit economics saludables (LTV:CAC de 4.2:1)',
      'Retention rate excepcional del 94%',
      'Cultura de equipo fuerte y valores claros',
    ],
    what_is_not_working: [
      'Ciclo de ventas demasiado largo (45 días vs benchmark de 30)',
      'Onboarding de nuevos usuarios con fricción excesiva (62% activation rate)',
      'Dependencia excesiva de founders para decisiones operativas',
      'Falta de procesos documentados que ralentiza onboarding de empleados',
      'Marketing de contenidos subutilizado como canal de adquisición',
    ],
    hard_truths: [
      'El CEO está involucrado en demasiadas decisiones tácticas - necesita delegar más',
      'El equipo de ventas no tiene las herramientas adecuadas y está operando de forma artesanal',
      'La deuda técnica acumulada empezará a impactar la velocidad de desarrollo en 6 meses',
      'Sin inversión en automatización, no podrán escalar más allá de 300 clientes',
    ],
    tough_decisions: [
      {
        decision: 'Subir precios un 20% para nuevos clientes',
        why_necessary: 'Los precios actuales no reflejan el valor entregado y limitan el margen para invertir en crecimiento',
        consequences_if_not_done: 'Márgenes ajustados que limitan capacidad de inversión en producto y equipo',
        consequences_if_done: 'Posible pérdida de 5-10% de leads más sensibles a precio, pero mejora significativa en márgenes',
        recommendation: 'Implementar en Q3 con grandfather clause para clientes actuales',
        difficulty: 'hard',
        estimated_timeline: '1 mes para implementar',
        success_probability: 85,
      },
      {
        decision: 'Despedir al underperformer del equipo de ventas',
        why_necessary: 'Performance 40% por debajo del resto del equipo durante 6 meses, afectando moral y resultados',
        consequences_if_not_done: 'Mensaje negativo al resto del equipo, pérdida de credibilidad del management',
        consequences_if_done: 'Corto plazo disruptivo, pero mejora la cultura de alta performance',
        recommendation: 'Tener conversación franca esta semana, dar 30 días de PIP, ejecutar si no mejora',
        difficulty: 'very_hard',
        estimated_timeline: '30-45 días',
        success_probability: 70,
      },
    ],
    competitive_position: {
      strengths: [
        'Tiempo de implementación más rápido del mercado',
        'Mejor soporte al cliente (respuesta <2h)',
        'Integraciones nativas con principales ERPs',
        'Precio competitivo en segmento mid-market',
      ],
      weaknesses: [
        'Menor reconocimiento de marca que competidores establecidos',
        'Funcionalidades enterprise menos desarrolladas',
        'Presencia geográfica limitada a España',
        'Menos recursos de marketing que competidores financiados',
      ],
      threats: [
        'Competidor con €50M de funding entrando al mercado español',
        'Grandes players (SAP, Salesforce) desarrollando soluciones similares',
        'Posible consolidación del mercado vía M&A',
      ],
      opportunities: [
        'Mercado DACH con competencia limitada y alto ARPU',
        'Partnerships con consultoras para canal indirecto',
        'Vertical de fintech poco explorado por competidores',
      ],
    },
    existential_risks: [
      'Pérdida de los top 3 clientes representaría 35% de revenue',
      'Salida de la CTO sin sucesor claro paralizaría desarrollo',
      'Cambio regulatorio en GDPR podría requerir pivote significativo',
    ],
    blind_spots: [
      'El equipo subestima la amenaza del nuevo competidor bien financiado',
      'Hay asunción implícita de que la retention se mantendrá alta sin inversión adicional en CS',
      'El producto tiene deuda de UX que los usuarios toleran pero reduce NPS potencial',
    ],
  },

  // ============================================
  // BENCHMARKING
  // ============================================
  benchmarking: {
    industry_avg: {
      revenue_growth: 15,
      profit_margin: 18,
      cac: 2300,
      ltv: 6800,
      churn_rate: 5,
      team_productivity: 75,
    },
    your_position: {
      revenue_growth: 23,
      profit_margin: 30,
      cac: 2000,
      ltv: 8400,
      churn_rate: 2,
      team_productivity: 87,
    },
    percentile_rank: 82,
    gaps: [
      {
        metric: 'Revenue Growth',
        gap: '+8%',
        improvement_needed: 'Mantener ritmo actual',
        priority: 'low',
      },
      {
        metric: 'CAC',
        gap: '-13%',
        improvement_needed: 'Optimizar canales para reducir a €1,800',
        priority: 'medium',
      },
      {
        metric: 'Team Productivity',
        gap: '+16%',
        improvement_needed: 'Documentar procesos para mantener ventaja',
        priority: 'low',
      },
    ],
    peer_comparison: 'Tu empresa está en el top 20% de la industria en la mayoría de métricas clave. Las áreas donde destacas especialmente son retention (top 5%) y márgenes (top 15%). El CAC es ligeramente superior al óptimo pero compensado por LTV alto.',
  },

  // ============================================
  // METADATA
  // ============================================
  confidence_score: 87,
  data_sources: [
    'Datos financieros de los últimos 6 meses',
    'Métricas de producto y uso',
    'Información de equipo y tareas',
    'Datos de CRM y pipeline',
    'Benchmarks de industria SaaS B2B',
  ],
  data_quality_score: 91,
  next_analysis_recommended: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  version: '3.0',
};

// Market study data for the Market Study section
export const DEMO_MARKET_STUDY = {
  country_data: {
    country_name: 'España',
    country_code: 'ES',
    currency: 'EUR',
    vat_rate: 21,
    corporate_tax_rate: 25,
    population: 47420000,
    gdp_per_capita: 29600,
    internet_penetration: 93,
    ecommerce_penetration: 71,
    median_age: 44.9,
    unemployment_rate: 11.7,
    top_social_platforms: ['WhatsApp', 'Instagram', 'Facebook', 'TikTok', 'Twitter'],
    top_ecommerce_platforms: ['Amazon', 'El Corte Inglés', 'Zalando', 'AliExpress', 'PCComponentes'],
    data_privacy_law: 'GDPR + LOPDGDD',
  },
  market_analysis: {
    market_size: '€2.4B',
    market_growth_rate: '18% CAGR',
    competition_level: 'Medio-Alto',
    entry_barriers: [
      'Inversión inicial en tecnología significativa',
      'Necesidad de certificaciones de seguridad',
      'Relaciones establecidas con clientes enterprise',
      'Conocimiento especializado del sector',
    ],
    key_trends: [
      'Adopción acelerada de soluciones cloud post-COVID',
      'Mayor demanda de automatización e IA',
      'Consolidación del mercado vía M&A',
      'Foco creciente en compliance y seguridad',
      'Shift hacia modelos de pricing basados en uso',
    ],
    opportunities: [
      'Mercado mid-market desatendido por grandes players',
      'Demanda creciente de integraciones con ecosistema local',
      'Expansión a Latinoamérica con producto localizado',
      'Verticales específicos con poca competencia',
    ],
    threats: [
      'Entrada de competidores internacionales bien financiados',
      'Grandes players desarrollando soluciones similares',
      'Posible recession que afecte presupuestos IT',
      'Talento tech escaso y caro en España',
    ],
  },
  competitive_analysis: {
    positioning: 'Líder en segmento mid-market español con mejor relación calidad-precio',
    threats: [
      'CompetitorX acaba de levantar €50M y está entrando a España',
      'SAP está desarrollando módulo que competirá directamente',
    ],
    opportunities: [
      'Ningún competidor tiene integración nativa con ERPs españoles',
      'Somos los únicos con soporte en español 24/7',
    ],
    differentiation: [
      'Implementación más rápida del mercado (2 semanas vs 2 meses)',
      'Mejor soporte al cliente (NPS 72 vs industria 45)',
      'Único con integraciones nativas a SAP, Sage, A3',
    ],
  },
  competitors: [
    {
      name: 'CompetidorX',
      description: 'Startup bien financiada enfocada en enterprise',
      strengths: ['€50M funding', 'Equipo senior', 'Producto maduro'],
      weaknesses: ['Nuevo en España', 'Precios altos', 'Soporte en inglés'],
      market_position: 'Enterprise high-ticket',
    },
    {
      name: 'LegacyCorp',
      description: 'Player establecido con base de clientes legacy',
      strengths: ['Base instalada grande', 'Reconocimiento de marca', 'Relaciones enterprise'],
      weaknesses: ['Tecnología anticuada', 'UX pobre', 'Implementación lenta'],
      market_position: 'Legacy enterprise',
    },
    {
      name: 'StartupY',
      description: 'Competidor directo en segmento mid-market',
      strengths: ['Producto ágil', 'Buen marketing', 'Precios competitivos'],
      weaknesses: ['Equipo pequeño', 'Menos integraciones', 'Soporte limitado'],
      market_position: 'Mid-market challenger',
    },
  ],
};
