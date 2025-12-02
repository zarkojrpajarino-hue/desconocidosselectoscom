/**
 * Funciones para crear y animar elementos demo durante los tours interactivos
 */

import { TOUR_DEMO_DATA } from './tourData';

/**
 * Crear lead demo en el pipeline
 */
export const createDemoLead = (leadData: typeof TOUR_DEMO_DATA.lead = TOUR_DEMO_DATA.lead) => {
  const leadElement = document.createElement('div');
  leadElement.id = leadData.id;
  leadElement.className = 'demo-lead animate-slide-in bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg p-4 shadow-lg';
  leadElement.style.opacity = '0';
  
  leadElement.innerHTML = `
    <div class="space-y-2">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h3 class="font-bold text-lg text-foreground">${leadData.name}</h3>
          <p class="text-sm text-muted-foreground">${leadData.company}</p>
        </div>
        <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-semibold">DEMO</span>
      </div>
      <div class="space-y-1 text-sm">
        <p class="flex items-center gap-1">📧 ${leadData.email}</p>
        <p class="flex items-center gap-1">💰 €${leadData.estimated_value.toLocaleString()}</p>
        <p class="flex items-center gap-1">📊 Probabilidad: ${leadData.probability}%</p>
      </div>
      <div class="pt-2 border-t border-yellow-300">
        <span class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Alta Prioridad</span>
      </div>
    </div>
  `;
  
  // Buscar la primera columna del pipeline
  const pipelineColumns = document.querySelectorAll('[data-stage]');
  const firstColumn = pipelineColumns[0];
  
  if (firstColumn) {
    const cardsContainer = firstColumn.querySelector('.space-y-3');
    if (cardsContainer) {
      cardsContainer.insertBefore(leadElement, cardsContainer.firstChild);
      
      // Fade in animation
      setTimeout(() => {
        leadElement.style.transition = 'opacity 0.5s ease-in-out';
        leadElement.style.opacity = '1';
      }, 100);
    }
  }
  
  return leadElement;
};

/**
 * Animar drag & drop de lead entre columnas
 */
export const animateDragDrop = (
  leadId: string = 'demo-lead-1', 
  fromStage: string = 'descubrimiento', 
  toStage: string = 'calificación'
) => {
  const lead = document.getElementById(leadId);
  const targetColumn = document.querySelector(`[data-stage*="${toStage.toLowerCase()}"]`);
  
  if (!lead || !targetColumn) {
    console.warn('Lead or target column not found for drag animation');
    return;
  }
  
  const leadRect = lead.getBoundingClientRect();
  const targetRect = targetColumn.getBoundingClientRect();
  
  // Calcular desplazamiento
  const deltaX = targetRect.x - leadRect.x;
  const deltaY = targetRect.y - leadRect.y;
  
  // Añadir clases de animación
  lead.classList.add('dragging-demo');
  lead.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(5deg) scale(1.05)`;
  lead.style.transition = 'transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
  lead.style.zIndex = '1000';
  
  // Después de la animación, mover realmente el elemento
  setTimeout(() => {
    const targetContainer = targetColumn.querySelector('.space-y-3');
    if (targetContainer && lead.parentNode) {
      targetContainer.insertBefore(lead, targetContainer.firstChild);
      lead.style.transform = 'translate(0, 0) rotate(0deg) scale(1)';
      lead.style.zIndex = 'auto';
      lead.classList.remove('dragging-demo');
    }
  }, 1500);
};

/**
 * Crear OKR demo
 */
export const createDemoOKR = (okrData: typeof TOUR_DEMO_DATA.okr = TOUR_DEMO_DATA.okr) => {
  const okrElement = document.createElement('div');
  okrElement.id = okrData.id;
  okrElement.className = 'demo-okr animate-slide-in bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-400 rounded-lg p-6 shadow-lg';
  okrElement.style.opacity = '0';
  
  const keyResultsHTML = okrData.keyResults.map((kr, index) => {
    const progress = ((kr.current_value - kr.start_value) / (kr.target_value - kr.start_value)) * 100;
    return `
      <div id="${kr.id}" class="space-y-2 p-4 bg-white/50 rounded-lg">
        <div class="flex justify-between items-center">
          <span class="font-medium text-sm">${kr.title}</span>
          <span id="${kr.id}-value" class="text-sm font-bold text-primary">${kr.current_value}${kr.unit}</span>
        </div>
        <div class="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div 
            id="${kr.id}-progress" 
            class="okr-progress-bar bg-gradient-primary h-full transition-all duration-500"
            style="width: ${progress}%"
          ></div>
        </div>
        <div class="flex justify-between text-xs text-muted-foreground">
          <span>Inicial: ${kr.start_value}${kr.unit}</span>
          <span>Meta: ${kr.target_value}${kr.unit}</span>
        </div>
      </div>
    `;
  }).join('');
  
  okrElement.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h3 class="font-bold text-xl text-foreground">${okrData.title}</h3>
          <p class="text-sm text-muted-foreground mt-1">${okrData.description}</p>
          <div class="flex gap-2 mt-2">
            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">${okrData.quarter} ${okrData.year}</span>
            <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-semibold">DEMO</span>
          </div>
        </div>
      </div>
      <div id="${okrData.id}-key-results" class="space-y-3">
        ${keyResultsHTML}
      </div>
    </div>
  `;
  
  // Insertar en el contenedor de OKRs
  const okrContainer = document.querySelector('[data-okr-container]') || document.querySelector('main > div');
  if (okrContainer) {
    okrContainer.insertBefore(okrElement, okrContainer.firstChild);
    
    setTimeout(() => {
      okrElement.style.transition = 'opacity 0.5s ease-in-out';
      okrElement.style.opacity = '1';
    }, 100);
  }
  
  return okrElement;
};

