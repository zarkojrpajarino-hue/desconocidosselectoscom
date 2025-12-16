import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntegrationHealth {
  name: string;
  platform: string;
  successRate: number;
  totalSyncs: number;
  failedSyncs: number;
  lastSync: string | null;
  status: 'healthy' | 'warning' | 'error' | 'inactive';
}

export function IntegrationHealthMetrics() {
  const { t } = useTranslation();
  const { currentOrganizationId, user } = useAuth();
  const [healthData, setHealthData] = useState<IntegrationHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallHealth, setOverallHealth] = useState(100);

  useEffect(() => {
    if (currentOrganizationId && user?.id) {
      loadHealthMetrics();
    }
  }, [currentOrganizationId, user?.id]);

  const loadHealthMetrics = async () => {
    setLoading(true);
    try {
      const healthMetrics: IntegrationHealth[] = [];

      // HubSpot health
      const { data: hubspotData } = await supabase
        .from('hubspot_accounts')
        .select('id, last_sync_at, last_sync_status')
        .eq('organization_id', currentOrganizationId!)
        .maybeSingle();

      if (hubspotData) {
        const { data: hubspotMappings } = await supabase
          .from('hubspot_contact_mappings')
          .select('sync_status')
          .eq('hubspot_account_id', hubspotData.id);

        const total = hubspotMappings?.length || 0;
        const failed = hubspotMappings?.filter(m => m.sync_status === 'error').length || 0;
        const successRate = total > 0 ? ((total - failed) / total) * 100 : 100;

        healthMetrics.push({
          name: 'HubSpot',
          platform: 'hubspot',
          successRate,
          totalSyncs: total,
          failedSyncs: failed,
          lastSync: hubspotData.last_sync_at,
          status: getHealthStatus(successRate, hubspotData.last_sync_status)
        });
      }

      // External task mappings (Asana, Trello)
      const { data: taskMappings } = await supabase
        .from('external_task_mappings')
        .select('platform, sync_status, last_synced_at')
        .eq('organization_id', currentOrganizationId!);

      if (taskMappings && taskMappings.length > 0) {
        const platforms = ['asana', 'trello'];
        
        for (const platform of platforms) {
          const platformMappings = taskMappings.filter(m => m.platform === platform);
          if (platformMappings.length > 0) {
            const total = platformMappings.length;
            const failed = platformMappings.filter(m => m.sync_status === 'error').length;
            const successRate = total > 0 ? ((total - failed) / total) * 100 : 100;
            const lastSync = platformMappings
              .map(m => m.last_synced_at)
              .filter(Boolean)
              .sort()
              .reverse()[0];

            healthMetrics.push({
              name: platform.charAt(0).toUpperCase() + platform.slice(1),
              platform,
              successRate,
              totalSyncs: total,
              failedSyncs: failed,
              lastSync: lastSync || null,
              status: getHealthStatus(successRate, failed > 0 ? 'partial' : 'success')
            });
          }
        }
      }

      // Google Calendar health
      const { data: calendarData } = await supabase
        .from('google_calendar_tokens')
        .select('is_active, updated_at')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (calendarData?.is_active) {
        healthMetrics.push({
          name: 'Google Calendar',
          platform: 'google_calendar',
          successRate: 100,
          totalSyncs: 0,
          failedSyncs: 0,
          lastSync: calendarData.updated_at,
          status: 'healthy'
        });
      }

      // Slack health
      const { data: slackData } = await supabase
        .from('slack_workspaces')
        .select('id, enabled, total_messages_sent, last_message_at')
        .eq('organization_id', currentOrganizationId!)
        .maybeSingle();

      if (slackData) {
        healthMetrics.push({
          name: 'Slack',
          platform: 'slack',
          successRate: 100,
          totalSyncs: slackData.total_messages_sent || 0,
          failedSyncs: 0,
          lastSync: slackData.last_message_at,
          status: slackData.enabled ? 'healthy' : 'inactive'
        });
      }

      setHealthData(healthMetrics);

      // Calculate overall health
      if (healthMetrics.length > 0) {
        const avgHealth = healthMetrics.reduce((sum, m) => sum + m.successRate, 0) / healthMetrics.length;
        setOverallHealth(Math.round(avgHealth));
      }

    } catch (error) {
      console.error('Error loading health metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatus = (successRate: number, lastStatus: string | null): IntegrationHealth['status'] => {
    if (lastStatus === 'error') return 'error';
    if (successRate >= 95) return 'healthy';
    if (successRate >= 80) return 'warning';
    return 'error';
  };

  const statusConfig = {
    healthy: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: t('integrations.health.healthy', 'Saludable') },
    warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', label: t('integrations.health.warning', 'Advertencia') },
    error: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: t('integrations.health.error', 'Error') },
    inactive: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: t('integrations.health.inactive', 'Inactiva') }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-24 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            {t('integrations.health.title', 'Salud de Integraciones')}
          </CardTitle>
          <Badge 
            variant="outline" 
            className={cn(
              'text-xs',
              overallHealth >= 95 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
              overallHealth >= 80 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
              'bg-destructive/10 text-destructive border-destructive/20'
            )}
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            {overallHealth}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {healthData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('integrations.health.noIntegrations', 'No hay integraciones activas')}
          </p>
        ) : (
          healthData.map((health) => {
            const config = statusConfig[health.status];
            const StatusIcon = config.icon;

            return (
              <div key={health.platform} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn('p-1.5 rounded', config.bg)}>
                      <StatusIcon className={cn('h-3.5 w-3.5', config.color)} />
                    </div>
                    <span className="text-sm font-medium">{health.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{health.totalSyncs} syncs</span>
                    {health.failedSyncs > 0 && (
                      <Badge variant="destructive" className="text-xs px-1.5 py-0">
                        {health.failedSyncs} errores
                      </Badge>
                    )}
                  </div>
                </div>
                <Progress 
                  value={health.successRate} 
                  className="h-1.5"
                />
                {health.lastSync && (
                  <p className="text-xs text-muted-foreground">
                    {t('integrations.health.lastActivity', 'Última actividad')}: {new Date(health.lastSync).toLocaleString('es-ES', { 
                      day: 'numeric', 
                      month: 'short', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
