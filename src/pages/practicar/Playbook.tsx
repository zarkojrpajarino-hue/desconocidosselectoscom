import ToolContentViewer from '@/components/ToolContentViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, Target, CheckCircle, AlertTriangle, 
  ArrowRight, Clock, TrendingUp, MessageSquare,
  Shield, Zap
} from 'lucide-react';

const Playbook = () => {
  const renderContent = (playbook: any) => {
    if (!playbook) return null;

    return (
      <div className="space-y-8">
        {/* Methodology */}
        {playbook.methodology && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Metodología: {playbook.methodology.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{playbook.methodology.description}</p>
              {playbook.methodology.key_principles && (
                <div>
                  <h4 className="font-semibold mb-2">Principios Clave</h4>
                  <div className="flex flex-wrap gap-2">
                    {playbook.methodology.key_principles.map((principle: string, idx: number) => (
                      <Badge key={idx} variant="secondary">{principle}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sales Process */}
        {playbook.sales_process && playbook.sales_process.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Proceso de Ventas
            </h3>
            <div className="space-y-4">
              {playbook.sales_process.map((stage: any, idx: number) => (
                <Card key={idx}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                          {idx + 1}
                        </div>
                        <CardTitle className="text-lg">{stage.stage}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {stage.average_duration}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{stage.objective}</p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Activities */}
                      {stage.activities && stage.activities.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Actividades</h4>
                          <ul className="space-y-1">
                            {stage.activities.map((activity: string, aIdx: number) => (
                              <li key={aIdx} className="text-sm flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                <span>{activity}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Tools */}
                      {stage.tools && stage.tools.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Herramientas</h4>
                          <div className="flex flex-wrap gap-1">
                            {stage.tools.map((tool: string, tIdx: number) => (
                              <Badge key={tIdx} variant="outline" className="text-xs">{tool}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm border-t pt-3">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Criterio de salida:</span>
                        <span>{stage.exit_criteria}</span>
                      </div>
                      <Badge variant="secondary">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {stage.conversion_rate_target} conversión
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Qualification Framework */}
        {playbook.qualification_framework && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Framework de Calificación: {playbook.qualification_framework.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {playbook.qualification_framework.criteria?.map((criterion: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                        {criterion.letter}
                      </div>
                      <span className="font-semibold">{criterion.meaning}</span>
                    </div>
                    
                    {criterion.questions && criterion.questions.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-1">Preguntas clave:</p>
                        <ul className="space-y-1">
                          {criterion.questions.map((q: string, qIdx: number) => (
                            <li key={qIdx} className="text-sm">• {q}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {criterion.red_flags && criterion.red_flags.length > 0 && (
                      <div>
                        <p className="text-xs text-destructive mb-1">Red flags:</p>
                        <div className="flex flex-wrap gap-1">
                          {criterion.red_flags.map((flag: string, fIdx: number) => (
                            <Badge key={fIdx} variant="destructive" className="text-xs">{flag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Objection Handling */}
        {playbook.objection_handling && playbook.objection_handling.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Manejo de Objeciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {playbook.objection_handling.map((obj: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-destructive">"{obj.objection}"</h4>
                      <Badge variant="outline">{obj.type}</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Framework: </span>
                        <span className="font-medium">{obj.response_framework}</span>
                      </div>
                      <div className="bg-muted/50 rounded p-3">
                        <p className="text-muted-foreground text-xs mb-1">Respuesta de ejemplo:</p>
                        <p>"{obj.example_response}"</p>
                      </div>
                      {obj.follow_up_question && (
                        <div className="flex items-center gap-2 text-primary">
                          <ArrowRight className="h-4 w-4" />
                          <span>Seguimiento: "{obj.follow_up_question}"</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Closing Techniques */}
        {playbook.closing_techniques && playbook.closing_techniques.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Técnicas de Cierre
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {playbook.closing_techniques.map((technique: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{technique.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      <span className="font-medium">Cuándo usar:</span> {technique.when_to_use}
                    </p>
                    <div className="bg-primary/10 rounded p-2">
                      <p className="text-sm italic">"{technique.example}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPIs */}
        {playbook.kpis && playbook.kpis.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                KPIs de Ventas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {playbook.kpis.map((kpi: any, idx: number) => (
                  <div key={idx} className="text-center p-4 border rounded-lg">
                    <h4 className="font-semibold mb-1">{kpi.name}</h4>
                    <p className="text-2xl font-bold text-primary">{kpi.target}</p>
                    <Badge variant="outline" className="mt-2">{kpi.frequency}</Badge>
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
      toolType="sales_playbook"
      title="Sales Playbook"
      description="Guía completa de metodología, proceso de ventas, calificación y técnicas de cierre"
      renderContent={renderContent}
    />
  );
};

export default Playbook;
