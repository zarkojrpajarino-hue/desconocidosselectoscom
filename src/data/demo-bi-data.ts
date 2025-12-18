// Demo data for BI Dashboard - Professional business intelligence metrics

export const DEMO_EXECUTIVE_SUMMARY = {
  totalRevenue: 847500,
  revenueChange: 23.5,
  totalCustomers: 142,
  customersChange: 18.2,
  totalDeals: 287,
  dealsChange: 15.8,
  conversionRate: 32.4,
  conversionChange: 4.2,
  avgDealSize: 5967,
  dealSizeChange: 8.7,
  totalExpenses: 312400,
  expensesChange: -5.3,
};

export const DEMO_REVENUE_ANALYTICS = {
  daily: [
    { date: '01 Nov', revenue: 24500, expenses: 8200, profit: 16300 },
    { date: '02 Nov', revenue: 28700, expenses: 9100, profit: 19600 },
    { date: '03 Nov', revenue: 22100, expenses: 7800, profit: 14300 },
    { date: '04 Nov', revenue: 31200, expenses: 10500, profit: 20700 },
    { date: '05 Nov', revenue: 27800, expenses: 9300, profit: 18500 },
    { date: '06 Nov', revenue: 19500, expenses: 6800, profit: 12700 },
    { date: '07 Nov', revenue: 35600, expenses: 11200, profit: 24400 },
    { date: '08 Nov', revenue: 29400, expenses: 9800, profit: 19600 },
    { date: '09 Nov', revenue: 33100, expenses: 10700, profit: 22400 },
    { date: '10 Nov', revenue: 26800, expenses: 8900, profit: 17900 },
    { date: '11 Nov', revenue: 38200, expenses: 12100, profit: 26100 },
    { date: '12 Nov', revenue: 41500, expenses: 13200, profit: 28300 },
    { date: '13 Nov', revenue: 29700, expenses: 9600, profit: 20100 },
    { date: '14 Nov', revenue: 36900, expenses: 11800, profit: 25100 },
    { date: '15 Nov', revenue: 32400, expenses: 10400, profit: 22000 },
  ],
  byProduct: [
    { name: 'SaaS Enterprise', value: 312500, percentage: 36.9 },
    { name: 'Consultoría', value: 189700, percentage: 22.4 },
    { name: 'SaaS Professional', value: 156300, percentage: 18.4 },
    { name: 'Formación', value: 98400, percentage: 11.6 },
    { name: 'Soporte Premium', value: 62800, percentage: 7.4 },
    { name: 'Otros', value: 27800, percentage: 3.3 },
  ],
  byChannel: [
    { name: 'Ventas Directas', value: 425000 },
    { name: 'Partners', value: 198500 },
    { name: 'Marketing Digital', value: 124300 },
    { name: 'Referidos', value: 68200 },
    { name: 'Eventos', value: 31500 },
  ],
  trends: {
    avgDaily: 28453,
    bestDay: '12 Nov',
    worstDay: '06 Nov',
    growthRate: 24.7,
  },
};

export const DEMO_SALES_PERFORMANCE = {
  pipeline: [
    { stage: 'Descubrimiento', count: 89, value: 534000 },
    { stage: 'Calificación', count: 62, value: 372000 },
    { stage: 'Propuesta', count: 45, value: 405000 },
    { stage: 'Negociación', count: 28, value: 336000 },
    { stage: 'Ganado', count: 42, value: 504000 },
  ],
  funnel: [
    { name: 'Descubrimiento', value: 89, fill: 'hsl(var(--primary))' },
    { name: 'Calificación', value: 62, fill: 'hsl(var(--accent))' },
    { name: 'Propuesta', value: 45, fill: '#10B981' },
    { name: 'Negociación', value: 28, fill: '#F59E0B' },
    { name: 'Ganado', value: 42, fill: '#22C55E' },
  ],
  velocity: [
    { stage: 'Descubrimiento', avgDays: 3.2 },
    { stage: 'Calificación', avgDays: 5.8 },
    { stage: 'Propuesta', avgDays: 8.4 },
    { stage: 'Negociación', avgDays: 12.6 },
    { stage: 'Cierre', avgDays: 4.2 },
  ],
  performers: [
    { name: 'María García', deals: 28, value: 168400, conversion: 42.3 },
    { name: 'Carlos López', deals: 24, value: 144200, conversion: 38.7 },
    { name: 'Ana Martínez', deals: 21, value: 126800, conversion: 35.2 },
    { name: 'David Rodríguez', deals: 18, value: 108500, conversion: 31.8 },
    { name: 'Laura Sánchez', deals: 15, value: 90200, conversion: 28.4 },
  ],
};

