import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, ChevronRight, Target, CheckSquare, BookOpen, 
  Sparkles, RefreshCw, Play, Clock, TrendingUp, Rocket,
  AlertCircle, CheckCircle2, Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusinessPhases, BusinessPhase } from '@/hooks/useBusinessPhases';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface PhaseTimelineProps {
  view?: 'timeline' | 'cards' | 'kanban';
  showPlaybooks?: boolean;
  compact?: boolean;
}

export function PhaseTimeline({ 
  view = 'cards', 
  showPlaybooks = true,
  compact = false 
}: PhaseTimelineProps) {
  const { currentOrganizationId, userOrganizations } = useAuth();
  
  // Check if user is admin for current organization
  const isAdmin = userOrganizations.find(
    org => org.organization_id === currentOrganizationId
  )?.role === 'admin';

  const {
    phases,
    isLoading,
    isGenerating,
    activePhase,
    overallProgress,
    generatePhases,
    regeneratePhase,
    toggleChecklistItem,
    updateObjectiveProgress,
    activatePhase,
  } = useBusinessPhases({ organizationId: currentOrganizationId });

  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  const toggleExpanded = (phaseId: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  if (isLoading) {
    return <PhaseTimelineSkeleton />;
  }

  if (phases.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <Rocket className="h-12 w-12 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">Genera tu Roadmap Personalizado</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              La IA creará 4 fases de negocio personalizadas con objetivos, 
              tareas y playbooks basados en tu contexto específico.
            </p>
          </div>
          {isAdmin && (
            <Button 
              onClick={() => generatePhases(undefined)} 
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generando con IA...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generar Fases con IA
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Compact view for dashboard
  if (compact) {
    return (
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Fase del Negocio
              <Badge variant="outline" className="text-xs">
                {phases[0]?.methodology === 'lean_startup' ? 'Lean Startup' : 'Scaling Up'}
              </Badge>
            </CardTitle>
            <span className="text-xl font-bold text-primary">{overallProgress}%</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Horizontal Phase Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {phases.map((phase) => {
              const isActive = phase.status === 'active';
              const isCompleted = phase.status === 'completed';
              return (
                <div
                  key={phase.id}
                  className={cn(
                    "p-3 rounded-lg border transition-all cursor-pointer",
                    isActive && "bg-primary text-primary-foreground border-primary shadow-md",
                    isCompleted && "bg-green-50 dark:bg-green-900/20 border-green-500",
                    !isActive && !isCompleted && "bg-muted/50 hover:bg-muted"
                  )}
                  onClick={() => toggleExpanded(phase.id)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {isActive && <Play className="h-3 w-3" />}
                    {isCompleted && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                    <span className="font-semibold text-sm">Fase {phase.phase_number}</span>
                  </div>
                  <p className={cn(
                    "text-xs line-clamp-2",
                    isActive ? "text-primary-foreground/90" : "text-muted-foreground"
                  )}>
                    {phase.phase_name}
                  </p>
                  <Progress 
                    value={phase.progress_percentage || 0} 
                    className={cn("h-1 mt-2", isActive && "[&>div]:bg-white")}
                  />
                  <span className={cn(
                    "text-xs mt-1 block",
                    isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    {phase.progress_percentage || 0}% completado
                  </span>
                </div>
              );
            })}
          </div>

          {/* Active Phase Details */}
          {activePhase && (
            <div className="p-4 rounded-lg bg-muted/30 border">
              <h4 className="font-semibold text-sm mb-1">
                Fase actual: {activePhase.phase_name}
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                {activePhase.phase_description}
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{activePhase.objectives?.length || 0} objetivos</span>
                <span>•</span>
                <span>{activePhase.checklist?.length || 0} tareas</span>
                <span>•</span>
                <span>{activePhase.duration_weeks} semanas</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-semibold">Progreso General</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
              {isAdmin && (
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
                      Regenerar Todo
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          <Progress value={overallProgress} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Fase actual: {activePhase?.phase_name || 'Ninguna activa'}</span>
            <span>{phases.filter(p => p.status === 'completed').length}/{phases.length} fases completadas</span>
          </div>
        </CardContent>
      </Card>

      {/* View Tabs */}
      <Tabs defaultValue={view} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="cards">Tarjetas</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="space-y-4">
          {phases.map((phase) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              isExpanded={expandedPhases.has(phase.id)}
              onToggleExpand={() => toggleExpanded(phase.id)}
              onToggleTask={(index) => toggleChecklistItem(phase.id, index)}
              onUpdateObjective={(index, value) => updateObjectiveProgress(phase.id, index, value)}
              onActivate={() => activatePhase(phase.phase_number)}
              onRegenerate={() => regeneratePhase(phase.phase_number)}
              isAdmin={isAdmin}
              showPlaybooks={showPlaybooks}
              compact={compact}
            />
          ))}
        </TabsContent>

        <TabsContent value="timeline">
          <TimelineView 
            phases={phases} 
            activePhase={activePhase}
            onActivate={activatePhase}
            isAdmin={isAdmin}
          />
        </TabsContent>

        <TabsContent value="kanban">
          <KanbanView 
            phases={phases}
            onToggleTask={toggleChecklistItem}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Phase Card Component
interface PhaseCardProps {
  phase: BusinessPhase;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleTask: (index: number) => void;
  onUpdateObjective: (index: number, value: number) => void;
  onActivate: () => void;
  onRegenerate: () => void;
  isAdmin: boolean;
  showPlaybooks: boolean;
  compact: boolean;
}

function PhaseCard({
  phase,
  isExpanded,
  onToggleExpand,
  onToggleTask,
  onUpdateObjective,
  onActivate,
  onRegenerate,
  isAdmin,
  showPlaybooks,
  compact,
}: PhaseCardProps) {
  const statusConfig = {
    pending: { color: 'bg-muted text-muted-foreground', icon: Circle, label: 'Pendiente' },
    active: { color: 'bg-primary text-primary-foreground', icon: Play, label: 'Activa' },
    completed: { color: 'bg-green-500 text-white', icon: CheckCircle2, label: 'Completada' },
    skipped: { color: 'bg-orange-500 text-white', icon: AlertCircle, label: 'Omitida' },
  };

  const config = statusConfig[phase.status];
  const StatusIcon = config.icon;
  const completedTasks = phase.checklist.filter(t => t.completed).length;
  const completedObjectives = phase.objectives.filter(o => o.current >= o.target).length;

  return (
    <Card className={cn(
      "transition-all duration-200",
      phase.status === 'active' && "ring-2 ring-primary shadow-lg"
    )}>
      <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold",
                config.color
              )}>
                {phase.phase_number}
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {phase.phase_name}
                  <Badge variant="outline" className="text-xs">
                    {phase.methodology === 'lean_startup' ? 'Lean' : 'Scale'}
                  </Badge>
                </CardTitle>
                <CardDescription>{phase.phase_description}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={config.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium">{phase.progress_percentage || 0}%</span>
            </div>
            <Progress value={phase.progress_percentage || 0} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completedObjectives}/{phase.objectives.length} objetivos</span>
              <span>{completedTasks}/{phase.checklist.length} tareas</span>
              {phase.duration_weeks && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {phase.duration_weeks} semanas
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-4 space-y-6">
            {/* Objectives Section */}
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-primary" />
                Objetivos ({completedObjectives}/{phase.objectives.length})
              </h4>
              <div className="space-y-3">
                {phase.objectives.map((obj, index) => {
                  const progress = obj.target > 0 ? (obj.current / obj.target) * 100 : 0;
                  const isComplete = obj.current >= obj.target;
                  
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className={cn(isComplete && "line-through text-muted-foreground")}>
                          {obj.name}
                        </span>
                        <span className="font-medium">
                          {obj.current}/{obj.target}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(progress, 100)} 
                        className={cn("h-1.5", isComplete && "bg-green-100 [&>div]:bg-green-500")} 
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Checklist Section */}
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <CheckSquare className="h-4 w-4 text-primary" />
                Checklist ({completedTasks}/{phase.checklist.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {phase.checklist.map((item, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "flex items-start gap-3 p-2 rounded-lg transition-colors",
                      item.completed ? "bg-muted/50" : "hover:bg-muted/30"
                    )}
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => onToggleTask(index)}
                      disabled={phase.status === 'pending'}
                    />
                    <div className="flex-1">
                      <span className={cn(
                        "text-sm",
                        item.completed && "line-through text-muted-foreground"
                      )}>
                        {item.task}
                      </span>
                      {item.category && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {item.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Playbook Section */}
            {showPlaybooks && phase.playbook && (
              <div className="border-t pt-4">
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Playbook: {phase.playbook.title}
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {phase.playbook.description}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium mb-2">Pasos</h5>
                    <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground">
                      {phase.playbook.steps.slice(0, 5).map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium mb-2">💡 Tips</h5>
                    <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                      {phase.playbook.tips.slice(0, 3).map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            {isAdmin && (
              <div className="flex gap-2 pt-4 border-t">
                {phase.status === 'pending' && (
                  <Button onClick={onActivate} size="sm" className="gap-2">
                    <Play className="h-4 w-4" />
                    Activar Fase
                  </Button>
                )}
                {(phase.regeneration_count || 0) < 2 && (
                  <Button onClick={onRegenerate} variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Regenerar ({2 - (phase.regeneration_count || 0)} restantes)
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// Timeline View Component
function TimelineView({ 
  phases, 
  activePhase,
  onActivate,
  isAdmin,
}: { 
  phases: BusinessPhase[];
  activePhase: BusinessPhase | undefined;
  onActivate: (phaseNumber: number) => void;
  isAdmin: boolean;
}) {
  return (
    <div className="relative pl-8">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
      
      {phases.map((phase, index) => {
        const isActive = phase.status === 'active';
        const isCompleted = phase.status === 'completed';
        
        return (
          <div key={phase.id} className="relative pb-8 last:pb-0">
            {/* Circle marker */}
            <div className={cn(
              "absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold -translate-x-1/2",
              isActive && "bg-primary text-primary-foreground ring-4 ring-primary/20",
              isCompleted && "bg-green-500 text-white",
              !isActive && !isCompleted && "bg-muted text-muted-foreground"
            )}>
              {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : phase.phase_number}
            </div>
            
            {/* Content */}
            <div className="ml-8 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{phase.phase_name}</h4>
                {phase.duration_weeks && (
                  <Badge variant="outline" className="text-xs">
                    {phase.duration_weeks} semanas
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {phase.phase_description}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{phase.objectives.length} objetivos</span>
                <span>{phase.checklist.length} tareas</span>
                <span>{phase.progress_percentage || 0}% completado</span>
              </div>
              {isAdmin && phase.status === 'pending' && index === (activePhase?.phase_number || 0) && (
                <Button 
                  onClick={() => onActivate(phase.phase_number)} 
                  size="sm" 
                  className="mt-2"
                >
                  Activar Fase
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Kanban View Component
function KanbanView({ 
  phases,
  onToggleTask,
}: { 
  phases: BusinessPhase[];
  onToggleTask: (phaseId: string, index: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {phases.map((phase) => (
        <Card key={phase.id} className="h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Fase {phase.phase_number}</span>
              <Badge variant={phase.status === 'active' ? 'default' : 'outline'} className="text-xs">
                {phase.progress_percentage || 0}%
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">{phase.phase_name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {phase.checklist.map((item, index) => (
              <div 
                key={index}
                className={cn(
                  "p-2 rounded border text-xs cursor-pointer transition-colors",
                  item.completed 
                    ? "bg-muted/50 text-muted-foreground line-through" 
                    : "hover:bg-muted/30"
                )}
                onClick={() => onToggleTask(phase.id, index)}
              >
                {item.task}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Skeleton
function PhaseTimelineSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-40 w-full" />
      ))}
    </div>
  );
}
