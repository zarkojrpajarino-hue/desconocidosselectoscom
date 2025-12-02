import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useNavigate } from 'react-router-dom';
import { TOUR_DEMO_DATA } from '@/lib/tourData';
import { 
  createDemoLead, 
  animateDragDrop, 
  createDemoOKR, 
  animateKRProgress,
  createDemoRevenue,
  createDemoExpense,
  animateROICalculation,
  animateMetricsCharts,
  cleanupDemoData,
  fillAndAnimateSalesKPI,
  highlightSaveButton
} from '@/lib/demoActions';

export const useSectionTour = (sectionId: string) => {
  const navigate = useNavigate();

  const getCRMPipelineTour = (driverObj: any): DriveStep[] => [
    {
      popover: {
        title: '📊 Pipeline de Ventas',
        description: 'Vamos a mostrarte cómo gestionar tus oportunidades de venta con un ejemplo real.',
      }
    },
    {
      element: '#pipeline-columns',
      popover: {
        title: '🔄 Columnas del Pipeline',
        description: 'Cada columna representa una etapa: Descubrimiento → Calificación → Propuesta → Negociación → Ganado/Perdido',
        side: 'top',
      }
    },
    {
      popover: {
        title: '👤 Creando lead de ejemplo...',
        description: 'Mira cómo añadimos a Ana García de TechStart Solutions',
        onNextClick: () => {
          createDemoLead();
          setTimeout(() => driverObj.moveNext(), 1000);
        }
      }
    },
    {
      element: '#demo-lead-1',
      popover: {
        title: '✨ Lead creado',
        description: `${TOUR_DEMO_DATA.lead.name} de ${TOUR_DEMO_DATA.lead.company}. Valor: €${TOUR_DEMO_DATA.lead.estimated_value.toLocaleString()}`,
        side: 'right',
      }
    },
    {
      popover: {
        title: '🎯 Moviendo lead entre etapas...',
        description: 'Observa cómo lo arrastramos a "Calificación"',
        onNextClick: () => {
          animateDragDrop('demo-lead-1', 'descubrimiento', 'calificación');
          setTimeout(() => driverObj.moveNext(), 2000);
        }
      }
    },
    {
      element: '#demo-lead-1',
      popover: {
        title: '✅ ¡Así de fácil!',
        description: 'Arrastra y suelta los leads para actualizar su estado. Todo se guarda automáticamente.',
        side: 'left',
      }
    },
    {
      element: '[data-action="create-lead"]',
      popover: {
        title: '➕ Añadir nuevos leads',
        description: 'Haz clic aquí para crear leads manualmente o importar desde CSV/Excel.',
        side: 'bottom',
      }
    }
  ];

  const getOKRsTour = (driverObj: any): DriveStep[] => [
    {
      popover: {
        title: '🎯 Objetivos y Resultados Clave (OKRs)',
        description: 'Los OKRs te ayudan a definir y medir objetivos ambiciosos trimestrales.',
      }
    },
    {
      popover: {
        title: '📝 Creando OKR de ejemplo...',
        description: 'Vamos a crear un objetivo de crecimiento con métricas reales',
        onNextClick: () => {
          createDemoOKR();
          setTimeout(() => driverObj.moveNext(), 1000);
        }
      }
    },
    {
      element: '#demo-okr-1',
      popover: {
        title: '🎯 Objetivo definido',
        description: `"${TOUR_DEMO_DATA.okr.title}" - Este es tu objetivo principal del trimestre.`,
        side: 'top',
      }
    },
    {
      element: '#demo-okr-1-key-results',
      popover: {
        title: '📊 Key Results (Resultados Clave)',
        description: 'Cada objetivo tiene 3-5 Key Results medibles que indican si lo estás logrando.',
        side: 'right',
      }
    },
    {
      popover: {
        title: '📈 Actualizando progreso...',
        description: 'Mira cómo se actualiza el progreso del primer Key Result',
        onNextClick: () => {
          animateKRProgress('demo-kr-1', 32, 38);
          setTimeout(() => driverObj.moveNext(), 2000);
        }
      }
    },
    {
      element: '#demo-kr-1',
      popover: {
        title: '✅ Progreso actualizado',
        description: 'Las barras de progreso se actualizan automáticamente. Puedes editarlas haciendo clic.',
        side: 'left',
      }
    }
  ];

  const getFinancialTour = (driverObj: any): DriveStep[] => [
    {
      popover: {
        title: '💰 Control Financiero',
        description: 'Gestiona ingresos, gastos y analiza la salud financiera de tu negocio en tiempo real.',
      }
    },
    {
      element: '[data-metric="revenue"]',
      popover: {
        title: '📊 Panel de KPIs',
        description: 'Cuatro métricas principales: Ingresos, Gastos, Margen Neto y Runway (meses de supervivencia).',
        side: 'top',
      }
    },
    {
      popover: {
        title: '💵 Creando ingreso de ejemplo...',
        description: 'Observa cómo se registra un ingreso de €12,450 por suscripciones.',
        onNextClick: () => {
          createDemoRevenue();
          setTimeout(() => driverObj.moveNext(), 2000);
        }
      }
    },
    {
      element: '[data-metric="revenue"]',
      popover: {
        title: '✅ Ingreso registrado',
        description: 'El total de ingresos se actualizó automáticamente. Mira cómo aumentó el valor.',
        side: 'right',
      }
    },
    {
      element: '#revenue-by-product-chart',
      popover: {
        title: '📈 Ingresos por Producto',
        description: 'Gráfico de barras mostrando qué productos generan más ingresos. Se actualiza automáticamente.',
        side: 'top',
      }
    },
    {
      popover: {
        title: '💸 Ahora un gasto de ejemplo...',
        description: 'Registramos un gasto operativo de €3,200.',
        onNextClick: () => {
          createDemoExpense();
          setTimeout(() => driverObj.moveNext(), 2000);
        }
      }
    },
    {
      element: '[data-metric="expenses"]',
      popover: {
        title: '✅ Gasto registrado',
        description: 'Total de gastos actualizado. Esto afecta tu margen neto y burn rate.',
        side: 'right',
      }
    },
    {
      element: '#expenses-by-category-chart',
      popover: {
        title: '🥧 Gastos por Categoría',
        description: 'Gráfico circular que muestra dónde gastas más: producción, marketing, salarios, etc.',
        side: 'top',
      }
    },
    {
      popover: {
        title: '🎯 Calculando ROI...',
        description: 'El sistema calcula automáticamente tu ROI (Retorno de Inversión) con los ingresos y gastos.',
        onNextClick: () => {
          animateROICalculation();
          setTimeout(() => driverObj.moveNext(), 2500);
        }
      }
    },
    {
      element: '[data-metric="margin"]',
      popover: {
        title: '💰 Margen Neto Calculado',
        description: 'Margen = Ingresos - Gastos. Este es tu beneficio real del mes.',
        side: 'left',
      }
    },
    {
      element: '#marketing-roi-table',
      popover: {
        title: '📊 ROI por Canal de Marketing',
        description: 'Tabla detallada mostrando ROI, CAC, conversión y revenue por cada canal (LinkedIn, Google Ads, etc.).',
        side: 'top',
      }
    },
    {
      element: '[data-metric="runway"]',
      popover: {
        title: '⏰ Runway: ¿Cuánto tiempo tienes?',
        description: 'Basado en tu caja actual y burn rate, calcula cuántos meses puedes operar sin nuevos ingresos.',
        side: 'bottom',
      }
    },
    {
      element: '#financial-history-button',
      popover: {
        title: '📜 Historial Completo',
        description: 'Accede al historial de todas tus transacciones: ingresos, gastos y campañas de marketing. Revisa, edita o elimina cualquier registro anterior.',
        side: 'left',
      }
    },
    {
      popover: {
        title: '🎉 ¡Listo!',
        description: 'Ahora sabes cómo funciona el panel financiero: registra transacciones, analiza tu salud financiera automáticamente y revisa el historial completo.',
      }
    }
  ];

  const getBusinessMetricsTour = (driverObj: any): DriveStep[] => [
    {
      popover: {
        title: '📊 KPIs de Negocio',
        description: 'Mide y analiza las métricas operativas más importantes de tu empresa en tiempo real.',
      }
    },
    {
      element: '#metrics-grid',
      popover: {
        title: '🎯 Panel de métricas',
        description: 'Todas tus métricas clave organizadas por categorías: Ventas, Marketing, Operaciones y Cliente. Cada pestaña agrupa métricas relacionadas para facilitar su registro.',
        side: 'top',
      }
    },
    {
      popover: {
        title: '💰 Demo: Rellenando KPI de Ventas...',
        description: 'Observa cómo se registra un ingreso mensual de €25,650 con 42 pedidos y ticket promedio de €610.',
        onNextClick: () => {
          fillAndAnimateSalesKPI();
          setTimeout(() => driverObj.moveNext(), 4000);
        }
      }
    },
    {
      element: 'input[id*="revenue"]',
      popover: {
        title: '✅ Ventas registradas',
        description: 'Los campos se llenan automáticamente. En producción, tú introduces estos valores basándote en tus datos reales del mes.',
        side: 'right',
      }
    },
    {
      popover: {
        title: '📊 Otras pestañas',
        description: 'Marketing (leads, CAC, conversión), Operaciones (producción, capacidad, costes) y Cliente (NPS, retención, LTV). Todas funcionan igual: rellena campos y guarda.',
        onNextClick: () => {
          driverObj.moveNext();
        }
      }
    },
    {
      element: '.justify-end > button:has(.lucide-download)',
      popover: {
        title: '📥 Exportar métricas',
        description: 'Usa el botón "Exportar" para descargar todas tus métricas en formato CSV. Perfecto para análisis externos o reportes.',
        side: 'left',
      }
    },
    {
      popover: {
        title: '💾 Guardando cambios...',
        description: 'Después de actualizar métricas, haz clic en "Guardar Métricas" al final de la página para registrarlas en la base de datos.',
        onNextClick: () => {
          highlightSaveButton();
          setTimeout(() => driverObj.moveNext(), 2000);
        }
      }
    },
    {
      popover: {
        title: '🎉 ¡Listo!',
        description: 'Ya sabes cómo registrar KPIs, exportarlos y guardarlos. Mantén tus métricas actualizadas semanalmente para obtener mejores insights de la IA.',
      }
    }
  ];

  const getCRMHubTour = (driverObj: any): DriveStep[] => [
    {
      popover: {
        title: '👥 CRM Professional',
        description: 'Sistema completo de gestión de leads con estadísticas globales y filtros avanzados.',
      }
    },
    {
      element: '#crm-new-lead-button',
      popover: {
        title: '➕ Añadir un Lead',
        description: 'Haz clic aquí para crear un nuevo lead. Rellena: nombre, empresa, email, teléfono, valor estimado, prioridad y etapa del proceso de venta.',
        side: 'bottom',
      }
    },
    {
      element: '#crm-filters-card',
      popover: {
        title: '🔍 Filtros de Búsqueda',
        description: 'Usa la barra de búsqueda para filtrar por nombre, empresa o email. Los selectores te permiten filtrar por estado (Nuevo, Contactado, Calificado), tipo de lead (Caliente 🔥, Templado 🌡️, Frío ❄️) y usuario creador.',
        side: 'top',
      }
    },
    {
      element: '.grid.grid-cols-1.md\\:grid-cols-4.gap-4',
      popover: {
        title: '📊 Estadísticas Globales',
        description: 'Total de Leads: todos los contactos registrados. Pipeline Total: suma del valor estimado de todos los leads activos. Leads Calientes: oportunidades prioritarias 🔥. Ganados: leads convertidos en clientes ✅.',
        side: 'bottom',
      }
    },
    {
      element: '#crm-individual-stats',
      popover: {
        title: '👤 Estadísticas Individuales',
        description: 'Aquí ves el rendimiento de cada miembro del equipo: leads creados, tasa de conversión, valor total pipeline y leads ganados. Ideal para comparar performance y reconocer top performers.',
        side: 'top',
      }
    },
    {
      element: 'button:has(.lucide-trending-up)',
      popover: {
        title: '📈 Vista Pipeline',
        description: 'Haz clic para ver el Pipeline de Ventas: una visualización tipo Kanban con drag & drop donde puedes mover leads entre etapas (Descubrimiento, Calificación, Propuesta, Negociación, Ganado/Perdido).',
        side: 'left',
      }
    },
    {
      popover: {
        title: '🎉 ¡Listo!',
        description: 'Ya sabes cómo usar el CRM: añadir leads, filtrarlos, ver estadísticas globales e individuales, y acceder al pipeline visual. ¡Mantén tu CRM actualizado para mejores insights!',
      }
    }
  ];

  const getCRMLeadsTour = (driverObj: any): DriveStep[] => [
    {
      popover: {
        title: '👥 CRM - Gestión de Leads',
        description: 'Tu base de datos centralizada de contactos, clientes potenciales y oportunidades de venta.',
      }
    },
    {
      popover: {
        title: '📋 ¿Qué es un Lead?',
        description: 'Un lead es cualquier persona u organización que mostró interés en tu producto/servicio. Aquí guardas: nombre, empresa, email, teléfono, valor estimado, prioridad y etapa.',
      }
    },
    {
      element: '.justify-end > button:contains("Nuevo Lead")',
      popover: {
        title: '➕ Añadir un Lead',
        description: 'Haz clic en "Nuevo Lead" para registrar un contacto nuevo. Completa los datos básicos: nombre, empresa, email, teléfono, etapa del proceso, prioridad (Alta/Media/Baja) y valor estimado.',
        side: 'bottom',
      }
    },
    {
      popover: {
        title: '🔍 Filtros de Búsqueda',
        description: 'Usa los filtros para encontrar leads específicos: por tipo (Caliente/Templado/Frío, MQL/SQL), por usuario asignado, o por rango de valor estimado (€1,000+, €5,000+, etc.).',
      }
    },
    {
      popover: {
        title: '📊 Estadísticas del CRM',
        description: 'Las tarjetas superiores muestran métricas clave: total de leads, tasa de conversión, valor estimado del pipeline total y leads ganados (convertidos en clientes). Se actualizan automáticamente.',
      }
    },
    {
      popover: {
        title: '👁️ Vista Individual de Lead',
        description: 'Haz clic en cualquier tarjeta de lead para ver su detalle completo. Desde ahí puedes editar información, cambiar la etapa, reasignar a otro usuario, añadir notas o eliminar el contacto.',
      }
    },
    {
      element: 'button:has(.lucide-trending-up)',
      popover: {
        title: '📈 Ver Pipeline de Ventas',
        description: 'El Pipeline visualiza todos tus leads organizados por etapas: Descubrimiento → Calificación → Propuesta → Negociación → Ganado/Perdido. Puedes arrastrar leads entre etapas.',
        side: 'left',
      }
    },
    {
      popover: {
        title: '🎉 ¡Perfecto!',
        description: 'Ya sabes cómo gestionar tus leads: añadir nuevos contactos, filtrarlos, ver estadísticas y acceder al pipeline. ¡Mantén tu CRM actualizado!',
      }
    }
  ];

  const getDashboardTour = (driverObj: any): DriveStep[] => [
    {
      popover: {
        title: '🏠 Panel Principal de Trabajo',
        description: 'Aquí gestionas tus tareas semanales, cambios, y seguimiento de progreso. Vamos a explorar todo lo que puedes hacer.',
      }
    },
    {
      element: '.shadow-card:has(.text-3xl.font-bold.bg-gradient-primary)',
      popover: {
        title: '⏰ Countdown Semanal',
        description: 'Tiempo restante hasta el deadline de la semana. Cuando llegue a 0, la semana se bloquea y ya no podrás hacer cambios.',
        side: 'bottom',
      }
    },
    {
      element: '[data-testid="stats-cards"]',
      popover: {
        title: '📊 Métricas de Progreso',
        description: 'Tareas asignadas, completadas, pendientes y tu porcentaje de avance semanal. Actualizado en tiempo real.',
        side: 'top',
      }
    },
    {
      element: '.bg-gradient-to-br.from-primary\\/5',
      popover: {
        title: '🔄 Sistema de Cambios de Tareas',
        description: 'Según tu modo de trabajo (Relajado/Moderado/Intenso), tienes un límite de cambios por semana. Puedes intercambiar tareas que no te convengan.',
        side: 'top',
      }
    },
    {
      element: '.space-y-2:has(input[type="radio"])',
      popover: {
        title: '⚙️ Modo de Trabajo',
        description: 'Relajado (4 tareas, 3 cambios), Moderado (6 tareas, 2 cambios), Intenso (8 tareas, 1 cambio). Define tu carga semanal.',
        side: 'right',
      }
    },
    {
      element: '.bg-gradient-to-r.from-success\\/20',
      popover: {
        title: '📈 Barra de Progreso Semanal',
        description: 'Visualización de cuántas tareas has completado vs. total asignadas. Muestra porcentaje en tiempo real.',
        side: 'top',
      }
    },
    {
      popover: {
        title: '📋 Lista de Tareas',
        description: 'Ahora verás tu lista de tareas semanales. Cada tarea tiene estado, prioridad, y opciones de intercambio.',
        onNextClick: () => {
          driverObj.moveNext();
        }
      }
    },
    {
      element: '.space-y-3',
      popover: {
        title: '✅ Completar Tareas',
        description: 'Marca tareas como completadas con el checkbox. El líder de área debe validarlas para que cuenten al 100%.',
        side: 'left',
      }
    },
    {
      element: 'button:has(.lucide-refresh-cw)',
      popover: {
        title: '🔀 Cambiar Tareas',
        description: 'Haz clic en "Cambiar" para intercambiar una tarea por otra alternativa. Consume uno de tus cambios semanales.',
        side: 'right',
      }
    },
    {
      popover: {
        title: '⚠️ Urgencias y Deadlines',
        description: 'Si hay tareas urgentes o próximas al deadline, verás alertas destacadas en rojo. Prioriza esas primero.',
      }
    },
    {
      popover: {
        title: '👥 Progreso del Equipo',
        description: 'Puedes ver el progreso de otros miembros del equipo. Aparecen badges junto a los nombres indicando sus roles.',
      }
    },
    {
      popover: {
        title: '🎉 ¡Listo!',
        description: 'Ya conoces el Dashboard completo: tareas, cambios, progreso, y deadlines. ¡Ahora a trabajar de forma organizada!',
      }
    }
  ];

  const getAIAnalysisTour = (driverObj: any): DriveStep[] => [
    {
      popover: {
        title: '🤖 Análisis Inteligente',
        description: 'La IA analiza tus datos y te da recomendaciones personalizadas.',
      }
    },
    {
      element: '#ai-insights',
      popover: {
        title: '💡 Insights automáticos',
        description: 'Descubre patrones, tendencias y oportunidades que no habías visto.',
        side: 'top',
      }
    },
    {
      element: '#ask-ai',
      popover: {
        title: '💬 Pregunta a la IA',
        description: 'Haz preguntas en lenguaje natural: "¿Qué leads tengo más probabilidad de cerrar?"',
        side: 'bottom',
      }
    }
  ];

  const getBuyerPersonaTour = (driverObj: any): DriveStep[] => [
    {
      popover: {
        title: '👤 Buyer Persona',
        description: 'Define el perfil ideal de tu cliente para enfocar mejor tu estrategia.',
      }
    },
    {
      element: '#persona-demographics',
      popover: {
        title: '📊 Datos demográficos',
        description: 'Edad, ubicación, nivel educativo, ingresos, puesto de trabajo...',
        side: 'right',
      }
    },
    {
      element: '#persona-psychographics',
      popover: {
        title: '🧠 Psicografía',
        description: 'Motivaciones, objetivos, miedos y frustraciones de tu cliente ideal.',
        side: 'right',
      }
    }
  ];

  const getAgendaTour = (driverObj: any): DriveStep[] => [
    {
      popover: {
        title: '📅 Agenda Semanal Inteligente',
        description: 'Sistema automático que coordina tus tareas con el equipo según tu disponibilidad. Vamos a ver cómo funciona.',
      }
    },
    {
      popover: {
        title: '⏰ ¿Cómo se genera?',
        description: 'Cada lunes antes de las 13:00, debes configurar tu disponibilidad horaria. El sistema genera agendas coordinadas para todo el equipo.',
      }
    },
    {
      element: 'button:has-text("Configurar Disponibilidad"), button:has-text("Generar Agenda")',
      popover: {
        title: '🎛️ Configuración de Disponibilidad',
        description: 'Haz clic aquí para indicar tus horarios disponibles: horas por día, bloques de tiempo, preferencias. El sistema respeta tu disponibilidad.',
        side: 'bottom',
      }
    },
    {
      popover: {
        title: '📋 Ejemplo: Cuestionario de Disponibilidad',
        description: 'Te pregunta: ¿Cuántas horas puedes trabajar lunes, martes, etc.? ¿Prefieres mañanas o tardes? ¿Algún bloque bloqueado?',
      }
    },
    {
      popover: {
        title: '🔄 Generación Automática',
        description: 'Una vez todos completan su disponibilidad, el sistema genera agendas coordinadas. Asigna tareas a franjas horarias según prioridad y dependencias.',
      }
    },
    {
      popover: {
        title: '📆 Vista de Agenda',
        description: 'Tu agenda muestra cada día de la semana con bloques de tiempo asignados: tareas, horas estimadas, y posibles colaboraciones con el equipo.',
      }
    },
    {
      popover: {
        title: '🔀 Sugerencias de Cambio',
        description: 'Si un bloque no te conviene, puedes sugerir cambios. El sistema busca slots alternativos que no afecten al equipo.',
      }
    },
    {
      popover: {
        title: '🔗 Integración con Google Calendar',
        description: 'Puedes sincronizar tu agenda con Google Calendar para ver todo en un solo lugar. Los eventos se crean automáticamente.',
      }
    },
    {
      popover: {
        title: '✅ Vista Previa vs. Final',
        description: 'Antes del miércoles 13:30 ves un "preview" editable. Después, se convierte en agenda final y no se puede modificar hasta la próxima semana.',
      }
    },
    {
      popover: {
        title: '🎉 ¡Perfecto!',
        description: 'Ahora entiendes cómo funciona la Agenda Semanal: disponibilidad → generación automática → coordinación con equipo → ejecución.',
      }
    }
  ];

  const getGamificationTour = (driverObj: any): DriveStep[] => [
    {
      popover: {
        title: '🏆 Sistema de Gamificación',
        description: 'Gana puntos, badges y compite con tu equipo. Veamos cómo funciona este sistema de recompensas.',
      }
    },
    {
      element: '.grid.grid-cols-1.md\\:grid-cols-4 > .shadow-card:first-child',
      popover: {
        title: '⭐ Puntos Totales',
        description: 'Acumulas puntos completando tareas, validando trabajo del equipo, y logrando objetivos. Más puntos = mejor ranking.',
        side: 'bottom',
      }
    },
    {
      element: '.grid.grid-cols-1.md\\:grid-cols-4 > .shadow-card:nth-child(2)',
      popover: {
        title: '🔥 Racha Actual',
        description: 'Semanas consecutivas completando todas tus tareas. Mantén la racha para ganar badges especiales y bonificaciones.',
        side: 'bottom',
      }
    },
    {
      element: '.grid.grid-cols-1.md\\:grid-cols-4 > .shadow-card:nth-child(3)',
      popover: {
        title: '🎖️ Badges Desbloqueados',
        description: 'Medallas por logros especiales: Primera Tarea, Racha de 5 Semanas, 100 Tareas Completadas, etc. Colecciónalos todos.',
        side: 'bottom',
      }
    },
    {
      element: '.grid.grid-cols-1.md\\:grid-cols-4 > .shadow-card:nth-child(4)',
      popover: {
        title: '👑 Tu Ranking',
        description: 'Posición en el leaderboard del equipo. Los 3 primeros lugares obtienen reconocimiento especial (🥇🥈🥉).',
        side: 'bottom',
      }
    },
    {
      element: '.shadow-card:has(.grid.grid-cols-2.md\\:grid-cols-4.lg\\:grid-cols-6)',
      popover: {
        title: '🎖️ Colección de Badges',
        description: 'Badges por rareza: Común (gris), Raro (azul), Épico (morado), Legendario (dorado). Cada uno con su icono emoji único.',
        side: 'top',
      }
    },
    {
      popover: {
        title: '🏅 ¿Cómo ganar badges?',
        description: 'Ejemplos: "Primera Tarea" (completar 1 tarea), "Imparable" (racha de 10 semanas), "Centurión" (100 tareas completadas), "Líder Nato" (validar 50 tareas del equipo).',
      }
    },
    {
      element: '.shadow-card:has(#\\31, #\\32, #\\33)',
      popover: {
        title: '🏆 Leaderboard del Equipo',
        description: 'Ranking completo con puntos, tareas completadas, y rachas de cada miembro. Puedes verte destacado con borde especial si estás en la lista.',
        side: 'top',
      }
    },
    {
      element: '.shadow-card:has-text("Actividad Reciente")',
      popover: {
        title: '📜 Historial de Puntos',
        description: 'Últimas 5 acciones que te dieron puntos: "Tarea completada +10pts", "Validación de líder +15pts", "Racha semanal +20pts".',
        side: 'top',
      }
    },
    {
      popover: {
        title: '🎯 Estrategia de Puntos',
        description: 'Completa tareas a tiempo (10-20pts), mantén rachas (bonus x2), valida trabajo de otros (+5-15pts), logra objetivos de equipo (bonus especial).',
      }
    },
    {
      popover: {
        title: '🎉 ¡A jugar!',
        description: 'Sistema completo: puntos, badges, rachas, leaderboard. Compite sanamente con tu equipo y celebra los logros juntos.',
      }
    }
  ];

  const startSectionTour = () => {
    const driverObj = driver({
      showProgress: true,
      progressText: 'Paso {{current}} de {{total}}',
      nextBtnText: 'Siguiente →',
      prevBtnText: '← Anterior',
      doneBtnText: '✓ Entendido',
      overlayOpacity: 0.75,
      smoothScroll: true,
      animate: true,
      allowClose: true,
      steps: [],
      onDestroyStarted: () => {
        cleanupDemoData();
        if (!driverObj.hasNextStep()) {
          console.log(`Tour de ${sectionId} completado`);
        }
        driverObj.destroy();
      }
    });

    // Obtener pasos del tour pasando el driverObj
    let steps: DriveStep[] = [];
    switch(sectionId) {
      case 'crm-hub':
        steps = getCRMHubTour(driverObj);
        break;
      case 'crm-leads':
        steps = getCRMLeadsTour(driverObj);
        break;
      case 'crm-pipeline':
        steps = getCRMPipelineTour(driverObj);
        break;
      case 'okrs':
        steps = getOKRsTour(driverObj);
        break;
      case 'financial':
        steps = getFinancialTour(driverObj);
        break;
      case 'business-metrics':
        steps = getBusinessMetricsTour(driverObj);
        break;
      case 'dashboard':
        steps = getDashboardTour(driverObj);
        break;
      case 'ai-analysis':
        steps = getAIAnalysisTour(driverObj);
        break;
      case 'buyer-persona':
        steps = getBuyerPersonaTour(driverObj);
        break;
      case 'agenda':
        steps = getAgendaTour(driverObj);
        break;
      case 'gamification':
        steps = getGamificationTour(driverObj);
        break;
      default:
        steps = [{
          popover: {
            title: '🎯 Tour de la sección',
            description: 'Este tour te mostrará cómo usar esta sección paso a paso.',
          }
        }];
    }

    // Actualizar los pasos del driver
    driverObj.setSteps(steps);
    driverObj.drive();
  };
  
  return { startSectionTour };
};
