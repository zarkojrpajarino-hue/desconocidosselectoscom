import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface PhaseObjective {
  name: string;
  metric: string;
  target: number;
  current: number;
  linked_kr_id?: string | null;
}

export interface PhaseChecklistItem {
  task: string;
  completed: boolean;
  assigned_to?: string | null;
  linked_task_id?: string | null;
  category?: string;
}

export interface PhasePlaybook {
  title: string;
  description: string;
  steps: string[];
  tips: string[];
  resources: string[];
}

export interface BusinessPhase {
  id: string;
  organization_id: string;
  phase_number: number;
  phase_name: string;
  phase_description: string | null;
  methodology: 'lean_startup' | 'scaling_up' | 'hybrid' | null;
  duration_weeks: number | null;
  estimated_start: string | null;
  estimated_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  objectives: PhaseObjective[];
  checklist: PhaseChecklistItem[];
  progress_percentage: number | null;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  playbook: PhasePlaybook | null;
  generated_by_ai: boolean | null;
  regeneration_count: number | null;
  created_at: string | null;
  updated_at: string | null;
}

interface UseBusinessPhasesOptions {
  organizationId: string | null;
  autoGenerate?: boolean;
}

// Helper to safely parse JSON fields
function parseJsonField<T>(field: Json | null, defaultValue: T): T {
  if (!field) return defaultValue;
  if (typeof field === 'object') return field as T;
  try {
    return JSON.parse(String(field)) as T;
  } catch {
    return defaultValue;
  }
}

