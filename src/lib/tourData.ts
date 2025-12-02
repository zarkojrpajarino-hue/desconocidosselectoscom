/**
 * Datos demo FIJOS para tours interactivos
 * Estos datos se reutilizan en cada tour y se limpian al finalizar
 */

export const TOUR_DEMO_DATA = {
  lead: {
    id: 'demo-lead-1',
    name: 'Ana García',
    company: 'TechStart Solutions',
    email: 'ana.garcia@techstart.com',
    phone: '+34 612 345 678',
    position: 'Directora de Compras',
    source: 'LinkedIn',
    stage: 'lead',
    pipeline_stage: 'Descubrimiento',
    priority: 'high',
    estimated_value: 15000,
    probability: 25,
    notes: 'Interesada en plan Professional. Reunión programada para la próxima semana.',
    tags: ['demo', 'tech', 'high-value']
  },
  
  task: {
    id: 'demo-task-1',
    title: 'Llamar a cliente potencial',
    description: 'Seguimiento de propuesta enviada la semana pasada. Revisar dudas sobre integración técnica.',
    phase: 2,
    area: 'sales',
    priority: 'high',
    estimated_time: 30,
    status: 'pending',
    week_start: new Date().toISOString().split('T')[0]
  },
  
  okr: {
    id: 'demo-okr-1',
    title: 'Aumentar ingresos recurrentes Q1 2025',
    description: 'Crecer MRR un 40% mediante adquisición de nuevos clientes y reducción de churn',
    quarter: 'Q1',
    year: 2025,
    keyResults: [
      { 
        id: 'demo-kr-1',
        title: 'Alcanzar 50 clientes de pago', 
        target_value: 50, 
        current_value: 32, 
        start_value: 28,
        unit: 'clientes',
        metric_type: 'number'
      },
      { 
        id: 'demo-kr-2',
        title: 'Reducir churn mensual a menos de 5%', 
        target_value: 5, 
        current_value: 8,
        start_value: 12, 
        unit: '%',
        metric_type: 'percentage'
      },
      { 
        id: 'demo-kr-3',
        title: 'Aumentar ARPU a €200', 
        target_value: 200, 
        current_value: 165,
        start_value: 150, 
        unit: '€',
        metric_type: 'currency'
      }
    ]
  },
  
  metric: {
    id: 'demo-metric-1',
    name: 'Tasa de conversión',
    value: 24.5,
    unit: '%',
    previousValue: 18.2,
    trend: 'up',
    target: 30,
    category: 'sales'
  },
  
  financialRecord: {
    id: 'demo-financial-1',
    type: 'revenue',
    category: 'Subscriptions',
    product_category: 'SaaS',
    amount: 12450,
    date: new Date().toISOString().split('T')[0],
    description: 'Ingresos recurrentes mensuales - Plan Professional',
    customer_type: 'recurring'
  },
  
  automation: {
    id: 'demo-automation-1',
    name: 'Bienvenida a nuevo lead',
    trigger: 'new_lead',
    enabled: true,
    actions: [
      { type: 'send_email', template: 'welcome_email', delay: 0 },
      { type: 'create_task', title: 'Contactar nuevo lead', assignTo: 'sales_team', delay: 60 },
      { type: 'notify_slack', channel: '#sales', message: 'Nuevo lead: {lead.name}', delay: 0 }
    ]
  },

  buyerPersona: {
    id: 'demo-persona-1',
    name: 'María Empresaria',
    age: 38,
    occupation: 'CEO de startup tecnológica',
    income: '€80k-120k',
    location: 'Madrid, España',
    goals: [
      'Escalar el negocio de forma sostenible',
      'Optimizar procesos de ventas',
      'Tomar decisiones basadas en datos'
    ],
    painPoints: [
      'Demasiado tiempo en tareas administrativas',
      'Falta de visibilidad del pipeline',
      'Equipos desalineados con objetivos'
    ],
    behaviors: [
      'Busca soluciones en Google y LinkedIn',
      'Lee blogs de SaaS y growth',
      'Prefiere demos en vivo antes de comprar'
    ]
  }
};

export type DemoLead = typeof TOUR_DEMO_DATA.lead;
export type DemoTask = typeof TOUR_DEMO_DATA.task;
export type DemoOKR = typeof TOUR_DEMO_DATA.okr;
export type DemoMetric = typeof TOUR_DEMO_DATA.metric;
export type DemoFinancialRecord = typeof TOUR_DEMO_DATA.financialRecord;
