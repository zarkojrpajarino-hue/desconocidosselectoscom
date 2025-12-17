import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface GenerateTasksResult {
  success: boolean;
  totalTasks: number;
  users: number;
  phases: number;
  formula: string;
  results: Array<{
    userId: string;
    role: string;
    phase: number;
    tasks: number;
    formula: string;
  }>;
}

/**
 * Hook para generar tareas usando la fórmula FACTOR_ROL
 * TAREAS_USUARIO = BASE × FACTOR_ROL × FACTOR_EQUIPO × FACTOR_FASE × FACTOR_HORAS
 */
export function useGenerateTasksWithFormula() {
  const { currentOrganizationId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options?: { useAI?: boolean }): Promise<GenerateTasksResult> => {
      if (!currentOrganizationId) {
        throw new Error('No hay organización seleccionada');
      }

      const { data, error } = await supabase.functions.invoke('generate-tasks-with-formula', {
        body: {
          organization_id: currentOrganizationId,
          use_ai: options?.useAI ?? true
        }
      });

      if (error) {
        console.error('Error generating tasks:', error);
        throw new Error(error.message || 'Error al generar tareas');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Error desconocido al generar tareas');
      }

      return data as GenerateTasksResult;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['phase-weekly-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      
      toast.success(`Se generaron ${data.totalTasks} tareas para ${data.users} usuarios`, {
        description: `Fórmula: ${data.formula}`
      });
    },
    onError: (error) => {
      toast.error('Error al generar tareas', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  });
}

/**
 * Factores de la fórmula documentados para referencia UI
 */
export const TASK_FORMULA_FACTORS = {
  BASE: 4, // Tareas base por semana
  
  ROLE_FACTORS: {
    ceo: { multiplier: 1.2, description: 'CEO/Director - Alta responsabilidad estratégica' },
    cto: { multiplier: 1.3, description: 'CTO/Tech Lead - Complejidad técnica' },
    coo: { multiplier: 1.2, description: 'COO/Operaciones - Gestión de procesos' },
    cmo: { multiplier: 1.1, description: 'CMO/Marketing - Creatividad y campañas' },
    marketing: { multiplier: 1.0, description: 'Marketing - Contenido y publicidad' },
    ventas: { multiplier: 1.0, description: 'Ventas - Pipeline y clientes' },
    operaciones: { multiplier: 1.1, description: 'Operaciones - Logística y calidad' },
    producto: { multiplier: 1.2, description: 'Producto - Desarrollo y UX' },
    finanzas: { multiplier: 0.9, description: 'Finanzas - Análisis y reporting' },
    general: { multiplier: 1.0, description: 'General - Tareas estándar' }
  },
  
  TEAM_FACTORS: {
    1: { factor: 1.3, description: 'Solo - Más tareas individuales' },
    '2-5': { factor: 1.0, description: 'Equipo pequeño - Carga normal' },
    '6-10': { factor: 0.9, description: 'Equipo medio - Distribución' },
    '11-20': { factor: 0.85, description: 'Equipo grande - Especialización' },
    '20+': { factor: 0.8, description: 'Corporativo - Alta división' }
  },
  
  PHASE_FACTORS: {
    lean_startup: {
      1: { factor: 1.0, name: 'Build' },
      2: { factor: 0.9, name: 'Measure' },
      3: { factor: 1.0, name: 'Learn' },
      4: { factor: 1.2, name: 'Scale' }
    },
    scaling_up: {
      1: { factor: 1.1, name: 'People' },
      2: { factor: 1.0, name: 'Strategy' },
      3: { factor: 1.2, name: 'Execution' },
      4: { factor: 1.0, name: 'Cash' }
    }
  },
  
  HOURS_FACTORS: {
    '40+': { factor: 1.2, description: 'Full time+' },
    '30-39': { factor: 1.0, description: 'Full time' },
    '20-29': { factor: 0.8, description: 'Part time' },
    '10-19': { factor: 0.6, description: 'Muy parcial' },
    '<10': { factor: 0.4, description: 'Mínimo' }
  }
};

/**
 * Calcula las tareas para un usuario específico (solo para preview UI)
 */
export function previewTaskCalculation(params: {
  role: string;
  teamSize: number;
  methodology: 'lean_startup' | 'scaling_up';
  phaseNumber: number;
  hoursPerWeek: number;
}): { tasksPerWeek: number; formula: string } {
  const roleConfig = TASK_FORMULA_FACTORS.ROLE_FACTORS[params.role as keyof typeof TASK_FORMULA_FACTORS.ROLE_FACTORS] 
    || TASK_FORMULA_FACTORS.ROLE_FACTORS.general;
  
  let teamFactor = 1.0;
  if (params.teamSize === 1) teamFactor = 1.3;
  else if (params.teamSize <= 5) teamFactor = 1.0;
  else if (params.teamSize <= 10) teamFactor = 0.9;
  else if (params.teamSize <= 20) teamFactor = 0.85;
  else teamFactor = 0.8;
  
  const phaseData = TASK_FORMULA_FACTORS.PHASE_FACTORS[params.methodology];
  const phaseFactor = phaseData?.[params.phaseNumber as keyof typeof phaseData]?.factor || 1.0;
  
  let hoursFactor = 1.0;
  if (params.hoursPerWeek >= 40) hoursFactor = 1.2;
  else if (params.hoursPerWeek >= 30) hoursFactor = 1.0;
  else if (params.hoursPerWeek >= 20) hoursFactor = 0.8;
  else if (params.hoursPerWeek >= 10) hoursFactor = 0.6;
  else hoursFactor = 0.4;
  
  const tasksPerWeek = Math.round(
    TASK_FORMULA_FACTORS.BASE * roleConfig.multiplier * teamFactor * phaseFactor * hoursFactor
  );
  
  return {
    tasksPerWeek: Math.max(3, Math.min(20, tasksPerWeek)),
    formula: `${TASK_FORMULA_FACTORS.BASE} × ${roleConfig.multiplier} × ${teamFactor} × ${phaseFactor} × ${hoursFactor}`
  };
}
