import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

interface CustomDashboard {
  id: string;
  organization_id: string;
  created_by: string;
  name: string;
  description: string | null;
  layout: Json;
  is_default: boolean;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export function useCustomDashboards() {
  const { organizationId } = useCurrentOrganization();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dashboards } = useQuery({
    queryKey: ['custom-dashboards', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('custom_dashboards')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CustomDashboard[];
    },
    enabled: !!organizationId,
  });

  const saveDashboard = useMutation({
    mutationFn: async (params: {
      name: string;
      description?: string;
      layout: Json;
      is_default?: boolean;
      is_shared?: boolean;
    }) => {
      if (!organizationId) throw new Error('No organization');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('custom_dashboards')
        .insert({
          organization_id: organizationId,
          created_by: user.id,
          name: params.name,
          description: params.description,
          layout: params.layout,
          is_default: params.is_default,
          is_shared: params.is_shared,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Dashboard guardado' });
      queryClient.invalidateQueries({ queryKey: ['custom-dashboards'] });
    },
  });

  const updateDashboard = useMutation({
    mutationFn: async ({ id, layout, name }: { id: string; layout?: Json; name?: string }) => {
      const { data, error } = await supabase
        .from('custom_dashboards')
        .update({
          layout,
          name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-dashboards'] });
    },
  });

  const deleteDashboard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_dashboards')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Dashboard eliminado' });
      queryClient.invalidateQueries({ queryKey: ['custom-dashboards'] });
    },
  });

  return {
    dashboards,
    saveDashboard,
    updateDashboard,
    deleteDashboard,
  };
}
