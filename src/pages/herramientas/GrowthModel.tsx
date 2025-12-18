import ToolContentViewer from '@/components/ToolContentViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DEMO_GROWTH_MODEL } from '@/data/demo-herramientas-data';

// Types for GrowthModel
interface GrowthMetric {
  stage?: string; kpis?: string[]; channels?: string[]; tactics?: string[];
}
interface GrowthModelData { metrics?: GrowthMetric[] }

const GrowthModel = () => {
  const renderContent = (model: GrowthModelData) => {
    if (!model?.metrics) return null;

    const stageIcons: Record<string, string> = {
      'Acquisition': '🎯',
      'Activation': '⚡',
      'Retention': '🔄',
      'Revenue': '💰',
      'Referral': '🤝',
    };

    const stageColors: Record<string, string> = {
      'Acquisition': 'bg-blue-500/10 border-blue-200',
      'Activation': 'bg-purple-500/10 border-purple-200',
      'Retention': 'bg-green-500/10 border-green-200',
      'Revenue': 'bg-yellow-500/10 border-yellow-200',
      'Referral': 'bg-pink-500/10 border-pink-200',
    };

    return (
      <div className="space-y-6">
        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">🏴‍☠️ AARRR Pirate Metrics</h3>
          <p className="text-sm text-muted-foreground">
            Modelo de growth hacking que te ayuda a medir y optimizar cada etapa del embudo de crecimiento
          </p>
        </div>

        {model.metrics.map((metric: GrowthMetric, idx: number) => (
          <Card key={idx} className={`border-2 ${stageColors[metric.stage] || ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{stageIcons[metric.stage]}</span>
                {metric.stage}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 text-sm">📊 KPIs Principales</h4>
                <div className="space-y-1">
                  {metric.kpis?.map((kpi: string, kIdx: number) => (
                    <div key={kIdx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{kpi}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-sm">📱 Canales</h4>
                <div className="flex flex-wrap gap-2">
                  {metric.channels?.map((channel: string, cIdx: number) => (
                    <Badge key={cIdx} variant="secondary">
                      {channel}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-sm">⚡ Tácticas</h4>
                <div className="flex flex-wrap gap-2">
                  {metric.tactics?.map((tactic: string, tIdx: number) => (
                    <Badge key={tIdx} variant="outline">
                      {tactic}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <ToolContentViewer
      toolType="growth_model"
      title="Growth Model"
      description="Modelo AARRR para medir y optimizar cada etapa del crecimiento"
      renderContent={renderContent}
      demoData={DEMO_GROWTH_MODEL}
    />
  );
};

export default GrowthModel;
