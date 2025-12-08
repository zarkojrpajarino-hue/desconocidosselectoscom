import { useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useNavigate } from 'react-router-dom';
import { useDemoMode } from '@/contexts/DemoModeContext';

const TOUR_COMPLETED_KEY = 'onboarding_tour_completed';

// Datos de demostración
const DEMO_LEAD = {
  id: 'demo-lead-1',
  name: 'Juan Pérez',
  email: 'juan@empresaabc.com',
  company: 'Empresa ABC',
  phone: '+34 666 777 888',
  position: 'Director de Compras',
  stage: 'lead',
  pipeline_stage: 'Descubrimiento',
  priority: 'high',
  estimated_value: 15000,
  probability: 25,
  source: 'Referido',
  notes: 'Lead demo creado para el tour interactivo',
  tags: ['demo', 'tour'],
  created_at: new Date().toISOString(),
};

export const useOnboardingTour = () => {
  const navigate = useNavigate();
  const { setDemoMode, setDemoData, clearDemoData } = useDemoMode();
  const [isTourCompleted, setIsTourCompleted] = useState<boolean>(() => {
    return localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';
  });

  // Función para crear elementos visuales en el DOM
  const createDemoLead = () => {
    setDemoData({ leads: [DEMO_LEAD] });
    
    // Inyectar lead demo en la UI
    setTimeout(() => {
      // Buscar la primera columna del pipeline (generalmente "Descubrimiento" o similar)
      const pipelineColumns = document.querySelectorAll('.pipeline-column');
      const firstColumn = pipelineColumns[0];
      
      if (firstColumn) {
        const cardsContainer = firstColumn.querySelector('.space-y-3');
        
        if (cardsContainer) {
          const demoCard = document.createElement('div');
          demoCard.id = 'demo-lead-card';
          demoCard.className = 'demo-lead-card bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg p-4 mb-3 shadow-lg cursor-move';
          demoCard.draggable = true;
          demoCard.innerHTML = `
            <div class="flex items-start justify-between mb-2">
              <div class="flex-1">
                <h3 class="font-bold text-lg text-foreground">${DEMO_LEAD.name}</h3>
                <p class="text-sm text-muted-foreground">${DEMO_LEAD.company}</p>
              </div>
              <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-semibold">DEMO</span>
            </div>
            <div class="space-y-1 text-sm">
              <p class="flex items-center gap-1">📧 ${DEMO_LEAD.email}</p>
              <p class="flex items-center gap-1">💰 €${DEMO_LEAD.estimated_value.toLocaleString()}</p>
              <p class="flex items-center gap-1">📊 Probabilidad: ${DEMO_LEAD.probability}%</p>
              <div class="mt-2 pt-2 border-t border-yellow-300">
                <span class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">High Priority</span>
              </div>
            </div>
          `;
          cardsContainer.insertBefore(demoCard, cardsContainer.firstChild);
        }
      }
    }, 300);
  };

  // Simular arrastre de lead
  const animateDragLead = () => {
    const demoCard = document.getElementById('demo-lead-card');
    if (!demoCard) return;

    const pipelineColumns = document.querySelectorAll('.pipeline-column');
    const secondColumn = pipelineColumns[1]; // Segunda columna (Calificación)
    
    if (!secondColumn) return;

    // Animación de arrastre
    demoCard.style.transition = 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
    demoCard.style.transform = 'translateX(350px) translateY(-20px) rotate(5deg) scale(1.05)';
    demoCard.style.opacity = '0.8';
    demoCard.style.zIndex = '1000';

    setTimeout(() => {
      const secondContainer = secondColumn.querySelector('.space-y-3');
      if (secondContainer && demoCard.parentNode) {
        secondContainer.insertBefore(demoCard, secondContainer.firstChild);
        demoCard.style.transform = 'translateX(0) translateY(0) rotate(0deg) scale(1)';
        demoCard.style.opacity = '1';
        demoCard.style.zIndex = 'auto';
      }
    }, 1200);
  };

  // Mostrar formulario de creación
  const showCreateLeadForm = () => {
    const createButton = document.querySelector('[data-action="create-lead"]') as HTMLButtonElement;
    if (createButton) {
      createButton.click();
      
      // Rellenar campos automáticamente
      setTimeout(() => {
        const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement;
        const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
        const companyInput = document.querySelector('input[name="company"]') as HTMLInputElement;
        
        if (nameInput) nameInput.value = 'María González';
        if (emailInput) emailInput.value = 'maria@empresa.com';
        if (companyInput) companyInput.value = 'Empresa XYZ';
      }, 500);
    }
  };

  // Animar progreso de OKR
  const animateOKRProgress = () => {
    const progressBars = document.querySelectorAll('.okr-progress-bar');
    progressBars.forEach((bar: Element) => {
      const htmlBar = bar as HTMLElement;
      if (htmlBar) {
        const currentValue = parseInt(htmlBar.style.width || '0');
        let targetValue = Math.min(currentValue + 15, 75);
        
        htmlBar.style.transition = 'width 1.5s ease-in-out';
        htmlBar.style.width = `${targetValue}%`;
      }
    });
  };

  // Animar gráficos de métricas
  const animateMetricsCharts = () => {
    const charts = document.querySelectorAll('.recharts-wrapper');
    charts.forEach((chart: Element) => {
      const htmlChart = chart as HTMLElement;
      if (htmlChart) {
        htmlChart.style.animation = 'pulse 2s ease-in-out';
      }
    });
  };

  const startTour = async () => {
    setDemoMode(true);
    
    const driverObj = driver({
      showProgress: true,
      progressText: 'Paso {{current}} de {{total}}',
      nextBtnText: 'Siguiente →',
      prevBtnText: '← Anterior',
      doneBtnText: '✓ Finalizar',
      overlayOpacity: 0.75,
      smoothScroll: true,
      animate: true,
      allowClose: true,
      steps: [
        {
          popover: {
            title: '👋 ¡Bienvenido al Tour Interactivo!',
            description: 'Voy a mostrarte TODAS las funciones con ejemplos REALES. Verás cómo crear leads, arrastrarlos en el pipeline, gestionar métricas y mucho más. Todo funcionando de verdad. ¡Empecemos!',
            side: 'bottom',
            align: 'center'
          }
        },
        {
          popover: {
            title: '🏠 Página Principal',
            description: 'Desde aquí accedes a todas las secciones. Vamos a explorar cada una con ejemplos prácticos.',
            onNextClick: async () => {
              navigate('/dashboard/home');
              await new Promise(resolve => setTimeout(resolve, 800));
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '📊 Dashboard de Trabajo',
            description: 'Tu centro de control. Aquí ves tareas, estadísticas y notificaciones en tiempo real.',
            onNextClick: async () => {
              navigate('/crm/pipeline');
              await new Promise(resolve => setTimeout(resolve, 800));
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '🎯 Pipeline de Ventas - Vamos a crear un lead',
            description: 'Mira, voy a crear un lead demo "Juan Pérez - Empresa ABC" para que veas cómo funciona.',
            onNextClick: async () => {
              createDemoLead();
              await new Promise(resolve => setTimeout(resolve, 1500));
              driverObj.moveNext();
            }
          }
        },
        {
          element: '#demo-lead-card',
          popover: {
            title: '👆 Este es tu Lead Demo',
            description: '¡Ahí está! Lead creado. Ahora fíjate cómo lo arrastro de "Descubrimiento" a "Calificación"...',
            side: 'right',
            align: 'start',
            onNextClick: async () => {
              animateDragLead();
              await new Promise(resolve => setTimeout(resolve, 2000));
              driverObj.moveNext();
            }
          }
        },
        {
          element: '#demo-lead-card',
          popover: {
            title: '✨ ¡Se movió!',
            description: 'Así de fácil gestionas tu pipeline. Arrastra y suelta entre columnas para actualizar el estado de tus leads.',
            side: 'left',
            align: 'start',
            onNextClick: () => {
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '➕ Crear Nuevo Lead',
            description: 'Ahora te muestro cómo crear un lead desde cero. Voy a abrir el formulario y rellenarlo automáticamente...',
            onNextClick: async () => {
              showCreateLeadForm();
              await new Promise(resolve => setTimeout(resolve, 1000));
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '📝 Formulario Auto-rellenado',
            description: 'Ves? El formulario se rellenó solo con "María González". Así introduces nuevos contactos. Ciérralo y seguimos.',
            onNextClick: async () => {
              // Cerrar modal si está abierto
              const closeBtn = document.querySelector('[data-action="close-modal"]') as HTMLButtonElement;
              if (closeBtn) closeBtn.click();
              
              navigate('/okrs');
              await new Promise(resolve => setTimeout(resolve, 800));
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '🎯 OKRs - Objetivos y Resultados',
            description: 'Aquí defines tus metas trimestrales. Voy a actualizar el progreso de un Key Result para que veas la animación...',
            onNextClick: async () => {
              animateOKRProgress();
              await new Promise(resolve => setTimeout(resolve, 2000));
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '📈 ¡Progreso Actualizado!',
            description: 'Viste cómo la barra de progreso se actualizó? Así trackeas tus objetivos en tiempo real.',
            onNextClick: async () => {
              navigate('/business-metrics');
              await new Promise(resolve => setTimeout(resolve, 800));
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '📊 Métricas de Negocio',
            description: 'Gráficos, tendencias, comparativas. Voy a animar los gráficos para que veas cómo se actualizan...',
            onNextClick: async () => {
              animateMetricsCharts();
              await new Promise(resolve => setTimeout(resolve, 1500));
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '💰 Panel Financiero',
            description: 'Ahora vamos a ver las finanzas...',
            onNextClick: async () => {
              navigate('/financial');
              await new Promise(resolve => setTimeout(resolve, 800));
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '💵 Gestión Financiera',
            description: 'Ingresos, gastos, márgenes y proyecciones. Todo calculado automáticamente.',
            onNextClick: async () => {
              navigate('/herramientas-hub');
              await new Promise(resolve => setTimeout(resolve, 800));
              driverObj.moveNext();
            }
          }
        },
        {
          element: '#tools-grid',
          popover: {
            title: '🛠️ Herramientas Estratégicas',
            description: 'Buyer Persona, Customer Journey, Growth Model... Todo con plantillas listas.',
            side: 'top',
            align: 'center',
            onNextClick: async () => {
              navigate('/ai-analysis');
              await new Promise(resolve => setTimeout(resolve, 800));
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '🤖 Análisis con IA',
            description: 'La IA analiza todos tus datos y genera insights accionables.',
            onNextClick: async () => {
              navigate('/dashboard/gamification');
              await new Promise(resolve => setTimeout(resolve, 800));
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '🏆 Gamificación',
            description: 'Puntos, badges, rankings. Motiva a tu equipo mientras trabajan.',
            onNextClick: async () => {
              navigate('/home');
              await new Promise(resolve => setTimeout(resolve, 800));
              driverObj.moveNext();
            }
          }
        },
        {
          popover: {
            title: '🎉 ¡Tour Completado!',
            description: 'Has visto TODAS las funciones en acción. Los ejemplos que creamos eran solo demostración. Ahora puedes usar la plataforma con tus datos reales. ¡A trabajar!',
          }
        }
      ],
      onDestroyStarted: () => {
        // Limpiar datos demo
        clearDemoData();
        
        // Eliminar elementos demo del DOM
        const demoCard = document.getElementById('demo-lead-card');
        if (demoCard) demoCard.remove();
        
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
