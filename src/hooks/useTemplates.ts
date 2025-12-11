import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

interface Template {
  id: string;
  organization_id: string | null;
  created_by: string | null;
  name: string;
  description: string | null;
  template_type: string;
  template_data: Json;
  is_public: boolean;
  category: string | null;
  tags: string[] | null;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useTemplates(templateType: 'task' | 'okr' | 'workflow') {
  const { organizationId } = useCurrentOrganization();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates } = useQuery({
    queryKey: ['templates', templateType, organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('template_type', templateType)
        .order('use_count', { ascending: false });

      if (error) throw error;
      return data as Template[];
    },
  });

  const saveTemplate = useMutation({
    mutationFn: async (params: {
      name: string;
      description?: string;
      template_data: Json;
      category?: string;
      tags?: string[];
      is_public?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('templates')
        .insert({
          organization_id: organizationId,
          created_by: user.id,
          template_type: templateType,
          name: params.name,
          description: params.description,
          template_data: params.template_data,
          category: params.category,
          tags: params.tags,
          is_public: params.is_public,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Plantilla guardada' });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const useTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const template = templates?.find(t => t.id === templateId);
      if (!template) return null;

      await supabase
        .from('templates')
        .update({
          use_count: template.use_count + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', templateId);

      return template;
    },
  });

  return {
    templates,
    saveTemplate,
    useTemplate,
  };
}
