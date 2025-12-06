// Tipos completos para el sistema de leads - Eliminación de 'any'

// === Tipos base de lead ===

export type LeadStage = 
  | 'discovery' 
  | 'qualification' 
  | 'proposal' 
  | 'negotiation' 
  | 'won' 
  | 'lost';

export type LeadSource = 
  | 'website' 
  | 'referral' 
  | 'cold_call' 
  | 'social_media' 
  | 'email_campaign' 
  | 'event' 
  | 'partner' 
  | 'other';

export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface LeadData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  stage: LeadStage;
  source: LeadSource | null;
  priority: LeadPriority;
  estimated_value: number | null;
  notes: string | null;
  assigned_to: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string | null;
  last_contact_at: string | null;
  next_follow_up: string | null;
  tags: string[] | null;
  custom_fields: Record<string, unknown> | null;
  score: number | null;
}

// === Tipos para formularios ===

export interface LeadFormData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  stage: LeadStage;
  source?: LeadSource;
  priority: LeadPriority;
  estimated_value?: number;
  notes?: string;
  assigned_to?: string;
  tags?: string[];
}

export interface CreateLeadParams {
  data: LeadFormData;
  organizationId: string;
  userId: string;
}

export interface UpdateLeadParams {
  id: string;
  data: Partial<LeadFormData>;
}

// === Tipos para estadísticas ===

export interface LeadStats {
  total: number;
  byStage: Record<LeadStage, number>;
  totalValue: number;
  averageValue: number;
  conversionRate: number;
  averageDaysToClose: number;
}

export interface LeadStageStats {
  stage: LeadStage;
  count: number;
  value: number;
  percentage: number;
}

// === Tipos para filtros ===

export interface LeadFilters {
  search?: string;
  stage?: LeadStage | LeadStage[];
  source?: LeadSource | LeadSource[];
  priority?: LeadPriority | LeadPriority[];
  assignedTo?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  minValue?: number;
  maxValue?: number;
  tags?: string[];
}

export interface LeadSortOptions {
  field: keyof LeadData;
  direction: 'asc' | 'desc';
}

// === Tipos para pipeline ===

export interface PipelineColumn {
  id: LeadStage;
  title: string;
  leads: LeadData[];
  totalValue: number;
}

export interface DragResult {
  leadId: string;
  sourceStage: LeadStage;
  destinationStage: LeadStage;
  sourceIndex: number;
  destinationIndex: number;
}

// === Tipos para scoring ===

export interface LeadScoreBreakdown {
  demographic: number;
  engagement: number;
  behavioral: number;
  firmographic: number;
  total: number;
}

export interface LeadScoreFactors {
  emailProvided: boolean;
  phoneProvided: boolean;
  companyProvided: boolean;
  highValue: boolean;
  recentActivity: boolean;
  multipleInteractions: boolean;
}

// === Tipos para integraciones ===

export interface LeadExportData {
  leads: LeadData[];
  format: 'csv' | 'excel' | 'json';
  includeFields: (keyof LeadData)[];
}

export interface LeadImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

// === Props de componentes ===

export interface LeadCardProps {
  lead: LeadData;
  onEdit?: (lead: LeadData) => void;
  onDelete?: (leadId: string) => void;
  onMove?: (lead: LeadData, newStage: LeadStage) => void;
  showActions?: boolean;
  compact?: boolean;
}

export interface LeadDetailModalProps {
  lead: LeadData | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: (lead: LeadData) => void;
  onDelete?: (leadId: string) => void;
}

export interface CreateLeadModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: LeadFormData) => Promise<void>;
  initialStage?: LeadStage;
}

export interface PipelineBoardProps {
  leads: LeadData[];
  onLeadMove: (result: DragResult) => Promise<void>;
  onLeadClick: (lead: LeadData) => void;
  loading?: boolean;
}

// === Tipos para hooks ===

export interface UseLeadsResult {
  leads: LeadData[];
  loading: boolean;
  error: Error | null;
  stats: LeadStats | null;
  create: (data: LeadFormData) => Promise<LeadData>;
  update: (id: string, data: Partial<LeadFormData>) => Promise<LeadData>;
  remove: (id: string) => Promise<void>;
  moveToStage: (id: string, stage: LeadStage) => Promise<void>;
  refresh: () => Promise<void>;
}

export interface UseLeadFiltersResult {
  filters: LeadFilters;
  setFilter: <K extends keyof LeadFilters>(key: K, value: LeadFilters[K]) => void;
  clearFilters: () => void;
  filteredLeads: LeadData[];
}

// === Constantes ===

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  discovery: 'Descubrimiento',
  qualification: 'Calificación',
  proposal: 'Propuesta',
  negotiation: 'Negociación',
  won: 'Ganado',
  lost: 'Perdido',
};

export const LEAD_STAGE_COLORS: Record<LeadStage, string> = {
  discovery: 'bg-blue-500',
  qualification: 'bg-yellow-500',
  proposal: 'bg-purple-500',
  negotiation: 'bg-orange-500',
  won: 'bg-green-500',
  lost: 'bg-red-500',
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  website: 'Sitio Web',
  referral: 'Referido',
  cold_call: 'Llamada en Frío',
  social_media: 'Redes Sociales',
  email_campaign: 'Campaña Email',
  event: 'Evento',
  partner: 'Partner',
  other: 'Otro',
};

export const LEAD_PRIORITY_LABELS: Record<LeadPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};
