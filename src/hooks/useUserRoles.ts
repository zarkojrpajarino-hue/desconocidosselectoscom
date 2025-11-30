import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserRole {
  user_id: string;
  role: string;
  role_name: string;
  role_description: string;
}

/**
 * Hook para obtener roles de usuarios
 * Retorna un mapa de user_id -> role_name para mostrar roles junto a nombres
 */
export function useUserRoles() {
  return useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role, role_name, role_description');
      
      if (error) throw error;
      
      // Crear un mapa para acceso rápido por user_id
      const rolesMap = new Map<string, UserRole>();
      data?.forEach((role) => {
        rolesMap.set(role.user_id, role);
      });
      
      return rolesMap;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener el nombre de rol de un usuario específico
 */
export function useUserRoleName(userId: string | null | undefined) {
  const { data: rolesMap } = useUserRoles();
  
  if (!userId || !rolesMap) return null;
  
  const userRole = rolesMap.get(userId);
  return userRole?.role_name || null;
}

/**
 * Utilidad para formatear nombre + rol
 */
export function formatUserWithRole(userName: string, roleName: string | null): string {
  if (!roleName) return userName;
  return `${userName} (${roleName})`;
}