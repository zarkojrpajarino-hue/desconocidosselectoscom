import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  description: string;
  category: 'feature' | 'improvement' | 'bugfix' | 'breaking' | 'security';
  details: string | null;
  image_url: string | null;
  video_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserChangelogView {
  id: string;
  user_id: string;
  changelog_id: string;
  viewed_at: string;
  feedback: 'helpful' | 'not_helpful' | 'neutral' | null;
  feedback_at: string | null;
}

/**
 * Hook for changelog management
 */
export function useChangelog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch published changelog entries
  const { data: entries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ['changelog-entries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('changelog_entries')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as ChangelogEntry[];
    },
  });

  // Get unread count for current user
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-changelog-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { data, error } = await supabase.rpc('get_unread_changelog_count', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return (data as number) ?? 0;
    },
    enabled: !!user?.id,
  });

  // Fetch user's viewed entries
  const { data: viewedEntries = [] } = useQuery({
    queryKey: ['changelog-views', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_changelog_views')
        .select('changelog_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data.map(v => v.changelog_id);
    },
    enabled: !!user?.id,
  });

  // Mark entry as viewed
  const markAsViewedMutation = useMutation({
    mutationFn: async (changelogId: string) => {
      if (!user?.id) return;

      const { error } = await supabase.rpc('mark_changelog_read', {
        p_changelog_id: changelogId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-changelog-count'] });
      queryClient.invalidateQueries({ queryKey: ['changelog-views'] });
    },
  });

  // Submit feedback on entry
  const submitFeedbackMutation = useMutation({
    mutationFn: async ({
      changelogId,
      feedback,
    }: {
      changelogId: string;
      feedback: 'helpful' | 'not_helpful' | 'neutral';
    }) => {
      if (!user?.id) return;

      const { error } = await supabase
        .from('user_changelog_views')
        .update({
          feedback,
          feedback_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('changelog_id', changelogId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('¡Gracias por tu feedback!');
    },
  });

  // Create new changelog entry (admin)
  const createEntryMutation = useMutation({
    mutationFn: async (data: Partial<ChangelogEntry>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase.from('changelog_entries').insert({
        version: data.version,
        title: data.title,
        description: data.description,
        category: data.category,
        details: data.details,
        image_url: data.image_url,
        video_url: data.video_url,
        is_published: data.is_published ?? false,
        published_at: data.is_published ? new Date().toISOString() : null,
        created_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changelog-entries'] });
      toast.success('Entrada de changelog creada');
    },
    onError: () => {
      toast.error('Error al crear entrada');
    },
  });

  // Update changelog entry (admin)
  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ChangelogEntry> & { id: string }) => {
      const updateData: Partial<ChangelogEntry> = { ...data };
      
      if (data.is_published && !data.published_at) {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('changelog_entries')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changelog-entries'] });
      toast.success('Entrada actualizada');
    },
    onError: () => {
      toast.error('Error al actualizar entrada');
    },
  });

  // Delete changelog entry (admin)
  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('changelog_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changelog-entries'] });
      toast.success('Entrada eliminada');
    },
    onError: () => {
      toast.error('Error al eliminar entrada');
    },
  });

  // Check if entry is unread
  const isUnread = (entryId: string) => !viewedEntries.includes(entryId);

  return {
    entries,
    unreadCount,
    viewedEntries,
    loadingEntries,
    isUnread,
    markAsViewed: markAsViewedMutation.mutate,
    submitFeedback: submitFeedbackMutation.mutate,
    createEntry: createEntryMutation.mutate,
    updateEntry: updateEntryMutation.mutate,
    deleteEntry: deleteEntryMutation.mutate,
    isCreating: createEntryMutation.isPending,
    isUpdating: updateEntryMutation.isPending,
  };
}
