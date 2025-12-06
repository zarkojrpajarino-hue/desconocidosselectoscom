import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Calendar, RefreshCw } from 'lucide-react';
import { useOutlookIntegration } from '@/hooks/integrations';

export function OutlookTab() {
  const { 
    account, 
    loading, 
    connecting,
    syncing,
    connect,
    disconnect,
    toggleSync,
    syncNow
  } = useOutlookIntegration();

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!account) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-6">
          <Calendar className="w-16 h-16 mx-auto text-muted-foreground" />
          <div>
            <h3 className="text-xl font-semibold mb-2">Conecta tu Outlook Calendar</h3>
            <p className="text-muted-foreground mb-4">Sincroniza tus tareas con Microsoft Outlook</p>
          </div>
          <Button onClick={connect} disabled={connecting} size="lg">
            <Calendar className="w-5 h-5 mr-2" />
            {connecting ? 'Conectando...' : 'Conectar con Outlook'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="font-semibold">{account.display_name || account.email}</p>
              <p className="text-sm text-muted-foreground">{account.email}</p>
              {account.last_sync_at && (
                <p className="text-xs text-muted-foreground">
                  Última sync: {new Date(account.last_sync_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={syncNow} disabled={syncing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
            <Switch checked={account.sync_enabled} onCheckedChange={toggleSync} />
            <Button variant="outline" size="sm" onClick={disconnect}>
              Desconectar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
