/**
 * Demo data for Practicar section tools
 * Used when demo mode is enabled or when no generated content exists
 */

// ============================================================================
// SIMULADOR DEMO DATA
// ============================================================================
export const DEMO_SIMULADOR = {
  quick_tips: [
    { category: "Apertura", tip: "Siempre comienza con una pregunta abierta para entender las necesidades del cliente" },
    { category: "Escucha", tip: "Escucha más de lo que hablas. La proporción ideal es 70-30" },
    { category: "Objeciones", tip: "Las objeciones son oportunidades para profundizar y demostrar valor" },
    { category: "Cierre", tip: "No tengas miedo de pedir el cierre cuando detectes señales de compra" },
    { category: "Seguimiento", tip: "El 80% de las ventas se cierran después del 5º contacto" },
    { category: "Valor", tip: "Enfócate en el valor y ROI, no en el precio" }
  ],
  scenarios: [
    {
      title: "El Director Escéptico",
      difficulty: "Difícil",
      client_profile: {
        name: "Carlos Mendoza",
        role: "Director de Operaciones",
        company_type: "Empresa Industrial",
        personality: "Analítico y Cauteloso",
        budget_level: "Alto"
      },
      conversation_flow: [
        {
          stage: "Apertura",
          client_says: "Mira, seré directo contigo. Ya hemos probado 3 soluciones similares y ninguna ha funcionado. ¿Por qué la tuya sería diferente?",
          options: [
            {
              response: "Entiendo su frustración. ¿Podría contarme qué aspectos específicos fallaron en esas implementaciones?",
              score: 10,
              feedback: "Excelente. Demuestras empatía y buscas información valiosa antes de presentar tu solución."
            },
            {
              response: "Nuestra solución es la mejor del mercado, tenemos muchos clientes satisfechos.",
              score: 2,
              feedback: "Demasiado genérico y defensivo. No abordas sus experiencias previas."
            },
            {
              response: "Déjeme mostrarle una demo de nuestro producto y verá las diferencias.",
              score: 5,
              feedback: "Precipitado. Sin entender sus problemas previos, podrías repetir los mismos errores."
            }
          ]
        },
        {
          stage: "Descubrimiento",
          client_says: "El problema principal fue la integración. Prometieron que sería fácil pero tardamos 6 meses y aún así teníamos errores constantemente.",
          options: [
            {
              response: "Eso suena muy frustrante. ¿Con qué sistemas necesitan integrar actualmente y cuáles son los procesos críticos afectados?",
              score: 10,
              feedback: "Perfecto. Profundizas en el problema específico y muestras interés genuino."
            },
            {
              response: "Nosotros tenemos un equipo de integración dedicado que evita esos problemas.",
              score: 4,
              feedback: "Muy pronto para vender. El cliente aún no ha terminado de explicar su situación."
            },
            {
              response: "Entiendo. ¿Qué presupuesto tienen asignado para esta iniciativa?",
              score: 1,
              feedback: "Cambiar abruptamente a presupuesto cuando está compartiendo un problema frustrante es inapropiado."
            }
          ]
        },
        {
          stage: "Presentación de Valor",
          client_says: "Usamos SAP para ERP y Salesforce para CRM. Los datos nunca se sincronizan bien.",
          options: [
            {
              response: "Tenemos conectores nativos certificados tanto para SAP como Salesforce. Pero más importante, ¿podría explicarme qué datos específicos necesitan fluir entre sistemas y con qué frecuencia?",
              score: 10,
              feedback: "Excelente balance. Mencionas capacidad técnica pero sigues profundizando en requisitos."
            },
            {
              response: "Perfecto, trabajamos con muchas empresas que usan SAP y Salesforce. No tendrá problemas.",
              score: 4,
              feedback: "Demasiado optimista sin entender los detalles. Puede parecer que no tomas en serio sus preocupaciones."
            },
            {
              response: "Nuestro producto se integra con más de 200 aplicaciones diferentes.",
              score: 3,
              feedback: "Irrelevante. El cliente mencionó dos sistemas específicos, responde a eso."
            }
          ]
        },
        {
          stage: "Manejo de Objeción",
          client_says: "Todo suena bien, pero honestamente, estoy quemado con este tema. No quiero ser yo quien proponga otra solución que falle.",
          options: [
            {
              response: "Es completamente comprensible. ¿Qué necesitaría ver o experimentar para sentirse cómodo presentando esta opción internamente? Podemos estructurar un piloto con métricas claras de éxito.",
              score: 10,
              feedback: "Brillante. Reconoces su riesgo personal y ofreces una forma de mitigarlo."
            },
            {
              response: "No se preocupe, nuestra solución realmente funciona. Tengo casos de éxito que puedo compartirle.",
              score: 3,
              feedback: "No abordas su miedo personal al fracaso. Los casos de éxito no resuelven su riesgo percibido."
            },
            {
              response: "Entiendo. Tal vez deberíamos esperar a que esté más convencido.",
              score: 1,
              feedback: "Pierdes la oportunidad. El cliente expresó una objeción válida que puedes resolver."
            }
          ]
        },
        {
          stage: "Cierre",
          client_says: "Un piloto suena razonable. ¿Cómo funcionaría?",
          options: [
            {
              response: "Propondría un piloto de 30 días enfocado en la integración SAP-Salesforce que mencionó. Definimos 3 KPIs medibles, y si los alcanzamos, avanzamos. Si no, no hay compromiso. ¿Le parece razonable empezar la próxima semana?",
              score: 10,
              feedback: "Cierre perfecto. Específico, con métricas claras, bajo riesgo, y pides acción concreta."
            },
            {
              response: "Le envío una propuesta con las opciones de piloto y me dice qué le parece.",
              score: 5,
              feedback: "Pierdes momentum. Cuando el cliente está listo, hay que cerrar."
            },
            {
              response: "Podemos hacer un piloto de 90 días para asegurarnos de cubrir todo.",
              score: 4,
              feedback: "Demasiado largo. Un piloto efectivo debe ser corto y enfocado."
            }
          ]
        }
      ],
      ideal_outcome: "Conseguir un compromiso para un piloto de 30 días con KPIs claros y fecha de inicio definida.",
      learning_points: [
        "Siempre valida las experiencias pasadas del cliente antes de presentar tu solución",
        "Las objeciones emocionales (miedo al fracaso) requieren soluciones estructuradas (pilotos con métricas)",
        "Un buen descubrimiento te permite personalizar tu propuesta de valor",
        "Los cierres efectivos son específicos en alcance, tiempo y próximos pasos"
      ]
    },
    {
      title: "La Startup Entusiasta",
      difficulty: "Medio",
      client_profile: {
        name: "Ana García",
        role: "CEO & Fundadora",
        company_type: "Startup Serie A",
        personality: "Visionaria y Urgente",
        budget_level: "Medio"
      },
      conversation_flow: [
        {
          stage: "Apertura",
          client_says: "¡Hola! Vi tu demo en LinkedIn y me encantó. Acabamos de cerrar nuestra Serie A y necesitamos escalar rápido. ¿Cuánto cuesta?",
          options: [
            {
              response: "¡Felicidades por la ronda! Antes de hablar de precios, cuéntame: ¿qué problema específico necesitan resolver para escalar?",
              score: 10,
              feedback: "Excelente. Redirigir hacia el descubrimiento te permitirá posicionar mejor el valor."
            },
            {
              response: "Tenemos planes desde 500€/mes. ¿Quieres que te envíe la lista de precios?",
              score: 3,
              feedback: "Sin descubrimiento, el precio se convierte en el único criterio de decisión."
            },
            {
              response: "Depende de muchos factores. ¿Cuál es su presupuesto?",
              score: 5,
              feedback: "Preguntar presupuesto sin contexto puede parecer demasiado transaccional."
            }
          ]
        },
        {
          stage: "Descubrimiento",
          client_says: "Tenemos 15 comerciales nuevos que empiezan el mes que viene. Necesitamos tenerlos productivos en 2 semanas, no en 2 meses como antes.",
          options: [
            {
              response: "Interesante desafío. ¿Qué métrica defines como 'productivo'? ¿Y qué herramientas o procesos usan actualmente para onboarding?",
              score: 10,
              feedback: "Cuantificar 'productivo' te permite demostrar ROI concreto después."
            },
            {
              response: "Nuestro producto puede reducir el tiempo de onboarding a la mitad fácilmente.",
              score: 4,
              feedback: "Promesa vaga sin entender su situación actual. Podrías quedarte corto o pasarte."
            },
            {
              response: "¿Por qué tardaban 2 meses antes?",
              score: 7,
              feedback: "Buena pregunta pero podrías parecer crítico. Mejor enfocarse en el futuro deseado."
            }
          ]
        },
        {
          stage: "Presentación de Valor",
          client_says: "Productivo significa que cierren al menos 2 deals en su primer mes. Ahora les toma 3 meses llegar a ese punto.",
          options: [
            {
              response: "Perfecto, eso es muy específico. Con nuestra plataforma de enablement, clientes similares han reducido ese tiempo a 4-6 semanas. ¿Te gustaría ver cómo lo lograron?",
              score: 10,
              feedback: "Conectas su métrica específica con resultados reales de clientes similares."
            },
            {
              response: "Con nosotros definitivamente lo van a lograr en 2 semanas.",
              score: 2,
              feedback: "Promesa exagerada que puede generar expectativas irreales."
            },
            {
              response: "Tenemos muchas funcionalidades que ayudan con onboarding: videos, quizzes, playbooks...",
              score: 5,
              feedback: "Features sin conexión a resultados. El cliente quiere outcomes, no funcionalidades."
            }
          ]
        },
        {
          stage: "Manejo de Objeción",
          client_says: "Me gusta, pero 4-6 semanas sigue siendo largo. Los inversores nos presionan por resultados ya.",
          options: [
            {
              response: "Entiendo la presión. ¿Qué tal si priorizamos los 3 comerciales más experimentados para las primeras 2 semanas y usamos sus resultados para optimizar el onboarding del resto?",
              score: 10,
              feedback: "Solución creativa que balancea urgencia con realismo."
            },
            {
              response: "Es el tiempo mínimo realista. Ir más rápido podría comprometer la calidad.",
              score: 6,
              feedback: "Honesto pero no colaborativo. No ofreces alternativas."
            },
            {
              response: "Podemos intentar hacerlo en 2 semanas, pero necesitaríamos recursos adicionales de su parte.",
              score: 4,
              feedback: "Prometes algo que puede no ser alcanzable y pones condiciones vagas."
            }
          ]
        },
        {
          stage: "Cierre",
          client_says: "Me gusta el enfoque por fases. ¿Cómo empezamos?",
          options: [
            {
              response: "Podemos comenzar la próxima semana. Necesitaría acceso a 3 de tus top performers para la primera fase y una llamada de 1 hora con tu Head of Sales para alinear el playbook. ¿Funciona el martes?",
              score: 10,
              feedback: "Cierre específico con próximos pasos claros y fecha concreta."
            },
            {
              response: "Te envío el contrato y cuando esté firmado coordinamos el kickoff.",
              score: 5,
              feedback: "Demasiado formal y lento para una startup con urgencia."
            },
            {
              response: "¿Quieres que agende una demo con tu equipo primero?",
              score: 3,
              feedback: "Retrocedes en el proceso. El cliente ya vio el valor."
            }
          ]
        }
      ],
      ideal_outcome: "Cerrar un acuerdo de implementación rápida comenzando con un grupo piloto de top performers.",
      learning_points: [
        "Startups valoran velocidad y resultados tangibles sobre funcionalidades",
        "Siempre cuantifica la definición de éxito del cliente",
        "Ante objeciones de tiempo, ofrece soluciones creativas en fases",
        "Con clientes urgentes, cierra con pasos concretos y fechas específicas"
      ]
    },
    {
      title: "El Comprador de Precio",
      difficulty: "Fácil",
      client_profile: {
        name: "Pedro Ruiz",
        role: "Gerente de Compras",
        company_type: "PYME Tradicional",
        personality: "Pragmático y Directo",
        budget_level: "Limitado"
      },
      conversation_flow: [
        {
          stage: "Apertura",
          client_says: "Vamos al grano. Tengo 3 cotizaciones sobre la mesa. ¿Cuál es tu mejor precio?",
          options: [
            {
              response: "Perfecto, me gusta la transparencia. Para darte el precio más competitivo, necesito entender qué incluyen las otras cotizaciones. ¿Qué criterios son más importantes para ustedes?",
              score: 10,
              feedback: "Inteligente. Obtienes información competitiva mientras muestras que puedes ser flexible."
            },
            {
              response: "Nuestro precio es X. Podemos ofrecer un 10% de descuento si cierras hoy.",
              score: 4,
              feedback: "Dar descuento inmediato sin conocer la competencia debilita tu posición."
            },
            {
              response: "No competimos en precio, competimos en valor.",
              score: 2,
              feedback: "Suena arrogante y no responde a su estilo directo."
            }
          ]
        },
        {
          stage: "Descubrimiento",
          client_says: "Necesito básicamente lo mismo que ofrecen todos: software de gestión, soporte, y que funcione. El más barato gana.",
          options: [
            {
              response: "Entiendo. ¿Han tenido alguna mala experiencia con proveedores baratos antes? Pregunto porque a veces lo barato sale caro en soporte o problemas técnicos.",
              score: 10,
              feedback: "Introduces el concepto de costo total de propiedad de forma sutil."
            },
            {
              response: "Si solo buscas precio, probablemente no seamos la mejor opción.",
              score: 3,
              feedback: "Demasiado negativo. Descartas la oportunidad prematuramente."
            },
            {
              response: "¿Qué funcionalidades específicas necesitan?",
              score: 6,
              feedback: "Buena pregunta pero no aborda su fijación en el precio."
            }
          ]
        },
        {
          stage: "Presentación de Valor",
          client_says: "Bueno, el año pasado compramos un software barato y tuvimos 3 semanas de caída. Fue un desastre.",
          options: [
            {
              response: "Eso debió costar mucho más que la diferencia de precio. ¿Cuánto estimarías que perdieron en esas 3 semanas? Nosotros garantizamos 99.9% de uptime con SLA y compensación si fallamos.",
              score: 10,
              feedback: "Conviertes su experiencia negativa en un criterio de decisión más allá del precio."
            },
            {
              response: "Por eso somos más caros. La calidad cuesta.",
              score: 4,
              feedback: "Verdad pero suena condescendiente."
            },
            {
              response: "Nosotros nunca hemos tenido caídas así.",
              score: 5,
              feedback: "Afirmación sin prueba. El SLA es más convincente."
            }
          ]
        },
        {
          stage: "Manejo de Objeción",
          client_says: "Tu punto es válido, pero sigo necesitando el mejor precio posible. ¿Qué puedes hacer?",
          options: [
            {
              response: "Puedo ofrecer el mismo precio que tu cotización más baja si nos das un contrato de 2 años en lugar de 1. Así ambos ganamos: tú tienes el mejor precio y nosotros seguridad de largo plazo.",
              score: 10,
              feedback: "Win-win. Ofreces descuento a cambio de algo de valor para ti."
            },
            {
              response: "Puedo bajar un 15% si cierras esta semana.",
              score: 5,
              feedback: "Funciona pero sin obtener nada a cambio debilita tu posición."
            },
            {
              response: "El precio es el precio. No podemos bajarlo más.",
              score: 2,
              feedback: "Inflexible y termina la negociación sin explorar opciones."
            }
          ]
        },
        {
          stage: "Cierre",
          client_says: "2 años es mucho compromiso. ¿Y si no funciona?",
          options: [
            {
              response: "Te propongo esto: 2 años de contrato con cláusula de salida sin penalización después de los primeros 6 meses si no cumplimos los KPIs acordados. ¿Cerramos?",
              score: 10,
              feedback: "Reduces su riesgo mientras mantienes el beneficio del contrato largo."
            },
            {
              response: "Podemos hacer 1 año entonces, pero sin el descuento.",
              score: 6,
              feedback: "Retrocedes a la posición inicial sin buscar alternativas."
            },
            {
              response: "Va a funcionar, no te preocupes.",
              score: 2,
              feedback: "No aborda su preocupación legítima sobre el compromiso largo."
            }
          ]
        }
      ],
      ideal_outcome: "Cerrar un contrato de 2 años con precio competitivo y cláusula de salida que protege al cliente.",
      learning_points: [
        "Los compradores de precio pueden ser educados sobre costo total de propiedad",
        "Usa sus experiencias negativas pasadas para justificar el valor",
        "Ofrece descuentos a cambio de algo, no gratis",
        "Las garantías y cláusulas de salida reducen el riesgo percibido"
      ]
    }
  ]
};

