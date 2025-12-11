import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string | null;
  default_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationFeatureFlag {
  id: string;
  organization_id: string;
  feature_flag_id: string;
  enabled: boolean;
  enabled_by: string | null;
  enabled_at: string | null;
  disabled_by: string | null;
  disabled_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook for feature flags
 */
export function useFeatureFlags() {
  const { user, currentOrganizationId } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all global flags
  const { data: flags = [], isLoading: loadingFlags } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FeatureFlag[];
    },
  });

  // Fetch organization-specific overrides
  const { data: orgFlags = [], isLoading: loadingOrgFlags } = useQuery({
    queryKey: ['organization-feature-flags', currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return [];

      const { data, error } = await supabase
        .from('organization_feature_flags')
        .select('*')
        .eq('organization_id', currentOrganizationId);

      if (error) throw error;
      return data as OrganizationFeatureFlag[];
    },
    enabled: !!currentOrganizationId,
  });

  // Check if a feature is enabled for current organization
  const isFeatureEnabled = (featureName: string): boolean => {
    const globalFlag = flags.find(f => f.name === featureName);
    if (!globalFlag) return false;

    const orgOverride = orgFlags.find(of => of.feature_flag_id === globalFlag.id);
    if (orgOverride) return orgOverride.enabled;

    return globalFlag.default_enabled;
  };

  // Toggle feature for organization
  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ flagId, enabled }: { flagId: string; enabled: boolean }) => {
      if (!currentOrganizationId || !user?.id) {
        throw new Error('Not authenticated');
      }

      const updateData: Record<string, unknown> = { enabled };

      if (enabled) {
        updateData.enabled_by = user.id;
        updateData.enabled_at = new Date().toISOString();
      } else {
        updateData.disabled_by = user.id;
        updateData.disabled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('organization_feature_flags')
        .upsert({
          organization_id: currentOrganizationId,
          feature_flag_id: flagId,
          ...updateData,
        }, {
          onConflict: 'organization_id,feature_flag_id',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-feature-flags'] });
      toast.success('Feature flag actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar feature flag');
    },
  });

  // Get combined flag status for display
  const getFlagsWithStatus = () => {
    return flags.map(flag => {
      const orgOverride = orgFlags.find(of => of.feature_flag_id === flag.id);
      return {
        ...flag,
        isEnabled: orgOverride ? orgOverride.enabled : flag.default_enabled,
        hasOverride: !!orgOverride,
        orgFlag: orgOverride,
      };
    });
  };

  return {
    flags,
    orgFlags,
    loadingFlags,
    loadingOrgFlags,
    isFeatureEnabled,
    toggleFeature: toggleFeatureMutation.mutate,
    isToggling: toggleFeatureMutation.isPending,
    getFlagsWithStatus,
  };
}
