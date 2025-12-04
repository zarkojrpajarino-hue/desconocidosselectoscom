/**
 * Central Type Exports
 * Importa desde aquí para acceder a todos los tipos del proyecto
 * 
 * NOTA: Algunos módulos tienen tipos con nombres similares.
 * Para evitar conflictos, importa directamente del archivo específico cuando sea necesario:
 * - import { AIAnalysisResult } from '@/types/ai-analysis-dashboard'; // Para dashboard
 * - import { AIAnalysisData } from '@/types/ai-analysis.types'; // Para el hook original
 */

// ============================================
// NEW TYPE MODULES (sin conflictos)
// ============================================

// Practicar Types (Simulador, Playbook, Guia, Calculadora)
export * from './practicar';

// Herramientas Types (LeadScoring, CustomerJourney, GrowthModel, BuyerPersona)
export * from './herramientas';

// Export Types (ExportButton.tsx)
export * from './export';

// Extended Task Types (TaskList.tsx)
export * from './tasks-extended';

// ============================================
// MODULES WITH POTENTIAL CONFLICTS
// Import directly from specific files when needed:
// ============================================

// Enterprise Data Types - import from '@/types/enterprise'
// export * from './enterprise';

// AI Analysis Dashboard Types - import from '@/types/ai-analysis-dashboard'
// export * from './ai-analysis-dashboard';

// OKR Types - import from '@/types/okrs'
// export * from './okrs';

// ============================================
// EXISTING TYPE MODULES
// ============================================

// Auth Types
export * from './auth';

// Roles Types  
export * from './roles';

// Startup Onboarding Types
export * from './startup-onboarding';

// AI Resources Types
export * from './ai-resources.types';

// Original AI Analysis Types
export * from './ai-analysis.types';

// Original Tasks Types
export * from './tasks';

// KPI Advanced Types
export * from './kpi-advanced.types';

// ============================================
// CORE APPLICATION TYPES
// ============================================

export interface User {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: 'admin' | 'leader' | 'employee';
  strategic_objectives: string | null;
  created_at: string | null;
}

export interface WeeklyData {
  id: string;
  user_id: string;
  week_start: string;
  week_deadline: string;
  mode: 'conservador' | 'moderado' | 'agresivo';
  task_limit: number;
  created_at: string | null;
}

export interface UserStats {
  id: string;
  user_id: string;
  total_points: number | null;
  current_streak: number | null;
  best_streak: number | null;
  tasks_completed_total: number | null;
  tasks_validated_total: number | null;
  perfect_weeks: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  area: string | null;
  phase: number;
  user_id: string;
  leader_id: string | null;
  order_index: number;
  estimated_cost: number | null;
  actual_cost: number | null;
  created_at: string | null;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  user_id: string;
  completed_by_user: boolean | null;
  validated_by_leader: boolean | null;
  completed_at: string | null;
  ai_questions: AIQuestions | null;
  user_insights: UserInsights | null;
  leader_evaluation: LeaderEvaluation | null;
  task_metrics: TaskMetrics | null;
  impact_measurement: ImpactMeasurement | null;
  collaborator_feedback: CollaboratorFeedback | null;
  leader_feedback: LeaderFeedback | null;
}

// Structured types for task completion data
export interface AIQuestions {
  questions: Array<{
    id: string;
    question: string;
    answer: string;
    type: 'text' | 'number' | 'boolean';
  }>;
  generated_at: string;
}

export interface UserInsights {
  lessons_learned: string;
  challenges_faced: string;
  improvements_suggested: string;
  time_spent_hours: number;
  submitted_at: string;
}

export interface LeaderEvaluation {
  score: number;
  feedback: string;
  approved: boolean;
  evaluated_at: string;
  evaluator_id: string;
}

export interface TaskMetrics {
  actual_cost: number;
  time_invested: number;
  quality_score: number;
  impact_level: 'low' | 'medium' | 'high';
  completion_date: string;
}

export interface ImpactMeasurement {
  revenue_impact: number | null;
  cost_savings: number | null;
  customer_satisfaction_change: number | null;
  efficiency_improvement: number | null;
  notes: string;
  measured_at: string;
}