// ============================================================================
// PLAYBOOK DEMO DATA
// ============================================================================
export const DEMO_PLAYBOOK = {
  methodology: {
    name: "Consultative Selling + MEDDIC",
    description: "Combinamos venta consultiva enfocada en resolver problemas reales del cliente con el framework MEDDIC para calificar oportunidades de manera rigurosa. Este enfoque híbrido asegura que invertimos tiempo en oportunidades reales mientras construimos relaciones de confianza.",
    key_principles: [
      "El cliente es el experto en su negocio, nosotros en la solución",
      "Nunca presentar sin descubrir primero",
      "Calificar continuamente, no solo al inicio",
      "El 'no' temprano es mejor que el 'no' tardío"
    ]
  },
  sales_process: [
    {
      stage: "Prospección",
      objective: "Identificar y contactar empresas que encajen con nuestro perfil de cliente ideal (ICP)",
      average_duration: "1-2 semanas",
      activities: [
        "Investigar empresas en LinkedIn Sales Navigator",
        "Identificar eventos desencadenantes (funding, contrataciones, expansión)",
        "Personalizar mensaje de outreach con insight específico",
        "Seguimiento multi-canal (email, LinkedIn, teléfono)"
      ],
      tools: ["Sales Navigator", "Apollo.io", "Lavender", "Vidyard"],
      exit_criteria: "Reunión de descubrimiento agendada con decisor",
      conversion_rate_target: "3-5%"
    },
    {
      stage: "Descubrimiento",
      objective: "Entender profundamente los problemas, impacto y urgencia del cliente potencial",
      average_duration: "1-2 llamadas (30-45 min cada una)",
      activities: [
        "Mapear situación actual vs. situación deseada",
        "Cuantificar el costo del problema",
        "Identificar todos los stakeholders involucrados",
        "Entender proceso de decisión y timeline"
      ],
      tools: ["Gong", "Notion", "Miro"],
      exit_criteria: "Problema cuantificado y stakeholders mapeados",
      conversion_rate_target: "40-50%"
    },
    {
      stage: "Calificación",
      objective: "Determinar si la oportunidad es real y merece recursos adicionales",
      average_duration: "Durante descubrimiento",
      activities: [
        "Aplicar framework MEDDIC completo",
        "Validar presupuesto asignado o asignable",
        "Confirmar autoridad del contacto principal",
        "Identificar champion interno"
      ],
      tools: ["Salesforce", "Checklist MEDDIC"],
      exit_criteria: "Score MEDDIC ≥ 70%",
      conversion_rate_target: "60-70%"
    },
    {
      stage: "Demo/Propuesta",
      objective: "Demostrar cómo nuestra solución resuelve sus problemas específicos",
      average_duration: "45-60 min demo + 1 semana propuesta",
      activities: [
        "Demo personalizada a sus casos de uso",
        "Involucrar a usuarios finales en demo",
        "Crear propuesta con ROI calculado",
        "Abordar objeciones técnicas y comerciales"
      ],
      tools: ["Demo Environment", "Google Slides", "Pandadoc"],
      exit_criteria: "Propuesta aceptada en principio, negociación final",
      conversion_rate_target: "50-60%"
    },
    {
      stage: "Negociación",
      objective: "Acordar términos comerciales y legales que funcionen para ambas partes",
      average_duration: "1-3 semanas",
      activities: [
        "Revisar términos con legal del cliente",
        "Manejar objeciones de último minuto",
        "Crear urgencia sin presionar",
        "Coordinar firma con todas las partes"
      ],
      tools: ["DocuSign", "Redline en Word", "Legal Team"],
      exit_criteria: "Contrato firmado",
      conversion_rate_target: "70-80%"
    },
    {
      stage: "Onboarding",
      objective: "Asegurar implementación exitosa y primera victoria del cliente",
      average_duration: "30-90 días",
      activities: [
        "Handoff estructurado a Customer Success",
        "Kickoff call con stakeholders clave",
        "Seguimiento de milestones de implementación",
        "Celebrar primer quick win"
      ],
      tools: ["Gainsight", "Slack compartido", "Project Plan"],
      exit_criteria: "Cliente activo con métrica de éxito alcanzada",
      conversion_rate_target: "90%"
    }
  ],
  qualification_framework: {
    name: "MEDDIC",
    criteria: [
      {
        letter: "M",
        meaning: "Metrics (Métricas)",
        questions: [
          "¿Cuánto les está costando este problema actualmente?",
          "¿Qué mejora esperan lograr y cómo la medirían?",
          "¿Cuál es el ROI mínimo que necesitan para justificar la inversión?"
        ],
        red_flags: ["No pueden cuantificar el problema", "El impacto es 'nice to have'"]
      },
      {
        letter: "E",
        meaning: "Economic Buyer (Comprador Económico)",
        questions: [
          "¿Quién firma el cheque para este tipo de inversión?",
          "¿Ha aprobado inversiones similares antes?",
          "¿Cuándo fue la última vez que lo involucraron en una decisión así?"
        ],
        red_flags: ["No tienen acceso al EB", "EB no está alineado con el proyecto"]
      },
      {
        letter: "D",
        meaning: "Decision Criteria (Criterios de Decisión)",
        questions: [
          "¿Qué factores considerarán para tomar esta decisión?",
          "¿Cómo ponderan precio vs. funcionalidad vs. soporte?",
          "¿Han definido must-haves vs. nice-to-haves?"
        ],
        red_flags: ["Criterios cambiantes", "Solo enfocados en precio"]
      },
      {
        letter: "D",
        meaning: "Decision Process (Proceso de Decisión)",
        questions: [
          "¿Cuáles son los pasos desde hoy hasta la firma?",
          "¿Quién más necesita estar involucrado?",
          "¿Hay algún comité o proceso de aprobación formal?"
        ],
        red_flags: ["Proceso no definido", "Demasiados stakeholders sin owner"]
      },
      {
        letter: "I",
        meaning: "Identify Pain (Identificar Dolor)",
        questions: [
          "¿Qué pasa si no resuelven esto en los próximos 6 meses?",
          "¿Quién más en la organización siente este dolor?",
          "¿Han intentado resolverlo antes? ¿Por qué no funcionó?"
        ],
        red_flags: ["Dolor no urgente", "Solo una persona afectada"]
      },
      {
        letter: "C",
        meaning: "Champion (Campeón)",
        questions: [
          "¿Qué gana personalmente si este proyecto es exitoso?",
          "¿Puede vendernos internamente cuando no estemos?",
          "¿Ha defendido proyectos similares antes?"
        ],
        red_flags: ["Sin skin in the game", "No tiene influencia interna"]
      }
    ]
  },
  objection_handling: [
    {
      objection: "Es muy caro",
      type: "Precio",
      response_framework: "Acknowledge → Probe → Reframe",
      example_response: "Entiendo que el presupuesto es importante. Ayúdame a entender: ¿caro comparado con qué? ¿Otra solución, el costo de no hacer nada, o el presupuesto disponible?",
      follow_up_question: "Si pudiéramos demostrar un ROI de 3x en el primer año, ¿cambiaría la conversación?"
    },
    {
      objection: "Ya tenemos algo que funciona",
      type: "Status Quo",
      response_framework: "Validate → Quantify Gap → Future Risk",
      example_response: "Tiene sentido, nadie cambia lo que funciona. Curiosidad: ¿cómo les iría si el volumen se duplica el próximo año con la solución actual?",
      follow_up_question: "¿Cuánto tiempo dedica tu equipo actualmente a tareas que podrían automatizarse?"
    },
    {
      objection: "Necesito pensarlo",
      type: "Indecisión",
      response_framework: "Clarify → Surface Real Concern → Facilitate Decision",
      example_response: "Por supuesto, es una decisión importante. Para ayudarte a pensar: ¿qué información adicional necesitarías para sentirte cómodo tomando una decisión?",
      follow_up_question: "¿Hay algo específico que te preocupa que no hayamos abordado?"
    },
    {
      objection: "La competencia ofrece lo mismo más barato",
      type: "Competencia",
      response_framework: "Acknowledge → Differentiate on Value → Create Doubt",
      example_response: "Es bueno que estés comparando opciones. ¿Puedo preguntarte qué criterios usaste para determinar que son equivalentes? A veces las diferencias no son obvias hasta la implementación.",
      follow_up_question: "¿Han hablado con clientes actuales de ambas soluciones?"
    },
    {
      objection: "No es el momento adecuado",
      type: "Timing",
      response_framework: "Understand Timeline → Calculate Cost of Delay → Create Urgency",
      example_response: "Entiendo que hay muchas prioridades. ¿Puedo preguntarte cuánto les cuesta cada mes que este problema sigue sin resolver? A veces el 'momento perfecto' nunca llega.",
      follow_up_question: "¿Qué tendría que pasar para que esto se convierta en prioridad?"
    }
  ],
  closing_techniques: [
    {
      name: "Cierre Assumptivo",
      when_to_use: "Cuando has recibido múltiples señales de compra y no hay objeciones pendientes",
      example: "Perfecto, parece que estamos alineados. ¿Prefieres empezar el lunes o mejor el miércoles para dar tiempo a preparar al equipo?"
    },
    {
      name: "Cierre de Resumen",
      when_to_use: "Después de una demo o presentación extensa para consolidar el valor",
      example: "Recapitulando: resolvemos el problema X que les cuesta Y al mes, con implementación en 30 días y ROI en 6 meses. ¿Hay algo más que necesites para avanzar?"
    },
    {
      name: "Cierre con Urgencia Legítima",
      when_to_use: "Cuando hay una razón real y verificable para actuar rápido",
      example: "Si firmamos antes del viernes, podemos incluirlos en la cohorte de implementación de enero. La siguiente no es hasta marzo. ¿Tiene sentido aprovechar esta ventana?"
    },
    {
      name: "Cierre de Prueba (Trial Close)",
      when_to_use: "Para medir temperatura durante el proceso sin parecer pushy",
      example: "Basado en lo que hemos visto hoy, ¿cómo te sientes respecto a avanzar con nosotros?"
    },
    {
      name: "Cierre de Alternativas",
      when_to_use: "Cuando el cliente necesita sentir control en la decisión",
      example: "Tenemos dos opciones que podrían funcionar: el plan anual con 20% de descuento o el mensual con más flexibilidad. ¿Cuál se adapta mejor a su situación?"
    }
  ],
  kpis: [
    { name: "Oportunidades Creadas", target: "15/mes por rep", frequency: "Mensual" },
    { name: "Tasa de Conversión Lead→Opp", target: ">25%", frequency: "Mensual" },
    { name: "Win Rate", target: ">30%", frequency: "Trimestral" },
    { name: "Ciclo de Venta Promedio", target: "<45 días", frequency: "Mensual" },
    { name: "Average Contract Value", target: "€15,000+", frequency: "Mensual" },
    { name: "Pipeline Coverage", target: "3x de quota", frequency: "Semanal" },
    { name: "Actividades por Opp", target: ">12 touchpoints", frequency: "Por deal" },
    { name: "MEDDIC Score Promedio", target: ">75%", frequency: "Por deal" },
    { name: "Forecast Accuracy", target: ">80%", frequency: "Trimestral" }
  ]
};

