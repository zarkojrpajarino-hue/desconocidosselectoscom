import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { HubSpotAccount } from '@/types/integrations';

export function useHubSpotIntegration(organizationId: string | null) {
  const [account, setAccount] = useState<HubSpotAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadAccount = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    
    try {
      const { data } = await supabase
        .from('hubspot_accounts')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();
      
      setAccount(data as HubSpotAccount | null);
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      loadAccount();
    }
  }, [organizationId, loadAccount]);

  const connect = async () => {
    if (!organizationId) return;
    setConnecting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('hubspot-auth-url', {
        body: { organization_id: organizationId }
      });
      
      if (error) throw error;
      
      if (data?.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (error) {
      toast.error('Error al conectar con HubSpot');
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!account || !confirm('¿Desconectar HubSpot CRM? Se perderán todas las sincronizaciones.')) return;
    
    const { error } = await supabase
      .from('hubspot_accounts')
      .delete()
      .eq('id', account.id);
    
    if (error) {
      toast.error('Error al desconectar');
    } else {
      toast.success('HubSpot desconectado');
      setAccount(null);
    }
  };

  const toggleSync = async (enabled: boolean) => {
    if (!account) return;
    
    const { error } = await supabase
      .from('hubspot_accounts')
      .update({ sync_enabled: enabled })
      .eq('id', account.id);
    
    if (error) {
      toast.error('Error al actualizar');
    } else {
      setAccount({ ...account, sync_enabled: enabled });
      toast.success(enabled ? 'Sincronización activada' : 'Sincronización desactivada');
    }
  };

  const syncNow = async () => {
    if (!organizationId) return;
    setSyncing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-to-hubspot', {
        body: { organization_id: organizationId }
      });
      
      if (error) throw error;
      
      toast.success(`Sincronización completada: ${data?.synced || 0} contactos`);
      await loadAccount();
    } catch (error) {
      toast.error('Error al sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  return {
    account,
    loading,
    connecting,
    syncing,
    connect,
    disconnect,
    toggleSync,
    syncNow,
    refresh: loadAccount
  };
}
