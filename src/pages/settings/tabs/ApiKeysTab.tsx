import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter,
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Key, Plus, Trash2, Copy, CheckCircle2 } from 'lucide-react';
import { useApiKeys } from '@/hooks/integrations';
import { toast } from 'sonner';

interface ApiKeysTabProps {
  organizationId: string | null;
}

export function ApiKeysTab({ organizationId }: ApiKeysTabProps) {
  const { 
    apiKeys, 
    loading, 
    newKey, 
    showNewKey, 
    isCreating, 
    createApiKey, 
    deleteApiKey, 
    dismissNewKey 
  } = useApiKeys(organizationId);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [keyName, setKeyName] = useState('');

  const handleCreate = async () => {
    const result = await createApiKey(keyName);
    if (result) {
      setDialogOpen(false);
      setKeyName('');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Las API Keys permiten acceder a OPTIMUS-K desde aplicaciones externas
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Crear API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear API Key</DialogTitle>
              <DialogDescription>
                Genera una nueva API Key para tu organización
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="key-name">Nombre de la Key</Label>
                <Input
                  id="key-name"
                  placeholder="Ej: Producción, Zapier, HubSpot..."
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? 'Creando...' : 'Crear Key'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Show new key once */}
      {showNewKey && newKey && (
        <Card className="border-green-500 bg-green-500/5">
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              API Key Creada
            </CardTitle>
            <CardDescription>
              ¡Guarda esta key ahora! No podrás verla de nuevo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-4 py-2 rounded font-mono text-sm break-all">
                {newKey}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(newKey)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2"
              onClick={dismissNewKey}
            >
              Entendido, la he guardado
            </Button>
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      <div className="grid gap-4">
        {apiKeys.map((key) => (
          <Card key={key.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold">{key.name}</h3>
                    {key.is_active ? (
                      <Badge variant="default" className="bg-green-500">Activa</Badge>
                    ) : (
                      <Badge variant="destructive">Inactiva</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">
                    {key.key_prefix}••••••••••••••••
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Creada {new Date(key.created_at).toLocaleDateString()}</span>
                    {key.last_used_at && (
                      <span>Último uso {new Date(key.last_used_at).toLocaleDateString()}</span>
                    )}
                    <span>Límite: {key.rate_limit} req/min</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteApiKey(key.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {apiKeys.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No tienes API Keys. Crea una para empezar.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Documentación de la API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Autenticación</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Incluye tu API Key en el header de la petición:
            </p>
            <code className="block bg-muted p-3 rounded text-sm overflow-x-auto">
              curl https://nrsrzfqtzjrxrvqyypdn.supabase.co/functions/v1/api-v1/leads \<br />
              &nbsp;&nbsp;-H "X-API-Key: sk_live_..." \<br />
              &nbsp;&nbsp;-H "Content-Type: application/json"
            </code>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Endpoints Disponibles</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• <code>GET /leads</code> - Listar leads</li>
              <li>• <code>POST /leads</code> - Crear lead</li>
              <li>• <code>GET /leads/:id</code> - Obtener lead</li>
              <li>• <code>PUT /leads/:id</code> - Actualizar lead</li>
              <li>• <code>DELETE /leads/:id</code> - Eliminar lead</li>
              <li>• <code>GET /tasks</code> - Listar tareas</li>
              <li>• <code>GET /metrics</code> - Listar métricas</li>
              <li>• <code>POST /metrics</code> - Crear métrica</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Rate Limits</h4>
            <p className="text-sm text-muted-foreground">
              100 peticiones por minuto por API Key
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
