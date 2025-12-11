import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCohortAnalysis } from '@/hooks/useCohortAnalysis';
import { Users, TrendingUp, DollarSign, RefreshCw } from 'lucide-react';

/**
 * Cohort Analysis Dashboard
 * Shows retention heatmap and revenue tracking
 */
export function CohortDashboard() {
  const { cohorts, avgRetentionByMonth, stats, loadingMetrics, calculateMetrics, isCalculating } = useCohortAnalysis();

  const getRetentionColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-600';
    if (rate >= 60) return 'bg-green-500';
    if (rate >= 40) return 'bg-yellow-500';
    if (rate >= 20) return 'bg-orange-500';
    return 'bg-destructive';
  };

  if (loadingMetrics) {
    return <div>Cargando análisis de cohortes...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Análisis de Cohortes
          </h1>
          <p className="text-muted-foreground mt-1">
            Analiza retención y revenue por cohortes de signup
          </p>
        </div>
        <Button onClick={() => calculateMetrics()} disabled={isCalculating}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isCalculating ? 'animate-spin' : ''}`} />
          Recalcular
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Cohortes Activas
          </p>
          <p className="text-2xl font-bold">{stats.totalCohorts}</p>
        </Card>
        
        <Card className="p-4">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Retención Mes 3
          </p>
          <p className="text-2xl font-bold">
            {Math.round(stats.avgMonth3Retention)}%
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Retención Mes 6
          </p>
          <p className="text-2xl font-bold">
            {Math.round(stats.avgMonth6Retention)}%
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Total Usuarios
          </p>
          <p className="text-2xl font-bold">{stats.totalUsers}</p>
        </Card>
      </div>

      {/* Retention Heatmap */}
      <Card className="p-6">
        <h3 className="font-medium mb-4">Heatmap de Retención</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2 border-b font-medium">Cohorte</th>
                <th className="text-right p-2 border-b font-medium">Size</th>
                {[0, 1, 2, 3, 4, 5, 6, 9, 12].map(month => (
                  <th key={month} className="text-center p-2 border-b font-medium">
                    M{month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.map((cohort) => (
                <tr key={cohort.cohort_month} className="hover:bg-muted/50">
                  <td className="p-2 border-b">
                    {new Date(cohort.cohort_month + '-01').toLocaleDateString('es', {
                      year: 'numeric',
                      month: 'short',
                    })}
                  </td>
                  <td className="p-2 border-b text-right text-muted-foreground">
                    {cohort.cohort_size}
                  </td>
                  {[0, 1, 2, 3, 4, 5, 6, 9, 12].map(month => {
                    const dataPoint = cohort.retention.find(r => r.month === month);
                    return (
                      <td key={month} className="p-1 border-b">
                        {dataPoint ? (
                          <div
                            className={`${getRetentionColor(dataPoint.rate)} text-white rounded px-2 py-1 text-center font-medium`}
                            title={`${dataPoint.users} users (${dataPoint.rate}%)`}
                          >
                            {Math.round(dataPoint.rate)}%
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground">-</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded"></div>
            <span>80%+</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>40-80%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-destructive rounded"></div>
            <span>&lt;40%</span>
          </div>
        </div>
      </Card>

      {/* Average Retention Curve */}
      <Card className="p-6">
        <h3 className="font-medium mb-4">Curva de Retención Promedio</h3>
        
        <div className="space-y-2">
          {Object.entries(avgRetentionByMonth)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .slice(0, 12)
            .map(([month, rate]) => (
              <div key={month} className="flex items-center gap-3">
                <span className="text-sm w-16">Mes {month}</span>
                <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                  <div
                    className={`h-full ${getRetentionColor(rate)} flex items-center justify-end px-2 transition-all`}
                    style={{ width: `${rate}%` }}
                  >
                    <span className="text-xs font-medium text-white">
                      {Math.round(rate)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* Empty State */}
      {cohorts.length === 0 && (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium mb-2">No hay datos de cohortes todavía</h3>
          <p className="text-sm text-muted-foreground">
            Los datos de retención aparecerán cuando tengas usuarios activos
          </p>
        </Card>
      )}
    </div>
  );
}
