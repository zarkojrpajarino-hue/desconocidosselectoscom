/**
 * Demo data for Herramientas section tools
 * Professional demo data that shows what AI-generated content would look like
 */

// ============================================================================
// LEAD SCORING DEMO DATA
// ============================================================================
export const DEMO_LEAD_SCORING = {
  scoring_ranges: [
    { grade: 'A', label: 'Hot Lead - Contactar inmediatamente', min: 80, max: 100 },
    { grade: 'B', label: 'Warm Lead - Alta prioridad de seguimiento', min: 60, max: 79 },
    { grade: 'C', label: 'Cold Lead - Nutrir con contenido', min: 0, max: 59 }
  ],
  criteria: [
    {
      category: '📊 Datos Demográficos',
      factors: [
        { name: 'Tamaño de empresa (>50 empleados)', points: 15, description: 'Empresas medianas o grandes tienen mayor presupuesto y necesidad' },
        { name: 'Cargo de decisión (C-Level/Director)', points: 20, description: 'Tomadores de decisión aceleran el ciclo de venta' },
        { name: 'Industria objetivo', points: 10, description: 'Sectores donde tenemos mayor experiencia y casos de éxito' },
        { name: 'Ubicación geográfica estratégica', points: 5, description: 'Mercados prioritarios para expansión' }
      ]
    },
    {
      category: '🎯 Comportamiento Digital',
      factors: [
        { name: 'Visitó página de precios', points: 15, description: 'Indica intención de compra activa' },
        { name: 'Descargó recurso premium', points: 10, description: 'Muestra interés en contenido de valor' },
        { name: 'Abrió >3 emails en último mes', points: 8, description: 'Engagement activo con comunicaciones' },
        { name: 'Solicitó demo', points: 25, description: 'Señal más fuerte de intención de compra' }
      ]
    },
    {
      category: '💬 Engagement de Ventas',
      factors: [
        { name: 'Respondió a contacto de ventas', points: 12, description: 'Disposición a conversar activamente' },
        { name: 'Agendó reunión', points: 18, description: 'Compromiso de tiempo indica seriedad' },
        { name: 'Compartió timeline de compra', points: 15, description: 'Transparencia sobre proceso de decisión' },
        { name: 'Mencionó presupuesto disponible', points: 20, description: 'Confirmación de capacidad de inversión' }
      ]
    },
    {
      category: '⚠️ Factores Negativos',
      factors: [
        { name: 'Sin respuesta en 30+ días', points: -15, description: 'Posible pérdida de interés o cambio de prioridades' },
        { name: 'Competidor ya implementado', points: -10, description: 'Mayor barrera de switching cost' },
        { name: 'Presupuesto congelado', points: -20, description: 'Imposibilidad de compra a corto plazo' }
      ]
    }
  ]
};

// ============================================================================
// GROWTH MODEL DEMO DATA (AARRR Pirate Metrics)
// ============================================================================
export const DEMO_GROWTH_MODEL = {
  metrics: [
    {
      stage: 'Acquisition',
      kpis: [
        'CAC (Costo de Adquisición de Cliente): €45-65 por lead cualificado',
        'Tasa de conversión landing: 12-18%',
        'Volumen de tráfico orgánico mensual: objetivo +25% trimestral',
        'CPL (Costo por Lead) por canal'
      ],
      channels: ['SEO', 'Google Ads', 'LinkedIn Ads', 'Content Marketing', 'Partnerships', 'Webinars'],
      tactics: [
        'Optimización SEO con keywords long-tail de intención de compra',
        'Campañas de retargeting a visitantes de página de precios',
        'Lead magnets específicos por industria',
        'Guest posting en blogs de la industria'
      ]
    },
    {
      stage: 'Activation',
      kpis: [
        'Time to First Value: <5 minutos desde registro',
        'Tasa de completación de onboarding: >70%',
        'Feature adoption rate primera semana: >3 features',
        'Usuarios que completan perfil: >85%'
      ],
      channels: ['Email onboarding', 'In-app tutorials', 'Webinars educativos', 'Soporte proactivo'],
      tactics: [
        'Onboarding gamificado con checklist visual',
        'Email drip sequence de 7 días con tips personalizados',
        'Tooltips contextuales en primeras sesiones',
        'Llamada de bienvenida para cuentas enterprise'
      ]
    },
    {
      stage: 'Retention',
      kpis: [
        'Churn mensual: <5%',
        'DAU/MAU ratio: >25%',
        'NPS Score: >50',
        'Feature stickiness: usuarios usando features avanzadas'
      ],
      channels: ['Email engagement', 'Notificaciones push', 'Comunidad', 'Customer Success'],
      tactics: [
        'Health score predictivo con alertas de churn',
        'Programa de customer success con QBRs',
        'Contenido educativo semanal',
        'Gamificación con badges y logros'
      ]
    },
    {
      stage: 'Revenue',
      kpis: [
        'ARPU (Average Revenue Per User): €89/mes',
        'LTV:CAC ratio: >3:1',
        'Expansion revenue: >15% de revenue total',
        'Upgrade rate mensual: >8%'
      ],
      channels: ['Upsell in-app', 'Sales outreach', 'Self-service upgrade', 'Account management'],
      tactics: [
        'Feature gates estratégicos con upgrade prompts',
        'Pricing por valor con múltiples tiers',
        'Ofertas de upgrade personalizadas por comportamiento',
        'Annual billing con descuento significativo'
      ]
    },
    {
      stage: 'Referral',
      kpis: [
        'Viral coefficient: >0.5',
        'Referral rate: >15% de usuarios activos refieren',
        'Net Promoter Score: >50',
        'Revenue from referrals: >20%'
      ],
      channels: ['Programa de referidos', 'Reviews públicos', 'Cases studies', 'Social sharing'],
      tactics: [
        'Programa de referidos con incentivos bilaterales',
        'Facilitar compartir logros en redes sociales',
        'Solicitar reviews después de momentos de éxito',
        'Case studies con clientes satisfechos'
      ]
    }
  ]
};

