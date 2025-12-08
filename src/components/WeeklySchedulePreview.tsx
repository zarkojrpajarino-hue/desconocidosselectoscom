import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, AlertCircle, Users, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PreviewTask {
  task_id: string;
  task_title: string;
  scheduled_date: string;
  scheduled_start: string;
  scheduled_end: string;
  is_preview: boolean;
}

interface WeeklySchedulePreviewProps {
  userId: string;
  weekStart: string;
  onSuggestChange: () => void;
}

const WeeklySchedulePreview = ({ userId, weekStart, onSuggestChange }: WeeklySchedulePreviewProps) => {
  const [previewTasks, setPreviewTasks] = useState<PreviewTask[]>([]);
  const [pendingUsers, setPendingUsers] = useState<string[]>([]);
  const [readyCount, setReadyCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [canSuggestChanges, setCanSuggestChanges] = useState(true);

  useEffect(() => {
    fetchPreview();

    // Suscribirse a cambios en week_config
    const channel = supabase
      .channel('week_config_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'week_config',
          filter: `week_start=eq.${weekStart}`
        },
        () => {
          fetchPreview();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, weekStart]);

  const fetchPreview = async () => {
    try {
      // Obtener preview
      const { data: preview } = await supabase
        .from('weekly_schedule_preview')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start', weekStart)
        .maybeSingle();

      // Obtener estado de week_config
      const { data: weekConfig } = await supabase
        .from('week_config')
        .select('*')
        .eq('week_start', weekStart)
        .maybeSingle();

      if (weekConfig) {
        setPendingUsers(weekConfig.users_pending || []);
        setReadyCount(weekConfig.ready_count || 0);
        setTotalUsers(weekConfig.total_users || 0);
      }

      if (preview?.preview_data) {
        const data = preview.preview_data as { tasks?: PreviewTask[] };
        setPreviewTasks(data.tasks || []);
        setCanSuggestChanges(preview.can_suggest_changes !== false);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching preview:', error);
      setLoading(false);
    }
  };

  const generatePreview = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-preview-schedule', {
        body: { userId, weekStart }
      });

      if (error) throw error;

      toast.success('Preview generado', {
        description: 'Tu agenda preliminar está lista'
      });

      fetchPreview();
    } catch (error: unknown) {
      console.error('Error generating preview:', error);
      toast.error('Error al generar preview');
    } finally {
      setLoading(false);
    }
  };

  const allUsersReady = pendingUsers.length === 0 && readyCount === totalUsers;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Cargando preview...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estado de disponibilidad */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Estado de Disponibilidad del Equipo
              </CardTitle>
              <CardDescription>
                {allUsersReady 
                  ? '✅ Todos completaron su disponibilidad - Generación el Lunes 13:01'
                  : `${readyCount}/${totalUsers} usuarios listos - Plazo: Lunes 13:30`
                }
              </CardDescription>
            </div>
            <Badge variant={allUsersReady ? 'default' : 'secondary'} className="text-lg">
              {readyCount}/{totalUsers}
            </Badge>
          </div>
        </CardHeader>
        
        {pendingUsers.length > 0 && (
          <CardContent>
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-medium text-warning">Aún faltan usuarios por rellenar:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {pendingUsers.map((userName, i) => (
                      <li key={i}>{userName}</li>
                    ))}
                  </ul>
                  <p className="text-sm text-muted-foreground mt-3">
                    💡 <strong>Recuérdales</strong> que rellenen antes del <strong>Lunes 13:30</strong>.
                    La agenda completa se generará automáticamente el <strong>Lunes 13:01</strong>.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Preview de agenda */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                {allUsersReady ? 'Preview de tu Agenda' : 'Preview Preliminar'}
              </CardTitle>
              <CardDescription>
                {allUsersReady 
                  ? 'Generación final el Lunes 13:01 - Podrás ajustar hasta Miércoles 13:29'
                  : 'Vista preliminar basada en disponibilidad actual (puede cambiar)'
                }
              </CardDescription>
            </div>
            {!allUsersReady && canSuggestChanges && (
              <Button onClick={onSuggestChange} variant="outline" size="sm">
                Sugerir Cambios
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {previewTasks.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
              <div>
                <p className="text-muted-foreground mb-3">
                  Aún no hay preview disponible
                </p>
                <Button onClick={generatePreview}>
                  Generar Preview
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {previewTasks.map((task, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-accent/5 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={allUsersReady ? 'default' : 'secondary'}>
                          {allUsersReady ? 'Casi Final' : 'Preview'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(task.scheduled_date).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      </div>
                      <h4 className="font-semibold">{task.task_title}</h4>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {task.scheduled_start} - {task.scheduled_end}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!allUsersReady && previewTasks.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                ℹ️ Este es un preview preliminar que puede cambiar. La agenda final se generará automáticamente el 
                <strong> Lunes 13:01</strong> cuando todos completen su disponibilidad.
                <br />
                <strong>🎯 Ventaja:</strong> Rellenaste primero = más opciones para sugerir cambios después.
              </p>
            </div>
          )}

          {allUsersReady && previewTasks.length > 0 && (
            <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
              <p className="text-sm text-success-foreground">
                ✅ <strong>Todos listos!</strong> La agenda final se generará el <strong>Lunes 13:01</strong>.
                Podrás revisarla y sugerir cambios desde el <strong>Lunes 13:30</strong> hasta el <strong>Miércoles 13:29</strong>.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklySchedulePreview;