import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { toast } from 'sonner';
import type { IntegrationToken } from '@/types/integrations';

type IntegrationType = 'google_calendar' | 'slack' | 'outlook' | 'hubspot' | 'asana' | 'trello';

export function useIntegrationTokens() {
  const { organizationId } = useCurrentOrganization();
  const queryClient = useQueryClient();

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['integration-tokens', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('integration_tokens')
        .select('id, integration_type, is_active, created_at, updated_at, metadata, expires_at, scope')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId);

      if (error) throw error;
      return (data || []) as Partial<IntegrationToken>[];
    },
    enabled: !!organizationId,
  });

  const connectIntegration = useMutation({
    mutationFn: async (integrationType: IntegrationType) => {
      // Redirect to OAuth flow
      const { data, error } = await supabase.functions.invoke(`${integrationType.replace('_', '-')}-auth-url`, {
        body: { redirect_uri: `${window.location.origin}/integrations/callback` },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
      return data;
    },
    onError: (error) => {
      toast.error('Error al conectar integración', { description: error.message });
    },
  });

  const disconnectIntegration = useMutation({
    mutationFn: async (integrationType: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('integration_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('integration_type', integrationType);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Integración desconectada');
      queryClient.invalidateQueries({ queryKey: ['integration-tokens'] });
    },
    onError: (error) => {
      toast.error('Error al desconectar', { description: error.message });
    },
  });

  const isConnected = (type: IntegrationType) => {
    return integrations?.some(i => i.integration_type === type && i.is_active);
  };

  return {
    integrations,
    isLoading,
    connectIntegration,
    disconnectIntegration,
    isConnected,
  };
}