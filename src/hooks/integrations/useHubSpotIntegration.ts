import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { HubSpotAccount } from '@/types/integrations';

interface SyncResult {
  synced?: number;
  imported?: number;
  updated?: number;
  skipped?: number;
  errors?: number;
}

export function useHubSpotIntegration(organizationId: string | null) {
  const [account, setAccount] = useState<HubSpotAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);

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

  // Export leads TO HubSpot
  const syncNow = async (): Promise<SyncResult | null> => {
    if (!organizationId) return null;
    setSyncing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-to-hubspot', {
        body: { organization_id: organizationId }
      });
      
      if (error) throw error;
      
      const result = data as SyncResult;
      toast.success(`Exportación completada: ${result?.synced || 0} contactos enviados a HubSpot`);
      await loadAccount();
      return result;
    } catch (error) {
      toast.error('Error al exportar a HubSpot');
      return null;
    } finally {
      setSyncing(false);
    }
  };

  // Import contacts FROM HubSpot
  const importNow = async (options?: { syncDeals?: boolean; limit?: number }): Promise<SyncResult | null> => {
    if (!organizationId) return null;
    setImporting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-from-hubspot', {
        body: { 
          organization_id: organizationId,
          sync_deals: options?.syncDeals ?? true,
          limit: options?.limit ?? 100
        }
      });
      
      if (error) throw error;
      
      const result = data as SyncResult;
      const message = [
        result?.imported ? `${result.imported} importados` : null,
        result?.updated ? `${result.updated} actualizados` : null,
        result?.skipped ? `${result.skipped} sin cambios` : null
      ].filter(Boolean).join(', ');
      
      toast.success(`Importación completada: ${message}`);
      await loadAccount();
      return result;
    } catch (error) {
      toast.error('Error al importar desde HubSpot');
      return null;
    } finally {
      setImporting(false);
    }
  };

  // Bidirectional sync (export then import)
  const syncBidirectional = async (): Promise<{ export: SyncResult | null; import: SyncResult | null }> => {
    const exportResult = await syncNow();
    const importResult = await importNow();
    return { export: exportResult, import: importResult };
  };

  return {
    account,
    loading,
    connecting,
    syncing,
    importing,
    connect,
    disconnect,
    toggleSync,
    syncNow,        // Export to HubSpot
    importNow,      // Import from HubSpot
    syncBidirectional, // Both directions
    refresh: loadAccount
  };
}
