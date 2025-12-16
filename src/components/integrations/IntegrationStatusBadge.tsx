import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SyncStatus = 'active' | 'success' | 'error' | 'partial' | 'pending' | 'syncing' | 'disconnected';

interface IntegrationStatusBadgeProps {
  status: SyncStatus;
  lastSync?: string | null;
  showTime?: boolean;
  size?: 'sm' | 'md';
}

const statusConfig: Record<SyncStatus, { 
  icon: React.ElementType; 
  label: string; 
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
}> = {
  active: {
    icon: CheckCircle,
    label: 'Activo',
    variant: 'default',
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
  },
  success: {
    icon: CheckCircle,
    label: 'Éxito',
    variant: 'default',
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
  },
  error: {
    icon: XCircle,
    label: 'Error',
    variant: 'destructive',
    className: 'bg-destructive/10 text-destructive border-destructive/20'
  },
  partial: {
    icon: AlertCircle,
    label: 'Parcial',
    variant: 'secondary',
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
  },
  pending: {
    icon: Clock,
    label: 'Pendiente',
    variant: 'outline',
    className: 'bg-muted/50 text-muted-foreground'
  },
  syncing: {
    icon: RefreshCw,
    label: 'Sincronizando',
    variant: 'secondary',
    className: 'bg-primary/10 text-primary border-primary/20'
  },
  disconnected: {
    icon: XCircle,
    label: 'Desconectado',
    variant: 'outline',
    className: 'bg-muted/30 text-muted-foreground'
  }
};

export function IntegrationStatusBadge({ 
  status, 
  lastSync, 
  showTime = false,
  size = 'md'
}: IntegrationStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  
  const timeAgo = lastSync ? getTimeAgo(new Date(lastSync)) : null;
  
  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={config.variant}
        className={cn(
          'gap-1 font-medium',
          config.className,
          size === 'sm' && 'text-xs px-2 py-0.5'
        )}
      >
        <Icon className={cn(
          size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5',
          status === 'syncing' && 'animate-spin'
        )} />
        {config.label}
      </Badge>
      {showTime && timeAgo && (
        <span className="text-xs text-muted-foreground">
          {timeAgo}
        </span>
      )}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'hace unos segundos';
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)}h`;
  return `hace ${Math.floor(seconds / 86400)}d`;
}
