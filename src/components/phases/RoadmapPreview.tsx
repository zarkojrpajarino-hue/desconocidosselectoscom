import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles, TrendingUp, Target, Calendar, ArrowRight, Rocket, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBusinessPhases } from '@/hooks/useBusinessPhases';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface RoadmapPreviewProps {
  organizationId?: string;
}

export function RoadmapPreview({ organizationId }: RoadmapPreviewProps) {
  const navigate = useNavigate();
  const { currentOrganizationId, userOrganizations } = useAuth();
  
  const orgId = organizationId || currentOrganizationId;
  
  const isAdmin = userOrganizations.find(
    org => org.organization_id === orgId
  )?.role === 'admin';

  const {
    phases,
    isLoading,
    isGenerating,
    activePhase,
    overallProgress,
    generatePhases,
  } = useBusinessPhases({ organizationId: orgId });

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-6 w-48" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Si no hay fases, mostrar botón para generar
  if (phases.length === 0) {
    return (
      <Card className="border-dashed border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-violet-500/5">
        <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
            <Rocket className="h-8 w-8 text-white" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="font-bold text-xl">Genera tu Roadmap con IA</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              Crea un plan estratégico personalizado con fases, objetivos, 
              tareas y proyecciones basadas en los datos de tu negocio.
            </p>
          </div>
          {isAdmin && (
            <Button 
              onClick={() => generatePhases(undefined)} 
              disabled={isGenerating}
              size="lg"
              className="gap-2 bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Generando Roadmap...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generar Roadmap Estratégico
                </>
              )}
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            Incluye: 4 fases de crecimiento, objetivos medibles, tareas asignables y playbooks
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calcular métricas del roadmap
  const totalObjectives = phases.reduce((acc, p) => acc + (p.objectives?.length || 0), 0);
  const totalTasks = phases.reduce((acc, p) => acc + (p.checklist?.length || 0), 0);
  const completedTasks = phases.reduce((acc, p) => 
    acc + (p.checklist?.filter(t => t.completed)?.length || 0), 0
  );
  const totalWeeks = phases.reduce((acc, p) => acc + (p.duration_weeks || 0), 0);

  return (
    <Card className="shadow-card border-2 border-primary/20 overflow-hidden">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-primary/10 via-violet-500/10 to-indigo-500/10 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Roadmap Estratégico con IA</CardTitle>
              <CardDescription>
                Plan de crecimiento personalizado para tu negocio
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <span className="text-3xl font-bold text-primary">{overallProgress}%</span>
              <p className="text-xs text-muted-foreground">Progreso total</p>
            </div>
            <Button 
              onClick={() => navigate('/ai-analysis')}
              variant="outline"
              className="gap-2"
            >
              Ver Análisis Completo
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-4 md:p-6">
        {/* Barra de progreso */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progreso del Roadmap</span>
            <span className="font-medium">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </div>

        {/* Métricas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <div className="text-2xl font-bold text-primary">{phases.length}</div>
            <div className="text-xs text-muted-foreground">Fases</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <div className="text-2xl font-bold text-violet-500">{totalObjectives}</div>
            <div className="text-xs text-muted-foreground">Objetivos</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <div className="text-2xl font-bold text-indigo-500">{completedTasks}/{totalTasks}</div>
            <div className="text-xs text-muted-foreground">Tareas</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <div className="text-2xl font-bold text-emerald-500">{totalWeeks}</div>
            <div className="text-xs text-muted-foreground">Semanas</div>
          </div>
        </div>

        {/* Timeline simplificado de fases */}
        <div className="relative">
          {/* Línea horizontal */}
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-violet-500 to-indigo-500 hidden md:block" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {phases.map((phase, index) => {
              const isActive = phase.status === 'active';
              const isCompleted = phase.status === 'completed';
              
              return (
                <div key={phase.id} className="relative">
                  {/* Punto del timeline - solo desktop */}
                  <div className={`hidden md:flex absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 ${
                    isActive ? 'bg-primary border-primary' : 
                    isCompleted ? 'bg-emerald-500 border-emerald-500' : 
                    'bg-background border-muted-foreground/30'
                  }`} />
                  
                  {/* Card de fase */}
                  <div className={`mt-0 md:mt-8 p-3 rounded-lg border transition-all ${
                    isActive ? 'bg-primary/10 border-primary shadow-md' :
                    isCompleted ? 'bg-emerald-500/10 border-emerald-500/50' :
                    'bg-muted/30 border-muted'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {isActive && <TrendingUp className="h-3 w-3 text-primary" />}
                      <span className="text-xs font-semibold">Fase {phase.phase_number}</span>
                      {isCompleted && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                          ✓
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {phase.phase_name}
                    </p>
                    <Progress 
                      value={phase.progress_percentage || 0} 
                      className="h-1"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {phase.progress_percentage || 0}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fase activa destacada */}
        {activePhase && (
          <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm">Fase Activa: {activePhase.phase_name}</h4>
                  <Badge variant="secondary" className="text-[10px]">
                    {activePhase.duration_weeks} semanas
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {activePhase.phase_description}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {activePhase.objectives?.length || 0} objetivos
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {activePhase.checklist?.filter(t => t.completed)?.length || 0}/{activePhase.checklist?.length || 0} tareas
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botón para regenerar - solo admin */}
        {isAdmin && (
          <div className="mt-4 flex justify-end">
            <Button 
              onClick={() => generatePhases(undefined)} 
              disabled={isGenerating}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Regenerando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Regenerar Roadmap
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
