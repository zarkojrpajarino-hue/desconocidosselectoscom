import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SlackWorkspace, SlackChannel, SlackEventMapping } from '@/types/integrations';

export function useSlackIntegration(organizationId: string | null) {
  const [workspace, setWorkspace] = useState<SlackWorkspace | null>(null);
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [mappings, setMappings] = useState<SlackEventMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const loadSlackData = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    
    try {
      // Load workspace
      const { data: workspaceData } = await supabase
        .from('slack_workspaces')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      setWorkspace(workspaceData as SlackWorkspace | null);

      if (workspaceData) {
        // Load channels
        const { data: channelsData } = await supabase
          .from('slack_channels')
          .select('*')
          .eq('slack_workspace_id', workspaceData.id)
          .eq('is_archived', false)
          .order('channel_name');

        setChannels((channelsData as SlackChannel[]) || []);

        // Load event mappings
        const { data: mappingsData } = await supabase
          .from('slack_event_mappings')
          .select('*')
          .eq('slack_workspace_id', workspaceData.id);

        setMappings((mappingsData as SlackEventMapping[]) || []);
      }
    } catch (error) {
      // Silent fail - data might not exist
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      loadSlackData();
    }
  }, [organizationId, loadSlackData]);

  const connect = () => {
    if (!organizationId) return;
    setConnecting(true);
    const baseUrl = `https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/slack-oauth?action=authorize&organization_id=${organizationId}`;
    window.location.href = baseUrl;
  };

  const disconnect = async () => {
    if (!workspace || !confirm('¿Desconectar Slack? Se perderán todas las configuraciones.')) {
      return;
    }

    const { error } = await supabase
      .from('slack_workspaces')
      .delete()
      .eq('id', workspace.id);

    if (error) {
      toast.error('Error al desconectar Slack');
    } else {
      toast.success('Slack desconectado');
      setWorkspace(null);
      setChannels([]);
      setMappings([]);
    }
  };

  const toggleWorkspace = async (enabled: boolean) => {
    if (!workspace) return;

    const { error } = await supabase
      .from('slack_workspaces')
      .update({ enabled })
      .eq('id', workspace.id);

    if (error) {
      toast.error('Error al actualizar');
    } else {
      setWorkspace({ ...workspace, enabled });
      toast.success(enabled ? 'Notificaciones activadas' : 'Notificaciones desactivadas');
    }
  };

  const updateMapping = async (eventType: string, channelId: string, channelName: string) => {
    if (!workspace) return;

    const { error } = await supabase
      .from('slack_event_mappings')
      .upsert({
        slack_workspace_id: workspace.id,
        event_type: eventType,
        channel_id: channelId,
        channel_name: channelName,
        enabled: true,
      }, { onConflict: 'slack_workspace_id,event_type' });

    if (error) {
      toast.error('Error al actualizar canal');
    } else {
      await loadSlackData();
      toast.success('Canal actualizado');
    }
  };

  const toggleMapping = async (mappingId: string, enabled: boolean) => {
    const { error } = await supabase
      .from('slack_event_mappings')
      .update({ enabled })
      .eq('id', mappingId);

    if (error) {
      toast.error('Error al actualizar');
    } else {
      await loadSlackData();
    }
  };

  return {
    workspace,
    channels,
    mappings,
    loading,
    connecting,
    connect,
    disconnect,
    toggleWorkspace,
    updateMapping,
    toggleMapping,
    refresh: loadSlackData
  };
}
