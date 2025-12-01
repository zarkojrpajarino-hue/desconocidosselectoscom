import { useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const TOUR_COMPLETED_KEY = 'onboarding_tour_completed';

export const useOnboardingTour = () => {
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
            title: '🏠 Panel Principal',
            description: 'Desde aquí ves tus tareas de la semana, estadísticas y progreso. Es tu centro de control diario.',
          }
        },
        {
          popover: {
            title: '📊 CRM y Gestión de Leads',
            description: 'La plataforma incluye un CRM completo donde puedes gestionar tu pipeline de ventas, crear leads, asignar responsables y hacer seguimiento de oportunidades. Navega al menú "CRM y Leads" para explorarlo.',
          }
        },
        {
          popover: {
            title: '🎯 OKRs (Objetivos y Resultados Clave)',
            description: 'Define objetivos trimestrales con resultados medibles. Alinea a tu equipo con metas claras. Disponible en el menú "OKRs".',
          }
        },
        {
          popover: {
            title: '📈 Métricas de Negocio',
            description: 'Registra y analiza KPIs clave: ventas, conversión, CAC, NPS y más. Toma decisiones basadas en datos. Accede desde "Métricas de Negocio".',
          }
        },
        {
          popover: {
            title: '🛠️ Herramientas Estratégicas',
            description: 'Usa herramientas como Buyer Persona, Customer Journey, Growth Model y Lead Scoring para optimizar tu estrategia. En el menú "Herramientas".',
          }
        },
        {
          popover: {
            title: '💰 Finanzas',
            description: 'Lleva control de ingresos, gastos, márgenes y proyecciones financieras. Disponible en "Finanzas".',
          }
        },
        {
          popover: {
            title: '🤖 Análisis con IA',
            description: 'La plataforma analiza tus datos y te da recomendaciones personalizadas para mejorar. Encuentra esta función en "Análisis con IA".',
          }
        },
        {
          popover: {
            title: '🏆 Gamificación',
            description: 'Gana puntos, desbloquea badges y compite con tu equipo. Mantén la motivación alta con el sistema de recompensas.',
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
