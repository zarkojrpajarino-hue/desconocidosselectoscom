import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter,
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Copy, 
  Key, 
  Plus, 
  Trash2, 
  Webhook,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  scopes: string[];
  rate_limit: number;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
}

interface WebhookType {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  last_delivery_at: string | null;
  last_delivery_status: string | null;
  created_at: string;
}

interface WebhookDelivery {
  id: string;
  event_type: string;
  status: string;
  http_status_code: number | null;
  response_time_ms: number | null;
  created_at: string;
}

export default function ApiKeysPage() {
  const { user } = useAuth();
  const [currentOrganizationId, setCurrentOrganizationId] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookType[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newWebhookData, setNewWebhookData] = useState({
    name: '',
    url: '',
    events: ['lead.created', 'lead.updated', 'task.completed']
  });

  useEffect(() => {
    loadOrganization();
  }, [user]);

  useEffect(() => {
    if (currentOrganizationId) {
      loadApiKeys();
      loadWebhooks();
    }
  }, [currentOrganizationId]);

  const loadOrganization = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_roles')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    
    if (data) {
      setCurrentOrganizationId(data.organization_id);
    }
  };

  const loadApiKeys = async () => {
    const { data } = await supabase
      .from('api_keys')
      .select('*')
      .eq('organization_id', currentOrganizationId)
      .order('created_at', { ascending: false });

    setApiKeys((data as ApiKey[]) || []);
  };

  const loadWebhooks = async () => {
    const { data: webhooksData } = await supabase
      .from('webhooks')
      .select('*')
      .eq('organization_id', currentOrganizationId)
      .order('created_at', { ascending: false });

    setWebhooks((webhooksData as WebhookType[]) || []);

    // Load recent deliveries
    if (webhooksData && webhooksData.length > 0) {
      const webhookIds = webhooksData.map(w => w.id);
      const { data: deliveriesData } = await supabase
        .from('webhook_deliveries')
        .select('id, event_type, status, http_status_code, response_time_ms, created_at')
        .in('webhook_id', webhookIds)
        .order('created_at', { ascending: false })
        .limit(20);

      setDeliveries((deliveriesData as WebhookDelivery[]) || []);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Por favor, introduce un nombre para la API Key');
      return;
    }

    setIsCreatingKey(true);
    try {
      // Generate random API key
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      const apiKey = 'sk_live_' + Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Hash API key for storage
      const encoder = new TextEncoder();
      const data = encoder.encode(apiKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Store in database
      const { error } = await supabase
        .from('api_keys')
        .insert({
          organization_id: currentOrganizationId,
          name: newKeyName,
          key_prefix: 'sk_live_',
          key_hash: keyHash,
          scopes: ['read', 'write'],
          created_by: user?.id
        });

      if (error) throw error;

      setNewKey(apiKey);
      setShowNewKey(true);
      setKeyDialogOpen(false);
      setNewKeyName('');
      loadApiKeys();
      toast.success('API Key creada correctamente');

    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error('Error al crear la API Key');
    } finally {
      setIsCreatingKey(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    if (!confirm('¿Estás seguro? Esta acción no se puede deshacer.')) return;

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Error al eliminar la API Key');
    } else {
      toast.success('API Key eliminada');
      loadApiKeys();
    }
  };

  const createWebhook = async () => {
    if (!newWebhookData.name.trim() || !newWebhookData.url.trim()) {
      toast.error('Por favor, completa todos los campos');
      return;
    }

    setIsCreatingWebhook(true);
    try {
      // Generate webhook secret
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      const secret = 'whsec_' + Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const { error } = await supabase
        .from('webhooks')
        .insert({
          organization_id: currentOrganizationId,
          name: newWebhookData.name,
          url: newWebhookData.url,
          secret,
          events: newWebhookData.events
        });

      if (error) throw error;

      setWebhookDialogOpen(false);
      setNewWebhookData({ name: '', url: '', events: ['lead.created', 'lead.updated', 'task.completed'] });
      loadWebhooks();
      toast.success('Webhook creado correctamente');

    } catch (error) {
      console.error('Error creating webhook:', error);
      toast.error('Error al crear el Webhook');
    } finally {
      setIsCreatingWebhook(false);
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm('¿Estás seguro? Esta acción no se puede deshacer.')) return;

    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Error al eliminar el Webhook');
    } else {
      toast.success('Webhook eliminado');
      loadWebhooks();
    }
  };

  const toggleWebhook = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('webhooks')
      .update({ is_active: !isActive })
      .eq('id', id);

    if (error) {
      toast.error('Error al actualizar el Webhook');
    } else {
      loadWebhooks();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const availableEvents = [
    { value: 'lead.created', label: 'Lead creado' },
    { value: 'lead.updated', label: 'Lead actualizado' },
    { value: 'lead.deleted', label: 'Lead eliminado' },
    { value: 'task.completed', label: 'Tarea completada' },
    { value: 'okr.updated', label: 'OKR actualizado' },
    { value: 'metric.created', label: 'Métrica registrada' }
  ];

  return (
    <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">API & Integraciones</h1>
          <p className="text-muted-foreground">
            Gestiona las API Keys y Webhooks para integrar OPTIMUS-K con otras herramientas
          </p>
        </div>

        <Tabs defaultValue="api-keys" className="space-y-4">
          <TabsList>
            <TabsTrigger value="api-keys" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2">
              <Webhook className="w-4 h-4" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Actividad
            </TabsTrigger>
          </TabsList>

          {/* API KEYS TAB */}
          <TabsContent value="api-keys" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Las API Keys permiten acceder a OPTIMUS-K desde aplicaciones externas
              </p>
              <Dialog open={keyDialogOpen} onOpenChange={setKeyDialogOpen}>
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
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setKeyDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={createApiKey} disabled={isCreatingKey}>
                      {isCreatingKey ? 'Creando...' : 'Crear Key'}
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
                    onClick={() => setShowNewKey(false)}
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
          </TabsContent>

          {/* WEBHOOKS TAB */}
          <TabsContent value="webhooks" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Los Webhooks envían notificaciones a tu servidor cuando ocurren eventos
              </p>
              <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Webhook
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Webhook</DialogTitle>
                    <DialogDescription>
                      Configura un endpoint para recibir eventos
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="webhook-name">Nombre</Label>
                      <Input
                        id="webhook-name"
                        placeholder="Ej: Slack, Zapier, n8n..."
                        value={newWebhookData.name}
                        onChange={(e) => setNewWebhookData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="webhook-url">URL del Endpoint</Label>
                      <Input
                        id="webhook-url"
                        placeholder="https://tu-servidor.com/webhook"
                        value={newWebhookData.url}
                        onChange={(e) => setNewWebhookData(prev => ({ ...prev, url: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Eventos</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {availableEvents.map((event) => (
                          <label key={event.value} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={newWebhookData.events.includes(event.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewWebhookData(prev => ({
                                    ...prev,
                                    events: [...prev.events, event.value]
                                  }));
                                } else {
                                  setNewWebhookData(prev => ({
                                    ...prev,
                                    events: prev.events.filter(ev => ev !== event.value)
                                  }));
                                }
                              }}
                              className="rounded"
                            />
                            {event.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setWebhookDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={createWebhook} disabled={isCreatingWebhook}>
                      {isCreatingWebhook ? 'Creando...' : 'Crear Webhook'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Webhooks List */}
            <div className="grid gap-4">
              {webhooks.map((webhook) => (
                <Card key={webhook.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Webhook className="w-4 h-4 text-muted-foreground" />
                          <h3 className="font-semibold">{webhook.name}</h3>
                          {webhook.is_active ? (
                            <Badge variant="default" className="bg-green-500">Activo</Badge>
                          ) : (
                            <Badge variant="secondary">Pausado</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground font-mono flex items-center gap-1">
                          {webhook.url}
                          <ExternalLink className="w-3 h-3" />
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.map((event) => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            {webhook.successful_deliveries} exitosos
                          </span>
                          <span className="flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-red-500" />
                            {webhook.failed_deliveries} fallidos
                          </span>
                          {webhook.last_delivery_at && (
                            <span>Último: {new Date(webhook.last_delivery_at).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleWebhook(webhook.id, webhook.is_active)}
                        >
                          {webhook.is_active ? 'Pausar' : 'Activar'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteWebhook(webhook.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {webhooks.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Webhook className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No tienes Webhooks configurados. Crea uno para empezar.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ACTIVITY TAB */}
          <TabsContent value="activity" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Historial de entregas de webhooks recientes
            </p>

            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {deliveries.map((delivery) => (
                    <div key={delivery.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        {delivery.status === 'delivered' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : delivery.status === 'failed' ? (
                          <XCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-500" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{delivery.event_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(delivery.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {delivery.http_status_code && (
                          <Badge variant={delivery.http_status_code < 400 ? 'default' : 'destructive'}>
                            {delivery.http_status_code}
                          </Badge>
                        )}
                        {delivery.response_time_ms && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {delivery.response_time_ms}ms
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {deliveries.length === 0 && (
                    <div className="py-12 text-center">
                      <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No hay actividad reciente
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
