/**
 * Página de gestión de API Keys e integraciones
 * ✅ CORREGIDO: Usa currentOrganizationId del contexto directamente
 */

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Key, 
  Webhook,
  Activity,
  MessageSquare,
  Zap,
  Calendar,
  Link2,
  ListTodo,
  LayoutDashboard
} from 'lucide-react';
import { toast } from 'sonner';

import { 
  ApiKeysTab, 
  WebhooksTab, 
  SlackTab, 
  ZapierTab, 
  OutlookTab, 
  HubSpotTab, 
  AsanaTab, 
  TrelloTab, 
  ActivityTab 
} from './tabs';
import { useWebhooks } from '@/hooks/integrations';

export default function ApiKeysPage() {
  // ✅ CORREGIDO: Obtener currentOrganizationId del contexto
  const { user, currentOrganizationId } = useAuth();
  
  // Get deliveries for activity tab
  const { deliveries } = useWebhooks(currentOrganizationId);

  // Handle OAuth callbacks
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const slackStatus = urlParams.get('slack');
    const outlookStatus = urlParams.get('outlook');
    const hubspotStatus = urlParams.get('hubspot');
    
    if (slackStatus === 'connected') {
      toast.success('¡Slack conectado correctamente!');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (slackStatus === 'error') {
      toast.error('Error al conectar Slack: ' + (urlParams.get('message') || 'desconocido'));
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (outlookStatus === 'connected') {
      toast.success('¡Outlook Calendar conectado correctamente!');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (outlookStatus === 'error') {
      toast.error('Error al conectar Outlook: ' + (urlParams.get('message') || 'desconocido'));
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (hubspotStatus === 'connected') {
      toast.success('¡HubSpot CRM conectado correctamente!');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (hubspotStatus === 'error') {
      toast.error('Error al conectar HubSpot: ' + (urlParams.get('message') || 'desconocido'));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-xl md:text-3xl font-bold">API & Integraciones</h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Gestiona API Keys y Webhooks para integrar OPTIMUS-K
        </p>
      </div>

      <Tabs defaultValue="api-keys" className="space-y-4">
        <TabsList className="flex overflow-x-auto pb-1 md:pb-0 -mx-3 px-3 md:mx-0 md:px-0 md:flex-wrap gap-1">
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
          <TabsTrigger value="asana" className="flex items-center gap-2">
            <ListTodo className="w-4 h-4" />
            Asana
          </TabsTrigger>
          <TabsTrigger value="trello" className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Trello
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Actividad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys">
          <ApiKeysTab organizationId={currentOrganizationId} />
        </TabsContent>

        <TabsContent value="webhooks">
          <WebhooksTab organizationId={currentOrganizationId} />
        </TabsContent>

        <TabsContent value="slack">
          <SlackTab organizationId={currentOrganizationId} />
        </TabsContent>

        <TabsContent value="zapier">
          <ZapierTab organizationId={currentOrganizationId} />
        </TabsContent>

        <TabsContent value="outlook">
          <OutlookTab />
        </TabsContent>

        <TabsContent value="hubspot">
          <HubSpotTab organizationId={currentOrganizationId} />
        </TabsContent>

        <TabsContent value="asana">
          <AsanaTab organizationId={currentOrganizationId} />
        </TabsContent>

        <TabsContent value="trello">
          <TrelloTab organizationId={currentOrganizationId} />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityTab deliveries={deliveries} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