export interface CollaboratorFeedback {
  collaborator_id: string;
  rating: number;
  feedback: string;
  would_collaborate_again: boolean;
  submitted_at: string;
}

export interface LeaderFeedback {
  leader_id: string;
  feedback: string;
  suggestions: string;
  rating: number;
  provided_at: string;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon_emoji: string | null;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: string | null;
  points_required: number | null;
  created_at: string | null;
}

export interface BadgeMetadata {
  trigger?: string;
  context?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string | null;
  metadata: BadgeMetadata | null;
  badges: Badge;
}

export interface AlertContext {
  entity_type?: string;
  entity_id?: string;
  metric_name?: string;
  metric_value?: number;
  threshold?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface Alert {
  id: string;
  alert_type: string;
  severity: 'urgent' | 'important' | 'info' | 'celebration' | 'opportunity';
  title: string;
  message: string;
  source: string;
  category: string | null;
  target_user_id: string | null;
  target_role: string | null;
  actionable: boolean | null;
  action_label: string | null;
  action_url: string | null;
  context: AlertContext | null;
  dismissed: boolean | null;
  dismissed_at: string | null;
  dismissed_by: string | null;
  viewed: boolean | null;
  viewed_at: string | null;
  email_sent: boolean | null;
  email_sent_at: string | null;
  created_at: string | null;
  expires_at: string | null;
  week_group: string | null;
  included_in_summary: boolean | null;
}

// =====================================================
// CRM TYPES - Professional Lead Management System
// =====================================================

export type LeadType = 'cold' | 'warm' | 'hot' | 'mql' | 'sql';
export type LeadScore = 'A' | 'B' | 'C' | 'D';
export type LeadStatus = 'new' | 'lead' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost' | 'on_hold';
export type LeadSource = 'website' | 'referral' | 'cold_call' | 'linkedin' | 'email' | 'event' | 'instagram' | 'facebook' | 'google_ads' | 'google' | 'content' | 'partner' | 'phone' | 'other';
export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type NextActionType = 'call' | 'email' | 'meeting' | 'whatsapp' | 'follow_up' | 'demo' | 'proposal' | 'other';
export type InteractionType = 'call' | 'email' | 'meeting' | 'whatsapp' | 'instagram_dm' | 'proposal_sent' | 'follow_up' | 'note' | 'stage_change';
export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface Lead {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  position: string | null;
  lead_type: LeadType;
  lead_score: LeadScore;
  stage: LeadStatus;
  pipeline_stage: string | null;
  source: LeadSource;
  estimated_value: number;
  probability: number;
  interested_products: string[] | null;
  next_action_date: string | null;
  next_action_type: NextActionType | null;
  priority: Priority;
  created_by: string;
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  notes: string | null;
  tags: string[] | null;
  last_contact_date: string | null;
  conversion_date: string | null;
  lost_reason: string | null;
  next_action: string | null;
  expected_revenue: number | null;
  converted_to_customer: boolean | null;
  revenue_entry_id: string | null;
  won_date: string | null;
  lost_date: string | null;
  creator?: User;
  assignee?: User;
  assigned_user_name?: string;
  assigned_to_name?: string;
}

export interface LeadInteraction {
  id: string;
  lead_id: string;
  user_id: string;
  interaction_type: InteractionType;
  subject: string;
  description: string | null;
  outcome: string | null;
  next_steps: string | null;
  created_at: string;
  created_by: string | null;
  duration_minutes: number | null;
  sentiment: Sentiment | null;
}

export interface UserLeadStats {
  user_id: string;
  full_name: string;
  role: string;
  total_leads: number;
  won_leads: number;
  hot_leads: number;
  total_won_value: number;
  total_pipeline_value: number;
}

export interface CRMGlobalStats {
  total_leads: number;
  new_leads: number;
  hot_leads: number;
  won_leads: number;
  lost_leads: number;
  total_pipeline_value: number;
  total_won_value: number;
  avg_deal_size: number;
}
