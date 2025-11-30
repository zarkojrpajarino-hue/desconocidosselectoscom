import ToolContentViewer from '@/components/ToolContentViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const BuyerPersona = () => {
  const renderContent = (persona: any) => {
    if (!persona) return null;

    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{persona.name}</CardTitle>
                <p className="text-muted-foreground mt-1">
                  {persona.age} • {persona.occupation}
                </p>
                <p className="text-sm text-muted-foreground">{persona.industry}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg italic border-l-4 border-primary">
              "{persona.quote}"
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                🎯 Objetivos
              </h3>
              <ul className="space-y-2">
                {persona.goals?.map((goal: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{goal}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                ⚡ Desafíos
              </h3>
              <ul className="space-y-2">
                {persona.challenges?.map((challenge: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-destructive mt-1">•</span>
                    <span>{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                💡 Valores
              </h3>
              <div className="flex flex-wrap gap-2">
                {persona.values?.map((value: string, idx: number) => (
                  <Badge key={idx} variant="secondary">
                    {value}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                📱 Canales Preferidos
              </h3>
              <div className="flex flex-wrap gap-2">
                {persona.channels?.map((channel: string, idx: number) => (
                  <Badge key={idx} variant="outline">
                    {channel}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <ToolContentViewer
      toolType="buyer_persona"
      title="Buyer Persona"
      description="Perfil detallado del cliente ideal para enfocar estrategias de marketing y ventas"
      renderContent={renderContent}
    />
  );
};

export default BuyerPersona;