export const DEMO_CUSTOMER_INSIGHTS = {
  acquisition: [
    { source: 'Google Ads', count: 47, value: 282000 },
    { source: 'LinkedIn', count: 38, value: 228000 },
    { source: 'Referidos', count: 29, value: 174000 },
    { source: 'Orgánico', count: 24, value: 144000 },
    { source: 'Partners', count: 18, value: 108000 },
    { source: 'Eventos', count: 12, value: 72000 },
  ],
  segments: [
    { name: 'Enterprise (>€50K)', value: 28, percentage: 19.7 },
    { name: 'Grandes (€10K-€50K)', value: 42, percentage: 29.6 },
    { name: 'Medianos (€1K-€10K)', value: 51, percentage: 35.9 },
    { name: 'Pequeños (<€1K)', value: 21, percentage: 14.8 },
  ],
  lifecycle: [
    { stage: 'Nuevos', count: 34 },
    { stage: 'Activos', count: 89 },
    { stage: 'En riesgo', count: 12 },
    { stage: 'Churned', count: 7 },
  ],
  satisfaction: {
    nps: 72,
    csat: 85,
    retention: 94,
    churn: 6,
  },
  cohorts: [
    { month: 'Jun 24', newCustomers: 18, retained: 16 },
    { month: 'Jul 24', newCustomers: 22, retained: 19 },
    { month: 'Ago 24', newCustomers: 25, retained: 22 },
    { month: 'Sep 24', newCustomers: 28, retained: 25 },
    { month: 'Oct 24', newCustomers: 31, retained: 28 },
    { month: 'Nov 24', newCustomers: 34, retained: 31 },
  ],
};

export const DEMO_OPERATIONAL_METRICS = {
  taskCompletion: [
    { date: '01 Nov', completed: 24, total: 28, rate: 85.7 },
    { date: '02 Nov', completed: 31, total: 35, rate: 88.6 },
    { date: '03 Nov', completed: 22, total: 26, rate: 84.6 },
    { date: '04 Nov', completed: 28, total: 32, rate: 87.5 },
    { date: '05 Nov', completed: 35, total: 38, rate: 92.1 },
    { date: '06 Nov', completed: 18, total: 22, rate: 81.8 },
    { date: '07 Nov', completed: 29, total: 33, rate: 87.9 },
    { date: '08 Nov', completed: 33, total: 36, rate: 91.7 },
    { date: '09 Nov', completed: 27, total: 31, rate: 87.1 },
    { date: '10 Nov', completed: 38, total: 42, rate: 90.5 },
    { date: '11 Nov', completed: 41, total: 45, rate: 91.1 },
    { date: '12 Nov', completed: 36, total: 40, rate: 90.0 },
    { date: '13 Nov', completed: 30, total: 34, rate: 88.2 },
    { date: '14 Nov', completed: 34, total: 37, rate: 91.9 },
    { date: '15 Nov', completed: 39, total: 43, rate: 90.7 },
  ],
  teamProductivity: [
    { name: 'María García', completed: 87, pending: 8, efficiency: 91.6 },
    { name: 'Carlos López', completed: 74, pending: 12, efficiency: 86.0 },
    { name: 'Ana Martínez', completed: 68, pending: 9, efficiency: 88.3 },
    { name: 'David Rodríguez', completed: 62, pending: 14, efficiency: 81.6 },
    { name: 'Laura Sánchez', completed: 58, pending: 7, efficiency: 89.2 },
    { name: 'Pedro Fernández', completed: 51, pending: 11, efficiency: 82.3 },
  ],
  okrProgress: [
    { objective: 'Incrementar MRR a €100K', progress: 78.5, status: 'on_track' },
    { objective: 'Reducir churn al 5%', progress: 65.2, status: 'at_risk' },
    { objective: 'Lanzar 3 nuevas features', progress: 92.0, status: 'on_track' },
    { objective: 'NPS > 70', progress: 85.0, status: 'on_track' },
    { objective: 'Expandir a 2 nuevos mercados', progress: 45.0, status: 'at_risk' },
  ],
  alerts: {
    overdueTasks: 7,
    stalledDeals: 4,
    lowPerformers: 1,
    pendingApprovals: 3,
  },
};
