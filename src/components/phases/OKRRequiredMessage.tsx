import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight, Target, Info } from 'lucide-react';
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
        <div className="flex-1 space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-amber-500" />
            OKRs Personales No Generados
          </h4>
          <p className="text-xs text-muted-foreground">
            Para completar las tareas vinculadas a estos objetivos, primero debes 
            crear tus <strong>OKRs personales</strong> en la sección de Métricas.
          </p>
          
          <div className="p-3 rounded-md bg-muted/50 space-y-2">
            <p className="text-xs font-medium flex items-center gap-1">
              <Info className="h-3 w-3" />
              ¿Cómo funciona?
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Los objetivos NO se pueden manipular manualmente</li>
              <li>• Se actualizan automáticamente mediante el sistema de OKRs</li>
              <li>• Cada objetivo tiene Key Results (KRs) con métricas: inicio → actual → meta</li>
              <li>• Cuando completas tareas vinculadas a KRs, el valor actual aumenta</li>
              <li>• Cuando actual ≥ meta, el objetivo se marca como completado</li>
            </ul>
          </div>
          
          <Button 
            onClick={() => navigate('/okrs')}
            size="sm"
            className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Target className="h-4 w-4" />
            Crear OKRs Personales
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
