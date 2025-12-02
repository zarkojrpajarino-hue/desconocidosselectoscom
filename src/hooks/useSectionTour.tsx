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
  fillFormDemo
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
        description: 'Mide y analiza las métricas más importantes de tu empresa.',
      }
    },
    {
      element: '#metrics-grid',
      popover: {
        title: '🎯 Panel de métricas',
        description: 'Todas tus métricas clave en un solo lugar: CAC, LTV, NPS, Conversión, etc.',
        side: 'top',
      }
    },
    {
      popover: {
        title: '📈 Métricas en tiempo real',
        description: 'Observa cómo las métricas se actualizan dinámicamente',
        onNextClick: () => {
          animateMetricsCharts();
          setTimeout(() => driverObj.moveNext(), 1500);
        }
      }
    },
    {
      element: '#metric-trends',
      popover: {
        title: '📊 Tendencias automáticas',
        description: 'Visualiza si cada métrica mejora (↑), empeora (↓) o se mantiene (→) vs períodos anteriores.',
        side: 'bottom',
      }
    }
  ];

  const getDashboardTour = (driverObj: any): DriveStep[] => [
    {
      popover: {
        title: '🏠 Tu Dashboard',
        description: 'Centro de control con las métricas y tareas más importantes del día.',
      }
    },
    {
      element: '#key-metrics-cards',
      popover: {
        title: '📊 Métricas clave',
        description: 'Leads del mes, tareas pendientes, OKRs activos y más al alcance de un vistazo.',
        side: 'top',
      }
    },
    {
      element: '#recent-activity',
      popover: {
        title: '🔔 Actividad reciente',
        description: 'Mantente al día con las últimas acciones de tu equipo.',
        side: 'right',
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
