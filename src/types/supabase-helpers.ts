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

export type User = Tables<'users'>;
export type Organization = Tables<'organizations'>;
export type Lead = Tables<'leads'>;
export type LeadInteraction = Tables<'lead_interactions'>;
export type Task = Tables<'tasks'>;
export type TaskCompletion = Tables<'task_completions'>;
export type Objective = Tables<'objectives'>;
export type KeyResult = Tables<'key_results'>;
export type RevenueEntry = Tables<'revenue_entries'>;
export type ExpenseEntry = Tables<'expense_entries'>;
export type Badge = Tables<'badges'>;
export type UserBadge = Tables<'user_badges'>;
export type SmartAlert = Tables<'smart_alerts'>;
export type Notification = Tables<'notifications'>;
export type BusinessMetrics = Tables<'business_metrics'>;

// ============================================================================
// EXTENDED TYPES - Tables with relations
// ============================================================================

export interface LeadWithRelations extends Lead {
  creator?: Pick<User, 'id' | 'full_name' | 'email'>;
  assignee?: Pick<User, 'id' | 'full_name' | 'email'>;
  lead_interactions?: LeadInteraction[];
}

export interface TaskWithRelations extends Task {
  assignee?: Pick<User, 'id' | 'full_name' | 'email'>;
  creator?: Pick<User, 'id' | 'full_name' | 'email'>;
  task_completions?: TaskCompletion[];
}

// ============================================================================
// QUERY RESULT TYPES - For Supabase query results
// ============================================================================

export interface SupabaseQueryResult<T> {
  data: T | null;
  error: SupabaseError | null;
}

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
  assigned_to?: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  due_date?: string;
  assigned_to?: string;
  estimated_hours?: number;
  points?: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type WithRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// Nullable fields helper
export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

// Deep partial helper
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

export function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value
  );
}

export function isLead(value: unknown): value is Lead {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'organization_id' in value
  );
}

export function isTask(value: unknown): value is Task {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value &&
    'organization_id' in value
  );
}

// ============================================================================
// ERROR MESSAGE EXTRACTION
// ============================================================================

/**
 * Safely extract error message from unknown error
 */
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
  }
  
  return 'An unexpected error occurred';
}