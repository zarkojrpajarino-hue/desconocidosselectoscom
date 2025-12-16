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
import { MessageSquare, Check, X, Send, TestTube, Terminal } from 'lucide-react';
import { useSlackIntegration } from '@/hooks/integrations';
import { SLACK_EVENT_TYPES } from '@/types/integrations';
import { IntegrationStatusBadge } from '@/components/integrations';

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
    sending,
    connect,
    disconnect,
    toggleWorkspace,
    updateMapping,
    toggleMapping,
    sendTestNotification,
    isConnected
  } = useSlackIntegration(organizationId);

  const getConnectionStatus = () => {
    if (loading) return 'pending';
    if (!isConnected) return 'disconnected';
    if (sending) return 'syncing';
    if (workspace?.enabled) return 'active';
    return 'partial';
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
                  <IntegrationStatusBadge status={getConnectionStatus()} />
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

      {/* Slash Commands Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Comandos Slash Disponibles
          </CardTitle>
          <CardDescription>
            Usa estos comandos directamente en Slack para acceder a OPTIMUS-K
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Leads & CRM</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><code className="bg-muted px-1 rounded">/leads</code> - Lista de leads</p>
                <p><code className="bg-muted px-1 rounded">/leads hot</code> - Leads calientes</p>
                <p><code className="bg-muted px-1 rounded">/leads stats</code> - Estadísticas</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Tareas</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><code className="bg-muted px-1 rounded">/tasks</code> - Tareas de hoy</p>
                <p><code className="bg-muted px-1 rounded">/tasks pending</code> - Pendientes</p>
                <p><code className="bg-muted px-1 rounded">/tasks week</code> - Resumen semanal</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Equipo & Reportes</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><code className="bg-muted px-1 rounded">/team</code> - Rendimiento equipo</p>
                <p><code className="bg-muted px-1 rounded">/report daily</code> - Reporte diario</p>
                <p><code className="bg-muted px-1 rounded">/report weekly</code> - Reporte semanal</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">OKRs & Métricas</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><code className="bg-muted px-1 rounded">/okrs</code> - OKRs activos</p>
                <p><code className="bg-muted px-1 rounded">/metrics</code> - Métricas del mes</p>
                <p><code className="bg-muted px-1 rounded">/sync</code> - Estado integraciones</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={sendTestNotification}
              disabled={sending}
            >
              <TestTube className="w-4 h-4 mr-2" />
              {sending ? 'Enviando...' : 'Enviar Notificación de Prueba'}
            </Button>
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
