import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFinancialAnomalies } from '@/hooks/useFinancialAnomalies';
import { 
  AlertTriangle, 
  TrendingDown, 
  DollarSign, 
  X, 
  CheckCircle2,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function FinancialAnomaliesAlerts() {
  const { 
    anomalies, 
    criticalAnomalies, 
    loading, 
    resolveAnomaly, 
    dismissAnomaly,
    refreshAnomalies
  } = useFinancialAnomalies();
  const navigate = useNavigate();

  const getIcon = (type: string) => {
    switch (type) {
      case 'burn_rate_spike':
        return <AlertTriangle className="h-4 w-4" />;
      case 'low_runway':
        return <DollarSign className="h-4 w-4" />;
      case 'revenue_decline':
        return <TrendingDown className="h-4 w-4" />;
      case 'negative_margin':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getVariant = (severity: string): 'destructive' | 'default' => {
    return severity === 'critical' ? 'destructive' : 'default';
  };

  const getEmoji = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🔥';
      case 'high':
        return '⚠️';
      case 'medium':
        return '📊';
      default:
        return 'ℹ️';
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (anomalies.length === 0) {
    return (
      <Alert className="border-primary/20 bg-primary/5">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary">
          ✅ Todo en orden
        </AlertTitle>
        <AlertDescription className="text-muted-foreground">
          No hay anomalías financieras detectadas. ¡Tu negocio va bien!
        </AlertDescription>
        <Button 
          variant="ghost" 
          size="sm" 
          className="mt-2" 
          onClick={refreshAnomalies}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Verificar ahora
        </Button>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Alertas Financieras</h3>
          {criticalAnomalies.length > 0 && (
            <Badge variant="destructive">
              {criticalAnomalies.length} críticas
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={refreshAnomalies}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {anomalies.map((anomaly) => (
        <Alert key={anomaly.id} variant={getVariant(anomaly.severity)}>
          {getIcon(anomaly.anomaly_type)}
          <AlertTitle className="flex items-center justify-between">
            <span>
              {getEmoji(anomaly.severity)} {anomaly.title}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => dismissAnomaly(anomaly.id)}
                title="Ocultar"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="text-sm mb-3">{anomaly.message}</p>
            
            <div className="flex items-center gap-2 flex-wrap">
              {anomaly.current_value !== null && (
                <Badge variant="outline" className="text-xs">
                  Actual: {anomaly.current_value.toFixed(1)}
                </Badge>
              )}
              {anomaly.previous_value !== null && (
                <Badge variant="outline" className="text-xs">
                  Anterior: {anomaly.previous_value.toFixed(1)}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 mt-3">
              {anomaly.action_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(anomaly.action_url!)}
                >
                  Ver detalles
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => resolveAnomaly(anomaly.id)}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Marcar como resuelto
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
