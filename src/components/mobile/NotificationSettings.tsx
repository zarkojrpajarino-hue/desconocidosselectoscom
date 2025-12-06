import { useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff, BellRing, Loader2, AlertCircle } from 'lucide-react';
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
            Has bloqueado las notificaciones. Para activarlas, ve a la configuración de tu navegador.
          </CardDescription>
        </CardHeader>
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
        {/* Toggle */}
        <div className="flex items-center justify-between">
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
      </CardContent>
    </Card>
  );
}
