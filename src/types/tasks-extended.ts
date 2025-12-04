/**
 * Tipos para TaskList.tsx y componentes relacionados
 * Elimina los 8 tipos 'any' de este archivo
 */

import type { ReactNode } from 'react';

// ============================================
// TASK CORE TYPES
// ============================================

export interface TaskExtended {
  id: string;
  title: string;
  description: string;
  area: string;
  phase: number;
  phase_id: string;
  user_id: string;
  leader_id: string | null;
  organization_id: string;
  status: TaskStatus;
  priority: TaskPriorityLevel;
  due_date: string | null;
  scheduled_date: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  is_collaborative: boolean;
  collaborator_user_id: string | null;
  investments_needed: InvestmentNeeded[] | null;
  tools_needed: string[] | null;
  expected_outcome: string | null;
  actual_outcome: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'validated' | 'blocked';
export type TaskPriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface InvestmentNeeded {
  type: 'money' | 'time' | 'resources' | 'tools';
  amount?: number;
  currency?: string;
  description: string;
  priority: 'required' | 'optional';
}

// ============================================
// TASK COMPLETION
// ============================================

export interface TaskCompletionExtended {
  id: string;
  task_id: string;
  user_id: string;
  completed_at: string | null;
  validated_by_leader: boolean;
  validated_at: string | null;
  completion_notes: string | null;
  actual_time_spent: number | null;
  difficulty_rating: number | null;
  satisfaction_rating: number | null;
  blockers_encountered: string | null;
  lessons_learned: string | null;
  collaborator_feedback: CollaboratorFeedbackData | null;
  leader_feedback: LeaderFeedbackData | null;
}

export interface CollaboratorFeedbackData {
  rating: number;
  communication_score: number;
  collaboration_score: number;
  reliability_score: number;
  comment: string | null;
}

export interface LeaderFeedbackData {
  rating: number;
  quality_score: number;
  timeliness_score: number;
  initiative_score: number;
  comment: string | null;
  improvement_suggestions: string[] | null;
}

// ============================================
// USER TYPES
// ============================================

export interface TaskUser {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  email: string;
}

// ============================================
// TASK OPERATIONS
// ============================================

export interface TaskToggleParams {
  task: TaskExtended;
  completion: TaskCompletionExtended | null;
  isCompleted: boolean;
}

export interface TaskSwapRequest {
  id?: string;
  task_id: string;
  user_id: string;
  reason: string;
  alternative_task_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

// ============================================
// TASK LIST HELPERS
// ============================================

export function getTaskCompletionStatus(
  task: TaskExtended, 
  completion: TaskCompletionExtended | null
): 'pending' | 'completed' | 'validated' {
  if (!completion) return 'pending';
  if (completion.validated_by_leader) return 'validated';
  if (completion.completed_at) return 'completed';
  return 'pending';
}

export function extractUserIds(tasks: TaskExtended[]): string[] {
  const ids = new Set<string>();
  tasks.forEach(task => {
    if (task.leader_id) ids.add(task.leader_id);
    if (task.user_id) ids.add(task.user_id);
    if (task.collaborator_user_id) ids.add(task.collaborator_user_id);
  });
  return Array.from(ids);
}

export function createUserMap(users: TaskUser[]): Map<string, TaskUser> {
  const map = new Map<string, TaskUser>();
  users.forEach(user => map.set(user.id, user));
  return map;
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface TaskListComponentProps {
  tasks: TaskExtended[];
  completions: Map<string, TaskCompletionExtended>;
  userMap: Map<string, TaskUser>;
  currentUserId: string;
  canSwap: boolean;
  onToggleTask: (params: TaskToggleParams) => Promise<void>;
  onSwapTask: (task: TaskExtended) => void;
  onViewDetails: (task: TaskExtended) => void;
  loading?: boolean;
}

export interface TaskCardComponentProps {
  task: TaskExtended;
  completion: TaskCompletionExtended | null;
  user: TaskUser | null;
  leader: TaskUser | null;
  isCurrentUser: boolean;
  canSwap: boolean;
  onToggle: () => void;
  onSwap: () => void;
  onViewDetails: () => void;
}

export interface TaskSwapModalComponentProps {
  isOpen: boolean;
  task: TaskExtended | null;
  availableTasks: TaskExtended[];
  onClose: () => void;
  onSubmit: (request: Omit<TaskSwapRequest, 'id' | 'requested_at' | 'resolved_at' | 'resolved_by' | 'status'>) => void;
}

export interface LeaderValidationModalComponentProps {
  isOpen: boolean;
  task: TaskExtended | null;
  completion: TaskCompletionExtended | null;
  onClose: () => void;
  onValidate: (feedback: LeaderFeedbackData) => void;
}