// ============================================================================
// BUYER PERSONA DEMO DATA
// ============================================================================
export const DEMO_BUYER_PERSONA = {
  name: 'María González',
  age: 38,
  occupation: 'Directora de Marketing Digital',
  location: 'Madrid, España',
  country_code: 'ES',
  income_range: '55.000€ - 75.000€/año',
  quote: 'Necesito herramientas que me ayuden a demostrar ROI a dirección y que mi equipo pueda usar sin formación extensa.',
  demographics: {
    education: 'MBA en Marketing Digital',
    family_status: 'Casada, 2 hijos',
    housing: 'Piso propio en zona residencial'
  },
  goals: [
    'Demostrar el ROI de las iniciativas de marketing a la dirección',
    'Optimizar el tiempo del equipo en tareas operativas',
    'Mejorar la calidad de los leads que pasan a ventas',
    'Implementar estrategias de marketing automation efectivas',
    'Mantenerse actualizada en tendencias del sector'
  ],
  pain_points: [
    'Demasiadas herramientas fragmentadas que no se integran bien',
    'Dificultad para medir el impacto real de cada canal',
    'Presión constante por resultados a corto plazo',
    'Falta de tiempo para formarse en nuevas tecnologías',
    'Equipo pequeño para la cantidad de proyectos'
  ],
  psychographics: {
    values: ['Eficiencia', 'Innovación pragmática', 'Equilibrio vida-trabajo', 'Desarrollo profesional'],
    interests: ['Podcasts de marketing', 'Conferencias del sector', 'Networking profesional', 'Yoga'],
    lifestyle: 'Profesional ambiciosa que valora la eficiencia. Trabaja smart, no hard. Busca soluciones que le ahorren tiempo para poder dedicarlo a estrategia y familia.'
  },
  preferred_channels: ['LinkedIn', 'Email newsletters', 'Webinars', 'Podcasts', 'Grupos de Slack profesionales'],
  buying_behavior: {
    decision_factors: ['ROI demostrable', 'Facilidad de uso', 'Integración con stack actual', 'Soporte en español', 'Casos de éxito similares'],
    buying_frequency: 'Evalúa herramientas trimestralmente, renueva anualmente',
    price_sensitivity: 'Media - dispuesta a pagar premium por valor claro',
    preferred_payment_methods: ['Tarjeta corporativa', 'Facturación anual', 'Wire transfer']
  }
};

