import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter,
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Copy, 
  Key, 
  Plus, 
  Trash2, 
  Webhook,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  MessageSquare,
  Check,
  X,
  Zap,
  Calendar,
  RefreshCw,
  Link2
} from 'lucide-react';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  scopes: string[];
  rate_limit: number;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
}

interface WebhookType {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  last_delivery_at: string | null;
  last_delivery_status: string | null;
  created_at: string;
}

interface WebhookDelivery {
  id: string;
  event_type: string;
  status: string;
  http_status_code: number | null;
  response_time_ms: number | null;
  created_at: string;
}

interface SlackWorkspace {
  id: string;
  team_id: string;
  team_name: string;
  enabled: boolean;
  total_messages_sent: number;
  last_message_at: string | null;
  created_at: string;
}

interface SlackChannel {
  id: string;
  channel_id: string;
  channel_name: string;
  is_private: boolean;
}

interface SlackEventMapping {
  id: string;
  event_type: string;
  channel_id: string;
  channel_name: string;
  enabled: boolean;
}

interface ZapierSubscription {
  id: string;
  target_url: string;
  event_type: string;
  is_active: boolean;
  created_at: string;
}

interface OutlookAccount {
  id: string;
  email: string;
  display_name: string | null;
  sync_enabled: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  created_at: string;
}

interface HubSpotAccount {
  id: string;
  portal_id: string;
  hub_domain: string;
  sync_enabled: boolean;
  sync_direction: string;
  total_contacts_synced: number;
  total_deals_synced: number;
  last_sync_at: string | null;
  last_sync_status: string | null;
  created_at: string;
}

const SLACK_EVENT_TYPES = [
  { value: 'lead.created', label: 'Nuevo Lead Creado', icon: '🎯' },
  { value: 'lead.won', label: 'Lead Ganado', icon: '🎉' },
  { value: 'task.completed', label: 'Tarea Completada', icon: '✅' },
  { value: 'okr.at_risk', label: 'OKR en Riesgo', icon: '⚠️' },
];

const ZAPIER_EVENT_TYPES = [
  { value: 'lead.created', label: 'Nuevo Lead' },
  { value: 'lead.updated', label: 'Lead Actualizado' },
  { value: 'task.completed', label: 'Tarea Completada' },
  { value: 'okr.updated', label: 'OKR Actualizado' },
  { value: 'metric.created', label: 'Métrica Registrada' },
];

