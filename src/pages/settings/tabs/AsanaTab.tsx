import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ListTodo } from 'lucide-react';
import { useAsanaIntegration } from '@/hooks/integrations';

interface AsanaTabProps {
  organizationId: string | null;
}

export function AsanaTab({ organizationId }: AsanaTabProps) {
  const { 
    account, 
    loading, 
    saving,
    connect,
    disconnect,
    toggleSync
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

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-pink-500/10 rounded-lg flex items-center justify-center">
              <ListTodo className="w-6 h-6 text-pink-500" />
            </div>
            <div>
              <p className="font-semibold">{account.workspace_name || 'Asana Workspace'}</p>
              <p className="text-sm text-muted-foreground">Workspace ID: {account.workspace_id}</p>
              {account.last_sync_at && (
                <p className="text-xs text-muted-foreground">
                  Última sync: {new Date(account.last_sync_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
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