// ============================================================================
// GUIA DEMO DATA
// ============================================================================
export const DEMO_GUIA = {
  brand_voice: {
    personality: ["Experto pero accesible", "Innovador pero pragmático", "Ambicioso pero realista", "Cercano pero profesional"],
    tone: "Confiado y optimista, con un toque de urgencia constructiva. Hablamos como un mentor experimentado que genuinamente quiere ver a nuestros clientes triunfar.",
    do: [
      "Usar datos y ejemplos concretos para respaldar afirmaciones",
      "Reconocer los desafíos antes de presentar soluciones",
      "Hablar de 'nosotros' y 'juntos' para crear partnership",
      "Celebrar los éxitos de los clientes como propios",
      "Ser directo y ir al punto sin rodeos innecesarios"
    ],
    dont: [
      "Prometer resultados que no podemos garantizar",
      "Usar jerga técnica sin explicación cuando no es necesario",
      "Hablar mal de la competencia directamente",
      "Minimizar las preocupaciones del cliente",
      "Usar superlativos vacíos (mejor, único, revolucionario)"
    ]
  },
  key_messages: {
    elevator_pitch: "Ayudamos a empresas B2B a duplicar su pipeline de ventas en 90 días, combinando tecnología de automatización con metodología probada. Nuestros clientes cierran 40% más deals porque se enfocan en las oportunidades correctas.",
    value_proposition: "No vendemos software, vendemos resultados medibles. Cada euro invertido se traduce en pipeline concreto con ROI demostrable desde el primer mes.",
    tagline: "Pipeline predecible. Crecimiento sostenible.",
    differentiators: [
      "ROI garantizado por contrato",
      "Implementación en 30 días, no meses",
      "Metodología + tecnología integradas",
      "Customer Success dedicado incluido"
    ]
  },
  vocabulary: {
    preferred_terms: [
      { instead_of: "Producto", use: "Solución", reason: "Enfatiza el resultado, no la herramienta" },
      { instead_of: "Usuario", use: "Cliente o Partner", reason: "Eleva la relación más allá de lo transaccional" },
      { instead_of: "Problema", use: "Desafío u Oportunidad", reason: "Framing más positivo y accionable" },
      { instead_of: "Costo", use: "Inversión", reason: "Implica retorno, no gasto" },
      { instead_of: "Contrato", use: "Acuerdo de colaboración", reason: "Menos intimidante, más partnership" },
      { instead_of: "Competencia", use: "Alternativas en el mercado", reason: "Más neutral y profesional" }
    ],
    power_words: [
      "Predecible", "Medible", "Escalable", "Garantizado", "Probado", 
      "Personalizado", "Estratégico", "Acelerado", "Optimizado", "Integrado"
    ],
    words_to_avoid: [
      "Básico", "Simple", "Barato", "Fácil", "Rápido", "Disruptivo",
      "Sinergias", "Leverage", "Holístico", "Best-in-class"
    ]
  },
  templates: {
    email_intro: `Asunto: [Nombre], una idea para [Empresa] basada en [trigger event]

Hola [Nombre],

Vi que [Empresa] recientemente [evento específico - funding, contratación, expansión]. Felicidades, eso suele traer nuevos desafíos de [problema que resolvemos].

Trabajo con empresas similares a [Empresa] que enfrentaban [problema específico]. [Cliente ejemplo] logró [resultado concreto] en [timeframe].

¿Tendría sentido una conversación de 15 minutos esta semana para ver si aplica a su situación?

Saludos,
[Tu nombre]

P.D. [Un dato adicional relevante o resource valioso]`,
    follow_up: `Asunto: Re: Seguimiento - [tema de conversación anterior]

Hola [Nombre],

Quería dar seguimiento a nuestra conversación sobre [tema específico]. 

Pensando en lo que mencionaste sobre [pain point específico], encontré [recurso/caso/dato] que creo te será útil: [link o descripción]

¿Tiene sentido reconectar [día específico] para continuar explorando cómo podríamos ayudar con [objetivo mencionado]?

Saludos,
[Tu nombre]`,
    objection_handling: [
      {
        objection: "Envíame información por email",
        response: "Por supuesto. Para enviarte algo relevante y no genérico: ¿cuál es el desafío principal que están tratando de resolver actualmente? Así te mando algo específico."
      },
      {
        objection: "No tenemos presupuesto ahora",
        response: "Entiendo, el timing de presupuestos es importante. ¿Cuándo inicia su siguiente ciclo de planificación? Podemos programar una conversación para entonces y mientras tanto compartirte algunos recursos útiles."
      },
      {
        objection: "Ya trabajamos con alguien",
        response: "Tiene sentido. Curiosidad: si pudieras mejorar un aspecto de tu setup actual, ¿cuál sería? A veces complementamos soluciones existentes en lugar de reemplazarlas."
      },
      {
        objection: "Estamos muy ocupados ahora",
        response: "Lo entiendo perfectamente, todos lo estamos. ¿Te parece si agendamos algo para [2-3 semanas futuro]? Así no se pierde la conversación pero respetamos tu tiempo actual."
      }
    ]
  },
  scenarios: [
    {
      situation: "Primera llamada con un C-level que solo tiene 15 minutos",
      approach: "Ir directo al punto con un hook basado en research. Máximo 3 minutos de contexto, luego preguntas de descubrimiento enfocadas. Cerrar con next step claro.",
      example_script: "Gracias por el tiempo, [Nombre]. Vi que [insight de research]. En mi experiencia, empresas en esta etapa enfrentan [problema X]. ¿Es algo que están experimentando? [Pausa] Genial, cuéntame más sobre cómo se manifiesta en [Empresa]..."
    },
    {
      situation: "El cliente compara con un competidor más barato",
      approach: "No defender el precio, explorar el costo total de propiedad y el valor diferencial. Usar preguntas para que el cliente llegue a sus propias conclusiones.",
      example_script: "Es bueno que estés evaluando opciones. ¿Puedo preguntar qué criterios usaste para comparar? [Escuchar] Interesante. ¿Consideraron el tiempo de implementación y el soporte incluido? A veces la diferencia de precio se explica por..."
    },
    {
      situation: "Reactivar un lead que se enfrió hace 3 meses",
      approach: "No asumir que la situación es la misma. Abrir con valor nuevo (insight, recurso, cambio en tu oferta) y re-descubrir su situación actual.",
      example_script: "Hola [Nombre], sé que hablamos hace unos meses cuando el timing no era el adecuado. Pensé en ti porque [nuevo trigger/valor]. ¿Cómo ha evolucionado [el problema que discutimos]?"
    },
    {
      situation: "Demo para un comité de 5+ personas con diferentes intereses",
      approach: "Identificar stakeholders clave antes de la demo. Estructurar por casos de uso relevantes a cada grupo. Hacer pausas para preguntas. Cerrar con resumen y poll informal.",
      example_script: "Antes de comenzar, me gustaría entender qué espera cada uno de esta sesión para asegurarme de cubrir lo importante. [Nombre del decisor], ¿qué sería más valioso ver hoy? [Repetir con otros stakeholders clave]"
    }
  ]
};

