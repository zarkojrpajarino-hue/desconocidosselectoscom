import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter,
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Zap, Plus, Trash2, ExternalLink } from 'lucide-react';
import { useZapierIntegration } from '@/hooks/integrations';
import { ZAPIER_EVENT_TYPES } from '@/types/integrations';

interface ZapierTabProps {
  organizationId: string | null;
}

export function ZapierTab({ organizationId }: ZapierTabProps) {
  const { 
    subscriptions, 
    loading, 
    isCreating,
    createSubscription,
    deleteSubscription,
    toggleSubscription
  } = useZapierIntegration(organizationId);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ target_url: '', event_type: 'lead.created' });

  const handleCreate = async () => {
    const result = await createSubscription(formData.target_url, formData.event_type);
    if (result) {
      setDialogOpen(false);
      setFormData({ target_url: '', event_type: 'lead.created' });
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <CardTitle>Zapier Webhooks</CardTitle>
                <CardDescription>Conecta OPTIMUS-K con +5,000 aplicaciones</CardDescription>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Conexión
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear conexión Zapier</DialogTitle>
                  <DialogDescription>
                    Introduce la URL del webhook de tu Zap
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>URL del Webhook</Label>
                    <Input
                      placeholder="https://hooks.zapier.com/..."
                      value={formData.target_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_url: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Evento</Label>
                    <Select
                      value={formData.event_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, event_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ZAPIER_EVENT_TYPES.map((event) => (
                          <SelectItem key={event.value} value={event.value}>
                            {event.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} disabled={isCreating}>
                    {isCreating ? 'Creando...' : 'Crear'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {subscriptions.map((sub) => (
              <div 
                key={sub.id} 
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{sub.event_type}</Badge>
                    {sub.is_active ? (
                      <Badge className="bg-green-500">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-mono truncate mt-1 flex items-center gap-1">
                    {sub.target_url}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <Switch
                    checked={sub.is_active}
                    onCheckedChange={() => toggleSubscription(sub.id, sub.is_active)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSubscription(sub.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}

            {subscriptions.length === 0 && (
              <div className="py-8 text-center">
                <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No tienes conexiones de Zapier configuradas
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
