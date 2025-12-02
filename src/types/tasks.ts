// Types para el sistema de tareas

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
  organization_id?: string;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  user_id: string;
  organization_id?: string;
  completed_at: string;
  completed_by_user: boolean;
  validated_by_leader: boolean | null;
  leader_evaluation?: LeaderEvaluation | null;
  ai_questions?: AIQuestions | null;
  user_insights?: UserInsights | null;
  task_metrics?: TaskMetrics | null;
  impact_measurement?: ImpactMeasurement | null;
  collaborator_feedback?: CollaboratorFeedback[] | null;
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

export interface TaskCompletionData {
  completed_at?: string;
  completed_by_user?: boolean;
  notes?: string;
  actual_cost?: number;
  user_insights?: UserInsights;
  task_metrics?: TaskMetrics;
}

export interface CompleteTaskParams {
  taskId: string;
  userId: string;
  organizationId?: string;
  data: TaskCompletionData;
}

export interface TaskSwap {
  id: string;
  user_id: string;
  week_number: number;
  original_task_id: string;
  new_task_id: string;
  reason: string;
  created_at: string;
}
