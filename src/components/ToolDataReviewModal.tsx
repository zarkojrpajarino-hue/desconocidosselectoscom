import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Building2, Users, Target, Package, RefreshCw, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ToolType } from '@/hooks/useToolContent';

interface ToolDataReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolType: ToolType;
  toolName: string;
  onRegenerate: () => void;
}

interface StrategicQuestion {
  id: string;
  question: string;
  type: 'text' | 'radio';
  options?: string[];
  placeholder?: string;
  helpText?: string;
}

// Strategic questions per tool type
const TOOL_QUESTIONS: Record<string, StrategicQuestion[]> = {
  buyer_persona: [
    { id: 'ideal_customer_age', question: '¿Cuál es el rango de edad de tu cliente ideal?', type: 'radio', options: ['18-25', '26-35', '36-45', '46-55', '55+', 'Variado'] },
    { id: 'main_pain_point', question: '¿Cuál es el mayor dolor/problema de tu cliente?', type: 'text', placeholder: 'Ej: Falta de tiempo, presupuesto limitado...' },
    { id: 'decision_factors', question: '¿Qué factores influyen más en su decisión de compra?', type: 'text', placeholder: 'Ej: Precio, calidad, recomendaciones...' },
  ],
  customer_journey: [
    { id: 'first_touchpoint', question: '¿Dónde descubren normalmente tu producto/servicio?', type: 'text', placeholder: 'Ej: Redes sociales, buscadores, referencias...' },
    { id: 'main_friction', question: '¿Cuál es el mayor punto de fricción en el proceso de compra?', type: 'text', placeholder: 'Ej: Proceso largo, falta de información...' },
    { id: 'retention_strategy', question: '¿Qué haces actualmente para retener clientes?', type: 'text', placeholder: 'Ej: Email marketing, programa de lealtad...' },
  ],
  growth_model: [
    { id: 'best_acquisition_channel', question: '¿Cuál es tu mejor canal de adquisición actualmente?', type: 'text', placeholder: 'Ej: SEO, ads, referidos...' },
    { id: 'activation_metric', question: '¿Qué acción define que un usuario está "activado"?', type: 'text', placeholder: 'Ej: Primera compra, registro completo...' },
    { id: 'referral_program', question: '¿Tienes programa de referidos?', type: 'radio', options: ['Sí, muy activo', 'Sí, pero poco usado', 'No, pero planeamos', 'No'] },
  ],
  lead_scoring: [
    { id: 'hot_lead_criteria', question: '¿Qué características tiene tu mejor cliente?', type: 'text', placeholder: 'Ej: Empresa mediana, decisor, presupuesto definido...' },
    { id: 'disqualifying_factors', question: '¿Qué factores descalifican un lead inmediatamente?', type: 'text', placeholder: 'Ej: Bajo presupuesto, no es decisor...' },
    { id: 'conversion_time', question: '¿Cuánto tiempo promedio tarda en convertir un lead calificado?', type: 'radio', options: ['Menos de 1 semana', '1-2 semanas', '2-4 semanas', '1-3 meses', 'Más de 3 meses'] },
  ],
  sales_playbook: [
    { id: 'unique_selling_point', question: '¿Qué te hace diferente de la competencia?', type: 'text', placeholder: 'Ej: Mejor servicio, precio, calidad...' },
    { id: 'common_objection', question: '¿Cuál es la objeción más común que recibes?', type: 'text', placeholder: 'Ej: Es muy caro, no lo necesito ahora...' },
    { id: 'best_closing_technique', question: '¿Qué técnica de cierre te funciona mejor?', type: 'text', placeholder: 'Ej: Urgencia, garantía, prueba gratuita...' },
  ],
  sales_simulator: [
    { id: 'typical_scenario', question: '¿Cuál es el escenario de venta más común?', type: 'text', placeholder: 'Ej: Cliente nuevo por redes, referido de otro cliente...' },
    { id: 'hardest_scenario', question: '¿Cuál es el escenario más difícil de manejar?', type: 'text', placeholder: 'Ej: Cliente muy escéptico, competidor ofrece menos...' },
    { id: 'training_focus', question: '¿En qué área necesita más entrenamiento tu equipo?', type: 'radio', options: ['Apertura', 'Manejo de objeciones', 'Cierre', 'Seguimiento', 'Todo'] },
  ],
  communication_guide: [
    { id: 'brand_personality', question: '¿Cómo describirías la personalidad de tu marca?', type: 'radio', options: ['Profesional y formal', 'Cercana y amigable', 'Innovadora y disruptiva', 'Tradicional y confiable', 'Divertida y desenfadada'] },
    { id: 'avoid_words', question: '¿Hay palabras o frases que evitas usar?', type: 'text', placeholder: 'Ej: Barato, problema, no podemos...' },
    { id: 'competitor_differentiation', question: '¿Cómo quieres que te diferencien de competidores?', type: 'text', placeholder: 'Ej: Más premium, más accesible, más innovador...' },
  ],
};

