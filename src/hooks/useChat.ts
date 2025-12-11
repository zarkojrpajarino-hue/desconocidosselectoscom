import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  channel_id: string;
  user_id: string;
  message: string;
  attachments: unknown;
  reactions: Record<string, string[]>;
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
}

export function useChat(channelId?: string) {
  const queryClient = useQueryClient();

  const { data: messages } = useQuery({
    queryKey: ['chat-messages', channelId],
    queryFn: async () => {
      if (!channelId) return [];

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!channelId,
    refetchInterval: 3000,
  });

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      if (!channelId) throw new Error('No channel');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          channel_id: channelId,
          user_id: user.id,
          message,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', channelId] });
    },
  });

  return {
    messages,
    sendMessage,
  };
}