// ============================================================================
// CUSTOMER JOURNEY DEMO DATA
// ============================================================================
export const DEMO_CUSTOMER_JOURNEY = {
  stages: [
    {
      name: 'Awareness',
      description: 'El cliente descubre que tiene un problema y empieza a buscar soluciones',
      touchpoints: ['Búsqueda en Google', 'LinkedIn posts', 'Recomendaciones de colegas', 'Artículos de blog', 'Webinars educativos'],
      emotions: ['Frustración con situación actual', 'Curiosidad', 'Esperanza de mejora', 'Algo de escepticismo'],
      opportunities: [
        'Contenido SEO optimizado para keywords de problema',
        'Lead magnets que diagnostican el problema',
        'Presencia activa en comunidades profesionales',
        'Testimonios de clientes en situación similar inicial'
      ]
    },
    {
      name: 'Consideration',
      description: 'El cliente evalúa activamente opciones y compara alternativas',
      touchpoints: ['Página de producto', 'Comparativas online', 'Demo gratuita', 'Consulta con sales', 'Reviews en G2/Capterra'],
      emotions: ['Análisis crítico', 'Confusión por muchas opciones', 'Expectativa', 'Ansiedad por tomar decisión correcta'],
      opportunities: [
        'Páginas de comparativa vs competidores',
        'Calculadora de ROI interactiva',
        'Demo personalizada con caso de uso específico',
        'Case studies detallados por industria',
        'Trial gratuito con soporte dedicado'
      ]
    },
    {
      name: 'Decision',
      description: 'El cliente está listo para comprar pero necesita validación final',
      touchpoints: ['Propuesta comercial', 'Llamada con legal/compras', 'Negociación de términos', 'Revisión de contrato'],
      emotions: ['Nerviosismo por compromiso', 'Necesidad de justificar internamente', 'Urgencia por empezar', 'Expectativa alta'],
      opportunities: [
        'Propuesta clara con ROI proyectado',
        'Facilitar comunicación con stakeholders internos',
        'Términos flexibles para reducir riesgo percibido',
        'Onboarding acelerado como incentivo',
        'Garantía de satisfacción o devolución'
      ]
    },
    {
      name: 'Retention',
      description: 'El cliente ya es usuario y necesita obtener valor continuamente',
      touchpoints: ['Plataforma diaria', 'Soporte técnico', 'Account manager', 'Webinars avanzados', 'Comunidad de usuarios'],
      emotions: ['Satisfacción por resultados', 'Ocasional frustración técnica', 'Sentido de pertenencia', 'Ambición de dominar la herramienta'],
      opportunities: [
        'Onboarding estructurado con quick wins',
        'Check-ins proactivos de customer success',
        'Contenido educativo continuo',
        'Reconocimiento de logros y progreso',
        'Acceso anticipado a nuevas features'
      ]
    },
    {
      name: 'Advocacy',
      description: 'El cliente se convierte en promotor activo de la marca',
      touchpoints: ['Programa de referidos', 'Reviews públicos', 'Participación en casos de estudio', 'Eventos de comunidad'],
      emotions: ['Orgullo de la decisión tomada', 'Deseo de ayudar a otros', 'Sentido de comunidad', 'Lealtad a la marca'],
      opportunities: [
        'Programa de referidos con beneficios bidireccionales',
        'Invitación a advisory board de clientes',
        'Co-creación de contenido y casos de éxito',
        'Eventos exclusivos para power users',
        'Acceso beta a nuevos productos'
      ]
    }
  ]
};

// ============================================================================
// BRAND KIT DEMO DATA
// ============================================================================
export const DEMO_BRAND_KIT = {
  primary_color: '#2563EB',
  secondary_color: '#7C3AED',
  accent_color: '#F59E0B',
  neutral_light: '#F8FAFC',
  neutral_dark: '#1E293B',
  font_heading: 'Plus Jakarta Sans',
  font_body: 'Inter',
  tone_of_voice: 'Profesional Cercano',
  tone_description: 'Comunicamos con autoridad y conocimiento, pero siempre de forma accesible y humana. Evitamos jerga innecesaria y hablamos como un colega experto que genuinamente quiere ayudar.',
  brand_personality: {
    traits: ['Innovador', 'Confiable', 'Accesible', 'Experto', 'Empático'],
    voice_examples: {
      do: [
        'Te explicamos paso a paso cómo sacar el máximo partido',
        '¿Necesitas ayuda? Estamos aquí para ti',
        'Basándonos en los datos de tu negocio...'
      ],
      dont: [
        'Nuestra solución best-in-class leveragea sinergias...',
        'Ud. debe proceder según las instrucciones indicadas',
        'Obvio que esto es lo que necesitas'
      ]
    }
  },
  usage_guidelines: {
    logo: 'Mantener área de respeto del 20% alrededor del logo. No distorsionar proporciones.',
    colors: 'Usar color primario para CTAs principales. Secundario para elementos de apoyo. Acento solo para highlights importantes.',
    typography: 'Headings en Plus Jakarta Sans Bold. Body text en Inter Regular. Mínimo 16px para cuerpo en web.'
  }
};
