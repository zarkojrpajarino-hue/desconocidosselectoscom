import ToolContentViewer from '@/components/ToolContentViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, MessageSquare, Mail, Lightbulb } from 'lucide-react';

interface PreferredTerm {
  instead_of: string;
  use: string;
  reason?: string;
}

interface ObjectionHandling {
  objection: string;
  response: string;
}

interface Scenario {
  situation: string;
  approach: string;
  example_script?: string;
}

interface GuiaContent {
  brand_voice?: {
    personality?: string[];
    tone?: string;
    do?: string[];
    dont?: string[];
  };
  key_messages?: {
    elevator_pitch?: string;
    value_proposition?: string;
    tagline?: string;
    differentiators?: string[];
  };
  vocabulary?: {
    preferred_terms?: PreferredTerm[];
    power_words?: string[];
    words_to_avoid?: string[];
  };
  templates?: {
    email_intro?: string;
    follow_up?: string;
    objection_handling?: ObjectionHandling[];
  };
  scenarios?: Scenario[];
}

const Guia = () => {
  const renderContent = (guia: GuiaContent) => {
    if (!guia) return null;

    return (
      <div className="space-y-8">
        {/* Brand Voice */}
        {guia.brand_voice && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Voz de Marca
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Personalidad</h4>
                <div className="flex flex-wrap gap-2">
                  {guia.brand_voice.personality?.map((trait: string, idx: number) => (
                    <Badge key={idx} variant="secondary">{trait}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Tono General</h4>
                <p className="text-muted-foreground">{guia.brand_voice.tone}</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-500/10 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    Sí Hacer
                  </h4>
                  <ul className="space-y-1">
                    {guia.brand_voice.do?.map((item: string, idx: number) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-500/10 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-700">
                    <XCircle className="h-4 w-4" />
                    No Hacer
                  </h4>
                  <ul className="space-y-1">
                    {guia.brand_voice.dont?.map((item: string, idx: number) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-red-600 mt-0.5">✗</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Messages */}
        {guia.key_messages && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Mensajes Clave
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/10 rounded-lg p-4 border-l-4 border-primary">
                <h4 className="font-semibold text-sm text-primary mb-1">Elevator Pitch (30 segundos)</h4>
                <p className="italic">"{guia.key_messages.elevator_pitch}"</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Propuesta de Valor</h4>
                <p className="text-muted-foreground">{guia.key_messages.value_proposition}</p>
              </div>
              {guia.key_messages.tagline && (
                <div>
                  <h4 className="font-semibold mb-1">Tagline</h4>
                  <p className="text-lg font-medium text-primary">"{guia.key_messages.tagline}"</p>
                </div>
              )}
              {guia.key_messages.differentiators && (
                <div>
                  <h4 className="font-semibold mb-2">Diferenciadores</h4>
                  <div className="flex flex-wrap gap-2">
                    {guia.key_messages.differentiators.map((diff: string, idx: number) => (
                      <Badge key={idx} variant="outline">{diff}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Vocabulary */}
        {guia.vocabulary && (
          <Card>
            <CardHeader>
              <CardTitle>📝 Vocabulario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {guia.vocabulary.preferred_terms && guia.vocabulary.preferred_terms.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Términos Preferidos</h4>
                  <div className="space-y-2">
                    {guia.vocabulary.preferred_terms.map((term: PreferredTerm, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground line-through">{term.instead_of}</span>
                        <span>→</span>
                        <span className="font-medium text-primary">{term.use}</span>
                        {term.reason && (
                          <span className="text-xs text-muted-foreground">({term.reason})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {guia.vocabulary.power_words && (
                <div>
                  <h4 className="font-semibold mb-2">Palabras Poderosas</h4>
                  <div className="flex flex-wrap gap-2">
                    {guia.vocabulary.power_words.map((word: string, idx: number) => (
                      <Badge key={idx} className="bg-primary/20 text-primary">{word}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {guia.vocabulary.words_to_avoid && (
                <div>
                  <h4 className="font-semibold mb-2">Palabras a Evitar</h4>
                  <div className="flex flex-wrap gap-2">
                    {guia.vocabulary.words_to_avoid.map((word: string, idx: number) => (
                      <Badge key={idx} variant="destructive" className="opacity-70">{word}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Templates */}
        {guia.templates && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Templates de Comunicación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {guia.templates.email_intro && (
                <div>
                  <h4 className="font-semibold mb-2">Email de Introducción</h4>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap">
                    {guia.templates.email_intro}
                  </div>
                </div>
              )}
              {guia.templates.follow_up && (
                <div>
                  <h4 className="font-semibold mb-2">Email de Seguimiento</h4>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap">
                    {guia.templates.follow_up}
                  </div>
                </div>
              )}
              {guia.templates.objection_handling && guia.templates.objection_handling.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Manejo de Objeciones</h4>
                  <div className="space-y-3">
                    {guia.templates.objection_handling.map((obj: ObjectionHandling, idx: number) => (
                      <div key={idx} className="border rounded-lg p-3">
                        <p className="font-medium text-sm text-destructive">"{obj.objection}"</p>
                        <p className="text-sm mt-2 text-muted-foreground">→ {obj.response}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Scenarios */}
        {guia.scenarios && guia.scenarios.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>🎭 Escenarios de Comunicación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {guia.scenarios.map((scenario: Scenario, idx: number) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{scenario.situation}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{scenario.approach}</p>
                    {scenario.example_script && (
                      <div className="bg-muted/50 rounded p-3">
                        <p className="text-xs text-muted-foreground mb-1">Script de ejemplo:</p>
                        <p className="text-sm italic">"{scenario.example_script}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <ToolContentViewer
      toolType="communication_guide"
      title="Guía de Comunicación"
      description="Guía completa de tono de voz, mensajes clave y templates de comunicación para tu marca"
      renderContent={renderContent}
    />
  );
};

export default Guia;
