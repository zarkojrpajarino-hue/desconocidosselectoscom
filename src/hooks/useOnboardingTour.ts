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
          element: '#user-profile-section',
          popover: {
            title: '👤 Tu Perfil',
            description: 'Aquí puedes ver tu información y cambiar entre organizaciones. Accede a todas las empresas donde tienes acceso con un solo clic.',
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '#sidebar',
          popover: {
            title: '🧭 Navegación Principal',
            description: 'Desde esta barra lateral puedes navegar entre todas las secciones de la plataforma: Dashboard, CRM, OKRs, Métricas, Herramientas y más.',
            side: 'right',
            align: 'center'
          }
        },
        {
          element: '#leads-section',
          popover: {
            title: '📊 CRM y Pipeline de Ventas',
            description: 'Gestiona tu pipeline de ventas completo. Arrastra leads entre etapas, asigna responsables y haz seguimiento de cada oportunidad comercial.',
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#create-lead-btn',
          popover: {
            title: '➕ Crear Nuevos Leads',
            description: 'Añade nuevos leads manualmente con toda su información o importa múltiples leads desde un archivo CSV para mayor eficiencia.',
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '#tasks-section',
          popover: {
            title: '✅ Sistema de Tareas',
            description: 'Organiza todas las tareas de tu equipo por fases del negocio. Asigna responsables, establece prioridades y da seguimiento al progreso.',
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#okrs-section',
          popover: {
            title: '🎯 OKRs (Objetivos y Resultados Clave)',
            description: 'Define y mide objetivos trimestrales con resultados clave medibles. Alinea a tu equipo con metas claras y trackea el progreso en tiempo real.',
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#automation-section',
          popover: {
            title: '⚡ Automatizaciones',
            description: 'Crea workflows automáticos para tareas repetitivas. Ahorra tiempo automatizando seguimientos, notificaciones y actualizaciones de estado.',
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#reports-section',
          popover: {
            title: '📈 Reportes y Analíticas',
            description: 'Analiza métricas clave de tu negocio: conversión, revenue, ROI, productividad del equipo y más. Toma decisiones basadas en datos.',
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#settings-link',
          popover: {
            title: '⚙️ Configuración',
            description: 'Personaliza tu cuenta, gestiona usuarios, configura integraciones y ajusta las preferencias de la plataforma según las necesidades de tu empresa.',
            side: 'left',
            align: 'center'
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
