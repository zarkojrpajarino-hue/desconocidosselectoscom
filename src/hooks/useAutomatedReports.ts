import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AutomatedReport {
  id: string;
  user_id: string;
  organization_id: string;
  report_type: 'daily_digest' | 'weekly_summary' | 'monthly_report' | 'custom';
  name: string;
  description: string | null;
  schedule_cron: string;
  recipients: Array<{ email: string; name: string }>;
  filters: Record<string, unknown>;
  sections: string[];
  format: 'email' | 'pdf' | 'excel' | 'slack';
  is_active: boolean;
  last_sent_at: string | null;
  next_scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportExecution {
  id: string;
  report_id: string;
  organization_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at: string | null;
  recipients_count: number;
  error_message: string | null;
  report_data: Record<string, unknown> | null;
  file_url: string | null;
  created_at: string;
}

export interface WeeklyMetrics {
  tasks: {
    completed: number;
    created: number;
    completion_rate: number;
  };
  leads: {
    added: number;
    won: number;
    conversion_rate: number;
  };
  financial: {
    revenue: number;
    expenses: number;
    profit: number;
  };
  period: {
    start: string;
    end: string;
  };
}

/**
 * Hook for managing automated reports
 */
export function useAutomatedReports() {
  const { user, currentOrganizationId } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's reports
  const { data: reports = [], isLoading: loadingReports } = useQuery({
    queryKey: ['automated-reports', user?.id, currentOrganizationId],
    queryFn: async () => {
      if (!user?.id || !currentOrganizationId) return [];

      const { data, error } = await supabase
        .from('automated_reports')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', currentOrganizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AutomatedReport[];
    },
    enabled: !!user?.id && !!currentOrganizationId,
  });

  // Fetch report executions
  const { data: executions = [], isLoading: loadingExecutions } = useQuery({
    queryKey: ['report-executions', currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return [];

      const { data, error } = await supabase
        .from('report_executions')
        .select('*')
        .eq('organization_id', currentOrganizationId)
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as ReportExecution[];
    },
    enabled: !!currentOrganizationId,
  });

  // Create report
  const createReportMutation = useMutation({
    mutationFn: async (data: Partial<AutomatedReport>) => {
      if (!user?.id || !currentOrganizationId) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('automated_reports')
        .insert({
          user_id: user.id,
          organization_id: currentOrganizationId,
          report_type: data.report_type || 'weekly_summary',
          name: data.name || 'Weekly Report',
          description: data.description || null,
          schedule_cron: data.schedule_cron || '0 9 * * 1',
          recipients: JSON.parse(JSON.stringify(data.recipients || [])),
          filters: JSON.parse(JSON.stringify(data.filters || {})),
          sections: JSON.parse(JSON.stringify(data.sections || ['overview', 'tasks', 'okrs', 'financial'])),
          format: data.format || 'email',
          is_active: data.is_active ?? true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automated-reports'] });
      toast.success('Reporte creado', {
        description: 'Recibirás reportes según tu configuración',
      });
    },
    onError: (error: Error) => {
      toast.error('Error al crear reporte', {
        description: error.message,
      });
    },
  });

  // Update report
  const updateReportMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<AutomatedReport> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.schedule_cron !== undefined) updateData.schedule_cron = data.schedule_cron;
      if (data.recipients !== undefined) updateData.recipients = JSON.parse(JSON.stringify(data.recipients));
      if (data.filters !== undefined) updateData.filters = JSON.parse(JSON.stringify(data.filters));
      if (data.sections !== undefined) updateData.sections = JSON.parse(JSON.stringify(data.sections));
      if (data.format !== undefined) updateData.format = data.format;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;

      const { error } = await supabase
        .from('automated_reports')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automated-reports'] });
      toast.success('Reporte actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar reporte');
    },
  });

  // Toggle report active status
  const toggleReportMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('automated_reports')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['automated-reports'] });
      toast.success(variables.isActive ? 'Reporte activado' : 'Reporte desactivado');
    },
    onError: () => {
      toast.error('Error al cambiar estado');
    },
  });

  // Delete report
  const deleteReportMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('automated_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automated-reports'] });
      toast.success('Reporte eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar reporte');
    },
  });

  const hasActiveReport = reports.some(r => r.is_active);
  const weeklyReport = reports.find(r => r.report_type === 'weekly_summary');

  return {
    reports,
    executions,
    hasActiveReport,
    weeklyReport,
    loadingReports,
    loadingExecutions,
    createReport: createReportMutation.mutate,
    updateReport: updateReportMutation.mutate,
    toggleReport: toggleReportMutation.mutate,
    deleteReport: deleteReportMutation.mutate,
    isCreating: createReportMutation.isPending,
    isUpdating: updateReportMutation.isPending,
  };
}
