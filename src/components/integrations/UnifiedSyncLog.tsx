import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  History,
  MessageSquare,
  Link2,
  Calendar,
  ListTodo,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnifiedLogEntry {
  id: string;
  platform: 'hubspot' | 'asana' | 'trello' | 'slack' | 'google_calendar' | 'outlook';
  direction: 'export' | 'import' | 'notification';
  status: 'success' | 'error' | 'partial';
  timestamp: string;
  details?: string;
  recordsAffected?: number;
}

type FilterType = 'all' | 'hubspot' | 'asana' | 'trello' | 'slack' | 'calendar';

export function UnifiedSyncLog() {
  const { t } = useTranslation();
  const { currentOrganizationId, user } = useAuth();
  const [logs, setLogs] = useState<UnifiedLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    if (currentOrganizationId && user?.id) {
      loadAllLogs();
    }
  }, [currentOrganizationId, user?.id]);

  const loadAllLogs = async () => {
    setLoading(true);
    try {
      const allLogs: UnifiedLogEntry[] = [];

      // HubSpot logs
      const { data: hubspotAccount } = await supabase
        .from('hubspot_accounts')
        .select('id')
        .eq('organization_id', currentOrganizationId!)
        .maybeSingle();

      if (hubspotAccount) {
        const { data: hubspotMappings } = await supabase
          .from('hubspot_contact_mappings')
          .select('id, last_synced_at, last_synced_direction, sync_status, last_error')
          .eq('hubspot_account_id', hubspotAccount.id)
          .order('last_synced_at', { ascending: false })
          .limit(20);

        if (hubspotMappings) {
          allLogs.push(...hubspotMappings.map(m => ({
            id: `hubspot-${m.id}`,
            platform: 'hubspot' as const,
            direction: (m.last_synced_direction?.includes('to_hubspot') ? 'export' : 'import') as UnifiedLogEntry['direction'],
            status: (m.sync_status === 'error' ? 'error' : m.sync_status === 'partial' ? 'partial' : 'success') as UnifiedLogEntry['status'],
            timestamp: m.last_synced_at || '',
            details: m.last_error || undefined
          })));
        }
      }

      // External task mappings (Asana, Trello)
      const { data: taskMappings } = await supabase
        .from('external_task_mappings')
        .select('id, platform, last_synced_at, sync_status')
        .eq('organization_id', currentOrganizationId!)
        .order('last_synced_at', { ascending: false })
        .limit(30);

      if (taskMappings) {
        allLogs.push(...taskMappings.map(m => ({
          id: `task-${m.id}`,
          platform: m.platform as 'asana' | 'trello',
          direction: 'export' as const,
          status: (m.sync_status === 'error' ? 'error' : 'success') as UnifiedLogEntry['status'],
          timestamp: m.last_synced_at || ''
        })));
      }

      // Slack messages (simplified - just count as notifications)
      const { data: slackWorkspace } = await supabase
        .from('slack_workspaces')
        .select('id, last_message_at, total_messages_sent')
        .eq('organization_id', currentOrganizationId!)
        .maybeSingle();

      if (slackWorkspace?.last_message_at) {
        allLogs.push({
          id: `slack-${slackWorkspace.id}`,
          platform: 'slack',
          direction: 'notification',
          status: 'success',
          timestamp: slackWorkspace.last_message_at,
          recordsAffected: slackWorkspace.total_messages_sent || 0
        });
      }

      // Sort by timestamp
      allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setLogs(allLogs);
    } catch (error) {
      console.error('Error loading unified logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = filter === 'all' 
    ? logs 
    : filter === 'calendar' 
      ? logs.filter(l => l.platform === 'google_calendar' || l.platform === 'outlook')
      : logs.filter(l => l.platform === filter);

  const platformIcons: Record<string, React.ReactNode> = {
    hubspot: <Link2 className="h-3.5 w-3.5" />,
    asana: <ListTodo className="h-3.5 w-3.5" />,
    trello: <LayoutDashboard className="h-3.5 w-3.5" />,
    slack: <MessageSquare className="h-3.5 w-3.5" />,
    google_calendar: <Calendar className="h-3.5 w-3.5" />,
    outlook: <Calendar className="h-3.5 w-3.5" />
  };

  const platformColors: Record<string, string> = {
    hubspot: 'text-orange-500 bg-orange-500/10',
    asana: 'text-rose-500 bg-rose-500/10',
    trello: 'text-sky-500 bg-sky-500/10',
    slack: 'text-purple-500 bg-purple-500/10',
    google_calendar: 'text-blue-500 bg-blue-500/10',
    outlook: 'text-blue-600 bg-blue-600/10'
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            {t('integrations.syncLog.title', 'Historial Unificado')}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={loadAllLogs} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)} className="mt-2">
          <TabsList className="grid grid-cols-6 h-8">
            <TabsTrigger value="all" className="text-xs px-2">
              {t('common.all', 'Todo')}
            </TabsTrigger>
            <TabsTrigger value="hubspot" className="text-xs px-2">HubSpot</TabsTrigger>
            <TabsTrigger value="asana" className="text-xs px-2">Asana</TabsTrigger>
            <TabsTrigger value="trello" className="text-xs px-2">Trello</TabsTrigger>
            <TabsTrigger value="slack" className="text-xs px-2">Slack</TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs px-2">Calendar</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            {t('common.loading', 'Cargando...')}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            {t('integrations.syncLog.noLogs', 'No hay sincronizaciones recientes')}
          </div>
        ) : (
          <ScrollArea className="h-72">
            <div className="space-y-2">
              {filteredLogs.slice(0, 20).map((log) => (
                <LogEntry key={log.id} log={log} platformIcons={platformIcons} platformColors={platformColors} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

interface LogEntryProps {
  log: UnifiedLogEntry;
  platformIcons: Record<string, React.ReactNode>;
  platformColors: Record<string, string>;
}

function LogEntry({ log, platformIcons, platformColors }: LogEntryProps) {
  const DirectionIcon = log.direction === 'export' ? ArrowUpRight : 
                        log.direction === 'import' ? ArrowDownLeft : MessageSquare;
  
  const statusIcons = {
    success: CheckCircle,
    error: XCircle,
    partial: AlertCircle
  };
  const StatusIcon = statusIcons[log.status];

  const statusColors = {
    success: 'text-emerald-500',
    error: 'text-destructive',
    partial: 'text-amber-500'
  };

  const directionLabels = {
    export: 'Exportación',
    import: 'Importación',
    notification: 'Notificación'
  };

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className={cn('p-1.5 rounded', platformColors[log.platform] || 'bg-muted')}>
        {platformIcons[log.platform]}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <DirectionIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">{directionLabels[log.direction]}</span>
          <Badge variant="outline" className="text-xs capitalize">
            {log.platform.replace('_', ' ')}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {formatTimestamp(log.timestamp)}
          {log.recordsAffected !== undefined && (
            <span className="ml-2">• {log.recordsAffected} registros</span>
          )}
          {log.details && (
            <span className="text-destructive ml-2">• {log.details}</span>
          )}
        </div>
      </div>

      <StatusIcon className={cn('h-4 w-4 flex-shrink-0', statusColors[log.status])} />
    </div>
  );
}

function formatTimestamp(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)}h`;
  
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}
