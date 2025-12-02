import { useState } from 'react';
import ToolContentViewer from '@/components/ToolContentViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, User, Briefcase, ArrowRight, RotateCcw, Trophy, Lightbulb } from 'lucide-react';

const Simulador = () => {
  const [activeScenario, setActiveScenario] = useState<number | null>(null);
  const [currentStage, setCurrentStage] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedResponses, setSelectedResponses] = useState<number[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleSelectResponse = (optionIndex: number, optionScore: number) => {
    setSelectedResponses([...selectedResponses, optionIndex]);
    setScore(score + optionScore);
    setShowFeedback(true);
  };

  const handleNextStage = (scenario: any) => {
    setShowFeedback(false);
    if (currentStage < scenario.conversation_flow.length - 1) {
      setCurrentStage(currentStage + 1);
    } else {
      setCompleted(true);
    }
  };

  const resetScenario = () => {
    setActiveScenario(null);
    setCurrentStage(0);
    setScore(0);
    setSelectedResponses([]);
    setShowFeedback(false);
    setCompleted(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'fácil': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'medio': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'difícil': return 'bg-red-500/10 text-red-700 border-red-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const renderContent = (simulador: any) => {
    if (!simulador?.scenarios) return null;

    // Vista de selección de escenarios
    if (activeScenario === null) {
      return (
        <div className="space-y-6">
          {/* Quick Tips */}
          {simulador.quick_tips && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Tips Rápidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {simulador.quick_tips.map((tip: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <Badge variant="outline" className="shrink-0">{tip.category}</Badge>
                      <span className="text-muted-foreground">{tip.tip}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scenario Selection */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {simulador.scenarios.map((scenario: any, idx: number) => (
              <Card 
                key={idx} 
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                onClick={() => setActiveScenario(idx)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getDifficultyColor(scenario.difficulty)}>
                      {scenario.difficulty}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {scenario.conversation_flow?.length || 0} etapas
                    </span>
                  </div>
                  <CardTitle className="text-lg">{scenario.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {scenario.client_profile && (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{scenario.client_profile.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{scenario.client_profile.role}</span>
                      </div>
                      <Badge variant="outline" className="mt-2">
                        {scenario.client_profile.personality}
                      </Badge>
                    </div>
                  )}
                  <Button className="w-full mt-4" variant="outline">
                    Comenzar Escenario
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    const scenario = simulador.scenarios[activeScenario];
    const flow = scenario.conversation_flow || [];
    const currentFlow = flow[currentStage];
    const totalStages = flow.length;
    const maxPossibleScore = flow.reduce((acc: number, stage: any) => {
      const maxOption = Math.max(...(stage.options?.map((o: any) => o.score) || [0]));
      return acc + maxOption;
    }, 0);

    // Vista de escenario completado
    if (completed) {
      const percentage = Math.round((score / maxPossibleScore) * 100);
      return (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <Trophy className={`h-16 w-16 mx-auto mb-4 ${percentage >= 70 ? 'text-yellow-500' : percentage >= 40 ? 'text-gray-400' : 'text-orange-400'}`} />
              <CardTitle className="text-2xl">¡Escenario Completado!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{score}/{maxPossibleScore}</div>
                <Progress value={percentage} className="h-3 mb-2" />
                <p className="text-muted-foreground">
                  {percentage >= 70 ? '¡Excelente desempeño!' : percentage >= 40 ? 'Buen intento, sigue practicando.' : 'Hay oportunidad de mejora.'}
                </p>
              </div>

              {scenario.ideal_outcome && (
                <div className="bg-primary/10 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Resultado Ideal</h4>
                  <p className="text-sm text-muted-foreground">{scenario.ideal_outcome}</p>
                </div>
              )}

              {scenario.learning_points && scenario.learning_points.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Aprendizajes Clave</h4>
                  <ul className="space-y-2">
                    {scenario.learning_points.map((point: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={resetScenario} variant="outline" className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Volver a Escenarios
                </Button>
                <Button 
                  onClick={() => {
                    setCurrentStage(0);
                    setScore(0);
                    setSelectedResponses([]);
                    setShowFeedback(false);
                    setCompleted(false);
                  }} 
                  className="flex-1"
                >
                  Reintentar Este
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Vista de simulación activa
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={resetScenario}>
            ← Volver a escenarios
          </Button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Etapa {currentStage + 1} de {totalStages}
            </span>
            <Badge variant="secondary">Puntos: {score}</Badge>
          </div>
        </div>

        <Progress value={((currentStage + 1) / totalStages) * 100} className="h-2" />

        {/* Client Profile Card */}
        {scenario.client_profile && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">{scenario.client_profile.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {scenario.client_profile.role} • {scenario.client_profile.company_type}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{scenario.client_profile.personality}</Badge>
                    <Badge variant="outline" className="text-xs">{scenario.client_profile.budget_level} presupuesto</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conversation */}
        {currentFlow && (
          <Card>
            <CardHeader>
              <Badge className="w-fit">{currentFlow.stage}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Client Message */}
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">El cliente dice:</p>
                <p className="font-medium">"{currentFlow.client_says}"</p>
              </div>

              {/* Response Options */}
              {!showFeedback ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium">¿Cómo respondes?</p>
                  {currentFlow.options?.map((option: any, idx: number) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="w-full text-left justify-start h-auto py-3 px-4"
                      onClick={() => handleSelectResponse(idx, option.score)}
                    >
                      <span className="whitespace-normal">{option.response}</span>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected Response Feedback */}
                  {currentFlow.options?.map((option: any, idx: number) => {
                    const isSelected = selectedResponses[currentStage] === idx;
                    const isBest = option.score === Math.max(...currentFlow.options.map((o: any) => o.score));
                    
                    return (
                      <div 
                        key={idx}
                        className={`rounded-lg p-4 border-2 ${
                          isSelected 
                            ? isBest ? 'border-green-500 bg-green-500/10' : 'border-orange-500 bg-orange-500/10'
                            : isBest ? 'border-green-500/30 bg-green-500/5' : 'border-transparent bg-muted/50'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {isSelected && (isBest ? 
                            <CheckCircle className="h-5 w-5 text-green-500 shrink-0" /> : 
                            <XCircle className="h-5 w-5 text-orange-500 shrink-0" />
                          )}
                          {!isSelected && isBest && <CheckCircle className="h-5 w-5 text-green-500/50 shrink-0" />}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{option.response}</p>
                            <p className="text-xs text-muted-foreground mt-1">{option.feedback}</p>
                            <Badge variant="secondary" className="mt-2 text-xs">
                              +{option.score} puntos
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  <Button onClick={() => handleNextStage(scenario)} className="w-full">
                    {currentStage < totalStages - 1 ? 'Siguiente Etapa' : 'Ver Resultados'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <ToolContentViewer
      toolType="simulador_ventas"
      title="Simulador de Ventas"
      description="Practica tus habilidades de venta con escenarios interactivos y obtén feedback inmediato"
      renderContent={renderContent}
    />
  );
};

export default Simulador;
