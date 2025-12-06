import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { WebhookType, WebhookDelivery } from '@/types/integrations';

export function useWebhooks(organizationId: string | null) {
  const [webhooks, setWebhooks] = useState<WebhookType[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const loadWebhooks = useCallback(async () => {
    if (!organizationId) return;
    
    try {
      const { data: webhooksData } = await supabase
        .from('webhooks')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      setWebhooks((webhooksData as WebhookType[]) || []);

      // Load recent deliveries
      if (webhooksData && webhooksData.length > 0) {
        const webhookIds = webhooksData.map(w => w.id);
        const { data: deliveriesData } = await supabase
          .from('webhook_deliveries')
          .select('id, event_type, status, http_status_code, response_time_ms, created_at')
          .in('webhook_id', webhookIds)
          .order('created_at', { ascending: false })
          .limit(20);

        setDeliveries((deliveriesData as WebhookDelivery[]) || []);
      }
    } catch (error) {
      toast.error('Error al cargar webhooks');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      loadWebhooks();
    }
  }, [organizationId, loadWebhooks]);

  const createWebhook = async (data: { name: string; url: string; events: string[] }) => {
    if (!data.name.trim() || !data.url.trim() || !organizationId) {
      toast.error('Por favor, completa todos los campos');
      return false;
    }

    setIsCreating(true);
    try {
      // Generate webhook secret
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      const secret = 'whsec_' + Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const { error } = await supabase
        .from('webhooks')
        .insert({
          organization_id: organizationId,
          name: data.name,
          url: data.url,
          secret,
          events: data.events
        });

      if (error) throw error;

      await loadWebhooks();
      toast.success('Webhook creado correctamente');
      return true;

    } catch (error) {
      toast.error('Error al crear el Webhook');
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm('¿Estás seguro? Esta acción no se puede deshacer.')) return;

    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Error al eliminar el Webhook');
    } else {
      toast.success('Webhook eliminado');
      await loadWebhooks();
    }
  };

  const toggleWebhook = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('webhooks')
      .update({ is_active: !isActive })
      .eq('id', id);

    if (error) {
      toast.error('Error al actualizar el Webhook');
    } else {
      await loadWebhooks();
    }
  };

  return {
    webhooks,
    deliveries,
    loading,
    isCreating,
    createWebhook,
    deleteWebhook,
    toggleWebhook,
    refresh: loadWebhooks
  };
}
