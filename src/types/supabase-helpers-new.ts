/**
 * Supabase Type Helpers
 * 
 * Helper types and utilities to work with Supabase generated types.
 * Use these instead of 'any' for type safety.
 */

import { Database } from '@/integrations/supabase/types';

// ============================================================================
// TABLE TYPES - Direct access to table row types
// ============================================================================

export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

export type Enums<T extends keyof Database['public']['Enums']> = 
  Database['public']['Enums'][T];

// ============================================================================
// COMMON TABLE TYPES - For easy import
// ============================================================================

export type UserRow = Tables<'users'>;
export type OrganizationRow = Tables<'organizations'>;
export type LeadRow = Tables<'leads'>;
export type LeadInteractionRow = Tables<'lead_interactions'>;
export type TaskRow = Tables<'tasks'>;
export type TaskCompletionRow = Tables<'task_completions'>;
export type BadgeRow = Tables<'badges'>;
export type UserBadgeRow = Tables<'user_badges'>;
export type SmartAlertRow = Tables<'smart_alerts'>;
export type BusinessMetricsRow = Tables<'business_metrics'>;
export type KeyResultRow = Tables<'key_results'>;
export type RevenueEntryRow = Tables<'revenue_entries'>;
export type ExpenseEntryRow = Tables<'expense_entries'>;
export type UserRoleRow = Tables<'user_roles'>;
export type NotificationRow = Tables<'notifications'>;

// ============================================================================
// EXTENDED TYPES - Tables with relations
// ============================================================================

export interface LeadWithRelations extends LeadRow {
  creator?: Pick<UserRow, 'id' | 'full_name' | 'email'>;
  assignee?: Pick<UserRow, 'id' | 'full_name' | 'email'>;
  lead_interactions?: LeadInteractionRow[];
}

export interface TaskWithRelations extends TaskRow {
  assignee?: Pick<UserRow, 'id' | 'full_name' | 'email'>;
  creator?: Pick<UserRow, 'id' | 'full_name' | 'email'>;
  task_completions?: TaskCompletionRow[];
}

// ============================================================================
// QUERY RESULT TYPES - For Supabase query results
// ============================================================================

export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

// ============================================================================
// FORM DATA TYPES - For forms and mutations
// ============================================================================

export interface LeadFormData {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  estimated_value: number;
  source?: string;
  notes?: string;
  next_action_type?: string;
  next_action_date?: string;
  assignee_id?: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  due_date?: string;
  assignee_id?: string;
  estimated_hours?: number;
  points?: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type WithRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as SupabaseError).message === 'string'
  );
}

export function isUser(value: unknown): value is UserRow {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value
  );
}

export function isLead(value: unknown): value is LeadRow {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'organization_id' in value
  );
}

// ============================================================================
// ERROR MESSAGE EXTRACTION
// ============================================================================

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (isSupabaseError(error)) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
      return (error as { message: string }).message;
    }
    
    if ('error' in error && typeof (error as { error: unknown }).error === 'string') {
      return (error as { error: string }).error;
    }
  }
  
  return 'An unexpected error occurred';
}
