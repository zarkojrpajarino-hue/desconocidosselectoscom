/**
 * DASHBOARD DE INTEGRACIONES - Gestión funcional
 * Requiere autenticación - botones de conectar/desconectar
 */

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Check, MessageSquare, Link2, Calendar, 
  ListTodo, LayoutDashboard, Zap, RefreshCw, ExternalLink,
  CheckCircle, XCircle, Settings, AlertCircle, Activity, History
} from "lucide-react";
import { toast } from "sonner";
import { useSlackIntegration, useHubSpotIntegration, useIntegrationTokens } from "@/hooks/integrations";
import { IntegrationHealthMetrics, UnifiedSyncLog, QuickActionsPanel } from "@/components/integrations";

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
  const { user, currentOrganizationId, loading: authLoading } = useAuth();
  const organizationId = currentOrganizationId;
  
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [googleCalendarLoading, setGoogleCalendarLoading] = useState(true);
  
  const slackIntegration = useSlackIntegration(organizationId);
  const hubspotIntegration = useHubSpotIntegration(organizationId);
  const { isLoading: tokensLoading, isConnected: isTokenConnected } = useIntegrationTokens();

  useEffect(() => {
    const checkGoogleCalendar = async () => {
      if (!user?.id) {
        setGoogleCalendarLoading(false);
        return;
      }
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

  // Loading state
  if (authLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6 pb-24 md:pb-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  // Sin usuario/organización
  if (!user || !organizationId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <Zap className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Inicia sesión para gestionar integraciones</h2>
        <p className="text-muted-foreground mb-4">Necesitas estar autenticado para conectar tus herramientas</p>
        <Button onClick={() => navigate('/')}>Ir al inicio</Button>
      </div>
    );
  }

  const handleGoogleCalendarConnect = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('google-auth-url', {
        body: { user_id: user?.id },
      });
      if (error) throw error;
      window.location.href = data.auth_url;
    } catch {
      toast.error('Error al conectar con Google Calendar');
    }
  };

  const handleGoogleCalendarDisconnect = async () => {
    try {
      await supabase.from('google_calendar_tokens').delete().eq('user_id', user?.id);
      setGoogleCalendarConnected(false);
      toast.success('Google Calendar desconectado');
    } catch {
      toast.error('Error al desconectar');
    }
  };

  const checkTokenConnected = (type: 'google_calendar' | 'slack' | 'outlook' | 'hubspot' | 'asana' | 'trello') => {
    return isTokenConnected?.(type) || false;
  };

  const integrationsList: IntegrationStatus[] = [
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      icon: <Calendar className="h-6 w-6" />,
      description: 'Sincroniza tareas con tu calendario',
      isConnected: googleCalendarConnected,
      loading: googleCalendarLoading,
      onConnect: handleGoogleCalendarConnect,
      onDisconnect: handleGoogleCalendarDisconnect,
    },
    {
      id: 'slack',
      name: 'Slack',
      icon: <MessageSquare className="h-6 w-6" />,
      description: 'Notificaciones en tiempo real',
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
      description: 'Sincroniza leads con tu CRM',
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
      description: 'Sincroniza con Microsoft 365',
      isConnected: checkTokenConnected('outlook'),
      loading: tokensLoading,
      onConnect: () => toast.info('Configurar Outlook en Ajustes > Integraciones'),
      onDisconnect: () => {},
    },
    {
      id: 'asana',
      name: 'Asana',
      icon: <ListTodo className="h-6 w-6" />,
      description: 'Exporta tareas a Asana',
      isConnected: checkTokenConnected('asana'),
      loading: tokensLoading,
      onConnect: () => toast.info('Configurar Asana en Ajustes > Integraciones'),
      onDisconnect: () => {},
    },
    {
      id: 'trello',
      name: 'Trello',
      icon: <LayoutDashboard className="h-6 w-6" />,
      description: 'Exporta tareas como tarjetas',
      isConnected: checkTokenConnected('trello'),
      loading: tokensLoading,
      onConnect: () => toast.info('Configurar Trello en Ajustes > Integraciones'),
      onDisconnect: () => {},
    },
    {
      id: 'zapier',
      name: 'Zapier',
      icon: <Zap className="h-6 w-6" />,
      description: 'Conecta con +5000 apps',
      isConnected: false,
      loading: false,
      onConnect: () => toast.info('Configurar Zapier en Ajustes > API Keys'),
      onDisconnect: () => {},
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6 pb-24 md:pb-6">
      {/* Header con botón volver */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              {t('integrations.title', 'Integraciones')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Conecta y gestiona tus herramientas
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/settings/integrations')}>
          <Settings className="h-4 w-4 mr-2" />
          Ajustes
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-success/10 border-success/20">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-success" />
            <div>
              <p className="text-2xl font-bold text-foreground">
                {integrationsList.filter(i => i.isConnected).length}
              </p>
              <p className="text-xs text-muted-foreground">Conectadas</p>
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
              <p className="text-xs text-muted-foreground">Disponibles</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Zap className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">7</p>
              <p className="text-xs text-muted-foreground">Total</p>
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
              <p className="text-xs text-muted-foreground">Sync pausada</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-10">
          <TabsTrigger value="connections" className="text-xs md:text-sm">
            <Link2 className="h-4 w-4 mr-1.5 hidden md:inline" />
            Conexiones
          </TabsTrigger>
          <TabsTrigger value="health" className="text-xs md:text-sm">
            <Activity className="h-4 w-4 mr-1.5 hidden md:inline" />
            Salud
          </TabsTrigger>
          <TabsTrigger value="logs" className="text-xs md:text-sm">
            <History className="h-4 w-4 mr-1.5 hidden md:inline" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="actions" className="text-xs md:text-sm">
            <Zap className="h-4 w-4 mr-1.5 hidden md:inline" />
            Acciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
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
                              Activa
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
                      {integration.lastSync && (
                        <p className="text-xs text-muted-foreground">
                          Última sync: {new Date(integration.lastSync).toLocaleString()}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          {integration.onSync && (
                            <Button variant="outline" size="sm" onClick={integration.onSync}>
                              <RefreshCw className="h-4 w-4 mr-1.5" />
                              Sincronizar
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={integration.onDisconnect} className="text-destructive hover:text-destructive">
                            Desconectar
                          </Button>
                        </div>
                        {integration.onToggleSync !== undefined && integration.syncEnabled !== undefined && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Auto-sync</span>
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
                      Conectar
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="health">
          <IntegrationHealthMetrics />
        </TabsContent>

        <TabsContent value="logs">
          <UnifiedSyncLog />
        </TabsContent>

        <TabsContent value="actions">
          <QuickActionsPanel />
        </TabsContent>
      </Tabs>

      {/* Info link */}
      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <p className="font-medium text-foreground">¿Quieres ver más detalles?</p>
            <p className="text-sm text-muted-foreground">Consulta el catálogo completo de integraciones</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/integraciones')}>
            Ver catálogo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegracionesDashboard;
