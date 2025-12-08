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

export type Functions<T extends keyof Database['public']['Functions']> =
  Database['public']['Functions'][T];

// ============================================================================
// COMMON TABLE TYPES - For easy import
// ============================================================================

export type User = Tables<'users'>;
export type Organization = Tables<'organizations'>;
export type OrganizationMember = Tables<'organization_members'>;
export type Lead = Tables<'leads'>;
export type LeadInteraction = Tables<'lead_interactions'>;
export type Task = Tables<'tasks'>;
export type TaskCompletion = Tables<'task_completions'>;
export type OKR = Tables<'okrs'>;
export type KeyResult = Tables<'key_results'>;
export type Transaction = Tables<'transactions'>;
export type Revenue = Tables<'revenue'>;
export type Expense = Tables<'expenses'>;
export type KPI = Tables<'kpis'>;
export type Benchmark = Tables<'benchmarks'>;
export type IntegrationToken = Tables<'integration_tokens'>;
export type Subscription = Tables<'subscriptions'>;
export type Badge = Tables<'badges'>;
export type UserBadge = Tables<'user_badges'>;

// ============================================================================
// ENUM TYPES - For easy import
// ============================================================================

export type LeadType = Enums<'lead_type'>;
export type LeadScore = Enums<'lead_score'>;
export type LeadStatus = Enums<'lead_status'>;
export type LeadSource = Enums<'lead_source'>;
export type Priority = Enums<'priority'>;
export type NextActionType = Enums<'next_action_type'>;
export type TaskStatus = Enums<'task_status'>;
export type TaskPriority = Enums<'task_priority'>;
export type BadgeCategory = Enums<'badge_category'>;
export type SubscriptionTier = Enums<'subscription_tier'>;
export type SubscriptionStatus = Enums<'subscription_status'>;
export type TransactionType = Enums<'transaction_type'>;
export type TransactionStatus = Enums<'transaction_status'>;
export type IntegrationType = Enums<'integration_type'>;

// ============================================================================
// EXTENDED TYPES - Tables with relations
// ============================================================================

export interface LeadWithRelations extends Lead {
  creator?: Pick<User, 'id' | 'full_name' | 'email'>;
  assignee?: Pick<User, 'id' | 'full_name' | 'email'>;
  lead_interactions?: LeadInteraction[];
}

export interface OKRWithKeyResults extends OKR {
  key_results: KeyResult[];
  owner?: Pick<User, 'id' | 'full_name' | 'email'>;
}

export interface TaskWithRelations extends Task {
  assignee?: Pick<User, 'id' | 'full_name' | 'email'>;
  creator?: Pick<User, 'id' | 'full_name' | 'email'>;
  task_completions?: TaskCompletion[];
}

export interface OrganizationWithMembers extends Organization {
  organization_members?: (OrganizationMember & {
    user?: Pick<User, 'id' | 'full_name' | 'email'>;
  })[];
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
  source: LeadSource;
  notes?: string;
  next_action_type?: NextActionType;
  next_action_date?: string;
  assignee_id?: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string;
  assignee_id?: string;
  estimated_hours?: number;
  points?: number;
}

export interface OKRFormData {
  title: string;
  description?: string;
  quarter: string;
  year: number;
  owner_id?: string;
  key_results: KeyResultFormData[];
}

export interface KeyResultFormData {
  title: string;
  description?: string;
  target_value: number;
  current_value?: number;
  metric_type: string;
  unit: string;
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

// ============================================================================
// CONSTANTS
// ============================================================================

export const LEAD_SCORES: LeadScore[] = ['hot', 'warm', 'cold', 'dead'];
export const TASK_STATUSES: TaskStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];
export const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];
export const SUBSCRIPTION_TIERS: SubscriptionTier[] = ['free', 'professional', 'enterprise'];
