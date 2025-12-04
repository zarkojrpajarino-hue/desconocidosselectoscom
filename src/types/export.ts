/**
 * Tipos para ExportButton.tsx
 * Elimina los 7 tipos 'any' de este archivo
 */

// ============================================
// EXPORT TYPES
// ============================================

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';
export type ExportType = 'metrics' | 'leads' | 'okrs' | 'financial' | 'tasks' | 'ai_analysis' | 'generic';

// ============================================
// METRICS EXPORT
// ============================================

export interface MetricsExportData {
  revenue: number;
  expenses: number;
  profit: number;
  profit_margin: number;
  growth_rate: number;
  customer_count: number;
  new_customers: number;
  churn_rate: number;
  mrr: number;
  arr: number;
  ltv: number;
  cac: number;
  ltv_cac_ratio: number;
  burn_rate?: number;
  runway_months?: number;
  nps_score?: number;
  period: string;
  generated_at: string;
}

// ============================================
// LEADS EXPORT
// ============================================

export interface LeadExportData {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  stage: string;
  status: string;
  estimated_value: number;
  probability: number;
  source: string;
  assigned_to: string;
  days_in_stage: number;
  last_contact: string;
  created_at: string;
  notes: string;
}

// ============================================
// OKRS EXPORT
// ============================================

export interface KeyResultExportData {
  title: string;
  start_value: number;
  current_value: number;
  target_value: number;
  progress: number;
  unit: string;
}

export interface OKRExportData {
  id: string;
  objective: string;
  description: string;
  owner: string;
  quarter: string;
  year: number;
  status: string;
  progress: number;
  key_results: KeyResultExportData[];
  created_at: string;
  updated_at: string;
}

// ============================================
// FINANCIAL EXPORT
// ============================================

export interface FinancialExportData {
  id: string;
  date: string;
  type: 'revenue' | 'expense';
  category: string;
  subcategory?: string;
  amount: number;
  currency: string;
  description: string;
  payment_method?: string;
  recurring: boolean;
  tags?: string[];
}

// ============================================
// TASKS EXPORT
// ============================================

export interface TaskExportData {
  id: string;
  title: string;
  description: string;
  phase: number;
  area: string;
  assigned_to: string;
  leader: string;
  status: string;
  due_date: string;
  completed_at: string | null;
  priority: string;
  estimated_hours: number;
  actual_hours: number | null;
}

// ============================================
// AI ANALYSIS EXPORT
// ============================================

export interface AIAnalysisExportData {
  id: string;
  generated_at: string;
  overall_score: number;
  financial_health: {
    score: number;
    insights: string[];
  };
  team_performance: {
    score: number;
    insights: string[];
  };
  growth_analysis: {
    score: number;
    insights: string[];
  };
  recommendations: string[];
  action_items: {
    priority: string;
    action: string;
    deadline?: string;
  }[];
}

// ============================================
// GENERIC EXPORT
// ============================================

export interface GenericExportData {
  [key: string]: string | number | boolean | null | undefined;
}

// ============================================
// EXPORT CONFIGURATION
// ============================================

export interface ExportConfig {
  type: ExportType;
  format: ExportFormat;
  filename?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
  numberFormat?: string;
}

export interface ExportDataPayload {
  type: ExportType;
  data: MetricsExportData | LeadExportData[] | OKRExportData[] | FinancialExportData[] | TaskExportData[] | AIAnalysisExportData | GenericExportData[];
  config?: Partial<ExportConfig>;
}

// ============================================
// CSV CONVERSION HELPERS
// ============================================

export function convertMetricsToCSV(metrics: MetricsExportData): string {
  const headers = Object.keys(metrics).join(',');
  const values = Object.values(metrics).map(v => 
    typeof v === 'string' ? `"${v}"` : v
  ).join(',');
  return `${headers}\n${values}`;
}

export function convertLeadsToCSV(leads: LeadExportData[]): string {
  if (leads.length === 0) return '';
  const headers = Object.keys(leads[0]).join(',');
  const rows = leads.map(lead => 
    Object.values(lead).map(v => 
      typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
    ).join(',')
  );
  return [headers, ...rows].join('\n');
}

export function convertOKRsToCSV(okrs: OKRExportData[]): string {
  const rows: string[] = ['Objective,Description,Owner,Quarter,Year,Status,Progress,Key Results'];
  okrs.forEach(okr => {
    const krSummary = okr.key_results.map(kr => `${kr.title}: ${kr.progress}%`).join('; ');
    rows.push(`"${okr.objective}","${okr.description}","${okr.owner}","${okr.quarter}",${okr.year},"${okr.status}",${okr.progress},"${krSummary}"`);
  });
  return rows.join('\n');
}

export function convertFinancialToCSV(transactions: FinancialExportData[]): string {
  if (transactions.length === 0) return '';
  const headers = 'Date,Type,Category,Amount,Currency,Description,Recurring';
  const rows = transactions.map(t => 
    `"${t.date}","${t.type}","${t.category}",${t.amount},"${t.currency}","${t.description}",${t.recurring}`
  );
  return [headers, ...rows].join('\n');
}

export function convertGenericToCSV(data: GenericExportData[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(v => 
      v === null || v === undefined ? '' :
      typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
    ).join(',')
  );
  return [headers, ...rows].join('\n');
}
