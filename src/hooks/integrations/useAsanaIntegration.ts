import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AsanaAccount } from '@/types/integrations';

export function useAsanaIntegration(organizationId: string | null) {
  const [account, setAccount] = useState<AsanaAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAccount = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    
    try {
      // Use secure function that only returns connection status, not tokens
      const { data, error } = await supabase
        .rpc('get_asana_connection_status', { org_id: organizationId });
      
      if (error) throw error;
      
      // Map the RPC result to match expected interface
      const accountData = data?.[0] ? {
        id: data[0].id,
        organization_id: data[0].organization_id,
        workspace_id: data[0].workspace_id,
        workspace_name: data[0].workspace_name,
        project_id: data[0].project_id,
        project_name: data[0].project_name,
        sync_enabled: data[0].sync_enabled,
        last_sync_at: data[0].last_sync_at,
        last_sync_status: data[0].last_sync_status,
        created_at: new Date().toISOString(), // Not exposed but required by type
        // access_token is not exposed to client anymore
      } as AsanaAccount : null;
      
      setAccount(accountData);
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

  const connect = async (apiKey: string) => {
    if (!organizationId || !apiKey.trim()) {
      toast.error('Por favor, introduce tu Personal Access Token de Asana');
      return false;
    }

    setSaving(true);
    
    try {
      // Call edge function to validate and store credentials securely
      const { data, error } = await supabase.functions.invoke('validate-asana-token', {
        body: { 
          organizationId,
          accessToken: apiKey 
        }
      });

      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.error || 'Token inválido');
      }
      
      toast.success('Asana conectado correctamente');
      await loadAccount();
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al conectar con Asana';
      toast.error(message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    if (!account || !confirm('¿Desconectar Asana?')) return;
    
    const { error } = await supabase
      .from('asana_accounts')
      .delete()
      .eq('id', account.id);
    
    if (error) {
      toast.error('Error al desconectar');
    } else {
      toast.success('Asana desconectado');
      setAccount(null);
    }
  };

  const toggleSync = async (enabled: boolean) => {
    if (!account) return;
    
    const { error } = await supabase
      .from('asana_accounts')
      .update({ sync_enabled: enabled })
      .eq('id', account.id);
    
    if (error) {
      toast.error('Error al actualizar');
    } else {
      setAccount({ ...account, sync_enabled: enabled });
      toast.success(enabled ? 'Sincronización activada' : 'Sincronización desactivada');
    }
  };

  return {
    account,
    loading,
    saving,
    connect,
    disconnect,
    toggleSync,
    refresh: loadAccount
  };
}