// ============================================================================
// CALCULADORA DEMO DATA
// ============================================================================
export const DEMO_CALCULADORA = {
  market_analysis: {
    tam: { 
      value: "€4.2B", 
      calculation: "Empresas B2B en España (150K) × Ticket promedio software de ventas (€28K/año)" 
    },
    sam: { 
      value: "€850M", 
      calculation: "Empresas B2B 50-500 empleados (30K empresas) × Ticket promedio (€28K)" 
    },
    som: { 
      value: "€42M", 
      calculation: "5% del SAM alcanzable en 3 años con recursos actuales" 
    },
    growth_rate: "12% CAGR",
    trends: [
      "Adopción acelerada post-COVID de herramientas digitales",
      "Consolidación de tech stacks (menos herramientas, más integradas)",
      "IA generativa transformando productividad comercial",
      "Remote selling como nueva normalidad",
      "Revenue Operations como función emergente"
    ]
  },
  financial_projections: {
    scenario_conservative: {
      year1_revenue: "€180,000",
      year2_revenue: "€420,000",
      year3_revenue: "€780,000",
      assumptions: [
        "20 nuevos clientes/año (crecimiento lineal)",
        "ACV promedio €9,000",
        "Churn 15% anual"
      ]
    },
    scenario_realistic: {
      year1_revenue: "€300,000",
      year2_revenue: "€750,000",
      year3_revenue: "€1,500,000",
      assumptions: [
        "35 nuevos clientes año 1, creciendo 40% YoY",
        "ACV promedio €10,000 con upsell a €12,000 año 2+",
        "Churn reducido a 10% con mejoras en producto"
      ]
    },
    scenario_optimistic: {
      year1_revenue: "€450,000",
      year2_revenue: "€1,200,000",
      year3_revenue: "€2,800,000",
      assumptions: [
        "50 nuevos clientes año 1 con equipo comercial ampliado",
        "Expansión a mercado LATAM año 2",
        "Producto enterprise con ACV €25,000+"
      ]
    }
  },
  unit_economics: {
    cac: { value: "€2,800" },
    ltv: { value: "€28,000" },
    ltv_cac_ratio: "10:1",
    payback_period: "4 meses",
    gross_margin: "78%"
  },
  competitive_position: {
    strengths: [
      "Metodología probada + tecnología integrada (difícil de replicar)",
      "Equipo con experiencia directa en ventas B2B",
      "ROI garantizado por contrato (único en el mercado)",
      "Implementación 3x más rápida que alternativas"
    ],
    weaknesses: [
      "Brand awareness limitado fuera de early adopters",
      "Capacidad de delivery actual limitada a 50 clientes/año",
      "Sin presencia en mercados internacionales",
      "Dependencia de canal directo (sin partners)"
    ],
    opportunities: [
      "Mercado LATAM con menor competencia y crecimiento acelerado",
      "Alianzas con consultoras que no tienen solución propia",
      "IA como multiplicador de productividad del equipo",
      "Empresas tradicionales digitalizándose post-COVID"
    ],
    threats: [
      "Competidores con más funding entrando al mercado",
      "Consolidación de CRMs grandes añadiendo features similares",
      "Recesión económica reduciendo presupuestos de software",
      "Comoditización de features básicos de automatización"
    ]
  },
  growth_levers: [
    {
      lever: "Programa de Partners/Referidos",
      potential_impact: "Alto",
      timeline: "6-9 meses",
      recommendation: "Crear programa de referidos con consultoras y agencias que trabajan con nuestro ICP",
      effort_required: "Medio"
    },
    {
      lever: "Content Marketing + SEO",
      potential_impact: "Alto",
      timeline: "9-12 meses",
      recommendation: "Publicar 2-3 piezas de contenido long-form mensuales targeting keywords de alta intención",
      effort_required: "Medio"
    },
    {
      lever: "Producto Self-Serve (PLG)",
      potential_impact: "Alto",
      timeline: "12-18 meses",
      recommendation: "Crear tier freemium para capturar SMBs y usarlo como top of funnel para enterprise",
      effort_required: "Alto"
    },
    {
      lever: "Expansión de Features con IA",
      potential_impact: "Medio",
      timeline: "3-6 meses",
      recommendation: "Agregar asistente IA para generación de emails y análisis de llamadas",
      effort_required: "Medio"
    },
    {
      lever: "Caso de Estudio Video",
      potential_impact: "Medio",
      timeline: "1-2 meses",
      recommendation: "Producir 3 video case studies con clientes top para usar en todo el funnel",
      effort_required: "Bajo"
    }
  ],
  action_plan: {
    immediate: [
      "Cerrar 2 clientes ancla para case studies (semana 1-2)",
      "Implementar tracking completo de métricas de funnel",
      "Documentar proceso de implementación para escalar delivery"
    ],
    short_term: [
      "Contratar 2do vendedor para duplicar capacidad (mes 2)",
      "Lanzar programa de referidos con 5 partners iniciales (mes 3)",
      "Publicar 3 case studies con ROI documentado (mes 4)"
    ],
    long_term: [
      "Levantar ronda Seed de €1.5M para acelerar crecimiento (Q3)",
      "Abrir operaciones en México como primer mercado LATAM (Q4)",
      "Desarrollar tier enterprise con features de IA avanzada (Q4)"
    ]
  },
  risk_assessment: [
    {
      risk: "Dependencia de fundadores en ventas",
      probability: "Alta",
      impact: "Alto",
      mitigation: "Documentar playbook y contratar vendedor senior en 60 días"
    },
    {
      risk: "Competidor grande lanza feature similar",
      probability: "Media",
      impact: "Medio",
      mitigation: "Diferenciar en servicio y metodología, no solo en producto"
    },
    {
      risk: "Recesión reduce presupuestos de software",
      probability: "Media",
      impact: "Alto",
      mitigation: "Posicionar como inversión con ROI garantizado, no como costo"
    },
    {
      risk: "Churn mayor al esperado",
      probability: "Baja",
      impact: "Alto",
      mitigation: "Implementar health scores y intervención proactiva de CS"
    }
  ],
  opportunity_score: {
    overall: 78,
    breakdown: {
      market_attractiveness: "85/100 - Mercado grande, creciendo, fragmentado",
      competitive_position: "72/100 - Diferenciación clara pero brand débil",
      team_capability: "80/100 - Experiencia relevante, necesita escalar",
      financial_viability: "75/100 - Unit economics sólidos, necesita capital",
      execution_capability: "70/100 - Procesos en desarrollo, limitaciones de capacity"
    },
    recommendation: "AVANZAR CON PRECAUCIÓN",
    verdict: "Oportunidad atractiva con fundamentos sólidos. Priorizar la construcción de capacidad de delivery y generación de casos de éxito antes de acelerar la inversión en adquisición. El principal riesgo es crecer más rápido de lo que se puede entregar con calidad."
  }
};

// Export all demo data
export const DEMO_PRACTICAR_DATA = {
  sales_simulator: DEMO_SIMULADOR,
  sales_playbook: DEMO_PLAYBOOK,
  communication_guide: DEMO_GUIA,
  opportunity_calculator: DEMO_CALCULADORA
};
