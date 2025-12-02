/**
 * Authentication types with proper TypeScript interfaces
 * Eliminates 'any' types from auth context
 */

import { User as SupabaseUser, Session, AuthError } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  username: string;
  role: 'admin' | 'leader' | 'employee';
  organization_id: string | null;
  strategic_objectives: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserOrganization {
  organization_id: string;
  role: string;
  organization_name: string;
}

export interface AuthContextType {
  user: SupabaseUser | null;
  session: Session | null;
  userProfile: UserProfile | null;
  currentOrganizationId: string | null;
  userOrganizations: UserOrganization[];
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  switchOrganization: (organizationId: string) => void;
  loading: boolean;
}

export interface LeaderEvaluation {
  score: number;
  feedback: string;
  approved: boolean;
  evaluated_at: string;
  evaluator_id: string;
}

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
