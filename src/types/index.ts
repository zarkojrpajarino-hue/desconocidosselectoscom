/**
 * FASE 3: TypeScript types centralizados
 * Elimina any types y mejora type safety
 */

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
  ai_questions: Record<string, any> | null;
  user_insights: Record<string, any> | null;
  leader_evaluation: Record<string, any> | null;
  task_metrics: Record<string, any> | null;
  impact_measurement: Record<string, any> | null;
  collaborator_feedback: Record<string, any> | null;
  leader_feedback: Record<string, any> | null;
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

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string | null;
  metadata: Record<string, any> | null;
  badges: Badge;
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
  context: Record<string, any> | null;
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
  pipeline_stage: string | null; // Ahora acepta cualquier nombre de etapa personalizada
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