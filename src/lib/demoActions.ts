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

/**
 * Create demo revenue entry with animation
 */
export const createDemoRevenue = () => {
  // Animate revenue card
  const revenueCard = document.querySelector('[data-metric="revenue"]');
  if (revenueCard) {
    revenueCard.classList.add('demo-highlight');

    // Update revenue value with animation
    const revenueValue = revenueCard.querySelector('[data-value="amount"]');
    if (revenueValue) {
      const currentText = revenueValue.textContent?.replace(/[^0-9]/g, '') || '0';
      const currentValue = parseInt(currentText);
      const newValue = currentValue + 12450;
      animateValue(revenueValue as HTMLElement, currentValue, newValue, 1500, true);
    }

    setTimeout(() => revenueCard.classList.remove('demo-highlight'), 3000);
  }

  // Always inject demo data overlay into revenue chart container
  const revenueChart = document.getElementById('revenue-by-product-chart');
  if (revenueChart) {
    // Ensure container can host absolutely positioned overlay
    (revenueChart as HTMLElement).style.position = 'relative';

    // Remove any previous demo overlays
    revenueChart
      .querySelectorAll('.demo-chart-overlay')
      .forEach((el) => el.remove());

    const demoData = [
      { label: 'Suscripciones', value: 12450, height: 85 },
      { label: 'Productos', value: 8300, height: 60 },
      { label: 'Servicios', value: 5200, height: 40 },
    ];

    const demoContainer = document.createElement('div');
    demoContainer.className =
      'demo-financial demo-chart-overlay pointer-events-none absolute inset-0 flex items-end justify-around px-8 pb-10 gap-4';
    demoContainer.style.zIndex = '10';

    demoData.forEach((item) => {
      const bar = document.createElement('div');
      bar.className = 'flex flex-col items-center gap-2 flex-1 animate-scale-in';
      bar.innerHTML = `
        <div class="text-xs font-semibold text-primary">€${item.value.toLocaleString('es-ES')}</div>
        <div class="w-full bg-primary rounded-t-lg transition-all duration-700" style="height: 0px;"></div>
        <div class="text-xs text-muted-foreground font-medium">${item.label}</div>
      `;
      demoContainer.appendChild(bar);

      // Animate bar height once inserted
      setTimeout(() => {
        const barElement = bar.querySelector('div:nth-child(2)') as HTMLElement;
        if (barElement) {
          barElement.style.height = `${item.height}%`;
        }
      }, 50);
    });

    revenueChart.appendChild(demoContainer);

    revenueChart.classList.add('animate-pulse');
    setTimeout(() => revenueChart.classList.remove('animate-pulse'), 2000);
  }
};

/**
 * Create demo expense entry with animation
 */
