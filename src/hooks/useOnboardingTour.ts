import { useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useNavigate } from 'react-router-dom';

const TOUR_COMPLETED_KEY = 'onboarding_tour_completed';

export const useOnboardingTour = () => {
  const navigate = useNavigate();
  const [isTourCompleted, setIsTourCompleted] = useState<boolean>(() => {
    return localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';
  });

  const startTour = () => {
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
            description: 'Te voy a mostrar cómo funciona toda la plataforma. Este tour te ayudará a entender cada sección y sacar el máximo provecho de las herramientas disponibles.',
          }
        },
        {
          element: '#user-profile-section',
          popover: {
            title: '👤 Tu Perfil y Organizaciones',
            description: 'Aquí puedes ver tu información y cambiar entre organizaciones. Accede a todas las empresas donde tienes acceso con un solo clic. También puedes iniciar este tour cuando quieras.',
            side: 'bottom',
            align: 'center'
          }
        },
        {
          popover: {
            title: '📊 Dashboard de Trabajo',
            description: 'Tu centro de control diario. Vamos a verlo.',
            onNextClick: () => {
              navigate('/dashboard/home');
              driverObj.moveNext();
            }
          }
        },
        {
          element: '#sidebar',
          popover: {
            title: '🧭 Navegación Principal',
            description: 'Desde esta barra lateral accedes a todas las secciones de la plataforma.',
            side: 'right',
            align: 'center'
          }
        },
        {
          popover: {
            title: '📊 CRM y Gestión de Leads',
            description: 'Ahora vamos al CRM completo para gestionar tu pipeline de ventas.',
            onNextClick: () => {
              navigate('/crm');
              driverObj.moveNext();
            }
          }
        },
        {
          element: '#crm-tabs',
          popover: {
            title: '📋 Secciones del CRM',
            description: 'Pipeline visual, gestión de leads, y vista individual de tus oportunidades.',
            side: 'bottom',
            align: 'center',
            onNextClick: () => {
              navigate('/crm/pipeline');
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '🎯 Pipeline de Ventas',
            description: 'Arrastra leads entre etapas para gestionar tu embudo de ventas.',
            onNextClick: () => {
              navigate('/metrics-hub');
              driverObj.moveNext();
            }
          }
        },
        {
          element: '#metrics-sections',
          popover: {
            title: '📈 Hub de Métricas',
            description: 'Accede a OKRs, KPIs de negocio y finanzas desde aquí.',
            side: 'bottom',
            align: 'center',
            onNextClick: () => {
              navigate('/okrs');
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '🎯 OKRs',
            description: 'Define objetivos trimestrales con resultados medibles.',
            onNextClick: () => {
              navigate('/business-metrics');
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '📊 Métricas de Negocio',
            description: 'Registra y analiza KPIs clave: ventas, conversión, CAC, NPS y más.',
            onNextClick: () => {
              navigate('/financial');
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '💰 Finanzas',
            description: 'Control completo de ingresos, gastos, márgenes y proyecciones.',
            onNextClick: () => {
              navigate('/herramientas-hub');
              driverObj.moveNext();
            }
          }
        },
        {
          element: '#tools-grid',
          popover: {
            title: '🛠️ Herramientas Estratégicas',
            description: 'Buyer Persona, Customer Journey, Growth Model y más.',
            side: 'top',
            align: 'center',
            onNextClick: () => {
              navigate('/ai-analysis');
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '🤖 Análisis con IA',
            description: 'La IA analiza tus datos y te da recomendaciones personalizadas.',
            onNextClick: () => {
              navigate('/dashboard/gamification');
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '🏆 Gamificación',
            description: 'Gana puntos, desbloquea badges y compite con tu equipo.',
            onNextClick: () => {
              navigate('/home');
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '🎉 ¡Todo Listo!',
            description: 'La plataforma se adapta completamente al contexto de tu empresa. Todas las tareas, métricas y objetivos están personalizados según tu industria y objetivos de negocio. ¡Comienza a usarla ahora!',
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
