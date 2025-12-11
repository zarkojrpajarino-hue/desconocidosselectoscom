import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

interface Workflow {
  id: string;
  organization_id: string;
  created_by: string | null;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Json | null;
  conditions: Json | null;
  actions: Json;
  is_active: boolean;
  run_count: number;
  last_run_at: string | null;
  created_at: string;
}

export function useWorkflows() {
  const { organizationId } = useCurrentOrganization();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflows', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Workflow[];
    },
    enabled: !!organizationId,
  });

  const createWorkflow = useMutation({
    mutationFn: async (params: {
      name: string;
      description?: string;
      trigger_type: string;
      trigger_config?: Json;
      conditions?: Json;
      actions: Json;
    }) => {
      if (!organizationId) throw new Error('No organization');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('workflows')
        .insert({
          organization_id: organizationId,
          created_by: user.id,
          name: params.name,
          description: params.description,
          trigger_type: params.trigger_type,
          trigger_config: params.trigger_config,
          conditions: params.conditions,
          actions: params.actions,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Workflow creado' });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  const toggleWorkflow = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('workflows')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  const deleteWorkflow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Workflow eliminado' });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  return {
    workflows,
    isLoading,
    createWorkflow,
    toggleWorkflow,
    deleteWorkflow,
  };
}
