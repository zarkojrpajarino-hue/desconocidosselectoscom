import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Zap,
  RefreshCw,
  Upload,
  Download,
  Send,
  Calendar,
  Users,
  TrendingUp,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  action: () => Promise<void>;
  platform: string;
  color: string;
}

export function QuickActionsPanel() {
  const { t } = useTranslation();
  const { currentOrganizationId, user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const executeAction = async (actionId: string, actionFn: () => Promise<void>) => {
    setLoading(actionId);
    try {
      await actionFn();
    } catch (error) {
      toast.error(t('common.error', 'Error al ejecutar acción'));
    } finally {
      setLoading(null);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'sync-hubspot',
      label: t('integrations.actions.syncHubSpot', 'Sync HubSpot'),
      description: t('integrations.actions.syncHubSpotDesc', 'Exportar leads a HubSpot'),
      icon: Upload,
      platform: 'hubspot',
      color: 'text-orange-500 bg-orange-500/10 hover:bg-orange-500/20',
      action: async () => {
        const { error } = await supabase.functions.invoke('sync-to-hubspot', {
          body: { organization_id: currentOrganizationId }
        });
        if (error) throw error;
        toast.success(t('integrations.actions.hubspotSynced', 'Leads sincronizados con HubSpot'));
      }
    },
    {
      id: 'import-hubspot',
      label: t('integrations.actions.importHubSpot', 'Importar HubSpot'),
      description: t('integrations.actions.importHubSpotDesc', 'Traer contactos de HubSpot'),
      icon: Download,
      platform: 'hubspot',
      color: 'text-orange-500 bg-orange-500/10 hover:bg-orange-500/20',
      action: async () => {
        const { error } = await supabase.functions.invoke('import-from-hubspot', {
          body: { organization_id: currentOrganizationId }
        });
        if (error) throw error;
        toast.success(t('integrations.actions.hubspotImported', 'Contactos importados de HubSpot'));
      }
    },
    {
      id: 'sync-calendar',
      label: t('integrations.actions.syncCalendar', 'Sync Calendar'),
      description: t('integrations.actions.syncCalendarDesc', 'Sincronizar con Google Calendar'),
      icon: Calendar,
      platform: 'calendar',
      color: 'text-blue-500 bg-blue-500/10 hover:bg-blue-500/20',
      action: async () => {
        const { error } = await supabase.functions.invoke('sync-calendar-events', {
          body: { user_id: user?.id }
        });
        if (error) throw error;
        toast.success(t('integrations.actions.calendarSynced', 'Calendario sincronizado'));
      }
    },
    {
      id: 'notify-slack',
      label: t('integrations.actions.notifySlack', 'Notificar Slack'),
      description: t('integrations.actions.notifySlackDesc', 'Enviar resumen al equipo'),
      icon: Send,
      platform: 'slack',
      color: 'text-purple-500 bg-purple-500/10 hover:bg-purple-500/20',
      action: async () => {
        const { error } = await supabase.functions.invoke('slack-notify', {
          body: { 
            organization_id: currentOrganizationId,
            message: '📊 Resumen actualizado desde OPTIMUS-K'
          }
        });
        if (error) throw error;
        toast.success(t('integrations.actions.slackNotified', 'Notificación enviada a Slack'));
      }
    },
    {
      id: 'sync-asana',
      label: t('integrations.actions.syncAsana', 'Sync Asana'),
      description: t('integrations.actions.syncAsanaDesc', 'Exportar tareas a Asana'),
      icon: TrendingUp,
      platform: 'asana',
      color: 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20',
      action: async () => {
        const { error } = await supabase.functions.invoke('sync-to-asana', {
          body: { organization_id: currentOrganizationId }
        });
        if (error) throw error;
        toast.success(t('integrations.actions.asanaSynced', 'Tareas sincronizadas con Asana'));
      }
    },
    {
      id: 'sync-trello',
      label: t('integrations.actions.syncTrello', 'Sync Trello'),
      description: t('integrations.actions.syncTrelloDesc', 'Exportar tareas a Trello'),
      icon: Users,
      platform: 'trello',
      color: 'text-sky-500 bg-sky-500/10 hover:bg-sky-500/20',
      action: async () => {
        const { error } = await supabase.functions.invoke('sync-to-trello', {
          body: { organization_id: currentOrganizationId }
        });
        if (error) throw error;
        toast.success(t('integrations.actions.trelloSynced', 'Tareas sincronizadas con Trello'));
      }
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          {t('integrations.quickActions.title', 'Acciones Rápidas')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const isLoading = loading === action.id;
            
            return (
              <Button
                key={action.id}
                variant="outline"
                className={cn(
                  'h-auto flex-col items-start p-3 gap-1.5 border-border',
                  'hover:border-primary/50 transition-all',
                  isLoading && 'opacity-70 pointer-events-none'
                )}
                onClick={() => executeAction(action.id, action.action)}
                disabled={isLoading}
              >
                <div className={cn('p-1.5 rounded', action.color)}>
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span className="text-sm font-medium text-left">{action.label}</span>
                <span className="text-xs text-muted-foreground text-left line-clamp-1">
                  {action.description}
                </span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
