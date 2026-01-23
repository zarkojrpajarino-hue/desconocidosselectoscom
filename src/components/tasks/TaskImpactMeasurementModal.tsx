import { useState, useEffect } from 'react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, Target, DollarSign, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { impactMeasurementSchema } from '@/lib/taskValidation';

interface TaskImpactMeasurementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  taskDescription?: string;
  taskArea?: string;
  onSubmit: (data: ImpactMeasurementData) => Promise<void>;
}

interface AIQuestion {
  id: string;
  question: string;
  type: 'text' | 'number' | 'percentage' | 'currency' | 'multiselect';
  options?: string[];
  placeholder?: string;
  unit?: string;
}

interface TaskMetric {
  metric: string;
  value: string;
  unit: string;
}

interface StructuredMetrics {
  area: string;
  captured_at: string;
  revenue?: number;
  orders?: number;
  avg_ticket?: number;
  margin?: number;
  leads?: number;
  conversion_rate?: number;
  cac?: number;
  roi?: number;
  time_hours?: number;
  capacity?: number;
  error_rate?: number;
  cost?: number;
  nps?: number;
  repeat_rate?: number;
  ltv?: number;
  satisfaction?: number;
  ai_context?: Record<string, string | number | string[]>;
}

interface ImpactMeasurementData {
  ai_questions: Record<string, string | number | string[]>;
  key_metrics: Array<{ metric: string; value: string; unit: string }>;
  impact_rating: 'exceeded' | 'met' | 'close' | 'below';
  impact_explanation: string;
  future_decisions: string;
  investments_needed: {
    budget?: number;
    tools?: boolean;
    time?: boolean;
    training?: boolean;
    staff?: boolean;
    none?: boolean;
    details?: string;
  };
  task_metrics?: StructuredMetrics;
}

