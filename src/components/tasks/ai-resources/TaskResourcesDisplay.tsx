import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, Lightbulb, Wrench, ListChecks, BookOpen, Clock, Target, ChevronRight } from 'lucide-react';

interface StepGuide {
  step_number: number;
  title: string;
  description: string;
  estimated_time_minutes: number;
  tips: string[];
}

interface Template {
  name: string;
  description: string;
  content: string;
  how_to_use: string;
}

interface ProfessionalTip {
  tip: string;
  why_it_works: string;
  example: string;
}

interface RecommendedTool {
  name: string;
  category: string;
  why_recommended: string;
  pricing: string;
}

interface ChecklistItem {
  item: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface TaskResourcesData {
  task_title?: string;
  step_by_step_guide?: StepGuide[];
  templates?: Template[];
  professional_tips?: ProfessionalTip[];
  recommended_tools?: RecommendedTool[];
  quality_checklist?: ChecklistItem[];
  estimated_total_time_hours?: number;
  difficulty_level?: string;
  expected_outcome?: string;
}

interface TaskResourcesDisplayProps {
  resources: TaskResourcesData;
}

export function TaskResourcesDisplay({ resources }: TaskResourcesDisplayProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with metadata */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
        {resources.difficulty_level && (
          <Badge variant="outline" className="gap-1">
            <Target className="w-3 h-3" />
            {resources.difficulty_level}
          </Badge>
        )}
        {resources.estimated_total_time_hours && (
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            {resources.estimated_total_time_hours}h estimadas
          </Badge>
        )}
      </div>

      {resources.expected_outcome && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3">
            <p className="text-sm">
              <strong>Resultado esperado:</strong> {resources.expected_outcome}
            </p>
          </CardContent>
        </Card>
      )}

      <Accordion type="multiple" defaultValue={['steps', 'tips']} className="space-y-2">
        {/* Step by Step Guide */}
        {resources.step_by_step_guide && resources.step_by_step_guide.length > 0 && (
          <AccordionItem value="steps" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="font-semibold">Guía Paso a Paso</span>
                <Badge variant="secondary" className="ml-2">{resources.step_by_step_guide.length} pasos</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                {resources.step_by_step_guide.map((step, index) => (
                  <div key={index} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                      {step.step_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{step.title}</h4>
                        <Badge variant="outline" className="text-[10px]">
                          <Clock className="w-2.5 h-2.5 mr-1" />
                          {step.estimated_time_minutes}min
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      {step.tips && step.tips.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {step.tips.map((tip, i) => (
                            <p key={i} className="text-xs text-primary flex items-start gap-1">
                              <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />
                              {tip}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Professional Tips */}
        {resources.professional_tips && resources.professional_tips.length > 0 && (
          <AccordionItem value="tips" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold">Tips Profesionales</span>
                <Badge variant="secondary" className="ml-2">{resources.professional_tips.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {resources.professional_tips.map((tip, index) => (
                  <Card key={index} className="border-yellow-500/20 bg-yellow-500/5">
                    <CardContent className="py-3">
                      <p className="font-medium text-sm mb-1">{tip.tip}</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        <strong>Por qué funciona:</strong> {tip.why_it_works}
                      </p>
                      {tip.example && (
                        <p className="text-xs bg-muted/50 p-2 rounded italic">
                          Ejemplo: {tip.example}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Templates */}
        {resources.templates && resources.templates.length > 0 && (
          <AccordionItem value="templates" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-violet-500" />
                <span className="font-semibold">Plantillas</span>
                <Badge variant="secondary" className="ml-2">{resources.templates.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {resources.templates.map((template, index) => (
                  <Card key={index}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </CardHeader>
                    <CardContent className="py-2">
                      <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                        {template.content}
                      </pre>
                      <p className="text-xs text-muted-foreground mt-2">
                        <strong>Cómo usar:</strong> {template.how_to_use}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Recommended Tools */}
        {resources.recommended_tools && resources.recommended_tools.length > 0 && (
          <AccordionItem value="tools" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-500" />
                <span className="font-semibold">Herramientas Recomendadas</span>
                <Badge variant="secondary" className="ml-2">{resources.recommended_tools.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-3 pt-2">
                {resources.recommended_tools.map((tool, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Wrench className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{tool.name}</h4>
                        <Badge variant="outline" className="text-[10px]">{tool.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{tool.why_recommended}</p>
                      <p className="text-xs text-primary mt-1">{tool.pricing}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Quality Checklist */}
        {resources.quality_checklist && resources.quality_checklist.length > 0 && (
          <AccordionItem value="checklist" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-emerald-500" />
                <span className="font-semibold">Checklist de Calidad</span>
                <Badge variant="secondary" className="ml-2">{resources.quality_checklist.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {resources.quality_checklist.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{item.item}</span>
                        <Badge className={`text-[10px] ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}