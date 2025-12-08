import { useState, useEffect } from 'react';
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
 * Hook for managing financial data
 * Handles revenue, expenses, and marketing spend
 */
export const useFinancialData = () => {
  const { currentOrganizationId } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTransactions = async () => {
    if (!currentOrganizationId) return;
    try {
      setLoading(true);
      setError(null);

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
        .eq('organization_id', currentOrganizationId)
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
        .eq('organization_id', currentOrganizationId)
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
        .eq('organization_id', currentOrganizationId)
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

      setTransactions(allTransactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      const error = err instanceof Error ? err : new Error('Error desconocido');
      setError(error);
      toast.error('Error al cargar transacciones', {
        description: error.message || 'Intenta de nuevo más tarde',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrganizationId) {
      fetchTransactions();
    }
  }, [currentOrganizationId]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
  };
};
