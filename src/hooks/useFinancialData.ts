import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Transaction {
  id: string;
  date: string;
  type: 'revenue' | 'expense' | 'marketing';
  amount: number;
  description: string;
  category?: string;
  created_by_name?: string;
}

/**
 * Hook for managing financial data with React Query
 * Handles revenue, expenses, and marketing spend
 * Respects financial_visibility_team setting from organization
 *
 * @refactored Uses React Query for better caching and state management
 */

// Query keys for cache management
export const financialKeys = {
  all: ['financial'] as const,
  visibility: (organizationId: string | null) =>
    [...financialKeys.all, 'visibility', organizationId] as const,
  transactions: (organizationId: string | null) =>
    [...financialKeys.all, 'transactions', organizationId] as const,
};

// Fetch financial visibility setting
async function fetchFinancialVisibility(
  organizationId: string | null
): Promise<boolean> {
  if (!organizationId) return true;

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single();

  if (error) throw error;

  // Type assertion for organization with financial_visibility_team field
  const orgData = data as typeof data & { financial_visibility_team?: boolean };
  return orgData.financial_visibility_team ?? true;
}

// Fetch transactions
async function fetchTransactions(
  organizationId: string | null
): Promise<Transaction[]> {
  if (!organizationId) return [];

  // Fetch revenue entries
  const { data: revenueData, error: revenueError } = await supabase
    .from('revenue_entries')
    .select(`
      id,
      date,
      amount,
      product_category,
      product_name,
      users!revenue_entries_created_by_fkey(full_name)
    `)
    .eq('organization_id', organizationId)
    .order('date', { ascending: false })
    .limit(10);

  if (revenueError) throw revenueError;

  // Fetch expense entries
  const { data: expenseData, error: expenseError } = await supabase
    .from('expense_entries')
    .select(`
      id,
      date,
      amount,
      category,
      description,
      users!expense_entries_created_by_fkey(full_name)
    `)
    .eq('organization_id', organizationId)
    .order('date', { ascending: false })
    .limit(10);

  if (expenseError) throw expenseError;

  // Fetch marketing spend
  const { data: marketingData, error: marketingError } = await supabase
    .from('marketing_spend')
    .select(`
      id,
      date,
      amount,
      channel,
      users!marketing_spend_created_by_fkey(full_name)
    `)
    .eq('organization_id', organizationId)
    .order('date', { ascending: false })
    .limit(10);

  if (marketingError) throw marketingError;

  // Combine and sort all transactions
  const allTransactions: Transaction[] = [
    ...(revenueData || []).map(item => ({
      id: item.id,
      date: item.date,
      type: 'revenue' as const,
      amount: item.amount,
      description: `${item.product_category} - ${item.product_name || ''}`,
      created_by_name: item.users?.full_name,
    })),
    ...(expenseData || []).map(item => ({
      id: item.id,
      date: item.date,
      type: 'expense' as const,
      amount: item.amount,
      description: item.description,
      category: item.category,
      created_by_name: item.users?.full_name,
    })),
    ...(marketingData || []).map(item => ({
      id: item.id,
      date: item.date,
      type: 'marketing' as const,
      amount: item.amount,
      description: `Marketing - ${item.channel}`,
      created_by_name: item.users?.full_name,
    })),
  ];

  allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return allTransactions;
}

export const useFinancialData = () => {
  const { currentOrganizationId, userOrganizations } = useAuth();
  const queryClient = useQueryClient();

  // Verificar si el usuario es admin
  const currentUserRole = userOrganizations.find(
    org => org.organization_id === currentOrganizationId
  )?.role || 'member';
  const isAdmin = currentUserRole === 'admin';

  // Fetch financial visibility setting
  const {
    data: financialVisibility = true,
    isLoading: visibilityLoading,
  } = useQuery({
    queryKey: financialKeys.visibility(currentOrganizationId),
    queryFn: () => fetchFinancialVisibility(currentOrganizationId),
    enabled: !!currentOrganizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error: Error) => {
      console.error('Error fetching financial visibility:', error);
    },
  });

  // Determine if data should be hidden for team members
  const isHiddenForTeam = !isAdmin && !financialVisibility;

  // Fetch transactions
  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: financialKeys.transactions(currentOrganizationId),
    queryFn: () => fetchTransactions(currentOrganizationId),
    enabled: !!currentOrganizationId && !isHiddenForTeam,
    staleTime: 30 * 1000, // 30 seconds
    onError: (error: Error) => {
      console.error('Error fetching transactions:', error);
      toast.error('Error al cargar transacciones', {
        description: error.message || 'Intenta de nuevo más tarde',
      });
    },
  });

  // Toggle financial visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async (visible: boolean) => {
      if (!isAdmin || !currentOrganizationId) {
        throw new Error('Solo el administrador puede cambiar esta configuración');
      }

      const { error } = await supabase
        .from('organizations')
        .update({ financial_visibility_team: visible })
        .eq('id', currentOrganizationId);

      if (error) throw error;

      return visible;
    },
    onSuccess: (visible) => {
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: financialKeys.visibility(currentOrganizationId),
      });
      toast.success(visible
        ? 'Datos financieros visibles para el equipo'
        : 'Datos financieros ocultos para el equipo'
      );
    },
    onError: (error: Error) => {
      console.error('Error updating financial visibility:', error);
      toast.error(error.message || 'Error al actualizar configuración');
    },
  });

  const loading = visibilityLoading || transactionsLoading;

  return {
    transactions,
    loading,
    error: error as Error | null,
    refetch,
    // Admin controls
    isAdmin,
    financialVisibility,
    toggleFinancialVisibility: (visible: boolean) =>
      toggleVisibilityMutation.mutate(visible),
    isHiddenForTeam,
  };
};
