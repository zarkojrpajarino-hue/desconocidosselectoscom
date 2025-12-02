import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useNavigate } from 'react-router-dom';
import { TOUR_DEMO_DATA } from '@/lib/tourData';
import { 
  createDemoLead, 
  animateDragDrop, 
  createDemoOKR, 
  animateKRProgress,
  createDemoFinancialRecord,
  animateMetricsCharts,
  cleanupDemoData,
  fillFormDemo
} from '@/lib/demoActions';

export const useSectionTour = (sectionId: string) => {
  const navigate = useNavigate();

  const getCRMPipelineTour = (): DriveStep[] => [
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
        onNextClick: function() {
          createDemoLead();
          setTimeout(() => (this as any).moveNext(), 1000);
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
        onNextClick: function() {
          animateDragDrop('demo-lead-1', 'descubrimiento', 'calificación');
          setTimeout(() => (this as any).moveNext(), 2000);
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

  const getOKRsTour = (): DriveStep[] => [
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
        onNextClick: function() {
          createDemoOKR();
          setTimeout(() => (this as any).moveNext(), 1000);
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
        onNextClick: function() {
          animateKRProgress('demo-kr-1', 32, 38);
          setTimeout(() => (this as any).moveNext(), 2000);
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

  const getFinancialTour = (): DriveStep[] => [
    {
      popover: {
        title: '💰 Control Financiero',
        description: 'Gestiona ingresos, gastos y analiza la salud financiera de tu negocio.',
      }
    },
    {
      element: '#financial-summary',
      popover: {
        title: '📊 Resumen financiero',
        description: 'Vista general de ingresos, gastos, margen bruto y beneficio neto del mes.',
        side: 'top',
      }
    },
    {
      popover: {
        title: '💵 Añadiendo ingreso de ejemplo...',
        description: 'Mira cómo registrar ingresos recurrentes',
        onNextClick: function() {
          createDemoFinancialRecord();
          setTimeout(() => (this as any).moveNext(), 1000);
        }
      }
    },
    {
      element: '#demo-financial-1',
      popover: {
        title: '✅ Ingreso registrado',
        description: `€${TOUR_DEMO_DATA.financialRecord.amount.toLocaleString()} - ${TOUR_DEMO_DATA.financialRecord.description}`,
        side: 'right',
      }
    },
    {
      element: '#financial-chart',
      popover: {
        title: '📈 Gráficos automáticos',
        description: 'Visualiza la evolución de ingresos y gastos mes a mes con gráficos interactivos.',
        side: 'bottom',
      }
    }
  ];

  const getBusinessMetricsTour = (): DriveStep[] => [
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
        onNextClick: function() {
          animateMetricsCharts();
          setTimeout(() => (this as any).moveNext(), 1500);
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

  const getDashboardTour = (): DriveStep[] => [
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

  const getAIAnalysisTour = (): DriveStep[] => [
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

  const getBuyerPersonaTour = (): DriveStep[] => [
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

  const getTourSteps = (sectionId: string) => {
    switch(sectionId) {
      case 'crm-pipeline':
        return getCRMPipelineTour();
      case 'okrs':
        return getOKRsTour();
      case 'financial':
        return getFinancialTour();
      case 'business-metrics':
        return getBusinessMetricsTour();
      case 'dashboard':
        return getDashboardTour();
      case 'ai-analysis':
        return getAIAnalysisTour();
      case 'buyer-persona':
        return getBuyerPersonaTour();
      default:
        return [{
          popover: {
            title: '🎯 Tour de la sección',
            description: 'Este tour te mostrará cómo usar esta sección paso a paso.',
          }
        }];
    }
  };
  
  const startSectionTour = () => {
    const steps = getTourSteps(sectionId);
    
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
      steps,
      onDestroyStarted: () => {
        cleanupDemoData();
        if (!driverObj.hasNextStep()) {
          // Tour completado
          console.log(`Tour de ${sectionId} completado`);
        }
        driverObj.destroy();
      }
    });
    
    driverObj.drive();
  };
  
  return { startSectionTour };
};