export const ToolDataReviewModal = ({ 
  open, 
  onOpenChange, 
  toolType, 
  toolName,
  onRegenerate 
}: ToolDataReviewModalProps) => {
  const { currentOrganizationId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [organization, setOrganization] = useState<Record<string, unknown> | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (open && currentOrganizationId) {
      fetchOrganizationData();
    }
  }, [open, currentOrganizationId]);

  const fetchOrganizationData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', currentOrganizationId)
        .single();

      if (error) throw error;
      setOrganization(data);
    } catch (error) {
      console.error('Error fetching organization:', error);
      toast.error('Error al cargar datos de la organización');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      // Save answers as additional context if needed
      if (Object.keys(answers).length > 0) {
        // Could store these in organization metadata or a separate table
        console.log('Strategic answers:', answers);
      }
      
      onRegenerate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar');
    } finally {
      setRegenerating(false);
    }
  };

  const questions = TOOL_QUESTIONS[toolType] || [];

  const calculateCompleteness = () => {
    if (!organization) return 0;
    const relevantFields = ['name', 'industry', 'business_description', 'target_customers', 'value_proposition', 'products_services', 'sales_process'];
    const filledFields = relevantFields.filter(field => {
      const value = organization[field];
      return value && (typeof value === 'string' ? value.trim() !== '' : true);
    });
    return Math.round((filledFields.length / relevantFields.length) * 100);
  };

  const completeness = calculateCompleteness();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Actualizar {toolName}
          </DialogTitle>
          <DialogDescription>
            Revisa y actualiza los datos que la IA usará para regenerar tu herramienta personalizada
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Completeness indicator */}
            <Card className={completeness >= 70 ? 'border-green-500/50 bg-green-500/5' : 'border-amber-500/50 bg-amber-500/5'}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {completeness >= 70 ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    )}
                    <span className="font-medium">Completitud de datos: {completeness}%</span>
                  </div>
                  <Badge variant={completeness >= 70 ? 'default' : 'secondary'}>
                    {completeness >= 70 ? 'Datos suficientes' : 'Datos incompletos'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="overview">Datos Empresa</TabsTrigger>
                <TabsTrigger value="products">Productos</TabsTrigger>
                <TabsTrigger value="questions">
                  Preguntas
                  <HelpCircle className="w-3 h-3 ml-1" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Información General
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <div><span className="text-muted-foreground">Nombre:</span> {String(organization?.name || 'No definido')}</div>
                      <div><span className="text-muted-foreground">Industria:</span> {String(organization?.industry || 'No definido')}</div>
                      <div><span className="text-muted-foreground">Tamaño:</span> {String(organization?.company_size || 'No definido')}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Clientes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <div><span className="text-muted-foreground">Objetivo:</span> {String(organization?.target_customers || 'No definido')}</div>
                      <div><span className="text-muted-foreground">Propuesta:</span> {String(organization?.value_proposition || 'No definido').slice(0, 100)}...</div>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Proceso de Ventas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <div><span className="text-muted-foreground">Proceso:</span> {String(organization?.sales_process || 'No definido')}</div>
                      <div><span className="text-muted-foreground">Ciclo:</span> {organization?.sales_cycle_days ? `${organization.sales_cycle_days} días` : 'No definido'}</div>
                    </CardContent>
                  </Card>
                </div>

                <p className="text-xs text-muted-foreground">
                  Para actualizar estos datos, ve a <strong>Perfil → Configuración de Organización</strong>
                </p>
              </TabsContent>

              <TabsContent value="products" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Productos/Servicios
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Array.isArray(organization?.products_services) && organization.products_services.length > 0 ? (
                      <div className="space-y-2">
                        {(organization.products_services as Array<{ name: string; price?: number; category?: string }>).slice(0, 5).map((product, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                            <span className="font-medium">{product.name}</span>
                            {product.price && (
                              <Badge variant="secondary">€{product.price}</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No hay productos definidos</p>
                    )}
                  </CardContent>
                </Card>

                <p className="text-xs text-muted-foreground">
                  Para actualizar productos, ve a <strong>Perfil → Gestor de Productos</strong>
                </p>
              </TabsContent>

              <TabsContent value="questions" className="space-y-4 mt-4">
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm text-primary">
                    Responde estas preguntas para obtener una herramienta más precisa y personalizada
                  </p>
                </div>

                <div className="space-y-4">
                  {questions.map((q) => (
                    <div key={q.id} className="space-y-2">
                      <Label htmlFor={q.id}>{q.question}</Label>
                      {q.type === 'text' ? (
                        <Textarea
                          id={q.id}
                          placeholder={q.placeholder}
                          value={answers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="min-h-[80px]"
                        />
                      ) : (
                        <RadioGroup
                          value={answers[q.id] || ''}
                          onValueChange={(value) => handleAnswerChange(q.id, value)}
                          className="grid grid-cols-2 gap-2"
                        >
                          {q.options?.map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                              <RadioGroupItem value={option} id={`${q.id}-${option}`} />
                              <Label htmlFor={`${q.id}-${option}`} className="text-sm font-normal cursor-pointer">
                                {option}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                      {q.helpText && (
                        <p className="text-xs text-muted-foreground">{q.helpText}</p>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRegenerate} disabled={regenerating} className="gap-2">
                {regenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Regenerando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Regenerar con estos datos
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ToolDataReviewModal;
