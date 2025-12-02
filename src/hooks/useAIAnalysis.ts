// ============================================
// HOOK: useAIAnalysis
// src/hooks/useAIAnalysis.ts
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AIAnalysisResult, AnalysisState } from '@/types/ai-analysis.types';

interface UseAIAnalysisOptions {
  organization_id: string;
  user_id: string;
  autoLoad?: boolean;
  includeCompetitors?: boolean;
  data_period?: {
    start_date: string;
    end_date: string;
  };
}

export function useAIAnalysis({
  organization_id,
  user_id,
  autoLoad = false,
  includeCompetitors = false,
  data_period,
}: UseAIAnalysisOptions) {
  const { toast } = useToast();
  const [state, setState] = useState<AnalysisState>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
    history: [],
  });

  // ============================================
  // CARGAR ÚLTIMO ANÁLISIS DE LA BASE DE DATOS
  // ============================================
  const loadLatestAnalysis = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase
        .from('ai_analysis_results')
        .select('*')
        .eq('organization_id', organization_id)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setState(prev => ({
          ...prev,
          data: data.analysis_data as unknown as AIAnalysisResult,
          loading: false,
          lastUpdated: data.generated_at,
        }));
      } else {
        setState(prev => ({
          ...prev,
          data: null,
          loading: false,
        }));
      }
    } catch (error) {
      console.error('Error loading analysis:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error loading analysis',
      }));
    }
  }, [organization_id]);

  // ============================================
  // CARGAR HISTÓRICO DE ANÁLISIS
  // ============================================
  const loadHistory = useCallback(async (limit: number = 10) => {
    try {
      const { data, error } = await supabase
        .from('ai_analysis_results')
        .select('*')
        .eq('organization_id', organization_id)
        .order('generated_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      setState(prev => ({
        ...prev,
        history: data?.map(d => d.analysis_data as unknown as AIAnalysisResult) || [],
      }));
    } catch (error) {
      console.error('Error loading history:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el histórico de análisis',
        variant: 'destructive',
      });
    }
  }, [organization_id, toast]);

  // ============================================
  // GENERAR NUEVO ANÁLISIS
  // ============================================
  const generateAnalysis = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      toast({
        title: 'Generando análisis...',
        description: 'Esto puede tardar hasta 2 minutos. Por favor espera.',
      });

      // Llamar a la edge function v3
      const { data, error } = await supabase.functions.invoke(
        'analyze-project-data-v3',
        {
          body: {
            organizationId: organization_id,
            includeCompetitors,
          },
        }
      );

      if (error) {
        throw error;
      }

      if (data?.analysis) {
        setState(prev => ({
          ...prev,
          data: data.analysis as AIAnalysisResult,
          loading: false,
          lastUpdated: new Date().toISOString(),
        }));

        toast({
          title: '✅ Análisis completado',
          description: 'El análisis se ha generado exitosamente',
        });

        // Recargar histórico
        loadHistory();
      }
    } catch (error) {
      console.error('Error generating analysis:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error generating analysis';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      toast({
        title: 'Error al generar análisis',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [organization_id, includeCompetitors, toast, loadHistory]);

  // ============================================
  // EXPORTAR ANÁLISIS
  // ============================================
  const exportAnalysis = useCallback(
    async (format: 'pdf' | 'csv' | 'json') => {
      if (!state.data) {
        toast({
          title: 'Error',
          description: 'No hay análisis para exportar',
          variant: 'destructive',
        });
        return;
      }

      try {
        if (format === 'json') {
          // Export as JSON
          const dataStr = JSON.stringify(state.data, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `analisis-${new Date().toISOString()}.json`;
          link.click();
          URL.revokeObjectURL(url);

          toast({
            title: 'Exportado',
            description: 'Análisis exportado como JSON',
          });
        } else if (format === 'pdf') {
          // TODO: Implementar exportación a PDF
          toast({
            title: 'En desarrollo',
            description: 'La exportación a PDF estará disponible pronto',
          });
        } else if (format === 'csv') {
          // TODO: Implementar exportación a CSV
          toast({
            title: 'En desarrollo',
            description: 'La exportación a CSV estará disponible pronto',
          });
        }
      } catch (error) {
        console.error('Error exporting analysis:', error);
        toast({
          title: 'Error al exportar',
          description: error instanceof Error ? error.message : 'Error desconocido',
          variant: 'destructive',
        });
      }
    },
    [state.data, toast]
  );

  // ============================================
  // COMPARAR CON ANÁLISIS ANTERIOR
  // ============================================
  const compareWithPrevious = useCallback(() => {
    if (!state.data || state.history.length < 2) {
      toast({
        title: 'No hay suficientes datos',
        description: 'Se necesitan al menos 2 análisis para comparar',
      });
      return null;
    }

    const current = state.data;
    const previous = state.history[1]; // El segundo más reciente

    return {
      executive_score_change: current.executive_dashboard.overall_score - previous.executive_dashboard.overall_score,
      financial_score_change: current.financial_health.score - previous.financial_health.score,
      team_score_change: current.team_performance.overall_score - previous.team_performance.overall_score,
      growth_score_change: current.growth_analysis.growth_score - previous.growth_analysis.growth_score,
    };
  }, [state.data, state.history, toast]);

  // ============================================
  // EFECTO: AUTO-CARGAR AL MONTAR
  // ============================================
  useEffect(() => {
    if (autoLoad) {
      loadLatestAnalysis();
      loadHistory();
    }
  }, [autoLoad, loadLatestAnalysis, loadHistory]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    history: state.history,
    generateAnalysis,
    loadLatestAnalysis,
    loadHistory,
    exportAnalysis,
    compareWithPrevious,
    hasData: !!state.data,
    canCompare: state.history.length >= 2,
  };
}

export default useAIAnalysis;