const TaskImpactMeasurementModal = ({
  open,
  onOpenChange,
  taskTitle,
  taskDescription = '',
  taskArea = '',
  onSubmit,
}: TaskImpactMeasurementModalProps) => {
  const [aiQuestions, setAiQuestions] = useState<AIQuestion[]>([]);
  const [aiAnswers, setAiAnswers] = useState<Record<string, string | number | string[]>>({});
  const [loadingAI, setLoadingAI] = useState(false);
  
  // Medición de Impacto
  const [keyMetrics, setKeyMetrics] = useState<Array<{ metric: string; value: string; unit: string }>>([
    { metric: '', value: '', unit: '' }
  ]);
  const [impactRating, setImpactRating] = useState<ImpactMeasurementData['impact_rating'] | ''>('');
  const [impactExplanation, setImpactExplanation] = useState('');
  const [futureDecisions, setFutureDecisions] = useState('');
  const [investmentsNeeded, setInvestmentsNeeded] = useState<ImpactMeasurementData['investments_needed']>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      generateAIQuestions();
    }
  }, [open]);

  const generateAIQuestions = async () => {
    setLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-task-questions', {
        body: {
          taskTitle,
          taskDescription,
          taskArea
        }
      });

      if (error) throw error;

      if (data?.questions) {
        setAiQuestions(data.questions);
      } else {
        // Fallback: preguntas genéricas según área
        setAiQuestions(getFallbackQuestions(taskArea));
      }
    } catch (error) {
      console.error('Error generating AI questions:', error);
      setAiQuestions(getFallbackQuestions(taskArea));
      toast.error('Usando preguntas predeterminadas');
    }
    setLoadingAI(false);
  };

  const getFallbackQuestions = (area: string): AIQuestion[] => {
    const baseQuestions = [
      {
        id: 'q1',
        question: '¿Cuál fue el resultado principal alcanzado?',
        type: 'text' as const,
        placeholder: 'Describe el resultado más importante...'
      },
      {
        id: 'q2',
        question: '¿Qué recursos utilizaste?',
        type: 'multiselect' as const,
        options: ['Presupuesto', 'Herramientas digitales', 'Equipo', 'Tiempo', 'Externos']
      },
      {
        id: 'q3',
        question: '¿Cuál fue el impacto cuantificable?',
        type: 'text' as const,
        placeholder: 'Ejemplo: +25% conversiones, -15% costos...'
      }
    ];
    return baseQuestions;
  };

  const renderAIQuestion = (question: AIQuestion) => {
    switch (question.type) {
      case 'number':
      case 'currency':
      case 'percentage':
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              value={aiAnswers[question.id] || ''}
              onChange={(e) => setAiAnswers({ ...aiAnswers, [question.id]: e.target.value })}
              placeholder={question.placeholder}
              className="flex-1"
            />
            {question.unit && (
              <span className="flex items-center px-3 border rounded-md bg-muted text-sm">
                {question.unit}
              </span>
            )}
          </div>
        );
      
      case 'multiselect':
        return (
          <div className="flex flex-wrap gap-2">
            {question.options?.map((option) => (
              <label
                key={option}
                className="flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-muted"
              >
                <Checkbox
                  checked={Array.isArray(aiAnswers[question.id]) && (aiAnswers[question.id] as string[]).includes(option)}
                  onCheckedChange={(checked) => {
                    const current = Array.isArray(aiAnswers[question.id]) ? (aiAnswers[question.id] as string[]) : [];
                    if (checked) {
                      setAiAnswers({ ...aiAnswers, [question.id]: [...current, option] });
                    } else {
                      setAiAnswers({ ...aiAnswers, [question.id]: current.filter((o) => o !== option) });
                    }
                  }}
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        );
      
      default:
        return (
          <Textarea
            value={aiAnswers[question.id] || ''}
            onChange={(e) => setAiAnswers({ ...aiAnswers, [question.id]: e.target.value })}
            placeholder={question.placeholder}
            rows={3}
            className="resize-none"
          />
        );
    }
  };

  const addMetric = () => {
    setKeyMetrics([...keyMetrics, { metric: '', value: '', unit: '' }]);
  };

  const removeMetric = (index: number) => {
    setKeyMetrics(keyMetrics.filter((_, i) => i !== index));
  };

  const updateMetric = (index: number, field: string, value: string) => {
    const updated = [...keyMetrics];
    updated[index] = { ...updated[index], [field]: value };
    setKeyMetrics(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = {
      ai_questions: aiAnswers,
      key_metrics: keyMetrics.filter(m => m.metric && m.value),
      impact_rating: impactRating as 'exceeded' | 'met' | 'close' | 'below' | undefined,
      impact_explanation: impactExplanation,
      future_decisions: futureDecisions,
      investments_needed: investmentsNeeded
    };

    // Validar con Zod
    const validation = impactMeasurementSchema.safeParse(formData);
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message, {
        description: 'Revisa los campos requeridos'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Estructurar task_metrics para análisis de IA
      const taskMetrics = extractMetricsFromData(keyMetrics, aiAnswers, taskArea);
      
      await onSubmit({
        ai_questions: aiAnswers,
        key_metrics: keyMetrics.filter((m): m is { metric: string; value: string; unit: string } => 
          Boolean(m.metric && m.value)
        ),
        impact_rating: impactRating as ImpactMeasurementData['impact_rating'],
        impact_explanation: impactExplanation,
        future_decisions: futureDecisions,
        investments_needed: investmentsNeeded,
        task_metrics: taskMetrics,
      });
      
      onOpenChange(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Intenta de nuevo';
      console.error('Error al guardar medición:', error);
      toast.error('Error al guardar', {
        description: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Extrae métricas estructuradas según área de la tarea
  const extractMetricsFromData = (
    metrics: TaskMetric[], 
    answers: Record<string, string | number | string[]>, 
    area: string
  ): StructuredMetrics => {
    const structured: StructuredMetrics = {
      area,
      captured_at: new Date().toISOString(),
    };

    // Extraer números de métricas
    metrics.forEach(m => {
      const value = parseFloat(m.value);
      if (!isNaN(value)) {
        const metricName = m.metric.toLowerCase();
        
        // Ventas e ingresos
        if (metricName.includes('ingreso') || metricName.includes('factura') || metricName.includes('€')) {
          structured.revenue = value;
        }
        if (metricName.includes('pedido') || metricName.includes('venta')) {
          structured.orders = value;
        }
        if (metricName.includes('ticket') || metricName.includes('medio')) {
          structured.avg_ticket = value;
        }
        if (metricName.includes('margen')) {
          structured.margin = value;
        }
        
        // Marketing
        if (metricName.includes('lead') || metricName.includes('contacto')) {
          structured.leads = value;
        }
        if (metricName.includes('conversión') || metricName.includes('conversion')) {
          structured.conversion_rate = value;
        }
        if (metricName.includes('cac') || metricName.includes('adquisición')) {
          structured.cac = value;
        }
        if (metricName.includes('roi')) {
          structured.roi = value;
        }
        
        // Operaciones
        if (metricName.includes('tiempo') || metricName.includes('hora')) {
          structured.time_hours = value;
        }
        if (metricName.includes('capacidad')) {
          structured.capacity = value;
        }
        if (metricName.includes('error') || metricName.includes('devolución')) {
          structured.error_rate = value;
        }
        if (metricName.includes('costo')) {
          structured.cost = value;
        }
        
        // Cliente
        if (metricName.includes('nps')) {
          structured.nps = value;
        }
        if (metricName.includes('repetición') || metricName.includes('recurrencia')) {
          structured.repeat_rate = value;
        }
        if (metricName.includes('lifetime') || metricName.includes('ltv')) {
          structured.ltv = value;
        }
        if (metricName.includes('satisfacción') || metricName.includes('rating')) {
          structured.satisfaction = value;
        }
      }
    });

    // Incluir respuestas de IA para contexto
    structured.ai_context = answers;

    return structured;
  };

  const suggestedMetrics = [
    '💰 Ingresos', '👥 Usuarios', '📈 Conversiones', 
    '⏱️ Tiempo ahorrado', '💸 Costos', '📊 ROI'
  ];

  const impactRatingOptions = [
    { value: 'exceeded', label: 'Superó expectativas', emoji: '🚀', desc: '+50%' },
    { value: 'met', label: 'Cumplió expectativas', emoji: '✅', desc: '90-100%' },
    { value: 'close', label: 'Cercano a objetivo', emoji: '⚠️', desc: '70-89%' },
    { value: 'below', label: 'Por debajo de objetivo', emoji: '📉', desc: '<70%' },
  ];

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Medición de Impacto y Resultados"
      className="max-w-3xl"
    >
      <div>
        <div>
          <p className="text-sm text-muted-foreground mt-2">
            Tarea: <strong>{taskTitle}</strong>
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-500 mt-2 font-medium">
            ⚠️ Completa mínimo: 2 preguntas IA + 2 campos de Medición de Impacto
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 mt-4">
          {/* SECCIÓN A: PREGUNTAS IA */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                Preguntas Específicas (min 2 de 3)
              </h3>
              {loadingAI && <RefreshCw className="w-4 h-4 animate-spin" />}
            </div>

            {loadingAI ? (
              <div className="text-center py-8 text-muted-foreground">
                Generando preguntas con IA...
              </div>
            ) : (
              <div className="space-y-4">
                {aiQuestions.map((question, index) => (
                  <div key={question.id} className="space-y-2">
                    <Label className="text-base">
                      {index + 1}. {question.question}
                    </Label>
                    {renderAIQuestion(question)}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-6" />

          {/* SECCIÓN B: MEDICIÓN DE IMPACTO */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-success" />
              Medición de Impacto (min 2 de 4 campos)
            </h3>

            {/* Campo 1: Métricas clave */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                1. Métricas clave obtenidas
              </Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {suggestedMetrics.map((metric) => (
                  <Badge
                    key={metric}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => {
                      const emptyIndex = keyMetrics.findIndex(m => !m.metric);
                      if (emptyIndex >= 0) {
                        updateMetric(emptyIndex, 'metric', metric);
                      }
                    }}
                  >
                    {metric}
                  </Badge>
                ))}
              </div>

              {keyMetrics.map((metric, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Métrica"
                    value={metric.metric}
                    onChange={(e) => updateMetric(index, 'metric', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Valor"
                    value={metric.value}
                    onChange={(e) => updateMetric(index, 'value', e.target.value)}
                    className="w-32"
                  />
                  <Input
                    placeholder="Unidad"
                    value={metric.unit}
                    onChange={(e) => updateMetric(index, 'unit', e.target.value)}
                    className="w-32"
                  />
                  {keyMetrics.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMetric(index)}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMetric}
                className="w-full"
              >
                + Añadir métrica
              </Button>
            </div>

            {/* Campo 2: Impacto en objetivos */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                2. Impacto en objetivos del área
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {impactRatingOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={impactRating === option.value ? 'default' : 'outline'}
                    onClick={() => setImpactRating(option.value as ImpactMeasurementData['impact_rating'])}
                    className={`h-auto py-4 flex flex-col gap-1 ${
                      impactRating === option.value ? 'bg-gradient-primary' : ''
                    }`}
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="text-xs opacity-70">{option.desc}</span>
                  </Button>
                ))}
              </div>
              {impactRating && (
                <Textarea
                  value={impactExplanation}
                  onChange={(e) => setImpactExplanation(e.target.value)}
                  placeholder="Explica brevemente..."
                  rows={2}
                  className="resize-none"
                />
              )}
            </div>

            {/* Campo 3: Decisiones a futuro */}
            <div className="space-y-2">
              <Label htmlFor="futureDecisions" className="text-base font-medium">
                3. Decisiones a futuro / Estrategias
              </Label>
              <Textarea
                id="futureDecisions"
                value={futureDecisions}
                onChange={(e) => setFutureDecisions(e.target.value)}
                placeholder="¿Qué harías diferente? ¿Qué estrategia seguirás?"
                rows={3}
                className="resize-none"
              />
              <div className="flex flex-wrap gap-2">
                {['#Escalar', '#Pausar', '#Optimizar', '#Cambiar-enfoque'].map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setFutureDecisions(futureDecisions + ' ' + tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Campo 4: Inversiones */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                4. Inversiones o recursos necesarios
              </Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={!!investmentsNeeded.budget}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setInvestmentsNeeded({ ...investmentsNeeded, budget: 0 });
                      } else {
                        const { budget, ...rest } = investmentsNeeded;
                        setInvestmentsNeeded(rest);
                      }
                    }}
                  />
                  <span className="text-sm">Presupuesto adicional</span>
                  {investmentsNeeded.budget !== undefined && (
                    <Input
                      type="number"
                      value={investmentsNeeded.budget}
                      onChange={(e) => setInvestmentsNeeded({ ...investmentsNeeded, budget: parseFloat(e.target.value) })}
                      placeholder="€"
                      className="w-32 ml-2"
                    />
                  )}
                </label>

                {['tools', 'time', 'training', 'staff', 'none'].map((key) => (
                  <label key={key} className="flex items-center gap-2">
                    <Checkbox
                      checked={!!investmentsNeeded[key as keyof typeof investmentsNeeded]}
                      onCheckedChange={(checked) => {
                        setInvestmentsNeeded({ ...investmentsNeeded, [key]: checked });
                      }}
                    />
                    <span className="text-sm">
                      {key === 'tools' && 'Herramientas/Software'}
                      {key === 'time' && 'Más tiempo del equipo'}
                      {key === 'training' && 'Capacitación'}
                      {key === 'staff' && 'Personal adicional'}
                      {key === 'none' && 'No se requiere inversión'}
                    </span>
                  </label>
                ))}

                <Textarea
                  value={investmentsNeeded.details || ''}
                  onChange={(e) => setInvestmentsNeeded({ ...investmentsNeeded, details: e.target.value })}
                  placeholder="Detalles adicionales..."
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-primary"
            >
              {isSubmitting ? 'Guardando...' : 'Completar Medición'}
            </Button>
          </div>
        </form>
      </div>
    </ResponsiveModal>
  );
};

export default TaskImpactMeasurementModal;
