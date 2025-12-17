import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { HelpCircle, ChevronDown, ChevronRight, Info, Target, ListTodo, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HowItWorksExplainerProps {
  type: 'checklist' | 'objectives' | 'progress';
  className?: string;
}

export function HowItWorksExplainer({ type, className }: HowItWorksExplainerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const content = {
    checklist: {
      icon: ListTodo,
      title: '¿Cómo funciona el Checklist?',
      description: (
        <div className="space-y-3 text-xs text-muted-foreground">
          <p className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              <strong className="text-foreground">El checklist NO se puede manipular manualmente.</strong> Se actualiza 
              automáticamente cuando completas tareas asignadas.
            </span>
          </p>
          <div className="pl-6 space-y-2">
            <p><strong>¿Cómo se marca como completado un ítem?</strong></p>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>Cada ítem del checklist está vinculado a tareas reales</li>
              <li>Cuando completas una tarea en tu agenda semanal, el ítem se marca</li>
              <li>El líder debe validar tu tarea para que cuente como completada</li>
              <li>El progreso de la fase se calcula automáticamente</li>
            </ol>
          </div>
          <p className="flex items-start gap-2 bg-primary/5 p-2 rounded-lg">
            <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              <strong className="text-foreground">Objetivo:</strong> Garantizar que el progreso refleje trabajo real 
              validado, no marcaciones manuales sin verificación.
            </span>
          </p>
        </div>
      ),
    },
    objectives: {
      icon: Target,
      title: '¿Cómo se completan los Objetivos?',
      description: (
        <div className="space-y-3 text-xs text-muted-foreground">
          <p className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              <strong className="text-foreground">Los objetivos NO se pueden manipular manualmente.</strong> Se actualizan 
              automáticamente mediante el sistema de OKRs (Objectives and Key Results).
            </span>
          </p>
          <div className="pl-6 space-y-2">
            <p><strong>¿Cómo funciona?</strong></p>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>Cada objetivo de fase tiene un Key Result (KR) vinculado</li>
              <li>Los KRs tienen métricas: inicio, actual, meta (ej: 0 → 100 clientes)</li>
              <li>Cuando completas tareas vinculadas a KRs, el valor actual aumenta</li>
              <li>Cuando <code className="bg-muted px-1 rounded">actual ≥ meta</code>, el objetivo se marca completado</li>
            </ol>
          </div>
          <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/30">
            <p className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong className="text-amber-600 dark:text-amber-400">Importante:</strong> Para que los objetivos se actualicen, 
                debes tener OKRs generados. Ve a <strong>Métricas → OKRs</strong> para generarlos.
              </span>
            </p>
          </div>
        </div>
      ),
    },
    progress: {
      icon: TrendingUp,
      title: '¿Cómo se calcula el Progreso General?',
      description: (
        <div className="space-y-3 text-xs text-muted-foreground">
          <p className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              <strong className="text-foreground">El progreso es automático y no manipulable.</strong> Refleja el trabajo 
              real completado por el equipo.
            </span>
          </p>
          <div className="pl-6 space-y-2">
            <p><strong>Fórmula de cálculo:</strong></p>
            <div className="bg-muted p-2 rounded font-mono text-[10px]">
              Progreso = (Tareas Completadas ÷ Total Tareas) × 100
            </div>
            <p><strong>El progreso aumenta cuando:</strong></p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Un miembro del equipo completa una tarea</li>
              <li>El líder valida la tarea completada</li>
              <li>Ambas condiciones deben cumplirse</li>
            </ul>
          </div>
          <p className="flex items-start gap-2 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/30">
            <Target className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              Cuando el progreso llega al <strong className="text-emerald-600">100%</strong>, la fase se completa 
              automáticamente y se activa la siguiente.
            </span>
          </p>
        </div>
      ),
    },
  };

  const { icon: Icon, title, description } = content[type];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn("mt-3", className)}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <HelpCircle className="h-3.5 w-3.5" />
          {title}
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 p-3 rounded-lg bg-muted/50 border animate-in slide-in-from-top-2">
        {description}
      </CollapsibleContent>
    </Collapsible>
  );
}
