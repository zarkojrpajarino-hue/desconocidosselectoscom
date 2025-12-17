// ============================================
// SECCIÓN ALERTAS CRÍTICAS
// ============================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  ArrowRight,
} from 'lucide-react';
import type { Alert } from '@/types/ai-analysis.types';

interface CriticalAlertsSectionProps {
  alerts: Alert[];
}

export function CriticalAlertsSection({ alerts }: CriticalAlertsSectionProps) {
  if (!alerts || alerts.length === 0) return null;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'medium': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500/50 bg-red-500/10';
      case 'high': return 'border-orange-500/50 bg-orange-500/10';
      case 'medium': return 'border-yellow-500/50 bg-yellow-500/10';
      default: return 'border-blue-500/50 bg-blue-500/10';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getCategoryText = (category: string) => {
    const categories: Record<string, string> = {
      financial: '💰 Financiero',
      team: '👥 Equipo',
      operations: '⚙️ Operaciones',
      market: '🌍 Mercado',
      strategy: '🎯 Estrategia',
      product: '📦 Producto',
    };
    return categories[category] || category;
  };

  const formatDate = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
    } catch {
      return 'Sin fecha';
    }
  };

  // Sort by severity
  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4);
  });

  return (
    <Card className="border-2 border-red-500/30 bg-red-500/5">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl flex items-center gap-2">
          🚨 Alertas Críticas
          <Badge variant="destructive">{alerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 md:space-y-4">
          {sortedAlerts.map((alert, idx) => (
            <div 
              key={alert.id || idx} 
              className={`p-3 md:p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 md:gap-4">
                <div className="flex items-start gap-3">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-semibold text-sm md:text-base">{alert.title}</h4>
                      <Badge className={getSeverityBadge(alert.severity)} variant="outline">
                        {alert.severity === 'critical' ? 'CRÍTICO' : 
                         alert.severity === 'high' ? 'ALTO' :
                         alert.severity === 'medium' ? 'MEDIO' : 'BAJO'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getCategoryText(alert.category)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                    
                    {alert.impact && (
                      <p className="text-xs text-muted-foreground mb-2">
                        <span className="font-medium">Impacto:</span> {alert.impact}
                      </p>
                    )}

                    {alert.recommended_action && (
                      <div className="mt-2 p-2 bg-background/50 rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Acción recomendada:</p>
                        <p className="text-sm">{alert.recommended_action}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 md:flex-col md:items-end">
                  {alert.deadline && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Fecha límite: {formatDate(alert.deadline)}</span>
                    </div>
                  )}
                  {alert.auto_resolve && (
                    <Badge variant="outline" className="text-xs">
                      Auto-resoluble
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}