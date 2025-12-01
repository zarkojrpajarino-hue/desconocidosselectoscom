import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para obtener la organización activa del usuario
 * Útil para filtrar queries por organización
 */
export const useCurrentOrganization = () => {
  const { currentOrganizationId, userOrganizations } = useAuth();
  
  const currentOrganization = userOrganizations.find(
    org => org.organization_id === currentOrganizationId
  );
  
  return {
    organizationId: currentOrganizationId,
    organization: currentOrganization,
    role: currentOrganization?.role || null,
    organizationName: currentOrganization?.organization_name || null
  };
};
