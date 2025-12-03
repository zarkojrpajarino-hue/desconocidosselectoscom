import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface ExternalLink {
  title: string;
  url: string;
}

export interface GuideStep {
  id: string;
  step_number: number;
  title: string;
  description: string;
  category: string;
  detailed_guide: string;
  success_criteria: string;
  tips: string[] | null;
  recommended_tools: string[] | null;
  external_links: ExternalLink[] | null;
  points: number;
  estimated_time_hours: number | null;
  prerequisite_steps: number[] | null;
}

export interface StepProgress {
  id: string;
  organization_id: string;
  step_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  notes: string | null;
  completion_data: Record<string, unknown> | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface GuideAchievement {
  id: string;
  organization_id: string;
  achievement_type: string;
  achievement_name: string;
  achievement_description: string | null;
  achievement_icon: string | null;
  earned_at: string;
}

export interface GuideMetrics {
  id: string;
  organization_id: string;
  total_steps: number;
  completed_steps: number;
  in_progress_steps: number;
  total_points: number;
  current_category: string | null;
  overall_progress_percentage: number;
}

export const useStartupGuide = (organizationId: string | null) => {
  const [steps, setSteps] = useState<GuideStep[]>([]);
  const [progress, setProgress] = useState<Record<string, StepProgress>>({});
  const [achievements, setAchievements] = useState<GuideAchievement[]>([]);
  const [metrics, setMetrics] = useState<GuideMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadGuideData = useCallback(async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [stepsRes, progressRes, achievementsRes, metricsRes] = await Promise.all([
        supabase.from('startup_guide_steps').select('*').order('step_number'),
        supabase.from('organization_guide_progress').select('*').eq('organization_id', organizationId),
        supabase.from('organization_guide_achievements').select('*').eq('organization_id', organizationId).order('earned_at', { ascending: false }),
        supabase.from('organization_guide_metrics').select('*').eq('organization_id', organizationId).single(),
      ]);

      if (stepsRes.error) throw stepsRes.error;
      const mappedSteps = (stepsRes.data || []).map((s) => ({
        ...s,
        external_links: s.external_links as unknown as ExternalLink[] | null,
      })) as GuideStep[];
      setSteps(mappedSteps);

      if (!progressRes.error && progressRes.data) {
        const progressMap: Record<string, StepProgress> = {};
        progressRes.data.forEach((p) => {
          progressMap[p.step_id] = p as StepProgress;
        });
        setProgress(progressMap);
      }

      if (!achievementsRes.error) {
        setAchievements(achievementsRes.data as GuideAchievement[] || []);
      }

      if (!metricsRes.error && metricsRes.data) {
        setMetrics(metricsRes.data as GuideMetrics);
      }
    } catch (error) {
      console.error('Error loading guide data:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadGuideData();
  }, [loadGuideData]);

  const updateStepStatus = async (
    stepId: string,
    status: StepProgress['status'],
    additionalData?: { notes?: string; completion_data?: Record<string, unknown> }
  ) => {
    if (!organizationId) return;

    try {
      const existingProgress = progress[stepId];
      const now = new Date().toISOString();

      const updateData = {
        organization_id: organizationId,
        step_id: stepId,
        status,
        notes: additionalData?.notes || existingProgress?.notes || null,
        completion_data: additionalData?.completion_data || existingProgress?.completion_data || null,
        started_at: status === 'in_progress' && !existingProgress?.started_at ? now : existingProgress?.started_at || null,
        completed_at: status === 'completed' ? now : existingProgress?.completed_at || null,
      };

      const { data, error } = await supabase
        .from('organization_guide_progress')
        .upsert({
          organization_id: updateData.organization_id,
          step_id: updateData.step_id,
          status: updateData.status,
          notes: updateData.notes,
          completion_data: updateData.completion_data as Json,
          started_at: updateData.started_at,
          completed_at: updateData.completed_at,
        }, { onConflict: 'organization_id,step_id' })
        .select()
        .single();

      if (error) throw error;

      setProgress((prev) => ({ ...prev, [stepId]: data as StepProgress }));

      // Reload achievements and metrics after update
      setTimeout(async () => {
        const [achievementsRes, metricsRes] = await Promise.all([
          supabase.from('organization_guide_achievements').select('*').eq('organization_id', organizationId).order('earned_at', { ascending: false }),
          supabase.from('organization_guide_metrics').select('*').eq('organization_id', organizationId).single(),
        ]);

        if (!achievementsRes.error) setAchievements(achievementsRes.data as GuideAchievement[] || []);
        if (!metricsRes.error && metricsRes.data) setMetrics(metricsRes.data as GuideMetrics);
      }, 500);

      if (status === 'completed') {
        const step = steps.find((s) => s.id === stepId);
        toast({
          title: '¡Paso completado! 🎉',
          description: `Ganaste ${step?.points || 0} puntos`,
        });
      }
    } catch (error) {
      console.error('Error updating step status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el progreso',
        variant: 'destructive',
      });
    }
  };

  const canStartStep = (step: GuideStep): boolean => {
    if (!step.prerequisite_steps || step.prerequisite_steps.length === 0) {
      return true;
    }

    return step.prerequisite_steps.every((prereqStepNum) => {
      const prereqStep = steps.find((s) => s.step_number === prereqStepNum);
      if (!prereqStep) return false;
      const prereqProgress = progress[prereqStep.id];
      return prereqProgress?.status === 'completed';
    });
  };

  const getStepsByCategory = (category: string): GuideStep[] => {
    return steps.filter((s) => s.category === category);
  };

  const getCategoryProgress = (category: string) => {
    const categorySteps = getStepsByCategory(category);
    const completedSteps = categorySteps.filter((s) => progress[s.id]?.status === 'completed');

    return {
      total: categorySteps.length,
      completed: completedSteps.length,
      percentage: categorySteps.length > 0 ? (completedSteps.length / categorySteps.length) * 100 : 0,
    };
  };

  const getNextStep = (): GuideStep | null => {
    return steps.find((step) => {
      const stepProgress = progress[step.id];
      const isNotCompleted = stepProgress?.status !== 'completed';
      const canStart = canStartStep(step);
      return isNotCompleted && canStart;
    }) || null;
  };

  return {
    steps,
    progress,
    achievements,
    metrics,
    loading,
    updateStepStatus,
    canStartStep,
    getStepsByCategory,
    getCategoryProgress,
    getNextStep,
    refresh: loadGuideData,
  };
};
