import { useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const TOUR_COMPLETED_KEY = 'onboarding_tour_completed';

export const useOnboardingTour = () => {
  const navigate = useNavigate();
  const [isTourCompleted, setIsTourCompleted] = useState<boolean>(() => {
    return localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';
  });

  const simulateAction = (action: string, delay: number = 1500) => {
    return new Promise((resolve) => {
      toast.info(`Demo: ${action}`, { duration: delay });
      setTimeout(resolve, delay);
    });
  };

  const startTour = async () => {
    const driverObj = driver({
      showProgress: true,
      progressText: 'Paso {{current}} de {{total}}',
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Finalizar',
      overlayOpacity: 0.7,
      smoothScroll: true,
      animate: true,
      steps: [
        {
          popover: {
            title: '👋 ¡Bienvenido a tu CRM Inteligente!',
            description: 'Te mostraré todas las funciones con ejemplos interactivos. Verás cómo crear leads, gestionar el pipeline, registrar métricas y más. ¡Todo en modo demostración!',
          }
        },
        {
          popover: {
            title: '📊 Dashboard de Trabajo',
            description: 'Vamos a ver tu centro de control diario...',
            onNextClick: async () => {
              navigate('/dashboard/home');
              await new Promise(resolve => setTimeout(resolve, 500));
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '📈 Panel Principal',
            description: 'Aquí ves tus estadísticas clave: tareas pendientes, leads activos, objetivos del mes. Todo actualizado en tiempo real.',
            onNextClick: async () => {
              await simulateAction('Destacando tarjetas de métricas...');
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '📊 Gestión de Leads - CRM',
            description: 'Ahora veremos cómo gestionar tus oportunidades de venta...',
            onNextClick: async () => {
              navigate('/crm/pipeline');
              await new Promise(resolve => setTimeout(resolve, 500));
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '🎯 Pipeline de Ventas',
            description: 'Imagina que tienes un lead "Juan Pérez - Empresa ABC". Arrastrarlo de "Descubrimiento" → "Calificación" → "Propuesta" es así de fácil.',
            onNextClick: async () => {
              await simulateAction('Simulando drag & drop de lead entre columnas...', 2000);
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '➕ Crear Nuevo Lead',
            description: 'Cuando necesites añadir un contacto, pulsas "+ Nuevo Lead", rellenas los datos (nombre, email, empresa, valor estimado) y listo.',
            onNextClick: async () => {
              await simulateAction('Mostrando formulario de creación de lead...', 1500);
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '🎯 OKRs - Objetivos y Resultados Clave',
            description: 'Define tus objetivos trimestrales y mide el progreso...',
            onNextClick: async () => {
              navigate('/okrs');
              await new Promise(resolve => setTimeout(resolve, 500));
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '📊 Ejemplo de OKR',
            description: 'Por ejemplo: "Aumentar ventas Q1 2025" con Key Results como "Cerrar 20 nuevas cuentas" o "Generar €50K MRR". La barra de progreso se actualiza automáticamente.',
            onNextClick: async () => {
              await simulateAction('Actualizando progreso de Key Result...', 2000);
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '📈 Métricas de Negocio',
            description: 'Registra KPIs diarios: ventas, conversión, CAC, NPS...',
            onNextClick: async () => {
              navigate('/business-metrics');
              await new Promise(resolve => setTimeout(resolve, 500));
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '📊 Dashboard de Métricas',
            description: 'Ves gráficos de evolución, comparativas mensuales, tendencias. Los filtros te permiten analizar por periodo o por métrica específica.',
            onNextClick: async () => {
              await simulateAction('Mostrando gráficos de tendencias...', 1500);
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '💰 Panel Financiero',
            description: 'Control total de ingresos, gastos y márgenes...',
            onNextClick: async () => {
              navigate('/financial');
              await new Promise(resolve => setTimeout(resolve, 500));
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '💵 Gestión Financiera',
            description: 'Registra ventas, gastos operativos, inversión en marketing. La plataforma calcula automáticamente márgenes, CAC, runway y proyecciones.',
            onNextClick: async () => {
              await simulateAction('Calculando métricas financieras...', 1500);
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '🛠️ Herramientas Estratégicas',
            description: 'Accede a plantillas y herramientas de crecimiento...',
            onNextClick: async () => {
              navigate('/herramientas-hub');
              await new Promise(resolve => setTimeout(resolve, 500));
              driverObj.moveNext();
            }
          }
        },
        {
          element: '#tools-grid',
          popover: {
            title: '🎨 Herramientas Visuales',
            description: 'Buyer Persona, Customer Journey, Growth Model, Lead Scoring. Todo con plantillas personalizables.',
            side: 'top',
            align: 'center',
            onNextClick: async () => {
              navigate('/ai-analysis');
              await new Promise(resolve => setTimeout(resolve, 500));
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '🤖 Análisis con IA',
            description: 'La inteligencia artificial analiza todos tus datos y genera insights: qué leads priorizar, qué campañas optimizar, proyecciones de cierre.',
            onNextClick: async () => {
              await simulateAction('Generando análisis con IA...', 2000);
              navigate('/dashboard/gamification');
              await new Promise(resolve => setTimeout(resolve, 500));
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '🏆 Gamificación',
            description: 'Gana puntos completando tareas, desbloquea badges por logros, compite con tu equipo en el ranking mensual.',
            onNextClick: async () => {
              navigate('/home');
              await new Promise(resolve => setTimeout(resolve, 500));
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '🎉 ¡Tour Completado!',
            description: 'Ya conoces todas las funciones. La plataforma está personalizada para tu industria y objetivos. Puedes repetir este tour cuando quieras desde el botón "Tour Guiado". ¡Comienza a trabajar!',
          }
        }
      ],
      onDestroyStarted: () => {
        if (!driverObj.hasNextStep()) {
          localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
          setIsTourCompleted(true);
        }
        driverObj.destroy();
      }
    });

    driverObj.drive();
  };

  const restartTour = () => {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    setIsTourCompleted(false);
    startTour();
  };

  return {
    startTour,
    restartTour,
    isTourCompleted
  };
};