/**
 * Animar progreso de Key Result
 */
export const animateKRProgress = (
  krId: string = 'demo-kr-1', 
  fromValue: number = 32, 
  toValue: number = 38
) => {
  const progressBar = document.getElementById(`${krId}-progress`);
  const valueSpan = document.getElementById(`${krId}-value`);
  
  if (!progressBar || !valueSpan) {
    console.warn('Progress bar or value span not found');
    return;
  }
  
  // Obtener el KR demo data para calcular porcentaje correcto
  const kr = TOUR_DEMO_DATA.okr.keyResults.find(k => k.id === krId);
  if (!kr) return;
  
  let current = fromValue;
  const increment = (toValue - fromValue) / 50; // 50 frames
  const targetProgress = ((toValue - kr.start_value) / (kr.target_value - kr.start_value)) * 100;
  
  const interval = setInterval(() => {
    current += increment;
    const currentProgress = ((current - kr.start_value) / (kr.target_value - kr.start_value)) * 100;
    
    progressBar.style.width = `${currentProgress}%`;
    valueSpan.textContent = `${Math.round(current)}${kr.unit}`;
    
    if (current >= toValue) {
      clearInterval(interval);
      progressBar.style.width = `${targetProgress}%`;
      valueSpan.textContent = `${toValue}${kr.unit}`;
    }
  }, 20);
};

/**
 * Crear registro financiero demo
 */
export const createDemoFinancialRecord = (recordData: typeof TOUR_DEMO_DATA.financialRecord = TOUR_DEMO_DATA.financialRecord) => {
  const recordElement = document.createElement('div');
  recordElement.id = recordData.id;
  recordElement.className = 'demo-financial animate-slide-in bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-4 shadow-lg';
  recordElement.style.opacity = '0';
  
  recordElement.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <span class="text-2xl">💰</span>
          <div>
            <h4 class="font-bold text-foreground">${recordData.description}</h4>
            <p class="text-sm text-muted-foreground">${recordData.category} • ${recordData.product_category}</p>
          </div>
        </div>
      </div>
      <div class="text-right">
        <p class="text-2xl font-bold text-green-600">€${recordData.amount.toLocaleString()}</p>
        <span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-semibold">DEMO</span>
      </div>
    </div>
  `;
  
  // Insertar en tabla financiera
  const financialTable = document.querySelector('[data-financial-table]') || document.querySelector('main table tbody');
  if (financialTable) {
    financialTable.insertBefore(recordElement, financialTable.firstChild);
    
    setTimeout(() => {
      recordElement.style.transition = 'opacity 0.5s ease-in-out';
      recordElement.style.opacity = '1';
    }, 100);
  }
  
  return recordElement;
};

/**
 * Animar gráficos de métricas
 */
export const animateMetricsCharts = () => {
  const charts = document.querySelectorAll('.recharts-wrapper');
  charts.forEach((chart: Element) => {
    const htmlChart = chart as HTMLElement;
    htmlChart.classList.add('demo-highlight');
    htmlChart.style.animation = 'pulse-highlight 2s ease-in-out';
    
    setTimeout(() => {
      htmlChart.classList.remove('demo-highlight');
      htmlChart.style.animation = '';
    }, 2000);
  });
};

/**
 * Rellenar formulario automáticamente
 */
export const fillFormDemo = (formType: 'lead' | 'task' | 'okr') => {
  setTimeout(() => {
    const data = formType === 'lead' ? TOUR_DEMO_DATA.lead : 
                 formType === 'task' ? TOUR_DEMO_DATA.task : 
                 TOUR_DEMO_DATA.okr;
    
    Object.keys(data).forEach(key => {
      const input = document.querySelector(`[name="${key}"]`) as HTMLInputElement | HTMLTextAreaElement;
      if (input) {
        input.value = String((data as any)[key]);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }, 500);
};

/**
 * Limpiar todos los elementos demo
 */
export const cleanupDemoData = () => {
  const demoElements = document.querySelectorAll('.demo-lead, .demo-okr, .demo-task, .demo-financial, .demo-metric');
  demoElements.forEach(el => {
    el.classList.add('animate-fade-out');
    setTimeout(() => el.remove(), 300);
  });
};
