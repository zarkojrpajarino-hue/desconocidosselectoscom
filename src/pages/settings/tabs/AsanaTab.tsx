import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ListTodo, ArrowDownLeft, RefreshCw } from 'lucide-react';
import { useAsanaIntegration } from '@/hooks/integrations';
import { IntegrationStatusBadge, IntegrationSyncLog } from '@/components/integrations';
import type { SyncStatus } from '@/components/integrations/IntegrationStatusBadge';

interface AsanaTabProps {
  organizationId: string | null;
}

export function AsanaTab({ organizationId }: AsanaTabProps) {
  const { 
    account, 
    loading, 
    saving,
    syncing,
    importing,
    connect,
    disconnect,
    toggleSync,
    importTasks
  } = useAsanaIntegration(organizationId);
  
  const [apiKey, setApiKey] = useState('');

  const handleConnect = async () => {
    const result = await connect(apiKey);
    if (result) {
      setApiKey('');
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
            <ListTodo className="w-16 h-16 mx-auto text-pink-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Conecta con Asana</h3>
            <p className="text-muted-foreground mb-6">Sincroniza tus tareas con Asana</p>
          </div>
          <div className="max-w-md mx-auto space-y-4">
            <div>
              <Label>Personal Access Token</Label>
              <Input
                type="password"
                placeholder="Pega tu token de Asana"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Obtén tu token en: app.asana.com → My Settings → Apps → Developer Apps
              </p>
            </div>
            <Button 
              onClick={handleConnect} 
              disabled={saving} 
              className="w-full bg-pink-500 hover:bg-pink-600"
            >
              <ListTodo className="w-5 h-5 mr-2" />
              {saving ? 'Conectando...' : 'Conectar con Asana'}
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
              <div className="w-12 h-12 bg-pink-500/10 rounded-lg flex items-center justify-center">
                <ListTodo className="w-6 h-6 text-pink-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{account.workspace_name || 'Asana Workspace'}</p>
                  <IntegrationStatusBadge 
                    status={currentStatus} 
                    lastSync={account.last_sync_at}
                    showTime
                    size="sm"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {account.project_name || `Workspace ID: ${account.workspace_id}`}
                </p>
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
          <CardTitle className="text-base">Importar Tareas</CardTitle>
          <CardDescription>Trae tareas desde Asana a OPTIMUS-K</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Importa las tareas de tu proyecto de Asana. Las tareas existentes se actualizarán si hay cambios.
            </p>
            <Button 
              onClick={() => importTasks()} 
              disabled={importing}
              className="w-full"
            >
              <ArrowDownLeft className={`w-4 h-4 mr-2 ${importing ? 'animate-pulse' : ''}`} />
              {importing ? 'Importando...' : 'Importar desde Asana'}
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
