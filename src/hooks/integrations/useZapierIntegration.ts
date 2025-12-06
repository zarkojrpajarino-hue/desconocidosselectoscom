import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ZapierSubscription } from '@/types/integrations';

export function useZapierIntegration(organizationId: string | null) {
  const [subscriptions, setSubscriptions] = useState<ZapierSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const loadSubscriptions = useCallback(async () => {
    if (!organizationId) return;
    
    try {
      const { data } = await supabase
        .from('zapier_subscriptions')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      
      setSubscriptions((data as ZapierSubscription[]) || []);
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      loadSubscriptions();
    }
  }, [organizationId, loadSubscriptions]);

  const createSubscription = async (targetUrl: string, eventType: string) => {
    if (!targetUrl.trim() || !organizationId) {
      toast.error('Por favor, introduce la URL del webhook de Zapier');
      return false;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase
        .from('zapier_subscriptions')
        .insert({
          organization_id: organizationId,
          target_url: targetUrl,
          event_type: eventType,
          is_active: true
        });
      
      if (error) throw error;
      
      await loadSubscriptions();
      toast.success('Conexión Zapier creada');
      return true;
    } catch (error) {
      toast.error('Error al crear la conexión');
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const deleteSubscription = async (id: string) => {
    if (!confirm('¿Eliminar esta conexión de Zapier?')) return;
    
    const { error } = await supabase
      .from('zapier_subscriptions')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Error al eliminar');
    } else {
      toast.success('Conexión eliminada');
      await loadSubscriptions();
    }
  };

  const toggleSubscription = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('zapier_subscriptions')
      .update({ is_active: !isActive })
      .eq('id', id);
    
    if (error) {
      toast.error('Error al actualizar');
    } else {
      await loadSubscriptions();
    }
  };

  return {
    subscriptions,
    loading,
    isCreating,
    createSubscription,
    deleteSubscription,
    toggleSubscription,
    refresh: loadSubscriptions
  };
}
