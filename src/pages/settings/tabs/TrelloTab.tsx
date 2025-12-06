import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { LayoutDashboard } from 'lucide-react';
import { useTrelloIntegration } from '@/hooks/integrations';

interface TrelloTabProps {
  organizationId: string | null;
}

export function TrelloTab({ organizationId }: TrelloTabProps) {
  const { 
    account, 
    loading, 
    saving,
    connect,
    disconnect,
    toggleSync
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

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-400/10 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold">{account.board_name || 'Trello Board'}</p>
              {account.board_id && (
                <p className="text-sm text-muted-foreground">Board ID: {account.board_id}</p>
              )}
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
