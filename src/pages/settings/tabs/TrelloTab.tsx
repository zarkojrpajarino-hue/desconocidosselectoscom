import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { LayoutDashboard, ArrowDownLeft } from 'lucide-react';
import { useTrelloIntegration } from '@/hooks/integrations';
import { IntegrationStatusBadge, IntegrationSyncLog } from '@/components/integrations';
import type { SyncStatus } from '@/components/integrations/IntegrationStatusBadge';

interface TrelloTabProps {
  organizationId: string | null;
}

export function TrelloTab({ organizationId }: TrelloTabProps) {
  const { 
    account, 
    loading, 
    saving,
    syncing,
    importing,
    connect,
    disconnect,
    toggleSync,
    importCards
  } = useTrelloIntegration(organizationId);
  
  const [credentials, setCredentials] = useState({ apiKey: '', apiToken: '' });

  const handleConnect = async () => {
    const result = await connect(credentials.apiKey, credentials.apiToken);
    if (result) {
      setCredentials({ apiKey: '', apiToken: '' });
    }
  };

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
        <CardContent className="py-12 space-y-6">
          <div className="text-center">
            <LayoutDashboard className="w-16 h-16 mx-auto text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Conecta con Trello</h3>
            <p className="text-muted-foreground mb-6">Sincroniza tus tareas con tableros de Trello</p>
          </div>
          <div className="max-w-md mx-auto space-y-4">
            <div>
              <Label>API Key</Label>
              <Input
                placeholder="Tu API Key de Trello"
                value={credentials.apiKey}
                onChange={(e) => setCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
              />
            </div>
            <div>
              <Label>Token</Label>
              <Input
                type="password"
                placeholder="Tu Token de Trello"
                value={credentials.apiToken}
                onChange={(e) => setCredentials(prev => ({ ...prev, apiToken: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Obtén tus credenciales en: trello.com/power-ups/admin
              </p>
            </div>
            <Button 
              onClick={handleConnect} 
              disabled={saving} 
              className="w-full bg-blue-400 hover:bg-blue-500"
            >
              <LayoutDashboard className="w-5 h-5 mr-2" />
              {saving ? 'Conectando...' : 'Conectar con Trello'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStatus: SyncStatus = syncing || importing 
    ? 'syncing' 
    : (account.last_sync_status as SyncStatus) || 'active';

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-400/10 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{account.board_name || 'Trello Board'}</p>
                  <IntegrationStatusBadge 
                    status={currentStatus} 
                    lastSync={account.last_sync_at}
                    showTime
                    size="sm"
                  />
                </div>
                {account.board_id && (
                  <p className="text-sm text-muted-foreground">Board ID: {account.board_id}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={account.sync_enabled} onCheckedChange={toggleSync} />
              <Button variant="outline" size="sm" onClick={disconnect}>
                Desconectar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Importar Tarjetas</CardTitle>
          <CardDescription>Trae tarjetas desde Trello a OPTIMUS-K</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Importa las tarjetas de tu tablero de Trello. Las tareas existentes se actualizarán si hay cambios.
            </p>
            <Button 
              onClick={() => importCards()} 
              disabled={importing}
              className="w-full"
            >
              <ArrowDownLeft className={`w-4 h-4 mr-2 ${importing ? 'animate-pulse' : ''}`} />
              {importing ? 'Importando...' : 'Importar desde Trello'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync Log */}
      {organizationId && (
        <IntegrationSyncLog
          integrationTable="external_task_mappings"
          organizationId={organizationId}
          title="Historial de Sincronización"
        />
      )}
    </div>
  );
}
