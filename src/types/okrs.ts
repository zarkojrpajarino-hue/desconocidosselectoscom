/**
 * Tipos para OKRs - OrganizationOKRs.tsx, OrganizationOKRHistory.tsx, UserOKRHistory.tsx
 * Elimina los tipos 'any' de estos archivos
 */

// ============================================
// CORE OKR TYPES
// ============================================

export interface Objective {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  owner_id: string;
  quarter: OKRQuarter;
  year: number;
  status: OKRStatus;
  priority: OKRPriorityLevel;
  category: string | null;
  tags: string[] | null;
  parent_objective_id: string | null;
  created_at: string;
  updated_at: string;
  key_results?: KeyResult[];
  owner?: OKRUser;
}

export interface KeyResult {
  id: string;
  objective_id: string;
  title: string;
  description: string | null;
  metric_type: MetricType;
  start_value: number;
  current_value: number;
  target_value: number;
  unit: string;
  owner_id: string | null;
  confidence_level: number;
  status: KRStatus;
  check_ins?: OKRCheckIn[];
  created_at: string;
  updated_at: string;
}

export type OKRQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type OKRStatus = 'draft' | 'active' | 'on_track' | 'at_risk' | 'behind' | 'completed' | 'cancelled';
export type OKRPriorityLevel = 'low' | 'medium' | 'high' | 'critical';
export type MetricType = 'percentage' | 'number' | 'currency' | 'boolean' | 'milestone';
export type KRStatus = 'not_started' | 'in_progress' | 'achieved' | 'missed' | 'at_risk';

// ============================================
// CHECK-INS
// ============================================

export interface OKRCheckIn {
  id: string;
  key_result_id: string;
  value: number;
  previous_value: number;
  notes: string | null;
  blockers: string | null;
  confidence_level: number;
  created_by: string;
  created_at: string;
}

// ============================================
// USER
// ============================================

export interface OKRUser {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  email: string;
}

// ============================================
// HISTORY & ARCHIVE
// ============================================

export interface OKRHistoryEntry {
  id: string;
  objective: Objective;
  final_progress: number;
  achieved: boolean;
  archived_at: string;
  lessons_learned: string | null;
  retrospective_notes: string | null;
}

export interface QuarterlyOKRSummary {
  quarter: OKRQuarter;
  year: number;
  total_objectives: number;
  completed_objectives: number;
  average_progress: number;
  achievement_rate: number;
  objectives: Objective[];
}

// ============================================
// CALCULATIONS
// ============================================

export function calculateKRProgress(kr: KeyResult): number {
  const { start_value, target_value, current_value, metric_type } = kr;
  
  // Boolean: 0 or 100
  if (metric_type === 'boolean') {
    return current_value >= target_value ? 100 : 0;
  }
  
  // Milestone: direct percentage
  if (metric_type === 'milestone') {
    return Math.min(100, Math.max(0, current_value));
  }
  
  // Avoid division by zero
  if (target_value === start_value) return 0;
  
  // Calculate percentage progress
  const progress = ((current_value - start_value) / (target_value - start_value)) * 100;
  return Math.min(100, Math.max(0, Math.round(progress)));
}

export function calculateObjectiveProgress(objective: Objective): number {
  const keyResults = objective.key_results || [];
  
  if (keyResults.length === 0) return 0;
  
  const totalProgress = keyResults.reduce((sum, kr) => sum + calculateKRProgress(kr), 0);
  return Math.round(totalProgress / keyResults.length);
}

export function getOKRStatusColor(status: OKRStatus): string {
  const colors: Record<OKRStatus, string> = {
    draft: 'gray',
    active: 'blue',
    on_track: 'green',
    at_risk: 'yellow',
    behind: 'red',
    completed: 'green',
    cancelled: 'gray'
  };
  return colors[status] || 'gray';
}

export function getProgressStatus(progress: number): OKRStatus {
  if (progress >= 100) return 'completed';
  if (progress >= 70) return 'on_track';
  if (progress >= 40) return 'at_risk';
  return 'behind';
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface OKRsDashboardComponentProps {
  organizationId: string;
  userId: string;
  quarter?: OKRQuarter;
  year?: number;
}

export interface OKRCardComponentProps {
  objective: Objective;
  onEdit: (objective: Objective) => void;
  onDelete: (id: string) => void;
  onCheckIn: (kr: KeyResult) => void;
  canEdit: boolean;
}

export interface KeyResultRowComponentProps {
  keyResult: KeyResult;
  onCheckIn: () => void;
  onEdit: () => void;
  canEdit: boolean;
}

export interface OKRCheckInFormComponentProps {
  keyResult: KeyResult;
  onSubmit: (checkIn: Omit<OKRCheckIn, 'id' | 'key_result_id' | 'created_by' | 'created_at'>) => void;
  onCancel: () => void;
}

export interface OKRHistoryComponentProps {
  organizationId: string;
  userId?: string;
  filterByUser?: boolean;
}

export interface OKRProgressModalComponentProps {
  isOpen: boolean;
  keyResult: KeyResult | null;
  onClose: () => void;
  onSubmit: (value: number, notes: string) => void;
}
