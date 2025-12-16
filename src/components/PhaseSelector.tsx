import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { TrendingUp, Sparkles, RefreshCw, Play, CheckCircle2 } from 'lucide-react';
import { useBusinessPhases } from '@/hooks/useBusinessPhases';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface PhaseSelectorProps {
  currentPhase: number;
  onPhaseChange: () => void;
}

const PhaseSelector = ({ currentPhase, onPhaseChange }: PhaseSelectorProps) => {
  const { currentOrganizationId, userOrganizations } = useAuth();
  const isAdmin = userOrganizations.find(
    org => org.organization_id === currentOrganizationId
  )?.role === 'admin';

  const {
    phases,
    isLoading,
    isGenerating,
    activePhase,
    generatePhases,
    activatePhase,
  } = useBusinessPhases({ organizationId: currentOrganizationId });

  const [activatingPhase, setActivatingPhase] = useState<number | null>(null);

  const handlePhaseChange = async (phaseNumber: number) => {
    if (activatingPhase || !isAdmin) return;

    try {
      setActivatingPhase(phaseNumber);
      await activatePhase(phaseNumber);
      onPhaseChange();
    } catch (error) {
      console.error('Error changing phase:', error);
      toast.error('Error al cambiar fase');
    } finally {
      setActivatingPhase(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Fase del Negocio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no phases exist, show generate button
  if (phases.length === 0) {
    return (
      <Card className="shadow-card border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
          <TrendingUp className="h-10 w-10 text-muted-foreground" />
          <div className="text-center">
            <h3 className="font-semibold">Fases de Negocio</h3>
            <p className="text-sm text-muted-foreground">
              Genera fases personalizadas con IA basadas en tu negocio
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
                  Generando...
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

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Fase del Negocio
          {activePhase && (
            <Badge variant="outline" className="ml-2">
              {activePhase.methodology === 'lean_startup' ? 'Lean Startup' : 'Scaling Up'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {phases.map((phase) => {
            const isActive = phase.status === 'active';
            const isCompleted = phase.status === 'completed';
            const isActivating = activatingPhase === phase.phase_number;
            const canActivate = isAdmin && phase.status === 'pending' && 
              (phase.phase_number === 1 || phases.find(p => p.phase_number === phase.phase_number - 1)?.status === 'completed');
            
            return (
              <Button
                key={phase.id}
                onClick={() => canActivate && handlePhaseChange(phase.phase_number)}
                variant={isActive ? 'default' : 'outline'}
                disabled={!canActivate && !isActive}
                className={cn(
                  "h-auto py-4 flex flex-col gap-2 relative",
                  isActive && "bg-gradient-primary hover:opacity-90 ring-2 ring-primary/20",
                  isCompleted && "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800",
                  !canActivate && !isActive && !isCompleted && "opacity-60"
                )}
              >
                {isCompleted && (
                  <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-green-500" />
                )}
                
                {isActivating ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                    <span className="font-bold text-sm">Activando...</span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      {isActive && <Play className="h-4 w-4" />}
                      <span className="font-bold text-lg">Fase {phase.phase_number}</span>
                    </div>
                    <span className="text-xs opacity-80 text-center line-clamp-1">
                      {phase.phase_name}
                    </span>
                    <Progress 
                      value={phase.progress_percentage || 0} 
                      className="h-1 w-full mt-1" 
                    />
                    <span className="text-xs opacity-60">
                      {phase.progress_percentage || 0}% completado
                    </span>
                  </>
                )}
              </Button>
            );
          })}
        </div>
        
        {activePhase && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Fase actual:</span> {activePhase.phase_name}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {activePhase.phase_description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhaseSelector;
