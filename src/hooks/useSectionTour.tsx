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

  // ============================================
  // 🏠 DASHBOARD TOUR (15 pasos)
  // ============================================
  const getDashboardTour = (driverObj: ReturnType<typeof driver>): DriveStep[] => [
    {
      popover: {
        title: '🏠 Dashboard - Tu Centro de Control',
        description: 'Bienvenido al Dashboard. Aquí gestionas tareas, progreso, alertas y tu agenda semanal.',
      }
    },
    {
      element: '[data-tour="countdown-timer"], .shadow-card:has(.text-3xl.font-bold)',
      popover: {
        title: '⏱️ Cuenta Regresiva Semanal',
        description: 'Tiempo restante hasta que cierre la semana. Cada miércoles a las 13:30 se abre una nueva semana de trabajo.',
        side: 'bottom',
      }
    },
    {
      element: '[data-testid="stats-cards"], [data-tour="stats-overview"]',
      popover: {
        title: '📊 Resumen de Estadísticas',
        description: 'Tus números clave: tareas asignadas, completadas hoy, pendientes esta semana y tu porcentaje de avance.',
        side: 'bottom',
      }
    },
    {
      element: '[data-tour="phase-selector"], .bg-gradient-to-br.from-primary\\/5',
      popover: {
        title: '🚀 Fases del Proyecto',
        description: 'Tu proyecto evoluciona en 4 fases: Fundamentos → Optimización → Escalamiento → Consolidación.',
        side: 'right',
      }
    },
    {
      element: '[data-tour="work-mode-selector"], .space-y-2:has(input[type="radio"])',
      popover: {
        title: '⚙️ Modo de Trabajo',
        description: 'Relajado (4 tareas, 3 cambios), Moderado (6 tareas, 2 cambios), Intenso (8 tareas, 1 cambio).',
        side: 'bottom',
      }
    },
    {
      element: '[data-tour="progress-bar"], .bg-gradient-to-r.from-success\\/20',
      popover: {
        title: '📈 Barra de Progreso Semanal',
        description: 'Visualización de tareas completadas vs. total asignadas. Muestra porcentaje en tiempo real.',
        side: 'top',
      }
    },
    {
      element: '[data-tour="task-list"], .space-y-3',
      popover: {
        title: '✅ Lista de Tareas',
        description: 'Tus tareas asignadas para esta semana. Marca como completadas, intercambia o solicita feedback.',
        side: 'left',
      }
    },
    {
      element: '[data-tour="task-complete-button"], button:has(.lucide-check)',
      popover: {
        title: '✓ Completar Tarea',
        description: 'Al completar, respondes preguntas generadas por IA sobre lo aprendido. El líder valida después.',
        side: 'top',
      }
    },
    {
      element: '[data-tour="task-swap-button"], button:has(.lucide-refresh-cw)',
      popover: {
        title: '🔄 Intercambiar Tarea',
        description: 'Si algo surge, puedes intercambiar esta tarea por otra similar. Usa tus cambios semanales.',
        side: 'top',
      }
    },
    {
      element: '[data-tour="weekly-agenda"]',
      popover: {
        title: '📅 Agenda Semanal',
        description: 'Vista de tu semana con tareas organizadas por día y hora según tu disponibilidad.',
        side: 'left',
      }
    },
    {
      element: '[data-tour="smart-alerts"]',
      popover: {
        title: '🔔 Alertas Inteligentes',
        description: 'IA detecta problemas: leads estancados, métricas bajas, tareas sin validar, deadlines cercanos.',
        side: 'left',
      }
    },
    {
      element: '[data-tour="team-progress"]',
      popover: {
        title: '👥 Progreso del Equipo',
        description: 'Barra de progreso colectivo. Si el equipo completa >80% de tareas, todos ganan bonus de puntos.',
        side: 'bottom',
      }
    },
    {
      popover: {
        title: '🎉 Dashboard Completo',
        description: 'Ya conoces el Dashboard: stats, countdown, tareas, agenda, alertas y progreso. ¡A trabajar!',
      }
    }
  ];

  // ============================================
  // 🎯 CRM PIPELINE TOUR (10 pasos)
  // ============================================
  const getCRMPipelineTour = (driverObj: ReturnType<typeof driver>): DriveStep[] => [
    {
      popover: {
        title: '📊 Pipeline de Ventas',
        description: 'Vamos a mostrarte cómo gestionar tus oportunidades de venta con un ejemplo real.',
      }
    },
    {
      element: '#pipeline-columns, [data-tour="pipeline-columns"]',
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
      element: '[data-action="create-lead"], [data-tour="create-lead-button"]',
      popover: {
        title: '➕ Añadir nuevos leads',
        description: 'Haz clic aquí para crear leads manualmente o importar desde CSV/Excel.',
        side: 'bottom',
      }
    },
    {
      popover: {
        title: '📊 Estadísticas del Pipeline',
        description: 'En la parte superior ves valor total, leads por etapa, y conversión. Se actualiza automáticamente.',
      }
    },
    {
      popover: {
        title: '🎉 ¡Pipeline dominado!',
        description: 'Ya sabes crear leads, moverlos entre etapas y ver estadísticas. ¡Mantén tu pipeline actualizado!',
      }
    }
  ];

  // ============================================
  // 💼 CRM HUB TOUR (10 pasos)
  // ============================================
  const getCRMHubTour = (driverObj: ReturnType<typeof driver>): DriveStep[] => [
    {
      popover: {
        title: '💼 CRM Hub - Centro de Ventas',
        description: 'Tu centro de control para gestionar leads, pipeline, forecasts y análisis de ventas.',
      }
    },
    {
      element: '#crm-new-lead-button, [data-tour="create-lead-button"]',
      popover: {
        title: '➕ Añadir un Lead',
        description: 'Crea leads con: nombre, empresa, email, teléfono, valor estimado, prioridad y etapa.',
        side: 'bottom',
      }
    },
    {
      element: '#crm-filters-card, [data-tour="filters-panel"]',
      popover: {
        title: '🔍 Filtros de Búsqueda',
        description: 'Filtra por nombre, empresa, estado (Nuevo/Contactado/Calificado), tipo (🔥 Caliente, 🌡️ Templado, ❄️ Frío).',
        side: 'top',
      }
    },
    {
      element: '.grid.grid-cols-1.md\\:grid-cols-4.gap-4, [data-tour="crm-stats"]',
      popover: {
        title: '📊 Estadísticas Globales',
        description: 'Total Leads, Pipeline Total (valor estimado), Leads Calientes 🔥, y Ganados ✅.',
        side: 'bottom',
      }
    },
    {
      element: '#crm-individual-stats, [data-tour="team-leaderboard"]',
      popover: {
        title: '👤 Estadísticas Individuales',
        description: 'Rendimiento por miembro: leads creados, tasa de conversión, valor pipeline y ganados.',
        side: 'top',
      }
    },
    {
      element: 'button:has(.lucide-trending-up), [data-tour="action-pipeline"]',
      popover: {
        title: '📈 Vista Pipeline',
        description: 'Kanban visual con drag & drop para mover leads entre etapas.',
        side: 'left',
      }
    },
    {
      element: '[data-tour="recent-activities"]',
      popover: {
        title: '📱 Actividades Recientes',
        description: 'Últimas interacciones: llamadas, emails, meetings, cambios de etapa con timestamps.',
        side: 'left',
      }
    },
    {
      element: '[data-tour="conversion-funnel"]',
      popover: {
        title: '🔄 Embudo de Conversión',
        description: 'Visualización del funnel: leads en cada etapa, % de conversión, cuellos de botella.',
        side: 'top',
      }
    },
    {
      popover: {
        title: '🎉 CRM Hub Completo',
        description: 'Ya dominas el CRM: stats globales, filtros, actividades, leaderboard y funnel.',
      }
    }
  ];

  // ============================================
  // 📋 CRM LEADS TOUR (12 pasos)
  // ============================================
  const getCRMLeadsTour = (driverObj: ReturnType<typeof driver>): DriveStep[] => [
    {
      popover: {
        title: '📋 Gestión de Leads',
        description: 'Lista completa de oportunidades con filtros avanzados, scoring automático y acciones masivas.',
      }
    },
    {
      popover: {
        title: '📋 ¿Qué es un Lead?',
        description: 'Persona u organización interesada en tu producto. Guardas: nombre, empresa, email, valor, prioridad, etapa.',
      }
    },
    {
      element: '[data-tour="create-lead-button"], .justify-end > button',
      popover: {
        title: '➕ Crear Lead',
        description: 'Añade leads: nombre, empresa, email, teléfono, valor, fuente, productos de interés.',
        side: 'right',
      }
    },
    {
      element: '[data-tour="import-leads-button"]',
      popover: {
        title: '📥 Importar Leads',
        description: 'Importa múltiples leads desde CSV o Excel. Mapeo automático de columnas.',
        side: 'right',
      }
    },
    {
      element: '[data-tour="filters-panel"], #crm-filters-card',
      popover: {
        title: '🔍 Filtros Avanzados',
        description: 'Filtra por: tipo (hot/warm/cold), score (A/B/C/D), fuente, etapa, valor, fecha.',
        side: 'left',
      }
    },
    {
      element: '[data-tour="leads-table"]',
      popover: {
        title: '📊 Tabla de Leads',
        description: 'Columnas: nombre, empresa, valor, score, tipo, etapa, asignado, última actividad.',
        side: 'top',
      }
    },
    {
      element: '[data-tour="lead-actions"]',
      popover: {
        title: '⚡ Acciones de Lead',
        description: 'Ver detalle, editar, cambiar etapa, añadir actividad, convertir a ganado, eliminar.',
        side: 'left',
      }
    },
    {
      element: '[data-tour="activity-log"]',
      popover: {
        title: '📱 Log de Actividades',
        description: 'Timeline de interacciones: llamadas 📞, emails ✉️, meetings 🤝, cambios 🔄.',
        side: 'right',
      }
    },
    {
      element: '[data-tour="bulk-actions"]',
      popover: {
        title: '🔢 Acciones Masivas',
        description: 'Selecciona múltiples leads: asignar en lote, cambiar etapa, exportar, eliminar.',
        side: 'top',
      }
    },
    {
      element: '[data-tour="export-button"], button:has(.lucide-download)',
      popover: {
        title: '📥 Exportar Leads',
        description: 'Descarga en CSV (Starter) o Excel (Professional+) con todos los campos.',
        side: 'bottom',
      }
    },
    {
      popover: {
        title: '🎉 Gestión de Leads Completa',
        description: 'Dominas: crear, importar, filtrar, ver detalles, actividades, acciones masivas y exportar.',
      }
    }
  ];

  // ============================================
  // 🎯 OKRs TOUR (10 pasos)
  // ============================================
  const getOKRsTour = (driverObj: ReturnType<typeof driver>): DriveStep[] => [
    {
      popover: {
        title: '🎯 Objetivos y Resultados Clave (OKRs)',
        description: 'Los OKRs te ayudan a definir y medir objetivos ambiciosos trimestrales.',
      }
    },
    {
      element: '[data-tour="okr-list"], .space-y-4',
      popover: {
        title: '📋 Lista de Objetivos',
        description: 'Cada tarjeta es un Objetivo con sus Key Results. Puedes tener múltiples OKRs activos.',
        side: 'top',
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
    },
    {
      element: '[data-tour="okr-create-button"]',
      popover: {
        title: '➕ Crear Nuevo OKR',
        description: 'Define el objetivo, trimestre, y hasta 5 Key Results con métricas específicas.',
        side: 'bottom',
      }
    },
    {
      popover: {
        title: '🎉 OKRs Dominados',
        description: 'Ya sabes crear objetivos, definir Key Results y actualizar progreso. ¡A cumplir metas!',
      }
    }
  ];

  // ============================================
  // 💰 FINANCIAL TOUR (14 pasos)
  // ============================================
  const getFinancialTour = (driverObj: ReturnType<typeof driver>): DriveStep[] => [
    {
      popover: {
        title: '💰 Control Financiero',
        description: 'Gestiona ingresos, gastos y analiza la salud financiera de tu negocio en tiempo real.',
      }
    },
    {
      element: '[data-metric="revenue"], [data-tour="financial-summary"]',
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
      element: '#revenue-by-product-chart, [data-tour="revenue-chart"]',
      popover: {
        title: '📈 Ingresos por Producto',
        description: 'Gráfico de barras mostrando qué productos generan más ingresos.',
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
      element: '#expenses-by-category-chart, [data-tour="expenses-chart"]',
      popover: {
        title: '🥧 Gastos por Categoría',
        description: 'Gráfico circular que muestra dónde gastas más: producción, marketing, salarios.',
        side: 'top',
      }
    },
    {
      popover: {
        title: '🎯 Calculando ROI...',
        description: 'El sistema calcula automáticamente tu ROI con los ingresos y gastos.',
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
      element: '#marketing-roi-table, [data-tour="roi-table"]',
      popover: {
        title: '📊 ROI por Canal de Marketing',
        description: 'Tabla detallada mostrando ROI, CAC, conversión y revenue por canal.',
        side: 'top',
      }
    },
    {
      element: '[data-metric="runway"]',
      popover: {
        title: '⏰ Runway: ¿Cuánto tiempo tienes?',
        description: 'Basado en tu caja y burn rate, cuántos meses puedes operar sin nuevos ingresos.',
        side: 'bottom',
      }
    },
    {
      element: '#financial-history-button, [data-tour="history-button"]',
      popover: {
        title: '📜 Historial Completo',
        description: 'Accede al historial de transacciones: ingresos, gastos y marketing.',
        side: 'left',
      }
    },
    {
      popover: {
        title: '🎉 ¡Listo!',
        description: 'Panel financiero dominado: transacciones, gráficos, ROI, runway e historial.',
      }
    }
  ];

  // ============================================
  // 📊 BUSINESS METRICS TOUR (12 pasos)
  // ============================================
  const getBusinessMetricsTour = (driverObj: ReturnType<typeof driver>): DriveStep[] => [
    {
      popover: {
        title: '📊 Métricas de Negocio (KPIs)',
        description: 'Trackea 20+ KPIs clave: ventas, clientes, operaciones, marketing. Todo en un dashboard.',
      }
    },
    {
      element: '[data-tour="kpi-categories"], .tabs-list',
      popover: {
        title: '🗂️ Categorías de KPIs',
        description: '5 categorías: Ventas, Clientes, Satisfacción, Operaciones, Marketing. Navega entre ellas.',
        side: 'top',
      }
    },
    {
      element: '#metrics-grid, [data-tour="metrics-grid"]',
      popover: {
        title: '🎯 Panel de Métricas',
        description: 'Todas tus métricas organizadas por categorías para facilitar su registro.',
        side: 'top',
      }
    },
    {
      element: '[data-tour="add-metric-button"]',
      popover: {
        title: '➕ Registrar KPI',
        description: 'Añade valores: revenue, órdenes, CAC, LTV, NPS, tasa de conversión.',
        side: 'right',
      }
    },
    {
      popover: {
        title: '💰 Demo: Rellenando KPI de Ventas...',
        description: 'Observa cómo se registra €25,650 con 42 pedidos y ticket €610.',
        onNextClick: () => {
          fillAndAnimateSalesKPI();
          setTimeout(() => driverObj.moveNext(), 4000);
        }
      }
    },
    {
      element: 'input[id*="revenue"], [data-tour="kpi-revenue"]',
      popover: {
        title: '✅ Ventas registradas',
        description: 'Los campos se llenan automáticamente. En producción, introduces tus datos reales.',
        side: 'right',
      }
    },
    {
      element: '[data-tour="kpi-table"]',
      popover: {
        title: '📋 Tabla de KPIs',
        description: 'Lista con último valor, fecha, cambio vs periodo anterior (%, ↑↓).',
        side: 'top',
      }
    },
    {
      element: '[data-tour="kpi-charts"]',
      popover: {
        title: '📊 Gráficos de Evolución',
        description: 'Visualiza la evolución temporal: línea para tendencias, barras para comparaciones.',
        side: 'left',
      }
    },
    {
      element: '[data-tour="kpi-benchmarks"]',
      popover: {
        title: '🎯 Benchmarking (Professional+)',
        description: 'Compara tus KPIs contra promedios de tu industria: SaaS, E-commerce, B2B.',
        side: 'bottom',
      }
    },
    {
      element: '.justify-end > button:has(.lucide-download), [data-tour="export-metrics"]',
      popover: {
        title: '📥 Exportar Métricas',
        description: 'Descarga histórico completo en Excel con gráficos para reportes.',
        side: 'bottom',
      }
    },
    {
      popover: {
        title: '💾 Guardando cambios...',
        description: 'Después de actualizar, haz clic en "Guardar Métricas" para registrarlas.',
        onNextClick: () => {
          highlightSaveButton();
          setTimeout(() => driverObj.moveNext(), 2000);
        }
      }
    },
    {
      popover: {
        title: '🎉 KPIs Dominados',
        description: 'Ya sabes trackear KPIs: categorías, registro, gráficos, benchmarking y exportación.',
      }
    }
  ];

  // ============================================
  // 🤖 AI ANALYSIS TOUR (15 pasos)
  // ============================================
  const getAIAnalysisTour = (driverObj: ReturnType<typeof driver>): DriveStep[] => [
    {
      popover: {
        title: '🤖 Análisis con Inteligencia Artificial',
        description: 'La IA analiza 90 días de datos: métricas, finanzas, CRM, OKRs, tareas. Genera insights accionables.',
      }
    },
    {
      element: '[data-tour="run-analysis-button"], button:has(.lucide-brain)',
      popover: {
        title: '🚀 Ejecutar Análisis',
        description: 'Haz clic para iniciar el análisis completo. Toma 30-60 segundos procesar todos tus datos.',
        side: 'bottom',
      }
    },
    {
      popover: {
        title: '⏳ Procesando Datos...',
        description: 'La IA analiza: transacciones financieras, leads, OKRs, tareas del equipo, métricas de negocio.',
      }
    },
    {
      element: '[data-tour="analysis-score"], [data-tour="financial-health"]',
      popover: {
        title: '📊 Puntuación General',
        description: 'Score 0-100 de salud empresarial. Verde (>70)=saludable, Amarillo (40-70)=atención, Rojo (<40)=crítico.',
        side: 'bottom',
      }
    },
    {
      element: '[data-tour="financial-health"]',
      popover: {
        title: '💰 Salud Financiera',
        description: 'Análisis de: ingresos, gastos, margen, burn rate, runway. Con alertas específicas.',
        side: 'left',
      }
    },
    {
      element: '[data-tour="financial-metrics"]',
      popover: {
        title: '📈 Métricas Financieras Clave',
        description: 'Runway (meses), Burn Rate (gasto mensual), Margen Neto (%), ROI Marketing. Con tendencia ↑↓.',
        side: 'right',
      }
    },
    {
      element: '[data-tour="financial-alerts"]',
      popover: {
        title: '⚠️ Alertas Financieras',
        description: 'Problemas detectados: "Runway < 6 meses", "Burn rate aumentó 25%", "Margen cayó 10pts".',
        side: 'bottom',
      }
    },
    {
      element: '[data-tour="team-performance"]',
      popover: {
        title: '👥 Rendimiento del Equipo',
        description: 'Análisis de productividad: tasa de completación, top performers, áreas de mejora.',
        side: 'left',
      }
    },
    {
      element: '[data-tour="top-performers"]',
      popover: {
        title: '🏆 Top Performers',
        description: 'Los 3 miembros con mejor desempeño: más tareas, mejor racha, mayor puntaje. 🥇🥈🥉',
        side: 'bottom',
      }
    },
    {
      element: '[data-tour="honest-feedback"]',
      popover: {
        title: '💬 Feedback Honesto',
        description: 'La IA te dice la verdad sin suavizar: problemas reales, métricas preocupantes.',
        side: 'left',
      }
    },
    {
      element: '[data-tour="critical-issues"]',
      popover: {
        title: '🚨 Problemas Críticos',
        description: 'Issues urgentes: "CAC > LTV", "Solo 3 meses de runway", "50% de leads sin seguimiento".',
        side: 'right',
      }
    },
    {
      element: '[data-tour="recommendations"]',
      popover: {
        title: '✅ Recomendaciones Accionables',
        description: 'Acciones específicas: "Reducir gasto en Google Ads 30%", "Aumentar precios 15%".',
        side: 'bottom',
      }
    },
    {
      element: '[data-tour="growth-projections"]',
      popover: {
        title: '📈 Proyecciones de Crecimiento',
        description: '3 escenarios basados en histórico: Conservador (50%), Realista (70%), Optimista (90%).',
        side: 'right',
      }
    },
    {
      element: '[data-tour="export-analysis"], button:has(.lucide-download)',
      popover: {
        title: '📥 Exportar Análisis',
        description: 'Descarga el análisis completo en PDF profesional. Perfecto para presentar a inversores.',
        side: 'bottom',
      }
    },
    {
      popover: {
        title: '🎉 Análisis IA Completo',
        description: 'Ya sabes usar el análisis IA: ejecutar, revisar salud financiera, rendimiento, feedback, proyecciones.',
      }
    }
  ];

  // ============================================
  // 👤 BUYER PERSONA TOUR (8 pasos)
  // ============================================
  const getBuyerPersonaTour = (driverObj: ReturnType<typeof driver>): DriveStep[] => [
    {
      popover: {
        title: '👤 Buyer Persona',
        description: 'Define el perfil ideal de tu cliente para enfocar mejor tu estrategia comercial.',
      }
    },
    {
      element: '[data-tour="persona-overview"]',
      popover: {
        title: '📋 Resumen del Persona',
        description: 'Vista general: nombre ficticio, rol, industria, y resumen ejecutivo del perfil.',
        side: 'top',
      }
    },
    {
      element: '#persona-demographics, [data-tour="persona-demographics"]',
      popover: {
        title: '📊 Datos demográficos',
        description: 'Edad, ubicación, nivel educativo, ingresos, puesto de trabajo, tamaño de empresa.',
        side: 'right',
      }
    },
    {
      element: '#persona-psychographics, [data-tour="persona-psychographics"]',
      popover: {
        title: '🧠 Psicografía',
        description: 'Motivaciones, objetivos profesionales, miedos y frustraciones de tu cliente ideal.',
        side: 'right',
      }
    },
    {
      element: '[data-tour="persona-painpoints"]',
      popover: {
        title: '😣 Pain Points',
        description: 'Problemas principales que tu producto/servicio resuelve para este cliente.',
        side: 'left',
      }
    },
    {
      element: '[data-tour="persona-channels"]',
      popover: {
        title: '📱 Canales Preferidos',
        description: 'Dónde busca información: LinkedIn, blogs, podcasts, eventos, referidos.',
        side: 'bottom',
      }
    },
    {
      element: '[data-tour="persona-objections"]',
      popover: {
        title: '🚧 Objeciones Comunes',
        description: 'Las razones típicas por las que NO compra y cómo superarlas.',
        side: 'top',
      }
    },
    {
      popover: {
        title: '🎉 Buyer Persona Completo',
        description: 'Ya conoces todos los elementos del Buyer Persona. Úsalo para enfocar tu marketing y ventas.',
      }
    }
  ];

  // ============================================
  // 📅 AGENDA TOUR (12 pasos)
  // ============================================
  const getAgendaTour = (driverObj: ReturnType<typeof driver>): DriveStep[] => [
    {
      popover: {
        title: '📅 Agenda Semanal Inteligente',
        description: 'Sistema automático que coordina tus tareas con el equipo según tu disponibilidad.',
      }
    },
    {
      popover: {
        title: '⏰ ¿Cómo se genera?',
        description: 'Cada lunes antes de las 13:00, configuras tu disponibilidad. El sistema genera agendas coordinadas.',
      }
    },
    {
      element: '[data-tour="availability-config"], button.bg-gradient-primary',
      popover: {
        title: '🎛️ Configuración de Disponibilidad',
        description: 'Indica tus horarios disponibles: horas por día, bloques de tiempo, preferencias.',
        side: 'bottom',
      }
    },
    {
      popover: {
        title: '📋 Cuestionario de Disponibilidad',
        description: '¿Cuántas horas puedes trabajar cada día? ¿Prefieres mañanas o tardes? ¿Algún bloque bloqueado?',
      }
    },
    {
      element: '[data-tour="calendar-view"]',
      popover: {
        title: '📆 Vista de Calendario',
        description: 'Visualiza tu semana con bloques de tiempo: tareas asignadas, duración estimada, colaboraciones.',
        side: 'top',
      }
    },
    {
      element: '[data-tour="day-block"]',
      popover: {
        title: '📆 Bloques Diarios',
        description: 'Cada día muestra: tareas asignadas, horas totales, y colaboraciones con compañeros.',
        side: 'top',
      }
    },
    {
      popover: {
        title: '🔄 Generación Automática',
        description: 'Una vez todos completan disponibilidad, el sistema asigna tareas según prioridad y dependencias.',
      }
    },
    {
      element: '[data-tour="reschedule-button"]',
      popover: {
        title: '🔀 Sugerencias de Cambio',
        description: 'Si un bloque no te conviene, puedes sugerir cambios. El sistema busca slots alternativos.',
        side: 'right',
      }
    },
    {
      element: '[data-tour="google-calendar"]',
      popover: {
        title: '🔗 Integración con Google Calendar',
        description: 'Sincroniza tu agenda con Google Calendar para ver todo en un solo lugar.',
        side: 'left',
      }
    },
    {
      popover: {
        title: '✅ Vista Previa vs. Final',
        description: 'Antes del miércoles 13:30 ves un "preview" editable. Después, agenda final sin modificaciones.',
      }
    },
    {
      popover: {
        title: '🎉 ¡Perfecto!',
        description: 'Agenda Semanal dominada: disponibilidad → generación automática → coordinación → ejecución.',
      }
    }
  ];

  // ============================================
  // 🏆 GAMIFICATION TOUR (12 pasos)
  // ============================================
  const getGamificationTour = (driverObj: ReturnType<typeof driver>): DriveStep[] => [
    {
      popover: {
        title: '🏆 Sistema de Gamificación',
        description: 'Gana puntos, badges y compite con tu equipo. Sistema de recompensas motivacional.',
      }
    },
    {
      element: '.grid.grid-cols-1.md\\:grid-cols-4 > .shadow-card:first-child, [data-tour="total-points"]',
      popover: {
        title: '⭐ Puntos Totales',
        description: 'Acumulas puntos completando tareas, validando trabajo y logrando objetivos.',
        side: 'bottom',
      }
    },
    {
      element: '.grid.grid-cols-1.md\\:grid-cols-4 > .shadow-card:nth-child(2), [data-tour="streak"]',
      popover: {
        title: '🔥 Racha Actual',
        description: 'Semanas consecutivas completando todas tus tareas. Mantén la racha para badges especiales.',
        side: 'bottom',
      }
    },
    {
      element: '.grid.grid-cols-1.md\\:grid-cols-4 > .shadow-card:nth-child(3), [data-tour="badges-count"]',
      popover: {
        title: '🎖️ Badges Desbloqueados',
        description: 'Medallas por logros: Primera Tarea, Racha de 5 Semanas, 100 Tareas Completadas.',
        side: 'bottom',
      }
    },
    {
      element: '.grid.grid-cols-1.md\\:grid-cols-4 > .shadow-card:nth-child(4), [data-tour="ranking"]',
      popover: {
        title: '👑 Tu Ranking',
        description: 'Posición en el leaderboard. Los 3 primeros obtienen reconocimiento especial 🥇🥈🥉.',
        side: 'bottom',
      }
    },
    {
      element: '[data-tour="badges-collection"], .shadow-card:has(.grid.grid-cols-2)',
      popover: {
        title: '🎖️ Colección de Badges',
        description: 'Por rareza: Común (gris), Raro (azul), Épico (morado), Legendario (dorado).',
        side: 'top',
      }
    },
    {
      popover: {
        title: '🏅 ¿Cómo ganar badges?',
        description: '"Primera Tarea" (1 tarea), "Imparable" (racha 10 semanas), "Centurión" (100 tareas), "Líder Nato" (50 validaciones).',
      }
    },
    {
      element: '[data-tour="leaderboard"]',
      popover: {
        title: '🏆 Leaderboard del Equipo',
        description: 'Ranking completo con puntos, tareas y rachas de cada miembro.',
        side: 'left',
      }
    },
    {
      element: '[data-tour="points-history"]',
      popover: {
        title: '📜 Historial de Puntos',
        description: 'Últimas acciones que te dieron puntos: "Tarea completada +10pts", "Validación +15pts".',
        side: 'top',
      }
    },
    {
      popover: {
        title: '🎯 Estrategia de Puntos',
        description: 'Completa a tiempo (10-20pts), mantén rachas (bonus x2), valida trabajo (+5-15pts), objetivos de equipo (bonus).',
      }
    },
    {
      popover: {
        title: '🎉 ¡A jugar!',
        description: 'Sistema completo: puntos, badges, rachas, leaderboard. Compite sanamente y celebra logros.',
      }
    }
  ];

  // ============================================
  // 🛠️ HERRAMIENTAS HUB TOUR (10 pasos)
  // ============================================
  const getHerramientasHubTour = (driverObj: ReturnType<typeof driver>): DriveStep[] => [
    {
      popover: {
        title: '🛠️ Herramientas Estratégicas',
        description: '8 herramientas generadas con IA personalizada para tu negocio: Buyer Persona, Lead Scoring, Growth Model...',
      }
    },
    {
      element: '[data-tour="tools-grid"], .grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4',
      popover: {
        title: '📊 Grid de Herramientas',
        description: '8 tarjetas con herramientas disponibles. Cada una se genera usando datos de tu onboarding.',
        side: 'top',
      }
    },
    {
      element: '[data-tour="tool-buyer-persona"]',
      popover: {
        title: '👤 Buyer Persona',
        description: 'Perfil detallado de tu cliente ideal: demografía, psicografía, pain points, canales, objeciones.',
        side: 'bottom',
      }
    },
    {
      element: '[data-tour="tool-lead-scoring"]',
      popover: {
        title: '🎯 Lead Scoring',
        description: 'Sistema de puntuación personalizado basado en tu industria, ticket promedio, ciclo de venta.',
        side: 'bottom',
      }
    },
    {
      element: '[data-tour="tool-growth-model"]',
      popover: {
        title: '📈 Growth Model',
        description: 'Modelo de crecimiento con proyecciones, palancas de growth, métricas clave a trackear.',
        side: 'bottom',
      }
    },
    {
      element: '[data-tour="tool-customer-journey"]',
      popover: {
        title: '🗺️ Customer Journey',
        description: 'Mapeo del viaje: awareness → consideration → decision → retention. Con touchpoints.',
        side: 'bottom',
      }
    },
    {
      element: '[data-tour="generate-button"]',
      popover: {
        title: '✨ Generar con IA',
        description: 'La IA usa tus datos de onboarding para generar contenido personalizado. Solo admin puede generar.',
        side: 'right',
      }
    },
    {
      element: '[data-tour="tool-content"]',
      popover: {
        title: '📄 Contenido de Herramienta',
        description: 'Cada herramienta tiene 5-10 secciones con texto, listas, tablas. Contenido profesional y accionable.',
        side: 'left',
      }
    },
    {
      element: '[data-tour="export-tool-button"], button:has(.lucide-download)',
      popover: {
        title: '📥 Exportar Herramienta',
        description: 'Descarga cada herramienta en PDF profesional. Perfecto para compartir con equipo.',
        side: 'bottom',
      }
    },
    {
      popover: {
        title: '🎉 Herramientas Dominadas',
        description: 'Ya sabes usar las herramientas: explorar grid, generar con IA, ver contenido, exportar PDF.',
      }
    }
  ];

  // ============================================
  // 🚀 START TOUR FUNCTION
  // ============================================
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
      case 'dashboard':
        steps = getDashboardTour(driverObj);
        break;
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
      case 'herramientas-hub':
        steps = getHerramientasHubTour(driverObj);
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
