// Tipos completos para el sistema de tareas - Eliminación de 'any'

import type { AIResourceType } from './ai-resources.types';

// === Tipos base de tarea ===

export interface TaskData {
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
  estimated_hours?: number | null;
  actual_hours?: number | null;
  is_collaborative?: boolean;
  created_at?: string | null;
  organization_id?: string;
}

// === Tipos de feedback ===

export interface FeedbackData {
  whatWentWell: string;
  metDeadlines: 'always' | 'almost_always' | 'sometimes' | 'rarely' | 'never';
  whatToImprove: string;
  wouldRecommend: 'definitely_yes' | 'probably_yes' | 'not_sure' | 'probably_no' | 'definitely_no';
  rating: number;
}

// === Tipos de medición de impacto ===

export interface KeyMetric {
  metric: string;
  value: string;
  unit: string;
}

export interface InvestmentNeeded {
  category: string;
  amount: number;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export interface AIQuestionsData {
  [questionId: string]: string | number | boolean;
}

export interface ImpactMeasurementData {
  ai_questions: AIQuestionsData;
  key_metrics: KeyMetric[];
  impact_rating: 'exceeded' | 'met' | 'close' | 'below';
  impact_explanation: string;
  future_decisions: string;
  investments_needed: InvestmentNeeded[] | null;
}

// === Tipos de completion ===

export interface TaskCompletionData {
  id: string;
  task_id: string;
  user_id: string;
  completed_at?: string;
  completed_by_user?: boolean;
  validated_by_leader?: boolean;
  leader_feedback?: FeedbackData | null;
  collaborator_feedback?: FeedbackData | null;
  impact_measurement?: ImpactMeasurementData | null;
  ai_questions?: AIQuestionsData | null;
  organization_id?: string;
}

// === Tipos de estado de tarea ===

export interface TaskCompletionStatus {
  percentage: number;
  message: string;
  needsFeedback: boolean;
  needsImpactMeasurement: boolean;
  buttonText: string;
}

// === Tipos de badge ===

export interface BadgeData {
  name: string;
  description: string;
  icon_emoji: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

// === Tipos de alerta ===

export interface SmartAlertPayload {
  alert_type?: string;
  context?: {
    badge_data?: BadgeData;
  };
}

// === Tipos de usuario ===

export interface UserBasicInfo {
  id: string;
  full_name: string | null;
  username: string | null;
}

// === Tipos de panel AI ===

export interface AIPanelTaskData {
  id: string;
  title: string;
  description: string;
  resourceType: AIResourceType;
}

// === Props de componentes ===

export interface TaskListProps {
  userId: string | undefined;
  currentPhase: number | undefined;
  isLocked?: boolean;
  mode?: 'conservador' | 'moderado' | 'agresivo';
  taskLimit?: number;
}

export interface TaskCardProps {
  task: TaskData;
  completion: TaskCompletionData | undefined;
  isCompleted: boolean;
  status: TaskCompletionStatus;
  canSwap: boolean;
  isLocked: boolean;
  userId: string;
  leadersById: Record<string, string>;
  onToggle: (task: TaskData, completion: TaskCompletionData | undefined, isCompleted: boolean) => void;
  onSwap: (task: TaskData) => void;
  onOpenAIPanel: (task: TaskData) => void;
  onOpenFeedback: (task: TaskData, type: 'to_leader' | 'to_collaborator') => void;
  onOpenImpactMeasurement: (task: TaskData) => void;
}

// === Tipos para hooks ===

export interface UseTaskSwapsResult {
  remainingSwaps: number;
  reload: () => Promise<void>;
}

// === Tipos de actions ===

export type FeedbackType = 'to_leader' | 'to_collaborator';

export interface AwardPointsPayload {
  user_id: string;
  action: 'feedback_given' | 'task_validated' | 'task_completed_collaborative' | 'task_completed_individual';
  task_id: string;
}

export interface SmartAlertInsert {
  alert_type: string;
  severity: 'info' | 'warning' | 'important' | 'celebration' | 'urgent';
  title: string;
  message: string;
  source: string;
  category: string;
  target_user_id: string | null;
  actionable: boolean;
  action_label?: string;
  action_url?: string;
}
