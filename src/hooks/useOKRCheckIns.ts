import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { toast } from 'sonner';

export interface OKRCheckIn {
  id: string;
  key_result_id: string;
  user_id: string;
  organization_id: string | null;
  check_in_date: string;
  previous_value: number | null;
  new_value: number;
  confidence_level: number | null;
  status: 'on_track' | 'at_risk' | 'blocked' | 'achieved' | null;
  progress_update: string;
  blockers: string | null;
  next_steps: string | null;
  learnings: string | null;
  attachments: unknown[] | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCheckInData {
  key_result_id: string;
  previous_value?: number;
  new_value: number;
  confidence_level?: number;
  status?: 'on_track' | 'at_risk' | 'blocked' | 'achieved';
  progress_update: string;
  blockers?: string;
  next_steps?: string;
  learnings?: string;
}

export function useOKRCheckIns(keyResultId?: string) {
  const { user } = useAuth();
  const { organizationId } = useCurrentOrganization();
  const queryClient = useQueryClient();

  const { data: checkIns, isLoading } = useQuery({
    queryKey: ['okrCheckIns', keyResultId],
    queryFn: async () => {
      if (!keyResultId) return [];
      
      const { data, error } = await supabase
        .from('okr_check_ins')
        .select('*')
        .eq('key_result_id', keyResultId)
        .order('check_in_date', { ascending: false });
      
      if (error) throw error;
      return data as OKRCheckIn[];
    },
    enabled: !!keyResultId,
  });

  const createCheckIn = useMutation({
    mutationFn: async (checkInData: CreateCheckInData) => {
      if (!user || !organizationId) throw new Error('No user or organization');
      
      const { data, error } = await supabase
        .from('okr_check_ins')
        .insert({
          ...checkInData,
          user_id: user.id,
          organization_id: organizationId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['okrCheckIns'] });
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
      queryClient.invalidateQueries({ queryKey: ['keyResults'] });
      toast.success('Check-in guardado correctamente');
    },
    onError: (error) => {
      toast.error(`Error al guardar check-in: ${error.message}`);
    },
  });

  return {
    checkIns,
    isLoading,
    createCheckIn: createCheckIn.mutate,
    isCreating: createCheckIn.isPending,
  };
}
