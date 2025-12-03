import { useState } from 'react';
import { useStartupGuide, GuideStep } from '@/hooks/useStartupGuide';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle2, 
  Circle, 
  Play, 
  Trophy, 
  Target, 
  Lightbulb, 
  ExternalLink,
  Clock,
  Award,
  Loader2,
  Rocket,
  Settings,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Target }> = {
  validation: { label: 'Validación', icon: Target },
  product: { label: 'Producto', icon: Lightbulb },
  market: { label: 'Mercado', icon: TrendingUp },
  growth: { label: 'Crecimiento', icon: Rocket },
  operations: { label: 'Operaciones', icon: Settings },
};

interface StartupGuideInteractiveProps {
  organizationId: string;
}

export const StartupGuideInteractive = ({ organizationId }: StartupGuideInteractiveProps) => {
  const {
    steps,
    progress,
    achievements,
    metrics,
    loading,
    updateStepStatus,
    canStartStep,
    getCategoryProgress,
    getNextStep,
  } = useStartupGuide(organizationId);

  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const currentStep = steps.find((s) => s.id === selectedStep);
  const currentProgress = selectedStep ? progress[selectedStep] : null;

  const handleStartStep = (stepId: string) => {
    updateStepStatus(stepId, 'in_progress');
  };

  const handleCompleteStep = (stepId: string) => {
    updateStepStatus(stepId, 'completed', notes.trim() ? { notes } : undefined);
    setNotes('');
    setSelectedStep(null);
  };

  const handleSaveNotes = (stepId: string) => {
    updateStepStatus(stepId, progress[stepId]?.status || 'in_progress', { notes });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const nextStep = getNextStep();

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progreso General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics?.overall_progress_percentage?.toFixed(0) || 0}%</div>
            <Progress value={metrics?.overall_progress_percentage || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pasos Completados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics?.completed_steps || 0}/{metrics?.total_steps || 15}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Puntos Ganados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              {metrics?.total_points || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Logros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              {achievements.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Tus Logros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-2 bg-background border rounded-lg px-4 py-2">
                  <span className="text-2xl">{achievement.achievement_icon}</span>
                  <div>
                    <p className="font-semibold">{achievement.achievement_name}</p>
                    <p className="text-xs text-muted-foreground">{achievement.achievement_description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Siguiente paso */}
      {nextStep && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Siguiente Paso Recomendado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="font-semibold text-lg">Paso {nextStep.step_number}: {nextStep.title}</p>
                <p className="text-sm text-muted-foreground">{nextStep.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    ~{nextStep.estimated_time_hours}h
                  </span>
                  <span className="flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    {nextStep.points} puntos
                  </span>
                </div>
              </div>
              <Button onClick={() => { setSelectedStep(nextStep.id); handleStartStep(nextStep.id); }}>
                <Play className="h-4 w-4 mr-2" />
                Empezar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs por categoría */}
      <Tabs defaultValue="validation" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            const categoryProgress = getCategoryProgress(key);
            return (
              <TabsTrigger key={key} value={key} className="gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{config.label}</span>
                <Badge variant="secondary" className="ml-1">{categoryProgress.completed}/{categoryProgress.total}</Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.keys(CATEGORY_CONFIG).map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            {steps.filter((step) => step.category === category).map((step) => {
              const stepProgress = progress[step.id];
              const isCompleted = stepProgress?.status === 'completed';
              const isInProgress = stepProgress?.status === 'in_progress';
              const canStart = canStartStep(step);
              const isSelected = selectedStep === step.id;

              return (
                <Card
                  key={step.id}
                  className={cn(
                    'cursor-pointer transition-all hover:border-primary/50',
                    isCompleted && 'border-green-500/50 bg-green-500/5',
                    isInProgress && 'border-primary/50 bg-primary/5',
                    isSelected && 'ring-2 ring-primary',
                    !canStart && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={() => canStart && setSelectedStep(isSelected ? null : step.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {isCompleted ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                          ) : isInProgress ? (
                            <Play className="h-6 w-6 text-primary" />
                          ) : (
                            <Circle className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base">Paso {step.step_number}: {step.title}</CardTitle>
                          <CardDescription className="mt-1">{step.description}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={isCompleted ? 'default' : 'outline'}>{step.points} pts</Badge>
                    </div>
                  </CardHeader>

                  {isSelected && (
                    <CardContent className="space-y-4 border-t pt-4">
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap text-sm">{step.detailed_guide}</p>
                      </div>

                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                        <p className="text-sm font-semibold mb-1">✅ Criterio de éxito:</p>
                        <p className="text-sm">{step.success_criteria}</p>
                      </div>

                      {step.tips && step.tips.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">💡 Tips:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {step.tips.map((tip, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground">{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {step.recommended_tools && step.recommended_tools.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">🛠️ Herramientas:</p>
                          <div className="flex flex-wrap gap-2">
                            {step.recommended_tools.map((tool) => (
                              <Badge key={tool} variant="outline">{tool}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {step.external_links && step.external_links.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">📚 Recursos:</p>
                          <div className="space-y-1">
                            {step.external_links.map((link, idx) => (
                              <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                                <ExternalLink className="h-3 w-3" />
                                {link.title}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-sm font-semibold">📝 Tus notas:</p>
                        <Textarea
                          placeholder="Añade notas, aprendizajes o progreso..."
                          value={notes || stepProgress?.notes || ''}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={4}
                        />
                      </div>

                      <div className="flex gap-2 justify-end pt-2">
                        {!isCompleted && (
                          <>
                            {notes.trim() && (
                              <Button variant="outline" onClick={() => handleSaveNotes(step.id)}>
                                Guardar Notas
                              </Button>
                            )}
                            <Button onClick={() => handleCompleteStep(step.id)}>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Marcar como Completado
                            </Button>
                          </>
                        )}
                        {isCompleted && stepProgress?.completed_at && (
                          <p className="text-xs text-muted-foreground">
                            Completado el {new Date(stepProgress.completed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
