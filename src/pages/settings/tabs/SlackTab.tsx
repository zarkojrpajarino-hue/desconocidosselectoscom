import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquare, Check, X } from 'lucide-react';
import { useSlackIntegration } from '@/hooks/integrations';
import { SLACK_EVENT_TYPES } from '@/types/integrations';

interface SlackTabProps {
  organizationId: string | null;
}

export function SlackTab({ organizationId }: SlackTabProps) {
  const { 
    workspace, 
    channels, 
    mappings, 
    loading, 
    connecting,
    connect,
    disconnect,
    toggleWorkspace,
    updateMapping,
    toggleMapping
  } = useSlackIntegration(organizationId);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!workspace) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-6">
          <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground" />
          <div>
            <h3 className="text-xl font-semibold mb-2">Conecta tu workspace de Slack</h3>
            <p className="text-muted-foreground mb-4">
              Recibe notificaciones en tiempo real sobre leads, tareas y OKRs
            </p>
          </div>
          <Button onClick={connect} disabled={connecting} size="lg">
            <MessageSquare className="w-5 h-5 mr-2" />
            {connecting ? 'Conectando...' : 'Conectar con Slack'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{workspace.team_name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    <Check className="w-3 h-3 mr-1" /> Conectado
                  </Badge>
                  <span>{workspace.total_messages_sent} mensajes enviados</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Notificaciones</span>
                <Switch 
                  checked={workspace.enabled} 
                  onCheckedChange={toggleWorkspace} 
                />
              </div>
              <Button variant="outline" size="sm" onClick={disconnect}>
                Desconectar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuración de Canales</CardTitle>
          <CardDescription>
            Selecciona qué canal recibirá cada tipo de notificación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {SLACK_EVENT_TYPES.map((eventType) => {
            const mapping = mappings.find(m => m.event_type === eventType.value);
            return (
              <div 
                key={eventType.value} 
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{eventType.icon}</span>
                  <div>
                    <p className="font-medium">{eventType.label}</p>
                    <p className="text-sm text-muted-foreground">{eventType.value}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Select
                    value={mapping?.channel_id || ''}
                    onValueChange={(value) => {
                      const channel = channels.find(c => c.channel_id === value);
                      if (channel) {
                        updateMapping(eventType.value, channel.channel_id, channel.channel_name);
                      }
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Seleccionar canal" />
                    </SelectTrigger>
                    <SelectContent>
                      {channels.map((channel) => (
                        <SelectItem key={channel.id} value={channel.channel_id}>
                          #{channel.channel_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {mapping && (
                    <Switch
                      checked={mapping.enabled}
                      onCheckedChange={(enabled) => toggleMapping(mapping.id, enabled)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