export const createDemoExpense = () => {
  // Animate expense card
  const expenseCard = document.querySelector('[data-metric="expenses"]');
  if (expenseCard) {
    expenseCard.classList.add('demo-highlight');

    // Update expense value with animation
    const expenseValue = expenseCard.querySelector('[data-value="amount"]');
    if (expenseValue) {
      const currentText = expenseValue.textContent?.replace(/[^0-9]/g, '') || '0';
      const currentValue = parseInt(currentText);
      const newValue = currentValue + 3200;
      animateValue(expenseValue as HTMLElement, currentValue, newValue, 1500, true);
    }

    setTimeout(() => expenseCard.classList.remove('demo-highlight'), 3000);
  }

  // Always inject demo data overlay into expenses chart container
  const expenseChart = document.getElementById('expenses-by-category-chart');
  if (expenseChart) {
    (expenseChart as HTMLElement).style.position = 'relative';

    // Remove previous overlays
    expenseChart
      .querySelectorAll('.demo-chart-overlay')
      .forEach((el) => el.remove());

    const demoData = [
      { label: 'Operaciones', value: 3200, color: '#3b82f6', percentage: 45 },
      { label: 'Marketing', value: 2100, color: '#8b5cf6', percentage: 30 },
      { label: 'Salarios', value: 1800, color: '#ec4899', percentage: 25 },
    ];

    const demoContainer = document.createElement('div');
    demoContainer.className =
      'demo-financial demo-chart-overlay pointer-events-none absolute inset-0 flex items-center justify-center';
    demoContainer.style.zIndex = '10';

    const pieWrapper = document.createElement('div');
    pieWrapper.className = 'flex flex-col items-center gap-4';

    const pieVisual = document.createElement('div');
    pieVisual.className = 'relative w-48 h-48 rounded-full animate-scale-in';
    pieVisual.style.background = `conic-gradient(
      ${demoData[0].color} 0deg ${demoData[0].percentage * 3.6}deg,
      ${demoData[1].color} ${demoData[0].percentage * 3.6}deg ${(demoData[0].percentage + demoData[1].percentage) * 3.6}deg,
      ${demoData[2].color} ${(demoData[0].percentage + demoData[1].percentage) * 3.6}deg 360deg
    )`;

    const centerHole = document.createElement('div');
    centerHole.className = 'absolute inset-0 m-auto w-24 h-24 rounded-full bg-card';
    pieVisual.appendChild(centerHole);

    pieWrapper.appendChild(pieVisual);

    const legend = document.createElement('div');
    legend.className = 'flex flex-col gap-2 animate-fade-in';
    demoData.forEach((item) => {
      const legendItem = document.createElement('div');
      legendItem.className = 'flex items-center gap-2 text-sm';
      legendItem.innerHTML = `
        <div class="w-3 h-3 rounded-full" style="background-color: ${item.color}"></div>
        <span class="font-medium">${item.label}</span>
        <span class="text-muted-foreground ml-auto">€${item.value.toLocaleString('es-ES')} (${item.percentage}%)</span>
      `;
      legend.appendChild(legendItem);
    });

    pieWrapper.appendChild(legend);
    demoContainer.appendChild(pieWrapper);

    expenseChart.appendChild(demoContainer);

    expenseChart.classList.add('animate-pulse');
    setTimeout(() => expenseChart.classList.remove('animate-pulse'), 2000);
  }
};

/**
 * Animate ROI calculation
 */
export const animateROICalculation = () => {
  // Highlight margin card
  const marginCard = document.querySelector('[data-metric="margin"]');
  if (marginCard) {
    marginCard.classList.add('demo-highlight');
    
    // Update margin with animation
    const marginValue = marginCard.querySelector('[data-value="amount"]');
    const revenueElement = document.querySelector('[data-metric="revenue"] [data-value="amount"]');
    const expenseElement = document.querySelector('[data-metric="expenses"] [data-value="amount"]');
    
    if (marginValue && revenueElement && expenseElement) {
      const revenueText = revenueElement.textContent?.replace(/[^0-9]/g, '') || '0';
      const expenseText = expenseElement.textContent?.replace(/[^0-9]/g, '') || '0';
      const revenueValue = parseInt(revenueText);
      const expenseValue = parseInt(expenseText);
      const margin = revenueValue - expenseValue;
      animateValue(marginValue as HTMLElement, 0, margin, 2000, true);
    }
    
    setTimeout(() => marginCard.classList.remove('demo-highlight'), 4000);
  }
  
  // Animate ROI table
  const roiTable = document.getElementById('marketing-roi-table');
  if (roiTable) {
    roiTable.classList.add('animate-fade-in');
    setTimeout(() => roiTable.classList.remove('animate-fade-in'), 2000);
  }
};

/**
 * Helper function to animate number values
 */
const animateValue = (element: HTMLElement, start: number, end: number, duration: number, isCurrency: boolean = false) => {
  const startTime = Date.now();
  const range = end - start;
  
  const updateValue = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const current = start + (range * progress);
    
    if (isCurrency) {
      element.textContent = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Math.round(current));
    } else {
      element.textContent = Math.round(current).toString();
    }
    
    if (progress < 1) {
      requestAnimationFrame(updateValue);
    }
  };
  
  requestAnimationFrame(updateValue);
};
