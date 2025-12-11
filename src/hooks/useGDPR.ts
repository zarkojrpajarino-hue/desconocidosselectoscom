import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { useToast } from '@/hooks/use-toast';

interface GDPRExport {
  id: string;
  user_id: string;
  organization_id: string;
  request_type: 'data_export' | 'account_deletion';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  export_data: unknown;
  export_url: string | null;
  deletion_scheduled_at: string | null;
  created_at: string;
  completed_at: string | null;
}

export function useGDPR() {
  const { organizationId } = useCurrentOrganization();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const requestDataExport = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      if (!organizationId) throw new Error('No organization');

      const { data, error } = await supabase
        .from('gdpr_data_exports')
        .insert({
          user_id: user.id,
          organization_id: organizationId,
          request_type: 'data_export',
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Exportación solicitada',
        description: 'Recibirás un email cuando tus datos estén listos (normalmente 24 horas)',
      });
      queryClient.invalidateQueries({ queryKey: ['gdpr-exports'] });
    },
  });

  const requestAccountDeletion = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      if (!organizationId) throw new Error('No organization');

      const { data, error } = await supabase
        .from('gdpr_data_exports')
        .insert({
          user_id: user.id,
          organization_id: organizationId,
          request_type: 'account_deletion',
          status: 'pending',
          deletion_scheduled_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Eliminación programada',
        description: 'Tu cuenta será eliminada en 30 días. Puedes cancelar durante este período.',
        variant: 'destructive',
      });
    },
  });

  const { data: exports } = useQuery({
    queryKey: ['gdpr-exports'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('gdpr_data_exports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as GDPRExport[];
    },
  });

  const updateCookieConsent = useMutation({
    mutationFn: async (consent: {
      analytics: boolean;
      marketing: boolean;
      preferences: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('cookie_consents')
        .upsert({
          user_id: user.id,
          ...consent,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Preferencias de cookies guardadas' });
    },
  });

  return {
    requestDataExport,
    requestAccountDeletion,
    updateCookieConsent,
    exports,
  };
}