export function useBusinessPhases({ organizationId, autoGenerate = true }: UseBusinessPhasesOptions) {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch phases
  const {
    data: phases,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['business-phases', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('business_phases')
        .select('*')
        .eq('organization_id', organizationId)
        .order('phase_number', { ascending: true });

      if (error) throw error;

      // Parse JSON fields with proper typing
      return (data || []).map((phase): BusinessPhase => ({
        ...phase,
        methodology: phase.methodology as BusinessPhase['methodology'],
        status: (phase.status || 'pending') as BusinessPhase['status'],
        objectives: parseJsonField<PhaseObjective[]>(phase.objectives, []),
        checklist: parseJsonField<PhaseChecklistItem[]>(phase.checklist, []),
        playbook: parseJsonField<PhasePlaybook | null>(phase.playbook, null),
      }));
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Generate phases mutation
  const generatePhasesMutation = useMutation({
    mutationFn: async (regeneratePhase?: number) => {
      if (!organizationId) throw new Error('No organization ID');

      setIsGenerating(true);
      const { data, error } = await supabase.functions.invoke('generate-business-phases', {
        body: { 
          organization_id: organizationId,
          regenerate_phase: regeneratePhase 
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['business-phases', organizationId] });
      toast.success(
        data.regenerate_phase 
          ? 'Fase regenerada correctamente' 
          : 'Fases de negocio generadas con IA'
      );
    },
    onError: (error: Error) => {
      console.error('Error generating phases:', error);
      toast.error('Error generando fases: ' + error.message);
    },
    onSettled: () => {
      setIsGenerating(false);
    },
  });

  // Regenerate tasks from existing phases
  const regenerateTasksMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error('No organization ID');

      const { data, error } = await supabase.functions.invoke('regenerate-tasks-from-phases', {
        body: { organization_id: organizationId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', organizationId] });
      toast.success(`Se crearon ${data.tasks_created} tareas desde las fases`);
    },
    onError: (error: Error) => {
      console.error('Error regenerating tasks:', error);
      toast.error('Error regenerando tareas: ' + error.message);
    },
  });

  // Update phase mutation
  const updatePhaseMutation = useMutation({
    mutationFn: async ({ phaseId, updates }: { phaseId: string; updates: Record<string, unknown> }) => {
      const { data, error } = await supabase
        .from('business_phases')
        .update(updates)
        .eq('id', phaseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-phases', organizationId] });
    },
    onError: (error: Error) => {
      toast.error('Error actualizando fase: ' + error.message);
    },
  });

  // Toggle checklist item
  const toggleChecklistItem = useCallback(async (phaseId: string, taskIndex: number) => {
    const phase = phases?.find(p => p.id === phaseId);
    if (!phase) return;

    const updatedChecklist = [...phase.checklist];
    updatedChecklist[taskIndex] = {
      ...updatedChecklist[taskIndex],
      completed: !updatedChecklist[taskIndex].completed,
    };

    // Calculate new progress
    const totalItems = phase.objectives.length + updatedChecklist.length;
    const completedItems = 
      phase.objectives.filter(o => o.current >= o.target).length +
      updatedChecklist.filter(t => t.completed).length;
    const newProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Convert to Json type for Supabase
    const checklistJson = JSON.parse(JSON.stringify(updatedChecklist));
    
    await updatePhaseMutation.mutateAsync({
      phaseId,
      updates: { 
        checklist: checklistJson,
        progress_percentage: newProgress,
      },
    });
  }, [phases, updatePhaseMutation]);

  // Update objective progress
  const updateObjectiveProgress = useCallback(async (
    phaseId: string, 
    objectiveIndex: number, 
    newValue: number
  ) => {
    const phase = phases?.find(p => p.id === phaseId);
    if (!phase) return;

    const updatedObjectives = [...phase.objectives];
    updatedObjectives[objectiveIndex] = {
      ...updatedObjectives[objectiveIndex],
      current: newValue,
    };

    // Calculate new progress
    const totalItems = updatedObjectives.length + phase.checklist.length;
    const completedItems = 
      updatedObjectives.filter(o => o.current >= o.target).length +
      phase.checklist.filter(t => t.completed).length;
    const newProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    const objectivesJson = JSON.parse(JSON.stringify(updatedObjectives));
    
    await updatePhaseMutation.mutateAsync({
      phaseId,
      updates: { 
        objectives: objectivesJson,
        progress_percentage: newProgress,
      },
    });
  }, [phases, updatePhaseMutation]);

  // Activate next phase
  const activatePhase = useCallback(async (phaseNumber: number) => {
    const phase = phases?.find(p => p.phase_number === phaseNumber);
    if (!phase) return;

    // First, mark previous phase as completed if exists
    const previousPhase = phases?.find(p => p.phase_number === phaseNumber - 1);
    if (previousPhase && previousPhase.status === 'active') {
      await updatePhaseMutation.mutateAsync({
        phaseId: previousPhase.id,
        updates: { 
          status: 'completed',
          actual_end: new Date().toISOString().split('T')[0],
        },
      });
    }

    // Activate the new phase
    await updatePhaseMutation.mutateAsync({
      phaseId: phase.id,
      updates: { 
        status: 'active',
        actual_start: new Date().toISOString().split('T')[0],
      },
    });

    toast.success(`Fase ${phaseNumber}: ${phase.phase_name} activada`);
  }, [phases, updatePhaseMutation]);

  // Auto-generate phases if none exist
  useEffect(() => {
    if (autoGenerate && organizationId && phases && phases.length === 0 && !isLoading && !isGenerating) {
      // Don't auto-generate, let user trigger it
    }
  }, [autoGenerate, organizationId, phases, isLoading, isGenerating]);

  // Computed values
  const activePhase = phases?.find(p => p.status === 'active');
  const currentPhaseNumber = activePhase?.phase_number || 1;
  const overallProgress = phases?.length 
    ? Math.round(phases.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / phases.length)
    : 0;

  return {
    phases: phases || [],
    isLoading,
    error,
    isGenerating,
    isRegeneratingTasks: regenerateTasksMutation.isPending,
    activePhase,
    currentPhaseNumber,
    overallProgress,
    generatePhases: generatePhasesMutation.mutate,
    regeneratePhase: (phaseNumber: number) => generatePhasesMutation.mutate(phaseNumber),
    regenerateTasks: regenerateTasksMutation.mutate,
    updatePhase: updatePhaseMutation.mutate,
    toggleChecklistItem,
    updateObjectiveProgress,
    activatePhase,
    refetch,
  };
}
