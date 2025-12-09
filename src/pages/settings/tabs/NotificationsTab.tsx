import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Mail, MessageSquare, Clock, ListTodo, Target, Users, BarChart3 } from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

export function NotificationsTab() {
  const { preferences, isLoading, updatePreferences, isUpdating } = useNotificationPreferences();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No se pudieron cargar las preferencias de notificación.
        </CardContent>
      </Card>
    );
  }

  const handleToggle = (key: keyof typeof preferences, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Canales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Canales de Notificación
          </CardTitle>
          <CardDescription>
            Elige cómo quieres recibir notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>Email</Label>
                <p className="text-sm text-muted-foreground">
                  Recibir notificaciones por correo electrónico
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => handleToggle('email_enabled', checked)}
              disabled={isUpdating}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Notificaciones en tiempo real en el navegador
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.push_enabled}
              onCheckedChange={(checked) => handleToggle('push_enabled', checked)}
              disabled={isUpdating}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>Slack</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar notificaciones a tu canal de Slack
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.slack_enabled}
              onCheckedChange={(checked) => handleToggle('slack_enabled', checked)}
              disabled={isUpdating}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tipos de notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Notificación</CardTitle>
          <CardDescription>
            Personaliza qué notificaciones quieres recibir
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tareas */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Tareas
            </h4>
            <div className="space-y-3 ml-6">
              <div className="flex items-center justify-between">
                <Label className="font-normal">Tarea asignada</Label>
                <Switch
                  checked={preferences.task_assigned}
                  onCheckedChange={(checked) => handleToggle('task_assigned', checked)}
                  disabled={isUpdating}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Tarea próxima a vencer</Label>
                <Switch
                  checked={preferences.task_due_soon}
                  onCheckedChange={(checked) => handleToggle('task_due_soon', checked)}
                  disabled={isUpdating}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Tarea completada</Label>
                <Switch
                  checked={preferences.task_completed}
                  onCheckedChange={(checked) => handleToggle('task_completed', checked)}
                  disabled={isUpdating}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Tarea vencida</Label>
                <Switch
                  checked={preferences.task_overdue}
                  onCheckedChange={(checked) => handleToggle('task_overdue', checked)}
                  disabled={isUpdating}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* OKRs */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              OKRs
            </h4>
            <div className="space-y-3 ml-6">
              <div className="flex items-center justify-between">
                <Label className="font-normal">Actualización de OKR</Label>
                <Switch
                  checked={preferences.okr_update}
                  onCheckedChange={(checked) => handleToggle('okr_update', checked)}
                  disabled={isUpdating}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">OKR en riesgo</Label>
                <Switch
                  checked={preferences.okr_at_risk}
                  onCheckedChange={(checked) => handleToggle('okr_at_risk', checked)}
                  disabled={isUpdating}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Team */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Equipo
            </h4>
            <div className="space-y-3 ml-6">
              <div className="flex items-center justify-between">
                <Label className="font-normal">Invitación al equipo</Label>
                <Switch
                  checked={preferences.team_invite}
                  onCheckedChange={(checked) => handleToggle('team_invite', checked)}
                  disabled={isUpdating}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Cambio de rol</Label>
                <Switch
                  checked={preferences.role_changed}
                  onCheckedChange={(checked) => handleToggle('role_changed', checked)}
                  disabled={isUpdating}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Resúmenes */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Resúmenes
            </h4>
            <div className="space-y-3 ml-6">
              <div className="flex items-center justify-between">
                <Label className="font-normal">Resumen semanal</Label>
                <Switch
                  checked={preferences.weekly_summary}
                  onCheckedChange={(checked) => handleToggle('weekly_summary', checked)}
                  disabled={isUpdating}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Reporte mensual</Label>
                <Switch
                  checked={preferences.monthly_report}
                  onCheckedChange={(checked) => handleToggle('monthly_report', checked)}
                  disabled={isUpdating}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Hitos alcanzados</Label>
                <Switch
                  checked={preferences.milestone_reached}
                  onCheckedChange={(checked) => handleToggle('milestone_reached', checked)}
                  disabled={isUpdating}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horario de No Molestar
          </CardTitle>
          <CardDescription>
            No recibirás notificaciones durante estas horas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Activar horario de no molestar</Label>
            <Switch
              checked={preferences.quiet_hours_enabled}
              onCheckedChange={(checked) => handleToggle('quiet_hours_enabled', checked)}
              disabled={isUpdating}
            />
          </div>

          {preferences.quiet_hours_enabled && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <Label htmlFor="quiet_start" className="text-sm text-muted-foreground">Desde</Label>
                <input
                  id="quiet_start"
                  type="time"
                  value={preferences.quiet_hours_start || '22:00'}
                  onChange={(e) => updatePreferences({ quiet_hours_start: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                  disabled={isUpdating}
                />
              </div>
              <div>
                <Label htmlFor="quiet_end" className="text-sm text-muted-foreground">Hasta</Label>
                <input
                  id="quiet_end"
                  type="time"
                  value={preferences.quiet_hours_end || '08:00'}
                  onChange={(e) => updatePreferences({ quiet_hours_end: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                  disabled={isUpdating}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Digest */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Notificaciones</CardTitle>
          <CardDescription>
            Agrupa las notificaciones en un solo mensaje
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Resumen diario</Label>
              <p className="text-sm text-muted-foreground">
                Recibe un resumen cada mañana
              </p>
            </div>
            <Switch
              checked={preferences.daily_digest}
              onCheckedChange={(checked) => handleToggle('daily_digest', checked)}
              disabled={isUpdating}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Resumen semanal</Label>
              <p className="text-sm text-muted-foreground">
                Recibe un resumen cada lunes
              </p>
            </div>
            <Switch
              checked={preferences.weekly_digest}
              onCheckedChange={(checked) => handleToggle('weekly_digest', checked)}
              disabled={isUpdating}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
