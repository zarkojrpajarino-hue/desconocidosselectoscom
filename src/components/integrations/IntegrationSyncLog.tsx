import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncLogEntry {
  id: string;
  direction: 'to_hubspot' | 'from_hubspot' | 'to_asana' | 'from_asana' | 'to_trello' | 'from_trello';
  status: 'active' | 'success' | 'error' | 'partial';
  synced_at: string;
  details?: string;
  error_message?: string;
  records_affected?: number;
}

interface IntegrationSyncLogProps {
  integrationTable: 'hubspot_contact_mappings' | 'external_task_mappings';
  accountId?: string;
  organizationId: string;
  title?: string;
  maxItems?: number;
}

export function IntegrationSyncLog({ 
  integrationTable,
  accountId,
  organizationId,
  title = 'Historial de Sincronización',
  maxItems = 10
}: IntegrationSyncLogProps) {
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [integrationTable, accountId, organizationId]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      if (integrationTable === 'hubspot_contact_mappings' && accountId) {
        const { data } = await supabase
          .from('hubspot_contact_mappings')
          .select('id, last_synced_at, last_synced_direction, sync_status, last_error')
          .eq('hubspot_account_id', accountId)
          .order('last_synced_at', { ascending: false })
          .limit(maxItems);

        if (data) {
          setLogs(data.map(d => ({
            id: d.id,
            direction: d.last_synced_direction as SyncLogEntry['direction'],
            status: d.sync_status as SyncLogEntry['status'],
            synced_at: d.last_synced_at || '',
            error_message: d.last_error || undefined
          })));
        }
      } else if (integrationTable === 'external_task_mappings') {
        const { data } = await supabase
          .from('external_task_mappings')
          .select('id, last_synced_at, platform, sync_status')
          .eq('organization_id', organizationId)
          .order('last_synced_at', { ascending: false })
          .limit(maxItems);

        if (data) {
          setLogs(data.map(d => ({
            id: d.id,
            direction: `to_${d.platform}` as SyncLogEntry['direction'],
            status: d.sync_status as SyncLogEntry['status'],
            synced_at: d.last_synced_at || ''
          })));
        }
      }
    } catch (error) {
      console.error('Error loading sync logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayLogs = expanded ? logs : logs.slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          <Button variant="ghost" size="sm" onClick={loadLogs} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Cargando historial...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No hay sincronizaciones recientes
          </div>
        ) : (
          <>
            <ScrollArea className="h-auto max-h-64">
              <div className="space-y-2">
                {displayLogs.map((log) => (
                  <LogEntry key={log.id} log={log} />
                ))}
              </div>
            </ScrollArea>
            {logs.length > 5 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-2"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Mostrar menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Ver {logs.length - 5} más
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function LogEntry({ log }: { log: SyncLogEntry }) {
  const isOutgoing = log.direction.startsWith('to_');
  const DirectionIcon = isOutgoing ? ArrowUpRight : ArrowDownLeft;
  
  const statusIcons = {
    active: CheckCircle,
    success: CheckCircle,
    error: XCircle,
    partial: AlertCircle
  };
  const StatusIcon = statusIcons[log.status] || AlertCircle;

  const statusColors = {
    active: 'text-emerald-500',
    success: 'text-emerald-500',
    error: 'text-destructive',
    partial: 'text-amber-500'
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center',
        isOutgoing ? 'bg-primary/10' : 'bg-secondary/50'
      )}>
        <DirectionIcon className={cn(
          'w-4 h-4',
          isOutgoing ? 'text-primary' : 'text-secondary-foreground'
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {isOutgoing ? 'Exportación' : 'Importación'}
          </span>
          <Badge variant="outline" className="text-xs">
            {log.direction.replace('to_', '').replace('from_', '')}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {formatDate(log.synced_at)}
          {log.error_message && (
            <span className="text-destructive ml-2">• {log.error_message}</span>
          )}
        </div>
      </div>

      <StatusIcon className={cn('w-4 h-4', statusColors[log.status])} />
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}
