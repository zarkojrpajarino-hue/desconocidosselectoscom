import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { WebhookDelivery } from '@/types/integrations';

interface ActivityTabProps {
  deliveries: WebhookDelivery[];
}

export function ActivityTab({ deliveries }: ActivityTabProps) {
  return (
    <div className="space-y-4">
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
    </div>
  );
}
