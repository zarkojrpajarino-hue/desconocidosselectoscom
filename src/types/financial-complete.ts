// Tipos completos para el sistema financiero - Eliminación de 'any'

// === Tipos base ===

export type TransactionType = 'income' | 'expense' | 'transfer';

export type TransactionCategory = 
  | 'sales'
  | 'services'
  | 'subscriptions'
  | 'refunds'
  | 'payroll'
  | 'marketing'
  | 'software'
  | 'office'
  | 'utilities'
  | 'taxes'
  | 'legal'
  | 'insurance'
  | 'travel'
  | 'equipment'
  | 'other';

export type PaymentMethod = 
  | 'cash'
  | 'bank_transfer'
  | 'credit_card'
  | 'debit_card'
  | 'check'
  | 'paypal'
  | 'stripe'
  | 'other';

export type RecurringFrequency = 
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'annually';

// === Tipos de transacción ===

export interface TransactionData {
  id: string;
  organization_id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string;
  date: string;
  payment_method: PaymentMethod | null;
  reference: string | null;
  vendor: string | null;
  customer: string | null;
  is_recurring: boolean;
  recurring_frequency: RecurringFrequency | null;
  tags: string[] | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string | null;
}

// === Tipos de ingreso ===

export interface RevenueEntry {
  id: string;
  organization_id: string;
  amount: number;
  description: string;
  date: string;
  category: string;
  customer: string | null;
  product_service: string | null;
  is_recurring: boolean;
  recurring_frequency: RecurringFrequency | null;
  payment_method: PaymentMethod | null;
  created_by: string;
  created_at: string;
}

// === Tipos de gasto ===

