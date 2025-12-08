import ToolContentViewer from '@/components/ToolContentViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Types for CustomerJourney
interface JourneyStage {
  name?: string; description?: string;
  touchpoints?: string[]; emotions?: string[]; opportunities?: string[];
}
interface JourneyData { stages?: JourneyStage[] }

const CustomerJourney = () => {
  const renderContent = (journey: JourneyData) => {
    if (!journey?.stages) return null;

    const stageColors: Record<string, string> = {
      'Awareness': 'bg-blue-500/10 text-blue-700 border-blue-200',
      'Consideration': 'bg-purple-500/10 text-purple-700 border-purple-200',
      'Decision': 'bg-green-500/10 text-green-700 border-green-200',
      'Retention': 'bg-orange-500/10 text-orange-700 border-orange-200',
    };

    return (
      <div className="space-y-6">
        {journey.stages.map((stage: JourneyStage, idx: number) => (
          <Card key={idx} className={`border-2 ${stageColors[stage.name] || ''}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                  {idx + 1}
                </div>
                <div>
                  <CardTitle>{stage.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stage.description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 text-sm">📍 Puntos de Contacto</h4>
                <div className="flex flex-wrap gap-2">
                  {stage.touchpoints?.map((touchpoint: string, tIdx: number) => (
                    <Badge key={tIdx} variant="secondary">
                      {touchpoint}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-sm">😊 Emociones</h4>
                <div className="flex flex-wrap gap-2">
                  {stage.emotions?.map((emotion: string, eIdx: number) => (
                    <Badge key={eIdx} variant="outline">
                      {emotion}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-sm">💡 Oportunidades</h4>
                <ul className="space-y-1">
                  {stage.opportunities?.map((opp: string, oIdx: number) => (
                    <li key={oIdx} className="text-sm flex items-start gap-2">
                      <span className="text-primary mt-0.5">→</span>
                      <span>{opp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <ToolContentViewer
      toolType="customer_journey"
      title="Customer Journey"
      description="Mapa del recorrido del cliente desde el primer contacto hasta la conversión y fidelización"
      renderContent={renderContent}
    />
  );
};

export default CustomerJourney;
