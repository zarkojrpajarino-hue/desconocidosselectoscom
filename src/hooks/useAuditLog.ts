import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  organization_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  endpoint: string | null;
  http_method: string | null;
  created_at: string;
  user_email?: string;
}

interface UseAuditLogOptions {
  limit?: number;
  resourceType?: string;
  action?: string;
}

export function useAuditLog(options: UseAuditLogOptions = {}) {
  const { organizationId } = useCurrentOrganization();
  const { limit = 100, resourceType, action } = options;

  const { data: logs, isLoading, error, refetch } = useQuery({
    queryKey: ['auditLog', organizationId, limit, resourceType, action],
    queryFn: async () => {
      if (!organizationId) return [];
      
      let query = supabase
        .from('audit_log')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (resourceType) {
        query = query.eq('resource_type', resourceType);
      }
      
      if (action) {
        query = query.ilike('action', `%${action}%`);
      }
      
      const { data, error: queryError } = await query;
      
      if (queryError) throw queryError;
      
      // Fetch user emails separately if we have user_ids
      const userIds = [...new Set((data || []).map(log => log.user_id).filter(Boolean))];
      let userEmails: Record<string, string> = {};
      
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds);
        
        if (usersData) {
          userEmails = usersData.reduce((acc, user) => {
            acc[user.id] = user.email || 'Sistema';
            return acc;
          }, {} as Record<string, string>);
        }
      }
      
      return (data || []).map(log => ({
        ...log,
        user_email: log.user_id ? (userEmails[log.user_id] || 'Usuario') : 'Sistema',
      })) as AuditLogEntry[];
    },
    enabled: !!organizationId,
  });

  return {
    logs: logs || [],
    isLoading,
    error,
    refetch,
  };
}
