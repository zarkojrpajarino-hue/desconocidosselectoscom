import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BookOpen, ChevronDown, Lightbulb, ListChecks, Calendar, Wrench } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface PlaybookData {
  title: string;
  description: string;
  steps: string[];
  tips: string[];
  resources?: string[];
  daily_focus?: string[];
}

interface OKRPlaybookProps {
  playbook: PlaybookData;
  objectiveTitle?: string;
  className?: string;
}

export function OKRPlaybook({ playbook, objectiveTitle, className }: OKRPlaybookProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);

  if (!playbook) return null;

  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn("border-primary/20 bg-gradient-to-br from-primary/5 to-background", className)}>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {playbook.title || 'Playbook Semanal'}
                <Badge variant="secondary" className="ml-2">IA</Badge>
              </CardTitle>
              <ChevronDown className={cn(
                "h-5 w-5 transition-transform text-muted-foreground",
                isOpen && "rotate-180"
              )} />
            </div>
            {playbook.description && (
              <p className="text-sm text-muted-foreground text-left mt-1">
                {playbook.description}
              </p>
            )}
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Pasos */}
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-3 text-foreground">
                <ListChecks className="h-4 w-4 text-primary" />
                Pasos para el Éxito
              </h4>
              <ol className="space-y-2">
                {playbook.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Tips */}
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-3 text-foreground">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Tips Profesionales
              </h4>
              <ul className="space-y-2">
                {playbook.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-amber-500 mt-1">💡</span>
                    <span className="text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Enfoque Diario */}
            {playbook.daily_focus && playbook.daily_focus.length > 0 && (
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3 text-foreground">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  Enfoque Diario
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  {playbook.daily_focus.slice(0, 5).map((focus, index) => (
                    <div 
                      key={index}
                      className="p-3 rounded-lg bg-muted/50 border text-center"
                    >
                      <span className="text-xs font-semibold text-primary block mb-1">
                        {days[index]}
                      </span>
                      <span className="text-xs text-muted-foreground">{focus}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recursos */}
            {playbook.resources && playbook.resources.length > 0 && (
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3 text-foreground">
                  <Wrench className="h-4 w-4 text-green-500" />
                  Recursos Recomendados
                </h4>
                <div className="flex flex-wrap gap-2">
                  {playbook.resources.map((resource, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {resource}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