export interface ExpenseEntry {
  id: string;
  organization_id: string;
  amount: number;
  description: string;
  date: string;
  category: TransactionCategory;
  subcategory: string | null;
  vendor: string | null;
  is_recurring: boolean;
  recurring_frequency: RecurringFrequency | null;
  payment_method: PaymentMethod | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

// === Tipos de marketing ===

export interface MarketingEntry {
  id: string;
  organization_id: string;
  amount: number;
  channel: string;
  campaign_name: string | null;
  date: string;
  impressions: number | null;
  clicks: number | null;
  conversions: number | null;
  roi: number | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

// === Tipos de métricas financieras ===

export interface FinancialMetrics {
  id: string;
  organization_id: string;
  month: string;
  total_revenue: number;
  total_expenses: number;
  gross_margin: number;
  net_margin: number;
  mrr: number | null;
  arr: number | null;
  burn_rate: number | null;
  runway_months: number | null;
  cac: number | null;
  ltv: number | null;
  ltv_cac_ratio: number | null;
  customer_count: number | null;
  new_customers: number | null;
  avg_order_value: number | null;
  calculated_at: string;
}

// === Tipos de proyecciones ===

export interface FinancialProjection {
  id: string;
  organization_id: string;
  period: string;
  projected_revenue: number;
  projected_expenses: number;
  revenue_from_recurring: number | null;
  revenue_from_new_customers: number | null;
  revenue_from_pipeline: number | null;
  burn_rate: number | null;
  runway_months: number | null;
  calculated_cac: number | null;
  calculated_ltv: number | null;
  ltv_cac_ratio: number | null;
  confidence_level: number | null;
  breakdown: ProjectionBreakdown | null;
  alerts: ProjectionAlert[] | null;
  calculated_at: string;
}

export interface ProjectionBreakdown {
  revenue_sources: Array<{
    source: string;
    amount: number;
    percentage: number;
  }>;
  expense_categories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export interface ProjectionAlert {
  type: 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  metric: string;
  threshold: number;
  current_value: number;
}

// === Tipos de cash flow ===

export interface CashFlowForecast {
  id: string;
  organization_id: string;
  month: string;
  opening_balance: number;
  projected_inflows: number;
  projected_outflows: number;
  net_cash_flow: number;
  closing_balance: number;
  inflows_breakdown: CashFlowBreakdown | null;
  outflows_breakdown: CashFlowBreakdown | null;
  created_at: string;
}

export interface CashFlowBreakdown {
  items: Array<{
    category: string;
    amount: number;
    is_recurring: boolean;
  }>;
}

// === Tipos de presupuesto ===

export interface BudgetItem {
  id: string;
  organization_id: string;
  category: TransactionCategory;
  period: string;
  budgeted_amount: number;
  actual_amount: number;
  variance_amount: number;
  variance_percentage: number;
  status: 'under' | 'on_track' | 'over';
  created_at: string;
  updated_at: string | null;
}

// === Tipos de ratios financieros ===

export interface FinancialRatios {
  id: string;
  organization_id: string;
  gross_margin: number | null;
  operating_margin: number | null;
  net_margin: number | null;
  current_ratio: number | null;
  quick_ratio: number | null;
  debt_to_equity: number | null;
  roi: number | null;
  revenue_per_employee: number | null;
  working_capital_ratio: number | null;
  cash_conversion_cycle: number | null;
  calculated_at: string;
}

// === Tipos para formularios ===

export interface RevenueFormData {
  amount: number;
  description: string;
  date: string;
  category: string;
  customer?: string;
  product_service?: string;
  is_recurring?: boolean;
  recurring_frequency?: RecurringFrequency;
  payment_method?: PaymentMethod;
}

export interface ExpenseFormData {
  amount: number;
  description: string;
  date: string;
  category: TransactionCategory;
  subcategory?: string;
  vendor?: string;
  is_recurring?: boolean;
  recurring_frequency?: RecurringFrequency;
  payment_method?: PaymentMethod;
  notes?: string;
}

export interface MarketingFormData {
  amount: number;
  channel: string;
  campaign_name?: string;
  date: string;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  notes?: string;
}

// === Tipos para estadísticas ===

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  revenueGrowth: number;
  expenseGrowth: number;
  burnRate: number;
  runwayMonths: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  previousAmount: number;
}

// === Props de componentes ===

export interface FinancialDashboardProps {
  organizationId: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface TransactionHistoryProps {
  transactions: TransactionData[];
  loading?: boolean;
  onEdit?: (transaction: TransactionData) => void;
  onDelete?: (transactionId: string) => void;
}

export interface RevenueFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RevenueFormData) => Promise<void>;
  initialData?: Partial<RevenueFormData>;
}

export interface ExpenseFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  initialData?: Partial<ExpenseFormData>;
}

// === Tipos para hooks ===

export interface UseFinancialDataResult {
  metrics: FinancialMetrics | null;
  projections: FinancialProjection | null;
  transactions: TransactionData[];
  loading: boolean;
  error: Error | null;
  addRevenue: (data: RevenueFormData) => Promise<void>;
  addExpense: (data: ExpenseFormData) => Promise<void>;
  addMarketing: (data: MarketingFormData) => Promise<void>;
  refresh: () => Promise<void>;
}

// === Constantes ===

export const TRANSACTION_CATEGORY_LABELS: Record<TransactionCategory, string> = {
  sales: 'Ventas',
  services: 'Servicios',
  subscriptions: 'Suscripciones',
  refunds: 'Devoluciones',
  payroll: 'Nómina',
  marketing: 'Marketing',
  software: 'Software',
  office: 'Oficina',
  utilities: 'Servicios Públicos',
  taxes: 'Impuestos',
  legal: 'Legal',
  insurance: 'Seguros',
  travel: 'Viajes',
  equipment: 'Equipamiento',
  other: 'Otros',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  bank_transfer: 'Transferencia',
  credit_card: 'Tarjeta de Crédito',
  debit_card: 'Tarjeta de Débito',
  check: 'Cheque',
  paypal: 'PayPal',
  stripe: 'Stripe',
  other: 'Otro',
};

export const RECURRING_FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  annually: 'Anual',
};
