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
      const { data } = await supabase
        .from('asana_accounts')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();
      
      setAccount(data as AsanaAccount | null);
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
      // Verify token by getting user workspaces
      const response = await fetch('https://app.asana.com/api/1.0/workspaces', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const workspacesData = await response.json();
      
      if (workspacesData.errors) {
        throw new Error('Token inválido');
      }

      const workspace = workspacesData.data?.[0];
      
      const { error } = await supabase.from('asana_accounts').upsert({
        organization_id: organizationId,
        access_token: apiKey,
        workspace_id: workspace?.gid || null,
        workspace_name: workspace?.name || null,
        sync_enabled: true
      }, { onConflict: 'organization_id' });

      if (error) throw error;
      
      toast.success('Asana conectado correctamente');
      await loadAccount();
      return true;
    } catch (error) {
      toast.error('Error al conectar con Asana. Verifica tu token.');
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
