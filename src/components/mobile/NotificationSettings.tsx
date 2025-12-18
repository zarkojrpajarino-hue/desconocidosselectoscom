import { useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff, BellRing, Loader2, AlertCircle, Settings, ExternalLink, Info, MousePointer } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function NotificationSettings() {
  const {
    permission,
    isSubscribed,
    isLoading,
    isSupported,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();
  
  const [testLoading, setTestLoading] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);

  const handleToggle = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe();
        toast({
          title: 'Notificaciones desactivadas',
          description: 'Ya no recibirás notificaciones push',
        });
      } else {
        const success = await subscribe();
        if (success) {
          toast({
            title: 'Notificaciones activadas',
            description: 'Recibirás notificaciones de tareas y alertas',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    }
  };

  const handleTestNotification = async () => {
    setTestLoading(true);
    try {
      await sendTestNotification();
      toast({
        title: 'Notificación enviada',
        description: 'Deberías ver la notificación en tu dispositivo',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo enviar la notificación',
        variant: 'destructive',
      });
    } finally {
      setTestLoading(false);
    }
  };

  // Directly request browser permission
  const requestBrowserPermission = async () => {
    setRequestingPermission(true);
    try {
      if ('Notification' in window) {
        const result = await Notification.requestPermission();
        if (result === 'granted') {
          toast({
            title: '¡Permisos concedidos!',
            description: 'Ahora puedes activar las notificaciones push',
          });
          // Reload to update the component state
          window.location.reload();
        } else if (result === 'denied') {
          toast({
            title: 'Permisos denegados',
            description: 'Debes habilitar los permisos manualmente en la configuración del navegador',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo solicitar permisos',
        variant: 'destructive',
      });
    } finally {
      setRequestingPermission(false);
    }
  };

  const openBrowserSettings = () => {
    const isChrome = navigator.userAgent.indexOf('Chrome') > -1;
    const isFirefox = navigator.userAgent.indexOf('Firefox') > -1;
    const isSafari = navigator.userAgent.indexOf('Safari') > -1 && navigator.userAgent.indexOf('Chrome') === -1;
    const isEdge = navigator.userAgent.indexOf('Edg') > -1;

    // First try to request permission directly
    requestBrowserPermission();

    // Show browser-specific instructions
    let browserName = 'tu navegador';
    if (isChrome) browserName = 'Chrome';
    else if (isEdge) browserName = 'Edge';
    else if (isFirefox) browserName = 'Firefox';
    else if (isSafari) browserName = 'Safari';

    toast({
      title: `Configurar permisos en ${browserName}`,
      description: 'Haz clic en el icono de candado (🔒) en la barra de direcciones → Permisos del sitio → Notificaciones → Permitir',
      duration: 8000,
    });
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="w-5 h-5" />
            Notificaciones Push
          </CardTitle>
          <CardDescription>
            Tu navegador no soporta notificaciones push
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Para recibir notificaciones, utiliza un navegador moderno como Chrome, Firefox, Edge o Safari.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (permission === 'denied') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            Notificaciones Bloqueadas
          </CardTitle>
          <CardDescription>
            Has bloqueado las notificaciones para este sitio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">Las notificaciones están bloqueadas</p>
              <p className="text-muted-foreground">
                Para activarlas, necesitas cambiar los permisos en la configuración de tu navegador.
              </p>
            </div>
          </div>
          
          {/* Direct permission request button - tries to re-prompt */}
          <Button 
            onClick={requestBrowserPermission}
            disabled={requestingPermission}
            className="w-full gap-2"
          >
            {requestingPermission ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
            Solicitar permisos de notificación
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">o manualmente</span>
            </div>
          </div>

          {/* Visual guide */}
          <div className="p-4 bg-muted/30 rounded-lg border border-dashed space-y-3">
            <p className="font-medium text-sm flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-primary" />
              Habilitar desde el navegador:
            </p>
            <div className="flex items-center gap-3 p-2 bg-background rounded border">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-lg">🔒</span>
                <span className="text-muted-foreground">←</span>
                <span>Haz clic aquí en la barra de direcciones</span>
              </div>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Haz clic en el icono de <strong>candado</strong> o <strong>información</strong></li>
              <li>Busca <strong>"Permisos del sitio"</strong> o <strong>"Configuración"</strong></li>
              <li>Encuentra <strong>"Notificaciones"</strong></li>
              <li>Cambia a <strong>"Permitir"</strong></li>
              <li><strong>Recarga la página</strong></li>
            </ol>
          </div>
          
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            className="w-full gap-2"
          >
            Recargar página después de permitir
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notificaciones Push
        </CardTitle>
        <CardDescription>
          Recibe alertas de tareas, métricas y actualizaciones importantes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* How it works */}
        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-dashed">
          <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">¿Qué recibirás?</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Alertas urgentes de métricas críticas</li>
              <li>Recordatorios de tareas pendientes</li>
              <li>Notificaciones de logros y badges</li>
              <li>Actualizaciones importantes del equipo</li>
            </ul>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Activar notificaciones</p>
            <p className="text-xs text-muted-foreground">
              {isSubscribed ? 'Recibirás notificaciones en este dispositivo' : 'Las notificaciones están desactivadas'}
            </p>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={handleToggle}
            disabled={isLoading}
          />
        </div>

        {/* Status indicator */}
        {isSubscribed && (
          <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
            <BellRing className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-600 dark:text-green-400">
              Las notificaciones push están activas
            </span>
          </div>
        )}

        {/* Test notification button */}
        {isSubscribed && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestNotification}
            disabled={testLoading}
            className="w-full gap-2"
          >
            {testLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <BellRing className="w-4 h-4" />
            )}
            Enviar notificación de prueba
          </Button>
        )}

        {/* Browser settings button (always visible when not denied) */}
        <Button 
          onClick={openBrowserSettings}
          variant="ghost"
          size="sm"
          className="w-full gap-2 text-muted-foreground hover:text-foreground"
        >
          <Settings className="w-4 h-4" />
          Configuración del navegador
          <ExternalLink className="w-3 h-3" />
        </Button>
      </CardContent>
    </Card>
  );
}
