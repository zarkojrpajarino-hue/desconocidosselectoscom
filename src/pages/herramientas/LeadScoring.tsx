import ToolContentViewer from '@/components/ToolContentViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Types for LeadScoring
interface ScoringRange { grade?: string; label?: string; min?: number; max?: number }
interface ScoringFactor { points?: number; name?: string; description?: string }
interface ScoringCategory { category?: string; factors?: ScoringFactor[] }
interface LeadScoringData { scoring_ranges?: ScoringRange[]; criteria?: ScoringCategory[] }

const LeadScoring = () => {
  const renderContent = (scoring: LeadScoringData) => {
    if (!scoring?.criteria) return null;

    const getGradeColor = (grade: string) => {
      switch (grade) {
        case 'A': return 'bg-green-500';
        case 'B': return 'bg-yellow-500';
        case 'C': return 'bg-red-500';
        default: return 'bg-gray-500';
      }
    };

    return (
      <div className="space-y-6">
        {/* Rangos de puntuación */}
        {scoring.scoring_ranges && (
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle>📈 Rangos de Puntuación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scoring.scoring_ranges.map((range: ScoringRange, idx: number) => (
                  <div key={idx} className="flex items-center gap-4">
                    <Badge className={`${getGradeColor(range.grade)} text-white min-w-[40px] justify-center`}>
                      {range.grade}
                    </Badge>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{range.label}</span>
                        <span className="text-sm text-muted-foreground">
                          {range.min} - {range.max} puntos
                        </span>
                      </div>
                      <Progress value={(range.max / 100) * 100} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Criterios de evaluación */}
        {scoring.criteria.map((category: ScoringCategory, idx: number) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="text-lg">{category.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {category.factors?.map((factor: ScoringFactor, fIdx: number) => (
                  <div key={fIdx} className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                    <Badge variant="outline" className="min-w-[60px] justify-center text-primary">
                      +{factor.points}
                    </Badge>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">{factor.name}</h4>
                      <p className="text-sm text-muted-foreground">{factor.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Nota informativa */}
        <div className="bg-blue-500/10 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>💡 Tip:</strong> Este modelo de scoring te ayuda a priorizar leads basándose en 
            múltiples criterios. Ajusta los puntos según la importancia de cada factor para tu negocio.
          </p>
        </div>
      </div>
    );
  };

  return (
    <ToolContentViewer
      toolType="lead_scoring"
      title="Lead Scoring"
      description="Sistema de puntuación para priorizar y calificar leads según su potencial"
      renderContent={renderContent}
    />
  );
};

export default LeadScoring;
