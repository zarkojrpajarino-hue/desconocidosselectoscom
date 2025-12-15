import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, Check, MessageSquare, Link2, Calendar, 
  ListTodo, LayoutDashboard, Zap, RefreshCw, ExternalLink,
  CheckCircle, XCircle, Settings, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useSlackIntegration, useHubSpotIntegration, useIntegrationTokens } from "@/hooks/integrations";

interface IntegrationStatus {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  isConnected: boolean;
  loading: boolean;
  lastSync?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync?: () => void;
  syncEnabled?: boolean;
  onToggleSync?: (enabled: boolean) => void;
}

const IntegracionesDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, currentOrganizationId } = useAuth();
  const organizationId = currentOrganizationId;
  
  // Hooks de integración
  const slackIntegration = useSlackIntegration(organizationId);
  const hubspotIntegration = useHubSpotIntegration(organizationId);
  const { integrations: tokenIntegrations, isLoading: tokensLoading, isConnected: isTokenConnected } = useIntegrationTokens();
  
  // Estado de Google Calendar
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [googleCalendarLoading, setGoogleCalendarLoading] = useState(true);

  // Verificar conexión de Google Calendar
  useEffect(() => {
    const checkGoogleCalendar = async () => {
      if (!user?.id) return;
      setGoogleCalendarLoading(true);
      try {
        const { data, error } = await supabase
          .from('google_calendar_tokens')
          .select('is_active, token_expiry')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data?.is_active) {
          const expiry = new Date(data.token_expiry);
          setGoogleCalendarConnected(expiry > new Date());
        } else {
          setGoogleCalendarConnected(false);
        }
      } catch {
        setGoogleCalendarConnected(false);
      } finally {
        setGoogleCalendarLoading(false);
      }
    };
    
    checkGoogleCalendar();
  }, [user?.id]);

  const handleGoogleCalendarConnect = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('google-auth-url', {
        body: { user_id: user?.id },
      });
      if (error) throw error;
      window.location.href = data.auth_url;
    } catch (error) {
      toast.error('Error al conectar con Google Calendar');
    }
  };

  const handleGoogleCalendarDisconnect = async () => {
    try {
      await supabase
        .from('google_calendar_tokens')
        .delete()
        .eq('user_id', user?.id);
      setGoogleCalendarConnected(false);
      toast.success('Google Calendar desconectado');
    } catch {
      toast.error('Error al desconectar');
    }
  };

  // Check if integration is connected from tokens
  const checkTokenConnected = (type: 'google_calendar' | 'slack' | 'outlook' | 'hubspot' | 'asana' | 'trello') => {
    return isTokenConnected?.(type) || false;
  };

  const integrationsList: IntegrationStatus[] = [
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      icon: <Calendar className="h-6 w-6" />,
      description: t('integrations.items.googleCalendar.description', 'Sincroniza tareas con tu calendario'),
      isConnected: googleCalendarConnected,
      loading: googleCalendarLoading,
      onConnect: handleGoogleCalendarConnect,
      onDisconnect: handleGoogleCalendarDisconnect,
    },
    {
      id: 'slack',
      name: 'Slack',
      icon: <MessageSquare className="h-6 w-6" />,
      description: t('integrations.items.slack.description', 'Notificaciones en tiempo real'),
      isConnected: !!slackIntegration.workspace,
      loading: slackIntegration.loading,
      lastSync: slackIntegration.workspace?.created_at,
      syncEnabled: slackIntegration.workspace?.enabled,
      onConnect: slackIntegration.connect,
      onDisconnect: slackIntegration.disconnect,
      onToggleSync: slackIntegration.toggleWorkspace,
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      icon: <Link2 className="h-6 w-6" />,
      description: t('integrations.items.hubspot.description', 'Sincroniza leads con tu CRM'),
      isConnected: !!hubspotIntegration.account,
      loading: hubspotIntegration.loading,
      lastSync: hubspotIntegration.account?.last_sync_at || undefined,
      syncEnabled: hubspotIntegration.account?.sync_enabled,
      onConnect: hubspotIntegration.connect,
      onDisconnect: hubspotIntegration.disconnect,
      onSync: hubspotIntegration.syncNow,
      onToggleSync: hubspotIntegration.toggleSync,
    },
    {
      id: 'outlook',
      name: 'Outlook Calendar',
      icon: <Calendar className="h-6 w-6" />,
      description: t('integrations.items.outlook.description', 'Sincroniza con Microsoft 365'),
      isConnected: checkTokenConnected('outlook'),
      loading: tokensLoading,
      onConnect: () => toast.info('Configurar Outlook en Ajustes > Integraciones'),
      onDisconnect: () => {},
    },
    {
      id: 'asana',
      name: 'Asana',
      icon: <ListTodo className="h-6 w-6" />,
      description: t('integrations.items.asana.description', 'Exporta tareas a Asana'),
      isConnected: checkTokenConnected('asana'),
      loading: tokensLoading,
      onConnect: () => toast.info('Configurar Asana en Ajustes > Integraciones'),
      onDisconnect: () => {},
    },
    {
      id: 'trello',
      name: 'Trello',
      icon: <LayoutDashboard className="h-6 w-6" />,
      description: t('integrations.items.trello.description', 'Exporta tareas como tarjetas'),
      isConnected: checkTokenConnected('trello'),
      loading: tokensLoading,
      onConnect: () => toast.info('Configurar Trello en Ajustes > Integraciones'),
      onDisconnect: () => {},
    },
    {
      id: 'zapier',
      name: 'Zapier',
      icon: <Zap className="h-6 w-6" />,
      description: t('integrations.items.zapier.description', 'Conecta con +5000 apps'),
      isConnected: false, // Zapier uses API keys, not tokens
      loading: false,
      onConnect: () => toast.info('Configurar Zapier en Ajustes > API Keys'),
      onDisconnect: () => {},
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            {t('integrations.title', 'Integraciones')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('integrations.dashboardDescription', 'Conecta y gestiona tus herramientas favoritas')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/settings/integrations')}>
          <Settings className="h-4 w-4 mr-2" />
          {t('common.settings', 'Ajustes')}
        </Button>
      </div>

      {/* Resumen de estado */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-success/10 border-success/20">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-success" />
            <div>
              <p className="text-2xl font-bold text-foreground">
                {integrationsList.filter(i => i.isConnected).length}
              </p>
              <p className="text-xs text-muted-foreground">{t('integrations.connected', 'Conectadas')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/50 border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold text-foreground">
                {integrationsList.filter(i => !i.isConnected).length}
              </p>
              <p className="text-xs text-muted-foreground">{t('integrations.available', 'Disponibles')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Zap className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">7</p>
              <p className="text-xs text-muted-foreground">{t('integrations.total', 'Total')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-warning/10 border-warning/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-warning" />
            <div>
              <p className="text-2xl font-bold text-foreground">
                {integrationsList.filter(i => i.syncEnabled === false && i.isConnected).length}
              </p>
              <p className="text-xs text-muted-foreground">{t('integrations.syncPaused', 'Sync pausada')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de integraciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrationsList.map((integration) => (
          <Card key={integration.id} className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${integration.isConnected ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                    {integration.icon}
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      {integration.name}
                      {integration.isConnected && (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          {t('integrations.active', 'Activa')}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm mt-0.5">
                      {integration.description}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {integration.loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-9 w-24" />
                </div>
              ) : integration.isConnected ? (
                <div className="space-y-3">
                  {/* Info de última sincronización */}
                  {integration.lastSync && (
                    <p className="text-xs text-muted-foreground">
                      {t('integrations.lastSync', 'Última sync')}: {new Date(integration.lastSync).toLocaleString()}
                    </p>
                  )}
                  
                  {/* Controles */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {integration.onSync && (
                        <Button variant="outline" size="sm" onClick={integration.onSync}>
                          <RefreshCw className="h-4 w-4 mr-1.5" />
                          {t('integrations.sync', 'Sincronizar')}
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={integration.onDisconnect} className="text-destructive hover:text-destructive">
                        {t('integrations.disconnect', 'Desconectar')}
                      </Button>
                    </div>
                    
                    {integration.onToggleSync !== undefined && integration.syncEnabled !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {t('integrations.autoSync', 'Auto-sync')}
                        </span>
                        <Switch 
                          checked={integration.syncEnabled} 
                          onCheckedChange={integration.onToggleSync}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Button onClick={integration.onConnect} className="w-full sm:w-auto">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('integrations.connect', 'Conectar')}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enlace a más información */}
      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <p className="font-medium text-foreground">
              {t('integrations.needMore', '¿Necesitas más integraciones?')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('integrations.suggestNew', 'Sugiérenos qué herramientas te gustaría conectar')}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/integraciones#suggest')}>
            {t('integrations.suggestButton', 'Sugerir integración')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegracionesDashboard;
