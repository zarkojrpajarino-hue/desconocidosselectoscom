import { useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff, BellRing, Loader2, AlertCircle, Settings, ExternalLink, Info } from 'lucide-react';
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

  const openBrowserSettings = () => {
    // Different browsers have different ways to open settings
    // This provides helpful instructions based on the browser
    const isChrome = navigator.userAgent.indexOf('Chrome') > -1;
    const isFirefox = navigator.userAgent.indexOf('Firefox') > -1;
    const isSafari = navigator.userAgent.indexOf('Safari') > -1 && navigator.userAgent.indexOf('Chrome') === -1;
    const isEdge = navigator.userAgent.indexOf('Edg') > -1;

    let instructions = '';
    let settingsUrl = '';

    if (isChrome || isEdge) {
      settingsUrl = 'chrome://settings/content/notifications';
      instructions = `Para Chrome/Edge:
1. Copia esta URL: chrome://settings/content/notifications
2. Pégala en una nueva pestaña
3. Busca este sitio y permite las notificaciones`;
    } else if (isFirefox) {
      settingsUrl = 'about:preferences#privacy';
      instructions = `Para Firefox:
1. Ve a Configuración > Privacidad y Seguridad
2. Busca "Permisos" > "Notificaciones"
3. Configura este sitio para permitir`;
    } else if (isSafari) {
      instructions = `Para Safari:
1. Ve a Safari > Preferencias > Sitios web
2. Selecciona "Notificaciones"
3. Permite las notificaciones para este sitio`;
    } else {
      instructions = `Instrucciones generales:
1. Ve a la configuración de tu navegador
2. Busca "Notificaciones" o "Permisos de sitios"
3. Permite las notificaciones para este sitio`;
    }

    toast({
      title: 'Configuración del navegador',
      description: instructions,
      duration: 10000,
    });

    // Try to open system notification settings on supported platforms
    if ('Notification' in window && 'requestPermission' in Notification) {
      // This will re-prompt on some browsers
      Notification.requestPermission();
    }
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
          
          <Button 
            onClick={openBrowserSettings}
            variant="outline"
            className="w-full gap-2"
          >
            <Settings className="w-4 h-4" />
            Abrir configuración del navegador
            <ExternalLink className="w-3 h-3" />
          </Button>
          
          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <p className="font-medium mb-2">Pasos para habilitar:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Haz clic en el icono de candado/info en la barra de direcciones</li>
              <li>Busca "Notificaciones" en los permisos del sitio</li>
              <li>Cambia de "Bloqueado" a "Permitir"</li>
              <li>Recarga la página</li>
            </ol>
          </div>
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
