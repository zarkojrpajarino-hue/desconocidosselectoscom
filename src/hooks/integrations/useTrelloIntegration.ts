import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TrelloAccount } from '@/types/integrations';

interface SyncResult {
  imported?: number;
  updated?: number;
  skipped?: number;
  success?: boolean;
}

export function useTrelloIntegration(organizationId: string | null) {
  const [account, setAccount] = useState<TrelloAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);

  const loadAccount = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .rpc('get_trello_connection_status', { org_id: organizationId });
      
      if (error) throw error;
      
      const accountData = data?.[0] ? {
        id: data[0].id,
        organization_id: data[0].organization_id,
        board_id: data[0].board_id,
        board_name: data[0].board_name,
        sync_enabled: data[0].sync_enabled,
        last_sync_at: data[0].last_sync_at,
        last_sync_status: data[0].last_sync_status,
        created_at: new Date().toISOString(),
      } as TrelloAccount : null;
      
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

  const connect = async (apiKey: string, apiToken: string) => {
    if (!organizationId || !apiKey.trim() || !apiToken.trim()) {
      toast.error('Por favor, introduce tu API Key y Token de Trello');
      return false;
    }

    setSaving(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('validate-trello-token', {
        body: { organizationId, apiKey, apiToken }
      });

      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.error || 'Credenciales inválidas');
      }
      
      toast.success('Trello conectado correctamente');
      await loadAccount();
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al conectar con Trello';
      toast.error(message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    if (!account || !confirm('¿Desconectar Trello?')) return;
    
    const { error } = await supabase
      .from('trello_accounts')
      .delete()
      .eq('id', account.id);
    
    if (error) {
      toast.error('Error al desconectar');
    } else {
      toast.success('Trello desconectado');
      setAccount(null);
    }
  };

  const toggleSync = async (enabled: boolean) => {
    if (!account) return;
    
    const { error } = await supabase
      .from('trello_accounts')
      .update({ sync_enabled: enabled })
      .eq('id', account.id);
    
    if (error) {
      toast.error('Error al actualizar');
    } else {
      setAccount({ ...account, sync_enabled: enabled });
      toast.success(enabled ? 'Sincronización activada' : 'Sincronización desactivada');
    }
  };

  // Export task TO Trello
  const syncTask = async (taskId: string): Promise<boolean> => {
    if (!organizationId) return false;
    setSyncing(true);
    
    try {
      const { error } = await supabase.functions.invoke('sync-to-trello', {
        body: { organizationId, taskId }
      });
      
      if (error) throw error;
      toast.success('Tarea exportada a Trello');
      await loadAccount();
      return true;
    } catch (error) {
      toast.error('Error al exportar a Trello');
      return false;
    } finally {
      setSyncing(false);
    }
  };

  // Import cards FROM Trello
  const importCards = async (limit?: number): Promise<SyncResult | null> => {
    if (!organizationId) return null;
    setImporting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-from-trello', {
        body: { organizationId, limit: limit ?? 50 }
      });
      
      if (error) throw error;
      
      const result = data as SyncResult;
      const message = [
        result?.imported ? `${result.imported} importadas` : null,
        result?.updated ? `${result.updated} actualizadas` : null
      ].filter(Boolean).join(', ');
      
      toast.success(`Importación completada: ${message || 'Sin cambios'}`);
      await loadAccount();
      return result;
    } catch (error) {
      toast.error('Error al importar desde Trello');
      return null;
    } finally {
      setImporting(false);
    }
  };

  return {
    account,
    loading,
    saving,
    syncing,
    importing,
    connect,
    disconnect,
    toggleSync,
    syncTask,      // Export single task
    importCards,   // Import from Trello
    refresh: loadAccount
  };
}
