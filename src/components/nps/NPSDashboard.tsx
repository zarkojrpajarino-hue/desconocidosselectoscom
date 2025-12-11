import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNPS } from '@/hooks/useNPS';
import { Heart, TrendingUp, MessageSquare } from 'lucide-react';

/**
 * NPS Dashboard - Shows Net Promoter Score analytics
 */
export function NPSDashboard() {
  const { npsScore, npsTrends, surveys } = useNPS();

  const getNPSColor = (score: number) => {
    if (score >= 50) return 'text-green-600';
    if (score >= 0) return 'text-orange-600';
    return 'text-destructive';
  };

  const getCategoryColor = (category: string) => {
    if (category === 'promoter') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (category === 'passive') return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Heart className="h-8 w-8" />
          Net Promoter Score
        </h1>
        <p className="text-muted-foreground mt-1">
          Mide la satisfacción y lealtad de tus usuarios
        </p>
      </div>

      {/* Current NPS Score */}
      {npsScore && (
        <Card className="p-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">NPS Score Actual</p>
            <div className={`text-6xl font-bold ${getNPSColor(npsScore.nps_score)}`}>
              {Math.round(npsScore.nps_score)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Basado en {npsScore.total_responses} respuestas
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{npsScore.promoters_count}</p>
              <p className="text-xs text-muted-foreground">Promotores</p>
              <p className="text-xs font-medium text-green-600">
                {Math.round(npsScore.promoters_pct)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{npsScore.passives_count}</p>
              <p className="text-xs text-muted-foreground">Pasivos</p>
              <p className="text-xs font-medium text-orange-600">
                {Math.round(100 - npsScore.promoters_pct - npsScore.detractors_pct)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-destructive">{npsScore.detractors_count}</p>
              <p className="text-xs text-muted-foreground">Detractores</p>
              <p className="text-xs font-medium text-destructive">
                {Math.round(npsScore.detractors_pct)}%
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* NPS Trend */}
      {npsTrends && npsTrends.length > 1 && (
        <Card className="p-6">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Tendencia NPS
          </h3>
          
          <div className="space-y-2">
            {npsTrends.slice(0, 6).map((trend) => (
              <div key={trend.month} className="flex items-center justify-between">
                <span className="text-sm">
                  {new Date(trend.month + '-01').toLocaleDateString('es', { 
                    year: 'numeric', 
                    month: 'short' 
                  })}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {trend.responses} respuestas
                  </span>
                  <span className={`text-lg font-bold ${getNPSColor(trend.nps_score)}`}>
                    {Math.round(trend.nps_score)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Responses */}
      {surveys && surveys.length > 0 && (
        <Card className="p-6">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Respuestas Recientes
          </h3>
          
          <div className="space-y-4">
            {surveys.slice(0, 10).map((survey) => (
              <div key={survey.id} className="border-l-2 border-muted pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getCategoryColor(survey.category)}>
                    {survey.category}
                  </Badge>
                  <span className="text-lg font-bold">{survey.score}/10</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(survey.created_at).toLocaleDateString()}
                  </span>
                </div>
                {survey.feedback && (
                  <p className="text-sm text-muted-foreground italic">
                    "{survey.feedback}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {(!npsScore || npsScore.total_responses === 0) && (
        <Card className="p-12 text-center">
          <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium mb-2">No hay respuestas NPS todavía</h3>
          <p className="text-sm text-muted-foreground">
            Las encuestas NPS se enviarán automáticamente cada 90 días
          </p>
        </Card>
      )}
    </div>
  );
}
