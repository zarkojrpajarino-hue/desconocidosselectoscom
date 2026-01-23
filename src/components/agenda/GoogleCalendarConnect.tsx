import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Check, X, RefreshCw, AlertCircle, Lock, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { UpgradeModal } from '@/components/UpgradeModal';

interface GoogleCalendarConnectProps {
  userId: string;
}

const GoogleCalendarConnect = ({ userId }: GoogleCalendarConnectProps) => {
  const { hasFeature, plan } = useSubscriptionLimits();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const hasCalendarAccess = hasFeature('google_calendar');

  useEffect(() => {
    checkConnection();
  }, [userId]);

  const checkConnection = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('google_calendar_tokens')
        .select('is_active, token_expiry')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data && data.is_active) {
        // Verificar si el token no ha expirado
        const expiry = new Date(data.token_expiry);
        const now = new Date();
        setIsConnected(expiry > now);
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
    // Verificar si tiene acceso a la feature
    if (!hasCalendarAccess) {
      setShowUpgradeModal(true);
      return;
    }

    try {
      // Llamar a edge function que inicia el flujo OAuth
      const { data, error } = await supabase.functions.invoke('google-auth-url', {
        body: { user_id: userId },
      });

      if (error) throw error;

      // Redirigir al usuario a la URL de autorización de Google
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

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const { error } = await supabase.functions.invoke('sync-calendar-events', {
        body: { user_id: userId },
      });

      if (error) throw error;

      toast.success('✅ Agenda sincronizada con Google Calendar');
    } catch (error) {
      console.error('Error syncing calendar:', error);
      toast.error('Error al sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Google Calendar
              </CardTitle>
              <CardDescription>
                Sincroniza tu agenda con Google Calendar para recibir notificaciones
              </CardDescription>
            </div>
            {!hasCalendarAccess ? (
              <Badge variant="secondary" className="gap-1">
                <Lock className="w-3 h-3" />
                Professional+
              </Badge>
            ) : isConnected ? (
              <Badge className="bg-success text-success-foreground">
                <Check className="w-3 h-3 mr-1" />
                Conectado
              </Badge>
            ) : (
              <Badge variant="outline">
                <X className="w-3 h-3 mr-1" />
                No conectado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasCalendarAccess ? (
            <>
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div className="text-sm text-amber-900 dark:text-amber-100">
                    <p className="font-medium mb-1">🔒 Funcionalidad Premium</p>
                    <p>
                      La integración con Google Calendar está disponible en los planes Professional y Enterprise.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setShowUpgradeModal(true)}
                className="w-full gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Mejorar Plan para Conectar
              </Button>
            </>
          ) : isConnected ? (
            <>
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div className="text-sm text-blue-900 dark:text-blue-100">
                    <p className="font-medium mb-1">✅ Sincronización activa</p>
                    <p>
                      Tus tareas programadas se sincronizan automáticamente con tu Google Calendar.
                      Recibirás notificaciones en tu móvil antes de cada tarea.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSyncNow}
                  disabled={syncing}
                  className="flex-1 bg-gradient-primary"
                >
                  {syncing ? (
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

                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  className="flex-1"
                >
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
                  <li>Recordatorios 30 minutos antes de cada tarea</li>
                </ul>
              </div>

              <Button
                onClick={handleConnect}
                className="w-full bg-gradient-primary h-12"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Conectar con Google Calendar
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentPlan={plan}
        limitType="feature"
        featureName="Google Calendar"
      />
    </>
  );
};

export default GoogleCalendarConnect;
