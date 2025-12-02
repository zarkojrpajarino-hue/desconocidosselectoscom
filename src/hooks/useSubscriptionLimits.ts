import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PLAN_LIMITS, PlanType, isLimitReached } from '@/constants/subscriptionLimits';
import { toast } from 'sonner';

/**
 * Hook para verificar límites de suscripción y mostrar uso actual
 */
export function useSubscriptionLimits() {
  const { currentOrganizationId, user } = useAuth();
  const userId = user?.id;

  // Obtener plan actual de la organización
  const { data: organization, isLoading: loadingOrg } = useQuery({
    queryKey: ['organization', currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return null;

      const { data, error } = await supabase
        .from('organizations')
        .select('plan, subscription_status, trial_ends_at, created_at')
        .eq('id', currentOrganizationId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!currentOrganizationId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const plan: PlanType = (organization?.plan as PlanType) || 'free';
  const limits = PLAN_LIMITS[plan];

  // Contar organizaciones del usuario (dueño/owner)
  const { data: ownedOrgsCount = 0, isLoading: loadingOwnedOrgs } = useQuery({
    queryKey: ['owned-orgs-count', userId],
    queryFn: async () => {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', userId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Contar organizaciones a las que pertenece (unido como miembro)
  const { data: joinedOrgsCount = 0, isLoading: loadingJoinedOrgs } = useQuery({
    queryKey: ['joined-orgs-count', userId],
    queryFn: async () => {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from('user_roles')
        .select('organization_id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Contar usuarios actuales
  const { data: userCount = 0, isLoading: loadingUsers } = useQuery({
    queryKey: ['user-count', currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return 0;

      const { count, error } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganizationId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!currentOrganizationId,
    staleTime: 2 * 60 * 1000,
  });

  // Contar leads del mes actual
  const { data: leadCount = 0, isLoading: loadingLeads } = useQuery({
    queryKey: ['lead-count', currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return 0;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganizationId)
        .gte('created_at', startOfMonth.toISOString());

      if (error) throw error;
      return count || 0;
    },
    enabled: !!currentOrganizationId,
    staleTime: 2 * 60 * 1000,
  });

  // Contar OKRs activos
  const { data: okrCount = 0, isLoading: loadingOkrs } = useQuery({
    queryKey: ['okr-count', currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return 0;

      const { count, error } = await supabase
        .from('objectives')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganizationId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!currentOrganizationId,
    staleTime: 5 * 60 * 1000,
  });

  // Contar análisis IA del mes
  const { data: aiAnalysisCount = 0, isLoading: loadingAiAnalysis } = useQuery({
    queryKey: ['ai-analysis-count', currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return 0;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from('ai_analysis_results')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganizationId)
        .gte('created_at', startOfMonth.toISOString());

      if (error) throw error;
      return count || 0;
    },
    enabled: !!currentOrganizationId,
    staleTime: 2 * 60 * 1000,
  });

  const isLoading = loadingOrg || loadingUsers || loadingLeads || loadingOkrs || loadingAiAnalysis || loadingOwnedOrgs || loadingJoinedOrgs;

  /**
   * Verificar si puede crear una nueva organización
   */
  const canCreateOrganization = () => {
    const limit = limits.max_organizations_owned;
    if (limit === -1) return { allowed: true, remaining: -1 };
    
    const allowed = ownedOrgsCount < limit;
    const remaining = Math.max(0, limit - ownedOrgsCount);
    
    return { allowed, remaining, limit, current: ownedOrgsCount };
  };

  /**
   * Verificar si puede unirse a otra organización
   */
  const canJoinOrganization = () => {
    const limit = limits.max_organizations_joined;
    if (limit === -1) return { allowed: true, remaining: -1 };
    
    const allowed = joinedOrgsCount < limit;
    const remaining = Math.max(0, limit - joinedOrgsCount);
    
    return { allowed, remaining, limit, current: joinedOrgsCount };
  };

  /**
   * Verificar si se puede añadir un nuevo usuario
   */
  const canAddUser = () => {
    const limit = limits.max_users;
    if (limit === -1) return { allowed: true, remaining: -1 };
    
    const allowed = userCount < limit;
    const remaining = Math.max(0, limit - userCount);
    
    return { allowed, remaining, limit, current: userCount };
  };

  /**
   * Verificar si se puede crear un nuevo lead
   */
  const canAddLead = () => {
    const limit = limits.max_leads_per_month;
    if (limit === -1) return { allowed: true, remaining: -1 };
    
    const allowed = leadCount < limit;
    const remaining = Math.max(0, limit - leadCount);
    
    return { allowed, remaining, limit, current: leadCount };
  };

  /**
   * Verificar si se puede crear un nuevo OKR
   */
  const canAddOkr = () => {
    const limit = limits.max_objectives;
    if (limit === -1) return { allowed: true, remaining: -1 };
    
    const allowed = okrCount < limit;
    const remaining = Math.max(0, limit - okrCount);
    
    return { allowed, remaining, limit, current: okrCount };
  };

  /**
   * Verificar si se puede hacer análisis con IA
   */
  const canUseAiAnalysis = () => {
    const limit = limits.max_ai_analysis_per_month;
    if (limit === -1) return { allowed: true, remaining: -1 };
    
    const allowed = aiAnalysisCount < limit;
    const remaining = Math.max(0, limit - aiAnalysisCount);
    
    return { allowed, remaining, limit, current: aiAnalysisCount };
  };

  /**
   * Verificar si una herramienta IA está disponible
   */
  const canUseAiTool = (toolId: string) => {
    const available = limits.available_ai_tools;
    
    // Si max_ai_tools es -1, todas están disponibles
    if (limits.max_ai_tools === -1) return { allowed: true };
    
    // Si la lista está vacía pero max_ai_tools > 0, significa "primeras N"
    if (available.length === 0 && limits.max_ai_tools > 0) {
      return { allowed: true, message: `Tienes ${limits.max_ai_tools} herramientas disponibles` };
    }
    
    const allowed = available.includes(toolId);
    
    return { 
      allowed, 
      message: allowed ? null : `Esta herramienta no está disponible en tu plan ${plan}` 
    };
  };

  /**
   * Verificar si tiene acceso a una fase específica
   */
  const canAccessPhase = (phase: number) => {
    const availablePhases = limits.available_phases;
    
    if (Array.isArray(availablePhases)) {
      return availablePhases.includes(phase);
    }
    
    // Si es 'custom', permitir todas
    return true;
  };

  /**
   * Verificar si tiene acceso a una feature booleana
   */
  const hasFeature = (feature: keyof typeof limits): boolean => {
    const value = limits[feature];
    
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value !== 'none';
    if (Array.isArray(value)) return value.length > 0;
    
    return false;
  };

  /**
   * Mostrar toast de límite alcanzado
   */
  const showLimitReachedToast = (limitType: 'users' | 'leads' | 'okrs' | 'ai_analysis' | 'feature' | 'owned_orgs' | 'joined_orgs') => {
    const messages = {
      users: `Has alcanzado el límite de ${limits.max_users} usuarios en tu plan ${plan}.`,
      leads: `Has alcanzado el límite de ${limits.max_leads_per_month} leads este mes en tu plan ${plan}.`,
      okrs: `Has alcanzado el límite de ${limits.max_objectives} OKRs en tu plan ${plan}.`,
      ai_analysis: `Has alcanzado el límite de ${limits.max_ai_analysis_per_month} análisis IA este mes.`,
      feature: `Esta funcionalidad no está disponible en tu plan ${plan}.`,
      owned_orgs: `Has alcanzado el límite de ${limits.max_organizations_owned} organizaciones propias en tu plan ${plan}.`,
      joined_orgs: `Has alcanzado el límite de ${limits.max_organizations_joined} organizaciones a las que puedes unirte en tu plan ${plan}.`,
    };

    toast.error(messages[limitType], {
      description: 'Mejora tu plan para desbloquear esta funcionalidad',
      action: {
        label: 'Ver Planes',
        onClick: () => window.location.href = '/pricing',
      },
    });
  };

  return {
    // Estado
    plan,
    limits,
    isLoading,
    organization,
    
    // Contadores
    userCount,
    leadCount,
    okrCount,
    aiAnalysisCount,
    ownedOrgsCount,
    joinedOrgsCount,
    
    // Verificadores
    canCreateOrganization,
    canJoinOrganization,
    canAddUser,
    canAddLead,
    canAddOkr,
    canUseAiAnalysis,
    canUseAiTool,
    canAccessPhase,
    hasFeature,
    
    // Utilidades
    showLimitReachedToast,
  };
}

/**
 * Hook simplificado para verificar si el trial ha expirado
 */
export function useTrialStatus() {
  const { currentOrganizationId } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['trial-status', currentOrganizationId],
    queryFn: async () => {
      if (!currentOrganizationId) return null;

      const { data, error } = await supabase
        .from('organizations')
        .select('plan, trial_ends_at, created_at')
        .eq('id', currentOrganizationId)
        .single();

      if (error) throw error;

      const plan = data.plan as PlanType;
      const isTrial = plan === 'trial' || plan === 'free';
      
      let daysRemaining = 0;
      let isExpired = false;

      if (isTrial && data.trial_ends_at) {
        const now = new Date();
        const trialEnd = new Date(data.trial_ends_at);
        const diffMs = trialEnd.getTime() - now.getTime();
        daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        isExpired = diffMs <= 0;
      } else if (isTrial && data.created_at) {
        // Calcular basado en created_at (14 días desde creación)
        const createdAt = new Date(data.created_at);
        const trialEnd = new Date(createdAt);
        trialEnd.setDate(trialEnd.getDate() + 14);
        
        const now = new Date();
        const diffMs = trialEnd.getTime() - now.getTime();
        daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        isExpired = diffMs <= 0;
      }

      return {
        plan,
        isTrial,
        daysRemaining,
        isExpired,
      };
    },
    enabled: !!currentOrganizationId,
    staleTime: 60 * 1000, // 1 minuto
  });

  return {
    ...data,
    isLoading,
  };
}
