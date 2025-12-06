// Tipos completos para el sistema de OKRs - Eliminación de 'any'

// === Tipos base de OKR ===

export type OKRStatus = 'on_track' | 'at_risk' | 'off_track' | 'completed' | 'not_started';

export type OKRPeriod = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'annual';

export type KeyResultType = 'number' | 'percentage' | 'currency' | 'boolean';

// === Tipos de Objective ===

export interface ObjectiveData {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  organization_id: string;
  parent_id: string | null;
  period: OKRPeriod;
  year: number;
  status: OKRStatus;
  progress: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string | null;
  is_company_level: boolean;
  tags: string[] | null;
}

// === Tipos de Key Result ===

export interface KeyResultData {
  id: string;
  objective_id: string;
  title: string;
  description: string | null;
  type: KeyResultType;
  start_value: number;
  current_value: number;
  target_value: number;
  unit: string | null;
  owner_id: string | null;
  status: OKRStatus;
  progress: number;
  weight: number;
  created_at: string;
  updated_at: string | null;
  auto_update: boolean;
  linked_kpi: string | null;
}

// === Tipos de Check-in ===

export interface CheckInData {
  id: string;
  key_result_id: string;
  user_id: string;
  previous_value: number;
  new_value: number;
  confidence_level: 'low' | 'medium' | 'high';
  notes: string | null;
  blockers: string | null;
  next_steps: string | null;
  created_at: string;
}

// === Tipos combinados ===

export interface ObjectiveWithKeyResults extends ObjectiveData {
  key_results: KeyResultData[];
  owner?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface OKRTreeNode {
  objective: ObjectiveData;
  key_results: KeyResultData[];
  children: OKRTreeNode[];
}

// === Tipos para formularios ===

export interface ObjectiveFormData {
  title: string;
  description?: string;
  period: OKRPeriod;
  year: number;
  start_date: string;
  end_date: string;
  owner_id: string;
  parent_id?: string;
  is_company_level?: boolean;
  tags?: string[];
}

export interface KeyResultFormData {
  title: string;
  description?: string;
  type: KeyResultType;
  start_value: number;
  target_value: number;
  unit?: string;
  owner_id?: string;
  weight?: number;
  auto_update?: boolean;
  linked_kpi?: string;
}

export interface CheckInFormData {
  new_value: number;
  confidence_level: 'low' | 'medium' | 'high';
  notes?: string;
  blockers?: string;
  next_steps?: string;
}

// === Tipos para estadísticas ===

export interface OKRStats {
  total_objectives: number;
  completed_objectives: number;
  at_risk_objectives: number;
  average_progress: number;
  on_track_percentage: number;
}

export interface OKRProgressByPeriod {
  period: OKRPeriod;
  year: number;
  objectives_count: number;
  average_progress: number;
  completed_count: number;
}

// === Tipos para filtros ===

export interface OKRFilters {
  period?: OKRPeriod;
  year?: number;
  status?: OKRStatus | OKRStatus[];
  owner_id?: string;
  is_company_level?: boolean;
  search?: string;
}

// === Tipos para dependencias ===

export interface OKRDependency {
  id: string;
  source_objective_id: string;
  target_objective_id: string;
  dependency_type: 'blocks' | 'depends_on' | 'related';
  description: string | null;
  created_at: string;
}

// === Tipos para retrospectivas ===

export interface OKRRetrospective {
  id: string;
  objective_id: string;
  period: OKRPeriod;
  year: number;
  what_went_well: string;
  what_could_improve: string;
  learnings: string;
  action_items: string[];
  created_at: string;
  created_by: string;
}

// === Props de componentes ===

export interface OKRDashboardProps {
  organizationId: string;
  userId?: string;
  showCompanyLevel?: boolean;
}

export interface ObjectiveCardProps {
  objective: ObjectiveWithKeyResults;
  onEdit?: (objective: ObjectiveData) => void;
  onDelete?: (objectiveId: string) => void;
  onCheckIn?: (keyResultId: string) => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export interface KeyResultRowProps {
  keyResult: KeyResultData;
  onCheckIn?: (keyResult: KeyResultData) => void;
  onEdit?: (keyResult: KeyResultData) => void;
  showOwner?: boolean;
}

export interface OKRProgressModalProps {
  objective: ObjectiveWithKeyResults | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export interface CheckInModalProps {
  keyResult: KeyResultData | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CheckInFormData) => Promise<void>;
}

// === Tipos para hooks ===

export interface UseOKRsResult {
  objectives: ObjectiveWithKeyResults[];
  loading: boolean;
  error: Error | null;
  stats: OKRStats | null;
  createObjective: (data: ObjectiveFormData) => Promise<ObjectiveData>;
  updateObjective: (id: string, data: Partial<ObjectiveFormData>) => Promise<ObjectiveData>;
  deleteObjective: (id: string) => Promise<void>;
  createKeyResult: (objectiveId: string, data: KeyResultFormData) => Promise<KeyResultData>;
  updateKeyResult: (id: string, data: Partial<KeyResultFormData>) => Promise<KeyResultData>;
  deleteKeyResult: (id: string) => Promise<void>;
  submitCheckIn: (keyResultId: string, data: CheckInFormData) => Promise<CheckInData>;
  refresh: () => Promise<void>;
}

// === Constantes ===

export const OKR_STATUS_LABELS: Record<OKRStatus, string> = {
  on_track: 'En Camino',
  at_risk: 'En Riesgo',
  off_track: 'Fuera de Camino',
  completed: 'Completado',
  not_started: 'No Iniciado',
};

export const OKR_STATUS_COLORS: Record<OKRStatus, string> = {
  on_track: 'bg-green-500',
  at_risk: 'bg-yellow-500',
  off_track: 'bg-red-500',
  completed: 'bg-blue-500',
  not_started: 'bg-gray-500',
};

export const OKR_PERIOD_LABELS: Record<OKRPeriod, string> = {
  Q1: 'Q1 (Ene-Mar)',
  Q2: 'Q2 (Abr-Jun)',
  Q3: 'Q3 (Jul-Sep)',
  Q4: 'Q4 (Oct-Dic)',
  annual: 'Anual',
};

export const KEY_RESULT_TYPE_LABELS: Record<KeyResultType, string> = {
  number: 'Número',
  percentage: 'Porcentaje',
  currency: 'Moneda',
  boolean: 'Sí/No',
};
