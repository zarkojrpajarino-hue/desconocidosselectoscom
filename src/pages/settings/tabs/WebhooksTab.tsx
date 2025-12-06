import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import { Webhook, Plus, Trash2, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import { useWebhooks } from '@/hooks/integrations';
import { WEBHOOK_EVENT_TYPES } from '@/types/integrations';

interface WebhooksTabProps {
  organizationId: string | null;
}

export function WebhooksTab({ organizationId }: WebhooksTabProps) {
  const { 
    webhooks, 
    loading, 
    isCreating, 
    createWebhook, 
    deleteWebhook, 
    toggleWebhook 
  } = useWebhooks(organizationId);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: ['lead.created', 'lead.updated', 'task.completed']
  });

  const handleCreate = async () => {
    const result = await createWebhook(formData);
    if (result) {
      setDialogOpen(false);
      setFormData({ name: '', url: '', events: ['lead.created', 'lead.updated', 'task.completed'] });
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Los Webhooks envían notificaciones a tu servidor cuando ocurren eventos
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="webhook-url">URL del Endpoint</Label>
                <Input
                  id="webhook-url"
                  placeholder="https://tu-servidor.com/webhook"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                />
              </div>
              <div>
                <Label>Eventos</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {WEBHOOK_EVENT_TYPES.map((event) => (
                    <label key={event.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              events: [...prev.events, event.value]
                            }));
                          } else {
                            setFormData(prev => ({
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
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? 'Creando...' : 'Crear Webhook'}
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
    </div>
  );
}
