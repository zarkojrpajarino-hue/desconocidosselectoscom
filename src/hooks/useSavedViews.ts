import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

interface SavedView {
  id: string;
  organization_id: string;
  created_by: string;
  name: string;
  description: string | null;
  view_type: string;
  filters: Json;
  is_shared: boolean;
  shared_with_users: string[] | null;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
}

export function useSavedViews(viewType: 'tasks' | 'leads' | 'okrs' | 'reports') {
  const { organizationId } = useCurrentOrganization();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: views } = useQuery({
    queryKey: ['saved-views', organizationId, viewType],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('saved_views')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('view_type', viewType)
        .order('last_used_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as SavedView[];
    },
    enabled: !!organizationId,
  });

  const saveView = useMutation({
    mutationFn: async (params: {
      name: string;
      description?: string;
      filters: Json;
      is_shared?: boolean;
    }) => {
      if (!organizationId) throw new Error('No organization');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('saved_views')
        .insert({
          organization_id: organizationId,
          created_by: user.id,
          view_type: viewType,
          name: params.name,
          description: params.description,
          filters: params.filters,
          is_shared: params.is_shared,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Vista guardada' });
      queryClient.invalidateQueries({ queryKey: ['saved-views'] });
    },
  });

  const useView = useMutation({
    mutationFn: async (viewId: string) => {
      const view = views?.find(v => v.id === viewId);
      if (!view) return null;

      await supabase
        .from('saved_views')
        .update({
          use_count: view.use_count + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', viewId);

      return view;
    },
  });

  const deleteView = useMutation({
    mutationFn: async (viewId: string) => {
      const { error } = await supabase
        .from('saved_views')
        .delete()
        .eq('id', viewId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Vista eliminada' });
      queryClient.invalidateQueries({ queryKey: ['saved-views'] });
    },
  });

  return {
    views,
    saveView,
    useView,
    deleteView,
  };
}
