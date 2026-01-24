/**
 * @fileoverview Template for creating React Query hooks
 *
 * INSTRUCTIONS:
 * 1. Copy this file to your new hook filename (e.g., useMyFeature.ts)
 * 2. Replace "example" with your feature name
 * 3. Define your data types
 * 4. Implement fetch functions
 * 5. Configure query/mutation options
 * 6. Delete this comment block
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface ExampleItem {
  id: string;
  name: string;
  description: string;
  created_at: string;
  organization_id: string;
}

interface CreateExampleInput {
  name: string;
  description: string;
}

interface UpdateExampleInput {
  id: string;
  name?: string;
  description?: string;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

/**
 * Hierarchical query keys for cache management
 *
 * Pattern:
 * - all: Invalidates all example-related queries
 * - lists: Invalidates all list queries
 * - list(orgId): Invalidates specific organization list
 * - details: Invalidates all detail queries
 * - detail(id): Invalidates specific item detail
 */
export const exampleKeys = {
  all: ['examples'] as const,
  lists: () => [...exampleKeys.all, 'list'] as const,
  list: (organizationId: string | null) =>
    [...exampleKeys.lists(), { organizationId }] as const,
  details: () => [...exampleKeys.all, 'detail'] as const,
  detail: (id: string) => [...exampleKeys.details(), id] as const,
};

// ============================================================================
// FETCH FUNCTIONS
// ============================================================================

/**
 * Fetch all examples for an organization
 *
 * @param organizationId - The organization ID to filter by
 * @returns Promise<ExampleItem[]>
 * @throws Error if fetch fails
 */
async function fetchExamples(
  organizationId: string | null
): Promise<ExampleItem[]> {
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from('examples')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch single example by ID
 */
async function fetchExampleDetail(
  id: string
): Promise<ExampleItem> {
  const { data, error } = await supabase
    .from('examples')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// MUTATION FUNCTIONS
// ============================================================================

/**
 * Create a new example
 */
async function createExample(
  input: CreateExampleInput,
  organizationId: string
): Promise<ExampleItem> {
  const { data, error } = await supabase
    .from('examples')
    .insert({
      ...input,
      organization_id: organizationId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an example
 */
async function updateExample(
  input: UpdateExampleInput
): Promise<ExampleItem> {
  const { id, ...updates } = input;

  const { data, error } = await supabase
    .from('examples')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete an example
 */
async function deleteExample(id: string): Promise<void> {
  const { error } = await supabase
    .from('examples')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Hook for managing examples with React Query
 *
 * Features:
 * - Automatic caching and revalidation
 * - Optimistic updates
 * - Error handling
 * - Loading states
 *
 * @param organizationId - Current organization ID
 * @returns Example data and mutation functions
 *
 * @example
 * const { examples, isLoading, createExample } = useExamples(orgId);
 */
export const useExamples = (organizationId: string | null) => {
  const queryClient = useQueryClient();

  // ========================================================================
  // QUERIES
  // ========================================================================

  /**
   * Fetch all examples
   */
  const {
    data: examples = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: exampleKeys.list(organizationId),
    queryFn: () => fetchExamples(organizationId),
    enabled: !!organizationId,
    staleTime: 30 * 1000, // 30 seconds - adjust based on data freshness needs
    onError: (error: Error) => {
      console.error('Error fetching examples:', error);
      toast.error('Error al cargar ejemplos', {
        description: error.message || 'Intenta de nuevo más tarde',
      });
    },
  });

  // ========================================================================
  // MUTATIONS
  // ========================================================================

  /**
   * Create example mutation
   */
  const createMutation = useMutation({
    mutationFn: (input: CreateExampleInput) =>
      createExample(input, organizationId!),
    onSuccess: () => {
      // Invalidate list to trigger refetch
      queryClient.invalidateQueries({
        queryKey: exampleKeys.list(organizationId),
      });
      toast.success('Ejemplo creado correctamente');
    },
    onError: (error: Error) => {
      console.error('Error creating example:', error);
      toast.error('Error al crear ejemplo', {
        description: error.message || 'Intenta de nuevo',
      });
    },
  });

  /**
   * Update example mutation
   */
  const updateMutation = useMutation({
    mutationFn: updateExample,
    onSuccess: (updatedItem) => {
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: exampleKeys.list(organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: exampleKeys.detail(updatedItem.id),
      });
      toast.success('Ejemplo actualizado');
    },
    onError: (error: Error) => {
      console.error('Error updating example:', error);
      toast.error('Error al actualizar ejemplo', {
        description: error.message,
      });
    },
  });

  /**
   * Delete example mutation
   */
  const deleteMutation = useMutation({
    mutationFn: deleteExample,
    onSuccess: () => {
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: exampleKeys.list(organizationId),
      });
      toast.success('Ejemplo eliminado');
    },
    onError: (error: Error) => {
      console.error('Error deleting example:', error);
      toast.error('Error al eliminar ejemplo', {
        description: error.message,
      });
    },
  });

  // ========================================================================
  // RETURN API
  // ========================================================================

  return {
    // Data
    examples,
    isLoading,
    error: error as Error | null,

    // Actions
    refetch,
    createExample: (input: CreateExampleInput) => createMutation.mutate(input),
    updateExample: (input: UpdateExampleInput) => updateMutation.mutate(input),
    deleteExample: (id: string) => deleteMutation.mutate(id),

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

// ============================================================================
// ADDITIONAL HOOKS (if needed)
// ============================================================================

/**
 * Hook for fetching a single example detail
 *
 * @example
 * const { example, isLoading } = useExampleDetail('example-id');
 */
export const useExampleDetail = (id: string | null) => {
  const {
    data: example,
    isLoading,
    error,
  } = useQuery({
    queryKey: exampleKeys.detail(id!),
    queryFn: () => fetchExampleDetail(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes - details are usually more stable
    onError: (error: Error) => {
      console.error('Error fetching example detail:', error);
      toast.error('Error al cargar ejemplo');
    },
  });

  return {
    example,
    isLoading,
    error: error as Error | null,
  };
};
