import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar, Check, X, RefreshCw, Lock, Sparkles, Download, Upload, ArrowLeftRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { UpgradeModal } from '@/components/UpgradeModal';
import { IntegrationStatusBadge, IntegrationSyncLog } from '@/components/integrations';
import { useGoogleCalendarSync } from '@/hooks/integrations/useGoogleCalendarSync';

interface GoogleCalendarTabProps {
  userId: string;
  organizationId: string | null;
}

export function GoogleCalendarTab({ userId, organizationId }: GoogleCalendarTabProps) {
  const { hasFeature, plan } = useSubscriptionLimits();
  const { 
    syncedEvents, 
    isLoading, 
    syncTask, 
    syncAll,
    importEvents,
    syncing,
    importing 
  } = useGoogleCalendarSync();
  
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [syncDirection, setSyncDirection] = useState<'export' | 'import' | 'bidirectional'>('export');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const hasCalendarAccess = hasFeature('google_calendar');

  useEffect(() => {
    checkConnection();
  }, [userId]);

  const checkConnection = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('google_calendar_tokens')
        .select('is_active, token_expiry, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data && data.is_active) {
        const expiry = new Date(data.token_expiry);
        const now = new Date();
        setIsConnected(expiry > now);
        if (data.updated_at) {
          setLastSync(new Date(data.updated_at));
        }
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error checking calendar connection:', error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!hasCalendarAccess) {
      setShowUpgradeModal(true);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('google-auth-url', {
        body: { user_id: userId },
      });

      if (error) throw error;
      window.location.href = data.auth_url;
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      toast.error('Error al conectar con Google Calendar');
    }
  };

  const handleDisconnect = async () => {
    try {
      const { error } = await supabase
        .from('google_calendar_tokens')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) throw error;

      setIsConnected(false);
      toast.success('Google Calendar desconectado');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Error al desconectar');
    }
  };

  const handleSync = async () => {
    if (syncDirection === 'export') {
      syncAll.mutate();
    } else if (syncDirection === 'import') {
      importEvents.mutate();
    } else {
      // Bidirectional: export first, then import
      syncAll.mutate(undefined, {
        onSuccess: () => {
          importEvents.mutate();
        }
      });
    }
    setLastSync(new Date());
  };

  const getConnectionStatus = () => {
    if (loading) return 'pending';
    if (!isConnected) return 'disconnected';
    if (syncing || importing) return 'syncing';
    return 'active';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">Verificando conexión...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Google Calendar
                </CardTitle>
                <CardDescription>
                  Sincroniza tu agenda con Google Calendar
                </CardDescription>
              </div>
              <IntegrationStatusBadge status={getConnectionStatus()} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!hasCalendarAccess ? (
              <>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">Funcionalidad Premium</p>
                      <p className="text-muted-foreground">
                        La integración con Google Calendar está disponible en Professional+
                      </p>
                    </div>
                  </div>
                </div>

                <Button onClick={() => setShowUpgradeModal(true)} className="w-full gap-2">
                  <Sparkles className="w-4 h-4" />
                  Mejorar Plan para Conectar
                </Button>
              </>
            ) : isConnected ? (
              <>
                {/* Sync Direction Control */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Dirección de sincronización</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={syncDirection === 'export' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSyncDirection('export')}
                      className="flex-1"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                    <Button
                      variant={syncDirection === 'import' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSyncDirection('import')}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Importar
                    </Button>
                    <Button
                      variant={syncDirection === 'bidirectional' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSyncDirection('bidirectional')}
                      className="flex-1"
                    >
                      <ArrowLeftRight className="w-4 h-4 mr-2" />
                      Bidireccional
                    </Button>
                  </div>
                </div>

                {/* Auto Sync Toggle */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <Label className="font-medium">Auto-sincronización</Label>
                    <p className="text-sm text-muted-foreground">
                      Sincronizar automáticamente cada hora
                    </p>
                  </div>
                  <Switch
                    checked={autoSync}
                    onCheckedChange={setAutoSync}
                  />
                </div>

                {/* Sync Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold">{syncedEvents?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Eventos sincronizados</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold">
                      {lastSync ? lastSync.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '-'}
                    </p>
                    <p className="text-sm text-muted-foreground">Última sincronización</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleSync}
                    disabled={syncing || importing}
                    className="flex-1"
                  >
                    {syncing || importing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sincronizar Ahora
                      </>
                    )}
                  </Button>

                  <Button onClick={handleDisconnect} variant="outline">
                    Desconectar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">Al conectar Google Calendar podrás:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                    <li>Ver tus tareas en tu calendario de Google</li>
                    <li>Recibir notificaciones en tu móvil</li>
                    <li>Sincronización automática en tiempo real</li>
                    <li>Importar eventos existentes como tareas</li>
                  </ul>
                </div>

                <Button onClick={handleConnect} className="w-full h-12">
                  <Calendar className="w-5 h-5 mr-2" />
                  Conectar con Google Calendar
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sync History */}
        {isConnected && organizationId && (
          <IntegrationSyncLog 
            integrationTable="external_task_mappings"
            organizationId={organizationId}
            title="Historial de Sincronización - Google Calendar"
            maxItems={10}
          />
        )}
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentPlan={plan}
        limitType="feature"
        featureName="Google Calendar"
      />
    </>
  );
}
