import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { OutlookAccount } from '@/types/integrations';

export function useOutlookIntegration() {
  const { user } = useAuth();
  const [account, setAccount] = useState<OutlookAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadAccount = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const { data } = await supabase
        .from('outlook_accounts')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setAccount(data as OutlookAccount | null);
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadAccount();
    }
  }, [user, loadAccount]);

  const connect = async () => {
    if (!user) return;
    setConnecting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('outlook-auth-url', {
        body: { user_id: user.id }
      });
      
      if (error) throw error;
      
      if (data?.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (error) {
      toast.error('Error al conectar con Outlook');
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!account || !confirm('¿Desconectar Outlook Calendar?')) return;
    
    const { error } = await supabase
      .from('outlook_accounts')
      .delete()
      .eq('id', account.id);
    
    if (error) {
      toast.error('Error al desconectar');
    } else {
      toast.success('Outlook desconectado');
      setAccount(null);
    }
  };

  const toggleSync = async (enabled: boolean) => {
    if (!account) return;
    
    const { error } = await supabase
      .from('outlook_accounts')
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
    setSyncing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-outlook-events');
      
      if (error) throw error;
      
      toast.success(`Sincronización completada: ${data?.synced || 0} eventos`);
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
