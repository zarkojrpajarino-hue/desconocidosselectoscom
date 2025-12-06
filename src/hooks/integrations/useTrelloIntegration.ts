import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TrelloAccount } from '@/types/integrations';

export function useTrelloIntegration(organizationId: string | null) {
  const [account, setAccount] = useState<TrelloAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAccount = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    
    try {
      const { data } = await supabase
        .from('trello_accounts')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();
      
      setAccount(data as TrelloAccount | null);
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
      // Verify credentials by getting boards
      const response = await fetch(
        `https://api.trello.com/1/members/me/boards?key=${apiKey}&token=${apiToken}`
      );
      const boards = await response.json();
      
      if (!Array.isArray(boards)) {
        throw new Error('Credenciales inválidas');
      }

      const { error } = await supabase.from('trello_accounts').upsert({
        organization_id: organizationId,
        api_key: apiKey,
        api_token: apiToken,
        sync_enabled: true
      }, { onConflict: 'organization_id' });

      if (error) throw error;
      
      toast.success('Trello conectado correctamente');
      await loadAccount();
      return true;
    } catch (error) {
      toast.error('Error al conectar con Trello. Verifica tus credenciales.');
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
