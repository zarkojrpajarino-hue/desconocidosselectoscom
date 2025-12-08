/**
 * Enterprise RPC Function Types
 * 
 * Types for Supabase RPC functions used in enterprise features
 */

// ============================================================================
// DEAL VELOCITY TYPES
// ============================================================================

export interface DealVelocityStage {
  stage: string;
  average_days: number;
  deal_count: number;
  total_value?: number;
}

export interface StalledDeal {
  id: string;
  name: string;
  company?: string;
  stage: string;
  days_in_stage: number;
  estimated_value: number;
  assigned_to?: string;
  last_interaction?: string;
}

export interface DealVelocityBottleneck {
  stage: string;
  average_days: number;
  target_days: number;
  deviation: number;
}

// ============================================================================
// FORECAST TYPES
// ============================================================================

export interface ForecastStage {
  stage: string;
  total_value: number;
  deal_count: number;
  win_probability: number;
  weighted_value: number;
}

export interface CachedForecast {
  id: string;
  organization_id: string;
  forecast_month: string;
  total_pipeline: number;
  weighted_pipeline: number;
  expected_close: number;
  confidence_level: string;
  created_at: string;
}

// ============================================================================
// LOST REASONS TYPES
// ============================================================================

export interface LostReason {
  reason: string;
  count: number;
  total_value: number;
  percentage: number;
}

// ============================================================================
// KPI TARGET TYPES
// ============================================================================

export interface KPITargetData {
  id: string;
  kpi_name: string;
  target_value: number;
  current_value: number;
  unit: string;
  period: string;
  department?: string;
  owner?: string;
}

// ============================================================================
// BUDGET COMPARISON TYPES
// ============================================================================

export interface BudgetComparisonData {
  department: string;
  budgeted: number;
  actual: number;
  variance: number;
  variance_percentage: number;
  period: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type StageTarget = Record<string, number>;

export interface RecommendedAction {
  type: 'urgent' | 'warning' | 'info';
  message: string;
  dealId: string;
}

// ============================================================================
// COLLABORATION TASK TYPES
// ============================================================================

export interface CollaborationTask {
  id: string;
  title: string;
  description?: string;
  phase?: string;
  area?: string;
  week_number?: number;
  year?: number;
  organization_id: string;
  created_at?: string;
}

export interface CollaborationUser {
  id: string;
  full_name: string;
  email: string;
}

export interface TaskCompletionData {
  id: string;
  task_id: string;
  user_id: string;
  status: string;
  completed_at?: string;
  leader_feedback?: string;
  created_at?: string;
}

// ============================================================================
// ALERT TYPES
// ============================================================================

export interface AlertContext {
  [key: string]: string | number | boolean | null | undefined;
}

export interface SmartAlertData {
  id: string;
  title: string;
  message: string;
  type: string;
  severity: string;
  context?: AlertContext;
  created_at?: string;
  is_read?: boolean;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isDealVelocityStage(value: unknown): value is DealVelocityStage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'stage' in value &&
    'average_days' in value &&
    'deal_count' in value
  );
}

export function isStalledDeal(value: unknown): value is StalledDeal {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'stage' in value &&
    'days_in_stage' in value
  );
}

export function isForecastStage(value: unknown): value is ForecastStage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'stage' in value &&
    'total_value' in value &&
    'win_probability' in value
  );
}

export function isCollaborationTask(value: unknown): value is CollaborationTask {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value &&
    'organization_id' in value
  );
}