export default function ApiKeysPage() {
  const { user } = useAuth();
  const [currentOrganizationId, setCurrentOrganizationId] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookType[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newWebhookData, setNewWebhookData] = useState({
    name: '',
    url: '',
    events: ['lead.created', 'lead.updated', 'task.completed']
  });
  
  // Slack state
  const [slackWorkspace, setSlackWorkspace] = useState<SlackWorkspace | null>(null);
  const [slackChannels, setSlackChannels] = useState<SlackChannel[]>([]);
  const [slackMappings, setSlackMappings] = useState<SlackEventMapping[]>([]);
  const [slackLoading, setSlackLoading] = useState(true);
  const [connectingSlack, setConnectingSlack] = useState(false);

  // Zapier state
  const [zapierSubs, setZapierSubs] = useState<ZapierSubscription[]>([]);
  const [zapierDialogOpen, setZapierDialogOpen] = useState(false);
  const [newZapierData, setNewZapierData] = useState({ target_url: '', event_type: 'lead.created' });
  const [isCreatingZapier, setIsCreatingZapier] = useState(false);

  // Outlook state
  const [outlookAccount, setOutlookAccount] = useState<OutlookAccount | null>(null);
  const [outlookLoading, setOutlookLoading] = useState(true);
  const [connectingOutlook, setConnectingOutlook] = useState(false);
  const [syncingOutlook, setSyncingOutlook] = useState(false);

  // HubSpot state
  const [hubspotAccount, setHubspotAccount] = useState<HubSpotAccount | null>(null);
  const [hubspotLoading, setHubspotLoading] = useState(true);
  const [connectingHubspot, setConnectingHubspot] = useState(false);
  const [syncingHubspot, setSyncingHubspot] = useState(false);

  useEffect(() => {
    loadOrganization();
  }, [user]);

  useEffect(() => {
    if (currentOrganizationId) {
      loadApiKeys();
      loadWebhooks();
      loadSlackData();
      loadZapierSubs();
      loadHubspotAccount();
    }
  }, [currentOrganizationId]);

  useEffect(() => {
    if (user) {
      loadOutlookAccount();
    }
  }, [user]);

  // Check for OAuth callbacks
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const slackStatus = urlParams.get('slack');
    const outlookStatus = urlParams.get('outlook');
    const hubspotStatus = urlParams.get('hubspot');
    
    if (slackStatus === 'connected') {
      toast.success('¡Slack conectado correctamente!');
      window.history.replaceState({}, '', window.location.pathname);
      loadSlackData();
    } else if (slackStatus === 'error') {
      toast.error('Error al conectar Slack: ' + (urlParams.get('message') || 'desconocido'));
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (outlookStatus === 'connected') {
      toast.success('¡Outlook Calendar conectado correctamente!');
      window.history.replaceState({}, '', window.location.pathname);
      loadOutlookAccount();
    } else if (outlookStatus === 'error') {
      toast.error('Error al conectar Outlook: ' + (urlParams.get('message') || 'desconocido'));
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (hubspotStatus === 'connected') {
      toast.success('¡HubSpot CRM conectado correctamente!');
      window.history.replaceState({}, '', window.location.pathname);
      loadHubspotAccount();
    } else if (hubspotStatus === 'error') {
      toast.error('Error al conectar HubSpot: ' + (urlParams.get('message') || 'desconocido'));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadOrganization = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_roles')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    
    if (data) {
      setCurrentOrganizationId(data.organization_id);
    }
  };

  const loadApiKeys = async () => {
    const { data } = await supabase
      .from('api_keys')
      .select('*')
      .eq('organization_id', currentOrganizationId)
      .order('created_at', { ascending: false });

    setApiKeys((data as ApiKey[]) || []);
  };

  const loadWebhooks = async () => {
    const { data: webhooksData } = await supabase
      .from('webhooks')
      .select('*')
      .eq('organization_id', currentOrganizationId)
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
  };

  const loadSlackData = async () => {
    if (!currentOrganizationId) return;
    setSlackLoading(true);
    try {
      // Load workspace
      const { data: workspaceData } = await supabase
        .from('slack_workspaces')
        .select('*')
        .eq('organization_id', currentOrganizationId)
        .maybeSingle();

      setSlackWorkspace(workspaceData as SlackWorkspace | null);

      if (workspaceData) {
        // Load channels
        const { data: channelsData } = await supabase
          .from('slack_channels')
          .select('*')
          .eq('slack_workspace_id', workspaceData.id)
          .eq('is_archived', false)
          .order('channel_name');

        setSlackChannels((channelsData as SlackChannel[]) || []);

        // Load event mappings
        const { data: mappingsData } = await supabase
          .from('slack_event_mappings')
          .select('*')
          .eq('slack_workspace_id', workspaceData.id);

        setSlackMappings((mappingsData as SlackEventMapping[]) || []);
      }
    } catch (error) {
      console.error('Error loading Slack data:', error);
    } finally {
      setSlackLoading(false);
    }
  };

  const connectSlack = async () => {
    if (!currentOrganizationId) return;
    setConnectingSlack(true);
    // Build OAuth URL with query params
    const baseUrl = `https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/slack-oauth?action=authorize&organization_id=${currentOrganizationId}`;
    // Redirect to Slack OAuth
    window.location.href = baseUrl;
  };

  const disconnectSlack = async () => {
    if (!slackWorkspace || !confirm('¿Desconectar Slack? Se perderán todas las configuraciones.')) {
      return;
    }

    const { error } = await supabase
      .from('slack_workspaces')
      .delete()
      .eq('id', slackWorkspace.id);

    if (error) {
      toast.error('Error al desconectar Slack');
    } else {
      toast.success('Slack desconectado');
      setSlackWorkspace(null);
      setSlackChannels([]);
      setSlackMappings([]);
    }
  };

  const toggleSlackWorkspace = async (enabled: boolean) => {
    if (!slackWorkspace) return;

    const { error } = await supabase
      .from('slack_workspaces')
      .update({ enabled })
      .eq('id', slackWorkspace.id);

    if (error) {
      toast.error('Error al actualizar');
    } else {
      setSlackWorkspace({ ...slackWorkspace, enabled });
      toast.success(enabled ? 'Notificaciones activadas' : 'Notificaciones desactivadas');
    }
  };

  const updateSlackMapping = async (eventType: string, channelId: string, channelName: string) => {
    if (!slackWorkspace) return;

    const { error } = await supabase
      .from('slack_event_mappings')
      .upsert({
        slack_workspace_id: slackWorkspace.id,
        event_type: eventType,
        channel_id: channelId,
        channel_name: channelName,
        enabled: true,
      }, { onConflict: 'slack_workspace_id,event_type' });

    if (error) {
      toast.error('Error al actualizar canal');
    } else {
      loadSlackData();
      toast.success('Canal actualizado');
    }
  };

  const toggleSlackMapping = async (mappingId: string, enabled: boolean) => {
    const { error } = await supabase
      .from('slack_event_mappings')
      .update({ enabled })
      .eq('id', mappingId);

    if (error) {
      toast.error('Error al actualizar');
    } else {
      loadSlackData();
    }
  };

  // Zapier functions
  const loadZapierSubs = async () => {
    if (!currentOrganizationId) return;
    const { data } = await supabase
      .from('zapier_subscriptions')
      .select('*')
      .eq('organization_id', currentOrganizationId)
      .order('created_at', { ascending: false });
    setZapierSubs((data as ZapierSubscription[]) || []);
  };

  const createZapierSub = async () => {
    if (!newZapierData.target_url.trim()) {
      toast.error('Por favor, introduce la URL del webhook de Zapier');
      return;
    }
    setIsCreatingZapier(true);
    try {
      const { error } = await supabase
        .from('zapier_subscriptions')
        .insert({
          organization_id: currentOrganizationId,
          target_url: newZapierData.target_url,
          event_type: newZapierData.event_type,
          is_active: true
        });
      if (error) throw error;
      setZapierDialogOpen(false);
      setNewZapierData({ target_url: '', event_type: 'lead.created' });
      loadZapierSubs();
      toast.success('Conexión Zapier creada');
    } catch (error) {
      console.error('Error creating Zapier subscription:', error);
      toast.error('Error al crear la conexión');
    } finally {
      setIsCreatingZapier(false);
    }
  };

  const deleteZapierSub = async (id: string) => {
    if (!confirm('¿Eliminar esta conexión de Zapier?')) return;
    const { error } = await supabase.from('zapier_subscriptions').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar');
    } else {
      toast.success('Conexión eliminada');
      loadZapierSubs();
    }
  };

  const toggleZapierSub = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from('zapier_subscriptions').update({ is_active: !isActive }).eq('id', id);
    if (error) {
      toast.error('Error al actualizar');
    } else {
      loadZapierSubs();
    }
  };

  // Outlook functions
  const loadOutlookAccount = async () => {
    if (!user) return;
    setOutlookLoading(true);
    try {
      const { data } = await supabase
        .from('outlook_accounts')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setOutlookAccount(data as OutlookAccount | null);
    } catch (error) {
      console.error('Error loading Outlook account:', error);
    } finally {
      setOutlookLoading(false);
    }
  };

  const connectOutlook = async () => {
    if (!user) return;
    setConnectingOutlook(true);
    try {
      const { data, error } = await supabase.functions.invoke('outlook-auth-url', {
        body: { user_id: user.id }
      });
      if (error) throw error;
      if (data?.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (error) {
      console.error('Error connecting Outlook:', error);
      toast.error('Error al conectar con Outlook');
      setConnectingOutlook(false);
    }
  };

  const disconnectOutlook = async () => {
    if (!outlookAccount || !confirm('¿Desconectar Outlook Calendar?')) return;
    const { error } = await supabase.from('outlook_accounts').delete().eq('id', outlookAccount.id);
    if (error) {
      toast.error('Error al desconectar');
    } else {
      toast.success('Outlook desconectado');
      setOutlookAccount(null);
    }
  };

  const toggleOutlookSync = async (enabled: boolean) => {
    if (!outlookAccount) return;
    const { error } = await supabase.from('outlook_accounts').update({ sync_enabled: enabled }).eq('id', outlookAccount.id);
    if (error) {
      toast.error('Error al actualizar');
    } else {
      setOutlookAccount({ ...outlookAccount, sync_enabled: enabled });
      toast.success(enabled ? 'Sincronización activada' : 'Sincronización desactivada');
    }
  };

  const syncOutlookNow = async () => {
    setSyncingOutlook(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-outlook-events');
      if (error) throw error;
      toast.success(`Sincronización completada: ${data?.synced || 0} eventos`);
      loadOutlookAccount();
    } catch (error) {
      console.error('Error syncing Outlook:', error);
      toast.error('Error al sincronizar');
    } finally {
      setSyncingOutlook(false);
    }
  };

  // HubSpot functions
  const loadHubspotAccount = async () => {
    if (!currentOrganizationId) return;
    setHubspotLoading(true);
    try {
      const { data } = await supabase
        .from('hubspot_accounts')
        .select('*')
        .eq('organization_id', currentOrganizationId)
        .maybeSingle();
      setHubspotAccount(data as HubSpotAccount | null);
    } catch (error) {
      console.error('Error loading HubSpot account:', error);
    } finally {
      setHubspotLoading(false);
    }
  };

  const connectHubspot = async () => {
    if (!currentOrganizationId) return;
    setConnectingHubspot(true);
    try {
      const { data, error } = await supabase.functions.invoke('hubspot-auth-url', {
        body: { organization_id: currentOrganizationId }
      });
      if (error) throw error;
      if (data?.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (error) {
      console.error('Error connecting HubSpot:', error);
      toast.error('Error al conectar con HubSpot');
      setConnectingHubspot(false);
    }
  };

  const disconnectHubspot = async () => {
    if (!hubspotAccount || !confirm('¿Desconectar HubSpot CRM? Se perderán todas las sincronizaciones.')) return;
    const { error } = await supabase.from('hubspot_accounts').delete().eq('id', hubspotAccount.id);
    if (error) {
      toast.error('Error al desconectar');
    } else {
      toast.success('HubSpot desconectado');
      setHubspotAccount(null);
    }
  };

  const toggleHubspotSync = async (enabled: boolean) => {
    if (!hubspotAccount) return;
    const { error } = await supabase.from('hubspot_accounts').update({ sync_enabled: enabled }).eq('id', hubspotAccount.id);
    if (error) {
      toast.error('Error al actualizar');
    } else {
      setHubspotAccount({ ...hubspotAccount, sync_enabled: enabled });
      toast.success(enabled ? 'Sincronización activada' : 'Sincronización desactivada');
    }
  };

  const syncHubspotNow = async () => {
    if (!currentOrganizationId) return;
    setSyncingHubspot(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-to-hubspot', {
        body: { organization_id: currentOrganizationId }
      });
      if (error) throw error;
      toast.success(`Sincronización completada: ${data?.synced || 0} contactos`);
      loadHubspotAccount();
    } catch (error) {
      console.error('Error syncing HubSpot:', error);
      toast.error('Error al sincronizar');
    } finally {
      setSyncingHubspot(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Por favor, introduce un nombre para la API Key');
      return;
    }

    setIsCreatingKey(true);
    try {
      // Generate random API key
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      const apiKey = 'sk_live_' + Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Hash API key for storage
      const encoder = new TextEncoder();
      const data = encoder.encode(apiKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Store in database
      const { error } = await supabase
        .from('api_keys')
        .insert({
          organization_id: currentOrganizationId,
          name: newKeyName,
          key_prefix: 'sk_live_',
          key_hash: keyHash,
          scopes: ['read', 'write'],
          created_by: user?.id
        });

      if (error) throw error;

      setNewKey(apiKey);
      setShowNewKey(true);
      setKeyDialogOpen(false);
      setNewKeyName('');
      loadApiKeys();
      toast.success('API Key creada correctamente');

    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error('Error al crear la API Key');
    } finally {
      setIsCreatingKey(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    if (!confirm('¿Estás seguro? Esta acción no se puede deshacer.')) return;

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Error al eliminar la API Key');
    } else {
      toast.success('API Key eliminada');
      loadApiKeys();
    }
  };

  const createWebhook = async () => {
    if (!newWebhookData.name.trim() || !newWebhookData.url.trim()) {
      toast.error('Por favor, completa todos los campos');
      return;
    }

    setIsCreatingWebhook(true);
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
          organization_id: currentOrganizationId,
          name: newWebhookData.name,
          url: newWebhookData.url,
          secret,
          events: newWebhookData.events
        });

      if (error) throw error;

      setWebhookDialogOpen(false);
      setNewWebhookData({ name: '', url: '', events: ['lead.created', 'lead.updated', 'task.completed'] });
      loadWebhooks();
      toast.success('Webhook creado correctamente');

    } catch (error) {
      console.error('Error creating webhook:', error);
      toast.error('Error al crear el Webhook');
    } finally {
      setIsCreatingWebhook(false);
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
      loadWebhooks();
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
      loadWebhooks();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const availableEvents = [
    { value: 'lead.created', label: 'Lead creado' },
    { value: 'lead.updated', label: 'Lead actualizado' },
    { value: 'lead.deleted', label: 'Lead eliminado' },
    { value: 'task.completed', label: 'Tarea completada' },
    { value: 'okr.updated', label: 'OKR actualizado' },
    { value: 'metric.created', label: 'Métrica registrada' }
  ];

  return (
    <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">API & Integraciones</h1>
          <p className="text-muted-foreground">
            Gestiona las API Keys y Webhooks para integrar OPTIMUS-K con otras herramientas
          </p>
        </div>

        <Tabs defaultValue="api-keys" className="space-y-4">
          <TabsList>
            <TabsTrigger value="api-keys" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2">
              <Webhook className="w-4 h-4" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="slack" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Slack
            </TabsTrigger>
            <TabsTrigger value="zapier" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Zapier
            </TabsTrigger>
            <TabsTrigger value="outlook" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Outlook
            </TabsTrigger>
            <TabsTrigger value="hubspot" className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              HubSpot
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Actividad
            </TabsTrigger>
          </TabsList>

          {/* API KEYS TAB */}
          <TabsContent value="api-keys" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Las API Keys permiten acceder a OPTIMUS-K desde aplicaciones externas
              </p>
              <Dialog open={keyDialogOpen} onOpenChange={setKeyDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear API Key
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear API Key</DialogTitle>
                    <DialogDescription>
                      Genera una nueva API Key para tu organización
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="key-name">Nombre de la Key</Label>
                      <Input
                        id="key-name"
                        placeholder="Ej: Producción, Zapier, HubSpot..."
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setKeyDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={createApiKey} disabled={isCreatingKey}>
                      {isCreatingKey ? 'Creando...' : 'Crear Key'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Show new key once */}
            {showNewKey && newKey && (
              <Card className="border-green-500 bg-green-500/5">
                <CardHeader>
                  <CardTitle className="text-green-600 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    API Key Creada
                  </CardTitle>
                  <CardDescription>
                    ¡Guarda esta key ahora! No podrás verla de nuevo.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-4 py-2 rounded font-mono text-sm break-all">
                      {newKey}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(newKey)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setShowNewKey(false)}
                  >
                    Entendido, la he guardado
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* API Keys List */}
            <div className="grid gap-4">
              {apiKeys.map((key) => (
                <Card key={key.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-muted-foreground" />
                          <h3 className="font-semibold">{key.name}</h3>
                          {key.is_active ? (
                            <Badge variant="default" className="bg-green-500">Activa</Badge>
                          ) : (
                            <Badge variant="destructive">Inactiva</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">
                          {key.key_prefix}••••••••••••••••
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Creada {new Date(key.created_at).toLocaleDateString()}</span>
                          {key.last_used_at && (
                            <span>Último uso {new Date(key.last_used_at).toLocaleDateString()}</span>
                          )}
                          <span>Límite: {key.rate_limit} req/min</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteApiKey(key.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {apiKeys.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No tienes API Keys. Crea una para empezar.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Documentation */}
            <Card>
              <CardHeader>
                <CardTitle>Documentación de la API</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Autenticación</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Incluye tu API Key en el header de la petición:
                  </p>
                  <code className="block bg-muted p-3 rounded text-sm overflow-x-auto">
                    curl https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/api-v1/leads \<br />
                    &nbsp;&nbsp;-H "X-API-Key: sk_live_..." \<br />
                    &nbsp;&nbsp;-H "Content-Type: application/json"
                  </code>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Endpoints Disponibles</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• <code>GET /leads</code> - Listar leads</li>
                    <li>• <code>POST /leads</code> - Crear lead</li>
                    <li>• <code>GET /leads/:id</code> - Obtener lead</li>
                    <li>• <code>PUT /leads/:id</code> - Actualizar lead</li>
                    <li>• <code>DELETE /leads/:id</code> - Eliminar lead</li>
                    <li>• <code>GET /tasks</code> - Listar tareas</li>
                    <li>• <code>GET /metrics</code> - Listar métricas</li>
                    <li>• <code>POST /metrics</code> - Crear métrica</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Rate Limits</h4>
                  <p className="text-sm text-muted-foreground">
                    100 peticiones por minuto por API Key
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WEBHOOKS TAB */}
          <TabsContent value="webhooks" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Los Webhooks envían notificaciones a tu servidor cuando ocurren eventos
              </p>
              <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Webhook
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Webhook</DialogTitle>
                    <DialogDescription>
                      Configura un endpoint para recibir eventos
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="webhook-name">Nombre</Label>
                      <Input
                        id="webhook-name"
                        placeholder="Ej: Slack, Zapier, n8n..."
                        value={newWebhookData.name}
                        onChange={(e) => setNewWebhookData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="webhook-url">URL del Endpoint</Label>
                      <Input
                        id="webhook-url"
                        placeholder="https://tu-servidor.com/webhook"
                        value={newWebhookData.url}
                        onChange={(e) => setNewWebhookData(prev => ({ ...prev, url: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Eventos</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {availableEvents.map((event) => (
                          <label key={event.value} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={newWebhookData.events.includes(event.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewWebhookData(prev => ({
                                    ...prev,
                                    events: [...prev.events, event.value]
                                  }));
                                } else {
                                  setNewWebhookData(prev => ({
                                    ...prev,
                                    events: prev.events.filter(ev => ev !== event.value)
                                  }));
                                }
                              }}
                              className="rounded"
                            />
                            {event.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setWebhookDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={createWebhook} disabled={isCreatingWebhook}>
                      {isCreatingWebhook ? 'Creando...' : 'Crear Webhook'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Webhooks List */}
            <div className="grid gap-4">
              {webhooks.map((webhook) => (
                <Card key={webhook.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Webhook className="w-4 h-4 text-muted-foreground" />
                          <h3 className="font-semibold">{webhook.name}</h3>
                          {webhook.is_active ? (
                            <Badge variant="default" className="bg-green-500">Activo</Badge>
                          ) : (
                            <Badge variant="secondary">Pausado</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground font-mono flex items-center gap-1">
                          {webhook.url}
                          <ExternalLink className="w-3 h-3" />
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.map((event) => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            {webhook.successful_deliveries} exitosos
                          </span>
                          <span className="flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-red-500" />
                            {webhook.failed_deliveries} fallidos
                          </span>
                          {webhook.last_delivery_at && (
                            <span>Último: {new Date(webhook.last_delivery_at).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleWebhook(webhook.id, webhook.is_active)}
                        >
                          {webhook.is_active ? 'Pausar' : 'Activar'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteWebhook(webhook.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {webhooks.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Webhook className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No tienes Webhooks configurados. Crea uno para empezar.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* SLACK TAB */}
          <TabsContent value="slack" className="space-y-4">
            {slackLoading ? (
              <Card><CardContent className="py-12 text-center"><p>Cargando...</p></CardContent></Card>
            ) : !slackWorkspace ? (
              <Card>
                <CardContent className="py-12 text-center space-y-6">
                  <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Conecta tu workspace de Slack</h3>
                    <p className="text-muted-foreground mb-4">Recibe notificaciones en tiempo real sobre leads, tareas y OKRs</p>
                  </div>
                  <Button onClick={connectSlack} disabled={connectingSlack} size="lg">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    {connectingSlack ? 'Conectando...' : 'Conectar con Slack'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <MessageSquare className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{slackWorkspace.team_name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant={slackWorkspace.enabled ? "default" : "secondary"} className={slackWorkspace.enabled ? "bg-green-500" : ""}>
                              {slackWorkspace.enabled ? <><Check className="w-3 h-3 mr-1" />Activo</> : <><X className="w-3 h-3 mr-1" />Inactivo</>}
                            </Badge>
                            <span>·</span>
                            <span>{slackWorkspace.total_messages_sent} mensajes enviados</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Switch checked={slackWorkspace.enabled} onCheckedChange={toggleSlackWorkspace} />
                        <Button variant="outline" size="sm" onClick={disconnectSlack}>Desconectar</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Configuración de Notificaciones</CardTitle>
                    <CardDescription>Elige qué eventos enviar y a qué canal</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {SLACK_EVENT_TYPES.map((eventType) => {
                        const mapping = slackMappings.find(m => m.event_type === eventType.value);
                        return (
                          <div key={eventType.value} className="flex items-center gap-4 p-4 border rounded-lg">
                            <span className="text-2xl">{eventType.icon}</span>
                            <div className="flex-1">
                              <p className="font-medium">{eventType.label}</p>
                              <p className="text-sm text-muted-foreground">{eventType.value}</p>
                            </div>
                            <Select
                              value={mapping?.channel_id || ''}
                              onValueChange={(channelId) => {
                                const channel = slackChannels.find(c => c.channel_id === channelId);
                                if (channel) updateSlackMapping(eventType.value, channel.channel_id, channel.channel_name);
                              }}
                            >
                              <SelectTrigger className="w-48"><SelectValue placeholder="Seleccionar canal" /></SelectTrigger>
                              <SelectContent>
                                {slackChannels.map((channel) => (
                                  <SelectItem key={channel.id} value={channel.channel_id}>#{channel.channel_name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {mapping && <Switch checked={mapping.enabled} onCheckedChange={(enabled) => toggleSlackMapping(mapping.id, enabled)} />}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ZAPIER TAB */}
          <TabsContent value="zapier" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Conecta OPTIMUS-K con 5000+ apps a través de Zapier
              </p>
              <Dialog open={zapierDialogOpen} onOpenChange={setZapierDialogOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="w-4 h-4 mr-2" />Añadir Webhook</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Conectar con Zapier</DialogTitle>
                    <DialogDescription>Pega la URL del webhook de tu Zap</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>URL del Webhook</Label>
                      <Input placeholder="https://hooks.zapier.com/..." value={newZapierData.target_url} onChange={(e) => setNewZapierData(prev => ({ ...prev, target_url: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Evento</Label>
                      <Select value={newZapierData.event_type} onValueChange={(v) => setNewZapierData(prev => ({ ...prev, event_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ZAPIER_EVENT_TYPES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setZapierDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={createZapierSub} disabled={isCreatingZapier}>{isCreatingZapier ? 'Creando...' : 'Crear'}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid gap-4">
              {zapierSubs.map(sub => (
                <Card key={sub.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-orange-500" />
                          <span className="font-medium">{ZAPIER_EVENT_TYPES.find(e => e.value === sub.event_type)?.label || sub.event_type}</span>
                          <Badge variant={sub.is_active ? "default" : "secondary"} className={sub.is_active ? "bg-green-500" : ""}>{sub.is_active ? 'Activo' : 'Pausado'}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono truncate max-w-md">{sub.target_url}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => toggleZapierSub(sub.id, sub.is_active)}>{sub.is_active ? 'Pausar' : 'Activar'}</Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteZapierSub(sub.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {zapierSubs.length === 0 && (
                <Card><CardContent className="py-12 text-center"><Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No hay conexiones de Zapier. Crea una para empezar.</p></CardContent></Card>
              )}
            </div>
          </TabsContent>

          {/* OUTLOOK TAB */}
          <TabsContent value="outlook" className="space-y-4">
            {outlookLoading ? (
              <Card><CardContent className="py-12 text-center"><p>Cargando...</p></CardContent></Card>
            ) : !outlookAccount ? (
              <Card>
                <CardContent className="py-12 text-center space-y-6">
                  <Calendar className="w-16 h-16 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Conecta tu Outlook Calendar</h3>
                    <p className="text-muted-foreground mb-4">Sincroniza tus tareas con Microsoft Outlook</p>
                  </div>
                  <Button onClick={connectOutlook} disabled={connectingOutlook} size="lg">
                    <Calendar className="w-5 h-5 mr-2" />
                    {connectingOutlook ? 'Conectando...' : 'Conectar con Outlook'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-semibold">{outlookAccount.display_name || outlookAccount.email}</p>
                        <p className="text-sm text-muted-foreground">{outlookAccount.email}</p>
                        {outlookAccount.last_sync_at && <p className="text-xs text-muted-foreground">Última sync: {new Date(outlookAccount.last_sync_at).toLocaleString()}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button variant="outline" size="sm" onClick={syncOutlookNow} disabled={syncingOutlook}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${syncingOutlook ? 'animate-spin' : ''}`} />
                        {syncingOutlook ? 'Sincronizando...' : 'Sincronizar'}
                      </Button>
                      <Switch checked={outlookAccount.sync_enabled} onCheckedChange={toggleOutlookSync} />
                      <Button variant="outline" size="sm" onClick={disconnectOutlook}>Desconectar</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* HUBSPOT TAB */}
          <TabsContent value="hubspot" className="space-y-4">
            {hubspotLoading ? (
              <Card><CardContent className="py-12 text-center"><p>Cargando...</p></CardContent></Card>
            ) : !hubspotAccount ? (
              <Card>
                <CardContent className="py-12 text-center space-y-6">
                  <Link2 className="w-16 h-16 mx-auto text-orange-500" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Conecta tu HubSpot CRM</h3>
                    <p className="text-muted-foreground mb-4">Sincroniza leads bidireccional con HubSpot</p>
                  </div>
                  <Button onClick={connectHubspot} disabled={connectingHubspot} size="lg" className="bg-orange-500 hover:bg-orange-600">
                    <Link2 className="w-5 h-5 mr-2" />
                    {connectingHubspot ? 'Conectando...' : 'Conectar con HubSpot'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                          <Link2 className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                          <p className="font-semibold">{hubspotAccount.hub_domain}</p>
                          <p className="text-sm text-muted-foreground">Portal ID: {hubspotAccount.portal_id}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span>{hubspotAccount.total_contacts_synced} contactos</span>
                            <span>{hubspotAccount.total_deals_synced} deals</span>
                            {hubspotAccount.last_sync_at && <span>Última sync: {new Date(hubspotAccount.last_sync_at).toLocaleString()}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" onClick={syncHubspotNow} disabled={syncingHubspot}>
                          <RefreshCw className={`w-4 h-4 mr-2 ${syncingHubspot ? 'animate-spin' : ''}`} />
                          {syncingHubspot ? 'Sincronizando...' : 'Sincronizar'}
                        </Button>
                        <Switch checked={hubspotAccount.sync_enabled} onCheckedChange={toggleHubspotSync} />
                        <Button variant="outline" size="sm" onClick={disconnectHubspot}>Desconectar</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Configuración de Sincronización</CardTitle>
                    <CardDescription>Mapeo de campos entre OPTIMUS-K y HubSpot</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">Lead.name</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-sm text-muted-foreground">Contact.firstname + lastname</span>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">Lead.email</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-sm text-muted-foreground">Contact.email</span>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">Lead.company</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-sm text-muted-foreground">Contact.company</span>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">Lead.estimated_value</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-sm text-muted-foreground">Deal.amount</span>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">Lead.stage</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-sm text-muted-foreground">Deal.dealstage</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ACTIVITY TAB */}
          <TabsContent value="activity" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Historial de entregas de webhooks recientes
            </p>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {deliveries.map((delivery) => (
                    <div key={delivery.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        {delivery.status === 'delivered' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : delivery.status === 'failed' ? (
                          <XCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-500" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{delivery.event_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(delivery.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {delivery.http_status_code && (
                          <Badge variant={delivery.http_status_code < 400 ? 'default' : 'destructive'}>
                            {delivery.http_status_code}
                          </Badge>
                        )}
                        {delivery.response_time_ms && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {delivery.response_time_ms}ms
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {deliveries.length === 0 && (
                    <div className="py-12 text-center">
                      <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No hay actividad reciente
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
