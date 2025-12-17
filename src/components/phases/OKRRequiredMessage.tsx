import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OKRRequiredMessageProps {
  className?: string;
}

export function OKRRequiredMessage({ className }: OKRRequiredMessageProps) {
  const navigate = useNavigate();

  return (
    <div className={`p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        </div>
        <div className="flex-1 space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-amber-500" />
            OKRs No Generados
          </h4>
          <p className="text-xs text-muted-foreground">
            Para que los objetivos de "Progreso General" se actualicen automáticamente, 
            necesitas generar tus <strong>OKRs (Objectives and Key Results)</strong>.
          </p>
          <p className="text-xs text-muted-foreground">
            Los OKRs vinculan tareas con métricas medibles. Cuando completas tareas, 
            los Key Results avanzan y los objetivos se marcan como completados automáticamente.
          </p>
          <Button 
            onClick={() => navigate('/okrs')}
            size="sm"
            className="gap-2 mt-2 bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Target className="h-4 w-4" />
            Generar OKRs
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
