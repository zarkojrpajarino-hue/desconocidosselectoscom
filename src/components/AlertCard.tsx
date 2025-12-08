import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  AlertTriangle, 
  Lightbulb,
  X,
  ExternalLink,
  Clock,
  PartyPopper
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type AlertSeverity = 'urgent' | 'important' | 'opportunity' | 'celebration' | 'info';

interface AlertCardProps {
  id: string;
  alert_type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  context?: Record<string, string | number | boolean | null>;
  source: string;
  actionable: boolean;
  action_label?: string;
  action_url?: string;
  created_at: string;
  onDismiss: (id: string) => void;
}

const AlertCard = ({
  id,
  severity,
  title,
  message,
  context,
  source,
  actionable,
  action_label,
  action_url,
  created_at,
  onDismiss
}: AlertCardProps) => {
  const navigate = useNavigate();

  const getSeverityConfig = (sev: AlertSeverity) => {
    switch (sev) {
      case 'urgent':
        return {
          icon: AlertCircle,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/50',
          badge: 'destructive' as const
        };
      case 'important':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600 dark:text-yellow-500',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
          borderColor: 'border-yellow-300 dark:border-yellow-800',
          badge: 'default' as const
        };
      case 'opportunity':
        return {
          icon: Lightbulb,
          color: 'text-primary',
          bgColor: 'bg-primary/10',
          borderColor: 'border-primary/50',
          badge: 'secondary' as const
        };
      case 'celebration':
        return {
          icon: PartyPopper,
          color: 'text-green-600 dark:text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
          borderColor: 'border-green-300 dark:border-green-800',
          badge: 'secondary' as const
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          borderColor: 'border-border',
          badge: 'outline' as const
        };
    }
  };

  const config = getSeverityConfig(severity);
  const Icon = config.icon;

  const handleAction = () => {
    if (action_url) {
      navigate(action_url);
    }
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return `Hace ${diffDays}d`;
  };

  return (
    <Card className={`border-2 ${config.borderColor} ${config.bgColor} transition-all hover:shadow-md`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={`mt-1 ${config.color}`}>
            <Icon className="w-6 h-6" />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-lg leading-tight">{title}</h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 -mt-1"
                onClick={() => onDismiss(id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">{message}</p>

            {context && Object.keys(context).length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {Object.entries(context).slice(0, 3).map(([key, value]) => {
                  if (typeof value === 'number') {
                    return (
                      <Badge key={key} variant="outline" className="text-xs">
                        {key.replace(/_/g, ' ')}: {Math.round(value * 10) / 10}
                      </Badge>
                    );
                  }
                  return null;
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{timeAgo(created_at)}</span>
                <span>•</span>
                <span className="capitalize">{source}</span>
              </div>

              {actionable && action_label && (
                <Button
                  size="sm"
                  variant={severity === 'urgent' ? 'default' : 'outline'}
                  onClick={handleAction}
                  className="gap-2"
                >
                  {action_label}
                  <ExternalLink className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertCard;
