import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Smartphone } from 'lucide-react';
import { useSessions } from '@/hooks/useSessions';

export function SessionManager() {
  const { sessions, isLoading, revokeSession, revokeOtherSessions } = useSessions();
  const currentSessionId = 'current';

  if (isLoading) return <div className="animate-pulse">Cargando sesiones...</div>;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Sesiones Activas
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => revokeOtherSessions.mutate(currentSessionId)}
        >
          Cerrar Todas las Demás
        </Button>
      </div>

      <div className="space-y-3">
        {sessions?.map((session) => (
          <div key={session.id} className="flex items-start justify-between p-4 border rounded">
            <div className="flex gap-3">
              <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                {session.device_type === 'mobile' ? (
                  <Smartphone className="h-5 w-5" />
                ) : (
                  <Monitor className="h-5 w-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{session.device_name || 'Dispositivo Desconocido'}</p>
                  {session.id === currentSessionId && (
                    <Badge variant="default">Actual</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {session.browser} en {session.os}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {session.location_city}, {session.location_country} • {session.ip_address}
                </p>
                <p className="text-xs text-muted-foreground">
                  Última actividad: {new Date(session.last_activity_at).toLocaleString()}
                </p>
              </div>
            </div>
            {session.id !== currentSessionId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => revokeSession.mutate(session.id)}
              >
                Cerrar Sesión
              </Button>
            )}
          </div>
        ))}
        {(!sessions || sessions.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay sesiones activas
          </p>
        )}
      </div>
    </Card>
  );
}
